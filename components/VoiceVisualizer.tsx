
import React from 'react';
import { SessionStatus } from '../types';

interface VoiceVisualizerProps {
  status: SessionStatus;
  isSpeaking: boolean;
  isSpeakingError: boolean;
}

const AVATAR_URL = 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=1';

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ status, isSpeaking, isSpeakingError }) => {
  const isConnected = status === SessionStatus.CONNECTED;

  const baseClasses = "relative w-48 h-48 md:w-64 md:h-64 rounded-full transition-all duration-500 ease-in-out flex items-center justify-center overflow-hidden shadow-2xl";
  const glowClasses = "absolute w-full h-full rounded-full blur-2xl transition-all duration-500";
  const avatarClasses = "w-full h-full bg-cover bg-center rounded-full transition-all duration-500";

  let visualState = {
    containerBg: 'bg-gray-800',
    glowOpacity: 'opacity-0',
    glowBg: 'bg-purple-500',
    avatarFilter: 'grayscale',
    animation: ''
  };

  if (status === SessionStatus.CONNECTING) {
    visualState = {
      ...visualState,
      containerBg: 'bg-purple-900/50',
      glowOpacity: 'opacity-60',
      avatarFilter: '',
      animation: 'animate-pulse'
    };
  } else if (isConnected) {
      if(isSpeaking) {
        // ERICA is speaking
         visualState = {
            containerBg: 'bg-blue-900/60',
            glowOpacity: 'opacity-75',
            glowBg: 'bg-blue-500',
            avatarFilter: '',
            animation: 'animate-pulse' // More active pulse
         };
      } else {
        // ERICA is listening
        visualState = {
            containerBg: 'bg-purple-900/50',
            glowOpacity: 'opacity-50',
            glowBg: 'bg-purple-500',
            avatarFilter: '',
            animation: 'animate-subtle-breathing' // Custom breathing animation
        };
      }
  } else if (status === SessionStatus.ERROR) {
      visualState = {
        containerBg: 'bg-red-900/50',
        glowOpacity: 'opacity-70',
        glowBg: 'bg-red-600',
        avatarFilter: 'grayscale brightness-75',
        animation: isSpeakingError ? 'animate-pulse' : 'animate-shake'
      };
  }

  return (
    <div className={`${baseClasses} ${visualState.containerBg} ${visualState.animation}`}>
      <div className={`${glowClasses} ${visualState.glowBg} ${visualState.glowOpacity}`}></div>
      <div 
        className={`${avatarClasses} ${visualState.avatarFilter}`}
        style={{ backgroundImage: `url(${AVATAR_URL})` }}
        aria-label="ERICA's avatar"
      >
      </div>
    </div>
  );
};

export default VoiceVisualizer;