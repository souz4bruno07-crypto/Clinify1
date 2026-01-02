import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertTriangle, Trash2, Info, HelpCircle, X } from 'lucide-react';

type ConfirmVariant = 'danger' | 'warning' | 'info' | 'default';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export const useConfirmDialog = (): ConfirmDialogContextType => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider');
  }
  return context;
};

const variantConfig = {
  danger: {
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    icon: Trash2,
    buttonBg: 'bg-rose-600 hover:bg-rose-700',
    buttonText: 'text-white',
  },
  warning: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    icon: AlertTriangle,
    buttonBg: 'bg-amber-600 hover:bg-amber-700',
    buttonText: 'text-white',
  },
  info: {
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    icon: Info,
    buttonBg: 'bg-sky-600 hover:bg-sky-700',
    buttonText: 'text-white',
  },
  default: {
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    icon: HelpCircle,
    buttonBg: 'bg-slate-800 hover:bg-slate-900',
    buttonText: 'text-white',
  },
};

interface ConfirmDialogProviderProps {
  children: ReactNode;
}

interface DialogState extends ConfirmOptions {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
}

export const ConfirmDialogProvider: React.FC<ConfirmDialogProviderProps> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    message: '',
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        ...options,
        resolve,
      });
    });
  }, []);

  const handleConfirm = () => {
    dialog.resolve?.(true);
    setDialog((prev) => ({ ...prev, isOpen: false, resolve: null }));
  };

  const handleCancel = () => {
    dialog.resolve?.(false);
    setDialog((prev) => ({ ...prev, isOpen: false, resolve: null }));
  };

  const config = variantConfig[dialog.variant || 'default'];
  const Icon = config.icon;

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      
      {/* Dialog Overlay */}
      {dialog.isOpen && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
            onClick={handleCancel}
          />
          
          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn overflow-hidden">
            {/* Close button */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-6">
              {/* Icon */}
              <div className={`w-14 h-14 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Icon className={`w-7 h-7 ${config.iconColor}`} />
              </div>
              
              {/* Title */}
              <h3 
                id="confirm-dialog-title"
                className="text-lg font-semibold text-slate-900 text-center mb-2"
              >
                {dialog.title || 'Confirmar ação'}
              </h3>
              
              {/* Message */}
              <p className="text-slate-600 text-center text-sm whitespace-pre-line mb-6">
                {dialog.message}
              </p>
              
              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  {dialog.cancelText || 'Cancelar'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium ${config.buttonText} ${config.buttonBg} rounded-xl transition-colors`}
                >
                  {dialog.confirmText || 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>
    </ConfirmDialogContext.Provider>
  );
};

export default ConfirmDialogContext;











