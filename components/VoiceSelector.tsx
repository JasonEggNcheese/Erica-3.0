
import React from 'react';
import { VoiceId, availableVoices } from '../types';

interface VoiceSelectorProps {
  selectedVoice: VoiceId;
  onVoiceChange: (voice: VoiceId) => void;
  disabled: boolean;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onVoiceChange, disabled }) => {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="voice-select" className="text-sm text-gray-400 sr-only">Voice:</label>
      <select
        id="voice-select"
        value={selectedVoice}
        onChange={(e) => onVoiceChange(e.target.value as VoiceId)}
        disabled={disabled}
        className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2 pr-8 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
        }}
      >
        {availableVoices.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VoiceSelector;
