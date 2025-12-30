
import React from 'react';

const SettingsView: React.FC = () => {
  const [selectedLiveVoice, setSelectedLiveVoice] = React.useState(localStorage.getItem('live_voice') || 'Zephyr');
  
  const voices = [
    { name: 'Zephyr', gender: 'Male', color: '#7dd3fc' },
    { name: 'Puck', gender: 'Male', color: '#fcd34d' },
    { name: 'Charon', gender: 'Male', color: '#94a3b8' },
    { name: 'Kore', gender: 'Female', color: '#f472b6' },
    { name: 'Fenrir', gender: 'Male', color: '#f87171' },
  ];

  const handleVoiceChange = (name: string) => {
    setSelectedLiveVoice(name);
    localStorage.setItem('live_voice', name);
    // Notify app to re-establish session or update state
    window.location.reload(); 
  };

  return (
    <div className="h-full flex flex-col bg-transparent relative overflow-hidden">
      <header className="sticky top-0 z-40 w-full glass-panel illuminated-glass border-b border-white/5 pb-4 pt-6 px-8 flex items-center justify-center bg-black/20 backdrop-blur-md">
        <div className="text-center">
          <span className="text-[8px] font-bold text-white/10 tracking-[0.8em] uppercase block mb-1">System Architecture</span>
          <h2 className="text-5xl liquid-glass leading-none" data-text="Preferences">Preferences</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 md:p-12 lg:px-24 space-y-12">
        <div className="glass-panel illuminated-glass p-10 rounded-[48px]">
          <h3 className="text-xl font-light text-white mb-8 tracking-widest uppercase">Live Assistant Customization</h3>
          
          <div className="space-y-10">
            <section className="space-y-4">
              <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.5em] block mb-4">Core Voice Module</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {voices.map(v => (
                  <div 
                    key={v.name}
                    onClick={() => handleVoiceChange(v.name)}
                    className={`p-6 rounded-[32px] glass-panel transition-all cursor-pointer border-2 ${selectedLiveVoice === v.name ? 'border-white/20 bg-white/5' : 'border-transparent bg-black/40 hover:bg-white/[0.02]'}`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-black" style={{ backgroundColor: v.color }}>
                        {v.name[0]}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">{v.name}</div>
                        <div className="text-[9px] text-white/30 uppercase tracking-[0.2em]">{v.gender} Synthesis Engine</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="p-8 bg-white/[0.01] rounded-[32px] border border-white/5">
              <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] mb-4">Acoustic Calibration</h4>
              <p className="text-sm text-white/40 font-light leading-relaxed">
                The current system is tuned to the Blake persona. Changing the core voice module will restart the neural link to ensure synaptic alignment. Unique voice tuning allows for higher fidelity "asexual tension" and "charismatic frat energy" during live interactions.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
