
import { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { VoiceId } from '../types';
import { logError, getFriendlyErrorMessage, ErrorSeverity } from '../utils/errorLogger';

// This hook is self-contained and manages its own AI instance and audio context
// to avoid conflicts with other audio sources.

export const useTextToSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    // FIX: Add state for selected voice to be managed by the hook.
    const [selectedVoice, setSelectedVoice] = useState<VoiceId>('Kore');
    const aiRef = useRef<GoogleGenAI | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // FIX: Update speak function to use the hook's voice state by default, but allow overrides.
    const speak = useCallback(async (text: string, voiceOverride?: VoiceId): Promise<void> => {
        const voice = voiceOverride || selectedVoice;
        if (!text || isSpeaking) return;

        setIsSpeaking(true);

        return new Promise(async (resolve, reject) => {
            try {
                if (!aiRef.current) {
                    if (!process.env.GEMINI_API_KEY) throw new Error("API key not found for TTS.");
                    aiRef.current = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                }

                const response = await aiRef.current.models.generateContent({
                    model: "gemini-2.5-flash-preview-tts",
                    contents: [{ parts: [{ text }] }],
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: voice },
                            },
                        },
                    },
                });
                
                const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                if (!base64Audio) {
                    throw new Error("No audio data received from TTS API.");
                }

                // Create a new audio context for each playback to ensure it's not suspended
                // FIX: Add 'any' cast for window to access prefixed webkitAudioContext
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
                    resolve();
                };

            } catch (error) {
                logError(error, ErrorSeverity.HIGH, { hook: 'useTextToSpeech', action: 'speak', textLength: text.length, voice });
                setIsSpeaking(false);
                reject(new Error(getFriendlyErrorMessage(error)));
            }
        });
    }, [isSpeaking, selectedVoice]);

    // FIX: Expose selectedVoice and its setter.
    return { speak, isSpeaking, selectedVoice, setSelectedVoice };
};
