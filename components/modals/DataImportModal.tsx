import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Transaction } from '../../types';
import { UploadCloud, X, AlertTriangle, CheckCircle2, FileSpreadsheet, ArrowRight, Loader2, Ban, Download } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { addTransactions } from '../../services/supabaseService';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

type ImportStep = 'upload' | 'preview' | 'processing' | 'result';

interface PreviewData extends Partial<Transaction> {
  isValid: boolean;
  errors: string[];
  rawDate?: any;
}

const DataImportModal: React.FC<DataImportModalProps> = ({ isOpen, onClose, userId, onSuccess }) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0, revenue: 0, expense: 0 });
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HELPER: Parse Excel Date (Serial to JS Date) ---
  const parseExcelDate = (excelDate: any): number | null => {
    if (!excelDate) return null;
    
    // Se for número (Serial Excel)
    if (typeof excelDate === 'number') {
      // Ajuste para datas do Excel (base 1900)
      return new Date(Math.round((excelDate - 25569) * 86400 * 1000)).getTime();
    }
    
    // Se for string (DD/MM/YYYY ou YYYY-MM-DD)
    if (typeof excelDate === 'string') {
        // Tenta formato BR DD/MM/YYYY
        if(excelDate.includes('/')) {
            const parts = excelDate.split('/');
            if(parts.length === 3) {
                // assume DD/MM/YYYY
                return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
            }
        }
        // Tenta ISO
        const date = new Date(excelDate);
        if (!isNaN(date.getTime())) return date.getTime();
    }

    return null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true, defval: '' });

      processData(jsonData);
    } catch (error) {
      alert("Erro ao ler o arquivo. Certifique-se que é um arquivo Excel válido.");
    }
  };

  const processData = (rows: any[]) => {
    let validCount = 0;
    let invalidCount = 0;
    let totalRev = 0;
    let totalExp = 0;

    const processed: PreviewData[] = rows.map((row, index) => {
      const errors: string[] = [];
      
      // Mapeamento Inteligente (Case Insensitive)
      // Procura chaves no objeto row que pareçam com os campos que queremos
      const keys = Object.keys(row).reduce((acc, key) => {
          acc[key.toLowerCase().trim()] = key;
          return acc;
      }, {} as Record<string, string>);

      const findVal = (possibleKeys: string[]) => {
          for (const k of possibleKeys) {
              if (keys[k]) return row[keys[k]];
          }
          return undefined;
      };

      // Extração
      const rawDesc = findVal(['descrição', 'descricao', 'description', 'histórico', 'historico', 'item']);
      const rawAmount = findVal(['valor', 'amount', 'preço', 'total']);
      const rawType = findVal(['tipo', 'type', 'natureza']); // Entrada/Saída/Receita/Despesa
      const rawCat = findVal(['categoria', 'category', 'classificação']);
      const rawDate = findVal(['data', 'date', 'dia']);
      const rawPatient = findVal(['paciente', 'patient', 'cliente', 'nome']);

      // Validação: Descrição
      if (!rawDesc || String(rawDesc).length < 2) errors.push("Descrição ausente ou muito curta");

      // Validação: Valor
      let amount = 0;
      if (typeof rawAmount === 'number') {
          amount = Math.abs(rawAmount);
      } else if (typeof rawAmount === 'string') {
          const sanitized = rawAmount.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
          amount = parseFloat(sanitized);
      }
      if (isNaN(amount) || amount <= 0) errors.push("Valor inválido");

      // Validação: Tipo
      let type: 'revenue' | 'expense' = 'expense'; // Default
      const typeStr = String(rawType).toLowerCase();
      if (typeStr.includes('receita') || typeStr.includes('entrada') || typeStr.includes('crédito') || typeStr.includes('revenue')) {
          type = 'revenue';
      } else if (typeStr.includes('despesa') || typeStr.includes('saída') || typeStr.includes('débito') || typeStr.includes('gasto') || typeStr.includes('expense')) {
          type = 'expense';
      } else {
          // Tentar inferir pelo valor negativo no Excel se o tipo não for explícito
          if (typeof rawAmount === 'number' && rawAmount < 0) type = 'expense';
          else if (!rawType) errors.push("Tipo não identificado (Use 'Receita' ou 'Despesa')");
      }

      // Validação: Data
      const dateTimestamp = parseExcelDate(rawDate);
      if (!dateTimestamp) errors.push("Data inválida");

      const isValid = errors.length === 0;
      
      if (isValid) {
          validCount++;
          if (type === 'revenue') totalRev += amount;
          else totalExp += amount;
      } else {
          invalidCount++;
      }

      return {
          id: `row-${index}`,
          userId,
          description: rawDesc,
          amount,
          type,
          category: rawCat || 'Importado',
          date: dateTimestamp || Date.now(),
          patientName: rawPatient || undefined,
          isValid,
          errors,
          rawDate: rawDate // Para debug visual se falhar
      } as PreviewData;
    });

    setPreviewData(processed);
    setStats({
        total: rows.length,
        valid: validCount,
        invalid: invalidCount,
        revenue: totalRev,
        expense: totalExp
    });
    setStep('preview');
  };

  const handleConfirmImport = async () => {
      const validRows = previewData.filter(d => d.isValid).map(d => ({
          userId: d.userId!,
          description: d.description!,
          amount: d.amount!,
          type: d.type!,
          category: d.category!,
          date: d.date!,
          patientName: d.patientName
      }));

      if (validRows.length === 0) return;

      setStep('processing');
      setProgress(0);

      // Batch Insert (Lotes de 50 para evitar timeout)
      const BATCH_SIZE = 50;
      const totalBatches = Math.ceil(validRows.length / BATCH_SIZE);

      try {
          for (let i = 0; i < totalBatches; i++) {
              const batch = validRows.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
              await addTransactions(batch);
              setProgress(Math.round(((i + 1) / totalBatches) * 100));
          }
          setStep('result');
          if (onSuccess) onSuccess();
      } catch (error) {
          alert("Erro ao importar dados. Verifique sua conexão e tente novamente.");
          setStep('preview');
      }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
        { Data: '25/12/2024', Descrição: 'Exemplo Receita', Categoria: 'Procedimentos', Valor: 500.00, Tipo: 'Receita', Paciente: 'João Silva' },
        { Data: '26/12/2024', Descrição: 'Exemplo Despesa', Categoria: 'Aluguel', Valor: 2000.00, Tipo: 'Despesa', Paciente: '' },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "Modelo_Importacao_Clinify.xlsx");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                        Importador de Dados
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        {step === 'upload' && 'Selecione seu arquivo para começar'}
                        {step === 'preview' && 'Revise os dados antes de confirmar'}
                        {step === 'processing' && 'Processando dados...'}
                        {step === 'result' && 'Importação concluída!'}
                    </p>
                </div>
                {step !== 'processing' && (
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col p-6">
                
                {/* STEP 1: UPLOAD */}
                {step === 'upload' && (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95 duration-300">
                         <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full max-w-lg border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all group"
                         >
                            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <UploadCloud className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Clique para carregar</h4>
                            <p className="text-slate-500 text-center max-w-xs mb-6">
                                Suporta arquivos .xlsx e .csv. O sistema tentará identificar as colunas automaticamente.
                            </p>
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                accept=".xlsx, .xls, .csv" 
                                className="hidden" 
                                onChange={handleFileUpload}
                            />
                            <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg">
                                Selecionar Arquivo
                            </button>
                         </div>

                         <div className="text-center">
                             <p className="text-sm text-slate-500 mb-2">Precisa de um modelo?</p>
                             <button onClick={downloadTemplate} className="text-emerald-600 font-bold hover:underline flex items-center gap-1 mx-auto text-sm">
                                 <Download className="w-4 h-4" /> Baixar Planilha Modelo
                             </button>
                         </div>
                    </div>
                )}

                {/* STEP 2: PREVIEW */}
                {step === 'preview' && (
                    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in slide-in-from-right-8 duration-300">
                        {/* Stats Bar */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 shrink-0">
                            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                <p className="text-xs text-slate-500 font-bold uppercase">Total Lidos</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                <p className="text-xs text-emerald-600 font-bold uppercase">Válidos</p>
                                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{stats.valid}</p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800">
                                <p className="text-xs text-red-600 font-bold uppercase">Com Erro</p>
                                <p className="text-xl font-bold text-red-700 dark:text-red-400">{stats.invalid}</p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800">
                                <p className="text-xs text-blue-600 font-bold uppercase">Saldo Previsto</p>
                                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                                    {formatCurrency(stats.revenue - stats.expense)}
                                </p>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase text-xs sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Data</th>
                                        <th className="px-4 py-3">Descrição</th>
                                        <th className="px-4 py-3">Tipo</th>
                                        <th className="px-4 py-3">Valor</th>
                                        <th className="px-4 py-3">Problemas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {previewData.map((row) => (
                                        <tr key={row.id} className={`hover:bg-slate-100 dark:hover:bg-slate-800 ${!row.isValid ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                                            <td className="px-4 py-2">
                                                {row.isValid ? (
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                ) : (
                                                    <Ban className="w-5 h-5 text-red-500" />
                                                )}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-slate-600 dark:text-slate-300">
                                                {row.isValid 
                                                    ? new Date(row.date!).toLocaleDateString('pt-BR') 
                                                    : <span className="text-red-400 font-mono text-xs">{String(row.rawDate || 'N/A')}</span>
                                                }
                                            </td>
                                            <td className="px-4 py-2 text-slate-900 dark:text-white font-medium truncate max-w-[200px]">
                                                {row.description || '-'}
                                            </td>
                                            <td className="px-4 py-2">
                                                {row.isValid && (
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${row.type === 'revenue' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {row.type === 'revenue' ? 'Receita' : 'Despesa'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 font-bold text-slate-700 dark:text-slate-200">
                                                {row.isValid ? formatCurrency(row.amount!) : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-xs text-red-600 font-medium">
                                                {row.errors.join(', ')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Actions */}
                        <div className="pt-6 flex justify-between items-center shrink-0">
                            <button onClick={() => setStep('upload')} className="text-slate-500 font-bold hover:text-slate-700">
                                Voltar
                            </button>
                            <div className="flex gap-3">
                                <p className="text-sm text-slate-500 py-2.5">
                                    Serão importados <strong className="text-slate-900 dark:text-white">{stats.valid}</strong> registros.
                                </p>
                                <button 
                                    onClick={handleConfirmImport}
                                    disabled={stats.valid === 0}
                                    className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirmar Importação <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: PROCESSING */}
                {step === 'processing' && (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-in fade-in">
                        <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
                        <div className="w-full max-w-md space-y-2 text-center">
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white">Processando...</h4>
                            <p className="text-slate-500">Estamos inserindo seus dados de forma segura no banco de dados.</p>
                            
                            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-4">
                                <div 
                                    className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <p className="text-xs font-bold text-emerald-600">{progress}%</p>
                        </div>
                    </div>
                )}

                {/* STEP 4: RESULT */}
                {step === 'result' && (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95">
                        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                        </div>
                        <h4 className="text-3xl font-bold text-slate-900 dark:text-white text-center">Sucesso!</h4>
                        <p className="text-slate-500 text-center max-w-sm">
                            Os dados foram validados e importados corretamente para o sistema.
                        </p>
                        <button onClick={onClose} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all">
                            Fechar
                        </button>
                    </div>
                )}

            </div>
        </div>
    </div>
  );
};

export default DataImportModal;
