import React, { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: 'default' | 'filled' | 'ghost';
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  hint,
  variant = 'default',
  className = '',
  children,
  ...props
}, ref) => {
  const baseStyles = `
    w-full transition-all duration-300 font-bold
    focus:outline-none focus:ring-4
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    default: `
      bg-white dark:bg-slate-900 
      border border-slate-200 dark:border-slate-700
      text-slate-900 dark:text-white
      focus:ring-emerald-500/10 focus:border-emerald-500
      rounded-2xl py-4 px-5
    `,
    filled: `
      bg-slate-50 dark:bg-slate-800 
      border-none
      text-slate-900 dark:text-white
      focus:ring-emerald-500/10
      rounded-2xl py-4 px-6
    `,
    ghost: `
      bg-transparent 
      border-b-2 border-slate-200 dark:border-slate-700
      text-slate-900 dark:text-white
      focus:border-emerald-500 focus:ring-0
      rounded-none py-3 px-0
    `
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
          {label}
        </label>
      )}
      
      <select
        ref={ref}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${error ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      
      {error && (
        <p className="mt-2 text-xs font-bold text-rose-500 ml-1">{error}</p>
      )}
      
      {hint && !error && (
        <p className="mt-2 text-xs font-medium text-slate-400 ml-1">{hint}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
