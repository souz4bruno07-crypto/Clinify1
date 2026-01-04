// Sistema de configuração de maquininhas de cartão

export interface TerminalFee {
  debit: number;           // Taxa para débito (%)
  creditAtSight: number;   // Taxa para crédito à vista (%)
  creditParceled: number;  // Taxa base para crédito parcelado (%)
  parcelFee: number;       // Taxa adicional por parcela (%)
  maxInstallments: number; // Máximo de parcelas permitidas
  minInstallmentValue?: number; // Valor mínimo por parcela (opcional)
}

export interface PaymentTerminal {
  id: string;
  name: string;
  icon: string; // Nome do ícone do lucide-react ou SVG
  fees: TerminalFee;
  customFees?: TerminalFee; // Taxas personalizadas editadas pelo usuário
  isActive: boolean;
}

// Taxas padrão baseadas em pesquisas de mercado 2024
export const DEFAULT_TERMINALS: PaymentTerminal[] = [
  {
    id: 'cielo',
    name: 'Cielo',
    icon: 'CreditCard',
    isActive: true,
    fees: {
      debit: 1.89,
      creditAtSight: 3.49,
      creditParceled: 4.49,
      parcelFee: 1.99,
      maxInstallments: 12,
      minInstallmentValue: 5.00
    }
  },
  {
    id: 'stone',
    name: 'Stone',
    icon: 'CreditCard',
    isActive: true,
    fees: {
      debit: 1.48,
      creditAtSight: 2.96,
      creditParceled: 3.79,
      parcelFee: 0,
      maxInstallments: 12,
      minInstallmentValue: 5.00
    }
  },
  {
    id: 'pagseguro',
    name: 'PagSeguro',
    icon: 'CreditCard',
    isActive: true,
    fees: {
      debit: 1.99,
      creditAtSight: 3.19,
      creditParceled: 3.79,
      parcelFee: 0,
      maxInstallments: 12,
      minInstallmentValue: 5.00
    }
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    icon: 'CreditCard',
    isActive: true,
    fees: {
      debit: 1.99,
      creditAtSight: 3.03, // D30 (30 dias)
      creditParceled: 3.60,
      parcelFee: 0,
      maxInstallments: 12,
      minInstallmentValue: 5.00
    }
  },
  {
    id: 'getnet',
    name: 'GetNet',
    icon: 'CreditCard',
    isActive: true,
    fees: {
      debit: 1.99,
      creditAtSight: 3.49,
      creditParceled: 4.49,
      parcelFee: 1.50,
      maxInstallments: 12,
      minInstallmentValue: 5.00
    }
  },
  {
    id: 'rede',
    name: 'Rede',
    icon: 'CreditCard',
    isActive: true,
    fees: {
      debit: 1.79,
      creditAtSight: 3.29,
      creditParceled: 4.29,
      parcelFee: 1.50,
      maxInstallments: 12,
      minInstallmentValue: 5.00
    }
  },
  {
    id: 'custom',
    name: 'Personalizada',
    icon: 'Settings',
    isActive: true,
    fees: {
      debit: 2.0,
      creditAtSight: 3.5,
      creditParceled: 4.5,
      parcelFee: 2.0,
      maxInstallments: 12,
      minInstallmentValue: 5.00
    }
  }
];

// Função para calcular taxa baseada no tipo de pagamento e parcelas
export const calculateTerminalFee = (
  terminal: PaymentTerminal,
  amount: number,
  paymentType: 'debit' | 'credit',
  installments: number = 1
): number => {
  const fees = terminal.customFees || terminal.fees;
  
  if (paymentType === 'debit') {
    return (amount * fees.debit) / 100;
  }
  
  if (paymentType === 'credit') {
    if (installments === 1) {
      return (amount * fees.creditAtSight) / 100;
    } else {
      // Taxa base + taxa por parcela
      const baseFee = (amount * fees.creditParceled) / 100;
      const parcelFee = (amount * (fees.parcelFee * (installments - 1))) / 100;
      return baseFee + parcelFee;
    }
  }
  
  return 0;
};

// Função para obter taxa percentual total
export const getTerminalFeePercentage = (
  terminal: PaymentTerminal,
  paymentType: 'debit' | 'credit',
  installments: number = 1
): number => {
  const fees = terminal.customFees || terminal.fees;
  
  if (paymentType === 'debit') {
    return fees.debit;
  }
  
  if (paymentType === 'credit') {
    if (installments === 1) {
      return fees.creditAtSight;
    } else {
      return fees.creditParceled + (fees.parcelFee * (installments - 1));
    }
  }
  
  return 0;
};

// Função para salvar configurações personalizadas no localStorage
const STORAGE_KEY = 'clinify_terminal_fees';

export const saveTerminalFees = (terminals: PaymentTerminal[]): void => {
  try {
    const customFees = terminals.reduce((acc, terminal) => {
      if (terminal.customFees) {
        acc[terminal.id] = terminal.customFees;
      }
      return acc;
    }, {} as Record<string, TerminalFee>);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customFees));
  } catch (error) {
    console.error('Erro ao salvar taxas de maquininhas:', error);
  }
};

// Função para carregar configurações personalizadas do localStorage
export const loadTerminalFees = (): Record<string, TerminalFee> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Erro ao carregar taxas de maquininhas:', error);
  }
  return {};
};

// Função para obter terminais com taxas personalizadas aplicadas
export const getTerminalsWithCustomFees = (): PaymentTerminal[] => {
  const customFees = loadTerminalFees();
  
  return DEFAULT_TERMINALS.map(terminal => ({
    ...terminal,
    customFees: customFees[terminal.id] || undefined
  }));
};

// Função para atualizar taxa de uma maquininha
export const updateTerminalFee = (
  terminalId: string,
  feeType: keyof TerminalFee,
  value: number
): PaymentTerminal[] => {
  const terminals = getTerminalsWithCustomFees();
  const terminal = terminals.find(t => t.id === terminalId);
  
  if (!terminal) return terminals;
  
  if (!terminal.customFees) {
    terminal.customFees = { ...terminal.fees };
  }
  
  (terminal.customFees as any)[feeType] = value;
  
  saveTerminalFees(terminals);
  
  return terminals;
};
