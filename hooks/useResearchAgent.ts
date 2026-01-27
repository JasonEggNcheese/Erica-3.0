
import { useState, useCallback, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { GroundingSource } from '../types';

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
                if (!process.env.API_KEY) throw new Error("API key not found.");
                aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
            }

            const response = await aiRef.current.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: currentQuery,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });

            setAnalysis(response.text ?? 'No response generated.');
            
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (groundingChunks) {
                 setSources(groundingChunks as GroundingSource[]);
            }

        } catch (err) {
            console.error("Research query failed:", err);
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Failed to get response. ${message}`);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    return { query, setQuery, analysis, sources, isLoading, error, runQuery };
};