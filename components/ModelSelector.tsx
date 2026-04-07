
import React from 'react';
import { ModelId, availableModels } from '../types';
import { Cpu } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: ModelId;
  onModelChange: (modelId: ModelId) => void;
  disabled: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange, disabled }) => {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="model-select" className="text-sm text-gray-400 sr-only">Model:</label>
      <div className="relative group">
        <select
          id="model-select"
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value as ModelId)}
          disabled={disabled}
          className="bg-white/[0.03] border border-white/10 text-white text-[10px] uppercase tracking-widest font-mono rounded-full block w-full py-2 pl-8 pr-10 transition-all duration-500 focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none disabled:opacity-20 disabled:cursor-not-allowed appearance-none"
          style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.2em 1.2em',
          }}
        >
          {availableModels.map((model) => (
            <option key={model.id} value={model.id} className="bg-gray-900">
              {model.name}
            </option>
          ))}
        </select>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Cpu className="w-3 h-3 text-white/20 group-hover:text-purple-400 transition-colors" />
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
