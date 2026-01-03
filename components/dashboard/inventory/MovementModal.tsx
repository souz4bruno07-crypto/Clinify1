import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, RefreshCw, AlertTriangle, Save, Loader2 } from 'lucide-react';
import { InventoryProduct, MovementType, Staff } from '../../../types';
import { createMovement } from '../../../services/inventoryService';
import { getStaff } from '../../../services/backendService';
import { getUnitLabel } from '../../../services/inventoryService';
import { useToast } from '../../../contexts/ToastContext';

interface MovementModalProps {
  product: InventoryProduct;
  onClose: () => void;
  onSave: () => void;
  defaultType?: MovementType;
}

const MOVEMENT_TYPES: { value: MovementType; label: string; icon: typeof ArrowDownLeft; color: string }[] = [
  { value: 'entrada', label: 'Entrada', icon: ArrowDownLeft, color: 'emerald' },
  { value: 'saida', label: 'Saída', icon: ArrowUpRight, color: 'blue' },
  { value: 'ajuste', label: 'Ajuste', icon: RefreshCw, color: 'violet' },
  { value: 'perda', label: 'Perda', icon: AlertTriangle, color: 'amber' },
  { value: 'vencido', label: 'Vencido', icon: AlertTriangle, color: 'rose' },
];

const MovementModal: React.FC<MovementModalProps> = ({ product, onClose, onSave, defaultType = 'entrada' }) => {
  const toast = useToast();
  const [loading, setSaving] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);

  const [formData, setFormData] = useState({
    type: defaultType as MovementType,
    quantity: 0,
    reason: '',
    staffId: '',
    patientName: '',
    batchNumber: product.batchNumber || '',
    expirationDate: product.expirationDate 
      ? new Date(product.expirationDate).toISOString().split('T')[0] 
      : '',
    invoiceNumber: '',
    unitCost: product.costPrice
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const data = await getStaff('');
      setStaff(data);
    } catch (error) {
      // Erro silencioso - staff opcional
    }
  };

  const getPreviewStock = () => {
    const qty = formData.quantity || 0;
    switch (formData.type) {
      case 'entrada':
        return product.currentStock + qty;
      case 'saida':
      case 'perda':
      case 'vencido':
        return Math.max(0, product.currentStock - qty);
      case 'ajuste':
        return qty;
      default:
        return product.currentStock;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.quantity <= 0 && formData.type !== 'ajuste') {
      toast.warning('Digite uma quantidade válida');
      return;
    }

    if (['saida', 'perda', 'vencido'].includes(formData.type) && formData.quantity > product.currentStock) {
      toast.warning('Quantidade maior que o estoque disponível');
      return;
    }

    setSaving(true);
    try {
      await createMovement({
        productId: product.id,
        type: formData.type,
        quantity: formData.quantity,
        reason: formData.reason || undefined,
        staffId: formData.staffId || undefined,
        patientName: formData.patientName || undefined,
        batchNumber: formData.batchNumber || undefined,
        expirationDate: formData.expirationDate 
          ? new Date(formData.expirationDate).getTime() 
          : undefined,
        invoiceNumber: formData.invoiceNumber || undefined,
        unitCost: formData.unitCost || undefined
      });

      toast.success('Movimentação registrada com sucesso!', 3000);
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar movimentação');
    } finally {
      setSaving(false);
    }
  };

  const selectedType = MOVEMENT_TYPES.find(t => t.value === formData.type)!;
  const previewStock = getPreviewStock();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl relative flex flex-col animate-in zoom-in-95 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Movimentar Estoque
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {product.name}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Estoque Atual:</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {product.currentStock} {getUnitLabel(product.unit)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
          {/* Tipo de Movimentação */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Tipo de Movimentação
            </label>
            <div className="grid grid-cols-5 gap-2">
              {MOVEMENT_TYPES.map(type => {
                const Icon = type.icon;
                const isSelected = formData.type === type.value;
                const colorClasses = {
                  emerald: isSelected ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-200 hover:border-emerald-500 text-slate-500',
                  blue: isSelected ? 'bg-blue-500 text-white border-blue-500' : 'border-slate-200 hover:border-blue-500 text-slate-500',
                  violet: isSelected ? 'bg-violet-500 text-white border-violet-500' : 'border-slate-200 hover:border-violet-500 text-slate-500',
                  amber: isSelected ? 'bg-amber-500 text-white border-amber-500' : 'border-slate-200 hover:border-amber-500 text-slate-500',
                  rose: isSelected ? 'bg-rose-500 text-white border-rose-500' : 'border-slate-200 hover:border-rose-500 text-slate-500',
                };
                
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${colorClasses[type.color as keyof typeof colorClasses]}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantidade */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              {formData.type === 'ajuste' ? 'Novo Estoque' : 'Quantidade'}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.quantity}
                onChange={e => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                className="flex-1 px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-2xl font-black text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                placeholder="0"
              />
              <span className="text-sm font-bold text-slate-400 w-20">
                {getUnitLabel(product.unit)}
              </span>
            </div>
            
            {/* Preview */}
            {formData.quantity > 0 && (
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Estoque após movimentação:</span>
                <span className={`text-xl font-black ${
                  previewStock <= product.minStock ? 'text-amber-500' : 
                  previewStock === 0 ? 'text-rose-500' : 
                  'text-emerald-500'
                }`}>
                  {previewStock} {product.unit}
                </span>
              </div>
            )}
          </div>

          {/* Campos específicos por tipo */}
          {formData.type === 'entrada' && (
            <>
              {/* Custo Unitário */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Custo Unitário (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitCost}
                  onChange={e => setFormData(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Nota Fiscal */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Número da Nota Fiscal
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={e => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  placeholder="NF-e 12345"
                />
              </div>

              {/* Lote e Validade */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Lote
                  </label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={e => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    placeholder="LOTE2024-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Validade
                  </label>
                  <input
                    type="date"
                    value={formData.expirationDate}
                    onChange={e => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </>
          )}

          {formData.type === 'saida' && (
            <>
              {/* Profissional */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Profissional Responsável
                </label>
                <select
                  value={formData.staffId}
                  onChange={e => setFormData(prev => ({ ...prev, staffId: e.target.value }))}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Selecione (opcional)</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Paciente */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Paciente
                </label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={e => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  placeholder="Nome do paciente (opcional)"
                />
              </div>
            </>
          )}

          {/* Motivo/Observação */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Motivo / Observação
            </label>
            <textarea
              value={formData.reason}
              onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              rows={2}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 resize-none"
              placeholder={
                formData.type === 'entrada' ? 'Ex: Reposição de estoque' :
                formData.type === 'saida' ? 'Ex: Procedimento de botox' :
                formData.type === 'ajuste' ? 'Ex: Correção após inventário' :
                formData.type === 'perda' ? 'Ex: Produto danificado' :
                'Ex: Produto expirado'
              }
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-8 py-3 text-white rounded-2xl font-bold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 ${
              selectedType.color === 'emerald' ? 'bg-emerald-500 hover:shadow-emerald-500/25' :
              selectedType.color === 'blue' ? 'bg-blue-500 hover:shadow-blue-500/25' :
              selectedType.color === 'violet' ? 'bg-violet-500 hover:shadow-violet-500/25' :
              selectedType.color === 'amber' ? 'bg-amber-500 hover:shadow-amber-500/25' :
              'bg-rose-500 hover:shadow-rose-500/25'
            }`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Registrar {selectedType.label}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovementModal;

