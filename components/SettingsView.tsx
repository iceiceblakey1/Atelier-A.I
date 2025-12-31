
import React, { useState, useEffect } from 'react';
import { GlobalNeuralState, LocalNeuralConfig } from '../types';

const SettingsView: React.FC = () => {
  const [config, setConfig] = useState<GlobalNeuralState>({
    chat: { enabled: false, endpoint: 'http://localhost:11434/api/generate', modelName: 'llama3' },
    vision: { enabled: false, endpoint: 'http://localhost:11434/api/generate', modelName: 'llava' },
    studio: { enabled: false, endpoint: 'http://localhost:5000/v1/generation', modelName: 'sdxl' },
    tts: { enabled: false, endpoint: 'http://localhost:8000/tts', modelName: 'bark' }
  });

  useEffect(() => {
    const stored = localStorage.getItem('neural_config');
    if (stored) setConfig(JSON.parse(stored));
  }, []);

  const saveConfig = (newConfig: GlobalNeuralState) => {
    setConfig(newConfig);
    localStorage.setItem('neural_config', JSON.stringify(newConfig));
  };

  const updateModule = (module: keyof GlobalNeuralState, updates: Partial<LocalNeuralConfig>) => {
    const newConfig = { ...config, [module]: { ...config[module], ...updates } };
    saveConfig(newConfig);
  };

  const ModuleConfig: React.FC<{ 
    title: string; 
    moduleKey: keyof GlobalNeuralState; 
    description: string;
  }> = ({ title, moduleKey, description }) => {
    const m = config[moduleKey];
    return (
      <div className="glass-panel p-8 rounded-[32px] border border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-1">{title}</h4>
            <p className="text-[10px] text-white/30 italic">{description}</p>
          </div>
          <button 
            onClick={() => updateModule(moduleKey, { enabled: !m.enabled })}
            className={`px-6 py-2 rounded-full border text-[9px] font-bold uppercase tracking-widest transition-all ${m.enabled ? 'border-blue-500/40 bg-blue-500/10 text-blue-400' : 'border-white/5 text-white/20'}`}
          >
            {m.enabled ? 'Local Active' : 'Gemini Cloud'}
          </button>
        </div>

        {m.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label className="text-[7px] font-bold text-white/10 uppercase tracking-widest px-2">Neural Endpoint</label>
              <input 
                type="text" 
                value={m.endpoint} 
                onChange={(e) => updateModule(moduleKey, { endpoint: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-[10px] text-white/60 focus:border-white/10 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[7px] font-bold text-white/10 uppercase tracking-widest px-2">Model Identifier</label>
              <input 
                type="text" 
                value={m.modelName} 
                onChange={(e) => updateModule(moduleKey, { modelName: e.target.value })}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-[10px] text-white/60 focus:border-white/10 outline-none"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-transparent relative overflow-hidden">
      <header className="sticky top-0 z-40 w-full glass-panel illuminated-glass border-b border-white/5 pb-4 pt-6 px-8 flex items-center justify-center bg-black/20 backdrop-blur-md">
        <div className="text-center">
          <span className="text-[8px] font-bold text-white/10 tracking-[0.8em] uppercase block mb-1">System Architecture</span>
          <h2 className="text-5xl liquid-glass leading-none" data-text="Neural Hub">Neural Hub</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 md:p-12 lg:px-24 space-y-12 pb-40">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="p-8 bg-blue-500/5 rounded-[40px] border border-blue-500/10">
            <h3 className="text-blue-400 font-bold uppercase tracking-[0.4em] text-[10px] mb-4">Core Operating Logic</h3>
            <p className="text-white/60 text-sm font-light leading-relaxed">
              Atelier.G defaults to Google Gemini Cloud engines for superior synthesis. 
              Toggle individual modules to route neural paths to local instances (e.g. Ollama, SD-WebUI, Bark). 
              Image model is currently locked to <span className="text-blue-400 font-bold">gemini-2.5-flash-image</span> for cloud-based masterpiece generation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <ModuleConfig 
              title="Journal Engine" 
              moduleKey="chat" 
              description="Routes text generation to local LLM frameworks." 
            />
            <ModuleConfig 
              title="Analytic Vision" 
              moduleKey="vision" 
              description="Routes multimodal visual analysis to local VLMs." 
            />
            <ModuleConfig 
              title="Atelier Synthesis" 
              moduleKey="studio" 
              description="Routes image generation to local Stable Diffusion instances." 
            />
            <ModuleConfig 
              title="Vocal Synthesis" 
              moduleKey="tts" 
              description="Routes text-to-speech to local neural voice engines." 
            />
          </div>

          <div className="text-center p-12">
            <button 
              onClick={() => { localStorage.removeItem('neural_config'); window.location.reload(); }}
              className="text-[8px] font-bold uppercase tracking-[0.5em] text-white/10 hover:text-red-400 transition-colors"
            >
              Reset Synaptic Alignment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
