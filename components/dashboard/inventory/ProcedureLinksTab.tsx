import React, { useState, useEffect } from 'react';
import { 
  Plus, Link2, Package, Search, Trash2, Edit2, 
  Loader2, X, Save, AlertTriangle
} from 'lucide-react';
import { InventoryProduct, ProductProcedure } from '../../../types';
import { 
  getProductProcedures, 
  getProducts, 
  createProcedureLink, 
  deleteProcedureLink,
  getUnitLabel 
} from '../../../services/inventoryService';
import { formatCurrency } from '../../../utils/formatters';
import EmptyState from '../../ui/EmptyState';
import { useToast } from '../../../contexts/ToastContext';
import { useConfirmDialog } from '../../ui/ConfirmDialog';

interface ProcedureLinksTabProps {
  userId: string;
}

const ProcedureLinksTab: React.FC<ProcedureLinksTabProps> = ({ userId }) => {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [procedures, setProcedures] = useState<ProductProcedure[]>([]);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [proceduresData, productsData] = await Promise.all([
        getProductProcedures(),
        getProducts()
      ]);
      setProcedures(proceduresData);
      setProducts(productsData);
    } catch (error) {
      // Erro silencioso - loading state já indica problema
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Remover Vinculação',
      message: 'Deseja remover esta vinculação?',
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      variant: 'warning'
    });
    if (!confirmed) return;
    try {
      await deleteProcedureLink(id);
      toast.success('Item excluído!', 3000);
      loadData();
    } catch (error) {
      toast.error('Erro ao remover vinculação');
    }
  };

  // Agrupar por procedimento
  const groupedByProcedure = procedures.reduce((acc, proc) => {
    if (!acc[proc.procedureName]) {
      acc[proc.procedureName] = [];
    }
    acc[proc.procedureName].push(proc);
    return acc;
  }, {} as Record<string, ProductProcedure[]>);

  const filteredProcedures = Object.entries(groupedByProcedure)
    .filter(([name]) => name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar procedimento..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Vincular Produto
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-3xl p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-violet-500/20 rounded-xl">
            <Link2 className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Vinculação de Insumos</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Configure quais produtos/insumos são utilizados em cada procedimento e a quantidade padrão consumida. 
              Isso permite baixa automática do estoque ao finalizar um atendimento.
            </p>
          </div>
        </div>
      </div>

      {/* Procedures List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 animate-pulse h-32" />
          ))}
        </div>
      ) : filteredProcedures.length === 0 ? (
        <EmptyState
          icon="link"
          title={searchTerm ? 'Nenhum procedimento encontrado' : 'Nenhuma vinculação configurada'}
          description={searchTerm ? `Não encontramos procedimentos para "${searchTerm}"` : 'Vincule produtos aos procedimentos para facilitar o controle de estoque'}
          action={{ label: 'Criar Vinculação', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="space-y-4">
          {filteredProcedures.map(([procedureName, items]) => {
            const totalCost = items.reduce((acc, item) => {
              const product = products.find(p => p.id === item.productId);
              return acc + ((item.quantityPerUse || 0) * (product?.costPrice || 0));
            }, 0);

            const hasLowStock = items.some(item => {
              const product = products.find(p => p.id === item.productId);
              return product && product.currentStock < (item.quantityPerUse || 0);
            });

            return (
              <div 
                key={procedureName}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                      <Link2 className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-900 dark:text-white">{procedureName}</h3>
                      <p className="text-xs text-slate-500">{items.length} produto{items.length > 1 ? 's' : ''} vinculado{items.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {hasLowStock && (
                      <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg text-xs font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Estoque insuficiente
                      </span>
                    )}
                    <span className="text-sm font-bold text-slate-500">
                      Custo: <span className="text-slate-900 dark:text-white">{formatCurrency(totalCost)}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    const insufficientStock = product && product.currentStock < (item.quantityPerUse || 0);

                    return (
                      <div 
                        key={item.id}
                        className={`p-4 rounded-2xl flex items-center justify-between group ${
                          insufficientStock 
                            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                            : 'bg-slate-50 dark:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{item.productName}</p>
                            <p className="text-xs text-slate-500">
                              {item.quantityPerUse} {product ? getUnitLabel(product.unit) : 'un'} por uso
                              {!item.isRequired && ' (opcional)'}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Link Modal */}
      {showModal && (
        <ProcedureLinkModal
          products={products}
          onClose={() => setShowModal(false)}
          onSave={() => { loadData(); setShowModal(false); }}
        />
      )}
    </div>
  );
};

// Modal para criar vinculação
interface ProcedureLinkModalProps {
  products: InventoryProduct[];
  onClose: () => void;
  onSave: () => void;
}

const ProcedureLinkModal: React.FC<ProcedureLinkModalProps> = ({ products, onClose, onSave }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    procedureName: '',
    quantityPerUse: 1,
    isRequired: true,
    notes: ''
  });

  const COMMON_PROCEDURES = [
    'Botox Full Face',
    'Botox 3 Áreas',
    'Preenchimento Labial',
    'Preenchimento Malar',
    'Bioestimulador Sculptra',
    'Limpeza de Pele',
    'Peeling Químico',
    'Microagulhamento',
    'Fios de PDO',
    'Harmonização Facial',
    'Skinbooster',
    'Laser CO2',
    'Depilação a Laser'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.procedureName.trim()) {
      toast.warning('Selecione um produto e informe o procedimento');
      return;
    }

    setLoading(true);
    try {
      await createProcedureLink({
        productId: formData.productId,
        procedureName: formData.procedureName.trim(),
        quantityPerUse: formData.quantityPerUse,
        isRequired: formData.isRequired,
        notes: formData.notes || undefined
      });
      toast.success('Vinculação criada com sucesso!', 3000);
      onSave();
    } catch (error) {
      toast.error('Erro ao criar vinculação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl relative flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-500 rounded-2xl">
              <Link2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Vincular Produto
              </h2>
              <p className="text-sm text-slate-500">
                Associe um produto a um procedimento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Produto */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Produto *
            </label>
            <select
              value={formData.productId}
              onChange={e => setFormData(prev => ({ ...prev, productId: e.target.value }))}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
              required
            >
              <option value="">Selecione um produto</option>
              {products.filter(p => p.isActive).map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.currentStock} {p.unit} em estoque)
                </option>
              ))}
            </select>
          </div>

          {/* Procedimento */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Procedimento *
            </label>
            <input
              type="text"
              value={formData.procedureName}
              onChange={e => setFormData(prev => ({ ...prev, procedureName: e.target.value }))}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
              placeholder="Nome do procedimento"
              list="procedures-list"
              required
            />
            <datalist id="procedures-list">
              {COMMON_PROCEDURES.map(p => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          {/* Quantidade por Uso */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Quantidade por Uso
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={formData.quantityPerUse}
              onChange={e => setFormData(prev => ({ ...prev, quantityPerUse: parseFloat(e.target.value) || 1 }))}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Obrigatório */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isRequired"
              checked={formData.isRequired}
              onChange={e => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
              className="w-5 h-5 rounded-lg border-slate-300 text-violet-500 focus:ring-violet-500"
            />
            <label htmlFor="isRequired" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Produto obrigatório para este procedimento
            </label>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 resize-none"
              placeholder="Informações adicionais..."
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
            className="px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Criar Vinculação
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcedureLinksTab;

