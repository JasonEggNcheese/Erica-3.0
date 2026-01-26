
import React from 'react';
import { Mic, Video, Camera } from 'lucide-react';
import { Tab } from '../App';

interface TabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'voice', label: 'Voice Conversation', icon: Mic },
    { id: 'video', label: 'Video Analysis', icon: Video },
    { id: 'live', label: 'Live Analysis', icon: Camera },
  ];

  return (
    <div className="flex space-x-2 p-1 bg-gray-800/50 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as Tab)}
          className={`${
            activeTab === tab.id
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
          } flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500`}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          <tab.icon className="w-5 h-5" />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default Tabs;