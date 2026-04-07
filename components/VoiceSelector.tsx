
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
        className="bg-white/[0.03] border border-white/10 text-white text-[10px] uppercase tracking-widest font-mono rounded-full block w-full py-2 px-4 pr-10 transition-all duration-500 focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none disabled:opacity-20 disabled:cursor-not-allowed appearance-none"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.75rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.2em 1.2em',
        }}
      >
        {availableVoices.map((voice) => (
          <option key={voice.id} value={voice.id} className="bg-gray-900">
            {voice.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VoiceSelector;
