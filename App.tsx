
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import InteractiveView from './components/InteractiveView';
import VoiceController from './components/VoiceController';

const App: React.FC = () => {
  const [briefing, setBriefing] = useState<string | null>(null);

  const handleCommand = useCallback((command: string) => {
    console.log('Voice Command Received:', command);
    
    if (command.includes('good morning erica')) {
      setBriefing("Good morning! It's 11:32 AM on Monday, March 9th. Your schedule is clear for the next two hours. The weather is currently 68°F and sunny. Would you like me to prepare your focus playlist?");
    } else if (command.includes('what can you help me with')) {
      setBriefing("I am ERICA 3.0, your advanced neural interface. I can assist with:\n\n- **Interactive Vision**: Real-time object detection and spatial analysis.\n- **Web Research**: High-fidelity information retrieval using Google Search.\n- **File Analysis**: Multimodal understanding of images and videos.\n- **Screen Sharing**: Collaborative task execution via visual feedback.");
    } else if (command.includes('activate work mode')) {
      setBriefing("Activating Work Mode. Dimming peripheral interfaces and enabling focus filters. System resources optimized for productivity.");
      document.body.classList.add('focus-mode');
      setTimeout(() => document.body.classList.remove('focus-mode'), 5000);
    }
  }, []);

  return (
    <div className="relative flex flex-col h-screen overflow-hidden font-sans selection:bg-purple-500/30">
      <div className="atmosphere" aria-hidden="true" />
      
      <header className="flex flex-col sm:flex-row items-center justify-between px-6 sm:px-12 py-6 sm:py-10 z-10 gap-4">
        <div className="flex flex-col items-center sm:items-start">
          <h1 className="text-xl sm:text-2xl font-light tracking-[-0.04em] text-white">
            ERICA <span className="font-black text-purple-500">3.0</span>
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[6px] sm:text-[8px] uppercase tracking-[0.4em] text-white/20 font-mono">Neural Interface</span>
            <div className="w-1 h-1 rounded-full bg-white/5" />
            <span className="text-[6px] sm:text-[8px] uppercase tracking-[0.4em] text-white/20 font-mono">v3.0.42</span>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col overflow-hidden relative z-10 px-4 sm:px-8 md:px-12">
        <InteractiveView initialMessage={briefing} />
      </main>
      
      <footer className="px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center z-10 border-t border-white/5 bg-black/20 backdrop-blur-sm gap-2">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-white/40 font-mono">System Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-white/40 font-mono">Gemini 3 Pro</span>
          </div>
        </div>
        <div className="text-[8px] sm:text-[10px] uppercase tracking-widest text-white/20 font-mono">
          © 2026 ERICA Neural Systems
        </div>
      </footer>

      <VoiceController onCommand={handleCommand} />
      
      <AnimatePresence>
        {briefing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 bottom-24 sm:inset-x-auto sm:right-24 sm:bottom-24 z-40 bg-purple-500/10 backdrop-blur-xl border border-purple-500/30 p-6 rounded-3xl max-w-md shadow-[0_0_50px_rgba(168,85,247,0.1)]"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-purple-400 font-bold">System Briefing</span>
              <button 
                onClick={() => setBriefing(null)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
              {briefing}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
