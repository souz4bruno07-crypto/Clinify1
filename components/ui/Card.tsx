import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glass' | 'dark' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'lg',
  rounded = '3xl',
  hover = false,
  className = '',
  onClick
}) => {
  const baseStyles = `
    relative overflow-hidden transition-all duration-300
    ${onClick ? 'cursor-pointer' : ''}
  `;

  const variants = {
    default: `
      bg-white dark:bg-slate-900 
      border border-slate-200 dark:border-slate-800 
      shadow-sm
    `,
    elevated: `
      bg-white dark:bg-slate-900 
      border border-slate-100 dark:border-slate-800 
      shadow-xl
    `,
    glass: `
      bg-white/70 dark:bg-slate-900/70 
      backdrop-blur-xl 
      border border-white/20 dark:border-slate-700/50
      shadow-xl
    `,
    dark: `
      bg-slate-900 dark:bg-slate-950 
      border border-slate-800 
      text-white shadow-2xl
    `,
    gradient: `
      bg-gradient-to-br from-emerald-500 to-emerald-600
      text-white shadow-2xl shadow-emerald-500/20
    `
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const roundings = {
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    '2xl': 'rounded-[2rem]',
    '3xl': 'rounded-[2.5rem]',
    '4xl': 'rounded-[3rem]'
  };

  const hoverStyles = hover ? `
    hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1
    active:scale-[0.98]
  ` : '';

  return (
    <div
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${paddings[padding]}
        ${roundings[rounded]}
        ${hoverStyles}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Sub-components
export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`mb-6 ${className}`}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <h3 className={`text-xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase ${className}`}>
    {children}
  </h3>
);

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <p className={`text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ${className}`}>
    {children}
  </p>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={className}>
    {children}
  </div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 ${className}`}>
    {children}
  </div>
);

export default Card;












