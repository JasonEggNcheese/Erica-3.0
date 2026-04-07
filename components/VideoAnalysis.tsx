
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { useVideoAnalysis } from '../hooks/useVideoAnalysis';
import { UploadCloud, Film, Wand2, XCircle, Loader2, Square, Sparkles, FileVideo, Info } from 'lucide-react';

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
      setPrompt('');
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

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto w-full p-8 gap-10 overflow-hidden">
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/[0.03] rounded-xl border border-white/5">
                    <Film className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-mono font-bold">Neural Video Processor</h2>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-grow min-h-0">
            {/* Left Column: Upload and Preview */}
            <div className="lg:col-span-5 flex flex-col gap-8">
                <div className="relative aspect-video rounded-[2rem] overflow-hidden glass-panel bg-black/40 group">
                    {videoSrc ? (
                        <div className="relative w-full h-full">
                            <video src={videoSrc} className="w-full h-full object-contain grayscale-[0.2] brightness-[0.9]" controls />
                            <button 
                                onClick={() => setVideoFile(null)} 
                                className="absolute top-6 right-6 bg-black/60 backdrop-blur-md border border-white/10 text-white rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/80 z-20"
                                disabled={isLoading}
                            >
                                <XCircle className="w-4 h-4"/>
                            </button>
                        </div>
                    ) : (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.02] transition-colors"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-5 group-hover:scale-110 transition-transform">
                                <UploadCloud className="w-8 h-8 text-white/10" />
                            </div>
                            <p className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-mono">Select Video Source</p>
                            <p className="text-[8px] text-white/10 mt-3 font-mono uppercase tracking-widest">MP4, MOV, WEBM</p>
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
                </div>

                <div className="glass-panel rounded-[2rem] p-10 flex flex-col gap-8 bg-white/[0.01]">
                    <div className="flex flex-col gap-3">
                        <h3 className="text-lg font-light tracking-tight text-white">Analysis Parameters</h3>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono leading-relaxed">Define visual interpretation goals.</p>
                    </div>
                    
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="What should ERICA analyze?"
                        className="w-full p-5 bg-white/[0.02] border border-white/10 rounded-2xl text-sm font-light focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all outline-none resize-none placeholder:text-white/10 tracking-wide"
                        rows={4}
                        disabled={isLoading || !videoFile}
                    />

                    <button
                        onClick={handleButtonClick}
                        disabled={buttonDisabled}
                        className={`
                            group flex items-center justify-center gap-4 w-full py-5 rounded-2xl font-bold uppercase tracking-[0.3em] text-[10px] transition-all duration-500
                            ${isLoading 
                                ? 'bg-white/[0.03] border border-white/10 text-red-400/80 hover:bg-red-500/10 hover:border-red-500/30' 
                                : 'bg-white text-black shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:scale-[1.02] disabled:opacity-10 disabled:grayscale'
                            }
                        `}
                    >
                        {isLoading ? <Square className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                        <span>{isLoading ? 'Terminate' : 'Initialize'}</span>
                    </button>
                </div>
            </div>

            {/* Right Column: Analysis Result */}
            <div className="lg:col-span-7 flex flex-col min-h-0">
                <div className="glass-panel rounded-[2rem] flex flex-col h-full overflow-hidden bg-white/[0.01]">
                    <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                        <span className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-mono">Interpretation Result</span>
                        {isLoading && <div className="flex gap-1.5">
                            {[0, 1, 2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
                        </div>}
                    </div>
                    
                    <div className="flex-grow p-10 overflow-y-auto scrollbar-thin">
                        <AnimatePresence mode="wait">
                            {isLoading && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center h-full text-center gap-8"
                                >
                                    <div className="relative w-full max-w-xs">
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div 
                                                className="h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <div className="mt-6 flex justify-between items-center">
                                            <span className="text-[9px] uppercase tracking-[0.3em] text-white/30 font-mono">{progressMessage}</span>
                                            <span className="text-[10px] font-mono text-purple-400">{progress}%</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {error && !isLoading && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-4 p-5 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-400 text-xs font-light"
                                >
                                    <XCircle className="w-5 h-5 flex-shrink-0" />
                                    <p>{error}</p>
                                </motion.div>
                            )}

                            {!isLoading && !analysis && !error && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center h-full text-center gap-5"
                                >
                                    <FileVideo className="w-10 h-10 text-white/5" />
                                    <p className="text-[9px] uppercase tracking-[0.4em] text-white/10 font-mono">Awaiting Data</p>
                                </motion.div>
                            )}

                            {analysis && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="prose prose-invert prose-p:text-white/60 prose-p:font-light prose-p:leading-relaxed prose-headings:text-white max-w-none"
                                >
                                    <div className="markdown-body">
                                        <Markdown>{analysis}</Markdown>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default VideoAnalysis;
