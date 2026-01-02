import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/categories
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: req.userId },
          { userId: null }
        ]
      }
    });

    res.json(categories);
  } catch (error) {
    console.error('Erro get categories:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// POST /api/categories
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        type,
        userId: req.userId
      }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Erro create category:', error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await prisma.category.update({
      where: { id, userId: req.userId },
      data: { name }
    });

    res.json(category);
  } catch (error) {
    console.error('Erro update category:', error);
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.category.delete({
      where: { id, userId: req.userId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro delete category:', error);
    res.status(500).json({ error: 'Erro ao deletar categoria' });
  }
});

export default router;












