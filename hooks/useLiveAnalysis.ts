
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Gesture, DetectedObject } from '../types';
import { logError, getFriendlyErrorMessage, ErrorSeverity } from '../utils/errorLogger';

const ANALYSIS_INTERVAL = 3000; // milliseconds

interface UseLiveAnalysisProps {
    onGestureDetected: (gesture: Gesture) => void;
}

export const useLiveAnalysis = ({ onGestureDetected }: UseLiveAnalysisProps) => {
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState('');
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
                video: { width: 1280, height: 720 } 
            });
            videoRef.current.srcObject = mediaStreamRef.current;
            await videoRef.current.play();
            setIsCameraOn(true);
            setStatusMessage('Camera is on. Enter a prompt and start analysis.');
        } catch (err) {
            logError(err, ErrorSeverity.HIGH, { hook: 'useLiveAnalysis', action: 'startCamera' });
            setError(getFriendlyErrorMessage(err));
            setStatusMessage('Camera access failed.');
        }
    }, []);
    
    const stopAnalysis = useCallback(() => {
        if (analysisIntervalRef.current) {
            window.clearInterval(analysisIntervalRef.current);
            analysisIntervalRef.current = null;
        }
        setIsAnalyzing(false);
        setStatusMessage('Analysis stopped.');
    }, []);


    const stopCamera = useCallback(() => {
        if(isAnalyzing) stopAnalysis();
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
        setDetectedObjects([]);
        setAnalysis('');
        setStatusMessage('Camera is off.');
    }, [isAnalyzing, stopAnalysis]);
    
    const analyzeFrame = useCallback(async (prompt: string) => {
        if (isProcessingFrame.current || !videoRef.current || videoRef.current.readyState < 2) {
             return;
        }

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
                if (!process.env.GEMINI_API_KEY) throw new Error("API key not found.");
                aiRef.current = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            }
            
            const imagePart = {
                inlineData: { mimeType: 'image/jpeg', data: frameData },
            };

            const visionSchema = {
                type: Type.OBJECT,
                properties: {
                    description: {
                        type: Type.STRING,
                        description: "A brief, one-sentence description of the overall scene, related to the user's prompt."
                    },
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
                                        x1: { type: Type.NUMBER }, y1: { type: Type.NUMBER },
                                        x2: { type: Type.NUMBER }, y2: { type: Type.NUMBER },
                                    },
                                    required: ['x1', 'y1', 'x2', 'y2']
                                }
                            },
                            required: ['label', 'confidence', 'box']
                        }
                    },
                    gesture: {
                        type: Type.OBJECT,
                        properties: {
                            gesture: {
                                type: Type.STRING,
                                enum: ['WAVING', 'COUNTING_FINGERS', 'THUMBS_UP', 'SIGN_LANGUAGE', 'NONE'],
                            },
                            count: { type: Type.NUMBER },
                            sign: { type: Type.STRING }
                        },
                        required: ['gesture']
                    }
                }
            };
            
            const fullPrompt = `Analyze the scene based on the user's request: "${prompt}". In your analysis, ALWAYS provide a brief overall description of the scene. ALSO, identify all significant objects with labels, confidence scores (0 to 1), and normalized bounding boxes. AND ALSO detect if the user is making a gesture like WAVING, THUMBS_UP, COUNTING_FINGERS, or signing an ASL letter. Respond with a JSON object matching the required schema. If nothing is detected, provide a default description.`;

            const response = await aiRef.current.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: { parts: [{ text: fullPrompt }, imagePart] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: visionSchema,
                }
            });
            
            const responseJson = JSON.parse(response.text ?? '{}');
            
            setAnalysis(responseJson.description || "Awaiting analysis...");
            setDetectedObjects(responseJson.objects || []);

            if (responseJson.gesture && responseJson.gesture.gesture && responseJson.gesture.gesture !== 'NONE') {
                onGestureDetected(responseJson.gesture as Gesture);
            }

        } catch (err) {
            logError(err, ErrorSeverity.MEDIUM, { hook: 'useLiveAnalysis', action: 'analyzeFrame', prompt });
            // Don't halt analysis on minor frame errors, but log them.
        } finally {
            isProcessingFrame.current = false;
        }
    }, [onGestureDetected]);


    const startAnalysis = useCallback((prompt: string) => {
        if (!prompt.trim()) {
            setError('Please enter a prompt before starting analysis.');
            return;
        }
        setError(null);
        setIsAnalyzing(true);
        setStatusMessage('Live analysis in progress...');
        setAnalysis('Starting analysis...');
        setDetectedObjects([]);
        
        analyzeFrame(prompt);
        
        analysisIntervalRef.current = window.setInterval(() => {
            analyzeFrame(prompt);
        }, ANALYSIS_INTERVAL);

    }, [analyzeFrame]);


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
        isAnalyzing,
        analysis,
        detectedObjects,
        error,
        statusMessage,
        startCamera,
        stopCamera,
        startAnalysis,
        stopAnalysis,
        setIsCameraOn,
    };
};
