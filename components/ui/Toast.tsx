import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
  onClose: (id: string) => void;
}

const variantConfig = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    progressColor: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-800',
    icon: XCircle,
    iconColor: 'text-rose-500',
    progressColor: 'bg-rose-500',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    progressColor: 'bg-amber-500',
  },
  info: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-800',
    icon: Info,
    iconColor: 'text-sky-500',
    progressColor: 'bg-sky-500',
  },
};

const Toast: React.FC<ToastProps> = ({ id, message, variant, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const config = variantConfig[variant];
  const Icon = config.icon;

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <div
      className={`
        relative overflow-hidden
        ${config.bg} ${config.border} border
        rounded-xl shadow-lg shadow-black/5
        transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        min-w-[320px] max-w-[420px]
      `}
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <p className={`${config.text} text-sm font-medium flex-1 pr-2 whitespace-pre-line`}>
          {message}
        </p>
        <button
          onClick={handleClose}
          className={`${config.text} hover:opacity-70 transition-opacity flex-shrink-0`}
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
        <div
          className={`h-full ${config.progressColor} transition-none`}
          style={{
            animation: `shrink ${duration}ms linear forwards`,
          }}
        />
      </div>
      
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default Toast;







