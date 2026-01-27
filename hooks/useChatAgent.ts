
import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { ChatMessage, ChatPart } from '../types';
import { fileToBase64 } from '../utils/fileUtils';

export const useChatAgent = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const chatRef = useRef<Chat | null>(null);

    // Initialize the chat session
    useEffect(() => {
        const initializeChat = async () => {
            try {
                if (!process.env.API_KEY) throw new Error("API key not found.");
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                chatRef.current = ai.chats.create({
                    model: 'gemini-3-pro-preview',
                    // Optional: Add a system instruction if needed
                    // config: {
                    //   systemInstruction: 'You are ERICA, a helpful multimodal assistant.'
                    // }
                });
                // Add an initial message from the model
                 setMessages([{
                    role: 'model',
                    parts: [{ text: "Hello! I'm ERICA. You can ask me questions or send me an image to discuss." }]
                }]);
            } catch (err) {
                console.error("Failed to initialize chat:", err);
                setError("Could not start a chat session. Please check your API key and network connection.");
            }
        };
        initializeChat();
    }, []);

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
                setError("Failed to process the image file.");
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
            // FIX: The `message` property should directly be the array of parts for multimodal input.
            const result = await chatRef.current.sendMessageStream({ message: userParts });

            for await (const chunk of result) {
                const response = chunk as GenerateContentResponse;
                const chunkText = response.text;
                if (chunkText) {
                    setMessages(prev => {
                        const lastMessage = prev[prev.length - 1];
                        if (lastMessage.role === 'model') {
                            const updatedText = (lastMessage.parts[0]?.text || '') + chunkText;
                            lastMessage.parts[0] = { text: updatedText };
                            return [...prev.slice(0, -1), lastMessage];
                        }
                        return prev; // Should not happen
                    });
                }
            }
        } catch (err) {
            console.error("Failed to send message:", err);
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Failed to get a response. ${message}`);
             setMessages(prev => prev.slice(0, -1)); // Remove the empty model message
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    return { messages, isLoading, error, sendMessage };
};
