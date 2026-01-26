
import React from 'react';
import { useLiveSession } from '../hooks/useLiveSession';
import { SessionStatus } from '../types';
import VoiceVisualizer from './VoiceVisualizer';
import Transcript from './Transcript';
import Controls from './Controls';
import VoiceSelector from './VoiceSelector';
import NewConversationButton from './NewConversationButton';
import { Info, WifiOff } from 'lucide-react';

const VoiceConversation: React.FC = () => {
    const { 
        sessionStatus, 
        transcript, 
        startSession, 
        stopSession,
        clearTranscript,
        isSpeaking,
        isSpeakingError,
        errorMessage,
        selectedVoice,
        setSelectedVoice
      } = useLiveSession();
    
      const isConnecting = sessionStatus === SessionStatus.CONNECTING;
      const isConnected = sessionStatus === SessionStatus.CONNECTED;
      const isIdle = sessionStatus === SessionStatus.IDLE || sessionStatus === SessionStatus.DISCONNECTED;
      const isSessionActive = isConnecting || isConnected;

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 text-white border-b border-gray-700/50 flex-shrink-0">
                <NewConversationButton onClick={clearTranscript} disabled={isSessionActive} />
                <div className="flex items-center space-x-4">
                    <VoiceSelector 
                        selectedVoice={selectedVoice}
                        onVoiceChange={setSelectedVoice}
                        disabled={isSessionActive}
                    />
                    <div className={`flex items-center space-x-2 transition-opacity duration-300 ${isConnected ? 'opacity-100' : 'opacity-0'}`}>
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-green-400">Connected</span>
                    </div>
                </div>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center text-center overflow-hidden">
                <div className="flex-grow w-full max-w-4xl overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-purple-400/50 scrollbar-track-transparent">
                   <Transcript transcript={transcript} />
                </div>
                
                <div className="flex-shrink-0 w-full flex flex-col items-center justify-center space-y-8 py-8">
                    <VoiceVisualizer status={sessionStatus} isSpeaking={isSpeaking} isSpeakingError={isSpeakingError} />

                    {errorMessage && (
                      <div className="flex items-center space-x-2 bg-red-500/20 text-red-300 p-3 rounded-lg max-w-md">
                        <WifiOff className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm">{errorMessage}</p>
                      </div>
                    )}

                    {!errorMessage && isIdle && (
                         <div className="flex items-center space-x-2 bg-blue-500/10 text-blue-300 p-3 rounded-lg max-w-md">
                            <Info className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm">Press the button below to start a conversation with ERICA.</p>
                        </div>
                    )}

                    {!errorMessage && isConnecting && <p className="text-purple-300 animate-pulse">Connecting to ERICA...</p>}
                    
                    <Controls
                        sessionStatus={sessionStatus}
                        startSession={startSession}
                        stopSession={stopSession}
                    />
                </div>
            </div>
        </div>
    );
};

export default VoiceConversation;