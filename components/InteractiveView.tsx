
import React, { useState, useEffect } from 'react';
import { useLiveSession } from '../hooks/useLiveSession';
import { useLiveAnalysis } from '../hooks/useLiveAnalysis';
import VoiceVisualizer from './VoiceVisualizer';
import Transcript from './Transcript';
import VoiceSelector from './VoiceSelector';
import NewConversationButton from './NewConversationButton';
import { Mic, Square, Zap, CameraOff, Loader2, XCircle, WifiOff, Info } from 'lucide-react';

const InteractiveView: React.FC = () => {
    const { 
        sessionStatus, 
        transcript, 
        startSession, 
        stopSession,
        clearTranscript,
        isSpeaking,
        isSpeakingError,
        errorMessage: sessionError,
        selectedVoice,
        setSelectedVoice
    } = useLiveSession();

    const { 
        videoRef, 
        isCameraOn, 
        isAnalyzing, 
        analysis, 
        error: analysisError, 
        statusMessage,
        startCamera, 
        stopCamera, 
        startAnalysis,
        stopAnalysis
    } = useLiveAnalysis();

    const [isInteractiveActive, setIsInteractiveActive] = useState(false);
    const [analysisPrompt, setAnalysisPrompt] = useState('Describe what you see in detail.');

    const handleStart = async () => {
        setIsInteractiveActive(true);
        // Start camera first to get permissions, then the session
        await startCamera();
        await startSession();
    };

    const handleStop = () => {
        stopSession();
        stopCamera(); // This also stops analysis
        setIsInteractiveActive(false);
    };

    // Automatically start/stop analysis when camera turns on/off
    useEffect(() => {
        if (isCameraOn && isInteractiveActive) {
            startAnalysis(analysisPrompt);
        } else {
            stopAnalysis();
        }
    }, [isCameraOn, isInteractiveActive]);

    // Restart analysis if the prompt changes while running
    useEffect(() => {
        if (isAnalyzing) {
            startAnalysis(analysisPrompt);
        }
    }, [analysisPrompt]);
    
    const isConnecting = sessionStatus === 'CONNECTING';

    const getButtonContent = () => {
        if (isConnecting) {
          return ( <> <Zap className="w-6 h-6 animate-ping" /> <span>Connecting...</span> </>);
        }
        if (isInteractiveActive) {
          return ( <> <Square className="w-6 h-6" /> <span>Stop Session</span> </> );
        }
        return ( <> <Mic className="w-6 h-6" /> <span>Start Interactive Session</span> </>);
    };

    return (
        <div className="flex flex-col h-full p-4 md:p-6 gap-6">
            {/* Main Content Grid */}
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                {/* Left Column: Vision */}
                <div className="flex flex-col gap-4 overflow-hidden">
                    <h2 className="text-xl font-semibold text-purple-300 flex-shrink-0">Live Vision</h2>
                    <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-700 bg-black flex items-center justify-center flex-shrink-0">
                        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                        {!isCameraOn && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                            <CameraOff className="w-16 h-16 text-gray-500 mb-4" />
                            <p className="text-gray-400">Camera is off</p>
                            </div>
                        )}
                    </div>
                    <textarea
                        value={analysisPrompt}
                        onChange={(e) => setAnalysisPrompt(e.target.value)}
                        placeholder="e.g., Describe what you see."
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50 flex-shrink-0"
                        rows={2}
                        disabled={!isInteractiveActive}
                        aria-label="Enter your question for live analysis"
                    />
                    <div className="flex flex-col flex-grow h-full p-4 bg-gray-800/50 rounded-lg overflow-hidden">
                        <div className="flex items-center gap-3 mb-2 text-sm text-gray-400 flex-shrink-0">
                            {isAnalyzing && <Loader2 className="w-5 h-5 animate-spin text-purple-400" />}
                            <p>{statusMessage}</p>
                        </div>
                        {analysisError && (
                            <div className="flex items-center space-x-3 p-2 mb-2 bg-red-900/50 text-red-300 rounded-lg">
                                <XCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm">{analysisError}</p>
                            </div>
                        )}
                        <div className="flex-grow overflow-y-auto prose prose-invert prose-p:text-gray-300 max-w-none scrollbar-thin">
                            <p className="whitespace-pre-wrap">{analysis || "Analysis results will appear here."}</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Conversation */}
                <div className="flex flex-col gap-4 overflow-hidden">
                    <div className="flex items-center justify-between flex-shrink-0">
                        <h2 className="text-xl font-semibold text-purple-300">Conversation</h2>
                        <div className="flex items-center space-x-4">
                            <NewConversationButton onClick={clearTranscript} disabled={isInteractiveActive} />
                            <VoiceSelector 
                                selectedVoice={selectedVoice}
                                onVoiceChange={setSelectedVoice}
                                disabled={isInteractiveActive}
                            />
                        </div>
                    </div>
                    <div className="flex-grow w-full overflow-y-auto p-2 scrollbar-thin">
                        <Transcript transcript={transcript} />
                    </div>
                    <div className="flex-shrink-0 w-full flex flex-col items-center justify-center space-y-4 pt-4">
                        <VoiceVisualizer status={sessionStatus} isSpeaking={isSpeaking} isSpeakingError={isSpeakingError} />
                    </div>
                </div>
            </div>
            
            {/* Footer Controls */}
            <div className="flex-shrink-0 flex flex-col items-center justify-center space-y-3">
                 {sessionError && (
                    <div className="flex items-center space-x-2 bg-red-500/20 text-red-300 p-3 rounded-lg max-w-md">
                        <WifiOff className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm">{sessionError}</p>
                    </div>
                )}
                {!sessionError && !isInteractiveActive && (
                    <div className="flex items-center space-x-2 bg-blue-500/10 text-blue-300 p-3 rounded-lg max-w-xl">
                        <Info className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm">Press the button to start a voice conversation with live vision analysis.</p>
                    </div>
                )}
                <button
                    onClick={isInteractiveActive ? handleStop : handleStart}
                    disabled={isConnecting}
                    className={`flex items-center justify-center space-x-3 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-wait ${
                        isInteractiveActive ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/50" : "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500/50"
                    }`}
                >
                    {getButtonContent()}
                </button>
            </div>
        </div>
    );
};

export default InteractiveView;
