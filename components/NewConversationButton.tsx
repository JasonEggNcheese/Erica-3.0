
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
      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-700/70 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Start new conversation"
    >
      <PlusCircle className="w-4 h-4" />
      <span>New Conversation</span>
    </button>
  );
};

export default NewConversationButton;
