
import React, { useState, useEffect, useRef } from 'react';
import { useObjectDetection, DetectedObject } from '../hooks/useObjectDetection';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import VoiceSelector from './VoiceSelector';
import { Camera, CameraOff, ScanLine, Square, XCircle, Loader2, Volume2, VolumeX } from 'lucide-react';

const CONFIDENCE_THRESHOLD = 0.7;

const BoundingBox: React.FC<{ object: DetectedObject, videoRect: DOMRect | null }> = ({ object, videoRect }) => {
    if (!videoRect) return null;

    const { x1, y1, x2, y2 } = object.box;
    const x = x1 * videoRect.width;
    const y = y1 * videoRect.height;
    const width = (x2 - x1) * videoRect.width;
    const height = (y2 - y1) * videoRect.height;
    
    // Simple color hashing based on label
    const color = `#${(parseInt(
        parseInt(object.label, 36).toExponential().slice(2,-5),
        10
    ) & 0xFFFFFF).toString(16).padStart(6, '0')}`;

    return (
        <>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                stroke={color}
                fill={`${color}33`} // 20% opacity
                strokeWidth="2"
            />
            <text
                x={x + 5}
                y={y + 18}
                fill="white"
                fontSize="14"
                fontWeight="bold"
                style={{ textShadow: '1px 1px 2px black' }}
            >
                {`${object.label} (${(object.confidence * 100).toFixed(0)}%)`}
            </text>
        </>
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
    const lastNarratedObjectsRef = useRef<string[]>([]);
    
    const [videoRect, setVideoRect] = useState<DOMRect | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Create narration sentence from detected objects
    useEffect(() => {
        if (!isNarrationEnabled || !isDetecting || isSpeaking || detectedObjects.length === 0) {
            return;
        }

        const confidentObjects = detectedObjects
            .filter(obj => obj.confidence > CONFIDENCE_THRESHOLD)
            .map(obj => obj.label.toLowerCase());
        
        if (confidentObjects.length === 0) return;

        // Check if the scene has changed to avoid repetitive narration
        const currentLabels = [...confidentObjects].sort().join(',');
        const lastLabels = [...lastNarratedObjectsRef.current].sort().join(',');

        if (currentLabels === lastLabels) {
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
        lastNarratedObjectsRef.current = confidentObjects;

    }, [detectedObjects, isNarrationEnabled, isDetecting, isSpeaking, speak]);
    
    // Stop narration if detection stops
    useEffect(() => {
        if (!isDetecting) {
            setIsNarrationEnabled(false);
            lastNarratedObjectsRef.current = [];
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
        <div className="p-4 md:p-8 h-full flex flex-col gap-6 text-white overflow-hidden">
            <div className="flex-grow flex flex-col items-center justify-center gap-6">
                <div 
                    ref={containerRef}
                    className="relative w-full max-w-4xl aspect-video rounded-lg overflow-hidden border-2 border-gray-700 bg-black flex items-center justify-center"
                >
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                    {!isCameraOn && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                            <CameraOff className="w-16 h-16 text-gray-500 mb-4" />
                            <p className="text-gray-400">Camera is off</p>
                        </div>
                    )}
                    {isCameraOn && videoRect && containerRef.current && (
                        <svg 
                            className="absolute top-0 left-0" 
                            width={videoRect.width} 
                            height={videoRect.height}
                            viewBox={`0 0 ${videoRect.width} ${videoRect.height}`}
                        >
                            {detectedObjects
                                .filter(obj => obj.confidence > CONFIDENCE_THRESHOLD)
                                .map((obj, index) => (
                                    <BoundingBox key={index} object={obj} videoRect={videoRect} />
                            ))}
                        </svg>
                    )}
                </div>

                <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
                    <div className="h-8 flex items-center gap-3 text-sm text-gray-400">
                        {isDetecting && <Loader2 className="w-5 h-5 animate-spin text-purple-400" />}
                        <p>{statusMessage}</p>
                    </div>

                     {error && (
                        <div className="flex items-center space-x-3 p-4 mb-4 bg-red-900/50 text-red-300 rounded-lg">
                            <XCircle className="w-6 h-6 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <button
                            onClick={isCameraOn ? stopCamera : startCamera}
                            className={`flex items-center justify-center space-x-3 w-full px-6 py-3 text-lg font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 ${
                                isCameraOn 
                                ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/50" 
                                : "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500/50"
                            }`}
                        >
                            {isCameraOn ? <CameraOff className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
                            <span>{isCameraOn ? 'Stop Camera' : 'Start Camera'}</span>
                        </button>

                        <button
                            onClick={isDetecting ? stopDetection : startDetection}
                            disabled={!isCameraOn}
                            className={`flex items-center justify-center space-x-3 w-full px-6 py-3 text-lg font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 ${
                                isDetecting
                                ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/50"
                                : "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500/50"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isDetecting ? <Square className="w-6 h-6" /> : <ScanLine className="w-6 h-6" />}
                            <span>{isDetecting ? 'Stop Detection' : 'Start Detection'}</span>
                        </button>
                    </div>
                     <div className="flex items-center gap-4 w-full">
                        <button
                            onClick={() => setIsNarrationEnabled(prev => !prev)}
                            disabled={!isDetecting || isSpeaking}
                            className={`flex items-center justify-center space-x-3 flex-grow px-6 py-3 text-lg font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 ${
                                isNarrationEnabled
                                ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500/50"
                                : "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500/50"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isNarrationEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                            <span>{isNarrationEnabled ? 'Narration On' : 'Narration Off'}</span>
                        </button>
                        <VoiceSelector 
                            selectedVoice={selectedVoice}
                            onVoiceChange={setSelectedVoice}
                            disabled={!isDetecting || isSpeaking}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisionLens;
