import React, { useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import Modal, { ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../ui/Modal';
import { Input, Button } from '../ui';
import { UserRole } from '../../types';
import { createUser } from '../../services/backendService';
import { useToast } from '../../contexts/ToastContext';

interface UserInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UserInviteModal: React.FC<UserInviteModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'viewer' as UserRole
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      await createUser(formData);
      toast.success('Usuário criado com sucesso!');
      setFormData({ name: '', email: '', password: '', role: 'viewer' });
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao criar usuário';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ name: '', email: '', password: '', role: 'viewer' });
      onClose();
    }
  };

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: 'admin', label: 'Administrador', description: 'Acesso total ao sistema' },
    { value: 'finance', label: 'Financeiro', description: 'Acesso a finanças e relatórios' },
    { value: 'reception', label: 'Recepção', description: 'Acesso a agenda, pacientes e CRM' },
    { value: 'viewer', label: 'Visualizador', description: 'Apenas visualização' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalHeader icon={<UserPlus className="w-6 h-6" />}>
        <ModalTitle>Convidar Usuário</ModalTitle>
        <ModalDescription>Adicione um novo membro à equipe da clínica</ModalDescription>
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
                Senha Temporária
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
                disabled={isLoading}
                minLength={6}
              />
              <p className="text-[9px] font-bold text-slate-400 mt-1">
                O usuário poderá alterar a senha após o primeiro login
              </p>
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
                Criando...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Criar Usuário
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default UserInviteModal;

