
import React, { useState, useEffect, useRef } from 'react';
import { useAgenticVision } from '../hooks/useAgenticVision';
import { Camera, ScreenShare, Bot, Square, XCircle, Loader2, MousePointerClick, Type, ArrowDown, ArrowUp, CheckCircle2, Hourglass, Lightbulb } from 'lucide-react';
import { AgentAction } from '../types';

const ActionIcon = ({ action_type }: { action_type: AgentAction['action_type'] }) => {
    switch (action_type) {
        case 'CLICK': return <MousePointerClick className="w-5 h-5 text-blue-400" />;
        case 'TYPE': return <Type className="w-5 h-5 text-green-400" />;
        case 'SCROLL': return <ArrowDown className="w-5 h-5 text-yellow-400" />;
        case 'WAIT': return <Hourglass className="w-5 h-5 text-orange-400" />;
        case 'FINISH': return <CheckCircle2 className="w-5 h-5 text-teal-400" />;
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

  // Effect to clear timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRef.current.forEach(clearTimeout);
    };
  }, []);
  
  // Effect to handle resizing of the video element
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

  // Effect to run the action plan visualization sequence
  useEffect(() => {
    timeoutRef.current.forEach(clearTimeout);
    timeoutRef.current = [];
    setActiveActionIndex(null);

    if (analysis && analysis.length > 0) {
      let delay = 500; // Initial delay before starting the sequence
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
        case 'CLICK': 
            return 'Clicking...';
        case 'TYPE': 
            return `Typing: "${action.text_to_type}"`;
        case 'SCROLL': 
            return `Scrolling ${action.scroll_direction}`;
        case 'WAIT': 
            return `Waiting ${action.duration}ms`;
        default: 
            return '';
    }
  };

  const getTooltipStyle = (action: AgentAction | null, rect: DOMRect | null): React.CSSProperties => {
    if (!action || !rect) return { display: 'none' };
    
    if (action.action_type === 'CLICK' && action.x != null && action.y != null) {
        return {
            top: `${action.y * rect.height}px`,
            left: `${action.x * rect.width + 25}px`, // Offset to the right of the click target
            transform: 'translateY(-50%)',
            opacity: 1,
        };
    }
    // Default position for other actions
    return {
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: 1,
    };
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col gap-6 text-white overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        {/* Left Column: Vision Feed and Controls */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-purple-300">1. Start Vision Stream</h2>
            <div ref={containerRef} className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-700 bg-black flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-contain" muted playsInline />
              {!isStreamOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                  <Camera className="w-16 h-16 text-gray-500 mb-4" />
                  <p className="text-gray-400">Vision is off</p>
                </div>
              )}
              {isStreamOn && videoRect && activeAction?.action_type === 'CLICK' && activeAction.x != null && activeAction.y != null && (
                <svg 
                  className="absolute top-0 left-0 pointer-events-none" 
                  width={videoRect.width} 
                  height={videoRect.height}
                  viewBox={`0 0 ${videoRect.width} ${videoRect.height}`}
                  aria-hidden="true"
                >
                  <g transform={`translate(${activeAction.x * videoRect.width}, ${activeAction.y * videoRect.height})`}>
                    <circle r="15" fill="rgba(168, 85, 247, 0.5)" stroke="white" strokeWidth="2"></circle>
                    <circle r="15" fill="transparent" stroke="#a855f7" strokeWidth="2" className="animate-pulse-ring"></circle>
                  </g>
                </svg>
              )}
              <div 
                  className={`absolute z-10 p-2 text-sm bg-black/70 rounded-md shadow-lg transition-opacity duration-300 pointer-events-none ${activeAction ? 'opacity-100' : 'opacity-0'}`}
                  style={getTooltipStyle(activeAction, videoRect)}
              >
                  {getTooltipContent(activeAction)}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button
                    onClick={() => startStream('camera')}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-3 w-full px-6 py-3 text-lg font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Camera className="w-6 h-6" />
                    <span>{streamType === 'camera' ? 'Restart Camera' : 'Start Camera'}</span>
                </button>
                 <button
                    onClick={() => startStream('screen')}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-3 w-full px-6 py-3 text-lg font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 bg-green-700 text-white hover:bg-green-800 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ScreenShare className="w-6 h-6" />
                    <span>{streamType === 'screen' ? 'Reshare Screen' : 'Share Screen'}</span>
                </button>
            </div>
             {isStreamOn && (
                 <button
                    onClick={stopAllStreams}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-3 w-full px-6 py-3 text-lg font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/50 disabled:opacity-50"
                >
                    <Square className="w-6 h-6" />
                    <span>Stop Vision</span>
                </button>
            )}
          </div>
          
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-purple-300">2. Give a Command</h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Find the search bar and type 'hello world'."
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50"
              rows={3}
              disabled={!isStreamOn || isLoading}
              aria-label="Enter your command for the agent"
            />
          </div>

          <button
            onClick={handleExecute}
            disabled={!isStreamOn || !prompt.trim() || isLoading}
            className="flex items-center justify-center space-x-3 w-full px-6 py-3 text-lg font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Bot className="w-6 h-6" />}
            <span>{isLoading ? 'Thinking...' : 'Execute Command'}</span>
          </button>
        </div>

        {/* Right Column: Analysis Result */}
        <div className="flex flex-col gap-4">
           <h2 id="action-plan-heading" className="text-xl font-semibold text-purple-300">3. Action Plan</h2>
            <div className="flex flex-col h-full p-6 bg-gray-800/50 rounded-lg overflow-y-auto">
                {error && (
                  <div role="alert" className="flex items-center space-x-3 p-4 mb-4 bg-red-900/50 text-red-300 rounded-lg">
                    <XCircle className="w-6 h-6 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
                
                {!isLoading && analysis.length === 0 && !error && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Bot className="w-12 h-12 text-gray-500 mb-4" />
                        <p className="text-gray-400">The agent's action plan will appear here.</p>
                    </div>
                )}

                <ul className="space-y-4" aria-labelledby="action-plan-heading">
                    {analysis.map((action, index) => (
                        <li key={index}>
                            <div className={`bg-gray-900/70 p-4 rounded-lg border transition-all duration-300 ${index === activeActionIndex ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-gray-700'}`}>
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 pt-1">
                                        <ActionIcon action_type={action.action_type} />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-lg">{action.action_type}</p>
                                        {action.action_type === 'CLICK' && <p className="text-sm text-gray-300">Coordinates: ({action.x?.toFixed(2)}, {action.y?.toFixed(2)})</p>}
                                        {action.action_type === 'TYPE' && <p className="text-sm text-gray-300">Text: "{action.text_to_type}"</p>}
                                        {action.action_type === 'SCROLL' && <p className="text-sm text-gray-300">Direction: {action.scroll_direction}</p>}
                                        {action.action_type === 'WAIT' && <p className="text-sm text-gray-300">Duration: {action.duration}ms</p>}
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-start gap-3 text-sm text-gray-400">
                                    <Lightbulb className="w-5 h-5 flex-shrink-0 text-yellow-500 mt-0.5" />
                                    <p className="italic">{action.thought}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AgenticVision;
