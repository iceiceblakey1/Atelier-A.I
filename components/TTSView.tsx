
import React, { useState, useRef, useEffect } from 'react';
import { generateTTS, decodeBase64, decodeAudioData, TTSConfig, GenerationResult } from '../services/geminiService';

const VOICE_LIBRARY = [
  { name: 'Zephyr', trait: 'Bright' }, { name: 'Puck', trait: 'Upbeat' }, { name: 'Charon', trait: 'Informative' },
  { name: 'Kore', trait: 'Firm' }, { name: 'Fenrir', trait: 'Excitable' }, { name: 'Leda', trait: 'Youthful' },
  { name: 'Orus', trait: 'Firm' }, { name: 'Aoede', trait: 'Breezy' }, { name: 'Callirrhoe', trait: 'Easy-going' },
  { name: 'Autonoe', trait: 'Bright' }, { name: 'Enceladus', trait: 'Breathy' }, { name: 'Iapetus', trait: 'Clear' },
  { name: 'Umbriel', trait: 'Easy-going' }, { name: 'Algieba', trait: 'Smooth' }, { name: 'Despina', trait: 'Smooth' },
  { name: 'Erinome', trait: 'Clear' }, { name: 'Algenib', trait: 'Gravelly' }, { name: 'Rasalgethi', trait: 'Informative' },
  { name: 'Laomedeia', trait: 'Upbeat' }, { name: 'Achernar', trait: 'Soft' }, { name: 'Alnilam', trait: 'Firm' },
  { name: 'Schedar', trait: 'Even' }, { name: 'Gacrux', trait: 'Mature' }, { name: 'Pulcherrima', trait: 'Forward' },
  { name: 'Achird', trait: 'Friendly' }, { name: 'Zubenelgenubi', trait: 'Casual' }, { name: 'Vindemiatrix', trait: 'Gentle' },
  { name: 'Sadachbia', trait: 'Lively' }, { name: 'Sadaltager', trait: 'Knowledgeable' }, { name: 'Sulafat', trait: 'Warm' }
];

