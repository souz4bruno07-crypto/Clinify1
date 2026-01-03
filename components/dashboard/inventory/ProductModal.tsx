import React, { useState, useEffect, useRef } from 'react';
import { X, Barcode, Package, Save, Loader2 } from 'lucide-react';
import { InventoryProduct, ProductUnit } from '../../../types';
import { createProduct, updateProduct, getProductByBarcode, PRODUCT_UNITS, DEFAULT_INVENTORY_CATEGORIES } from '../../../services/inventoryService';
import { useToast } from '../../../contexts/ToastContext';

interface ProductModalProps {
  product: InventoryProduct | null;
  onClose: () => void;
  onSave: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onSave }) => {
  const toast = useToast();
  const [loading, setSaving] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    barcode: product?.barcode || '',
    sku: product?.sku || '',
    category: product?.category || 'Geral',
    unit: (product?.unit || 'un') as ProductUnit,
    currentStock: product?.currentStock || 0,
    minStock: product?.minStock || 0,
    maxStock: product?.maxStock || undefined,
    costPrice: product?.costPrice || 0,
    salePrice: product?.salePrice || undefined,
    supplier: product?.supplier || '',
    location: product?.location || '',
    expirationDate: product?.expirationDate 
      ? new Date(product.expirationDate).toISOString().split('T')[0] 
      : '',
    batchNumber: product?.batchNumber || ''
  });

  const isEditing = !!product;

  const handleBarcodeCheck = async () => {
    if (!formData.barcode || formData.barcode.length < 8) return;
    
    setBarcodeLoading(true);
    try {
      const existing = await getProductByBarcode(formData.barcode);
      if (existing && existing.id !== product?.id) {
        toast.warning(`Já existe um produto com este código de barras: ${existing.name}`);
      }
    } catch (error) {
      // Produto não encontrado, ok para usar
    } finally {
      setBarcodeLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.warning('Digite o nome do produto');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        expirationDate: formData.expirationDate 
          ? new Date(formData.expirationDate).getTime() 
          : undefined,
        maxStock: formData.maxStock || undefined,
        salePrice: formData.salePrice || undefined
      };

      if (isEditing) {
        await updateProduct(product.id, data);
      } else {
        await createProduct(data);
      }

      toast.success(isEditing ? 'Dados atualizados!' : 'Produto cadastrado!', 3000);
      onSave();
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[3rem] shadow-2xl relative flex flex-col animate-in zoom-in-95 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-500 rounded-2xl">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isEditing ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <p className="text-sm text-slate-500">
                {isEditing ? 'Atualize as informações do produto' : 'Cadastre um novo produto ou insumo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Nome do Produto *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                placeholder="Ex: Toxina Botulínica 100U"
                required
              />
            </div>

            {/* Código de Barras */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Código de Barras
              </label>
              <div className="relative">
                <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={formData.barcode}
                  onChange={e => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                  onBlur={handleBarcodeCheck}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  placeholder="789123456789"
                />
                {barcodeLoading && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500 animate-spin" />
                )}
              </div>
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                SKU / Código Interno
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={e => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                placeholder="PROD-001"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              >
                {DEFAULT_INVENTORY_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Unidade */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Unidade de Medida
              </label>
              <select
                value={formData.unit}
                onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value as ProductUnit }))}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              >
                {PRODUCT_UNITS.map(unit => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
              </select>
            </div>

            {/* Estoque Atual (só para novo produto) */}
            {!isEditing && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Estoque Inicial
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.currentStock}
                  onChange={e => setFormData(prev => ({ ...prev, currentStock: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}

            {/* Estoque Mínimo */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Estoque Mínimo
              </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.minStock}
                  onChange={e => setFormData(prev => ({ ...prev, minStock: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  placeholder="Quantidade para alerta"
                />
            </div>

            {/* Estoque Máximo */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Estoque Máximo (opcional)
              </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.maxStock || ''}
                  onChange={e => setFormData(prev => ({ ...prev, maxStock: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
            </div>

            {/* Preço de Custo */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Preço de Custo (R$)
              </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPrice}
                  onChange={e => setFormData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  placeholder="0,00"
                />
            </div>

            {/* Preço de Venda */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Preço de Venda (opcional)
              </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salePrice || ''}
                  onChange={e => setFormData(prev => ({ ...prev, salePrice: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  placeholder="0,00"
                />
            </div>

            {/* Fornecedor */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Fornecedor
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={e => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                placeholder="Nome do fornecedor"
              />
            </div>

            {/* Localização */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Localização no Estoque
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                placeholder="Ex: Armário 2, Prateleira A"
              />
            </div>

            {/* Lote */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Número do Lote
              </label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={e => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                placeholder="LOTE2024-001"
              />
            </div>

            {/* Data de Validade */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Data de Validade
              </label>
              <input
                type="date"
                value={formData.expirationDate}
                onChange={e => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Descrição / Observações
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 resize-none"
                placeholder="Informações adicionais sobre o produto..."
              />
            </div>
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
            className="px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Produto'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;

