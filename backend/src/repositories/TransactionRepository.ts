import { PrismaClient, Transaction, TransactionType } from '@prisma/client';
import { NotFoundError } from '../utils/errors.js';

export class TransactionRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId }
    });

    if (!transaction) {
      throw new NotFoundError('Transação');
    }

    return transaction;
  }

  async findByUserId(
    userId: string,
    options?: {
      skip?: number;
      take?: number;
      type?: TransactionType;
      category?: string;
      startDate?: bigint;
      endDate?: bigint;
    }
  ): Promise<Transaction[]> {
    const where: any = { userId };

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.category) {
      where.category = options.category;
    }

    if (options?.startDate || options?.endDate) {
      where.date = {};
      if (options.startDate) {
        where.date.gte = options.startDate;
      }
      if (options.endDate) {
        where.date.lte = options.endDate;
      }
    }

    return this.prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: options?.skip,
      take: options?.take
    });
  }

  async countByUserId(
    userId: string,
    filters?: {
      type?: TransactionType;
      category?: string;
      startDate?: bigint;
      endDate?: bigint;
    }
  ): Promise<number> {
    const where: any = { userId };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate;
      }
    }

    return this.prisma.transaction.count({ where });
  }

  async create(data: {
    userId: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: bigint;
    patientName?: string;
    paymentMethod?: string;
    isPaid?: boolean;
    tags?: string;
  }): Promise<Transaction> {
    return this.prisma.transaction.create({ data });
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{
      description: string;
      amount: number;
      type: TransactionType;
      category: string;
      date: bigint;
      patientName: string;
      paymentMethod: string;
      isPaid: boolean;
      tags: string;
    }>
  ): Promise<Transaction> {
    // Verificar se existe e pertence ao usuário
    await this.findById(id, userId);

    return this.prisma.transaction.update({
      where: { id },
      data
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    // Verificar se existe e pertence ao usuário
    await this.findById(id, userId);

    await this.prisma.transaction.delete({
      where: { id }
    });
  }

  async getTotalByType(
    userId: string,
    type: TransactionType,
    startDate?: bigint,
    endDate?: bigint
  ): Promise<number> {
    const where: any = { userId, type };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    const result = await this.prisma.transaction.aggregate({
      where,
      _sum: { amount: true }
    });

    return Number(result._sum.amount || 0);
  }
}
