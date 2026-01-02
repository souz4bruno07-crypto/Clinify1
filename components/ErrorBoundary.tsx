import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Erro capturado:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} />;
    }

    return this.props.children;
  }
}

const ErrorFallback: React.FC<{ error: Error | null; errorInfo: ErrorInfo | null }> = ({ error, errorInfo }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = React.useState(false);

  const handleReset = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              Ops! Algo deu errado
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Ocorreu um erro inesperado no sistema
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 mb-6">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
            {error?.message || 'Erro desconhecido'}
          </p>

          {showDetails && errorInfo && (
            <details className="mt-4">
              <summary className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer mb-2">
                Detalhes Técnicos
              </summary>
              <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 p-4 rounded-xl overflow-auto max-h-64">
                {errorInfo.componentStack}
              </pre>
            </details>
          )}

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-2 hover:underline"
          >
            {showDetails ? 'Ocultar' : 'Mostrar'} detalhes
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Recarregar Página
          </button>
          <button
            onClick={() => navigate('/dashboard/home')}
            className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white py-3 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-colors"
          >
            <Home className="w-4 h-4" />
            Início
          </button>
        </div>
      </div>
    </div>
  );
};

// Wrapper funcional para usar hooks
const ErrorBoundary: React.FC<Props> = (props) => {
  return <ErrorBoundaryClass {...props} />;
};

export default ErrorBoundary;



