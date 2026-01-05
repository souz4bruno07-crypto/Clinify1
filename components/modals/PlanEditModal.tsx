import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, Sparkles, Zap, Crown, Building2 } from 'lucide-react';
import Modal, { ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../ui/Modal';
import { Input, Button, Select } from '../ui';
import { updateUser, getAvailablePlans, type Plan } from '../../services/backendService';
import { useToast } from '../../contexts/ToastContext';

interface PlanEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  userName: string;
  currentPlan?: string;
}

const PlanEditModal: React.FC<PlanEditModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userId, 
  userName,
  currentPlan 
}) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [formData, setFormData] = useState({
    plan: currentPlan || 'free',
    status: 'active',
    endDate: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadPlans();
      if (currentPlan) {
        setFormData(prev => ({ ...prev, plan: currentPlan }));
      }
    }
  }, [isOpen, currentPlan]);

  const loadPlans = async () => {
    setLoadingPlans(true);
    try {
      const availablePlans = await getAvailablePlans();
      setPlans(availablePlans);
    } catch (error) {
      toast.error('Erro ao carregar planos disponíveis');
    } finally {
      setLoadingPlans(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return <Sparkles className="w-4 h-4" />;
      case 'basic': return <Zap className="w-4 h-4" />;
      case 'professional': return <Crown className="w-4 h-4" />;
      case 'enterprise': return <Building2 className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.plan) {
      toast.error('Selecione um plano');
      return;
    }

    setIsLoading(true);
    try {
      // Atualizar diretamente na tabela users (muito mais simples!)
      await updateUser(userId, {
        plan: formData.plan as 'free' | 'basic' | 'professional' | 'enterprise'
      });
      
      toast.success(`Plano atualizado para ${userName}!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('[PlanEditModal] Erro ao atualizar plano:', error);
      toast.error(error.response?.data?.error || 'Erro ao atualizar plano');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === formData.plan);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader>
        <ModalTitle>Gerenciar Plano de Assinatura</ModalTitle>
        <ModalDescription>
          Atualizar plano de assinatura para <strong>{userName}</strong>
        </ModalDescription>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-6">
          <div>
            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">
              Plano
            </label>
            {loadingPlans ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, plan: plan.id }))}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.plan === plan.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getPlanIcon(plan.id)}
                      <span className="font-black text-sm uppercase">{plan.name}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toLocaleString('pt-BR')}/mês`}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedPlan && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Limites do Plano {selectedPlan.name}
              </p>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="font-bold text-slate-400">Pacientes</p>
                  <p className="font-black text-slate-900 dark:text-white">
                    {selectedPlan.limits.patients === -1 ? 'Ilimitado' : selectedPlan.limits.patients}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-400">Usuários</p>
                  <p className="font-black text-slate-900 dark:text-white">
                    {selectedPlan.limits.users === -1 ? 'Ilimitado' : selectedPlan.limits.users}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-400">Armazenamento</p>
                  <p className="font-black text-slate-900 dark:text-white">
                    {selectedPlan.limits.storage}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">
              Status
            </label>
            <Select
              value={formData.status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full"
            >
              <option value="active">Ativo</option>
              <option value="trialing">Período de Teste</option>
              <option value="canceled">Cancelado</option>
              <option value="past_due">Pagamento Atrasado</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">
              Data de Expiração (Opcional)
            </label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              placeholder="Deixe em branco para 1 ano"
            />
            <p className="text-xs font-bold text-slate-400 mt-1">
              Se não especificado, será definido para 1 ano a partir de hoje
            </p>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || loadingPlans}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Atualizando...
              </>
            ) : (
              'Atualizar Plano'
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default PlanEditModal;
