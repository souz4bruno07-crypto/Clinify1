import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest
    transition-all duration-300 transform
    active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    focus:outline-none focus:ring-4 focus:ring-offset-2
  `;

  const variants = {
    primary: `
      bg-emerald-600 text-white shadow-xl shadow-emerald-500/20
      hover:bg-emerald-700 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-0.5
      focus:ring-emerald-500/30
    `,
    secondary: `
      bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl
      hover:bg-slate-800 dark:hover:bg-slate-100 hover:shadow-2xl hover:-translate-y-0.5
      focus:ring-slate-500/30
    `,
    outline: `
      bg-transparent border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300
      hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10
      focus:ring-emerald-500/20
    `,
    ghost: `
      bg-transparent text-slate-600 dark:text-slate-400
      hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white
      focus:ring-slate-500/20
    `,
    danger: `
      bg-rose-600 text-white shadow-xl shadow-rose-500/20
      hover:bg-rose-700 hover:shadow-2xl hover:shadow-rose-500/30 hover:-translate-y-0.5
      focus:ring-rose-500/30
    `
  };

  const sizes = {
    sm: 'text-[9px] px-4 py-2 rounded-xl',
    md: 'text-[10px] px-6 py-3 rounded-2xl',
    lg: 'text-[11px] px-8 py-4 rounded-2xl',
    xl: 'text-xs px-10 py-5 rounded-3xl'
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;













