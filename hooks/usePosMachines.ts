import { useState, useEffect, useCallback } from 'react';
import { PosMachine } from '../types';
import { DEFAULT_POS_MACHINES } from '../utils/posMachines';

const STORAGE_KEY = 'clinify_pos_machines';

export function usePosMachines(userId: string | undefined) {
  const [machines, setMachines] = useState<PosMachine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar maquininhas do localStorage
  useEffect(() => {
    if (!userId) {
      setMachines([]);
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMachines(parsed);
      } else {
        // Criar maquininhas padrão na primeira vez
        const defaultMachines: PosMachine[] = DEFAULT_POS_MACHINES.map((machine, index) => ({
          ...machine,
          id: `default_${machine.provider}_${index}`,
          userId,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }));
        // Marcar a primeira como padrão
        if (defaultMachines.length > 0) {
          defaultMachines[0].isDefault = true;
        }
        setMachines(defaultMachines);
        saveMachines(defaultMachines);
      }
    } catch (error) {
      console.error('[usePosMachines] Erro ao carregar maquininhas:', error);
      setMachines([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const saveMachines = useCallback((newMachines: PosMachine[]) => {
    if (!userId) return;
    try {
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(newMachines));
      setMachines(newMachines);
    } catch (error) {
      console.error('[usePosMachines] Erro ao salvar maquininhas:', error);
    }
  }, [userId]);

  const addMachine = useCallback((machine: Omit<PosMachine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const newMachine: PosMachine = {
      ...machine,
      id: `machine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId!,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updated = [...machines, newMachine];
    saveMachines(updated);
    return newMachine;
  }, [machines, userId, saveMachines]);

  const updateMachine = useCallback((id: string, updates: Partial<PosMachine>) => {
    const updated = machines.map(m => 
      m.id === id 
        ? { ...m, ...updates, updatedAt: Date.now() }
        : m
    );
    saveMachines(updated);
  }, [machines, saveMachines]);

  const deleteMachine = useCallback((id: string) => {
    const updated = machines.filter(m => m.id !== id);
    // Se deletar a maquininha padrão, tornar a primeira ativa como padrão
    const deletedWasDefault = machines.find(m => m.id === id)?.isDefault;
    if (deletedWasDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    saveMachines(updated);
  }, [machines, saveMachines]);

  const setDefaultMachine = useCallback((id: string) => {
    const updated = machines.map(m => ({
      ...m,
      isDefault: m.id === id
    }));
    saveMachines(updated);
  }, [machines, saveMachines]);

  const getDefaultMachine = useCallback((): PosMachine | null => {
    return machines.find(m => m.isDefault && m.isActive) || machines.find(m => m.isActive) || null;
  }, [machines]);

  const getMachineById = useCallback((id: string | undefined): PosMachine | null => {
    if (!id) return getDefaultMachine();
    return machines.find(m => m.id === id) || null;
  }, [machines, getDefaultMachine]);

  return {
    machines,
    isLoading,
    addMachine,
    updateMachine,
    deleteMachine,
    setDefaultMachine,
    getDefaultMachine,
    getMachineById
  };
}
