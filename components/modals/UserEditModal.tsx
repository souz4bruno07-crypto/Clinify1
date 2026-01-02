import React, { useState, useEffect } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import Modal, { ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../ui/Modal';
import { Input, Button } from '../ui';
import { User, UserRole } from '../../types';
import { updateUser } from '../../services/backendService';
import { useToast } from '../../contexts/ToastContext';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ isOpen, onClose, onSuccess, user }) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'viewer' as UserRole
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.name || !formData.email) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[UserEditModal] Atualizando usuário:', { userId: user.id, formData });
      await updateUser(user.id, formData);
      toast.success('Usuário atualizado com sucesso!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('[UserEditModal] Erro ao atualizar usuário:', error);
      console.error('[UserEditModal] Error response:', error?.response);
      console.error('[UserEditModal] Error status:', error?.status);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao atualizar usuário';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: 'admin', label: 'Administrador', description: 'Acesso total ao sistema' },
    { value: 'finance', label: 'Financeiro', description: 'Acesso a finanças e relatórios' },
    { value: 'reception', label: 'Recepção', description: 'Acesso a agenda, pacientes e CRM' },
    { value: 'viewer', label: 'Visualizador', description: 'Apenas visualização' }
  ];

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalHeader icon={<KeyRound className="w-6 h-6" />}>
        <ModalTitle>Editar Usuário</ModalTitle>
        <ModalDescription>Altere as informações e permissões do colaborador</ModalDescription>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Nome Completo
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do colaborador"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Cargo e Permissões
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-6 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isLoading}
                required
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default UserEditModal;

