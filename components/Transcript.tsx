
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
    <ul className="space-y-6">
      {transcript.map((turn, index) => {
        const isUser = turn.speaker === Speaker.USER;
        return (
          <li key={index} className={`flex items-start gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-sm" aria-hidden="true">
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
              <p className="text-white whitespace-pre-wrap">
                <span className="sr-only">{isUser ? 'You said: ' : 'ERICA said: '}</span>
                {turn.text}
              </p>
            </div>
             {isUser && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center font-bold text-sm" aria-hidden="true">
                You
              </div>
            )}
          </li>
        );
      })}
      <div ref={endOfMessagesRef} />
    </ul>
  );
};

export default Transcript;