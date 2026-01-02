import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/loyalty/members - Listar membros do programa
router.get('/members', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const members = await prisma.loyaltyMember.findMany({
      where: { userId: req.userId },
      include: {
        pointsHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        redemptions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        referrals: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { totalPoints: 'desc' }
    });

    res.json({
      data: members.map(m => ({
        id: m.id,
        patientId: m.patientId,
        patientName: m.patientName,
        totalPoints: m.totalPoints,
        availablePoints: m.availablePoints,
        tier: m.tier,
        totalConsultations: m.totalConsultations,
        totalProcedures: m.totalProcedures,
        totalReferrals: m.totalReferrals,
        referralCode: m.referralCode,
        joinedAt: Number(m.joinedAt),
        lastActivityAt: Number(m.lastActivityAt),
        pointsHistory: m.pointsHistory.map(h => ({
          id: h.id,
          patientId: m.patientId,
          points: h.points,
          source: h.source,
          description: h.description,
          createdAt: Number(h.createdAt)
        })),
        redemptions: m.redemptions.map(r => ({
          id: r.id,
          patientId: m.patientId,
          rewardId: r.rewardId,
          rewardName: r.rewardName,
          pointsSpent: r.pointsSpent,
          status: r.status,
          code: r.code,
          createdAt: Number(r.createdAt),
          expiresAt: Number(r.expiresAt),
          usedAt: r.usedAt ? Number(r.usedAt) : undefined
        })),
        referrals: m.referrals.map(ref => ({
          id: ref.id,
          referrerId: ref.referrerId,
          referrerName: m.patientName,
          referredId: ref.referredId,
          referredName: ref.referredName,
          status: ref.status,
          bonusPoints: ref.bonusPoints,
          code: ref.code,
          createdAt: Number(ref.createdAt),
          completedAt: ref.completedAt ? Number(ref.completedAt) : undefined
        }))
      })),
      total: members.length
    });
  } catch (error) {
    console.error('Erro ao buscar membros de fidelidade:', error);
    res.status(500).json({ error: 'Erro ao buscar membros de fidelidade' });
  }
});

// GET /api/loyalty/rewards - Listar recompensas
router.get('/rewards', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rewards = await prisma.loyaltyReward.findMany({
      where: { userId: req.userId },
      orderBy: { pointsCost: 'asc' }
    });

    res.json({
      data: rewards.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        pointsCost: r.pointsCost,
        type: r.type,
        value: Number(r.value),
        isActive: r.isActive,
        tier: r.tier,
        stock: r.stock,
        validDays: r.validDays,
        category: r.category
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar recompensas:', error);
    res.status(500).json({ error: 'Erro ao buscar recompensas' });
  }
});

// POST /api/loyalty/rewards - Criar recompensa
router.post('/rewards', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    const { name, description, pointsCost, type, value, tier, stock, validDays, category } = req.body;

    const reward = await prisma.loyaltyReward.create({
      data: {
        userId: req.userId,
        name,
        description,
        pointsCost,
        type,
        value,
        tier: tier || null,
        stock: stock || null,
        validDays: validDays || 30,
        category: category || 'beauty'
      }
    });

    res.json({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      pointsCost: reward.pointsCost,
      type: reward.type,
      value: Number(reward.value),
      isActive: reward.isActive,
      tier: reward.tier,
      stock: reward.stock,
      validDays: reward.validDays,
      category: reward.category
    });
  } catch (error) {
    console.error('Erro ao criar recompensa:', error);
    res.status(500).json({ error: 'Erro ao criar recompensa' });
  }
});

// PUT /api/loyalty/rewards/:id - Atualizar recompensa
router.put('/rewards/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, pointsCost, type, value, isActive, tier, stock, validDays, category } = req.body;

    const reward = await prisma.loyaltyReward.update({
      where: { id, userId: req.userId },
      data: {
        name,
        description,
        pointsCost,
        type,
        value,
        isActive,
        tier: tier || null,
        stock: stock || null,
        validDays,
        category
      }
    });

    res.json({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      pointsCost: reward.pointsCost,
      type: reward.type,
      value: Number(reward.value),
      isActive: reward.isActive,
      tier: reward.tier,
      stock: reward.stock,
      validDays: reward.validDays,
      category: reward.category
    });
  } catch (error) {
    console.error('Erro ao atualizar recompensa:', error);
    res.status(500).json({ error: 'Erro ao atualizar recompensa' });
  }
});

// DELETE /api/loyalty/rewards/:id - Deletar recompensa
router.delete('/rewards/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.loyaltyReward.delete({
      where: { id, userId: req.userId }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar recompensa:', error);
    res.status(500).json({ error: 'Erro ao deletar recompensa' });
  }
});

// POST /api/loyalty/members/:id/points - Adicionar pontos
router.post('/members/:id/points', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { points, source, description } = req.body;

    const member = await prisma.loyaltyMember.findUnique({
      where: { id, userId: req.userId }
    });

    if (!member) {
      res.status(404).json({ error: 'Membro não encontrado' });
      return;
    }

    // Calcular novo tier baseado nos pontos
    let newTier = member.tier;
    const totalPoints = member.totalPoints + points;
    if (totalPoints >= 15000) newTier = 'diamond';
    else if (totalPoints >= 5000) newTier = 'gold';
    else if (totalPoints >= 1000) newTier = 'silver';
    else newTier = 'bronze';

    const [updatedMember, history] = await Promise.all([
      prisma.loyaltyMember.update({
        where: { id },
        data: {
          totalPoints,
          availablePoints: member.availablePoints + points,
          tier: newTier,
          lastActivityAt: BigInt(Date.now())
        }
      }),
      prisma.loyaltyPointsHistory.create({
        data: {
          memberId: id,
          points,
          source,
          description: description || `Pontos adicionados via ${source}`,
          createdAt: BigInt(Date.now())
        }
      })
    ]);

    res.json({
      id: updatedMember.id,
      totalPoints: updatedMember.totalPoints,
      availablePoints: updatedMember.availablePoints,
      tier: updatedMember.tier,
      history: {
        id: history.id,
        points: history.points,
        source: history.source,
        description: history.description,
        createdAt: Number(history.createdAt)
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar pontos:', error);
    res.status(500).json({ error: 'Erro ao adicionar pontos' });
  }
});

export default router;


