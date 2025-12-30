import React, { useState, useRef, useEffect } from 'react';
import { generateImageDetailed, GenerationResult, enhancePrompt } from '../services/geminiService';
import { GeneratedImage, StudioMode } from '../types';

const StudioView: React.FC = () => {
  const [activeMode, setActiveMode] = useState<StudioMode>(StudioMode.MASTERPIECE);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [activeError, setActiveError] = useState<GenerationResult['error'] | null>(null);
  const [expandedImage, setExpandedImage] = useState<GeneratedImage | null>(null);
  
  // Advanced Config
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Image References
  const [refImage, setRefImage] = useState<{ data: string, mimeType: string, preview: string } | null>(null);
  const [likenessImage, setLikenessImage] = useState<{ data: string, mimeType: string, preview: string } | null>(null);
  const [vibeImage, setVibeImage] = useState<{ data: string, mimeType: string, preview: string } | null>(null);
  const [variationImage, setVariationImage] = useState<{ data: string, mimeType: string, preview: string } | null>(null);

  const masterpieceFileInput = useRef<HTMLInputElement>(null);
  const likenessFileInput = useRef<HTMLInputElement>(null);
  const vibeFileInput = useRef<HTMLInputElement>(null);
  const variationFileInput = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: any) => void) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setter({
          data: base64String.split(',')[1],
          mimeType: file.type,
          preview: base64String
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhance = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    const enhanced = await enhancePrompt(prompt.trim());
    setPrompt(enhanced);
    setIsEnhancing(false);
  };

  const executeGeneration = async () => {
    const defaultPrompts = {
      [StudioMode.MASTERPIECE]: "A photorealistic masterpiece with extreme detail.",
      [StudioMode.COPYCAT]: "Flawless identity reconstruction, perfectly matching the target vibe and lighting.",
      [StudioMode.VARIATION]: "A high-fidelity variation of the original image, exploring new composition while maintaining style."
    };
    const finalPrompt = prompt.trim() || defaultPrompts[activeMode];
    
    if (isGenerating) return;
    setIsGenerating(true);
    setActiveError(null);

    try {
      let imagesToSend: { data: string, mimeType: string }[] = [];
      let mode: 'create' | 'edit' | 'copycat' | 'variation' = 'create';

      if (activeMode === StudioMode.COPYCAT) {
        if (!likenessImage || !vibeImage) {
          throw new Error("Copy Cat requires both Likeness and Vibe references.");
        }
        imagesToSend = [
          { data: likenessImage.data, mimeType: likenessImage.mimeType },
          { data: vibeImage.data, mimeType: vibeImage.mimeType }
        ];
        mode = 'copycat';
      } else if (activeMode === StudioMode.VARIATION) {
        if (!variationImage) throw new Error("Please upload a base image to generate variations from.");
        imagesToSend = [{ data: variationImage.data, mimeType: variationImage.mimeType }];
        mode = 'variation';
      } else {
        if (refImage) {
          imagesToSend = [{ data: refImage.data, mimeType: refImage.mimeType }];
          mode = 'edit';
        }
      }

      const res = await generateImageDetailed(finalPrompt, imagesToSend, mode, { aspectRatio, imageSize });

      if (res.success && res.data) {
        setGallery(prev => [{ 
          id: crypto.randomUUID(),
          url: res.data!, 
          prompt: finalPrompt 
        }, ...prev]);
        setPrompt('');
      } else if (res.error) {
        setActiveError(res.error);
      }
    } catch (err: any) {
      setActiveError({ 
        reason: "Atelier Fault", 
        suggestion: "Verify your asset uploads and network state.", 
        details: err.message || "Pipeline interrupted."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const setAsReference = (img: GeneratedImage) => {
    setRefImage({ data: img.url.split(',')[1], mimeType: 'image/png', preview: img.url });
    setActiveMode(StudioMode.MASTERPIECE);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getHeaderTitle = () => {
    switch(activeMode) {
      case StudioMode.MASTERPIECE: return 'The Studio';
      case StudioMode.COPYCAT: return 'Copy Cat';
      case StudioMode.VARIATION: return 'Variation';
      default: return 'Atelier';
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent relative overflow-hidden">
      {/* Expanded View */}
      {expandedImage && (
        <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-8" onClick={() => setExpandedImage(null)}>
          <div className="relative max-w-5xl w-full flex flex-col items-center glass-panel illuminated-glass p-6 rounded-[32px]" onClick={e => e.stopPropagation()}>
            <button className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors" onClick={() => setExpandedImage(null)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div className="w-full aspect-square rounded-[24px] overflow-hidden border border-white/5 shadow-2xl bg-black">
              <img src={expandedImage.url} alt="Masterpiece" className="w-full h-full object-contain" />
            </div>
            <div className="mt-6 text-center px-8 pb-4">
              <p className="text-lg font-light italic text-white/70">"{expandedImage.prompt}"</p>
              <div className="mt-8 flex gap-4 justify-center">
                <a href={expandedImage.url} download className="px-10 py-3.5 etched-button text-[9px] font-bold uppercase tracking-[0.4em] rounded-full">Archive</a>
                <button onClick={() => setAsReference(expandedImage)} className="px-10 py-3.5 bg-white/5 etched-button text-[9px] font-bold uppercase tracking-[0.4em] rounded-full">Iterate</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FIXED HEADER - More Compact */}
      <header className="sticky top-0 z-40 w-full glass-panel illuminated-glass border-b border-white/5 pb-4 pt-6 px-8 flex items-center justify-center bg-black/20 backdrop-blur-md">
        <div className="text-center">
          <span className="text-[8px] font-bold text-white/10 tracking-[0.8em] uppercase block mb-1">Master Atelier</span>
          <h2 className="text-5xl liquid-glass leading-none" data-text={getHeaderTitle()}>
            {getHeaderTitle()}
          </h2>
        </div>
      </header>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:px-20 space-y-10 relative z-10" ref={scrollContainerRef}>
        <div className="glass-panel illuminated-glass p-8 rounded-[40px] border border-white/10">
          <div className="flex flex-col gap-8">
            {/* Mode Selection Tabs - Refined */}
            <div className="flex gap-2 p-1 bg-black/60 rounded-[20px] border border-white/5 self-center">
              {[StudioMode.MASTERPIECE, StudioMode.COPYCAT, StudioMode.VARIATION].map(m => (
                <button 
                  key={m}
                  onClick={() => setActiveMode(m)}
                  className={`px-8 py-2.5 rounded-[14px] text-[9px] font-bold uppercase tracking-[0.3em] transition-all duration-300 ${activeMode === m ? 'bg-white/10 text-white shadow-lg' : 'text-white/20 hover:text-white/40'}`}
                >
                  {m.toLowerCase()}
                </button>
              ))}
            </div>

            {activeMode === StudioMode.MASTERPIECE && (
              <div className="flex flex-col md:flex-row gap-6">
                <button onClick={() => masterpieceFileInput.current?.click()} className="w-24 h-24 rounded-[24px] etched-button flex flex-col items-center justify-center flex-shrink-0 group relative overflow-hidden">
                  {refImage ? (
                    <img src={refImage.preview} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="text-white/10 group-hover:text-white/30 transition-colors" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      <span className="text-[7px] mt-2 font-bold uppercase tracking-widest text-white/10">Base</span>
                    </>
                  )}
                  <input type="file" ref={masterpieceFileInput} onChange={e => handleFile(e, setRefImage)} className="hidden" />
                </button>
                <textarea 
                  value={prompt} 
                  onChange={e => setPrompt(e.target.value)} 
                  placeholder="Draft your visual masterpiece..." 
                  className="flex-1 bg-black/50 border border-white/5 rounded-[28px] p-6 text-lg text-white outline-none focus:border-white/10 transition-all resize-none font-light h-24" 
                />
              </div>
            )}

            {activeMode === StudioMode.COPYCAT && (
              <div className="flex flex-col md:flex-row gap-10 items-center justify-center py-10 bg-black/20 rounded-[32px] border border-white/5">
                <div className="flex flex-col items-center gap-4">
                  <div className="text-[8px] font-bold text-white/15 uppercase tracking-[0.6em]">Identity</div>
                  <button onClick={() => likenessFileInput.current?.click()} className="w-40 h-40 rounded-[32px] etched-button overflow-hidden group shadow-xl">
                    {likenessImage ? (
                      <img src={likenessImage.preview} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-white/10 group-hover:text-white/30 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        <span className="text-[8px] mt-4 font-bold uppercase tracking-widest text-center">Likeness</span>
                      </div>
                    )}
                    <input type="file" ref={likenessFileInput} onChange={e => handleFile(e, setLikenessImage)} className="hidden" />
                  </button>
                </div>
                
                <div className="text-white/5 font-light text-4xl select-none hidden md:block">×</div>

                <div className="flex flex-col items-center gap-4">
                  <div className="text-[8px] font-bold text-white/15 uppercase tracking-[0.6em]">Vibe</div>
                  <button onClick={() => vibeFileInput.current?.click()} className="w-40 h-40 rounded-[32px] etched-button overflow-hidden group shadow-xl">
                    {vibeImage ? (
                      <img src={vibeImage.preview} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-white/10 group-hover:text-white/30 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        <span className="text-[8px] mt-4 font-bold uppercase tracking-widest text-center">Scene</span>
                      </div>
                    )}
                    <input type="file" ref={vibeFileInput} onChange={e => handleFile(e, setVibeImage)} className="hidden" />
                  </button>
                </div>
              </div>
            )}

            {activeMode === StudioMode.VARIATION && (
              <div className="flex flex-col md:flex-row gap-6 items-center">
                 <button onClick={() => variationFileInput.current?.click()} className="w-24 h-24 rounded-[24px] etched-button flex flex-col items-center justify-center flex-shrink-0 group relative overflow-hidden">
                  {variationImage ? (
                    <img src={variationImage.preview} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="text-white/10 group-hover:text-white/30 transition-colors" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="10"/></svg>
                      <span className="text-[7px] mt-2 font-bold uppercase tracking-widest text-white/10">Source</span>
                    </>
                  )}
                  <input type="file" ref={variationFileInput} onChange={e => handleFile(e, setVariationImage)} className="hidden" />
                </button>
                <div className="flex-1 space-y-2">
                  <p className="text-white/30 text-[10px] font-light italic px-4">Generate aesthetically consistent variations of an image.</p>
                  <textarea 
                    value={prompt} 
                    onChange={e => setPrompt(e.target.value)} 
                    placeholder="Style direction..." 
                    className="w-full bg-black/50 border border-white/5 rounded-[24px] p-4 text-lg text-white outline-none focus:border-white/10 transition-all resize-none font-light h-16" 
                  />
                </div>
              </div>
            )}

            {/* Advanced Controls - Slimmer */}
            <div className="border-t border-white/5 pt-6">
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[8px] font-bold uppercase tracking-[0.5em] text-white/15 hover:text-white/50 transition-colors flex items-center gap-3 mb-4"
              >
                <div className={`w-1 h-1 rounded-full bg-current transition-all ${showAdvanced ? 'scale-125' : ''}`} />
                Advanced Controls
              </button>
              
              {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-black/40 rounded-[24px] border border-white/5">
                  <div className="space-y-4">
                    <label className="text-[8px] font-bold text-white/10 uppercase tracking-[0.6em] block">Dimensions</label>
                    <div className="flex gap-2">
                      {['1:1', '16:9', '9:16', '3:4', '4:3'].map(ratio => (
                        <button 
                          key={ratio}
                          onClick={() => setAspectRatio(ratio)}
                          className={`flex-1 py-3 rounded-[12px] text-[9px] font-bold border transition-all ${aspectRatio === ratio ? 'border-white/20 bg-white/5 text-white' : 'border-white/0 text-white/20 hover:text-white/40'}`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[8px] font-bold text-white/10 uppercase tracking-[0.6em] block">Definition</label>
                    <div className="flex gap-2">
                      {['1K', '2K', '4K'].map(size => (
                        <button 
                          key={size}
                          onClick={() => setImageSize(size)}
                          className={`flex-1 py-3 rounded-[12px] text-[9px] font-bold border transition-all ${imageSize === size ? 'border-white/20 bg-white/5 text-white' : 'border-white/0 text-white/20 hover:text-white/40'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-white/5">
              <button onClick={handleEnhance} className="text-[9px] font-bold uppercase tracking-[0.5em] text-white/20 hover:text-white/60 transition-colors flex items-center gap-3 px-2">
                <svg className={isEnhancing ? 'animate-spin' : ''} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
                {isEnhancing ? 'Synthesizing...' : 'Architect Logic'}
              </button>
              <button 
                onClick={executeGeneration} 
                disabled={isGenerating || (activeMode === StudioMode.COPYCAT && (!likenessImage || !vibeImage)) || (activeMode === StudioMode.MASTERPIECE && !prompt.trim() && !refImage) || (activeMode === StudioMode.VARIATION && !variationImage)}
                className="px-16 py-5 etched-button bg-white/[0.02] text-white font-bold uppercase tracking-[0.7em] rounded-[24px] disabled:opacity-5 transition-all min-w-[280px] active:scale-95 shadow-xl text-[10px]"
              >
                {isGenerating ? 'Materializing...' : 'Materialize'}
              </button>
            </div>
          </div>
        </div>

        {activeError && (
          <div className="p-10 glass-panel border-red-900/10 bg-red-950/[0.02] rounded-[32px] overflow-hidden">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 shrink-0 border border-red-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div className="space-y-4 flex-1">
                <h4 className="text-red-400 font-bold uppercase tracking-[0.4em] text-[10px]">{activeError.reason}</h4>
                <p className="text-white/80 text-lg font-light leading-relaxed">{activeError.suggestion}</p>
                
                <div className="p-5 bg-black/40 rounded-[20px] border border-white/5 space-y-2 font-mono">
                  <p className="text-[8px] text-white/10 uppercase tracking-[0.4em] font-bold">Diagnostic Readout</p>
                  <p className="text-white/30 text-[10px] leading-relaxed break-all">{activeError.details}</p>
                  {activeError.triggeringTerms && activeError.triggeringTerms.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-3">
                      {activeError.triggeringTerms.map(term => (
                        <span key={term} className="px-3 py-1 bg-red-500/5 border border-red-500/10 rounded-full text-[8px] text-red-300/60 font-bold uppercase tracking-widest">{term}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pb-32">
          {gallery.map((item, idx) => (
            <div key={item.id || idx} className="group">
              <div className="relative glass-panel rounded-[40px] overflow-hidden cursor-pointer shadow-xl transition-all duration-500 hover:scale-[1.01]" onClick={() => setExpandedImage(item)}>
                <img src={item.url} className="w-full aspect-square object-cover grayscale-[0.1] group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
              </div>
              <div className="mt-6 flex justify-between items-start px-4">
                <p className="text-lg font-light italic text-white/30 line-clamp-2 leading-relaxed max-w-[85%] font-serif">"{item.prompt}"</p>
                <div className="text-right">
                  <span className="text-[8px] font-bold text-white/5 uppercase tracking-[0.6em] block">PLATE</span>
                  <span className="text-2xl font-light text-white/5 leading-none">{gallery.length - idx}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {gallery.length === 0 && !isGenerating && (
          <div className="py-24 flex flex-col items-center opacity-[0.03]">
             <div className="liquid-glass text-[10rem] leading-none mb-8 select-none" data-text="A">A</div>
             <h3 className="text-2xl font-light italic tracking-[1.2em] uppercase">Void</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudioView;