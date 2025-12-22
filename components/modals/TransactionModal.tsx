
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Category } from '../../types';
import { addTransaction, updateTransaction } from '../../services/supabaseService';
import { formatCurrencyValue, parseCurrencyInput, formatCurrency } from '../../utils/formatters';
import { 
  X, Calendar, Sparkles, Check, Loader2, Wallet, 
  CreditCard, Banknote, Smartphone, Tag, Info, AlertCircle, CheckCircle2 
} from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  user: any;
  editingTransaction: Transaction | null;
  categories: Category[];
  transactions: Transaction[]; 
  initialDate?: string;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, onClose, onSaveSuccess, user, editingTransaction, categories, transactions, initialDate 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    desc: '',
    amount: '',
    type: 'revenue' as 'revenue' | 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'pix',
    isPaid: true,
    patientName: '',
    tags: ''
  });

  const paymentMethods = [
    { id: 'pix', label: 'PIX', icon: Smartphone },
    { id: 'credit', label: 'Cartão de Crédito', icon: CreditCard },
    { id: 'debit', label: 'Cartão de Débito', icon: Wallet },
    { id: 'cash', label: 'Dinheiro', icon: Banknote },
  ];

  useEffect(() => {
    if (isOpen) {
      setShowSuccess(false);
      setErrorMsg(null);
      if (editingTransaction) {
        setFormData({
          desc: editingTransaction.description || '',
          amount: formatCurrencyValue(editingTransaction.amount),
          type: editingTransaction.type,
          category: editingTransaction.category || '',
          date: new Date(editingTransaction.date).toISOString().split('T')[0],
          paymentMethod: (editingTransaction as any).paymentMethod || 'pix',
          isPaid: (editingTransaction as any).isPaid ?? true,
          patientName: editingTransaction.patientName || '',
          tags: (editingTransaction as any).tags || ''
        });
      } else {
        setFormData({
          desc: '',
          amount: '',
          type: 'revenue',
          category: '',
          date: initialDate || new Date().toISOString().split('T')[0],
          paymentMethod: 'pix',
          isPaid: true,
          patientName: '',
          tags: ''
        });
      }
    }
  }, [isOpen, editingTransaction, initialDate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    const amountVal = parseCurrencyInput(formData.amount);
    if (!formData.desc || amountVal <= 0) {
      setErrorMsg("Valor ou descrição inválidos.");
      setIsSubmitting(false);
      return;
    }

    const data = {
      userId: user.id,
      description: formData.desc,
      amount: amountVal,
      type: formData.type,
      category: formData.category,
      date: new Date(formData.date + 'T12:00:00').getTime(),
      patientName: formData.type === 'revenue' ? formData.patientName : undefined,
      paymentMethod: formData.paymentMethod,
      isPaid: formData.isPaid,
      tags: formData.tags
    };

    try {
      if (editingTransaction?.id) {
        await updateTransaction(editingTransaction.id, data);
      } else {
        await addTransaction(data);
      }
      
      setShowSuccess(true);
      setTimeout(() => {
          onSaveSuccess();
          onClose();
      }, 1000);
    } catch (error: any) {
      setErrorMsg(`Erro ao salvar: ${error.message}. Verifique a configuração do seu Supabase.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
       <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[95vh] overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
          
          {showSuccess ? (
              <div className="p-20 text-center flex flex-col items-center justify-center animate-in zoom-in-90 duration-500">
                  <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 border-4 border-emerald-500/20">
                    <Check className="w-12 h-12 text-emerald-600" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white mb-2">Lançamento Efetivado!</h3>
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Sincronizando com seu CFO Digital...</p>
              </div>
          ) : (
            <>
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Lançamento de Fluxo</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Auditado por Clinify Pro</p>
                 </div>
                 <button onClick={onClose} className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-sm text-slate-400 hover:text-emerald-500 transition-all"><X className="w-6 h-6" /></button>
              </div>
              
              <form onSubmit={handleSave} className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                 {errorMsg && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl flex items-start gap-3 animate-in fade-in">
                       <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                       <p className="text-xs font-bold text-rose-700 dark:text-rose-400 leading-relaxed">{errorMsg}</p>
                    </div>
                 )}

                 <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl shadow-inner">
                    <button type="button" onClick={() => setFormData({...formData, type: 'revenue'})} className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.type === 'revenue' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-md' : 'text-slate-500'}`}>Receita (+)</button>
                    <button type="button" onClick={() => setFormData({...formData, type: 'expense'})} className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.type === 'expense' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-md' : 'text-slate-500'}`}>Despesa (-)</button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Real</label>
                            <div className="relative mt-1">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">R$</span>
                                <input 
                                    type="tel" autoFocus
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-3xl py-6 pl-14 pr-5 font-black text-4xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white" 
                                    placeholder="0,00"
                                    value={formData.amount}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setFormData({...formData, amount: formatCurrencyValue(Number(val) / 100)});
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição do Item</label>
                            <input 
                                type="text" required
                                className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 font-bold text-sm focus:ring-2 focus:ring-emerald-500" 
                                placeholder="Ex: Toxina Botulínica, Aluguel..."
                                value={formData.desc}
                                onChange={e => setFormData({...formData, desc: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                                <input type="date" className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 font-bold text-xs" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Classificação</label>
                                <select className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 font-bold text-xs" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                    <option value="">Selecione...</option>
                                    {categories.filter(c => formData.type === 'revenue' ? c.type === 'revenue' : c.type !== 'revenue').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Canal de Liquidação</label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {paymentMethods.map(m => (
                                    <button key={m.id} type="button" onClick={() => setFormData({...formData, paymentMethod: m.id})} className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${formData.paymentMethod === m.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>
                                        <m.icon className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                            <div className="flex gap-2 mt-2">
                                <button type="button" onClick={() => setFormData({...formData, isPaid: true})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${formData.isPaid ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'border-slate-100 text-slate-400'}`}>Conciliado</button>
                                <button type="button" onClick={() => setFormData({...formData, isPaid: false})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${!formData.isPaid ? 'bg-amber-50 border-amber-500 text-white shadow-lg' : 'border-slate-100 text-slate-400'}`}>Pendente</button>
                            </div>
                        </div>
                    </div>
                 </div>

                 <div className="pt-4 flex gap-4">
                    <button type="button" onClick={onClose} className="flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 transition-all">Descartar</button>
                    <button type="submit" disabled={isSubmitting} className="flex-[2] bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                       {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Confirmar Auditoria</>}
                    </button>
                 </div>
              </form>
            </>
          )}
       </div>
    </div>
  );
};

export default TransactionModal;
