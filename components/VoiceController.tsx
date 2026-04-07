
import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceControllerProps {
  onCommand: (command: string) => void;
  isListening?: boolean;
}

const VoiceController: React.FC<VoiceControllerProps> = ({ onCommand, isListening: externalIsListening }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const command = event.results[i][0].transcript.trim().toLowerCase();
            console.log('Final Transcript:', command);
            onCommand(command);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(interimTranscript);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        if (isListening) {
          rec.start();
        }
      };

      setRecognition(rec);
    }
  }, [onCommand]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      recognition?.start();
      setIsListening(true);
    }
  }, [isListening, recognition]);

  return (
    <div className="fixed bottom-24 right-4 sm:right-8 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl text-[10px] uppercase tracking-widest text-white/60 max-w-[200px] text-right"
          >
            {transcript}
          </motion.div>
        )}
      </AnimatePresence>
      
      <button
        onClick={toggleListening}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border
          ${isListening 
            ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]' 
            : 'bg-white/5 border-white/10 hover:bg-white/10'}
        `}
      >
        {isListening ? (
          <Mic className="w-5 h-5 text-purple-400 animate-pulse" />
        ) : (
          <MicOff className="w-5 h-5 text-white/40" />
        )}
      </button>
    </div>
  );
};

export default VoiceController;
