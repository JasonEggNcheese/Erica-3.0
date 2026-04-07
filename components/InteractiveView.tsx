
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { useLiveAnalysis } from '../hooks/useLiveAnalysis';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useSpeechToText } from '../hooks/useSpeechToText';
import VoiceVisualizer, { VisualizerStatus } from './VoiceVisualizer';
import Transcript from './Transcript';
import VoiceSelector from './VoiceSelector';
import ModelSelector from './ModelSelector';
import NewConversationButton from './NewConversationButton';
import { Speaker, DetectedObject, ConversationTurn, VoiceId, ModelId, availableModels } from '../types';
import { Mic, Square, Zap, CameraOff, Loader2, XCircle, WifiOff, Info, Activity, Send, Paperclip, Globe, Search, Monitor, Video } from 'lucide-react';
import { getMemory, processNewTurn } from '../memory/memoryManager';
import { logError, getFriendlyErrorMessage, ErrorSeverity } from '../utils/errorLogger';

const BoundingBox: React.FC<{ object: DetectedObject, videoRect: DOMRect | null }> = ({ object, videoRect }) => {
    if (!videoRect || object.confidence < 0.6) return null;

    const { x1, y1, x2, y2 } = object.box;
    const x = x1 * videoRect.width;
    const y = y1 * videoRect.height;
    const width = (x2 - x1) * videoRect.width;
    const height = (y2 - y1) * videoRect.height;
    
    let hash = 0;
    for (let i = 0; i < object.label.length; i++) {
        hash = object.label.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 90%, 70%)`;

    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <rect x={x} y={y} width={width} height={height} stroke={color} fill={`${color}11`} strokeWidth="1" className="backdrop-blur-[1px]" />
            <rect x={x} y={y - 20} width={object.label.length * 8 + 40} height={20} fill={color} />
            <text x={x + 5} y={y - 5} fill="black" fontSize="10" fontWeight="bold" className="uppercase tracking-tighter">
                {`${object.label} ${(object.confidence * 100).toFixed(0)}%`}
            </text>
        </motion.g>
    );
};

interface InteractiveViewProps {
    initialMessage?: string | null;
}

const InteractiveView: React.FC<InteractiveViewProps> = ({ initialMessage }) => {
    const [status, setStatus] = useState<VisualizerStatus>('IDLE');
    const [transcript, setTranscript] = useState<ConversationTurn[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedVoice, setSelectedVoice] = useState<VoiceId>('Kore');
    const [selectedModel, setSelectedModel] = useState<ModelId>('gemini-1.5-flash');
    const [inputText, setInputText] = useState('');
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [attachedFile, setAttachedFile] = useState<{ data: string, mimeType: string } | null>(null);
    
    const aiRef = useRef<GoogleGenAI | null>(null);
    const conversationHistoryRef = useRef<ConversationTurn[]>([]);
    const memoryRef = useRef<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialMessage) {
            setTranscript(prev => [...prev, { speaker: Speaker.ERICA, text: initialMessage, isFinal: true }]);
        }
    }, [initialMessage]);

    useEffect(() => {
        conversationHistoryRef.current = transcript;
    }, [transcript]);

    const { 
        videoRef, isCameraOn, isAnalyzing, analysis, detectedObjects,
        error: analysisError, statusMessage, startCamera, stopCamera, startAnalysis, stopAnalysis, setIsCameraOn
    } = useLiveAnalysis({ onGestureDetected: () => {} });

    const { speak, isSpeaking } = useTextToSpeech();
    
    const captureFrame = useCallback(async (): Promise<string> => {
        if (!videoRef.current || videoRef.current.readyState < 2) return '';
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    }, []);

    const handleAiResponse = useCallback(async (userText: string, fileData?: { data: string, mimeType: string }) => {
        if (!userText && !fileData) return;

        const newUserTurn: ConversationTurn = { speaker: Speaker.USER, text: userText || (fileData ? "[Attached File]" : ""), isFinal: true };
        setTranscript(prev => [...prev, newUserTurn]);
        setStatus('PROCESSING');
        setError(null);
        setInputText('');
        setAttachedFile(null);

        try {
            if (!aiRef.current) {
                if (!process.env.GEMINI_API_KEY) throw new Error("API key not found.");
                aiRef.current = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            }

            const history = conversationHistoryRef.current.map(turn => `${turn.speaker}: ${turn.text}`).join('\n');
            const visualContext = isCameraOn ? `Current scene: ${analysis}\nObjects detected: ${detectedObjects.map(o => o.label).join(', ')}` : "Camera is off.";

            const memoryContext = memoryRef.current 
                ? `\n---\nLONG-TERM MEMORY:\n${memoryRef.current}\n---` 
                : '';

            const systemInstruction = `You are ERICA, an advanced multimodal AI assistant. You have access to a live video feed, web search, and file analysis tools. 
            Provide friendly, concise, and helpful responses. Ground your answers in real-time information when necessary.
            ${memoryContext}
            
            VISUAL CONTEXT:
            ${visualContext}`;

            const currentModel = availableModels.find(m => m.id === selectedModel);
            let fullResponseText = '';

            if (currentModel?.provider === 'google') {
                const parts: any[] = [{ text: userText || "Analyze this." }];
                
                // Add live frame if camera is on
                if (isCameraOn) {
                    const frameData = await captureFrame();
                    if (frameData) {
                        parts.push({ inlineData: { mimeType: 'image/jpeg', data: frameData } });
                    }
                }

                // Add attached file if present
                if (fileData) {
                    parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.data } });
                }

                const responseStream = await aiRef.current.models.generateContentStream({
                    model: selectedModel,
                    contents: { parts },
                    config: {
                        systemInstruction,
                        tools: [{ googleSearch: {} }]
                    }
                });
                
                let ericaTurnAdded = false;

                for await (const chunk of responseStream) {
                    const response = chunk as GenerateContentResponse;
                    const chunkText = response.text;
                    if (chunkText) {
                        fullResponseText += chunkText;
                        if (!ericaTurnAdded) {
                            setTranscript(prev => [...prev, { speaker: Speaker.ERICA, text: fullResponseText, isFinal: false }]);
                            ericaTurnAdded = true;
                        } else {
                            setTranscript(prev => {
                                const newTranscript = [...prev];
                                newTranscript[newTranscript.length - 1].text = fullResponseText;
                                return newTranscript;
                            });
                        }
                    }
                }
            } else {
                // Use backend API for other providers
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: selectedModel,
                        provider: currentModel?.provider,
                        systemInstruction,
                        messages: conversationHistoryRef.current.map(turn => ({
                            role: turn.speaker === Speaker.ERICA ? 'model' : 'user',
                            parts: [{ text: turn.text }]
                        })).concat([{ role: 'user', parts: [{ text: userText || "Analyze this." }] }])
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to get response from AI');
                }

                const data = await response.json();
                fullResponseText = data.text;
                setTranscript(prev => [...prev, { speaker: Speaker.ERICA, text: fullResponseText, isFinal: true }]);
            }
            
             setTranscript(prev => {
                const newTranscript = [...prev];
                if (newTranscript.length > 0) {
                    newTranscript[newTranscript.length - 1].isFinal = true;
                }
                return newTranscript;
            });

            if (fullResponseText.trim()) {
                try {
                    await processNewTurn(userText || "[File Analysis]", fullResponseText);
                } catch (memoryError) {
                    logError(memoryError, ErrorSeverity.MEDIUM, { component: 'InteractiveView', action: 'processNewTurn' });
                }
            }

            setStatus('SPEAKING');
            await speak(fullResponseText, selectedVoice);
            setStatus('LISTENING');

        } catch (err) {
            logError(err, ErrorSeverity.HIGH, { component: 'InteractiveView', action: 'handleAiResponse', userTextLength: userText?.length });
            setError(getFriendlyErrorMessage(err));
            setStatus('ERROR');
        }

    }, [analysis, detectedObjects, selectedVoice, speak, captureFrame, isCameraOn]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = (event.target?.result as string).split(',')[1];
            setAttachedFile({ data: base64, mimeType: file.type });
        };
        reader.readAsDataURL(file);
    };

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            stopCamera();
            setIsScreenSharing(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    setIsCameraOn(true);
                    setIsScreenSharing(true);
                }
            } catch (err) {
                setError("Screen sharing failed.");
            }
        }
    };

    const { isListening, error: sttError, startListening, stopListening } = useSpeechToText({ 
      onFinalTranscript: handleAiResponse,
      onInterimTranscript: (text) => {
         setTranscript(prev => {
            const last = prev[prev.length-1];
            if (last && last.speaker === Speaker.USER && !last.isFinal) {
                const newTranscript = [...prev];
                newTranscript[newTranscript.length - 1] = { ...last, text };
                return newTranscript;
            }
            return [...prev, { speaker: Speaker.USER, text, isFinal: false }];
         });
      }
    });

    const [videoRect, setVideoRect] = useState<DOMRect | null>(null);
    const [analysisPrompt] = useState('Describe what you see and identify any gestures or objects.');

    useEffect(() => {
        const updateRect = () => videoRef.current && setVideoRect(videoRef.current.getBoundingClientRect());
        updateRect();
        window.addEventListener('resize', updateRect);
        return () => window.removeEventListener('resize', updateRect);
    }, [isCameraOn]);

    const handleStart = async () => {
        setError(null);
        try {
            memoryRef.current = getMemory();
        } catch (memoryError) {
            logError(memoryError, ErrorSeverity.HIGH, { component: 'InteractiveView', action: 'handleStart' });
            setError(getFriendlyErrorMessage(memoryError));
            setStatus('ERROR');
            return;
        }
        await startCamera();
        setStatus('LISTENING');
    };

    const handleStop = () => {
        stopCamera();
        setStatus('IDLE');
    };
    
    useEffect(() => {
        if (status === 'LISTENING' && !isListening) {
            startListening();
        } else if (status !== 'LISTENING' && isListening) {
            stopListening();
        }
    }, [status, isListening, startListening, stopListening]);
    
     useEffect(() => {
        if (isCameraOn && (status === 'LISTENING' || status === 'PROCESSING')) {
            if (!isAnalyzing) startAnalysis(analysisPrompt);
        } else {
            if (isAnalyzing) stopAnalysis();
        }
    }, [isCameraOn, status, isAnalyzing, startAnalysis, stopAnalysis, analysisPrompt]);

    const isSessionActive = status !== 'IDLE' && status !== 'ERROR';
    const currentError = error || analysisError || sttError;

    return (
        <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden pb-12 gap-8 lg:gap-0">
            {/* Left Panel: Vision & Analysis */}
            <div className="w-full lg:w-1/2 flex flex-col lg:pr-12 gap-6 lg:gap-10 lg:border-r border-white/5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${isCameraOn ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-white/10'}`} />
                        <h2 className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-mono font-bold">Vision Stream</h2>
                    </div>
                    {isAnalyzing && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full text-[9px] text-white/40 font-mono uppercase tracking-[0.2em]">
                            <Activity className="w-3 h-3 text-purple-500 animate-pulse" />
                            Live Analysis
                        </div>
                    )}
                </div>

                <div className="relative aspect-video rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden glass-panel group bg-black/40">
                    <video ref={videoRef} className="w-full h-full object-cover grayscale-[0.3] contrast-[1.1] brightness-[0.9]" muted playsInline />
                    <AnimatePresence>
                        {!isCameraOn && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
                            >
                                <CameraOff className="w-10 h-10 text-white/5 mb-4" />
                                <p className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-mono">Stream Offline</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {isCameraOn && videoRect && (
                        <svg className="absolute top-0 left-0 pointer-events-none w-full h-full" viewBox={`0 0 ${videoRect.width} ${videoRect.height}`}>
                            {detectedObjects.map((obj, index) => {
                                const objKey = `bbox-${obj.label}-${index}-${obj.box.x1.toFixed(2)}`;
                                return <BoundingBox key={objKey} object={obj} videoRect={videoRect} />;
                            })}
                        </svg>
                    )}
                </div>

                <div className="flex-grow flex flex-col gap-4 lg:gap-6 overflow-hidden min-h-[200px]">
                    <div className="flex items-center gap-2">
                        <Info className="w-3 h-3 text-white/10" />
                        <span className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-mono">Neural Interpretation</span>
                    </div>
                    <div className="flex-grow glass-panel rounded-[1.5rem] lg:rounded-[2rem] p-6 lg:p-10 overflow-y-auto scrollbar-thin bg-white/[0.01]">
                        <AnimatePresence mode="wait">
                            {analysis ? (
                                <motion.div 
                                    key={analysis}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="prose prose-invert prose-p:text-white/60 prose-p:font-light prose-p:leading-relaxed prose-headings:text-white max-w-none"
                                >
                                    <div className="markdown-body">
                                        <Markdown>{analysis}</Markdown>
                                    </div>
                                </motion.div>
                            ) : (
                                <p className="text-[10px] text-white/10 uppercase tracking-widest font-mono italic">Awaiting visual data...</p>
                            )}
                        </AnimatePresence>
                        
                        {detectedObjects.length > 0 && (
                            <div className="mt-6 lg:mt-10 pt-6 lg:pt-8 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                                {detectedObjects.map((obj, i) => {
                                    const labelKey = `label-${obj.label}-${i}`;
                                    return (
                                        <div key={labelKey} className="flex items-center justify-between p-2 lg:p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                            <span className="text-[8px] lg:text-[9px] uppercase tracking-[0.2em] text-white/40 font-mono truncate mr-2">{obj.label}</span>
                                            <span className="text-[9px] lg:text-[10px] text-purple-400/80 font-mono">{(obj.confidence * 100).toFixed(0)}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel: Conversation & Controls */}
            <div className="w-full lg:w-1/2 flex flex-col lg:pl-12 gap-6 lg:gap-10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${isSessionActive ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse' : 'bg-white/10'}`} />
                        <h2 className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-mono font-bold">Neural Link</h2>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-4">
                        <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full">
                            <div className={`w-1 h-1 rounded-full ${isCameraOn ? 'bg-emerald-500 animate-pulse' : 'bg-white/10'}`} />
                            <span className="text-[8px] uppercase tracking-widest text-white/30 font-mono hidden sm:inline">Vision</span>
                        </div>
                        <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full">
                            <div className={`w-1 h-1 rounded-full ${status === 'PROCESSING' ? 'bg-blue-500 animate-pulse' : 'bg-white/10'}`} />
                            <span className="text-[8px] uppercase tracking-widest text-white/30 font-mono hidden sm:inline">Search</span>
                        </div>
                        <button 
                            onClick={toggleScreenShare}
                            className={`p-2 rounded-xl border transition-all ${isScreenSharing ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-white/[0.03] border-white/10 text-white/20 hover:text-white/40'}`}
                            title="Share Screen"
                        >
                            <Monitor className="w-4 h-4" />
                        </button>
                        <NewConversationButton onClick={() => setTranscript([])} disabled={isSessionActive} />
                        <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} disabled={isSessionActive} />
                        <VoiceSelector selectedVoice={selectedVoice} onVoiceChange={setSelectedVoice} disabled={isSessionActive} />
                    </div>
                </div>

                <div className="flex-grow flex flex-col min-h-[300px] glass-panel rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden bg-white/[0.01]">
                    <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-10 scrollbar-thin">
                        <Transcript transcript={transcript} />
                    </div>
                    
                    <div className="flex-shrink-0 p-4 sm:p-6 lg:p-10 border-t border-white/5 bg-white/[0.01]">
                        <div className="flex flex-col items-center gap-6 lg:gap-10">
                            <button 
                                onClick={isSessionActive ? handleStop : handleStart}
                                disabled={status === 'PROCESSING'}
                                className="relative group outline-none transition-transform hover:scale-105 active:scale-95"
                            >
                                <VoiceVisualizer status={isSpeaking ? 'SPEAKING' : status} isSpeakingError={!!currentError} />
                                <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/5 transition-colors" />
                                <AnimatePresence>
                                    {status === 'IDLE' && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute -bottom-12 sm:-bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full shadow-xl"
                                        >
                                            <Zap className="w-3 h-3 fill-current" />
                                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Initialize Link</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                            
                            <div className="w-full flex flex-col items-center gap-4 lg:gap-6">
                                {currentError && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-3 px-4 lg:px-5 py-2 lg:py-2.5 bg-red-500/5 border border-red-500/10 rounded-full text-red-400/80 text-[8px] lg:text-[9px] uppercase tracking-[0.2em] font-mono text-center"
                                    >
                                        <WifiOff className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                                        {currentError}
                                    </motion.div>
                                )}
                                
                                <div className="w-full flex flex-col gap-4">
                                    <div className="flex items-center gap-2 sm:gap-4">
                                        <div className="flex-grow relative flex items-center">
                                            <input 
                                                type="text"
                                                value={inputText}
                                                onChange={(e) => setInputText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAiResponse(inputText)}
                                                placeholder="Ask ERICA..."
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-full py-3 sm:py-4 lg:py-6 pl-6 pr-24 sm:pl-8 sm:pr-28 lg:pl-10 lg:pr-32 text-xs sm:text-sm font-light focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder:text-white/10"
                                            />
                                            <div className="absolute right-2 sm:right-4 flex items-center gap-1 sm:gap-2">
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef} 
                                                    onChange={handleFileUpload} 
                                                    className="hidden" 
                                                    accept="image/*,video/*"
                                                />
                                                <button 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={`p-1.5 sm:p-2 rounded-full transition-all ${attachedFile ? 'text-purple-400 bg-purple-500/10' : 'text-white/20 hover:text-white/40'}`}
                                                >
                                                    <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleAiResponse(inputText, attachedFile || undefined)}
                                                    disabled={!inputText.trim() && !attachedFile}
                                                    className="p-1.5 sm:p-2 bg-purple-500 text-white rounded-full hover:scale-110 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
                                                >
                                                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {attachedFile && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl self-center sm:self-start">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                                            <span className="text-[8px] sm:text-[10px] text-purple-300 uppercase tracking-widest font-mono">File Attached</span>
                                            <button onClick={() => setAttachedFile(null)} className="ml-1 text-white/20 hover:text-white">✕</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InteractiveView;
