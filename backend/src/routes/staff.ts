import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/staff
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staff = await prisma.staff.findMany({
      where: { userId: req.userId }
    });

    res.json(staff.map(s => ({
      id: s.id,
      userId: s.userId,
      name: s.name,
      role: s.role,
      color: s.color,
      commissionRate: Number(s.commissionRate),
      phone: s.phone
    })));
  } catch (error) {
    console.error('Erro get staff:', error);
    res.status(500).json({ error: 'Erro ao buscar equipe' });
  }
});

// POST /api/staff
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, role, color, commissionRate, phone } = req.body;

    const staff = await prisma.staff.create({
      data: {
        userId: req.userId!,
        name,
        role,
        color: color || '#3B82F6',
        commissionRate: commissionRate || 0,
        phone
      }
    });

    res.status(201).json({
      id: staff.id,
      userId: staff.userId,
      name: staff.name,
      role: staff.role,
      color: staff.color,
      commissionRate: Number(staff.commissionRate),
      phone: staff.phone
    });
  } catch (error) {
    console.error('Erro create staff:', error);
    res.status(500).json({ error: 'Erro ao adicionar membro' });
  }
});

// PUT /api/staff/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, role, color, commissionRate, phone } = req.body;

    const staff = await prisma.staff.update({
      where: { id, userId: req.userId },
      data: { name, role, color, commissionRate, phone }
    });

    res.json({
      id: staff.id,
      userId: staff.userId,
      name: staff.name,
      role: staff.role,
      color: staff.color,
      commissionRate: Number(staff.commissionRate),
      phone: staff.phone
    });
  } catch (error) {
    console.error('Erro update staff:', error);
    res.status(500).json({ error: 'Erro ao atualizar membro' });
  }
});

// DELETE /api/staff/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.staff.delete({
      where: { id, userId: req.userId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro delete staff:', error);
    res.status(500).json({ error: 'Erro ao remover membro' });
  }
});

export default router;













