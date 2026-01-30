
import React from 'react';

// This component no longer uses SessionStatus, as the new flow is more granular.
export type VisualizerStatus = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';

interface VoiceVisualizerProps {
  status: VisualizerStatus;
  isSpeakingError?: boolean;
}

const AVATAR_URL = 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=1';

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ status, isSpeakingError }) => {
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

  switch (status) {
    case 'PROCESSING':
      visualState = {
        ...visualState,
        containerBg: 'bg-purple-900/50',
        glowOpacity: 'opacity-60',
        avatarFilter: '',
        animation: 'animate-pulse'
      };
      break;
    case 'SPEAKING':
      visualState = {
        containerBg: 'bg-blue-900/60',
        glowOpacity: 'opacity-75',
        glowBg: 'bg-blue-500',
        avatarFilter: '',
        animation: 'animate-pulse' // More active pulse
      };
      break;
    case 'LISTENING':
      visualState = {
        containerBg: 'bg-purple-900/50',
        glowOpacity: 'opacity-50',
        glowBg: 'bg-purple-500',
        avatarFilter: '',
        animation: 'animate-subtle-breathing' // Custom breathing animation
      };
      break;
    case 'ERROR':
      visualState = {
        containerBg: 'bg-red-900/50',
        glowOpacity: 'opacity-70',
        glowBg: 'bg-red-600',
        avatarFilter: 'grayscale brightness-75',
        animation: isSpeakingError ? 'animate-pulse' : 'animate-shake'
      };
      break;
    case 'IDLE':
    default:
      // Uses the default grayscale state
      break;
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
