import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/targets/:monthYear
router.get('/:monthYear', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { monthYear } = req.params;

    const target = await prisma.monthlyTarget.findUnique({
      where: {
        userId_monthYear: {
          userId: req.userId!,
          monthYear
        }
      }
    });

    if (!target) {
      res.json(null);
      return;
    }

    res.json({
      id: target.id,
      userId: target.userId,
      month_year: target.monthYear,
      planned_revenue: Number(target.plannedRevenue),
      planned_purchases: Number(target.plannedPurchases)
    });
  } catch (error) {
    console.error('Erro get target:', error);
    res.status(500).json({ error: 'Erro ao buscar meta' });
  }
});

// PUT /api/targets (upsert)
router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month_year, planned_revenue, planned_purchases } = req.body;

    const target = await prisma.monthlyTarget.upsert({
      where: {
        userId_monthYear: {
          userId: req.userId!,
          monthYear: month_year
        }
      },
      update: {
        plannedRevenue: planned_revenue,
        plannedPurchases: planned_purchases
      },
      create: {
        userId: req.userId!,
        monthYear: month_year,
        plannedRevenue: planned_revenue,
        plannedPurchases: planned_purchases
      }
    });

    res.json({
      id: target.id,
      userId: target.userId,
      month_year: target.monthYear,
      planned_revenue: Number(target.plannedRevenue),
      planned_purchases: Number(target.plannedPurchases)
    });
  } catch (error) {
    console.error('Erro upsert target:', error);
    res.status(500).json({ error: 'Erro ao salvar meta' });
  }
});

export default router;













