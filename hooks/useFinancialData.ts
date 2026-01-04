
import { useState, useEffect, useCallback, useRef } from 'react';
import { getTransactions, getCategories } from '../services/backendService';
import { Transaction, Category } from '../types';

export const useFinancialData = (userId: string | undefined) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const transactionsRef = useRef<Transaction[]>([]);
  
  // Manter ref atualizada
  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  const loadData = useCallback(async (isRefresh = false, retryCount = 0) => {
    if (!userId) {
      // Se não há userId, limpar dados
      console.log('[useFinancialData] Sem userId, limpando dados');
      setTransactions([]);
      setCategories([]);
      setIsLoading(false);
      return;
    }
    
    console.log(`[useFinancialData] Carregando dados para userId: ${userId}, isRefresh: ${isRefresh}, tentativa: ${retryCount + 1}`);
    
    // Se for refresh, marcamos o loading para feedback visual
    if (isRefresh || retryCount === 0) {
      setIsLoading(true);
    }
    
    try {
      // Limpamos o estado momentaneamente para forçar o recálculo de componentes puros
      if (isRefresh && retryCount === 0) {
        console.log('[useFinancialData] Limpando estados antes do refresh');
        setTransactions([]);
        setCategories([]);
      }
      
      // Função auxiliar para fazer retry com delay
      const fetchWithRetry = async <T,>(
        fetchFn: () => Promise<T>,
        maxRetries = 2,
        delay = 1000
      ): Promise<T> => {
        for (let i = 0; i <= maxRetries; i++) {
          try {
            return await fetchFn();
          } catch (error: any) {
            const isLastAttempt = i === maxRetries;
            const shouldRetry = !isLastAttempt && (
              error?.status >= 500 || // Erros de servidor
              error?.name === 'AbortError' || // Timeout
              error?.message?.includes('Failed to fetch') || // Erro de rede
              error?.message?.includes('network')
            );
            
            if (shouldRetry) {
              console.log(`[useFinancialData] Tentativa ${i + 1}/${maxRetries + 1} falhou, tentando novamente em ${delay}ms...`, error);
              await new Promise(resolve => setTimeout(resolve, delay * (i + 1))); // Backoff exponencial
            } else {
              throw error;
            }
          }
        }
        throw new Error('Max retries exceeded');
      };
      
      const [txs, cats] = await Promise.all([
        fetchWithRetry(() => getTransactions(userId), 2, 1000).catch((err) => {
          console.error('[useFinancialData] Erro ao buscar transações após retries:', err);
          // Retornar dados vazios em vez de quebrar
          return { data: [], total: 0, limit: 0, offset: 0 };
        }),
        fetchWithRetry(() => getCategories(userId), 2, 1000).catch((err) => {
          console.error('[useFinancialData] Erro ao buscar categorias após retries:', err);
          return [];
        })
      ]);
      
      // Garantir que sempre temos arrays válidos
      const transactionsData = Array.isArray(txs) ? txs : (txs?.data || []);
      const categoriesData = Array.isArray(cats) ? cats : (cats || []);
      
      console.log(`[useFinancialData] ✅ Dados carregados com sucesso: ${transactionsData.length} transações, ${categoriesData.length} categorias`);
      console.log(`[useFinancialData] Total de transações no banco: ${(txs as any)?.total || transactionsData.length}`);
      
      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (error: any) {
      console.error("[useFinancialData] ❌ Erro ao carregar dados financeiros:", error);
      
      // Retry automático apenas em caso de erro de rede/timeout
      const shouldRetry = retryCount < 2 && (
        error?.status >= 500 ||
        error?.name === 'AbortError' ||
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('network') ||
        error?.message?.includes('timeout')
      );
      
      if (shouldRetry) {
        console.log(`[useFinancialData] Tentando novamente (tentativa ${retryCount + 2}/3)...`);
        setTimeout(() => {
          loadData(isRefresh, retryCount + 1);
        }, 2000 * (retryCount + 1)); // Backoff: 2s, 4s
        return; // Não limpar loading ainda
      }
      
      // Em caso de erro final, manter dados antigos se existirem (melhor UX)
      // Só limpar se realmente não houver dados ou se for erro de autenticação
      if (error?.status === 401 || error?.status === 403 || transactionsRef.current.length === 0) {
        console.log('[useFinancialData] Limpando dados devido a erro de autenticação ou sem dados');
        setTransactions([]);
        setCategories([]);
      } else {
        console.log('[useFinancialData] Mantendo dados anteriores devido a erro de rede');
      }
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
