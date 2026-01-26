
import React, { useState, useEffect, useRef } from 'react';
import { useVideoAnalysis } from '../hooks/useVideoAnalysis';
import { UploadCloud, Film, Wand2, XCircle, Loader2, Square } from 'lucide-react';

const VideoAnalysis: React.FC = () => {
  const { videoFile, setVideoFile, analysis, isLoading, error, progress, progressMessage, analyzeVideo, stopAnalysis, setAnalysis, setError } = useVideoAnalysis();
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoSrc(url);
      setAnalysis('');
      setError(null);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoSrc(null);
      setAnalysis('');
      setError(null);
      setPrompt(''); // Clear prompt when video is removed
    }
  }, [videoFile, setAnalysis, setError]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
    } else {
      setError("Please select a valid video file.");
    }
  };

  const handleAnalyze = () => {
    if (!prompt.trim()) {
      setError("Please enter a question about the video.");
      return;
    }
    analyzeVideo(prompt.trim());
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
        setVideoFile(file);
    } else {
        setError("Please drop a valid video file.");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleButtonClick = () => {
    if (isLoading) {
      stopAnalysis();
    } else {
      handleAnalyze();
    }
  };

  const buttonDisabled = !isLoading && (!videoFile || !prompt.trim());
  
  const buttonClasses = isLoading
    ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/50"
    : "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500/50";

  return (
    <div className="p-4 md:p-8 h-full flex flex-col gap-6 text-white overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        {/* Left Column: Uploader and Prompt */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-purple-300">1. Upload Video</h2>
              {videoSrc ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-700">
                    <video src={videoSrc} controls className="w-full h-full object-contain bg-black"></video>
                    <button 
                      onClick={() => setVideoFile(null)} 
                      className="absolute top-2 right-2 bg-black/50 hover:bg-red-600/80 rounded-full p-1.5 transition-colors disabled:opacity-50"
                      aria-label="Remove video"
                      disabled={isLoading}
                    >
                        <XCircle className="w-5 h-5"/>
                    </button>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="relative flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-600 rounded-lg text-center bg-gray-800/50 cursor-pointer hover:border-purple-500 hover:bg-gray-800 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="font-semibold">Click to upload or drag & drop</p>
                  <p className="text-sm text-gray-500">MP4, MOV, WebM, etc.</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="video/*"
                    className="hidden"
                  />
                </div>
              )}
          </div>
          
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-purple-300">2. Ask a Question</h2>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., What is the main subject of this video? Describe the sequence of events."
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50"
                rows={3}
                disabled={isLoading || !videoFile}
                aria-label="Enter your question about the video"
            />
          </div>

          <button
            onClick={handleButtonClick}
            disabled={buttonDisabled}
            className={`flex items-center justify-center space-x-3 w-full px-6 py-3 text-lg font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 ${buttonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? <Square className="w-6 h-6" /> : <Wand2 className="w-6 h-6" />}
            <span>{isLoading ? 'Stop Analysis' : 'Analyze Video'}</span>
          </button>
        </div>

        {/* Right Column: Analysis Result */}
        <div className="flex flex-col gap-4">
           <h2 className="text-xl font-semibold text-purple-300">3. Analysis Result</h2>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-800/50 rounded-lg text-center">
                  <Loader2 className="animate-spin w-8 h-8 text-purple-400 mb-4" />
                  <p className="text-lg mb-4">{progressMessage}</p>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>
              </div>
            )}
            
            {error && !isLoading && (
              <div className="flex items-center space-x-3 p-4 bg-red-900/50 text-red-300 rounded-lg">
                <XCircle className="w-6 h-6 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {!isLoading && !analysis && !error && (
                <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-800/50 rounded-lg text-center">
                    <Film className="w-12 h-12 text-gray-500 mb-4" />
                    <p className="text-gray-400">Analysis results will appear here.</p>
                </div>
            )}

            {analysis && (
              <div className="p-6 bg-gray-800/50 rounded-lg space-y-4 prose prose-invert prose-p:text-gray-300 prose-headings:text-purple-300 max-w-none overflow-y-auto">
                <p className="whitespace-pre-wrap">{analysis}</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default VideoAnalysis;