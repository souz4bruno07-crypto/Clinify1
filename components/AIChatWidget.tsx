
import React, { useState, useRef, useEffect } from 'react';
import { askFinancialAdvisor } from '../services/aiService';
import { Transaction } from '../types';
import { Sparkles, Send, X, Loader2, Bot, ChevronDown } from 'lucide-react';

interface AIChatWidgetProps {
  transactions: Transaction[];
  clinicName: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const AIChatWidget: React.FC<AIChatWidgetProps> = ({ transactions, clinicName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Olá! Sou seu estrategista CFO Digital. Como posso ajudar com os lucros da ${clinicName} hoje?`
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    const responseText = await askFinancialAdvisor(input, transactions, clinicName);
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: responseText };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  return (
    <>
      {/* FAB: Floating Action Button Reconstruído */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 z-[9999] bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white w-20 h-20 rounded-full shadow-[0_20px_50px_-12px_rgba(79,70,229,0.5)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 group border-4 border-white dark:border-slate-800 overflow-visible"
        >
          <Sparkles className="w-10 h-10" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-800 animate-pulse"></div>
          
          <span className="absolute right-full mr-6 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-2xl border border-white/10">
            Falar com Strategist IA
          </span>
        </button>
      )}

      {/* JANELA DO CHAT */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9998]" onClick={() => setIsOpen(false)}></div>
          
          <div className="fixed bottom-0 left-0 right-0 md:left-auto md:right-8 md:bottom-8 z-[9999] w-full md:w-[480px] bg-white dark:bg-slate-900 rounded-t-[3.5rem] md:rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-20 duration-500 h-[85vh] md:h-[750px]">
            {/* Header Chat */}
            <div className="bg-slate-900 p-8 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center space-x-5">
                <div className="bg-indigo-600 p-3.5 rounded-2xl shadow-xl">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-xl uppercase tracking-widest leading-none mb-1">Strategist IA</h3>
                  <p className="text-[10px] text-indigo-400 font-bold flex items-center">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                    Auditando {transactions.length} registros
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors"><ChevronDown className="w-8 h-8" /></button>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50 dark:bg-slate-950 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-[2rem] px-7 py-5 text-sm shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none font-bold leading-relaxed'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && <div className="flex justify-start"><div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div></div>}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-5">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Instrua o CFO IA..." className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-[2rem] px-8 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold" disabled={loading} />
                <button type="submit" disabled={!input.trim() || loading} className="bg-slate-900 hover:bg-black disabled:opacity-30 text-white p-6 rounded-full shadow-2xl transition-all active:scale-90"><Send className="w-6 h-6" /></button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AIChatWidget;
