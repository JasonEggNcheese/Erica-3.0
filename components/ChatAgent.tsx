
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { useChatAgent } from '../hooks/useChatAgent';
import { ChatMessage, ChatPart } from '../types';
import { Send, Paperclip, XCircle, Loader2, Bot, User, Image as ImageIcon, Sparkles } from 'lucide-react';

const ChatPartView: React.FC<{ part: ChatPart }> = ({ part }) => {
    if (part.inlineData) {
        return (
            <motion.img 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
                alt="User upload"
                className="rounded-xl max-w-sm border border-white/10 shadow-lg"
            />
        );
    }

    return (
        <div className="markdown-body">
            <Markdown>{part.text || ''}</Markdown>
        </div>
    );
};

const ChatMessageView: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-4 ${!isModel ? 'flex-row-reverse' : 'flex-row'}`}
        >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-white/10 ${isModel ? 'bg-purple-600/20' : 'bg-white/10'}`}>
                {isModel ? <Bot className="w-4 h-4 text-purple-400" /> : <User className="w-4 h-4 text-white/60" />}
            </div>
            <div className={`flex flex-col gap-2 max-w-[80%]`}>
                {message.parts.map((part, index) => {
                     const partKey = `part-${index}-${part.text?.substring(0, 10) || 'media'}`;
                     return (
                         <div key={partKey} className={`p-4 rounded-2xl text-sm font-light ${
                            isModel
                              ? 'glass-panel rounded-tl-none text-white/80'
                              : 'bg-purple-600/20 border border-purple-500/30 rounded-tr-none text-white'
                          }`}>
                            <ChatPartView part={part} />
                        </div>
                     );
                })}
            </div>
        </motion.div>
    );
};


interface ChatAgentProps {
    initialMessage?: string | null;
}

const ChatAgent: React.FC<ChatAgentProps> = ({ initialMessage }) => {
    const { messages, isLoading, error, sendMessage } = useChatAgent(initialMessage);
    const [prompt, setPrompt] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreviewUrl(null);
    }, [file]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
        }
    };

    const handleSend = () => {
        if (isLoading || (!prompt.trim() && !file)) return;
        sendMessage(prompt, file);
        setPrompt('');
        setFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
         <div 
            className="h-full flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-8 gap-4 sm:gap-6 relative"
            onDragEnter={() => setIsDragging(true)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile?.type.startsWith('image/')) setFile(droppedFile);
            }}
        >
            <AnimatePresence>
                {isDragging && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-purple-600/10 backdrop-blur-md flex flex-col items-center justify-center z-50 border-2 border-dashed border-purple-500/50 rounded-3xl m-8"
                    >
                        <ImageIcon className="w-12 h-12 text-purple-400 mb-2 animate-bounce"/>
                        <p className="text-sm font-mono uppercase tracking-widest text-purple-300">Drop to analyze</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-grow min-h-0 overflow-y-auto space-y-8 pr-4 scrollbar-thin">
                {messages.map((msg, index) => {
                    const msgKey = `msg-${index}-${msg.role}-${msg.parts[0]?.text?.substring(0, 10) || 'media'}`;
                    return <ChatMessageView key={msgKey} message={msg} />;
                })}
                {isLoading && messages[messages.length-1].role === 'model' && (
                    <div className="flex items-start gap-4 flex-row">
                         <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-white/10 bg-purple-600/20">
                            <Bot className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="p-4 rounded-2xl glass-panel rounded-tl-none">
                            <div className="flex gap-1">
                                {[0, 1, 2].map(i => (
                                    <motion.div 
                                        key={i}
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                        className="w-1.5 h-1.5 rounded-full bg-purple-400"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex-shrink-0">
                 <AnimatePresence>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex items-center gap-2 px-4 py-2 mb-4 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-[9px] uppercase tracking-[0.2em] font-mono"
                        >
                            <XCircle className="w-3 h-3" />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="glass-panel rounded-[1.5rem] sm:rounded-[2rem] p-1 sm:p-2 flex flex-col gap-1 sm:gap-2 bg-white/[0.01]">
                    {previewUrl && (
                        <div className="relative w-16 h-16 sm:w-24 sm:h-24 m-2 sm:m-3 group">
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl" />
                            <button
                                onClick={() => setFile(null)}
                                className="absolute -top-2 -right-2 bg-black/80 backdrop-blur-md border border-white/10 text-white rounded-full p-1 sm:p-1.5 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/80"
                            >
                                <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5"/>
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 pb-1">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 sm:p-3.5 text-white/20 hover:text-purple-400 transition-all hover:scale-110 active:scale-95"
                            title="Attach Image"
                        >
                            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Message ERICA..."
                            className="flex-grow bg-transparent py-3 sm:py-5 px-2 sm:px-3 text-xs sm:text-sm font-light focus:outline-none placeholder:text-white/10 tracking-wide"
                        />
                        
                        <button
                            onClick={handleSend}
                            disabled={isLoading || (!prompt.trim() && !file)}
                            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-purple-600 hover:border-purple-500 transition-all disabled:opacity-10 disabled:grayscale group"
                        >
                           {isLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatAgent;
