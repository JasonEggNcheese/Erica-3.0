
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { useAgenticVision } from '../hooks/useAgenticVision';
import { Camera, ScreenShare, Bot, Square, XCircle, Loader2, MousePointerClick, Type, ArrowDown, ArrowUp, CheckCircle2, Hourglass, Lightbulb, Play, Terminal } from 'lucide-react';
import { AgentAction } from '../types';

const ActionIcon = ({ action_type }: { action_type: AgentAction['action_type'] }) => {
    switch (action_type) {
        case 'CLICK': return <MousePointerClick className="w-4 h-4 text-blue-400" />;
        case 'TYPE': return <Type className="w-4 h-4 text-green-400" />;
        case 'SCROLL': return <ArrowDown className="w-4 h-4 text-yellow-400" />;
        case 'WAIT': return <Hourglass className="w-4 h-4 text-orange-400" />;
        case 'FINISH': return <CheckCircle2 className="w-4 h-4 text-teal-400" />;
        default: return null;
    }
}

const AgenticVision: React.FC = () => {
  const { 
    videoRef, 
    isStreamOn, 
    streamType, 
    isLoading, 
    analysis, 
    error, 
    startStream, 
    stopAllStreams, 
    executeCommand 
  } = useAgenticVision();
  const [prompt, setPrompt] = useState<string>('');
  const [activeActionIndex, setActiveActionIndex] = useState<number | null>(null);
  const [videoRect, setVideoRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timeoutRef.current.forEach(clearTimeout);
    };
  }, []);
  
  useEffect(() => {
    const updateRect = () => {
      if (videoRef.current) {
        setVideoRect(videoRef.current.getBoundingClientRect());
      }
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [isStreamOn]);

  useEffect(() => {
    timeoutRef.current.forEach(clearTimeout);
    timeoutRef.current = [];
    setActiveActionIndex(null);

    if (analysis && analysis.length > 0) {
      let delay = 500;
      analysis.forEach((action, index) => {
        const actionDuration = action.action_type === 'WAIT' ? (action.duration || 1000) : 2000;
        
        const timeoutId = window.setTimeout(() => {
          setActiveActionIndex(index);
        }, delay);
        timeoutRef.current.push(timeoutId);

        delay += actionDuration;
      });
      
      const finalTimeoutId = window.setTimeout(() => {
        setActiveActionIndex(null);
      }, delay);
      timeoutRef.current.push(finalTimeoutId);
    }
  }, [analysis]);

  const handleExecute = () => {
    executeCommand(prompt);
  };
  
  const activeAction = activeActionIndex !== null ? analysis[activeActionIndex] : null;

  const getTooltipContent = (action: AgentAction | null): string => {
    if (!action) return '';
    switch (action.action_type) {
        case 'CLICK': return 'Clicking...';
        case 'TYPE': return `Typing: "${action.text_to_type}"`;
        case 'SCROLL': return `Scrolling ${action.scroll_direction}`;
        case 'WAIT': return `Waiting ${action.duration}ms`;
        default: return '';
    }
  };

  const getTooltipStyle = (action: AgentAction | null, rect: DOMRect | null): React.CSSProperties => {
    if (!action || !rect) return { display: 'none' };
    
    if (action.action_type === 'CLICK' && action.x != null && action.y != null) {
        return {
            top: `${action.y * rect.height}px`,
            left: `${action.x * rect.width + 25}px`,
            transform: 'translateY(-50%)',
            opacity: 1,
        };
    }
    return {
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: 1,
    };
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto w-full p-8 gap-10 overflow-hidden">
      <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-white/[0.03] rounded-xl border border-white/5">
                  <Bot className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-mono font-bold">Autonomous Vision Agent</h2>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-grow min-h-0">
        {/* Left Column: Vision Feed and Controls */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          <div className="flex flex-col gap-6">
            <div ref={containerRef} className="relative aspect-video rounded-[2rem] overflow-hidden glass-panel bg-black/40 group">
              <video ref={videoRef} className="w-full h-full object-cover grayscale-[0.3] contrast-[1.1] brightness-[0.9]" muted playsInline />
              <AnimatePresence>
                {!isStreamOn && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-5">
                        <Bot className="w-8 h-8 text-white/10" />
                    </div>
                    <p className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-mono">Agent Offline</p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {isStreamOn && videoRect && activeAction?.action_type === 'CLICK' && activeAction.x != null && activeAction.y != null && (
                <svg className="absolute top-0 left-0 pointer-events-none w-full h-full" viewBox={`0 0 ${videoRect.width} ${videoRect.height}`}>
                  <g transform={`translate(${activeAction.x * videoRect.width}, ${activeAction.y * videoRect.height})`}>
                    <motion.circle 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        r="15" fill="rgba(168, 85, 247, 0.3)" stroke="white" strokeWidth="1" 
                    />
                    <circle r="15" fill="transparent" stroke="#a855f7" strokeWidth="2" className="animate-pulse-ring" />
                  </g>
                </svg>
              )}
              <div 
                  className={`absolute z-10 px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-mono bg-black/80 backdrop-blur-md border border-white/10 rounded-full shadow-2xl transition-opacity duration-500 pointer-events-none ${activeAction ? 'opacity-100' : 'opacity-0'}`}
                  style={getTooltipStyle(activeAction, videoRect)}
              >
                  {getTooltipContent(activeAction)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
                 <button
                    onClick={() => startStream('camera')}
                    disabled={isLoading}
                    className={`flex items-center justify-center gap-4 px-8 py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 ${streamType === 'camera' ? 'bg-purple-600 text-white shadow-[0_10px_30px_rgba(168,85,247,0.2)]' : 'bg-white/[0.03] border border-white/10 text-white/40 hover:bg-white/[0.08]'}`}
                >
                    <Camera className="w-4 h-4" />
                    <span>{streamType === 'camera' ? 'Reset Cam' : 'Camera'}</span>
                </button>
                 <button
                    onClick={() => startStream('screen')}
                    disabled={isLoading}
                    className={`flex items-center justify-center gap-4 px-8 py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 ${streamType === 'screen' ? 'bg-purple-600 text-white shadow-[0_10px_30px_rgba(168,85,247,0.2)]' : 'bg-white/[0.03] border border-white/10 text-white/40 hover:bg-white/[0.08]'}`}
                >
                    <ScreenShare className="w-4 h-4" />
                    <span>{streamType === 'screen' ? 'Reset Screen' : 'Screen'}</span>
                </button>
            </div>
             {isStreamOn && (
                 <button
                    onClick={stopAllStreams}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-4 w-full py-5 bg-white/[0.03] border border-white/10 text-white/40 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all duration-500"
                >
                    <Square className="w-4 h-4" />
                    <span>Terminate Stream</span>
                </button>
            )}
          </div>
          
          <div className="glass-panel rounded-[2rem] p-10 flex flex-col gap-8 bg-white/[0.01]">
            <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-mono">Neural Command Input</span>
                <Bot className="w-4 h-4 text-purple-400/20" />
            </div>
            <div className="flex gap-6">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Find the search bar and type 'hello world'."
                  className="flex-grow p-6 bg-white/[0.02] border border-white/10 rounded-[2rem] text-sm font-light focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all outline-none resize-none placeholder:text-white/10 tracking-wide"
                  rows={2}
                  disabled={!isStreamOn || isLoading}
                />
                <button
                    onClick={handleExecute}
                    disabled={!isStreamOn || !prompt.trim() || isLoading}
                    className="flex-shrink-0 w-20 h-20 flex items-center justify-center bg-white text-black rounded-[2rem] hover:scale-105 transition-all disabled:opacity-10 disabled:grayscale shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
                >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
                </button>
            </div>
          </div>
        </div>

        {/* Right Column: Analysis Result */}
        <div className="lg:col-span-5 flex flex-col min-h-0">
            <div className="glass-panel rounded-[2rem] flex flex-col h-full overflow-hidden bg-white/[0.01]">
                <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Terminal className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-mono">Execution Sequence</span>
                    </div>
                    {isLoading && <div className="flex gap-1.5">
                        {[0, 1, 2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
                    </div>}
                </div>
                
                <div className="flex-grow p-10 overflow-y-auto scrollbar-thin">
                    <AnimatePresence mode="wait">
                        {error && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-4 p-5 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-400 text-xs mb-8"
                          >
                            <XCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                          </motion.div>
                        )}
                        
                        {!isLoading && analysis.length === 0 && !error && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-full text-center gap-5"
                            >
                                <Bot className="w-10 h-10 text-white/5" />
                                <p className="text-[9px] uppercase tracking-[0.4em] text-white/10 font-mono">Awaiting Command</p>
                            </motion.div>
                        )}

                        <div className="space-y-6">
                            {analysis.map((action, index) => {
                                const actionKey = `action-${index}-${action.action_type}-${action.thought.substring(0, 10)}`;
                                return (
                                    <motion.div 
                                        key={actionKey}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`
                                            p-6 rounded-[1.5rem] border transition-all duration-700
                                            ${index === activeActionIndex 
                                                ? 'bg-white/[0.05] border-white/20 shadow-[0_10px_30px_rgba(255,255,255,0.05)]' 
                                                : 'bg-white/[0.01] border-white/5'
                                            }
                                        `}
                                    >
                                        <div className="flex items-start gap-5">
                                            <div className={`p-2.5 rounded-xl ${index === activeActionIndex ? 'bg-purple-600/20' : 'bg-white/5'}`}>
                                                <ActionIcon action_type={action.action_type} />
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/80">{action.action_type}</span>
                                                    <span className="text-[8px] font-mono text-white/20">STEP 0{index + 1}</span>
                                                </div>
                                                <div className="text-[9px] text-white/30 font-mono lowercase tracking-wider">
                                                    {action.action_type === 'CLICK' && `target: ${action.x?.toFixed(2)}, ${action.y?.toFixed(2)}`}
                                                    {action.action_type === 'TYPE' && `input: "${action.text_to_type}"`}
                                                    {action.action_type === 'SCROLL' && `dir: ${action.scroll_direction}`}
                                                    {action.action_type === 'WAIT' && `delay: ${action.duration}ms`}
                                                </div>
                                                <div className="mt-4 flex items-start gap-2">
                                                    <Lightbulb className="w-3 h-3 text-yellow-500/20 mt-0.5" />
                                                    <div className="text-xs text-white/60 font-light italic leading-relaxed markdown-body">
                                                        <Markdown>{action.thought}</Markdown>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AgenticVision;
