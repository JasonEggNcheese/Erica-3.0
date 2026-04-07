
import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { ChatMessage, ChatPart } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { logError, getFriendlyErrorMessage, ErrorSeverity } from '../utils/errorLogger';

export const useChatAgent = (initialMessage?: string | null) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const chatRef = useRef<Chat | null>(null);

    // Initialize the chat session
    useEffect(() => {
        const initializeChat = async () => {
            try {
                if (!process.env.GEMINI_API_KEY) throw new Error("API key not found.");
                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                chatRef.current = ai.chats.create({
                    model: 'gemini-3-pro-preview',
                    config: {
                        systemInstruction: 'You are ERICA, an advanced neural interface and helpful multimodal assistant. You are professional, efficient, and slightly futuristic in your tone.'
                    }
                });
                // Add an initial message from the model
                 setMessages([{
                    role: 'model',
                    parts: [{ text: initialMessage || "Hello! I'm ERICA. You can ask me questions or send me an image to discuss." }]
                }]);
            } catch (err) {
                logError(err, ErrorSeverity.HIGH, { hook: 'useChatAgent', action: 'initializeChat' });
                setError(getFriendlyErrorMessage(err));
            }
        };
        initializeChat();
    }, [initialMessage]);

    const sendMessage = useCallback(async (prompt: string, file: File | null) => {
        if (!prompt && !file) {
            setError("Please enter a message or upload an image.");
            return;
        }
        if (!chatRef.current) {
            setError("Chat is not initialized. Please wait a moment.");
            return;
        }

        setIsLoading(true);
        setError(null);

        const userParts: ChatPart[] = [];
        if (file) {
            try {
                const base64Data = await fileToBase64(file);
                userParts.push({
                    inlineData: {
                        mimeType: file.type,
                        data: base64Data,
                    },
                });
            } catch (err) {
                logError(err, ErrorSeverity.MEDIUM, { hook: 'useChatAgent', action: 'processFile', fileName: file.name });
                setError("Failed to process the image file. Please try a different image.");
                setIsLoading(false);
                return;
            }
        }
        if (prompt) {
            userParts.push({ text: prompt });
        }

        const userMessage: ChatMessage = { role: 'user', parts: userParts };
        setMessages(prev => [...prev, userMessage]);
        
        // Prepare for streaming response
        const modelMessage: ChatMessage = { role: 'model', parts: [{ text: '' }] };
        setMessages(prev => [...prev, modelMessage]);

        try {
            // For multimodal chat, the sendMessageStream method expects an object
            // with a `message` property containing the array of parts.
            const result = await chatRef.current.sendMessageStream({ message: userParts });

            for await (const chunk of result) {
                const response = chunk as GenerateContentResponse;
                const chunkText = response.text;
                if (chunkText) {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];

                        if (lastMessage && lastMessage.role === 'model') {
                            // Create a deep copy of the message to update it immutably.
                            const updatedLastMessage = {
                                ...lastMessage,
                                parts: [
                                    {
                                        ...lastMessage.parts[0],
                                        text: (lastMessage.parts[0]?.text || '') + chunkText,
                                    },
                                ],
                            };
                            newMessages[newMessages.length - 1] = updatedLastMessage;
                            return newMessages;
                        }
                        return prev;
                    });
                }
            }
        } catch (err) {
            logError(err, ErrorSeverity.HIGH, { hook: 'useChatAgent', action: 'sendMessage', promptLength: prompt.length });
            setError(getFriendlyErrorMessage(err));
             setMessages(prev => prev.slice(0, -1)); // Remove the empty model message
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    return { messages, isLoading, error, sendMessage };
};
