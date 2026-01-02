import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { 
  Search, Home, TrendingUp, Calendar, Users, MessageSquare, 
  FileText, Settings, ArrowRight, Command, X, Sparkles,
  Plus, BarChart3, Calculator, Tags, FlaskConical
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  path?: string;
  action?: () => void;
  category: 'navigation' | 'actions' | 'search';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onAction }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    { id: 'home', title: 'Ir para Início', subtitle: 'Dashboard principal', icon: <Home className="w-4 h-4" />, path: '/dashboard/home', category: 'navigation' },
    { id: 'finance', title: 'CFO Digital', subtitle: 'Gestão financeira completa', icon: <TrendingUp className="w-4 h-4" />, path: '/dashboard/finance', category: 'navigation' },
    { id: 'finance-dre', title: 'DRE & Relatórios', subtitle: 'Demonstrativo de resultados', icon: <BarChart3 className="w-4 h-4" />, path: '/dashboard/finance/dre', category: 'navigation' },
    { id: 'finance-pricing', title: 'Calculadora de Markup', subtitle: 'Precificação de procedimentos', icon: <Calculator className="w-4 h-4" />, path: '/dashboard/finance/precificacao', category: 'navigation' },
    { id: 'finance-lab', title: 'Laboratório Estratégico', subtitle: 'Análises avançadas', icon: <FlaskConical className="w-4 h-4" />, path: '/dashboard/finance/laboratorio', category: 'navigation' },
    { id: 'finance-categories', title: 'Plano de Contas', subtitle: 'Categorias financeiras', icon: <Tags className="w-4 h-4" />, path: '/dashboard/finance/categorias', category: 'navigation' },
    { id: 'agenda', title: 'Agenda Pro', subtitle: 'Agendamentos e calendário', icon: <Calendar className="w-4 h-4" />, path: '/dashboard/agenda', category: 'navigation' },
    { id: 'patients', title: 'Pacientes', subtitle: 'Base de pacientes', icon: <Users className="w-4 h-4" />, path: '/dashboard/pacientes', category: 'navigation' },
    { id: 'crm', title: 'WhatsApp CRM', subtitle: 'Central de comunicação', icon: <MessageSquare className="w-4 h-4" />, path: '/dashboard/crm', category: 'navigation' },
    { id: 'budgets', title: 'Orçamentos', subtitle: 'Propostas e planejamentos', icon: <FileText className="w-4 h-4" />, path: '/dashboard/orcamentos', category: 'navigation' },
    { id: 'settings', title: 'Configurações', subtitle: 'Gestão do sistema', icon: <Settings className="w-4 h-4" />, path: '/dashboard/configuracoes', category: 'navigation' },
    
    // Actions
    { id: 'new-transaction', title: 'Novo Lançamento', subtitle: 'Adicionar receita ou despesa', icon: <Plus className="w-4 h-4" />, action: () => onAction?.('new-transaction'), category: 'actions' },
    { id: 'new-patient', title: 'Novo Paciente', subtitle: 'Cadastrar paciente', icon: <Users className="w-4 h-4" />, action: () => onAction?.('new-patient'), category: 'actions' },
    { id: 'new-appointment', title: 'Novo Agendamento', subtitle: 'Reservar horário', icon: <Calendar className="w-4 h-4" />, action: () => onAction?.('new-appointment'), category: 'actions' },
    { id: 'new-budget', title: 'Novo Orçamento', subtitle: 'Criar proposta', icon: <FileText className="w-4 h-4" />, action: () => onAction?.('new-budget'), category: 'actions' },
    { id: 'ai-chat', title: 'Falar com IA', subtitle: 'Consultar assistente financeiro', icon: <Sparkles className="w-4 h-4" />, action: () => onAction?.('ai-chat'), category: 'actions' },
  ], [onAction]);

  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    
    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd => 
      cmd.title.toLowerCase().includes(lowerQuery) ||
      cmd.subtitle?.toLowerCase().includes(lowerQuery)
    );
  }, [commands, query]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      navigation: [],
      actions: [],
      search: []
    };
    
    filteredCommands.forEach(cmd => {
      groups[cmd.category].push(cmd);
    });
    
    return groups;
  }, [filteredCommands]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          const selected = filteredCommands[selectedIndex];
          if (selected) {
            if (selected.path) {
              navigate(selected.path);
              onClose();
            } else if (selected.action) {
              selected.action();
              onClose();
            }
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, navigate, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (cmd: CommandItem) => {
    if (cmd.path) {
      navigate(cmd.path);
    } else if (cmd.action) {
      cmd.action();
    }
    onClose();
  };

  const categoryLabels = {
    navigation: 'Navegação',
    actions: 'Ações Rápidas',
    search: 'Resultados'
  };

  let globalIndex = -1;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-300">
        {/* Search Input */}
        <div className="flex items-center gap-4 p-5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar comandos, páginas ou ações..."
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 font-bold text-sm"
          />
          <div className="flex items-center gap-2 shrink-0">
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="p-10 text-center">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-400">Nenhum resultado para "{query}"</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => {
              if (items.length === 0) return null;
              
              return (
                <div key={category} className="mb-4">
                  <div className="px-4 py-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </span>
                  </div>
                  
                  {items.map((cmd) => {
                    globalIndex++;
                    const isSelected = globalIndex === selectedIndex;
                    
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => handleSelect(cmd)}
                        className={`
                          w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-left
                          ${isSelected 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }
                        `}
                      >
                        <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                          ${isSelected 
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }
                        `}>
                          {cmd.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{cmd.title}</p>
                          {cmd.subtitle && (
                            <p className="text-[10px] text-slate-400 truncate">{cmd.subtitle}</p>
                          )}
                        </div>
                        
                        <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'translate-x-1' : ''}`} />
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer with shortcuts */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">↓</kbd>
              Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">↵</kbd>
              Selecionar
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;











