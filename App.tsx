
import React, { useState } from 'react';
import Tabs from './components/Tabs';
import VoiceConversation from './components/VoiceConversation';
import VideoAnalysis from './components/VideoAnalysis';
import LiveAnalysis from './components/LiveAnalysis';

export type Tab = 'voice' | 'video' | 'live';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('voice');

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-900 via-purple-900/50 to-gray-900 font-sans">
      <header className="flex items-center justify-between p-4 text-white flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-wider">ERICA 3.0</h1>
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </header>

      <main className="flex-grow flex flex-col overflow-hidden">
        {activeTab === 'voice' && <VoiceConversation />}
        {activeTab === 'video' && <VideoAnalysis />}
        {activeTab === 'live' && <LiveAnalysis />}
      </main>
    </div>
  );
};

export default App;