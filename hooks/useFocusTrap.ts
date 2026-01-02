import { useEffect, useRef } from 'react';

/**
 * Hook para implementar focus trap em modais e diálogos
 * Segue WCAG 2.1 - garante que o foco fique dentro do modal
 */
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    // Obter todos os elementos focáveis dentro do container
    const getFocusableElements = (): HTMLElement[] => {
      const selectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ].join(', ');

      return Array.from(container.querySelectorAll(selectors)) as HTMLElement[];
    };

    const focusableElements = getFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focar no primeiro elemento quando o modal abrir
    if (firstElement) {
      // Pequeno delay para garantir que o DOM está renderizado
      setTimeout(() => firstElement.focus(), 0);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab (navegar para trás)
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab (navegar para frente)
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return containerRef;
};
