
import React, { useState } from 'react';
import { useLiveAnalysis } from '../hooks/useLiveAnalysis';
import { Camera, CameraOff, Wand2, Square, XCircle, Loader2 } from 'lucide-react';

const LiveAnalysis: React.FC = () => {
  const { 
    videoRef, 
    isCameraOn, 
    isAnalyzing, 
    analysis, 
    error, 
    statusMessage,
    startCamera, 
    stopCamera, 
    startAnalysis,
    stopAnalysis
  } = useLiveAnalysis();
  const [prompt, setPrompt] = useState<string>('');

  const handleAnalysisToggle = () => {
    if (isAnalyzing) {
      stopAnalysis();
    } else {
      startAnalysis(prompt);
    }
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col gap-6 text-white overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        {/* Left Column: Camera Feed and Controls */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-purple-300">1. Enable Camera</h2>
            <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-700 bg-black flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              {!isCameraOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                  <CameraOff className="w-16 h-16 text-gray-500 mb-4" />
                  <p className="text-gray-400">Camera is off</p>
                </div>
              )}
            </div>
            <button
              onClick={isCameraOn ? stopCamera : startCamera}
              disabled={!isCameraOn && isAnalyzing}
              className={`flex items-center justify-center space-x-3 w-full px-6 py-3 text-lg font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 ${
                isCameraOn 
                ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/50" 
                : "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500/50"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isCameraOn ? <CameraOff className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
              <span>{isCameraOn ? 'Stop Camera' : 'Start Camera'}</span>
            </button>
          </div>
          
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-purple-300">2. Ask a Question</h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Describe what you see. Is there a person in the frame?"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50"
              rows={3}
              disabled={!isCameraOn || isAnalyzing}
              aria-label="Enter your question for live analysis"
            />
          </div>

          <button
            onClick={handleAnalysisToggle}
            disabled={!isCameraOn || !prompt.trim()}
            className={`flex items-center justify-center space-x-3 w-full px-6 py-3 text-lg font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 ${
              isAnalyzing 
              ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/50" 
              : "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500/50"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isAnalyzing ? <Square className="w-6 h-6" /> : <Wand2 className="w-6 h-6" />}
            <span>{isAnalyzing ? 'Stop Analysis' : 'Start Analysis'}</span>
          </button>
        </div>

        {/* Right Column: Analysis Result */}
        <div className="flex flex-col gap-4">
           <h2 className="text-xl font-semibold text-purple-300">3. Live Analysis</h2>
            <div className="flex flex-col h-full p-6 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3 mb-4 text-sm text-gray-400">
                    {isAnalyzing && <Loader2 className="w-5 h-5 animate-spin text-purple-400" />}
                    <p>{statusMessage}</p>
                </div>

                {error && (
                  <div className="flex items-center space-x-3 p-4 mb-4 bg-red-900/50 text-red-300 rounded-lg">
                    <XCircle className="w-6 h-6 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="flex-grow overflow-y-auto prose prose-invert prose-p:text-gray-300 max-w-none">
                    <p className="whitespace-pre-wrap">{analysis || "Analysis results will appear here."}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAnalysis;
