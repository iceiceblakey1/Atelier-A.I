import React, { useState, useRef, useEffect } from 'react';
import { streamChat } from '../services/geminiService';
import { ChatMessage } from '../types';

const ChatView: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    try {
      const apiHistory = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const stream = streamChat(apiHistory, userMessage);
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg.role === 'model') lastMsg.text = fullResponse;
          return updated;
        });
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Ink failure.', isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8 md:p-16 space-y-12 relative z-10">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-1000">
             <div className="text-9xl liquid-glass mb-8 opacity-20">J</div>
             <h3 className="text-2xl font-light italic tracking-[0.2em] text-white/30 uppercase">The Journal is Open</h3>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
            <div className={`max-w-[75%] p-8 glass-panel rounded-[32px] text-lg leading-relaxed font-light ${
              msg.role === 'user' 
                ? 'bg-white/10 border-white/20 rounded-br-none text-white' 
                : 'bg-black/40 border-white/5 rounded-bl-none text-white/80'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1]?.role === 'user' && (
           <div className="flex justify-start">
             <div className="glass-panel px-6 py-4 rounded-full border-white/5 flex gap-2">
               <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
               <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-75"></div>
               <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150"></div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-12 bg-black/60 backdrop-blur-3xl border-t border-white/5 z-20">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Commit your thoughts to glass..."
            rows={1}
            className="w-full pl-8 pr-24 py-6 rounded-[24px] bg-black/50 border border-white/5 focus:border-white/20 outline-none transition-all text-white placeholder-white/20 text-xl font-light resize-none shadow-2xl shadow-black/50"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }}
            disabled={isLoading}
          />
          <button type="submit" disabled={!input.trim() || isLoading} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 etched-button bg-white/5 text-white rounded-2xl disabled:opacity-20 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;