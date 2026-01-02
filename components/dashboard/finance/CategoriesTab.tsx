
import React, { useState } from 'react';
import { Category } from '../../../types';
import { 
  Plus, Tag, Trash2, Edit3, X, Check, 
  ArrowDownCircle, ArrowUpCircle, Info, 
  AlertCircle, Loader2, Filter
} from 'lucide-react';
import { addCategory, updateCategory, deleteCategory } from '../../../services/backendService';
import { useToast } from '../../../contexts/ToastContext';
import { useConfirmDialog } from '../../ui/ConfirmDialog';

interface CategoriesTabProps {
  categories: Category[];
  user: any;
  onRefresh: () => void;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({ categories, user, onRefresh }) => {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    type: 'expense_variable' as Category['type'] 
  });

  const handleOpenModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({ name: cat.name, type: cat.type });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', type: 'expense_variable' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name) return;
    setIsSubmitting(true);

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData.name);
      } else {
        await addCategory({
          name: formData.name,
          type: formData.type,
          userId: user.id
        });
      }
      toast.success(editingCategory ? 'Dados atualizados!' : 'Categoria salva com sucesso!', 3000);
      onRefresh();
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar categoria');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Excluir Categoria',
      message: 'Tem certeza? Isso pode afetar a exibição de lançamentos antigos vinculados a esta categoria.',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'warning'
    });
    if (confirmed) {
      await deleteCategory(id);
      toast.success('Item excluído!', 3000);
      onRefresh();
    }
  };

  const GroupBox = ({ title, type, color, icon: Icon }: any) => {
    const filtered = categories.filter(c => c.type === type);
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
        <div className={`p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 ${color} bg-opacity-5`}>
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm ${color}`}>
                <Icon className="w-5 h-5" />
             </div>
             <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">{title}</h3>
          </div>
          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-black text-slate-500">
            {filtered.length}
          </span>
        </div>
        
        <div className="p-4 flex-1 space-y-2 overflow-y-auto max-h-[400px] no-scrollbar">
          {filtered.map(cat => (
            <div key={cat.id} className="group flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenModal(cat)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
                {cat.userId && (
                  <button onClick={() => handleDelete(cat.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-xs text-slate-400 italic">Nenhuma categoria registrada.</p>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30">
           <button 
             onClick={() => { setFormData({ ...formData, type }); setIsModalOpen(true); setEditingCategory(null); }}
             className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-600 hover:border-emerald-500 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
           >
              <Plus className="w-4 h-4" /> Nova Categoria
           </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <Tag className="w-6 h-6 text-emerald-600" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Plano de Contas</span>
           </div>
           <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic">Gerenciar Categorias</h2>
           <p className="text-slate-500 font-medium mt-2 max-w-xl">Personalize como suas receitas e despesas são classificadas para gerar relatórios precisos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <GroupBox title="Receitas" type="revenue" color="text-emerald-600" icon={ArrowDownCircle} />
         <GroupBox title="Custos Variáveis" type="expense_variable" color="text-blue-600" icon={Filter} />
         <GroupBox title="Despesas Fixas" type="expense_fixed" color="text-rose-600" icon={ArrowUpCircle} />
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 p-6 rounded-3xl flex gap-4">
         <Info className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
         <div>
            <h4 className="font-black text-indigo-900 dark:text-indigo-300 text-sm uppercase mb-1">Dica Estratégica</h4>
            <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed font-medium">
               Mantenha categorias de <strong>Despesas Fixas</strong> curtas (ex: Aluguel, Luz, Pro-labore). 
               Para <strong>Custos Variáveis</strong>, separe Insumos de Comissões para que o Clinify calcule sua Margem de Contribuição corretamente na DRE.
            </p>
         </div>
      </div>

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl relative flex flex-col animate-in zoom-in-95 border border-white/10 overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                {editingCategory ? 'Renomear Categoria' : 'Nova Categoria'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X className="w-6 h-6"/></button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              {!editingCategory && (
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Categoria</label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                       <button 
                         type="button" 
                         onClick={() => setFormData({...formData, type: 'revenue'})}
                         className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.type === 'revenue' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-100 dark:border-slate-800 text-slate-500'}`}
                       >
                          <p className={`font-black text-sm ${formData.type === 'revenue' ? 'text-emerald-700' : ''}`}>Receita</p>
                          <p className="text-[10px] font-medium opacity-60">Entradas de dinheiro (Procedimentos, Vendas)</p>
                       </button>
                       <button 
                         type="button" 
                         onClick={() => setFormData({...formData, type: 'expense_variable'})}
                         className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.type === 'expense_variable' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800 text-slate-500'}`}
                       >
                          <p className={`font-black text-sm ${formData.type === 'expense_variable' ? 'text-blue-700' : ''}`}>Custo Variável</p>
                          <p className="text-[10px] font-medium opacity-60">Gasto que sobe conforme você vende (Botox, Fios)</p>
                       </button>
                       <button 
                         type="button" 
                         onClick={() => setFormData({...formData, type: 'expense_fixed'})}
                         className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.type === 'expense_fixed' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10' : 'border-slate-100 dark:border-slate-800 text-slate-500'}`}
                       >
                          <p className={`font-black text-sm ${formData.type === 'expense_fixed' ? 'text-rose-700' : ''}`}>Despesa Fixa</p>
                          <p className="text-[10px] font-medium opacity-60">Custo de estrutura (Aluguel, Software, Luz)</p>
                       </button>
                    </div>
                 </div>
              )}

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Categoria</label>
                <input 
                  autoFocus
                  required
                  placeholder="Ex: Toxina Botulínica, Aluguel..."
                  className="w-full mt-2 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-5 font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-3">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black uppercase text-xs tracking-widest text-slate-400">Cancelar</button>
                 <button 
                   type="submit" 
                   disabled={isSubmitting}
                   className="flex-[2] bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95"
                 >
                   {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> {editingCategory ? 'Salvar' : 'Criar Category'}</>}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesTab;
