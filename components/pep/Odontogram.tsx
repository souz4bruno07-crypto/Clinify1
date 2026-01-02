import React, { useState } from 'react';
import { ToothData, ToothCondition } from '../../types';
import { X, Check, RotateCcw, Info } from 'lucide-react';

interface OdontogramProps {
  teeth: ToothData[];
  onToothUpdate: (tooth: ToothData) => void;
  readOnly?: boolean;
}

// Mapeamento das condições com cores e labels
const CONDITIONS: Record<ToothCondition, { color: string; label: string; bgClass: string }> = {
  healthy: { color: '#10b981', label: 'Saudável', bgClass: 'bg-emerald-500' },
  caries: { color: '#ef4444', label: 'Cárie', bgClass: 'bg-red-500' },
  filling: { color: '#3b82f6', label: 'Restauração', bgClass: 'bg-blue-500' },
  crown: { color: '#f59e0b', label: 'Coroa', bgClass: 'bg-amber-500' },
  extraction: { color: '#dc2626', label: 'Extração Indicada', bgClass: 'bg-red-600' },
  missing: { color: '#64748b', label: 'Ausente', bgClass: 'bg-slate-500' },
  implant: { color: '#8b5cf6', label: 'Implante', bgClass: 'bg-violet-500' },
  root_canal: { color: '#ec4899', label: 'Canal', bgClass: 'bg-pink-500' },
  prosthesis: { color: '#14b8a6', label: 'Prótese', bgClass: 'bg-teal-500' },
  fracture: { color: '#f97316', label: 'Fratura', bgClass: 'bg-orange-500' },
};

// Dentes permanentes - numeração FDI
const PERMANENT_TEETH = {
  upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
};

// Dentes decíduos - numeração FDI
const DECIDUOUS_TEETH = {
  upper: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
  lower: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
};

const Tooth: React.FC<{
  id: number;
  data: ToothData;
  onClick: () => void;
  isSelected: boolean;
  readOnly?: boolean;
}> = ({ id, data, onClick, isSelected, readOnly }) => {
  const condition = CONDITIONS[data.condition];
  const isMissing = data.condition === 'missing';
  
  return (
    <button
      onClick={onClick}
      disabled={readOnly}
      className={`
        relative w-12 h-14 md:w-14 md:h-16 rounded-xl border-2 transition-all duration-300
        flex flex-col items-center justify-center gap-1
        ${isSelected 
          ? 'border-cyan-400 ring-4 ring-cyan-400/30 scale-110 z-10' 
          : 'border-slate-700 hover:border-slate-500'
        }
        ${isMissing ? 'opacity-40' : ''}
        ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-105'}
        bg-slate-800/80 backdrop-blur-sm
      `}
    >
      {/* Número do dente */}
      <span className="text-[10px] font-black text-slate-400">{id}</span>
      
      {/* Indicador de condição */}
      <div 
        className={`w-6 h-6 rounded-lg ${condition.bgClass} flex items-center justify-center`}
        title={condition.label}
      >
        {data.condition === 'missing' && <X className="w-4 h-4 text-white" />}
        {data.condition === 'extraction' && <X className="w-4 h-4 text-white" />}
        {data.condition === 'healthy' && <Check className="w-4 h-4 text-white" />}
      </div>
      
      {/* Indicador de notas */}
      {data.notes && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
      )}
    </button>
  );
};

const Odontogram: React.FC<OdontogramProps> = ({ teeth, onToothUpdate, readOnly = false }) => {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [showDeciduous, setShowDeciduous] = useState(false);
  const [toothNote, setToothNote] = useState('');

  const getToothData = (id: number): ToothData => {
    return teeth.find(t => t.id === id) || {
      id,
      condition: 'healthy',
      updatedAt: Date.now(),
    };
  };

  const handleToothClick = (id: number) => {
    if (readOnly) return;
    setSelectedTooth(selectedTooth === id ? null : id);
    const tooth = getToothData(id);
    setToothNote(tooth.notes || '');
  };

  const handleConditionChange = (condition: ToothCondition) => {
    if (!selectedTooth) return;
    const tooth = getToothData(selectedTooth);
    onToothUpdate({
      ...tooth,
      id: selectedTooth,
      condition,
      notes: toothNote,
      updatedAt: Date.now(),
    });
  };

  const handleNoteSave = () => {
    if (!selectedTooth) return;
    const tooth = getToothData(selectedTooth);
    onToothUpdate({
      ...tooth,
      notes: toothNote,
      updatedAt: Date.now(),
    });
  };

  const currentTeeth = showDeciduous ? DECIDUOUS_TEETH : PERMANENT_TEETH;
  const selectedToothData = selectedTooth ? getToothData(selectedTooth) : null;

  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            🦷 Odontograma Digital
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {showDeciduous ? 'Dentição Decídua (Infantil)' : 'Dentição Permanente (Adulto)'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeciduous(!showDeciduous)}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {showDeciduous ? 'Permanentes' : 'Decíduos'}
          </button>
        </div>
      </div>

      {/* Legenda rápida */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-slate-800/50 rounded-2xl">
        {Object.entries(CONDITIONS).map(([key, value]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${value.bgClass}`} />
            <span className="text-[10px] text-slate-400 font-medium">{value.label}</span>
          </div>
        ))}
      </div>

      {/* Grid dos dentes */}
      <div className="space-y-8">
        {/* Arcada Superior */}
        <div className="relative">
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase tracking-widest -rotate-90 origin-center whitespace-nowrap">
            Superior
          </div>
          <div className="flex justify-center gap-1 md:gap-2 flex-wrap ml-6">
            {currentTeeth.upper.map((id) => (
              <Tooth
                key={id}
                id={id}
                data={getToothData(id)}
                onClick={() => handleToothClick(id)}
                isSelected={selectedTooth === id}
                readOnly={readOnly}
              />
            ))}
          </div>
        </div>

        {/* Linha divisória */}
        <div className="flex items-center gap-4 px-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Linha de Oclusão
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
        </div>

        {/* Arcada Inferior */}
        <div className="relative">
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase tracking-widest -rotate-90 origin-center whitespace-nowrap">
            Inferior
          </div>
          <div className="flex justify-center gap-1 md:gap-2 flex-wrap ml-6">
            {currentTeeth.lower.map((id) => (
              <Tooth
                key={id}
                id={id}
                data={getToothData(id)}
                onClick={() => handleToothClick(id)}
                isSelected={selectedTooth === id}
                readOnly={readOnly}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Painel de edição do dente selecionado */}
      {selectedTooth && !readOnly && (
        <div className="mt-8 p-6 bg-slate-800 rounded-2xl border border-slate-700 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              Dente {selectedTooth}
            </h4>
            <button
              onClick={() => setSelectedTooth(null)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Seletor de condição */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
            {Object.entries(CONDITIONS).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleConditionChange(key as ToothCondition)}
                className={`
                  p-3 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all
                  ${selectedToothData?.condition === key
                    ? `${value.bgClass} text-white ring-2 ring-white/30`
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }
                `}
              >
                {value.label}
              </button>
            ))}
          </div>

          {/* Notas do dente */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Observações
            </label>
            <textarea
              value={toothNote}
              onChange={(e) => setToothNote(e.target.value)}
              onBlur={handleNoteSave}
              placeholder="Adicione observações sobre este dente..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Odontogram;











