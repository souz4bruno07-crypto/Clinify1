
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, Category } from '../../types';
import { addTransaction, updateTransaction } from '../../services/backendService';
import { formatCurrencyValue, parseCurrencyInput, formatCurrency } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
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
  const toast = useToast();
  const modalRef = useFocusTrap(isOpen);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const [formData, setFormData] = useState({
    desc: '',
    amount: '',
    type: 'revenue' as 'revenue' | 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'pix',
    isPaid: true,
    patientName: '',
    tags: '',
    installments: 1,
    cardFee: 0
  });

  const paymentMethods = [
    { id: 'pix', label: 'PIX', icon: Smartphone },
    { id: 'credit', label: 'Cartão de Crédito', icon: CreditCard },
    { id: 'debit', label: 'Cartão de Débito', icon: Wallet },
    { id: 'cash', label: 'Dinheiro', icon: Banknote },
  ];

  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
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
          tags: (editingTransaction as any).tags || '',
          installments: (editingTransaction as any).installments || 1,
          cardFee: (editingTransaction as any).cardFee || 0
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
          tags: '',
          installments: 1,
          cardFee: 0
        });
      }
    }
  }, [isOpen, editingTransaction, initialDate]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

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

    // Calcular valor com taxa de cartão se aplicável
    let finalAmount = amountVal;
    if (formData.paymentMethod === 'credit' && formData.cardFee > 0) {
      finalAmount = amountVal * (1 + formData.cardFee / 100);
    }

    const data = {
      userId: user.id,
      description: formData.desc,
      amount: finalAmount,
      type: formData.type,
      category: formData.category,
      date: new Date(formData.date + 'T12:00:00').getTime(),
      patientName: formData.type === 'revenue' ? formData.patientName : undefined,
      paymentMethod: formData.paymentMethod,
      isPaid: formData.isPaid,
      tags: formData.tags,
      installments: formData.paymentMethod === 'credit' ? formData.installments : undefined,
      cardFee: formData.paymentMethod === 'credit' ? formData.cardFee : undefined
    };

    try {
      if (editingTransaction?.id) {
        await updateTransaction(editingTransaction.id, data);
        toast.success('Dados atualizados!', 3000);
      } else {
        await addTransaction(data);
        toast.success('Transação salva!', 3000);
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
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-modal-title"
      aria-describedby="transaction-modal-description"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
       <div 
         ref={modalRef}
         className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[95vh] overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300"
       >
          {showSuccess ? (
              <div className="p-20 text-center flex flex-col items-center justify-center animate-in zoom-in-90 duration-500" role="status" aria-live="polite">
                  <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 border-4 border-emerald-500/20" aria-hidden="true">
                    <Check className="w-12 h-12 text-emerald-600" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white mb-2">Lançamento Efetivado!</h3>
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Sincronizando com seu CFO Digital...</p>
              </div>
          ) : (
            <>
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
                 <div>
                    <h3 id="transaction-modal-title" className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Lançamento de Fluxo</h3>
                    <p id="transaction-modal-description" className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Auditado por Clinify Pro</p>
                 </div>
                 <button 
                   onClick={onClose} 
                   className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-sm text-slate-400 hover:text-emerald-500 transition-all"
                   aria-label="Fechar modal"
                 >
                   <X className="w-6 h-6" aria-hidden="true" />
                 </button>
              </div>
              
              <form onSubmit={handleSave} className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                 <div role="alert" aria-live="assertive" aria-atomic="true">
                   {errorMsg && (
                     <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl flex items-start gap-3 animate-in fade-in">
                       <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                       <p className="text-xs font-bold text-rose-700 dark:text-rose-400 leading-relaxed">{errorMsg}</p>
                     </div>
                   )}
                 </div>

                 <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl shadow-inner" role="radiogroup" aria-label="Tipo de transação">
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, type: 'revenue'})} 
                      className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.type === 'revenue' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-md' : 'text-slate-600 dark:text-slate-400'}`}
                      aria-pressed={formData.type === 'revenue'}
                    >
                      Receita (+)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, type: 'expense'})} 
                      className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.type === 'expense' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-md' : 'text-slate-600 dark:text-slate-400'}`}
                      aria-pressed={formData.type === 'expense'}
                    >
                      Despesa (-)
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="transaction-amount" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Real</label>
                            <div className="relative mt-1">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl" aria-hidden="true">R$</span>
                                <input 
                                    id="transaction-amount"
                                    type="tel" 
                                    autoFocus
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-3xl py-6 pl-14 pr-5 font-black text-4xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400" 
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
                            <label htmlFor="transaction-desc" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição do Item</label>
                            <input 
                                id="transaction-desc"
                                type="text" 
                                required
                                className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 font-bold text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-emerald-500" 
                                placeholder="Ex: Toxina Botulínica, Aluguel..."
                                value={formData.desc}
                                onChange={e => setFormData({...formData, desc: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="transaction-date" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                                <input 
                                  id="transaction-date"
                                  type="date" 
                                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 font-bold text-xs text-slate-900 dark:text-white" 
                                  value={formData.date} 
                                  onChange={e => setFormData({...formData, date: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label htmlFor="transaction-category" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Classificação</label>
                                <select 
                                  id="transaction-category"
                                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 font-bold text-xs text-slate-900 dark:text-white" 
                                  value={formData.category} 
                                  onChange={e => setFormData({...formData, category: e.target.value})}
                                >
                                    <option value="">Selecione...</option>
                                    {categories.filter(c => formData.type === 'revenue' ? c.type === 'revenue' : c.type !== 'revenue').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Canal de Liquidação</label>
                            <div className="grid grid-cols-2 gap-2 mt-2" role="radiogroup" aria-label="Método de pagamento">
                                {paymentMethods.map(m => (
                                    <button 
                                      key={m.id} 
                                      type="button" 
                                      onClick={() => {
                                        const newData = {...formData, paymentMethod: m.id};
                                        // Reset parcelas e taxa se não for cartão
                                        if (m.id !== 'credit') {
                                          newData.installments = 1;
                                          newData.cardFee = 0;
                                        }
                                        setFormData(newData);
                                      }} 
                                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${formData.paymentMethod === m.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600' : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                                      aria-pressed={formData.paymentMethod === m.id}
                                    >
                                        <m.icon className="w-4 h-4" aria-hidden="true" />
                                        <span className="text-[10px] font-black uppercase">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Campos de cartão de crédito */}
                        {formData.paymentMethod === 'credit' && (
                          <div className="space-y-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                            <div>
                              <label htmlFor="installments" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">
                                Parcelas
                              </label>
                              <select
                                id="installments"
                                value={formData.installments}
                                onChange={e => setFormData({...formData, installments: parseInt(e.target.value) || 1})}
                                className="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-3 px-4 font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                                  <option key={num} value={num}>
                                    {num}x {num === 1 ? 'sem juros' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label htmlFor="cardFee" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">
                                Taxa do Cartão (%)
                              </label>
                              <div className="relative">
                                <input
                                  id="cardFee"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={formData.cardFee}
                                  onChange={e => setFormData({...formData, cardFee: parseFloat(e.target.value) || 0})}
                                  className="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-3 px-4 font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                  placeholder="0,00"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
                              </div>
                              {formData.cardFee > 0 && formData.amount && (
                                <div className="mt-2 p-3 bg-white dark:bg-slate-800 rounded-xl">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-bold">Valor original:</span>
                                    <span className="text-slate-900 dark:text-white font-black">{formatCurrency(parseCurrencyInput(formData.amount))}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs mt-1">
                                    <span className="text-slate-500 font-bold">Taxa ({formData.cardFee}%):</span>
                                    <span className="text-rose-500 font-black">
                                      +{formatCurrency(parseCurrencyInput(formData.amount) * (formData.cardFee / 100))}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <span className="text-slate-700 dark:text-slate-300 font-black">Valor final:</span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-black text-lg">
                                      {formatCurrency(parseCurrencyInput(formData.amount) * (1 + formData.cardFee / 100))}
                                    </span>
                                  </div>
                                  {formData.installments > 1 && (
                                    <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                      <span className="text-slate-500 font-bold">Valor por parcela:</span>
                                      <span className="text-slate-900 dark:text-white font-black">
                                        {formatCurrency((parseCurrencyInput(formData.amount) * (1 + formData.cardFee / 100)) / formData.installments)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                            <div className="flex gap-2 mt-2" role="radiogroup" aria-label="Status do pagamento">
                                <button 
                                  type="button" 
                                  onClick={() => setFormData({...formData, isPaid: true})} 
                                  className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${formData.isPaid ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800'}`}
                                  aria-pressed={formData.isPaid}
                                >
                                  Conciliado
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => setFormData({...formData, isPaid: false})} 
                                  className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${!formData.isPaid ? 'bg-amber-500 border-amber-500 text-white shadow-lg' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800'}`}
                                  aria-pressed={!formData.isPaid}
                                >
                                  Pendente
                                </button>
                            </div>
                        </div>
                    </div>
                 </div>

                 <div className="pt-4 flex gap-4">
                    <button 
                      type="button" 
                      onClick={onClose} 
                      className="flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Descartar
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="flex-[2] bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                       {isSubmitting ? (
                         <>
                           <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                           <span className="sr-only">Salvando...</span>
                         </>
                       ) : (
                         <>
                           <Check className="w-5 h-5" aria-hidden="true" /> Confirmar Auditoria
                         </>
                       )}
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
