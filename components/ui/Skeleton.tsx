import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  className?: string;
  animate?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  animate = true
}) => {
  const baseStyles = `
    bg-slate-200 dark:bg-slate-800
    relative overflow-hidden
    ${animate ? 'animate-shimmer' : ''}
  `;

  const variants = {
    text: 'rounded-lg h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-2xl'
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? undefined : '100px')
  };

  return (
    <div 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={style}
    />
  );
};

// Pre-built skeleton components
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 ${className}`}>
    <div className="flex items-center gap-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" height={12} />
      </div>
    </div>
    <Skeleton variant="rounded" height={80} />
    <div className="flex gap-2">
      <Skeleton variant="rounded" width={80} height={32} />
      <Skeleton variant="rounded" width={80} height={32} />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3">
    <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
      <Skeleton variant="text" width="20%" />
      <Skeleton variant="text" width="30%" />
      <Skeleton variant="text" width="25%" />
      <Skeleton variant="text" width="15%" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 p-4 border-b border-slate-100 dark:border-slate-800">
        <Skeleton variant="text" width="20%" />
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="text" width="25%" />
        <Skeleton variant="text" width="15%" />
      </div>
    ))}
  </div>
);

export const SkeletonStats: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-start mb-4">
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="rounded" width={60} height={20} />
        </div>
        <Skeleton variant="text" width="40%" height={12} className="mb-2" />
        <Skeleton variant="text" width="70%" height={28} />
      </div>
    ))}
  </div>
);

// Skeleton para Tabela de Pacientes (linhas com avatar + texto)
export const SkeletonPatientsTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <td className="px-8 py-6">
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" width={56} height={56} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="70%" height={16} />
              <div className="flex gap-2">
                <Skeleton variant="rounded" width={100} height={20} />
                <Skeleton variant="rounded" width={120} height={20} />
              </div>
            </div>
          </div>
        </td>
        <td className="px-8 py-6">
          <div className="space-y-1">
            <Skeleton variant="text" width="60%" height={12} />
            <Skeleton variant="text" width="80%" height={12} />
          </div>
        </td>
        <td className="px-8 py-6">
          <div className="space-y-0.5">
            <Skeleton variant="text" width="70%" height={12} />
            <Skeleton variant="text" width="50%" height={10} />
          </div>
        </td>
        <td className="px-8 py-6">
          <div className="flex justify-center gap-2">
            <Skeleton variant="rounded" width={40} height={40} />
            <Skeleton variant="rounded" width={40} height={40} />
          </div>
        </td>
      </tr>
    ))}
  </>
);

// Skeleton para Calendário (grade de horários)
export const SkeletonCalendar: React.FC<{ view?: 'day' | 'week' | 'month' }> = ({ view = 'day' }) => {
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  if (view === 'day') {
    return (
      <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-950 p-8 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton variant="text" width={200} height={24} />
              <Skeleton variant="text" width={150} height={12} />
            </div>
            <div className="flex gap-3">
              <Skeleton variant="rounded" width={48} height={48} />
              <Skeleton variant="rounded" width={48} height={48} />
            </div>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[800px]">
          {hours.map((hour) => (
            <div key={hour} className="flex border-b border-slate-50 dark:border-slate-800/50 min-h-[120px]">
              <div className="w-28 py-10 px-6 border-r border-slate-50 dark:border-slate-800/50">
                <Skeleton variant="text" width={60} height={12} />
              </div>
              <div className="flex-1 p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Skeleton variant="rounded" height={100} />
                  <Skeleton variant="rounded" height={100} />
                  <Skeleton variant="rounded" height={100} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'week') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-6 text-center border-b bg-slate-50 dark:bg-slate-950">
              <Skeleton variant="text" width={60} height={10} className="mx-auto mb-2" />
              <Skeleton variant="text" width={40} height={24} className="mx-auto" />
            </div>
            <div className="flex-1 p-3 space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} variant="rounded" height={80} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // month view
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="py-6 text-center">
            <Skeleton variant="text" width={40} height={10} className="mx-auto" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-[140px] md:auto-rows-[180px]">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="p-4 border-r border-b border-slate-50 dark:border-slate-800/50">
            <Skeleton variant="text" width={30} height={20} className="mb-2" />
            <div className="space-y-1">
              <Skeleton variant="rounded" height={20} />
              <Skeleton variant="rounded" height={20} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Skeleton para Dashboard Cards (retângulos com brilho animado)
export const SkeletonDashboardCards: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <div className="lg:col-span-8 bg-slate-900 rounded-[3.5rem] p-10 md:p-12 relative overflow-hidden">
      <div className="space-y-6">
        <Skeleton variant="text" width={200} height={12} className="bg-slate-700" />
        <Skeleton variant="text" width={300} height={60} className="bg-slate-700" />
        <div className="flex items-center gap-6 pt-8 border-t border-white/5">
          <div className="space-y-2">
            <Skeleton variant="text" width={100} height={10} className="bg-slate-700" />
            <Skeleton variant="text" width={80} height={24} className="bg-slate-700" />
          </div>
          <div className="h-10 w-px bg-white/5"></div>
          <div className="space-y-2">
            <Skeleton variant="text" width={100} height={10} className="bg-slate-700" />
            <Skeleton variant="text" width={120} height={24} className="bg-slate-700" />
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 p-12 opacity-5">
        <Skeleton variant="rounded" width={256} height={256} className="bg-slate-700" />
      </div>
    </div>
    <div className="lg:col-span-4 grid grid-cols-1 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-start mb-6">
            <Skeleton variant="rounded" width={48} height={48} />
            <Skeleton variant="text" width={80} height={10} />
          </div>
          <Skeleton variant="text" width={100} height={10} className="mb-1" />
          <Skeleton variant="text" width={150} height={32} />
        </div>
      ))}
    </div>
  </div>
);

// Skeleton para Cards de Agendamentos
export const SkeletonAppointmentCards: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div 
        key={i}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm"
      >
        <div className="flex items-start justify-between mb-6">
          <Skeleton variant="rounded" width={56} height={56} />
          <Skeleton variant="rounded" width={80} height={24} />
        </div>
        <Skeleton variant="text" width="80%" height={20} className="mb-1" />
        <Skeleton variant="text" width="60%" height={14} className="mb-6" />
        <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Skeleton variant="text" width={60} height={16} />
          <Skeleton variant="text" width={60} height={16} />
        </div>
      </div>
    ))}
  </div>
);

// Skeleton para Lista de Transações (linhas com valores)
export const SkeletonTransactionsList: React.FC<{ rows?: number }> = ({ rows = 8 }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-black uppercase text-[10px] tracking-widest">
        <tr>
          <th className="px-8 py-5"><Skeleton variant="text" width="60%" height={12} /></th>
          <th className="px-8 py-5"><Skeleton variant="text" width="70%" height={12} /></th>
          <th className="px-8 py-5"><Skeleton variant="text" width="50%" height={12} /></th>
          <th className="px-8 py-5 text-right"><Skeleton variant="text" width="40%" height={12} className="ml-auto" /></th>
          <th className="px-8 py-5 text-center"><Skeleton variant="text" width="30%" height={12} className="mx-auto" /></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <td className="px-8 py-5">
              <Skeleton variant="text" width={100} height={14} />
            </td>
            <td className="px-8 py-5">
              <Skeleton variant="text" width={180} height={16} />
            </td>
            <td className="px-8 py-5">
              <Skeleton variant="rounded" width={100} height={24} />
            </td>
            <td className="px-8 py-5 text-right">
              <Skeleton variant="text" width={120} height={20} className="ml-auto" />
            </td>
            <td className="px-8 py-5 text-center">
              <div className="flex items-center justify-center gap-2">
                <Skeleton variant="rounded" width={32} height={32} />
                <Skeleton variant="rounded" width={32} height={32} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Skeleton;







