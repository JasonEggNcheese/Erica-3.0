
import { useState, useCallback, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { GroundingSource } from '../types';
import { logError, getFriendlyErrorMessage, ErrorSeverity } from '../utils/errorLogger';

export const useResearchAgent = () => {
    const [query, setQuery] = useState<string>('');
    const [analysis, setAnalysis] = useState<string>('');
    const [sources, setSources] = useState<GroundingSource[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);

    const runQuery = useCallback(async (currentQuery: string) => {
        if (!currentQuery.trim()) {
            setError("Please enter a query.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysis('');
        setSources([]);

        try {
            if (!aiRef.current) {
                if (!process.env.GEMINI_API_KEY) throw new Error("API key not found.");
                aiRef.current = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            }

            const response = await aiRef.current.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: [{ parts: [{ text: currentQuery }] }],
                config: {
                    systemInstruction: "You are a professional research assistant. Use the provided search tools to find accurate, up-to-date information. Synthesize the results into a clear, structured report with citations where appropriate.",
                    tools: [{ googleSearch: {} }],
                },
            });

            setAnalysis(response.text ?? 'No response generated.');
            
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (groundingChunks) {
                 setSources(groundingChunks as GroundingSource[]);
            }

        } catch (err) {
            logError(err, ErrorSeverity.HIGH, { hook: 'useResearchAgent', action: 'runQuery', query: currentQuery });
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    return { query, setQuery, analysis, sources, isLoading, error, runQuery };
};