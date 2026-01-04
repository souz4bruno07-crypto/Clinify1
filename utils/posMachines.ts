import { PosMachine, PosMachineFee } from '../types';

// Taxas pré-configuradas das principais maquininhas (baseado em pesquisas 2024)
export const DEFAULT_POS_MACHINES: Omit<PosMachine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Cielo - Maquininha Padrão',
    provider: 'cielo',
    fees: {
      debit: 1.29,
      credit: 4.09,
      installments: {
        2: 4.5,
        3: 5.5,
        4: 6.5,
        5: 7.5,
        6: 7.49,
        7: 8.5,
        8: 9.5,
        9: 10.5,
        10: 11.5,
        11: 12.0,
        12: 12.5
      },
      maxInstallments: 12,
      minInstallmentValue: 5.0
    },
    isDefault: true,
    isActive: true,
    notes: 'Taxas padrão Cielo - recebimento em 1 dia útil'
  },
  {
    name: 'Stone - Plano Básico',
    provider: 'stone',
    fees: {
      debit: 0.74,
      credit: 2.99,
      installments: {
        2: 4.5,
        3: 6.0,
        4: 7.5,
        5: 9.0,
        6: 10.5,
        7: 11.5,
        8: 12.5,
        9: 13.5,
        10: 14.5,
        11: 15.0,
        12: 15.5
      },
      maxInstallments: 12,
      minInstallmentValue: 5.0
    },
    isDefault: false,
    isActive: true,
    notes: 'Taxas promocionais Stone - válidas até 31/12/2025 (faturamento acima de R$ 30k/mês)'
  },
  {
    name: 'Pagar.me - Plataforma',
    provider: 'pagarme',
    fees: {
      debit: 1.99,
      credit: 4.69,
      installments: {
        2: 5.5,
        3: 7.0,
        4: 8.5,
        5: 10.0,
        6: 11.5,
        7: 13.0,
        8: 14.5,
        9: 15.5,
        10: 16.5,
        11: 17.0,
        12: 17.5
      },
      maxInstallments: 12,
      minInstallmentValue: 5.0
    },
    isDefault: false,
    isActive: true,
    notes: 'Recebimento em 15 dias (D15)'
  },
  {
    name: 'Getnet - Maquininha Digital',
    provider: 'getnet',
    fees: {
      debit: 1.69,
      credit: 3.69,
      installments: {
        2: 4.8,
        3: 6.0,
        4: 7.5,
        5: 9.0,
        6: 10.5,
        7: 11.5,
        8: 12.5,
        9: 13.5,
        10: 14.5,
        11: 15.0,
        12: 12.88
      },
      maxInstallments: 12,
      minInstallmentValue: 5.0
    },
    isDefault: false,
    isActive: true,
    notes: 'Taxas Getnet - recebimento em 1 dia útil'
  },
  {
    name: 'Mercado Pago - D30',
    provider: 'mercado_pago',
    fees: {
      debit: 1.99,
      credit: 3.03,
      installments: {
        2: 3.5,
        3: 3.6,
        4: 3.7,
        5: 3.8,
        6: 3.9,
        7: 4.0,
        8: 4.1,
        9: 4.2,
        10: 4.3,
        11: 4.4,
        12: 4.5
      },
      maxInstallments: 12,
      minInstallmentValue: 5.0
    },
    isDefault: false,
    isActive: true,
    notes: 'Recebimento em 30 dias (D30) - taxas menores para recebimento futuro'
  },
  {
    name: 'Rede - Maquininha',
    provider: 'rede',
    fees: {
      debit: 1.49,
      credit: 3.99,
      installments: {
        2: 5.0,
        3: 6.5,
        4: 8.0,
        5: 9.5,
        6: 11.0,
        7: 12.0,
        8: 13.0,
        9: 14.0,
        10: 15.0,
        11: 15.5,
        12: 16.0
      },
      maxInstallments: 12,
      minInstallmentValue: 5.0
    },
    isDefault: false,
    isActive: true,
    notes: 'Taxas Rede - recebimento em 1 dia útil'
  },
  {
    name: 'Personalizada',
    provider: 'custom',
    fees: {
      debit: 1.5,
      credit: 3.5,
      installments: {
        2: 4.0,
        3: 5.0,
        4: 6.0,
        5: 7.0,
        6: 8.0,
        7: 9.0,
        8: 10.0,
        9: 11.0,
        10: 12.0,
        11: 13.0,
        12: 14.0
      },
      maxInstallments: 12,
      minInstallmentValue: 5.0
    },
    isDefault: false,
    isActive: true,
    notes: 'Maquininha customizada - ajuste as taxas conforme necessário'
  }
];

// Função para calcular a taxa baseada no tipo de pagamento e parcelas
export function calculatePosFee(
  amount: number,
  paymentMethod: 'debit' | 'credit',
  installments: number,
  machine: PosMachine
): {
  originalAmount: number;
  feeRate: number;
  feeAmount: number;
  totalAmount: number;
  amountPerInstallment: number;
} {
  let feeRate = 0;

  if (paymentMethod === 'debit') {
    feeRate = machine.fees.debit;
  } else if (paymentMethod === 'credit') {
    if (installments === 1) {
      feeRate = machine.fees.credit;
    } else {
      // Buscar taxa específica para o número de parcelas
      feeRate = machine.fees.installments[installments] || machine.fees.credit;
    }
  }

  const feeAmount = amount * (feeRate / 100);
  const totalAmount = amount + feeAmount;
  const amountPerInstallment = installments > 1 ? totalAmount / installments : totalAmount;

  return {
    originalAmount: amount,
    feeRate,
    feeAmount,
    totalAmount,
    amountPerInstallment
  };
}

// Função para obter as parcelas disponíveis baseado no valor e maquininha
export function getAvailableInstallments(
  amount: number,
  machine: PosMachine
): number[] {
  const installments: number[] = [1]; // Sempre permite à vista

  if (machine.fees.minInstallmentValue) {
    // Calcular máximo de parcelas baseado no valor mínimo por parcela
    const maxByValue = Math.floor(amount / machine.fees.minInstallmentValue);
    const maxByConfig = machine.fees.maxInstallments;
    const maxInstallments = Math.min(maxByValue, maxByConfig);

    for (let i = 2; i <= maxInstallments; i++) {
      if (machine.fees.installments[i] !== undefined) {
        installments.push(i);
      }
    }
  } else {
    // Se não há valor mínimo, permite todas as parcelas configuradas
    for (let i = 2; i <= machine.fees.maxInstallments; i++) {
      if (machine.fees.installments[i] !== undefined) {
        installments.push(i);
      }
    }
  }

  return installments;
}
