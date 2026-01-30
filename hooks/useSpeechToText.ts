
import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechToTextOptions {
  onFinalTranscript: (transcript: string) => void;
  onInterimTranscript?: (transcript: string) => void;
}

// Custom hook to manage browser's SpeechRecognition API
export const useSpeechToText = ({ onFinalTranscript, onInterimTranscript }: SpeechToTextOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // FIX: Use `any` for SpeechRecognition ref to avoid type errors with browser-specific APIs.
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    // FIX: Add 'any' cast for window to access prefixed webkitSpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech Recognition API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // We want to capture a single utterance at a time
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        onFinalTranscript(finalTranscript.trim());
      }
      if (onInterimTranscript && interimTranscript.trim()) {
        onInterimTranscript(interimTranscript.trim());
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onFinalTranscript, onInterimTranscript]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch (e) {
        console.error("Could not start listening:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, error, startListening, stopListening };
};
