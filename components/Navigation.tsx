
import React from 'react';
import { AppView } from '../types';

interface NavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { 
      id: AppView.CHAT, 
      label: 'Journal', 
      description: 'Blake AI',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
      )
    },
    { 
      id: AppView.VISION, 
      label: 'Analysis', 
      description: 'Expert Dialogue',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
      )
    },
    { 
      id: AppView.STUDIO, 
      label: 'Atelier', 
      description: 'Visual Suite',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M3 9h18"></path><path d="M9 21V9"></path></svg>
      )
    },
    { 
      id: AppView.TTS, 
      label: 'Booth', 
      description: 'Neural Vocal',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
      )
    },
    { 
      id: AppView.SETTINGS, 
      label: 'Neural Hub', 
      description: 'System Config',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      )
    }
  ];

  return (
    <nav className="w-52 bg-black/40 border-r border-white/5 flex flex-col h-full z-20 overflow-y-auto">
      <div className="p-6 border-b border-white/5 bg-white/[0.01]">
        <h1 className="text-4xl liquid-glass leading-[0.8]" data-text="Atelier.G">Atelier.G</h1>
        <p className="text-[7px] text-white/20 mt-6 font-bold uppercase tracking-[0.6em] border-t border-white/5 pt-4">Glass Edition</p>
      </div>
      
      <div className="flex-1 py-8 px-4 space-y-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full text-left flex items-center p-3.5 rounded-[16px] transition-all duration-500 etched-button ${
              currentView === item.id ? 'active' : 'text-white/20 hover:text-white/50 hover:bg-white/5'
            }`}
          >
            <div className={`mr-3.5 transition-all duration-500 ${currentView === item.id ? 'scale-110 text-white' : ''}`}>
              {item.icon}
            </div>
            <div>
              <div className="font-semibold text-xs tracking-tight">{item.label}</div>
              <div className="text-[7px] opacity-30 uppercase tracking-[0.2em] mt-0.5 font-bold">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="p-8 border-t border-white/5 bg-black/20">
        <div className="text-[7px] text-white/10 text-center font-bold uppercase tracking-[0.7em]">
          Refractive Core v5.5
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
