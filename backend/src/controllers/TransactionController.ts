import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import { TransactionRepository } from '../repositories/TransactionRepository.js';
import { createTransactionSchema, updateTransactionSchema, getTransactionsSchema } from '../validators/transaction.validator.js';
import { sanitizeFields } from '../utils/sanitize.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { logger } from '../config/logger.js';

export class TransactionController {
  constructor(private repository: TransactionRepository) {}

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = getTransactionsSchema.parse(req.query);
    const userId = req.userId!;

    const skip = query.page ? (query.page - 1) * query.limit : (query.offset || 0);
    const take = Math.min(query.limit, 200);

    const [transactions, total] = await Promise.all([
      this.repository.findByUserId(userId, {
        skip,
        take,
        type: query.type,
        category: query.category,
        startDate: query.startDate ? BigInt(query.startDate) : undefined,
        endDate: query.endDate ? BigInt(query.endDate) : undefined
      }),
      this.repository.countByUserId(userId, {
        type: query.type,
        category: query.category,
        startDate: query.startDate ? BigInt(query.startDate) : undefined,
        endDate: query.endDate ? BigInt(query.endDate) : undefined
      })
    ]);

    logger.debug('Transações listadas:', { userId, count: transactions.length });

    res.json({
      data: transactions.map(t => ({
        id: t.id,
        userId: t.userId,
        description: t.description,
        amount: Number(t.amount),
        type: t.type,
        category: t.category,
        date: Number(t.date),
        patientName: t.patientName,
        paymentMethod: t.paymentMethod,
        isPaid: t.isPaid,
        tags: t.tags
      })),
      pagination: query.page ? {
        page: query.page,
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      } : {
        total,
        limit: take,
        offset: skip
      }
    });
  });

  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId!;

    const transaction = await this.repository.findById(id, userId);

    res.json({
      id: transaction.id,
      userId: transaction.userId,
      description: transaction.description,
      amount: Number(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      date: Number(transaction.date),
      patientName: transaction.patientName,
      paymentMethod: transaction.paymentMethod,
      isPaid: transaction.isPaid,
      tags: transaction.tags
    });
  });

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const sanitized = sanitizeFields(req.body, ['description', 'category', 'patientName', 'paymentMethod', 'tags']);
    const data = createTransactionSchema.parse(sanitized);
    const userId = req.userId!;

    const transaction = await this.repository.create({
      ...data,
      userId,
      date: BigInt(data.date),
      amount: data.amount
    });

    logger.info('Transação criada:', { transactionId: transaction.id, userId });

    res.status(201).json({
      id: transaction.id,
      userId: transaction.userId,
      description: transaction.description,
      amount: Number(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      date: Number(transaction.date),
      patientName: transaction.patientName,
      paymentMethod: transaction.paymentMethod,
      isPaid: transaction.isPaid,
      tags: transaction.tags
    });
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const sanitized = sanitizeFields(req.body, ['description', 'category', 'patientName', 'paymentMethod', 'tags']);
    const data = updateTransactionSchema.parse(sanitized);
    const userId = req.userId!;

    const updateData: any = { ...data };
    if (data.date) {
      updateData.date = BigInt(data.date);
    }

    const transaction = await this.repository.update(id, userId, updateData);

    logger.info('Transação atualizada:', { transactionId: transaction.id, userId });

    res.json({
      id: transaction.id,
      userId: transaction.userId,
      description: transaction.description,
      amount: Number(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      date: Number(transaction.date),
      patientName: transaction.patientName,
      paymentMethod: transaction.paymentMethod,
      isPaid: transaction.isPaid,
      tags: transaction.tags
    });
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId!;

    await this.repository.delete(id, userId);

    logger.info('Transação deletada:', { transactionId: id, userId });

    res.status(204).send();
  });
}
