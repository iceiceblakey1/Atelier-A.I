import React, { useState, useRef, useEffect } from 'react';
import { streamVisionChat } from '../services/geminiService';
import { ChatMessage } from '../types';

const VisionView: React.FC = () => {
  const [imageContext, setImageContext] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageContext({
          data: base64String.split(',')[1],
          mimeType: file.type,
          preview: base64String
        });
        setMessages([]); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !imageContext || isAnalyzing) return;
    const userPrompt = input.trim();
    setInput('');
    setIsAnalyzing(true);
    const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    setMessages(prev => [...prev, { role: 'user', text: userPrompt }]);
    setMessages(prev => [...prev, { role: 'model', text: '' }]);
    try {
      const sendImage = messages.length === 0 ? { data: imageContext.data, mimeType: imageContext.mimeType } : undefined;
      const stream = streamVisionChat(history, userPrompt, sendImage);
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'model') last.text = fullResponse;
          return updated;
        });
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].text = "Analysis engine offline.";
        updated[updated.length - 1].isError = true;
        return updated;
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative overflow-hidden">
      {!imageContext ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-12">
          <div className="glass-panel p-16 rounded-[60px] animate-in zoom-in-95 duration-700 shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-white/5">
             <div className="liquid-glass text-[12rem] leading-none mb-8 opacity-40">O</div>
          </div>
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-light liquid-glass">The Expert Friend</h2>
            <p className="text-white/30 italic text-xl tracking-widest uppercase">Select Visual Evidence For Analysis</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-16 py-6 etched-button text-xs font-bold uppercase tracking-[0.4em] rounded-full active:scale-90"
          >
            Open Evidence
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-8 md:p-16 space-y-12 z-10">
            <div className="sticky top-0 z-20 bg-black/40 backdrop-blur-2xl border-b border-white/5 pb-8 mb-12 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 expansion-frame p-1 rounded-2xl shadow-2xl transform hover:rotate-0 -rotate-3 transition-transform cursor-pointer" onClick={() => {/* expansion logic */}}>
                  <img src={imageContext.preview} className="w-full h-full object-cover rounded-xl" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-2">Refractive Context</h3>
                  <button onClick={() => setImageContext(null)} className="text-[10px] text-white hover:text-white/60 uppercase font-bold flex items-center gap-2 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path></svg>
                    Flush Engine
                  </button>
                </div>
              </div>
            </div>

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-6 duration-500`}>
                <div className={`max-w-[70%] p-10 glass-panel rounded-[40px] text-xl font-light leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-white/10 border-white/20 rounded-br-none' 
                    : 'bg-black/60 border-white/5 rounded-bl-none text-white/80'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isAnalyzing && (
               <div className="flex justify-start">
                  <div className="glass-panel px-8 py-6 rounded-full flex gap-3 items-center border-white/5">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></div>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-12 bg-black/80 backdrop-blur-3xl border-t border-white/5 z-20">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Question the expert's optics..."
                className="w-full pl-8 pr-24 py-6 rounded-[24px] bg-black/60 border border-white/5 focus:border-white/20 outline-none transition-all text-white placeholder-white/20 text-xl font-light shadow-2xl"
                disabled={isAnalyzing}
              />
              <button type="submit" disabled={!input.trim() || isAnalyzing} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 etched-button bg-white/5 text-white rounded-2xl transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default VisionView;