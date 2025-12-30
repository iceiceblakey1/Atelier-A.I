
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import ChatView from './components/ChatView';
import VisionView from './components/VisionView';
import StudioView from './components/StudioView';
import { AppView } from './types';

const NeonFraming: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="neon-bar neon-bar-top" />
      <div className="neon-bar neon-bar-bottom" />
      <div className="neon-bar neon-bar-left" />
      <div className="neon-bar neon-bar-right" />
    </div>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [isNavOpen, setIsNavOpen] = useState(true);
  
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Unsaved masterpieces will be destroyed upon exit.";
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case AppView.CHAT: return <ChatView />;
      case AppView.VISION: return <VisionView />;
      case AppView.STUDIO: return <StudioView />;
      default: return <ChatView />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-black text-[#e5e5e5] p-6 md:p-8 lg:p-16 relative overflow-hidden transition-all duration-700">
      <NeonFraming />
      
      <div className="flex w-full h-full overflow-hidden glass-panel rounded-[40px] z-10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative">
        <div className={`transition-all duration-700 ease-in-out flex shrink-0 overflow-hidden ${isNavOpen ? 'w-52' : 'w-0 opacity-0'}`}>
          <Navigation currentView={currentView} onViewChange={setCurrentView} />
        </div>

        <main className="flex-1 h-full relative overflow-hidden flex flex-col bg-black/5">
          {/* Toggle Navigation Button */}
          <div className="absolute top-6 left-6 z-50 flex gap-4">
            <button 
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="p-4 etched-button rounded-xl text-white/30 hover:text-white transition-all active:scale-95 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
