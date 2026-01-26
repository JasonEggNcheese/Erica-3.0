
import React from 'react';
import { SessionStatus } from '../types';

interface VoiceVisualizerProps {
  status: SessionStatus;
  isSpeaking: boolean;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ status, isSpeaking }) => {
  const isConnected = status === SessionStatus.CONNECTED;

  const baseClasses = "relative w-48 h-48 md:w-64 md:h-64 rounded-full transition-all duration-500 ease-in-out flex items-center justify-center";
  const coreClasses = "absolute w-full h-full rounded-full transition-all duration-300 flex items-center justify-center";
  const glowClasses = "absolute w-full h-full rounded-full blur-2xl transition-all duration-500";

  let visualState = {
    containerBg: 'bg-gray-800',
    coreScale: 'scale-50',
    coreBg: 'bg-gray-600',
    glowOpacity: 'opacity-0',
    glowBg: 'bg-purple-500',
    animation: ''
  };

  if (status === SessionStatus.CONNECTING) {
    visualState = {
      ...visualState,
      containerBg: 'bg-purple-900/50',
      coreScale: 'scale-75',
      coreBg: 'bg-gradient-to-br from-purple-500 to-blue-500',
      animation: 'animate-pulse'
    };
  } else if (isConnected) {
      if(isSpeaking) {
        // ERICA is speaking
         visualState = {
            containerBg: 'bg-blue-900/60',
            coreScale: 'scale-90',
            coreBg: 'bg-gradient-to-br from-blue-400 to-cyan-400',
            glowOpacity: 'opacity-75',
            glowBg: 'bg-blue-500',
            animation: 'animate-pulse'
         };
      } else {
        // ERICA is listening
        visualState = {
            containerBg: 'bg-purple-900/50',
            coreScale: 'scale-100',
            coreBg: 'bg-gradient-to-br from-purple-500 to-blue-500',
            glowOpacity: 'opacity-50',
            glowBg: 'bg-purple-500',
            animation: ''
        };
      }
  } else if (status === SessionStatus.ERROR) {
      visualState = {
        containerBg: 'bg-red-900/50',
        coreScale: 'scale-50',
        coreBg: 'bg-gradient-to-br from-red-500 to-orange-500',
        glowOpacity: 'opacity-70',
        glowBg: 'bg-red-600',
        animation: ''
      };
  }

  return (
    <div className={`${baseClasses} ${visualState.containerBg}`}>
      <div className={`${glowClasses} ${visualState.glowBg} ${visualState.glowOpacity} ${visualState.animation}`}></div>
      <div className={`${coreClasses} ${visualState.coreBg} ${visualState.coreScale} ${visualState.animation}`}>
        <span className="text-6xl md:text-8xl font-bold text-white/90 select-none" style={{ fontFamily: 'sans-serif' }}>
          E
        </span>
      </div>
    </div>
  );
};

export default VoiceVisualizer;
