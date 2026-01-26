
import React, { useRef, useEffect } from 'react';
import { ConversationTurn, Speaker } from '../types';

interface TranscriptProps {
  transcript: ConversationTurn[];
}

const Transcript: React.FC<TranscriptProps> = ({ transcript }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

  return (
    <div className="space-y-6">
      {transcript.map((turn, index) => {
        const isUser = turn.speaker === Speaker.USER;
        return (
          <div key={index} className={`flex items-start gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-sm">
                E
              </div>
            )}
            <div
              className={`max-w-md lg:max-w-lg p-4 rounded-2xl ${
                isUser
                  ? 'bg-blue-600/50 rounded-br-none'
                  : 'bg-gray-700/50 rounded-bl-none'
              } ${!turn.isFinal ? 'opacity-70' : 'opacity-100'}`}
            >
              <p className="text-white whitespace-pre-wrap">{turn.text}</p>
            </div>
             {isUser && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center font-bold text-sm">
                You
              </div>
            )}
          </div>
        );
      })}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default Transcript;
