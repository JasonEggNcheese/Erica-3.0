
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { useLiveAnalysis } from '../hooks/useLiveAnalysis';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useSpeechToText } from '../hooks/useSpeechToText';
import VoiceVisualizer, { VisualizerStatus } from './VoiceVisualizer';
import Transcript from './Transcript';
import VoiceSelector from './VoiceSelector';
import NewConversationButton from './NewConversationButton';
import { Speaker, DetectedObject, ConversationTurn, VoiceId } from '../types';
import { Mic, Square, Zap, CameraOff, Loader2, XCircle, WifiOff, Info } from 'lucide-react';
import { getMemory, processNewTurn } from '../memory/memoryManager';

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
        <>
            <rect x={x} y={y} width={width} height={height} stroke={color} fill={`${color}33`} strokeWidth="2" />
            <text x={x + 5} y={y > 20 ? y - 5 : y + 18} fill="white" fontSize="14" fontWeight="bold" style={{ textShadow: '1px 1px 2px black', paintOrder: 'stroke', stroke: 'black', strokeWidth: '2px' }}>
                {`${object.label} (${(object.confidence * 100).toFixed(0)}%)`}
            </text>
        </>
    );
};

const InteractiveView: React.FC = () => {
    const [status, setStatus] = useState<VisualizerStatus>('IDLE');
    const [transcript, setTranscript] = useState<ConversationTurn[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedVoice, setSelectedVoice] = useState<VoiceId>('Kore');
    
    const aiRef = useRef<GoogleGenAI | null>(null);
    const conversationHistoryRef = useRef<ConversationTurn[]>([]);
    const memoryRef = useRef<string | null>(null);

    useEffect(() => {
        conversationHistoryRef.current = transcript;
    }, [transcript]);

    const { 
        videoRef, isCameraOn, isAnalyzing, analysis, detectedObjects,
        error: analysisError, statusMessage, startCamera, stopCamera, startAnalysis, stopAnalysis
    } = useLiveAnalysis({ onGestureDetected: () => {} });

    const { speak, isSpeaking } = useTextToSpeech();
    
    // FIX: Moved captureFrame before handleAiResponse to fix "used before its declaration" error.
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

    const handleAiResponse = useCallback(async (userText: string) => {
        if (!userText) return;

        const newUserTurn: ConversationTurn = { speaker: Speaker.USER, text: userText, isFinal: true };
        setTranscript(prev => [...prev, newUserTurn]);
        setStatus('PROCESSING');
        setError(null);

        try {
            if (!aiRef.current) {
                if (!process.env.API_KEY) throw new Error("API key not found.");
                aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
            }

            const history = conversationHistoryRef.current.map(turn => `${turn.speaker}: ${turn.text}`).join('\n');
            const visualContext = `Current scene: ${analysis}\nObjects detected: ${detectedObjects.map(o => o.label).join(', ')}`;

            const memoryContext = memoryRef.current 
                ? `\n---
LONG-TERM MEMORY (Key facts about the user from past conversations):
${memoryRef.current}
---` 
                : '';

            const fullPrompt = `You are ERICA, a conversational AI. You are seeing a live video feed. Use the following visual context, conversation history, and long-term memory to provide a friendly, conversational response to the user's latest message. Keep your responses concise.${memoryContext}

            ---
            VISUAL CONTEXT:
            ${visualContext}
            ---
            CONVERSATION HISTORY (recent turns):
            ${history}
            ---
            USER: ${userText}
            ERICA:`;

            const imagePart = { inlineData: { mimeType: 'image/jpeg', data: await captureFrame() } };

            const responseStream = await aiRef.current.models.generateContentStream({
                model: 'gemini-3-pro-preview',
                contents: { parts: [{ text: fullPrompt }, imagePart] },
            });
            
            let fullResponseText = '';
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
            
             setTranscript(prev => {
                const newTranscript = [...prev];
                if (newTranscript.length > 0) {
                    newTranscript[newTranscript.length - 1].isFinal = true;
                }
                return newTranscript;
            });

            // After getting the full response, process it for memory
            if (fullResponseText.trim()) {
                try {
                    await processNewTurn(userText, fullResponseText);
                } catch (memoryError) {
                    console.error("Failed to process memory:", memoryError);
                    // Set a non-critical error to notify user without stopping the session
                    setError(memoryError instanceof Error ? memoryError.message : "Could not save conversation summary.");
                }
            }

            setStatus('SPEAKING');
            await speak(fullResponseText, selectedVoice);
            setStatus('LISTENING');

        } catch (err) {
            console.error("Error generating AI response:", err);
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(message);
            setStatus('ERROR');
        }

    }, [analysis, detectedObjects, selectedVoice, speak, captureFrame]);

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
            // Load memory at the start of the session
            memoryRef.current = getMemory();
            if (memoryRef.current) {
                console.log("Loaded long-term memory for session.");
            }
        } catch (memoryError) {
            console.error("Failed to load memory:", memoryError);
            setError(memoryError instanceof Error ? memoryError.message : "Failed to load memory.");
            setStatus('ERROR');
            return; // Stop the session from starting
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

    const getButtonContent = () => {
        if (status === 'PROCESSING' || status === 'SPEAKING') return <><Loader2 className="w-6 h-6 animate-spin" /><span>Processing...</span></>;
        if (status === 'LISTENING') return <><Square className="w-6 h-6" /><span>Stop Session</span></>;
        return <><Mic className="w-6 h-6" /><span>Start Interactive Session</span></>;
    };

    const isSessionActive = status !== 'IDLE' && status !== 'ERROR';
    const currentError = error || analysisError || sttError;

    return (
        <div className="flex flex-col h-full p-4 md:p-6 gap-6">
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                <div className="flex flex-col gap-4 overflow-hidden">
                    <h2 className="text-xl font-semibold text-purple-300 flex-shrink-0">Live Vision</h2>
                    <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-700 bg-black flex items-center justify-center flex-shrink-0">
                        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                        {!isCameraOn && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50"><CameraOff className="w-16 h-16 text-gray-500 mb-4" /><p className="text-gray-400">Camera is off</p></div>}
                        {isCameraOn && videoRect && <svg className="absolute top-0 left-0 pointer-events-none" width={videoRect.width} height={videoRect.height} viewBox={`0 0 ${videoRect.width} ${videoRect.height}`} aria-hidden="true">{detectedObjects.map((obj, index) => (<BoundingBox key={index} object={obj} videoRect={videoRect} />))}</svg>}
                    </div>
                    <div className="flex flex-col flex-grow h-full p-4 bg-gray-800/50 rounded-lg overflow-hidden">
                        <div className="flex items-center gap-3 mb-2 text-sm text-gray-400 flex-shrink-0">
                            {isAnalyzing && <Loader2 className="w-5 h-5 animate-spin text-purple-400" />}
                            <p>{isSessionActive ? statusMessage : 'Vision analysis is off.'}</p>
                        </div>
                        {analysisError && <div role="alert" className="flex items-center space-x-3 p-2 mb-2 bg-red-900/50 text-red-300 rounded-lg"><XCircle className="w-5 h-5 flex-shrink-0" /><p className="text-sm">{analysisError}</p></div>}
                        <div className="flex-grow overflow-y-auto prose prose-invert max-w-none scrollbar-thin">
                            {analysis && <p className="whitespace-pre-wrap mb-4 text-gray-300">{analysis}</p>}
                            {detectedObjects.length > 0 && <div><h4 className="font-semibold text-gray-300 mb-2 border-t border-gray-700 pt-2">Objects Detected:</h4><ul className="list-disc pl-5 space-y-1 text-sm text-gray-400">{detectedObjects.map((obj, i) => (<li key={i}>{obj.label} ({(obj.confidence * 100).toFixed(0)}%)</li>))}</ul></div>}
                            {!isAnalyzing && !analysis && detectedObjects.length === 0 && <p className="text-gray-500">Analysis results will appear here.</p>}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 overflow-hidden">
                    <div className="flex items-center justify-between flex-shrink-0">
                        <h2 className="text-xl font-semibold text-purple-300">Conversation</h2>
                        <div className="flex items-center space-x-4">
                            <NewConversationButton onClick={() => setTranscript([])} disabled={isSessionActive} />
                            <VoiceSelector selectedVoice={selectedVoice} onVoiceChange={setSelectedVoice} disabled={isSessionActive} />
                        </div>
                    </div>
                    <div className="flex-grow w-full min-h-0 overflow-y-auto p-2 scrollbar-thin"><Transcript transcript={transcript} /></div>
                    <div className="flex-shrink-0 w-full flex flex-col items-center justify-center space-y-4 pt-4"><VoiceVisualizer status={isSpeaking ? 'SPEAKING' : status} isSpeakingError={!!currentError} /></div>
                </div>
            </div>
            
            <div className="flex-shrink-0 flex flex-col items-center justify-center space-y-3">
                 {currentError && <div role="alert" className="flex items-center space-x-2 bg-red-500/20 text-red-300 p-3 rounded-lg max-w-md"><WifiOff className="h-5 w-5 flex-shrink-0" /><p className="text-sm">{currentError}</p></div>}
                 {!currentError && !isSessionActive && <div className="flex items-center space-x-2 bg-blue-500/10 text-blue-300 p-3 rounded-lg max-w-xl"><Info className="h-5 w-5 flex-shrink-0" /><p className="text-sm">Press the button to start a voice conversation. ERICA will see and hear you.</p></div>}
                <button
                    onClick={isSessionActive ? handleStop : handleStart}
                    disabled={status === 'PROCESSING'}
                    className={`flex items-center justify-center space-x-3 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-wait ${isSessionActive ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/50" : "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500/50"}`}>
                    {getButtonContent()}
                </button>
            </div>
        </div>
    );
};

export default InteractiveView;
