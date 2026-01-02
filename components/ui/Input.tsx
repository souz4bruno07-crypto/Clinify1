import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'ghost';
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  variant = 'default',
  className = '',
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
      text-slate-900 dark:text-white placeholder-slate-400
      focus:ring-emerald-500/10 focus:border-emerald-500
      rounded-2xl py-4 px-5
    `,
    filled: `
      bg-slate-50 dark:bg-slate-800 
      border-none
      text-slate-900 dark:text-white placeholder-slate-400
      focus:ring-emerald-500/10
      rounded-2xl py-4 px-6
    `,
    ghost: `
      bg-transparent 
      border-b-2 border-slate-200 dark:border-slate-700
      text-slate-900 dark:text-white placeholder-slate-400
      focus:border-emerald-500 focus:ring-0
      rounded-none py-3 px-0
    `
  };

  const iconPadding = leftIcon ? 'pl-12' : '';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
          {label}
        </label>
      )}
      
      <div className="relative group">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-slate-400 group-focus-within:text-emerald-500 transition-colors">
              {leftIcon}
            </span>
          </div>
        )}
        
        <input
          ref={ref}
          className={`
            ${baseStyles}
            ${variants[variant]}
            ${iconPadding}
            ${error ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500' : ''}
            ${className}
          `}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <span className="text-slate-400">
              {rightIcon}
            </span>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-xs font-bold text-rose-500 ml-1">{error}</p>
      )}
      
      {hint && !error && (
        <p className="mt-2 text-xs font-medium text-slate-400 ml-1">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;











