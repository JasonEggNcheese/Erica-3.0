
import { useState, useCallback, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';

export const useVideoAnalysis = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const aiRef = useRef<GoogleGenAI | null>(null);
  const isCancelledRef = useRef(false);

  const stopAnalysis = useCallback(() => {
    isCancelledRef.current = true;
    setIsLoading(false);
    setAnalysis('');
    setError(null);
    setProgress(0);
    setProgressMessage('');
  }, []);

  const extractFrames = useCallback(async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.src = URL.createObjectURL(file);

      video.onloadedmetadata = async () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          URL.revokeObjectURL(video.src);
          return reject('Could not get canvas context');
        }

        const maxFrames = 30; // Limit the number of frames to avoid excessive API usage
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const frames: string[] = [];
        const duration = video.duration;
        const interval = duration > maxFrames ? duration / maxFrames : 1;

        for (let i = 0; i < maxFrames; i++) {
          if (isCancelledRef.current) {
            URL.revokeObjectURL(video.src);
            return reject('Analysis cancelled');
          }
          const time = i * interval;
          if (time > duration) break;
            
          video.currentTime = time;
          await new Promise(res => video.onseeked = res);
          
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          frames.push(dataUrl.split(',')[1]);
          setProgress(Math.round(((i + 1) / maxFrames) * 100));
        }
        URL.revokeObjectURL(video.src);
        resolve(frames);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject('Error loading video file.');
      };
    });
  }, []);

  const analyzeVideo = useCallback(async (prompt: string) => {
    if (!videoFile) {
      setError("Please select a video file first.");
      return;
    }
     if (!prompt) {
      setError("Please enter a prompt or question for the analysis.");
      return;
    }

    isCancelledRef.current = false;
    setIsLoading(true);
    setError(null);
    setAnalysis('');
    setProgress(0);
    setProgressMessage('Extracting frames...');

    try {
      if (!aiRef.current) {
        if (!process.env.API_KEY) throw new Error("API key not found.");
        aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
      }

      const frames = await extractFrames(videoFile);
      if (isCancelledRef.current) return;

      setProgressMessage('Analyzing with Gemini...');

      const imageParts = frames.map(frame => ({
        inlineData: {
          mimeType: 'image/jpeg',
          data: frame,
        },
      }));

      const response = await aiRef.current.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [{ text: prompt }, ...imageParts] },
      });
      
      if (isCancelledRef.current) return;
      setAnalysis(response.text ?? "No analysis result found.");

    } catch (err) {
      if (isCancelledRef.current) return;
      console.error("Video analysis failed:", err);
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      if (message !== 'Analysis cancelled') {
        setError(`Failed to analyze video. ${message}`);
      }
    } finally {
      if (!isCancelledRef.current) {
        setIsLoading(false);
        setProgress(0);
        setProgressMessage('');
      }
    }
  }, [videoFile, extractFrames]);

  return { videoFile, setVideoFile, analysis, isLoading, error, progress, progressMessage, analyzeVideo, stopAnalysis, setAnalysis, setError };
};