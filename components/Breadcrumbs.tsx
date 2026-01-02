import React from 'react';
import { Link, useLocation } from 'react-router';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
}

const routeLabels: Record<string, string> = {
  home: 'Início',
  finance: 'CFO Digital',
  'finance/dashboard': 'Dashboard',
  'finance/lancamentos': 'Lançamentos',
  'finance/dre': 'DRE',
  'finance/relatorios': 'Relatórios',
  'finance/precificacao': 'Precificação',
  'finance/laboratorio': 'Laboratório',
  'finance/categorias': 'Categorias',
  kpis: 'KPIs Clínicos',
  comissoes: 'Metas & Comissões',
  agenda: 'Agenda Pro',
  crm: 'WhatsApp CRM',
  pacientes: 'Pacientes',
  prontuario: 'Prontuário',
  estoque: 'Estoque',
  orcamentos: 'Orçamentos',
  fidelidade: 'Fidelidade',
  configuracoes: 'Gestão',
};

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Não mostrar breadcrumbs na home
  if (pathnames.length <= 1 || (pathnames.length === 2 && pathnames[1] === 'home')) {
    return null;
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Início', path: '/dashboard/home' },
  ];

  // Construir breadcrumbs dinamicamente
  let currentPath = '/dashboard';
  pathnames.forEach((segment, index) => {
    if (segment === 'dashboard') return;
    
    currentPath += `/${segment}`;
    const label = routeLabels[segment] || routeLabels[pathnames.slice(1, index + 2).join('/')] || segment;
    
    // Não adicionar o último item se for o mesmo que o penúltimo (evitar duplicação)
    if (index < pathnames.length - 1 || segment !== pathnames[pathnames.length - 2]) {
      breadcrumbs.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        path: currentPath,
      });
    }
  });

  return (
    <nav className="flex items-center gap-2 text-sm mb-6 px-2" aria-label="Breadcrumb">
      <Link
        to="/dashboard/home"
        className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        aria-label="Ir para início"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <React.Fragment key={crumb.path}>
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            {isLast ? (
              <span className="font-black text-slate-900 dark:text-white">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-bold"
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;