const RecordingBooth: React.FC = () => {
  const [script, setScript] = useState('');
  const [instruction, setInstruction] = useState('Speak clearly and naturally.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [activeError, setActiveError] = useState<GenerationResult['error'] | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [speakers, setSpeakers] = useState<Array<{ name: string; voice: string }>>([
    { name: 'Narrator', voice: 'Zephyr' }
  ]);

  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      const selected = await (window as any).aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    };
    checkKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    await (window as any).aistudio.openSelectKey();
    setHasApiKey(true);
    setActiveError(null);
  };

  const getAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const playPreview = async (voiceName: string) => {
    if (previewing) return;
    if (!hasApiKey) {
      handleOpenKeyDialog();
      return;
    }
    setPreviewing(voiceName);
    setActiveError(null);
    try {
      const res = await generateTTS(`Neural test for ${voiceName}.`, { 
        model: 'gemini-2.5-flash-preview-tts', 
        speakers: [{ name: 'Voice', voice: voiceName }] 
      });
      if (res.success && res.data) {
        const ctx = await getAudioContext();
        const buffer = await decodeAudioData(decodeBase64(res.data), ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
      } else if (res.error) {
        setActiveError(res.error);
        // Fixed: Use 'details' instead of 'raw' to match updated GenerationResult definition
        if (res.error.details?.includes('401') || res.error.details?.includes('404')) {
           setHasApiKey(false);
        }
      }
    } catch (e: any) {
      setActiveError({ reason: "Runtime Fault", suggestion: "Check key permissions.", details: e.message });
    } finally {
      setPreviewing(null);
    }
  };

  const handleSynthesize = async () => {
    if (!script.trim() || isProcessing) return;
    if (!hasApiKey) {
      handleOpenKeyDialog();
      return;
    }
    setIsProcessing(true);
    setActiveError(null);
    try {
      const res = await generateTTS(script, {
        model: 'gemini-2.5-flash-preview-tts',
        speakers: speakers,
        systemInstruction: instruction
      });
      if (res.success && res.data) {
        const ctx = await getAudioContext();
        const buffer = await decodeAudioData(decodeBase64(res.data), ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
      } else if (res.error) {
        setActiveError(res.error);
        // Fixed: Use 'details' instead of 'raw' to match updated GenerationResult definition
        if (res.error.details?.includes('401') || res.error.details?.includes('404')) {
           setHasApiKey(false);
        }
      }
    } catch (e: any) {
      setActiveError({ reason: "System Collapse", suggestion: "Re-authenticate and try again.", details: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent relative overflow-hidden">
      <header className="sticky top-0 z-40 w-full glass-panel illuminated-glass border-b border-white/5 pb-4 pt-6 px-8 flex items-center justify-center bg-black/20 backdrop-blur-md">
        <div className="text-center">
          <span className="text-[8px] font-bold text-white/10 tracking-[0.8em] uppercase block mb-1">Vocal Laboratory</span>
          <h2 className="text-5xl liquid-glass leading-none" data-text="Recording Booth">Recording Booth</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:px-20 space-y-10 pb-40">
        
        {/* Model Status & Auth */}
        <div className="flex flex-wrap gap-6 items-center justify-between glass-panel p-6 rounded-[32px] border border-white/10">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/40">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="10"/></svg>
              </div>
              <div>
                <div className="text-[10px] font-bold text-white uppercase tracking-widest">Gemini 2.5 Flash TTS</div>
                <div className="text-[7px] text-white/20 uppercase tracking-widest font-bold">Neural Audio Stream v1.2</div>
              </div>
           </div>

           <button 
             onClick={handleOpenKeyDialog}
             className={`px-8 py-3 rounded-2xl border flex items-center gap-3 transition-all active:scale-95 ${hasApiKey ? 'border-green-500/20 bg-green-500/5 text-green-400' : 'border-red-500/20 bg-red-500/5 text-red-400 animate-pulse'}`}
           >
             <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-400 shadow-[0_0_10px_green]' : 'bg-red-400 shadow-[0_0_10px_red]'}`} />
             <span className="text-[9px] font-bold uppercase tracking-widest">{hasApiKey ? 'Engine Authenticated' : 'Auth Required (Billing)'}</span>
           </button>
        </div>

        <div className="flex flex-wrap gap-8 items-start justify-between">
          <div className="flex-1 min-w-[320px] space-y-8">
            <div className="glass-panel p-8 rounded-[40px] border border-white/10 space-y-6">
              <div className="space-y-4">
                <label className="text-[9px] font-bold text-white/20 uppercase tracking-[0.5em] px-4">Directives</label>
                <input 
                  type="text"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="e.g. Speak with high charisma and authority..."
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-xs text-white/70 outline-none focus:border-white/20 transition-all font-light"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[9px] font-bold text-white/20 uppercase tracking-[0.5em] px-4">Script</label>
                <textarea 
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Draft the neural broadcast..."
                  className="w-full bg-black/40 border border-white/5 rounded-[32px] p-8 text-xl text-white outline-none focus:border-white/10 transition-all h-72 resize-none font-light shadow-inner"
                />
              </div>

              <button 
                onClick={handleSynthesize}
                disabled={!script.trim() || isProcessing}
                className="px-24 py-7 etched-button bg-white/[0.04] text-white font-bold uppercase tracking-[0.7em] rounded-full transition-all w-full active:scale-95 shadow-xl text-[10px]"
              >
                {isProcessing ? 'Synthesizing...' : 'Materialize Audio'}
              </button>
            </div>

            {activeError && (
              <div className="p-10 glass-panel border-red-900/20 bg-red-950/[0.03] rounded-[40px] animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 shrink-0 border border-red-500/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </div>
                  <div className="space-y-4 flex-1">
                    <h4 className="text-red-400 font-bold uppercase tracking-[0.4em] text-[10px]">{activeError.reason}</h4>
                    <p className="text-white/80 text-lg font-light leading-relaxed">{activeError.suggestion}</p>
                    <div className="p-5 bg-black/40 rounded-[24px] border border-white/5 space-y-2 font-mono">
                      <p className="text-[8px] text-white/10 uppercase tracking-[0.4em] font-bold">Diagnostic Readout</p>
                      <p className="text-white/30 text-[10px] leading-relaxed break-all">{activeError.details}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-[400px] glass-panel p-8 rounded-[40px] border border-white/10 space-y-8 h-fit">
              <label className="text-[9px] font-bold text-white/20 uppercase tracking-[0.5em] px-2 block">Voice Mapping</label>
              <div className="p-6 bg-black/40 rounded-[32px] border border-white/5 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[7px] font-black text-white/10 uppercase tracking-[0.4em]">Active Archetype</span>
                    <select 
                      value={speakers[0].voice}
                      onChange={(e) => setSpeakers([{ ...speakers[0], voice: e.target.value }])}
                      className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-3 text-[10px] text-white/60 outline-none hover:border-white/10 appearance-none cursor-pointer"
                    >
                      {VOICE_LIBRARY.map(v => (
                        <option key={v.name} value={v.name}>{v.name} ({v.trait})</option>
                      ))}
                    </select>
                  </div>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                <p className="text-[9px] text-white/20 font-light leading-relaxed text-center">
                  Neural synthesis for 2.5 series requires an authenticated project key with active billing. Standard development keys will return 401/404.
                </p>
              </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-10 gap-4">
          {VOICE_LIBRARY.map((v) => (
            <div 
              key={v.name}
              onClick={() => setSpeakers([{ ...speakers[0], voice: v.name }])}
              className={`glass-panel p-5 rounded-[28px] flex flex-col items-center gap-4 transition-all cursor-pointer border-white/0 hover:bg-white/[0.05] ${speakers[0].voice === v.name ? 'bg-white/10 border-white/10 scale-105' : 'opacity-40 hover:opacity-100'}`}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); playPreview(v.name); }}
                className={`p-2.5 rounded-full etched-button text-white/20 hover:text-white transition-all ${previewing === v.name ? 'animate-pulse text-white bg-white/10' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </button>
              <div className="text-center">
                <div className="text-[11px] font-bold text-white tracking-tight leading-none mb-1.5">{v.name}</div>
                <div className="text-[7px] text-white/20 uppercase tracking-[0.2em] font-black">{v.trait}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecordingBooth;
