
import { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { availableVoices, VoiceId } from '../types';

// This hook is self-contained and manages its own AI instance and audio context
// to avoid conflicts with the main live session.

export const useTextToSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState<VoiceId>(availableVoices[0].id);
    const aiRef = useRef<GoogleGenAI | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const speak = useCallback(async (text: string) => {
        if (!text || isSpeaking) return;

        setIsSpeaking(true);

        try {
            if (!aiRef.current) {
                if (!process.env.API_KEY) throw new Error("API key not found for TTS.");
                aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
            }

            const response = await aiRef.current.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: selectedVoice },
                        },
                    },
                },
            });
            
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64Audio) {
                throw new Error("No audio data received from TTS API.");
            }

            // Create a new audio context for each playback to ensure it's not suspended
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const audioData = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            
            source.start(0);

            source.onended = () => {
                setIsSpeaking(false);
                audioContextRef.current?.close();
            };

        } catch (error) {
            console.error("Text-to-speech failed:", error);
            setIsSpeaking(false);
        }
    }, [isSpeaking, selectedVoice]);

    return { speak, isSpeaking, selectedVoice, setSelectedVoice };
};
