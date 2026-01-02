import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  className = '',
  ariaLabelledBy,
  ariaDescribedBy
}) => {
  const modalRef = useFocusTrap(isOpen);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]'
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg animate-in fade-in duration-300"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div 
        ref={modalRef}
        className={`
          relative w-full ${sizes[size]}
          bg-white dark:bg-slate-900 
          rounded-[3rem] shadow-2xl 
          border border-white/10
          overflow-hidden
          animate-in zoom-in-95 slide-in-from-bottom-4 duration-300
          ${className}
        `}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:scale-110 transition-all"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
        
        {children}
      </div>
    </div>
  );
};

// Sub-components
export const ModalHeader: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  icon?: React.ReactNode;
}> = ({ children, className = '', icon }) => (
  <div className={`p-8 md:p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 ${className}`}>
    <div className="flex items-center gap-4">
      {icon && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl">
          {icon}
        </div>
      )}
      <div className="flex-1 pr-12">
        {children}
      </div>
    </div>
  </div>
);

export const ModalTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <h3 className={`text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none ${className}`}>
    {children}
  </h3>
);

export const ModalDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <p className={`text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 ${className}`}>
    {children}
  </p>
);

export const ModalBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`p-8 md:p-10 overflow-y-auto max-h-[60vh] ${className}`}>
    {children}
  </div>
);

export const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`p-8 md:p-10 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-4 ${className}`}>
    {children}
  </div>
);

export default Modal;








