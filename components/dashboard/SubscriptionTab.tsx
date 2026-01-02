import React, { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle2, XCircle, AlertCircle, Loader2,
  Crown, Sparkles, Zap, Building2, ArrowRight, Calendar, RefreshCw
} from 'lucide-react';
import { 
  getSubscription, 
  getAvailablePlans, 
  updateSubscriptionPlan,
  createOrUpdateSubscription,
  cancelSubscription,
  reactivateSubscription,
  createStripeCheckout,
  createMercadoPagoCheckout,
  type Subscription,
  type Plan
} from '../../services/backendService';
import { useToast } from '../../contexts/ToastContext';
import { useConfirmDialog } from '../ui/ConfirmDialog';

const SubscriptionTab: React.FC<{ user: any }> = ({ user }) => {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subData, plansData] = await Promise.all([
        getSubscription(),
        getAvailablePlans()
      ]);
      setSubscription(subData);
      setPlans(plansData || []);
    } catch (error) {
      toast.error('Erro ao carregar dados da assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SubscriptionTab.tsx:48',message:'handleUpgrade chamado',data:{planId,hasSubscription:!!subscription,subscriptionPlan:subscription?.plan},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion agent log
    
    // Verificar se o plano está disponível no Stripe (exceto free)
    if (planId !== 'free') {
      const plan = plans.find(p => p.id === planId);
      if (plan && plan.availableInStripe === false) {
        toast.error(`O plano ${planId.toUpperCase()} ainda não está disponível no Stripe. Configure o STRIPE_PRICE_ID_${planId.toUpperCase()} no arquivo .env do backend.`);
        return;
      }
    }

    // Se for plano free, atualizar diretamente sem pagamento
    if (planId === 'free') {
      const confirmed = await confirm({
        title: subscription ? 'Alterar para Plano Free' : 'Assinar Plano Free',
        message: subscription 
          ? 'Deseja alterar para o plano gratuito? Sua assinatura atual será cancelada.'
          : 'Deseja assinar o plano gratuito?',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        variant: 'info'
      });

      if (!confirmed) return;

      setUpdating(true);
      try {
        // Se não tem subscription, criar uma nova; senão, atualizar
        if (!subscription) {
          const newSubscription = await createOrUpdateSubscription({
            plan: planId,
            status: 'active',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
          });
          if (newSubscription) {
            setSubscription(newSubscription);
            toast.success('Plano ativado com sucesso!');
            loadData();
          }
        } else {
          const updated = await updateSubscriptionPlan(planId);
          if (updated) {
            setSubscription(updated);
            toast.success('Plano atualizado com sucesso!');
            loadData();
          }
        }
      } catch (error) {
        toast.error('Erro ao atualizar plano');
      } finally {
        setUpdating(false);
      }
      return;
    }

    // Para planos pagos, tentar usar Stripe primeiro, depois Mercado Pago
    setUpdating(true);
    try {
      // Tentar Stripe primeiro
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SubscriptionTab.tsx:86',message:'Chamando createStripeCheckout',data:{planId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion agent log
        const { url } = await createStripeCheckout(planId);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SubscriptionTab.tsx:88',message:'createStripeCheckout retornou com sucesso',data:{planId,hasUrl:!!url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion agent log
        if (url) {
          window.location.href = url;
          return; // Redireciona, não precisa continuar
        }
      } catch (stripeError: any) {
        // Se Stripe falhar, verificar o tipo de erro
        const errorMessage = stripeError.response?.data?.error || stripeError.message;
        const errorDetails = stripeError.response?.data?.details;
        const status = stripeError.response?.status;
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SubscriptionTab.tsx:92',message:'Erro ao criar checkout Stripe',data:{planId,status,errorMessage,errorDetails,errorType:stripeError?.type,errorCode:stripeError?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion agent log
        
        console.error('[SubscriptionTab] Erro ao criar checkout Stripe:', {
          status,
          error: errorMessage,
          details: errorDetails,
          planId
        });
        
        // Se for erro 503 (não configurado) ou erro 500 com mensagem sobre price ID, tentar Mercado Pago
        if (status === 503 || 
            (status === 500 && errorMessage?.includes('não está disponível'))) {
          // Tentar Mercado Pago como fallback
          try {
            const { initPoint } = await createMercadoPagoCheckout(planId);
            if (initPoint) {
              window.location.href = initPoint;
              return; // Redireciona
            }
          } catch (mercadoPagoError: any) {
            // Se ambos falharem, mostrar mensagem apropriada
            if (errorMessage?.includes('não está disponível') || errorMessage?.includes('não encontrado')) {
              toast.error(`O plano ${planId} não está configurado no Stripe. Verifique se o produto foi criado no Stripe Dashboard e se o STRIPE_PRICE_ID_${planId.toUpperCase()} está configurado no .env.`);
            } else if (status === 503) {
              toast.error('Stripe não está configurado. Configure STRIPE_SECRET_KEY no arquivo .env do backend.');
            } else {
              toast.error(`Erro ao processar pagamento: ${errorMessage}`);
            }
            setUpdating(false);
            return;
          }
        } else {
          // Se for outro tipo de erro, mostrar mensagem específica
          if (errorMessage?.includes('não está disponível') || errorMessage?.includes('não encontrado')) {
            toast.error(`O plano ${planId} não está disponível no Stripe. ${errorMessage}`);
          } else if (errorMessage?.includes('Stripe não está configurado')) {
            toast.error('Stripe não está configurado. Configure STRIPE_SECRET_KEY no arquivo .env do backend.');
          } else {
            // Mostrar mensagem de erro detalhada
            const fullMessage = errorDetails 
              ? `${errorMessage} (${errorDetails.type || ''} ${errorDetails.code || ''})`
              : errorMessage;
            toast.error(`Erro ao criar checkout: ${fullMessage}`);
          }
          setUpdating(false);
          return;
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message;
      console.error('[SubscriptionTab] Erro geral ao processar upgrade:', error);
      toast.error(errorMessage || 'Erro ao processar pagamento. Verifique os logs do console para mais detalhes.');
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;

    const confirmed = await confirm({
      title: 'Cancelar Assinatura',
      message: 'Deseja realmente cancelar sua assinatura? Ela permanecerá ativa até o final do período pago.',
      confirmText: 'Sim, Cancelar',
      cancelText: 'Manter Ativa',
      variant: 'danger'
    });

    if (!confirmed) return;

    setUpdating(true);
    try {
      const updated = await cancelSubscription(true);
      if (updated) {
        setSubscription(updated);
        toast.success('Assinatura cancelada. Ela permanecerá ativa até o final do período.');
        loadData();
      }
    } catch (error) {
      toast.error('Erro ao cancelar assinatura');
    } finally {
      setUpdating(false);
    }
  };

  const handleReactivate = async () => {
    setUpdating(true);
    try {
      const updated = await reactivateSubscription();
      if (updated) {
        setSubscription(updated);
        toast.success('Assinatura reativada com sucesso!');
        loadData();
      }
    } catch (error) {
      toast.error('Erro ao reativar assinatura');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const currentPlan = subscription ? plans.find(p => p.id === subscription.plan) : null;
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isCanceled = subscription?.cancelAtPeriodEnd || subscription?.status === 'canceled';

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return <Sparkles className="w-5 h-5" />;
      case 'basic': return <Zap className="w-5 h-5" />;
      case 'professional': return <Crown className="w-5 h-5" />;
      case 'enterprise': return <Building2 className="w-5 h-5" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case 'basic': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'professional': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'enterprise': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
      <div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">
          Assinatura e Planos
        </h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">
          Gerencie seu plano e acesso às funcionalidades
        </p>
      </div>

      {/* Status da Assinatura Atual */}
      {subscription && currentPlan && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-[3rem] border-2 border-indigo-200 dark:border-indigo-800 p-8 md:p-12">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {getPlanIcon(subscription.plan)}
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                  Plano {currentPlan.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {isActive && !isCanceled ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Ativo</span>
                  </>
                ) : isCanceled ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Cancelado</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span className="text-sm font-bold text-rose-700 dark:text-rose-400">Inativo</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Mensal</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {currentPlan.price === 0 ? 'Grátis' : `R$ ${currentPlan.price.toLocaleString('pt-BR')}`}
              </p>
            </div>
          </div>

          {subscription.endDate && (
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 mb-6">
              <Calendar className="w-4 h-4" />
              <span>
                {isCanceled 
                  ? `Válido até ${new Date(subscription.endDate).toLocaleDateString('pt-BR')}`
                  : `Próxima renovação: ${new Date(subscription.endDate).toLocaleDateString('pt-BR')}`
                }
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pacientes</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">
                {currentPlan.limits.patients === -1 ? 'Ilimitado' : currentPlan.limits.patients}
              </p>
            </div>
            <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Usuários</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">
                {currentPlan.limits.users === -1 ? 'Ilimitado' : currentPlan.limits.users}
              </p>
            </div>
            <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Armazenamento</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{currentPlan.limits.storage}</p>
            </div>
          </div>

          {isCanceled && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <p className="font-black text-amber-900 dark:text-amber-100 text-sm">
                    Assinatura será cancelada ao final do período
                  </p>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-1">
                    Você continuará tendo acesso até {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString('pt-BR') : 'o final do período'}
                  </p>
                </div>
                <button
                  onClick={handleReactivate}
                  disabled={updating}
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-all disabled:opacity-50"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reativar'}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {isActive && !isCanceled && (
              <button
                onClick={handleCancel}
                disabled={updating}
                className="px-6 py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                Cancelar Assinatura
              </button>
            )}
            <button
              onClick={loadData}
              disabled={loading || updating}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${(loading || updating) ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>
      )}

      {/* Planos Disponíveis */}
      <div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6">
          Planos Disponíveis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.plan === plan.id;
            const planIndex = ['free', 'basic', 'professional', 'enterprise'].indexOf(plan.id);
            const currentPlanIndex = subscription ? ['free', 'basic', 'professional', 'enterprise'].indexOf(subscription.plan) : -1;
            const canUpgrade = currentPlanIndex < planIndex;
            const canDowngrade = currentPlanIndex > planIndex;
            const isPlanAvailable = plan.id === 'free' || plan.availableInStripe !== false;

            return (
              <div
                key={plan.id}
                className={`relative rounded-[2rem] border-2 p-6 transition-all ${
                  isCurrentPlan
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-xl'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                    Atual
                  </div>
                )}

                {!isPlanAvailable && plan.id !== 'free' && (
                  <div className="absolute -top-3 right-3 px-3 py-1 bg-amber-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                    Em breve
                  </div>
                )}

                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-4 ${getPlanColor(plan.id)}`}>
                  {getPlanIcon(plan.id)}
                  <span className="font-black text-sm uppercase">{plan.name}</span>
                </div>

                <div className="mb-4">
                  <p className="text-3xl font-black text-slate-900 dark:text-white">
                    {plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">por mês</p>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {!isPlanAvailable && plan.id !== 'free' && (
                  <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 text-center">
                      Este plano ainda não está disponível no Stripe
                    </p>
                  </div>
                )}

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrentPlan || updating || (!isPlanAvailable && plan.id !== 'free')}
                  className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                    isCurrentPlan
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                      : (!isPlanAvailable && plan.id !== 'free')
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                      : canUpgrade
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  } disabled:opacity-50`}
                >
                  {isCurrentPlan ? 'Plano Atual' : (!isPlanAvailable && plan.id !== 'free') ? 'Indisponível' : canUpgrade ? 'Upgrade' : 'Downgrade'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Informações sobre Integrações */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-8">
        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">
          Integrações de Pagamento
        </h3>
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-6">
          O Clinify está preparado para integração com gateways de pagamento. 
          Consulte a documentação para configurar Stripe ou Mercado Pago.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                subscription?.hasStripeIntegration 
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
              }`}>
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="font-black text-slate-900 dark:text-white">Stripe</span>
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {subscription?.hasStripeIntegration ? 'Configurado' : 'Não configurado'}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                subscription?.hasMercadoPagoIntegration
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
              }`}>
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="font-black text-slate-900 dark:text-white">Mercado Pago</span>
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {subscription?.hasMercadoPagoIntegration ? 'Configurado' : 'Não configurado'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionTab;


