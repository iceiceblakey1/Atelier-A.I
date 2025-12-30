
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
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
      )
    },
    { 
      id: AppView.VISION, 
      label: 'Analysis', 
      description: 'Expert Dialogue',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
          <path d="M2 12h20"></path>
        </svg>
      )
    },
    { 
      id: AppView.STUDIO, 
      label: 'Atelier', 
      description: 'The Studio',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <path d="M3 9h18"></path>
          <path d="M9 21V9"></path>
        </svg>
      )
    }
  ];

  return (
    <nav className="w-52 bg-black/40 border-r border-white/5 flex flex-col h-full z-20">
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
          Refractive Core v5.0
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
