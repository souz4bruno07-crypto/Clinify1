import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Clock, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import api from '../../services/apiClient';

interface RenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: {
    plan: string;
    endDate: string | null;
    daysRemaining: number;
    daysSinceExpiration: number;
    requiresRenewal: boolean;
  };
  onRenewalSuccess?: () => void;
}

const RenewalModal: React.FC<RenewalModalProps> = ({ 
  isOpen, 
  onClose, 
  subscription,
  onRenewalSuccess 
}) => {
  const modalRef = useFocusTrap(isOpen);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  const plans = [
    { id: 'basic', name: 'Basic', price: 'R$ 97/mês', features: ['200 pacientes', '3 usuários', 'CRM básico'] },
    { id: 'professional', name: 'Professional', price: 'R$ 197/mês', features: ['Pacientes ilimitados', '10 usuários', 'Todos os módulos'] },
    { id: 'enterprise', name: 'Enterprise', price: 'Sob consulta', features: ['Ilimitado', 'White-label', 'Suporte premium'] }
  ];

  useEffect(() => {
    if (isOpen && !selectedPlan) {
      // Sugerir o plano atual ou o próximo nível
      const currentPlanIndex = plans.findIndex(p => p.id === subscription.plan);
      if (currentPlanIndex >= 0 && currentPlanIndex < plans.length - 1) {
        setSelectedPlan(plans[currentPlanIndex].id);
      } else {
        setSelectedPlan('professional');
      }
    }
  }, [isOpen, subscription.plan]);

  if (!isOpen) return null;

  const isExpired = subscription.daysSinceExpiration > 0;
  const daysRemaining = subscription.daysRemaining || 0;
  const isUrgent = daysRemaining <= 7;

  const handleRenewal = async () => {
    if (!selectedPlan) return;

    setIsLoading(true);
    try {
      // Aqui você pode redirecionar para a página de pagamento ou chamar a API
      // Por enquanto, vamos apenas simular
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Implementar integração com Stripe/Mercado Pago
      // await api.post('/billing/subscription/renew', { plan: selectedPlan });
      
      if (onRenewalSuccess) {
        onRenewalSuccess();
      }
      
      // Por enquanto, apenas fechar
      onClose();
    } catch (error: any) {
      console.error('Erro ao renovar:', error);
      alert('Erro ao processar renovação. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="renewal-modal-title"
      >
        {/* Header */}
        <div className={`p-6 border-b ${isUrgent ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {isUrgent ? (
                <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              ) : (
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              )}
              <div>
                <h2 id="renewal-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
                  {isExpired ? 'Renovação Urgente' : 'Renovar Assinatura'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {isExpired 
                    ? `Sua assinatura expirou há ${subscription.daysSinceExpiration} dias`
                    : `Sua assinatura expira em ${daysRemaining} dias`
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Aviso */}
          <div className={`p-4 rounded-xl ${isUrgent ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 mt-0.5 ${isUrgent ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`} />
              <div className="flex-1">
                <p className={`font-semibold ${isUrgent ? 'text-rose-900 dark:text-rose-100' : 'text-amber-900 dark:text-amber-100'}`}>
                  {isExpired 
                    ? `⚠️ Atenção: Você tem ${30 - subscription.daysSinceExpiration} dias restantes antes que seus dados sejam excluídos permanentemente.`
                    : '⚠️ Renove sua assinatura para continuar usando todos os recursos do sistema.'
                  }
                </p>
                {isExpired && (
                  <p className="text-sm text-rose-700 dark:text-rose-300 mt-2">
                    Após 30 dias da expiração, todos os seus dados serão excluídos automaticamente.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Planos */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Escolha um plano para renovar:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedPlan === plan.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900 dark:text-white">{plan.name}</h4>
                    {selectedPlan === plan.id && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                    {plan.price}
                  </p>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            disabled={isLoading}
          >
            Depois
          </button>
          <button
            onClick={handleRenewal}
            disabled={!selectedPlan || isLoading}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Renovar Agora
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenewalModal;
