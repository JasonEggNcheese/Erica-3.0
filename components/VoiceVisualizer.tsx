
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type VisualizerStatus = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';

interface VoiceVisualizerProps {
  status: VisualizerStatus;
  isSpeakingError?: boolean;
}

const AVATAR_URL = 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=1';

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ status, isSpeakingError }) => {
  const getGlowColor = () => {
    switch (status) {
      case 'PROCESSING': return 'rgba(168, 85, 247, 0.3)';
      case 'SPEAKING': return 'rgba(255, 255, 255, 0.2)';
      case 'LISTENING': return 'rgba(168, 85, 247, 0.15)';
      case 'ERROR': return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(255, 255, 255, 0.02)';
    }
  };

  return (
    <div className="relative flex items-center justify-center w-40 h-40 md:w-56 md:h-56">
      {/* Outer Glow Rings */}
      <AnimatePresence>
        {status !== 'IDLE' && (
          <>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [1, 1.15, 1],
                opacity: [0.1, 0.3, 0.1],
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full blur-3xl"
              style={{ backgroundColor: getGlowColor() }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Main Avatar Container */}
      <motion.div
        animate={{
          scale: status === 'SPEAKING' ? [1, 1.01, 1] : 1,
        }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className={`
          relative w-full h-full rounded-full overflow-hidden border transition-all duration-1000 z-10
          ${status === 'ERROR' ? 'border-red-500/30' : 'border-white/5'}
          bg-black/40 backdrop-blur-md
        `}
      >
        <motion.div
          animate={{
            filter: status === 'IDLE' ? 'grayscale(1) brightness(0.3) blur(2px)' : 'grayscale(0) brightness(0.8) blur(0px)',
            scale: status === 'LISTENING' ? 1.02 : 1,
          }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="w-full h-full bg-cover bg-center opacity-60"
          style={{ backgroundImage: `url(${AVATAR_URL})` }}
        />
        
        {/* Overlay for status effects */}
        <AnimatePresence>
          {status === 'PROCESSING' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-purple-500/5 backdrop-blur-[1px] flex items-center justify-center"
            >
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3] 
                    }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                    className="w-1 h-1 rounded-full bg-purple-400"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inner Border Ring */}
        <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" />
      </motion.div>
    </div>
  );
};

export default VoiceVisualizer;
