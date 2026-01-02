import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Package, AlertTriangle, Clock, 
  Edit2, Trash2, Filter, MoreVertical, Barcode,
  TrendingDown, TrendingUp, Download
} from 'lucide-react';
import { InventoryProduct } from '../../../types';
import { getProducts, deleteProduct, getInventoryCategories } from '../../../services/inventoryService';
import { formatCurrency } from '../../../utils/formatters';
import ProductModal from './ProductModal';
import MovementModal from './MovementModal';
import EmptyState from '../../ui/EmptyState';
import * as XLSX from 'xlsx';
import { useToast } from '../../../contexts/ToastContext';
import { useConfirmDialog } from '../../ui/ConfirmDialog';

interface ProductsTabProps {
  userId: string;
  onRefresh: () => void;
}

const ProductsTab: React.FC<ProductsTabProps> = ({ userId, onRefresh }) => {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showExpiring, setShowExpiring] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [selectedCategory, showLowStock, showExpiring]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        lowStock: showLowStock,
        expiring: showExpiring
      });
      setProducts(data);
    } catch (error) {
      // Erro silencioso - loading state já indica problema
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getInventoryCategories();
      setCategories(data);
    } catch (error) {
      // Erro silencioso - categorias opcionais
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Excluir Produto',
      message: 'Tem certeza que deseja excluir este produto?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'danger'
    });
    if (!confirmed) return;
    try {
      await deleteProduct(id);
      toast.success('Item excluído!', 3000);
      loadProducts();
      onRefresh();
    } catch (error) {
      toast.error('Erro ao excluir produto');
    }
  };

  const handleEdit = (product: InventoryProduct) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleNewMovement = (product: InventoryProduct) => {
    setSelectedProduct(product);
    setShowMovementModal(true);
  };

  const handleExport = () => {
    const dataToExport = products.map(p => ({
      Código: p.sku || p.barcode || '',
      Nome: p.name,
      Categoria: p.category,
      Estoque: p.currentStock,
      Unidade: p.unit,
      'Estoque Mínimo': p.minStock,
      'Preço Custo': p.costPrice,
      'Valor Total': p.currentStock * p.costPrice,
      Fornecedor: p.supplier || '',
      Validade: p.expirationDate ? new Date(p.expirationDate).toLocaleDateString('pt-BR') : ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
    XLSX.writeFile(wb, 'estoque-clinify.xlsx');
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.includes(searchTerm) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (product: InventoryProduct) => {
    if (product.currentStock === 0) return 'out';
    if (product.currentStock <= product.minStock) return 'low';
    return 'ok';
  };

  const getExpiryStatus = (product: InventoryProduct) => {
    if (!product.expirationDate) return null;
    const daysUntil = Math.ceil((product.expirationDate - Date.now()) / (24 * 60 * 60 * 1000));
    if (daysUntil <= 0) return 'expired';
    if (daysUntil <= 30) return 'expiring';
    return null;
  };

  const totalValue = products.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0);
  const lowStockCount = products.filter(p => p.currentStock <= p.minStock).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Produtos</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{products.length}</p>
            </div>
            <div className="p-3 bg-teal-50 dark:bg-teal-900/30 rounded-2xl">
              <Package className="w-6 h-6 text-teal-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Valor em Estoque</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(totalValue)}</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Estoque Baixo</p>
              <p className="text-3xl font-black text-amber-500 mt-1">{lowStockCount}</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl">
              <TrendingDown className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Categorias</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{categories.length}</p>
            </div>
            <div className="p-3 bg-violet-50 dark:bg-violet-900/30 rounded-2xl">
              <Filter className="w-6 h-6 text-violet-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, código..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-teal-500 w-64"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Todas Categorias</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 ${
                showLowStock
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Estoque Baixo
            </button>

            <button
              onClick={() => setShowExpiring(!showExpiring)}
              className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 ${
                showExpiring
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              Vencendo
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <button
              onClick={() => { setSelectedProduct(null); setShowProductModal(true); }}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 animate-pulse">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2 mb-2" />
              <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon="package"
          title={searchTerm ? 'Nenhum produto encontrado' : 'Comece a cadastrar seus produtos'}
          description={searchTerm ? `Não encontramos produtos para "${searchTerm}"` : 'Adicione produtos e insumos para controlar seu estoque'}
          action={{ label: 'Novo Produto', onClick: () => { setSelectedProduct(null); setShowProductModal(true); } }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => {
            const stockStatus = getStockStatus(product);
            const expiryStatus = getExpiryStatus(product);
            
            return (
              <div
                key={product.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-teal-500/50 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">{product.category}</p>
                  </div>
                  
                  <div className="relative">
                    <button
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.barcode && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-500">
                      <Barcode className="w-3 h-3" />
                      {product.barcode}
                    </span>
                  )}
                  
                  {stockStatus === 'out' && (
                    <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-lg text-[10px] font-bold uppercase">
                      Sem Estoque
                    </span>
                  )}
                  
                  {stockStatus === 'low' && (
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg text-[10px] font-bold uppercase">
                      Estoque Baixo
                    </span>
                  )}
                  
                  {expiryStatus === 'expired' && (
                    <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-lg text-[10px] font-bold uppercase">
                      Vencido
                    </span>
                  )}
                  
                  {expiryStatus === 'expiring' && (
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg text-[10px] font-bold uppercase">
                      Vencendo
                    </span>
                  )}
                </div>

                {/* Stock Info */}
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Estoque Atual</p>
                    <p className={`text-3xl font-black ${
                      stockStatus === 'out' ? 'text-rose-500' :
                      stockStatus === 'low' ? 'text-amber-500' :
                      'text-slate-900 dark:text-white'
                    }`}>
                      {product.currentStock}
                      <span className="text-sm font-bold text-slate-400 ml-1">{product.unit}</span>
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase">Mínimo</p>
                    <p className="text-lg font-bold text-slate-500">{product.minStock} {product.unit}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-bold text-slate-400">Custo Unit.</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(product.costPrice)}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleNewMovement(product)}
                      className="px-4 py-2 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-xl text-xs font-bold hover:bg-teal-100 transition-all"
                    >
                      Movimentar
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expiration Date */}
                {product.expirationDate && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Validade: {new Date(product.expirationDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showProductModal && (
        <ProductModal
          product={selectedProduct}
          onClose={() => { setShowProductModal(false); setSelectedProduct(null); }}
          onSave={() => { loadProducts(); loadCategories(); onRefresh(); }}
        />
      )}

      {showMovementModal && selectedProduct && (
        <MovementModal
          product={selectedProduct}
          onClose={() => { setShowMovementModal(false); setSelectedProduct(null); }}
          onSave={() => { loadProducts(); onRefresh(); }}
        />
      )}
    </div>
  );
};

export default ProductsTab;

