import React from 'react';
import { FileQuestion, Search, Users, Calendar, MessageSquare, FileText, TrendingUp, Package, History, Link2, Wallet } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon?: 'default' | 'search' | 'users' | 'calendar' | 'chat' | 'document' | 'chart' | 'package' | 'history' | 'link' | 'wallet';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'default',
  title,
  description,
  action,
  className = ''
}) => {
  const icons = {
    default: FileQuestion,
    search: Search,
    users: Users,
    calendar: Calendar,
    chat: MessageSquare,
    document: FileText,
    chart: TrendingUp,
    package: Package,
    history: History,
    link: Link2,
    wallet: Wallet
  };

  const Icon = icons[icon];

  return (
    <div className={`flex flex-col items-center justify-center py-20 px-8 text-center ${className}`}>
      {/* Animated Icon Container */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-3xl flex items-center justify-center shadow-xl">
          <Icon className="w-10 h-10 text-slate-400" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mb-8">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <Button 
          variant="primary" 
          size="lg"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;


