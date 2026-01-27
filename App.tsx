
import React, { useState } from 'react';
import Tabs from './components/Tabs';
import InteractiveView from './components/InteractiveView';
import VideoAnalysis from './components/VideoAnalysis';
import AgenticVision from './components/AgenticVision';
import VisionLens from './components/VisionLens';
import ResearchAgent from './components/ResearchAgent';
import ChatAgent from './components/ChatAgent';

export type Tab = 'interactive' | 'lens' | 'video' | 'agentic' | 'research' | 'chat';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('interactive');

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-900 via-purple-900/50 to-gray-900 font-sans">
      <header className="flex items-center justify-between p-4 text-white flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-wider">ERICA 3.0</h1>
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </header>

      <main className="flex-grow flex flex-col overflow-hidden">
        {activeTab === 'interactive' && <InteractiveView />}
        {activeTab === 'lens' && <VisionLens />}
        {activeTab === 'video' && <VideoAnalysis />}
        {activeTab === 'agentic' && <AgenticVision />}
        {activeTab === 'research' && <ResearchAgent />}
        {activeTab === 'chat' && <ChatAgent />}
      </main>
    </div>
  );
};

export default App;