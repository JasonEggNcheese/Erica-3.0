
import React from 'react';
import { PlusCircle } from 'lucide-react';

interface NewConversationButtonProps {
  onClick: () => void;
  disabled: boolean;
}

const NewConversationButton: React.FC<NewConversationButtonProps> = ({ onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center space-x-2 px-4 py-2 text-[10px] uppercase tracking-widest font-mono font-bold text-white/40 bg-white/[0.03] border border-white/10 rounded-full hover:bg-white/[0.08] hover:text-white/60 transition-all duration-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 disabled:opacity-20 disabled:cursor-not-allowed"
      aria-label="Start new conversation"
    >
      <PlusCircle className="w-3.5 h-3.5" />
      <span>Reset</span>
    </button>
  );
};

export default NewConversationButton;
