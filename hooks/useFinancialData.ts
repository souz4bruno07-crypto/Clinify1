
import { useState, useEffect, useCallback } from 'react';
import { getTransactions, getCategories } from '../services/supabaseService';
import { Transaction, Category } from '../types';

export const useFinancialData = (userId: string | undefined) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!userId) return;
    
    // Se for refresh, marcamos o loading para feedback visual
    if (isRefresh) setIsLoading(true);
    
    try {
      // Limpamos o estado momentaneamente para forçar o recálculo de componentes puros
      if (isRefresh) setTransactions([]);

      const [txs, cats] = await Promise.all([
        getTransactions(userId),
        getCategories(userId)
      ]);
      
      setTransactions([...txs]);
      setCategories([...cats]);
    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) loadData();
  }, [userId, loadData]);

  const refreshData = () => loadData(true);

  return {
    transactions,
    categories,
    isLoading,
    setTransactions,
    setCategories,
    refreshData
  };
};
