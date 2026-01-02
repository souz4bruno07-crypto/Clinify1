import { useState, useEffect } from 'react';

/**
 * Hook para verificar se o usuário prefere movimento reduzido
 * Retorna true se prefers-reduced-motion está ativado
 * Segue WCAG 2.1 - respeita a preferência do usuário por animações reduzidas
 */
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    // Verificação inicial no lado do servidor retornará false
    if (typeof window === 'undefined') return false;
    
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    // Verificação novamente no cliente para garantir que está correto
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Função para atualizar o estado quando a preferência mudar
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setPrefersReducedMotion(event.matches);
    };

    // Verificar valor inicial
    setPrefersReducedMotion(mediaQuery.matches);

    // Adicionar listener para mudanças (navegadores modernos)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback para navegadores antigos que usam addListener
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
};




