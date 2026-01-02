
import { useState, useEffect, useCallback } from 'react';
import { getTransactions, getCategories } from '../services/backendService';
import { Transaction, Category } from '../types';

export const useFinancialData = (userId: string | undefined) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!userId) {
      // Se não há userId, limpar dados
      console.log('[useFinancialData] Sem userId, limpando dados');
      setTransactions([]);
      setCategories([]);
      setIsLoading(false);
      return;
    }
    
    console.log(`[useFinancialData] Carregando dados para userId: ${userId}, isRefresh: ${isRefresh}`);
    
    // Se for refresh, marcamos o loading para feedback visual
    if (isRefresh) setIsLoading(true);
    
    try {
      // Limpamos o estado momentaneamente para forçar o recálculo de componentes puros
      if (isRefresh) {
        console.log('[useFinancialData] Limpando estados antes do refresh');
        setTransactions([]);
        setCategories([]);
      }
      
      const [txs, cats] = await Promise.all([
        getTransactions(userId).catch((err) => {
          console.error('[useFinancialData] Erro ao buscar transações:', err);
          return { data: [], total: 0, limit: 0, offset: 0 };
        }),
        getCategories(userId).catch((err) => {
          console.error('[useFinancialData] Erro ao buscar categorias:', err);
          return [];
        })
      ]);
      
      // Garantir que sempre temos arrays válidos
      const transactionsData = Array.isArray(txs) ? txs : (txs?.data || []);
      const categoriesData = Array.isArray(cats) ? cats : (cats || []);
      
      console.log(`[useFinancialData] Dados carregados: ${transactionsData.length} transações, ${categoriesData.length} categorias`);
      console.log(`[useFinancialData] Total de transações no banco: ${(txs as any)?.total || transactionsData.length}`);
      
      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("[useFinancialData] Erro ao carregar dados financeiros:", error);
      // Em caso de erro, limpar dados para evitar mostrar dados antigos
      setTransactions([]);
      setCategories([]);
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
