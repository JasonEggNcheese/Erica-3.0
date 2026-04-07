
import React, { useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
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
        const turnKey = `${turn.speaker}-${index}-${turn.text.substring(0, 10)}`;
        return (
          <li key={turnKey} className={`flex items-start gap-2 sm:gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-sm ${isUser ? 'bg-white/10 text-white/40' : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'}`} aria-hidden="true">
              {isUser ? 'U' : 'E'}
            </div>
            <div
              className={`max-w-[85%] sm:max-w-md lg:max-w-lg p-3 sm:p-4 rounded-2xl ${
                isUser
                  ? 'bg-blue-600/30 border border-blue-500/20 rounded-tr-none'
                  : 'bg-white/[0.03] border border-white/5 rounded-tl-none'
              } ${!turn.isFinal ? 'opacity-70' : 'opacity-100'}`}
            >
              <div className="text-white/90 text-xs sm:text-sm markdown-body leading-relaxed">
                <span className="sr-only">{isUser ? 'You said: ' : 'ERICA said: '}</span>
                <Markdown>{turn.text}</Markdown>
              </div>
            </div>
          </li>
        );
      })}
      <div ref={endOfMessagesRef} />
    </ul>
  );
};

export default Transcript;
