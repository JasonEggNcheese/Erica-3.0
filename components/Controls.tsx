
import React from 'react';
import { SessionStatus } from '../types';
import { Mic, MicOff, Square, Zap } from 'lucide-react';

interface ControlsProps {
  sessionStatus: SessionStatus;
  startSession: () => void;
  stopSession: () => void;
}

const Controls: React.FC<ControlsProps> = ({ sessionStatus, startSession, stopSession }) => {
  const isIdle = sessionStatus === SessionStatus.IDLE || sessionStatus === SessionStatus.DISCONNECTED;
  const isConnecting = sessionStatus === SessionStatus.CONNECTING;
  const isConnected = sessionStatus === SessionStatus.CONNECTED;
  const isError = sessionStatus === SessionStatus.ERROR;

  const handleClick = () => {
    if (isConnected) {
      stopSession();
    } else {
      startSession();
    }
  };

  const getButtonContent = () => {
    if (isConnecting) {
      return (
        <>
          <Zap className="w-6 h-6 animate-ping" />
          <span>Connecting...</span>
        </>
      );
    }
    if (isConnected) {
      return (
        <>
          <Square className="w-6 h-6" />
          <span>Stop Conversation</span>
        </>
      );
    }
    if (isError) {
        return (
            <>
                <MicOff className="w-6 h-6" />
                <span>Try Again</span>
            </>
        )
    }
    return (
      <>
        <Mic className="w-6 h-6" />
        <span>Start Conversation</span>
      </>
    );
  };
  
  const baseClasses = "flex items-center justify-center space-x-3 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-wait";
  const colorClasses = isConnected ? 
    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/50" : 
    "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500/50";


  return (
    <button
      onClick={handleClick}
      disabled={isConnecting}
      className={`${baseClasses} ${colorClasses}`}
    >
      {getButtonContent()}
    </button>
  );
};

export default Controls;
