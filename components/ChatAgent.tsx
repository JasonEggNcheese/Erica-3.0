
import React, { useState, useRef, useEffect } from 'react';
import { useChatAgent } from '../hooks/useChatAgent';
import { ChatMessage, ChatPart } from '../types';
import { Send, Paperclip, XCircle, Loader2, Bot, User, Image as ImageIcon } from 'lucide-react';

const ChatPartView: React.FC<{ part: ChatPart }> = ({ part }) => {
    if (part.inlineData) {
        return (
            <img 
                src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
                alt="User upload"
                className="rounded-lg max-w-sm"
            />
        );
    }
    // Basic markdown-like rendering for bold text
    const renderedText = part.text?.split('**').map((chunk, index) => 
        index % 2 === 1 ? <strong key={index}>{chunk}</strong> : chunk
    );

    return <p className="whitespace-pre-wrap">{renderedText}</p>;
};

const ChatMessageView: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    return (
        <div className={`flex items-start gap-4 ${!isModel ? 'justify-end' : 'justify-start'}`}>
            {isModel && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center" aria-hidden="true">
                    <Bot className="w-6 h-6" />
                </div>
            )}
            <div className={`flex flex-col gap-2 max-w-md lg:max-w-lg`}>
                {message.parts.map((part, index) => (
                     <div key={index} className={`p-4 rounded-2xl ${
                        isModel
                          ? 'bg-gray-700/50 rounded-bl-none'
                          : 'bg-blue-600/50 rounded-br-none'
                      }`}>
                        <ChatPartView part={part} />
                    </div>
                ))}
            </div>
             {!isModel && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center" aria-hidden="true">
                   <User className="w-6 h-6" />
                </div>
            )}
        </div>
    );
};


const ChatAgent: React.FC = () => {
    const { messages, isLoading, error, sendMessage } = useChatAgent();
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

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Necessary to allow drop
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile && droppedFile.type.startsWith('image/')) {
            setFile(droppedFile);
        }
    };

    return (
         <div 
            className="p-4 md:p-6 h-full flex flex-col gap-4 text-white overflow-hidden relative"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {isDragging && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 border-4 border-dashed border-purple-500 rounded-lg">
                    <ImageIcon className="w-16 h-16 text-purple-400 mb-4"/>
                    <p className="text-xl font-semibold">Drop image here</p>
                </div>
            )}
            <div className="flex-grow overflow-y-auto space-y-6 p-2 pr-4 scrollbar-thin">
                {messages.map((msg, index) => <ChatMessageView key={index} message={msg} />)}
                {isLoading && messages[messages.length-1].role === 'model' && (
                    <div className="flex items-start gap-4 justify-start">
                         <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div className="p-4 rounded-2xl bg-gray-700/50 rounded-bl-none">
                            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex-shrink-0 px-2">
                 {error && (
                    <div role="alert" className="flex items-center space-x-3 p-3 mb-2 bg-red-900/50 text-red-300 rounded-lg">
                        <XCircle className="w-6 h-6 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
                <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-2 flex flex-col">
                    {previewUrl && (
                        <div className="relative w-24 h-24 m-2 p-1 border border-gray-600 rounded-lg">
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded" />
                            <button
                                onClick={() => setFile(null)}
                                className="absolute -top-2 -right-2 bg-gray-900 hover:bg-red-600 rounded-full p-1"
                                aria-label="Remove image"
                            >
                                <XCircle className="w-5 h-5"/>
                            </button>
                        </div>
                    )}
                    <div className="flex items-end gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 text-gray-400 hover:text-purple-400 transition-colors"
                            aria-label="Attach image"
                        >
                            <Paperclip className="w-6 h-6" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type a message or add an image..."
                            className="flex-grow bg-transparent p-2 focus:outline-none resize-none max-h-40"
                            rows={1}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || (!prompt.trim() && !file)}
                            className="p-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Send message"
                        >
                           {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatAgent;