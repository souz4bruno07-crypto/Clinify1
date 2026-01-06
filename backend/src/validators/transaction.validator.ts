import { z } from 'zod';

export const createTransactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(500),
  amount: z.number()
    .positive('Valor deve ser positivo')
    .max(999999999.99, 'Valor muito alto'),
  type: z.enum(['revenue', 'expense'], {
    errorMap: () => ({ message: 'Tipo deve ser revenue ou expense' })
  }),
  category: z.string().max(100).default('Geral'),
  date: z.number().int().positive('Data inválida'),
  patientName: z.string().max(200).optional(),
  paymentMethod: z.string().max(50).optional(),
  isPaid: z.boolean().default(true),
  tags: z.string().max(500).optional()
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const getTransactionsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
  offset: z.coerce.number().int().nonnegative().optional(),
  type: z.enum(['revenue', 'expense']).optional(),
  category: z.string().optional(),
  startDate: z.coerce.number().int().positive().optional(),
  endDate: z.coerce.number().int().positive().optional()
});
