
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { useResearchAgent } from '../hooks/useResearchAgent';
import { Search, Loader2, XCircle, Globe, Sparkles, ArrowRight } from 'lucide-react';

const ResearchAgent: React.FC = () => {
    const { query, setQuery, analysis, sources, isLoading, error, runQuery } = useResearchAgent();

    const handleSearch = () => {
        runQuery(query);
    };

    return (
        <div className="h-full flex flex-col max-w-7xl mx-auto w-full p-8 gap-10 overflow-hidden">
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/[0.03] rounded-xl border border-white/5">
                    <Globe className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-mono font-bold">Global Research Engine</h2>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-grow min-h-0">
            {/* Left Column: Query Input */}
            <div className="lg:col-span-5 flex flex-col gap-8">
                <div className="glass-panel rounded-[2rem] p-10 flex flex-col gap-8 bg-white/[0.01]">
                    <div className="flex flex-col gap-3">
                        <h3 className="text-lg font-light tracking-tight text-white">Ask anything</h3>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono leading-relaxed">ERICA will search the web in real-time to provide accurate, cited information.</p>
                    </div>
                    
                    <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., What are the latest breakthroughs in sustainable energy?"
                        className="w-full p-6 bg-white/[0.02] border border-white/10 rounded-[2rem] text-sm font-light focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all outline-none resize-none placeholder:text-white/10 tracking-wide"
                        rows={6}
                        disabled={isLoading}
                    />

                    <button
                        onClick={handleSearch}
                        disabled={isLoading || !query.trim()}
                        className={`
                            group flex items-center justify-center gap-4 w-full py-5 rounded-2xl font-bold uppercase tracking-[0.3em] text-[10px] transition-all duration-500
                            ${isLoading 
                                ? 'bg-white/[0.03] border border-white/10 text-white/40' 
                                : 'bg-white text-black shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:scale-[1.02] disabled:opacity-10 disabled:grayscale'
                            }
                        `}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        <span>{isLoading ? 'Processing' : 'Initialize Search'}</span>
                        {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </button>
                </div>
            </div>

            {/* Right Column: Analysis Result */}
            <div className="lg:col-span-7 flex flex-col min-h-0">
                <div className="glass-panel rounded-[2rem] flex flex-col h-full overflow-hidden bg-white/[0.01]">
                    <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                        <span className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-mono">Synthesis Result</span>
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
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                        <Sparkles className="w-8 h-8 text-white/5" />
                                    </div>
                                    <p className="text-[9px] uppercase tracking-[0.4em] text-white/10 font-mono">Awaiting Input</p>
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
                                    
                                    {sources.length > 0 && (
                                        <div className="mt-16 pt-10 border-t border-white/5">
                                            <h4 className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-mono mb-8">Verified Sources</h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                {sources.map((source, index) => source.web && (
                                                    <a 
                                                        key={index}
                                                        href={source.web.uri} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all duration-500 group"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/5 group-hover:border-purple-500/30 transition-colors">
                                                                <Globe className="w-4 h-4 text-white/20 group-hover:text-purple-400 transition-colors" />
                                                            </div>
                                                            <span className="text-xs font-light text-white/40 group-hover:text-white/80 transition-colors truncate max-w-[300px] tracking-wide">
                                                                {source.web.title || source.web.uri}
                                                            </span>
                                                        </div>
                                                        <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
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

export default ResearchAgent;
