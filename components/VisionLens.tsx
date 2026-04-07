
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useObjectDetection, DetectedObject } from '../hooks/useObjectDetection';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import VoiceSelector from './VoiceSelector';
import { Camera, CameraOff, ScanLine, Square, XCircle, Loader2, Volume2, VolumeX, Activity, Info } from 'lucide-react';

const CONFIDENCE_THRESHOLD = 0.7;

const BoundingBox: React.FC<{ object: DetectedObject, videoRect: DOMRect | null }> = ({ object, videoRect }) => {
    if (!videoRect) return null;

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


const VisionLens: React.FC = () => {
    const { 
        videoRef, 
        isCameraOn, 
        isDetecting, 
        detectedObjects, 
        error, 
        statusMessage,
        startCamera, 
        stopCamera, 
        startDetection,
        stopDetection
    } = useObjectDetection();

    const { speak, isSpeaking, selectedVoice, setSelectedVoice } = useTextToSpeech();
    const [isNarrationEnabled, setIsNarrationEnabled] = useState(false);
    const lastNarratedObjectsRef = useRef<string>('');
    const [detectedTextForSR, setDetectedTextForSR] = useState('');
    
    const [videoRect, setVideoRect] = useState<DOMRect | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const confidentObjects = detectedObjects
            .filter(obj => obj.confidence > CONFIDENCE_THRESHOLD)
            .map(obj => obj.label.toLowerCase());

        const currentLabelsSorted = [...confidentObjects].sort().join(',');

        if (currentLabelsSorted === lastNarratedObjectsRef.current) {
            return;
        }
        lastNarratedObjectsRef.current = currentLabelsSorted;
        
        if (confidentObjects.length > 0) {
            setDetectedTextForSR(`Detected: ${confidentObjects.join(', ')}.`);
        } else {
            setDetectedTextForSR('');
        }

        if (!isNarrationEnabled || !isDetecting || isSpeaking || confidentObjects.length === 0) {
            return;
        }

        let sentence = '';
        if (confidentObjects.length === 1) {
            sentence = `I see a ${confidentObjects[0]}.`;
        } else if (confidentObjects.length === 2) {
            sentence = `I see a ${confidentObjects[0]} and a ${confidentObjects[1]}.`;
        } else {
            const lastObject = confidentObjects.pop();
            sentence = `I see ${confidentObjects.join(', ')}, and a ${lastObject}.`;
        }
        
        speak(sentence);

    }, [detectedObjects, isNarrationEnabled, isDetecting, isSpeaking, speak]);
    
    useEffect(() => {
        if (!isDetecting) {
            setIsNarrationEnabled(false);
            lastNarratedObjectsRef.current = '';
        }
    }, [isDetecting]);

    useEffect(() => {
        const updateRect = () => {
            if (videoRef.current) {
                setVideoRect(videoRef.current.getBoundingClientRect());
            }
        };
        updateRect();
        window.addEventListener('resize', updateRect);
        return () => window.removeEventListener('resize', updateRect);
    }, [isCameraOn]);

    return (
        <div className="h-full flex flex-col max-w-7xl mx-auto w-full p-8 gap-10 overflow-hidden">
            <div aria-live="polite" className="sr-only">{detectedTextForSR}</div>
            
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/[0.03] rounded-xl border border-white/5">
                        <ScanLine className="w-5 h-5 text-purple-400" />
                    </div>
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-mono font-bold">Object Detection Engine</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-grow min-h-0">
                {/* Left Column: Vision Feed */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    <div ref={containerRef} className="relative aspect-video rounded-[2rem] overflow-hidden glass-panel bg-black/40">
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
                                    <p className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-mono">Vision Offline</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {isCameraOn && videoRect && (
                            <svg className="absolute top-0 left-0 pointer-events-none w-full h-full" viewBox={`0 0 ${videoRect.width} ${videoRect.height}`}>
                                {detectedObjects
                                    .filter(obj => obj.confidence > CONFIDENCE_THRESHOLD)
                                    .map((obj, index) => {
                                        const objKey = `lens-bbox-${obj.label}-${index}-${obj.box.x1.toFixed(2)}`;
                                        return <BoundingBox key={objKey} object={obj} videoRect={videoRect} />;
                                    })}
                            </svg>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <button
                            onClick={isCameraOn ? stopCamera : startCamera}
                            className={`
                                flex items-center justify-center gap-4 px-8 py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500
                                ${isCameraOn 
                                    ? 'bg-white/[0.03] border border-white/10 text-white/40 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400' 
                                    : 'bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:scale-[1.02]'
                                }
                            `}
                        >
                            {isCameraOn ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                            <span>{isCameraOn ? 'Terminate' : 'Initialize'}</span>
                        </button>

                        <button
                            onClick={isDetecting ? stopDetection : startDetection}
                            disabled={!isCameraOn}
                            className={`
                                flex items-center justify-center gap-4 px-8 py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500
                                ${isDetecting
                                    ? 'bg-purple-600/10 border border-purple-500/30 text-purple-400 hover:bg-purple-600/20'
                                    : 'bg-purple-600 text-white shadow-[0_10px_30px_rgba(168,85,247,0.2)] hover:bg-purple-500 hover:scale-[1.02] disabled:opacity-20 disabled:grayscale'
                                }
                            `}
                        >
                            {isDetecting ? <Square className="w-4 h-4" /> : <ScanLine className="w-4 h-4" />}
                            <span>{isDetecting ? 'Halt Engine' : 'Engage Engine'}</span>
                        </button>
                    </div>
                </div>

                {/* Right Column: Controls & Status */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                    <div className="glass-panel rounded-[2rem] p-10 flex flex-col gap-10 bg-white/[0.01]">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-mono">Neural Status</span>
                                {isDetecting && <Activity className="w-3 h-3 text-purple-500 animate-pulse" />}
                            </div>
                            <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest italic">{statusMessage}</p>
                        </div>

                        <div className="flex flex-col gap-6">
                            <span className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-mono">Narration</span>
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={() => setIsNarrationEnabled(prev => !prev)}
                                    disabled={!isDetecting || isSpeaking}
                                    className={`
                                        flex items-center justify-between px-6 py-5 rounded-2xl transition-all duration-500
                                        ${isNarrationEnabled 
                                            ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400' 
                                            : 'bg-white/[0.03] border border-white/10 text-white/20 hover:text-white/40'
                                        }
                                        disabled:opacity-20
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        {isNarrationEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Voice Feedback</span>
                                    </div>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isNarrationEnabled ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse' : 'bg-white/5'}`} />
                                </button>
                                
                                <VoiceSelector 
                                    selectedVoice={selectedVoice}
                                    onVoiceChange={setSelectedVoice}
                                    disabled={!isDetecting || isSpeaking}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 pt-10 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <Info className="w-3 h-3 text-white/10" />
                                <span className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-mono">Identified Entities</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {detectedObjects.length > 0 ? (
                                    detectedObjects
                                        .filter(obj => obj.confidence > CONFIDENCE_THRESHOLD)
                                        .map((obj, i) => (
                                            <div key={i} className="px-4 py-2 bg-white/[0.03] border border-white/5 rounded-full text-[9px] text-white/40 font-mono uppercase tracking-[0.2em]">
                                                {obj.label}
                                            </div>
                                        ))
                                ) : (
                                    <span className="text-[9px] text-white/10 uppercase tracking-widest font-mono italic">No entities detected</span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs"
                        >
                            <XCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VisionLens;
