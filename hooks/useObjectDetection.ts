
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

const ANALYSIS_INTERVAL = 2000; // milliseconds

export interface DetectedObject {
    label: string;
    confidence: number;
    box: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    };
}

export const useObjectDetection = () => {
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState('Camera is off.');

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const analysisIntervalRef = useRef<number | null>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isProcessingFrame = useRef(false);

    const startCamera = useCallback(async () => {
        if (!videoRef.current) return;
        setError(null);
        setStatusMessage('Starting camera...');
        try {
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 1280, height: 720, facingMode: 'environment' } 
            });
            videoRef.current.srcObject = mediaStreamRef.current;
            await videoRef.current.play();
            setIsCameraOn(true);
            setStatusMessage('Camera is on. Press Start to detect objects.');
        } catch (err) {
            console.error("Camera access error:", err);
            let userMessage = "Failed to access camera.";
             if (err instanceof DOMException) {
                if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    userMessage = 'No camera found. Please make sure it is connected and working.';
                } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    userMessage = 'Camera access has been denied. Please enable it in your browser settings.';
                }
            }
            setError(userMessage);
            setStatusMessage('Camera access failed.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if(isDetecting) stopDetection();
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
        setDetectedObjects([]);
        setStatusMessage('Camera is off.');
    }, [isDetecting]);
    
    const detectFrame = useCallback(async () => {
        if (isProcessingFrame.current || !videoRef.current || videoRef.current.readyState < 2) return;

        isProcessingFrame.current = true;
        
        if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        
        const context = canvas.getContext('2d');
        if (!context) {
            isProcessingFrame.current = false;
            return;
        }
        
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const frameData = dataUrl.split(',')[1];
        
        try {
            if (!aiRef.current) {
                if (!process.env.API_KEY) throw new Error("API key not found.");
                aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
            }
            
            const imagePart = { inlineData: { mimeType: 'image/jpeg', data: frameData } };
            
            const objectDetectionSchema = {
                type: Type.OBJECT,
                properties: {
                    objects: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                label: { type: Type.STRING },
                                confidence: { type: Type.NUMBER },
                                box: {
                                    type: Type.OBJECT,
                                    properties: {
                                        x1: { type: Type.NUMBER },
                                        y1: { type: Type.NUMBER },
                                        x2: { type: Type.NUMBER },
                                        y2: { type: Type.NUMBER },
                                    },
                                    required: ['x1', 'y1', 'x2', 'y2']
                                }
                            },
                            required: ['label', 'confidence', 'box']
                        }
                    }
                },
                required: ['objects']
            };

            const response = await aiRef.current.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: { parts: [
                    { text: 'Analyze the image to detect and locate objects. For each object, provide its label, a confidence score from 0 to 1, and its normalized bounding box coordinates (x1, y1, x2, y2).' },
                    imagePart
                ]},
                config: {
                    responseMimeType: "application/json",
                    responseSchema: objectDetectionSchema
                }
            });

            const responseJson = JSON.parse(response.text ?? '{}');
            setDetectedObjects(responseJson.objects || []);

        } catch (err) {
            console.error("Frame detection error:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during detection.");
            stopDetection();
        } finally {
            isProcessingFrame.current = false;
        }
    }, []);

    const startDetection = useCallback(() => {
        setError(null);
        setIsDetecting(true);
        setStatusMessage('Detecting objects...');
        setDetectedObjects([]);
        
        detectFrame();
        analysisIntervalRef.current = window.setInterval(detectFrame, ANALYSIS_INTERVAL);

    }, [detectFrame]);

    const stopDetection = useCallback(() => {
        if (analysisIntervalRef.current) {
            window.clearInterval(analysisIntervalRef.current);
            analysisIntervalRef.current = null;
        }
        setIsDetecting(false);
        setStatusMessage('Detection stopped.');
    }, []);

    useEffect(() => {
        return () => {
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (analysisIntervalRef.current) {
                window.clearInterval(analysisIntervalRef.current);
            }
        };
    }, []);
    
    return {
        videoRef,
        isCameraOn,
        isDetecting,
        detectedObjects,
        error,
        statusMessage,
        startCamera,
        stopCamera,
        startDetection,
        stopDetection,
    };
};
