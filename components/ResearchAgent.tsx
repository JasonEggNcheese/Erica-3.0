
import React from 'react';
import { useResearchAgent } from '../hooks/useResearchAgent';
import { Search, Loader2, XCircle, Globe } from 'lucide-react';

const ResearchAgent: React.FC = () => {
    const { query, setQuery, analysis, sources, isLoading, error, runQuery } = useResearchAgent();

    const handleSearch = () => {
        runQuery(query);
    };

    return (
        <div className="p-4 md:p-8 h-full flex flex-col gap-6 text-white overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Left Column: Query Input */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                        <h2 className="text-xl font-semibold text-purple-300">1. Ask a Question</h2>
                        <p className="text-gray-400">Ask a question about recent events or anything that requires up-to-date information from the web.</p>
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="e.g., Who won the latest F1 race and what were the key moments?"
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50"
                            rows={5}
                            disabled={isLoading}
                            aria-label="Enter your research query"
                        />
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={isLoading || !query.trim()}
                        className="flex items-center justify-center space-x-3 w-full px-6 py-3 text-lg font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                        <span>{isLoading ? 'Searching...' : 'Search with Gemini'}</span>
                    </button>
                </div>

                {/* Right Column: Analysis Result */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold text-purple-300">2. Research Results</h2>
                    <div className="flex flex-col h-full p-6 bg-gray-800/50 rounded-lg space-y-4 overflow-y-auto">
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <Loader2 className="animate-spin w-8 h-8 text-purple-400 mb-4" />
                                <p className="text-lg">Searching the web and generating an answer...</p>
                            </div>
                        )}

                        {error && !isLoading && (
                            <div role="alert" className="flex items-center space-x-3 p-4 bg-red-900/50 text-red-300 rounded-lg">
                                <XCircle className="w-6 h-6 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        {!isLoading && !analysis && !error && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <Search className="w-12 h-12 text-gray-500 mb-4" />
                                <p className="text-gray-400">Research results will appear here.</p>
                            </div>
                        )}

                        {analysis && (
                            <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-purple-300 max-w-none">
                                <p className="whitespace-pre-wrap">{analysis}</p>
                            </div>
                        )}

                        {sources.length > 0 && (
                            <div className="pt-4 mt-4 border-t border-gray-700">
                                <h3 className="text-lg font-semibold text-purple-300 mb-2 flex items-center gap-2">
                                    <Globe className="w-5 h-5" />
                                    Sources
                                </h3>
                                <ul className="space-y-2 list-disc pl-5">
                                    {sources.map((source, index) => source.web && (
                                        <li key={index}>
                                            <a 
                                                href={source.web.uri} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 hover:underline"
                                            >
                                                {source.web.title || source.web.uri}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResearchAgent;