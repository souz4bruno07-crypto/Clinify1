
import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { Quote, Patient, QuoteItem, QuoteMapPoint, Transaction } from '../../types';
import { getQuotes, addQuote, updateQuote, deleteQuote, getPatients, sendMessage, getTransactions } from '../../services/backendService';
import { 
  Plus, Search, FileText, Send, Trash2, Edit2, CheckCircle2, 
  MapPin, PenTool, Eraser, DollarSign, Calendar, ChevronRight,
  Info, Sparkles, X, Save, RefreshCw, Syringe, Calculator, Clock,
  Percent, ArrowRight, Landmark, CreditCard, Zap, Download, Loader2
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { jsPDF } from 'jspdf';
import { useToast } from '../../contexts/ToastContext';
import { useConfirmDialog } from '../ui/ConfirmDialog';

// --- SUB-COMPONENTE: CALCULADORA DE PREÇO (IMPLEMENTAÇÃO 6) ---
const PriceCalculator: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const [hoursPerMonth, setHoursPerMonth] = useState(160);
    const [procedureMinutes, setProcedureMinutes] = useState(60);
    const [materialCost, setMaterialCost] = useState(0);
    const [desiredMargin, setDesiredMargin] = useState(30);
    const [taxes, setTaxes] = useState(6);
    const [commission, setCommission] = useState(0);
    const [cardFee, setCardFee] = useState(2.5);

    // Cálculo Automático de Despesas Fixas (DRE)
    const fixedExpensesTotal = useMemo(() => {
        return transactions
            .filter(t => t.type === 'expense')
            .filter(t => {
                const cat = t.category.toLowerCase();
                const desc = t.description.toLowerCase();
                // Heurística: Ignorar impostos, insumos e comissões (que são variáveis)
                const isTax = cat.includes('imposto') || desc.includes('das') || cat.includes('taxa');
                const isVariable = cat.includes('insumo') || cat.includes('comiss') || cat.includes('produto') || cat.includes('material');
                return !isTax && !isVariable;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }, [transactions]);

    const hourCost = fixedExpensesTotal / (hoursPerMonth || 1);
    const minuteCost = hourCost / 60;

    const results = useMemo(() => {
        const occupationCost = minuteCost * procedureMinutes;
        const directCost = occupationCost + materialCost;
        // Markup divisor: 1 - (% Impostos + % Comiss + % Cartão + % Margem)
        const totalDeductions = (taxes + commission + cardFee + desiredMargin) / 100;
        const divisor = 1 - totalDeductions;
        const finalPrice = divisor > 0 ? directCost / divisor : 0;
        
        return {
            occupationCost,
            directCost,
            finalPrice,
            profitAmount: finalPrice * (desiredMargin / 100),
            taxAmount: finalPrice * (taxes / 100),
            commissionAmount: finalPrice * (commission / 100),
            cardFeeAmount: finalPrice * (cardFee / 100)
        };
    }, [minuteCost, procedureMinutes, materialCost, desiredMargin, taxes, commission, cardFee]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform"><Clock className="w-40 h-40" /></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Landmark className="w-5 h-5 text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custo de Estrutura Automático</span>
                        </div>
                        <h2 className="text-6xl font-black mb-6 tracking-tighter italic">
                            {formatCurrency(hourCost)} <span className="text-xl font-medium opacity-50 not-italic">/hora clínica</span>
                        </h2>
                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                            <div>
                                <p className="text-[10px] font-black uppercase mb-1 text-slate-500">Despesas Fixas DRE</p>
                                <p className="text-2xl font-bold">{formatCurrency(fixedExpensesTotal)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase mb-1 text-slate-500">Capacidade Mensal</p>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        className="bg-white/5 border-none p-0 text-2xl font-bold focus:ring-0 w-20 rounded" 
                                        value={hoursPerMonth} 
                                        onChange={(e) => setHoursPerMonth(Number(e.target.value))} 
                                    />
                                    <span className="text-sm font-bold text-slate-400">hrs</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-[2.5rem] p-8 flex flex-col justify-center">
                    <div className="flex gap-4 items-start mb-4">
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-2xl"><Info className="w-6 h-6 text-amber-600" /></div>
                        <div>
                            <h4 className="font-black text-amber-900 dark:text-amber-300 uppercase text-xs tracking-widest">Ajuste de Markup</h4>
                            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-bold">Para que o preço seja sustentável, o "Custo de Ocupação" deve ser coberto por cada minuto de atendimento.</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-amber-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Custo por Minuto</p>
                        <p className="text-xl font-black text-amber-600">{formatCurrency(minuteCost)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 pb-6 border-b border-slate-100 dark:border-slate-800 uppercase text-xs tracking-widest mb-6">
                            <Calculator className="w-5 h-5 text-indigo-500" /> Parâmetros do Procedimento
                        </h3>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo de Sala</label>
                                    <span className="text-sm font-black text-slate-900 dark:text-white">{procedureMinutes} min</span>
                                </div>
                                <input type="range" min="15" max="300" step="15" className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" value={procedureMinutes} onChange={e => setProcedureMinutes(Number(e.target.value))} />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Custo de Insumos (Botox, Seringas...)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input type="number" className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" value={materialCost} onChange={e => setMaterialCost(Number(e.target.value))} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Margem Desejada (%)</label>
                                    <input type="number" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-bold text-emerald-600" value={desiredMargin} onChange={e => setDesiredMargin(Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Taxa Cartão (%)</label>
                                    <input type="number" className="w-full px-4 py-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border-none font-bold text-blue-600" value={cardFee} onChange={e => setCardFee(Number(e.target.value))} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border-4 border-emerald-500/20 shadow-2xl relative overflow-hidden flex flex-col h-full">
                        <div className="absolute top-0 right-0 p-12 opacity-5"><Zap className="w-32 h-32 text-emerald-500" /></div>
                        
                        <p className="text-slate-500 font-black text-xs uppercase tracking-widest mb-2">Preço Sugerido (Venda)</p>
                        <h1 className="text-8xl font-black text-emerald-600 tracking-tighter mb-10">
                            {formatCurrency(results.finalPrice)}
                        </h1>

                        <div className="mt-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Lucro Bruto</p>
                                <p className="text-lg font-black text-emerald-700">{formatCurrency(results.profitAmount)}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Taxa Cartão</p>
                                <p className="text-lg font-black text-blue-600">{formatCurrency(results.cardFeeAmount)}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Ocupação</p>
                                <p className="text-lg font-black text-slate-700 dark:text-slate-300">{formatCurrency(results.occupationCost)}</p>
                            </div>
                            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Insumos</p>
                                <p className="text-lg font-black text-rose-600">{formatCurrency(materialCost)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL (ATUALIZADO) ---
const BudgetsTab: React.FC<{ user: any }> = ({ user }) => {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [view, setView] = useState<'list' | 'editor' | 'calculator'>('list');
  
  // Editor State
  const [editingQuote, setEditingQuote] = useState<Partial<Quote>>({
      items: [],
      mapPoints: [],
      totalAmount: 0,
      status: 'draft'
  });
  
  // Tools State
  const [activeTool, setActiveTool] = useState<'botox' | 'filler' | 'threads' | 'eraser'>('botox');
  const [newItem, setNewItem] = useState({ procedure: '', region: '', quantity: 1, unitPrice: 0 });
  const [priceInput, setPriceInput] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
      if(user) {
          getQuotes(user.id).then(setQuotes);
          getPatients(user.id).then(response => {
              setPatients(Array.isArray(response) ? response : (response?.data || []));
          });
          getTransactions(user.id).then(response => {
              setTransactions(Array.isArray(response) ? response : (response?.data || []));
          });
      }
  }, [user]);

  const handleCreateNew = () => {
      setEditingQuote({
          userId: user.id,
          items: [],
          mapPoints: [],
          totalAmount: 0,
          status: 'draft',
          createdAt: Date.now(),
          validUntil: Date.now() + (30 * 24 * 60 * 60 * 1000)
      });
      setNewItem({ procedure: '', region: '', quantity: 1, unitPrice: 0 });
      setPriceInput('');
      setView('editor');
  };

  const handleEdit = (quote: Quote) => {
      // Garantir que items seja sempre um array (pode vir como string JSON do banco)
      let items: QuoteItem[] = [];
      if (Array.isArray(quote.items)) {
          items = quote.items;
      } else if (typeof quote.items === 'string') {
          try {
              items = JSON.parse(quote.items);
          } catch {
              items = [];
          }
      }
      
      // Garantir que mapPoints também seja um array
      let mapPoints: QuoteMapPoint[] = [];
      if (Array.isArray(quote.mapPoints)) {
          mapPoints = quote.mapPoints;
      } else if (typeof quote.mapPoints === 'string') {
          try {
              mapPoints = JSON.parse(quote.mapPoints);
          } catch {
              mapPoints = [];
          }
      }
      
      setEditingQuote({
          ...quote,
          items,
          mapPoints
      });
      setNewItem({ procedure: '', region: '', quantity: 1, unitPrice: 0 });
      setPriceInput('');
      setView('editor');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const numericValue = e.target.value.replace(/\D/g, '');
      const floatValue = Number(numericValue) / 100;
      setPriceInput(floatValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
      setNewItem(prev => ({ ...prev, unitPrice: floatValue }));
  };

  const addItem = () => {
      if(!newItem.procedure || newItem.unitPrice <= 0) return;
      const total = newItem.quantity * newItem.unitPrice;
      const item: QuoteItem = { id: Math.random().toString(36).substr(2, 9), ...newItem, total };
      const updatedItems = [...(editingQuote.items || []), item];
      setEditingQuote(prev => ({ ...prev, items: updatedItems, totalAmount: updatedItems.reduce((acc, i) => acc + i.total, 0) }));
      setNewItem({ procedure: '', region: '', quantity: 1, unitPrice: 0 });
      setPriceInput('');
  };

  const removeItem = (id: string) => {
      const updatedItems = (editingQuote.items || []).filter(i => i.id !== id);
      setEditingQuote(prev => ({ ...prev, items: updatedItems, totalAmount: updatedItems.reduce((acc, i) => acc + i.total, 0) }));
  };

  const handleSave = async () => {
      if(!editingQuote.patientId || !user) { 
          toast.warning("Selecione um paciente"); 
          return; 
      }
      const p = patients.find(pat => pat.id === editingQuote.patientId);
      const quoteToSave = { ...editingQuote, patientName: p?.name || 'Desconhecido' };
      if(editingQuote.id) await updateQuote(editingQuote.id, quoteToSave);
      else await addQuote(quoteToSave);
      toast.success('Orçamento salvo com sucesso!');
      getQuotes(user.id).then(setQuotes);
      setView('list');
  };

  const handleSendToChat = async () => {
      if(!editingQuote.patientId || !editingQuote.items?.length) return;
      const patient = patients.find(p => p.id === editingQuote.patientId);
      if(!patient) return;
      const itemsList = editingQuote.items.map(i => `- ${i.procedure} (${i.region}): ${formatCurrency(i.total)}`).join('\n');
      const message = `Olá ${patient.name}, segue o orçamento do seu planejamento estético:\n\n${itemsList}\n\n*Total: ${formatCurrency(editingQuote.totalAmount || 0)}*\n\nPodemos agendar?`;
      await sendMessage(editingQuote.patientId, message, 'outbound');
      toast.success("Orçamento enviado para o chat!");
  };

  const handleDelete = async (id: string) => {
      const confirmed = await confirm({
          title: 'Excluir Orçamento',
          message: 'Deseja excluir este orçamento?',
          confirmText: 'Excluir',
          cancelText: 'Cancelar',
          variant: 'danger'
      });
      if(confirmed) {
          await deleteQuote(id);
          toast.success('Orçamento excluído!');
          getQuotes(user.id).then(setQuotes);
      }
  };

  const handleAddMapPoint = (point: QuoteMapPoint) => {
      setEditingQuote(prev => ({ ...prev, mapPoints: [...(prev.mapPoints || []), point] }));
  };

  // Função para exportar o orçamento em PDF
  const handleExportPdf = async () => {
    if (!editingQuote.patientId || !editingQuote.items?.length) {
      toast.warning("Adicione um paciente e pelo menos um item ao orçamento.");
      return;
    }

    setIsExportingPdf(true);

    try {
      const patient = patients.find(p => p.id === editingQuote.patientId);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;

      // ============ HEADER COM LOGO ============
      // Desenhar logo estilizado (círculo com texto)
      doc.setFillColor(79, 70, 229); // Indigo
      doc.circle(margin + 12, yPos + 12, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('C', margin + 8.5, yPos + 16);

      // Nome da clínica
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('CLINIFY', margin + 30, yPos + 10);

      // Subtítulo
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Gestão Estética', margin + 30, yPos + 17);

      // Número do orçamento
      doc.setFontSize(10);
      doc.setTextColor(79, 70, 229);
      doc.setFont('helvetica', 'bold');
      const quoteNumber = `#${Date.now().toString().slice(-6)}`;
      doc.text(`Orçamento ${quoteNumber}`, pageWidth - margin - 40, yPos + 10);

      // Data
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }), pageWidth - margin - 40, yPos + 17);

      yPos += 40;

      // Linha divisória decorativa
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 15;

      // ============ DADOS DO PACIENTE ============
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 40, 4, 4, 'F');

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DO PACIENTE', margin + 8, yPos + 10);

      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(patient?.name || 'Paciente', margin + 8, yPos + 22);

      // Info adicional do paciente
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      const patientInfo = [];
      if (patient?.phone) patientInfo.push(`Tel: ${patient.phone}`);
      if (patient?.email) patientInfo.push(`Email: ${patient.email}`);
      doc.text(patientInfo.join('  •  ') || 'Contato não informado', margin + 8, yPos + 32);

      yPos += 55;

      // ============ TABELA DE ITENS ============
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.text('ITENS DO ORÇAMENTO', margin, yPos);
      yPos += 10;

      // Header da tabela
      doc.setFillColor(15, 23, 42); // Slate-900
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 12, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('PROCEDIMENTO', margin + 5, yPos + 8);
      doc.text('REGIÃO', margin + 80, yPos + 8);
      doc.text('QTD', margin + 115, yPos + 8);
      doc.text('UNIT.', margin + 135, yPos + 8);
      doc.text('TOTAL', pageWidth - margin - 25, yPos + 8);
      yPos += 16;

      // Itens
      editingQuote.items?.forEach((item, index) => {
        const isEven = index % 2 === 0;
        if (isEven) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, yPos - 4, pageWidth - margin * 2, 14, 'F');
        }

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(item.procedure.slice(0, 25), margin + 5, yPos + 5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(item.region || '-', margin + 80, yPos + 5);
        doc.text(item.quantity.toString(), margin + 117, yPos + 5);
        
        doc.setTextColor(15, 23, 42);
        doc.text(formatCurrency(item.unitPrice), margin + 135, yPos + 5);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129); // Emerald-500
        doc.text(formatCurrency(item.total), pageWidth - margin - 25, yPos + 5);

        yPos += 14;
      });

      yPos += 10;

      // Linha antes do total
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 15;

      // ============ TOTAL ============
      doc.setFillColor(16, 185, 129); // Emerald-500
      doc.roundedRect(pageWidth - margin - 80, yPos, 80, 28, 4, 4, 'F');

      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.text('VALOR TOTAL', pageWidth - margin - 75, yPos + 10);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(editingQuote.totalAmount || 0), pageWidth - margin - 75, yPos + 22);

      yPos += 45;

      // ============ VALIDADE ============
      const validUntil = editingQuote.validUntil 
        ? new Date(editingQuote.validUntil).toLocaleDateString('pt-BR') 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');
      
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text(`Orçamento válido até: ${validUntil}`, margin, yPos);

      yPos += 20;

      // ============ ASSINATURA ============
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos + 30, margin + 70, yPos + 30);
      doc.line(pageWidth - margin - 70, yPos + 30, pageWidth - margin, yPos + 30);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Assinatura do Profissional', margin, yPos + 38);
      doc.text('Assinatura do Paciente', pageWidth - margin - 55, yPos + 38);

      // ============ FOOTER ============
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFillColor(248, 250, 252);
      doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text('Documento gerado automaticamente pelo Clinify', pageWidth / 2, pageHeight - 12, { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

      // Salvar o PDF
      const fileName = `orcamento_${patient?.name?.replace(/\s+/g, '_') || 'paciente'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      toast.error('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (view === 'calculator') {
      return (
          <div className="space-y-6">
              <div className="flex items-center justify-between">
                  <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold uppercase text-xs tracking-widest">
                      <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
                  </button>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Simulador de Markup</h2>
              </div>
              <PriceCalculator transactions={transactions} />
          </div>
      );
  }

  if (view === 'list') {
      return (
          <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Orçamentos</h2>
                  <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => setView('calculator')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-700 transition-all hover:bg-slate-50">
                          <Calculator className="w-5 h-5" /> Calculadora
                      </button>
                      <button onClick={handleCreateNew} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all">
                          <Plus className="w-5 h-5" /> Novo Orçamento
                      </button>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {quotes.map(quote => (
                      <div key={quote.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group">
                          <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-lg">{quote.patientName.charAt(0)}</div>
                                  <div>
                                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">{quote.patientName}</h3>
                                      <div className="flex items-center gap-2 text-xs text-slate-500"><Calendar className="w-3 h-3" />{new Date(quote.createdAt).toLocaleDateString('pt-BR')}</div>
                                  </div>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${quote.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>{quote.status.toUpperCase()}</span>
                          </div>
                          <div className="flex justify-between items-center mt-6">
                              <div><p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Valor Total</p><p className="text-2xl font-bold text-emerald-600">{formatCurrency(quote.totalAmount)}</p></div>
                              <div className="flex gap-2"><button onClick={() => handleEdit(quote)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"><Edit2 className="w-5 h-5" /></button><button onClick={() => handleDelete(quote.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button></div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  }

  // --- EDITOR VIEW (IMAGE MAPPER) ---
  return (
      <div className="h-[calc(100vh-140px)] flex flex-col bg-slate-50 dark:bg-slate-950 -m-6 sm:-m-8">
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center shrink-0 shadow-sm z-20">
              <div className="flex items-center gap-4">
                  <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-none">{editingQuote.id ? 'Editar Planejamento' : 'Novo Planejamento'}</h2>
              </div>
              <div className="flex gap-3">
                  <button 
                    onClick={handleExportPdf} 
                    disabled={isExportingPdf}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg font-bold text-sm border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  >
                    {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
                    Exportar PDF
                  </button>
                  <button onClick={handleSendToChat} className="hidden sm:flex items-center gap-2 px-4 py-2 text-emerald-600 bg-emerald-50 rounded-lg font-bold text-sm border border-emerald-200 hover:bg-emerald-100 transition-colors"><Send className="w-4 h-4" /> Enviar Chat</button>
                  <button onClick={handleSave} className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-lg font-bold text-sm shadow-lg hover:opacity-90 transition-opacity"><Save className="w-4 h-4" /> Salvar</button>
              </div>
          </div>
          <div className="flex-1 flex overflow-hidden">
              <div className="w-full lg:w-5/12 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto p-6 space-y-8">
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paciente</label>
                      <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500" value={editingQuote.patientId || ''} onChange={(e) => setEditingQuote({...editingQuote, patientId: e.target.value})}><option value="">Selecione um paciente...</option>{patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700"><Plus className="w-4 h-4 text-emerald-500" /> Adicionar Procedimento</h3>
                      <div className="grid grid-cols-6 gap-4">
                          <div className="col-span-4"><label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Procedimento</label><input type="text" placeholder="Ex: Botox" className="w-full bg-white dark:bg-slate-900 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400" value={newItem.procedure} onChange={e => setNewItem({...newItem, procedure: e.target.value})} /></div>
                          <div className="col-span-2"><label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Região</label><select className="w-full bg-white dark:bg-slate-900 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-900 dark:text-white" value={newItem.region} onChange={e => setNewItem({...newItem, region: e.target.value})}><option value="">Geral</option><option value="Testa">Testa</option><option value="Labios">Lábios</option></select></div>
                          <div className="col-span-3"><label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Valor Unitário</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 text-xs font-bold">R$</span><input type="tel" className="w-full bg-white dark:bg-slate-900 border border-slate-200 rounded-xl py-2.5 pl-8 pr-3 text-sm font-bold text-emerald-600" value={priceInput} onChange={handlePriceChange} /></div></div>
                          <div className="col-span-2"><label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Qtd</label><input type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-center font-bold text-slate-900 dark:text-white" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})} /></div>
                          <div className="col-span-1 flex items-end"><button onClick={addItem} className="w-full h-[42px] bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center"><Plus className="w-5 h-5" /></button></div>
                      </div>
                  </div>
                  <div className="space-y-3">{editingQuote.items?.map((item) => (<div key={item.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 border border-slate-100 rounded-xl shadow-sm"><div className="flex-1"><p className="font-bold text-sm text-slate-900 dark:text-white">{item.procedure}</p><p className="text-xs text-slate-500">{item.quantity}x {formatCurrency(item.unitPrice)}</p></div><div className="flex items-center gap-4"><span className="font-bold text-emerald-600">{formatCurrency(item.total)}</span><button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div></div>))}</div>
                  <div className="mt-auto p-6 border-t border-slate-200 bg-slate-50 dark:bg-slate-800/30 space-y-4">
                      <div className="flex justify-between items-end">
                          <span className="text-slate-900 dark:text-white font-bold text-lg">Total Final</span>
                          <span className="text-3xl font-bold text-emerald-600 tracking-tight">{formatCurrency(editingQuote.totalAmount || 0)}</span>
                      </div>
                      {/* Botão Exportar PDF - Mobile friendly */}
                      <button 
                        onClick={handleExportPdf} 
                        disabled={isExportingPdf || !editingQuote.items?.length}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {isExportingPdf ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Gerando PDF...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-5 h-5" />
                            <span>Exportar Orçamento em PDF</span>
                          </>
                        )}
                      </button>
                  </div>
              </div>
              <div className="hidden lg:flex flex-col flex-1 bg-slate-100 dark:bg-slate-950 relative overflow-hidden items-center justify-center p-10">
                  <div className="absolute top-6 left-6 z-10 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl border border-slate-200 flex flex-col gap-3">
                      <button onClick={() => setActiveTool('botox')} className={`p-3 rounded-xl transition-all ${activeTool === 'botox' ? 'bg-blue-50 text-blue-600 shadow-inner' : 'text-slate-400 hover:bg-slate-50'}`} title="Toxina"><div className="w-3 h-3 rounded-full bg-blue-500 mx-auto mb-1"></div><span className="text-[10px] font-bold">Botox</span></button>
                      <button onClick={() => setActiveTool('filler')} className={`p-3 rounded-xl transition-all ${activeTool === 'filler' ? 'bg-emerald-50 text-emerald-600 shadow-inner' : 'text-slate-400 hover:bg-slate-50'}`} title="Preenchimento"><div className="w-3 h-3 rounded-full bg-emerald-500 mx-auto mb-1"></div><span className="text-[10px] font-bold">Preench.</span></button>
                      <div className="h-px bg-slate-200 my-1"></div>
                      <button onClick={() => setEditingQuote(prev => ({ ...prev, mapPoints: (prev.mapPoints || []).slice(0, -1) }))} className="p-3 text-slate-400 hover:text-red-500" title="Desfazer"><RefreshCw className="w-5 h-5 -rotate-90 mx-auto" /></button>
                  </div>
                  <div className="relative h-full max-h-[600px] w-full max-w-[500px] aspect-[3/4] shadow-2xl rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-800">
                       <FaceCanvas points={editingQuote.mapPoints || []} onAddPoint={handleAddMapPoint} activeTool={activeTool} />
                  </div>
              </div>
          </div>
      </div>
  );
};

// Canvas Drawer Component (Same as before but moved outside or integrated)
const FaceCanvas: React.FC<{ 
    points: QuoteMapPoint[]; 
    onAddPoint: (point: QuoteMapPoint) => void;
    activeTool: 'botox' | 'filler' | 'threads' | 'eraser';
}> = ({ points, onAddPoint, activeTool }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
    const [drawDimensions, setDrawDimensions] = useState({ x: 0, y: 0, w: 0, h: 0 });

    useEffect(() => {
        const img = new Image();
        img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" fill="none" stroke="%2394a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M150 40C100 40 60 90 60 150C60 240 90 290 150 310C210 290 240 240 240 150C240 90 200 40 150 40Z" fill="%23f8fafc"/><path d="M150 40C100 40 60 90 60 150C60 240 90 290 150 310C210 290 240 240 240 150C240 90 200 40 150 40Z"/><path d="M100 140Q120 130 140 140" stroke-width="2"/><path d="M160 140Q180 130 200 140" stroke-width="2"/><circle cx="120" cy="155" r="5" fill="%23cbd5e1" stroke="none"/><circle cx="180" cy="155" r="5" fill="%23cbd5e1" stroke="none"/><path d="M140 200Q150 210 160 200"/><path d="M130 240Q150 250 170 240" stroke-width="2"/></svg>`;
        img.onload = () => setBgImage(img);
    }, []);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas || !bgImage) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, rect.width, rect.height);
        const imgRatio = bgImage.width / bgImage.height;
        const canvasRatio = rect.width / rect.height;
        let drawW = canvasRatio > imgRatio ? rect.height * 0.9 * imgRatio : rect.width * 0.9;
        let drawH = canvasRatio > imgRatio ? rect.height * 0.9 : (rect.width * 0.9) / imgRatio;
        let drawX = (rect.width - drawW) / 2;
        let drawY = (rect.height - drawH) / 2;
        setDrawDimensions({ x: drawX, y: drawY, w: drawW, h: drawH });
        ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);
        points.forEach(p => {
            const px = drawX + (p.x * drawW);
            const py = drawY + (p.y * drawH);
            ctx.beginPath();
            if (p.type === 'point') { ctx.arc(px, py, 6, 0, 2 * Math.PI); ctx.fillStyle = p.color; ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke(); }
            else { ctx.moveTo(px-8, py-8); ctx.lineTo(px+8, py+8); ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.stroke(); ctx.moveTo(px-8, py+8); ctx.lineTo(px+8, py-8); ctx.stroke(); }
        });
    };

    useLayoutEffect(() => { draw(); window.addEventListener('resize', draw); return () => window.removeEventListener('resize', draw); }, [bgImage, points]);

    const handleCanvasClick = (e: React.MouseEvent) => {
        if(activeTool === 'eraser') return;
        const canvas = canvasRef.current;
        if(!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        if (clickX >= drawDimensions.x && clickX <= drawDimensions.x + drawDimensions.w && clickY >= drawDimensions.y && clickY <= drawDimensions.y + drawDimensions.h) {
            const normX = (clickX - drawDimensions.x) / drawDimensions.w;
            const normY = (clickY - drawDimensions.y) / drawDimensions.h;
            let color = activeTool === 'filler' ? '#10b981' : activeTool === 'threads' ? '#8b5cf6' : '#3b82f6';
            onAddPoint({ x: normX, y: normY, type: activeTool === 'threads' ? 'line' : 'point', color });
        }
    };

    return <div className="w-full h-full relative cursor-crosshair bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800"><canvas ref={canvasRef} className="w-full h-full block" onClick={handleCanvasClick} /></div>;
};

export default BudgetsTab;
