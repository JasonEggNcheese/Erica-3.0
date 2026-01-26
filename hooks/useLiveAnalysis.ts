
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

const ANALYSIS_INTERVAL = 3000; // milliseconds

export const useLiveAnalysis = () => {
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState('Camera is off.');

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
        if(isAnalyzing) stopAnalysis();
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
        setStatusMessage('Camera is off.');
    }, [isAnalyzing]);
    
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
                if (!process.env.API_KEY) throw new Error("API key not found.");
                aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
            }
            
            const imagePart = {
                inlineData: { mimeType: 'image/jpeg', data: frameData },
            };

            const response = await aiRef.current.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: { parts: [{ text: prompt }, imagePart] },
            });

            setAnalysis(response.text ?? 'No response from AI.');

        } catch (err) {
            console.error("Frame analysis error:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during analysis.");
            // Stop analysis on error to avoid repeated failures
            stopAnalysis();
        } finally {
            isProcessingFrame.current = false;
        }
    }, []);


    const startAnalysis = useCallback((prompt: string) => {
        if (!prompt.trim()) {
            setError('Please enter a prompt before starting analysis.');
            return;
        }
        setError(null);
        setIsAnalyzing(true);
        setStatusMessage('Live analysis in progress...');
        setAnalysis('Starting analysis...');
        
        // Initial call
        analyzeFrame(prompt);
        
        // Subsequent calls on interval
        analysisIntervalRef.current = setInterval(() => {
            analyzeFrame(prompt);
        }, ANALYSIS_INTERVAL);

    }, [analyzeFrame]);

    const stopAnalysis = useCallback(() => {
        if (analysisIntervalRef.current) {
            clearInterval(analysisIntervalRef.current);
        }
        setIsAnalyzing(false);
        setStatusMessage('Analysis stopped.');
    }, []);

    useEffect(() => {
        return () => {
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (analysisIntervalRef.current) {
                clearInterval(analysisIntervalRef.current);
            }
        };
    }, []);
    
    return {
        videoRef,
        isCameraOn,
        isAnalyzing,
        analysis,
        error,
        statusMessage,
        startCamera,
        stopCamera,
        startAnalysis,
        stopAnalysis,
    };
};
