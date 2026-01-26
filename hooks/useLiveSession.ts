
import { useState, useRef, useCallback, useEffect } from 'react';
// FIX: Removed non-existent export 'LiveSession'.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { SessionStatus, ConversationTurn, Speaker, availableVoices, VoiceId } from '../types';
import { decode, encode, decodeAudioData } from '../utils/audioUtils';
import { getMemory, processNewTurn } from '../memory/memoryManager';
import { useTextToSpeech } from './useTextToSpeech';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;
const LOCAL_STORAGE_KEY = 'erica-conversation-history';

export const useLiveSession = () => {
    const [sessionStatus, setSessionStatus] = useState<SessionStatus>(SessionStatus.IDLE);
    const [transcript, setTranscript] = useState<ConversationTurn[]>(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Basic validation
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            }
        } catch (error) {
            console.error("Failed to load or parse conversation history:", error);
        }
        return [];
    });
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [selectedVoice, setSelectedVoice] = useState<VoiceId>(availableVoices[0].id);

    const { speak: speakError, isSpeaking: isSpeakingError } = useTextToSpeech();

    const aiRef = useRef<GoogleGenAI | null>(null);
    // FIX: Replaced 'LiveSession' with 'any' since it's not an exported type.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const outputGainNodeRef = useRef<GainNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    const clearTranscript = useCallback(() => {
        setTranscript([]);
        try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (error) {
            console.error("Failed to clear conversation history from localStorage:", error);
        }
    }, []);

    const startSession = useCallback(async () => {
        setSessionStatus(SessionStatus.CONNECTING);
        // Do not clear transcript here to allow resuming conversations
        setErrorMessage(null);

        try {
            if (!process.env.API_KEY) {
                throw new Error("API key not found. Please ensure it is set in your environment variables.");
            }

            aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // FIX: Cast window to 'any' to access 'webkitAudioContext' without TypeScript errors.
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
            outputGainNodeRef.current = outputAudioContextRef.current.createGain();
            outputGainNodeRef.current.connect(outputAudioContextRef.current.destination);

            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            let longTermMemory: string | null = null;
            try {
                longTermMemory = getMemory();
            } catch (error) {
                if (error instanceof Error) {
                    console.error("Memory loading failed:", error.message);
                    const spokenErrorMessage = "Just a heads-up, I'm having a little trouble accessing my long-term memory, so I might not recall our previous chats. We can still have a great conversation though!";
                    speakError(spokenErrorMessage);
                    setErrorMessage(error.message);
                }
            }

            const baseInstruction = 'You are ERICA, a friendly and helpful conversational AI assistant.';
            const memoryInstruction = longTermMemory
                ? `\nHere is a summary of your previous conversations with this user:\n---\n${longTermMemory}\n---\nUse this information to personalize your responses and demonstrate that you remember them.`
                : '';
            const systemInstruction = `${baseInstruction}${memoryInstruction}`;


            sessionPromiseRef.current = aiRef.current.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice }}},
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: systemInstruction,
                },
                callbacks: {
                    onopen: () => {
                        setSessionStatus(SessionStatus.CONNECTED);
                        // FIX: Cast window to 'any' to access 'webkitAudioContext' without TypeScript errors.
                        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
                        mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current!);
                        scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(BUFFER_SIZE, 1, 1);

                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32767;
                            }
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
                            };
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        handleTranscription(message);
                        await handleAudio(message);
                    },
                    onclose: () => {
                        stopSession(SessionStatus.DISCONNECTED, false);
                    },
                    onerror: (e) => {
                        console.error('Session error:', e);
                        const spokenErrorMessage = "Oops, I think I tripped over a cable in the cloud. The connection was lost. Please try again.";
                        speakError(spokenErrorMessage);
                        setErrorMessage("A connection error occurred. Please check your console for details.");
                        stopSession(SessionStatus.ERROR, false);
                    },
                },
            });

        } catch (error) {
            console.error("Failed to start session:", error);
            let userFriendlyMessage = "An unknown error occurred while starting the session.";
            let spokenErrorMessage = "An unknown error occurred while starting the session. Please check the console for details.";
            
            if (error instanceof DOMException) {
                if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                    userFriendlyMessage = 'No microphone found. Please make sure your microphone is connected and working.';
                    spokenErrorMessage = "Houston, we have a problem... and it's a missing microphone. Please connect one so I can hear your lovely voice.";
                } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    userFriendlyMessage = 'Microphone access has been denied. Please enable it in your browser settings to use ERICA.';
                    spokenErrorMessage = "It seems my voice isn't the only one being silenced. Could you please enable microphone access in your browser settings so we can chat?";
                } else {
                    userFriendlyMessage = `Could not access microphone: ${error.message}`;
                    spokenErrorMessage = `I couldn't access the microphone. The browser says: ${error.message}`;
                }
            } else if (error instanceof Error) {
                userFriendlyMessage = error.message;
                spokenErrorMessage = `An error occurred: ${error.message}`;
            }
            
            speakError(spokenErrorMessage);
            setErrorMessage(userFriendlyMessage);
            setSessionStatus(SessionStatus.ERROR);
            await stopSession(SessionStatus.ERROR, false);
        }
    }, [selectedVoice, speakError]);

    const stopSession = useCallback(async (finalStatus = SessionStatus.DISCONNECTED, shouldClose = true) => {
        if (shouldClose && sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing session:", e);
            }
        }

        // Save final transcript to localStorage
        setTranscript(currentTranscript => {
            try {
                 if (currentTranscript.length > 0) {
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentTranscript));
                 }
            } catch (error) {
                console.error("Failed to save conversation history:", error);
                setErrorMessage("Could not save conversation history to your browser's storage.");
                 setTimeout(() => setErrorMessage(null), 5000);
            }
            return currentTranscript;
        });


        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        audioContextRef.current?.close().catch(console.error);
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());

        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        outputAudioContextRef.current?.close().catch(console.error);

        sessionPromiseRef.current = null;
        mediaStreamRef.current = null;
        audioContextRef.current = null;
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;
        outputAudioContextRef.current = null;
        nextStartTimeRef.current = 0;
        
        setIsSpeaking(false);
        setSessionStatus(finalStatus);
    }, []);

    const handleTranscription = (message: LiveServerMessage) => {
        if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            currentInputTranscriptionRef.current += text;
            setTranscript(prev => {
                const lastTurn = prev[prev.length - 1];
                if (lastTurn && lastTurn.speaker === Speaker.USER && !lastTurn.isFinal) {
                    const updatedTurn = { ...lastTurn, text: currentInputTranscriptionRef.current };
                    return [...prev.slice(0, -1), updatedTurn];
                }
                return [...prev, { speaker: Speaker.USER, text: currentInputTranscriptionRef.current, isFinal: false }];
            });
        }

        if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text;
            currentOutputTranscriptionRef.current += text;
            setTranscript(prev => {
                const lastTurn = prev[prev.length - 1];
                if (lastTurn && lastTurn.speaker === Speaker.ERICA && !lastTurn.isFinal) {
                    const updatedTurn = { ...lastTurn, text: currentOutputTranscriptionRef.current };
                    return [...prev.slice(0, -1), updatedTurn];
                }
                return [...prev, { speaker: Speaker.ERICA, text: currentOutputTranscriptionRef.current, isFinal: false }];
            });
        }

        if (message.serverContent?.turnComplete) {
            setTranscript(prev => prev.map(turn => ({...turn, isFinal: true})));
            
            const userText = currentInputTranscriptionRef.current.trim();
            const ericaText = currentOutputTranscriptionRef.current.trim();
            if (userText.length > 0 && ericaText.length > 0) {
                // Fire-and-forget memory processing with error handling
                processNewTurn(userText, ericaText).catch(error => {
                    if (error instanceof Error) {
                        console.error("Failed to save memory:", error.message);
                        setErrorMessage(error.message);
                        // Clear the non-critical error message after a few seconds
                        setTimeout(() => setErrorMessage(null), 5000);
                    }
                });
            }

            currentInputTranscriptionRef.current = '';
            currentOutputTranscriptionRef.current = '';
        }
    };

    const handleAudio = async (message: LiveServerMessage) => {
        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio && outputAudioContextRef.current && outputGainNodeRef.current) {
            setIsSpeaking(true);
            const audioData = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioData, outputAudioContextRef.current, OUTPUT_SAMPLE_RATE, 1);
            
            const source = outputAudioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputGainNodeRef.current);
            
            const currentTime = outputAudioContextRef.current.currentTime;
            const startTime = Math.max(currentTime, nextStartTimeRef.current);
            source.start(startTime);
            
            nextStartTimeRef.current = startTime + audioBuffer.duration;
            audioSourcesRef.current.add(source);

            source.onended = () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) {
                    setIsSpeaking(false);
                }
            };
        }
        if (message.serverContent?.interrupted) {
            audioSourcesRef.current.forEach(source => source.stop());
            audioSourcesRef.current.clear();
            setIsSpeaking(false);
            nextStartTimeRef.current = 0;
        }
    };
    
    useEffect(() => {
        return () => {
            stopSession(SessionStatus.DISCONNECTED, true);
        };
    }, [stopSession]);

    return { sessionStatus, transcript, startSession, stopSession, clearTranscript, isSpeaking, isSpeakingError, errorMessage, selectedVoice, setSelectedVoice };
};