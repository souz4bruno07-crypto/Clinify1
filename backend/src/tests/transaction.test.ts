import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionRepository } from '../repositories/TransactionRepository.js';
import { TransactionController } from '../controllers/TransactionController.js';
import { PrismaClient } from '@prisma/client';

// Mock do Prisma
vi.mock('../config/database.js', () => ({
  default: {
    transaction: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn()
    }
  }
}));

describe('TransactionRepository', () => {
  let repository: TransactionRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      transaction: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn()
      }
    };
    repository = new TransactionRepository(mockPrisma as unknown as PrismaClient);
  });

  it('deve encontrar transação por ID', async () => {
    const mockTransaction = {
      id: '123',
      userId: 'user1',
      description: 'Test',
      amount: 100,
      type: 'revenue' as const
    };

    mockPrisma.transaction.findFirst.mockResolvedValue(mockTransaction);

    const result = await repository.findById('123', 'user1');

    expect(result).toEqual(mockTransaction);
    expect(mockPrisma.transaction.findFirst).toHaveBeenCalledWith({
      where: { id: '123', userId: 'user1' }
    });
  });

  it('deve lançar erro se transação não for encontrada', async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue(null);

    await expect(repository.findById('123', 'user1')).rejects.toThrow('Transação');
  });

  it('deve criar uma transação', async () => {
    const data = {
      userId: 'user1',
      description: 'Test',
      amount: 100,
      type: 'revenue' as const,
      category: 'Geral',
      date: BigInt(Date.now())
    };

    const mockTransaction = { id: '123', ...data };
    mockPrisma.transaction.create.mockResolvedValue(mockTransaction);

    const result = await repository.create(data);

    expect(result).toEqual(mockTransaction);
    expect(mockPrisma.transaction.create).toHaveBeenCalledWith({ data });
  });
});

describe('TransactionController', () => {
  let controller: TransactionController;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findByUserId: vi.fn(),
      countByUserId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    };
    controller = new TransactionController(mockRepository);
  });

  it('deve listar transações', async () => {
    const mockTransactions = [
      {
        id: '1',
        userId: 'user1',
        description: 'Test',
        amount: 100,
        type: 'revenue' as const,
        category: 'Geral',
        date: BigInt(Date.now()),
        patientName: null,
        paymentMethod: null,
        isPaid: true,
        tags: null
      }
    ];

    mockRepository.findByUserId.mockResolvedValue(mockTransactions);
    mockRepository.countByUserId.mockResolvedValue(1);

    const req = {
      userId: 'user1',
      query: { limit: 50 }
    } as any;

    const res = {
      json: vi.fn()
    } as any;

    const next = vi.fn() as any;

    await controller.list(req, res, next);

    expect(res.json).toHaveBeenCalled();
    expect(mockRepository.findByUserId).toHaveBeenCalled();
  });
});
