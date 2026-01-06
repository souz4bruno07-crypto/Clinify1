import { z } from 'zod';

const cpfRegex = /^\d{11}$/;
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const createPatientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(200),
  phone: z.string().regex(phoneRegex, 'Telefone inválido').max(20),
  email: z.string().email('Email inválido').max(255).optional(),
  cpf: z.string().regex(cpfRegex, 'CPF deve conter 11 dígitos').optional(),
  birthDate: z.string().max(50).optional(),
  profession: z.string().max(200).optional(),
  marketingSource: z.string().max(200).optional(),
  cep: z.string().max(20).optional(),
  addressStreet: z.string().max(200).optional(),
  addressNumber: z.string().max(20).optional(),
  addressComplement: z.string().max(200).optional(),
  addressNeighborhood: z.string().max(200).optional(),
  addressCity: z.string().max(200).optional(),
  addressState: z.string().max(2).optional(),
  height: z.string().max(20).optional(),
  weight: z.string().max(20).optional(),
  notes: z.string().max(5000).optional()
});

export const updatePatientSchema = createPatientSchema.partial();

export const getPatientsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
  offset: z.coerce.number().int().nonnegative().optional(),
  search: z.string().max(200).optional()
});
