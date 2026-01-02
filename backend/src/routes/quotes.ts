import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/quotes
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quotes = await prisma.quote.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(quotes.map(q => ({
      id: q.id,
      userId: q.userId,
      patientId: q.patientId,
      patientName: q.patientName,
      items: q.items,
      mapPoints: q.mapPoints,
      totalAmount: Number(q.totalAmount),
      status: q.status,
      createdAt: Number(q.createdAt),
      validUntil: Number(q.validUntil)
    })));
  } catch (error) {
    console.error('Erro get quotes:', error);
    res.status(500).json({ error: 'Erro ao buscar orçamentos' });
  }
});

// POST /api/quotes
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId, patientName, items, mapPoints, totalAmount, status, createdAt, validUntil } = req.body;

    const quote = await prisma.quote.create({
      data: {
        userId: req.userId!,
        patientId,
        patientName,
        items: items || [],
        mapPoints: mapPoints || [],
        totalAmount: totalAmount || 0,
        status: status || 'draft',
        createdAt: BigInt(createdAt || Date.now()),
        validUntil: BigInt(validUntil || Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    res.status(201).json({
      id: quote.id,
      userId: quote.userId,
      patientId: quote.patientId,
      patientName: quote.patientName,
      items: quote.items,
      mapPoints: quote.mapPoints,
      totalAmount: Number(quote.totalAmount),
      status: quote.status,
      createdAt: Number(quote.createdAt),
      validUntil: Number(quote.validUntil)
    });
  } catch (error) {
    console.error('Erro create quote:', error);
    res.status(500).json({ error: 'Erro ao criar orçamento' });
  }
});

// PUT /api/quotes/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { patientId, patientName, items, mapPoints, totalAmount, status, validUntil } = req.body;

    const quote = await prisma.quote.update({
      where: { id, userId: req.userId },
      data: {
        patientId,
        patientName,
        items,
        mapPoints,
        totalAmount,
        status,
        validUntil: validUntil ? BigInt(validUntil) : undefined
      }
    });

    res.json({
      id: quote.id,
      userId: quote.userId,
      patientId: quote.patientId,
      patientName: quote.patientName,
      items: quote.items,
      mapPoints: quote.mapPoints,
      totalAmount: Number(quote.totalAmount),
      status: quote.status,
      createdAt: Number(quote.createdAt),
      validUntil: Number(quote.validUntil)
    });
  } catch (error) {
    console.error('Erro update quote:', error);
    res.status(500).json({ error: 'Erro ao atualizar orçamento' });
  }
});

// DELETE /api/quotes/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.quote.delete({
      where: { id, userId: req.userId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro delete quote:', error);
    res.status(500).json({ error: 'Erro ao deletar orçamento' });
  }
});

export default router;












