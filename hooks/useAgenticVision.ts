
import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';
import { AgentAction } from '../types';

export const useAgenticVision = () => {
    const [isStreamOn, setIsStreamOn] = useState(false);
    const [streamType, setStreamType] = useState<'camera' | 'screen' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState<AgentAction[]>([]);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const stopAllStreams = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsStreamOn(false);
        setStreamType(null);
        setAnalysis([]);
    }, []);

    const startStream = useCallback(async (type: 'camera' | 'screen') => {
        if (isStreamOn) {
            stopAllStreams();
        }
        setError(null);
        setIsLoading(true);

        try {
            if (type === 'camera') {
                mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 1280, height: 720 } 
                });
            } else {
                 mediaStreamRef.current = await navigator.mediaDevices.getDisplayMedia({ 
                    video: true
                });
            }

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStreamRef.current;
                await videoRef.current.play();
            }

            setIsStreamOn(true);
            setStreamType(type);
        } catch (err) {
            console.error(`${type} access error:`, err);
            let userMessage = `Failed to access ${type}.`;
             if (err instanceof DOMException) {
                if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    userMessage = `No ${type} found. Please make sure it is connected and working.`;
                } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    userMessage = `${type} access has been denied. Please enable it in your browser settings.`;
                }
            }
            setError(userMessage);
            stopAllStreams();
        } finally {
            setIsLoading(false);
        }
    }, [isStreamOn, stopAllStreams]);

    const executeCommand = useCallback(async (prompt: string) => {
        if (!isStreamOn || !videoRef.current || videoRef.current.readyState < 2) {
            setError("Camera or screen share is not active.");
            return;
        }
        if (!prompt.trim()) {
            setError("Please enter a command.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysis([]);

        // Capture a frame
        if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) {
            setError("Failed to get canvas context.");
            setIsLoading(false);
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

            const performActionTool: FunctionDeclaration = {
                name: 'perform_action',
                description: 'Performs an action on the screen based on the user command.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        actions: {
                            type: Type.ARRAY,
                            description: "A list of actions to perform to accomplish the user's goal.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                     thought: {
                                        type: Type.STRING,
                                        description: 'Your reasoning for choosing this specific action.',
                                    },
                                    action_type: {
                                        type: Type.STRING,
                                        enum: ['TYPE', 'CLICK', 'SCROLL', 'WAIT', 'FINISH'],
                                        description: 'The type of action to perform.',
                                    },
                                    x: { type: Type.NUMBER, description: 'X-coordinate for CLICK action.' },
                                    y: { type: Type.NUMBER, description: 'Y-coordinate for CLICK action.' },
                                    text_to_type: { type: Type.STRING, description: 'The text to type for TYPE action.' },
                                    scroll_direction: {
                                        type: Type.STRING,
                                        enum: ['up', 'down'],
                                        description: 'Direction for SCROLL action.',
                                    },
                                    duration: { type: Type.NUMBER, description: 'Duration in milliseconds for WAIT action.' },
                                },
                                required: ['thought', 'action_type'],
                            }
                        }
                    },
                    required: ['actions'],
                }
            };

            const systemInstruction = `You are an expert agent that analyzes a screen capture and a user's prompt to determine a sequence of actions. 
            Your goal is to create a plan to fulfill the user's request. 
            You can use actions like CLICK, TYPE, SCROLL, WAIT, and FINISH.
            For CLICK actions, you must provide precise x and y coordinates.
            Always use the FINISH action when the task is complete.
            Provide your reasoning for each step in the 'thought' field.`;

            const imagePart = { inlineData: { mimeType: 'image/jpeg', data: frameData } };

            const response = await aiRef.current.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: { parts: [{ text: prompt }, imagePart] },
                config: {
                    tools: [{ functionDeclarations: [performActionTool] }],
                    systemInstruction
                }
            });

            const functionCalls = response.functionCalls;
            if (functionCalls && functionCalls.length > 0) {
                const actions = functionCalls[0].args.actions as AgentAction[];
                setAnalysis(actions);
            } else {
                setAnalysis([{ action_type: 'FINISH', thought: response.text ?? "I'm not sure how to proceed with that request." }]);
            }

        } catch (err) {
            console.error("Agentic analysis error:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during analysis.");
        } finally {
            setIsLoading(false);
        }
    }, [isStreamOn]);

    return {
        videoRef,
        isStreamOn,
        streamType,
        isLoading,
        analysis,
        error,
        startStream,
        stopAllStreams,
        executeCommand,
    };
};
