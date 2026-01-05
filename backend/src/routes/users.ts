import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';
import { z } from 'zod';
import { cache } from '../config/cache.js';
import { logger } from '../config/logger.js';

const router = Router();

router.use(authMiddleware);

// Middleware de debug para todas as requisições (apenas em desenvolvimento)
router.use((req, res, next) => {
  logger.debug(`[users.ts] ${req.method} ${req.path} - Original URL: ${req.originalUrl}`);
  next();
});

// Schema de validação para criar usuário
const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  name: z.string().min(2, 'Nome é obrigatório'),
  role: z.enum(['admin', 'finance', 'reception', 'viewer'], {
    errorMap: () => ({ message: 'Role inválido' })
  })
});

// Schema de validação para atualizar usuário
const updateUserSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório').optional(),
  email: z.string().email('Email inválido').optional(),
  role: z.enum(['admin', 'finance', 'reception', 'viewer'], {
    errorMap: () => ({ message: 'Role inválido' })
  }).optional(),
  plan: z.enum(['free', 'basic', 'professional', 'enterprise'], {
    errorMap: () => ({ message: 'Plano inválido' })
  }).optional()
});

// GET /api/users/clinic-members
router.get('/clinic-members', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { clinicId: true } // Otimização: buscar apenas o necessário
    });

    if (!currentUser) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    // Paginação
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    // Cache key baseado em clinicId, página e limite
    const cacheKey = `clinic-members:${currentUser.clinicId}:${page}:${limit}`;
    
    // Tentar buscar do cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    // Se não estiver em cache, buscar do banco
    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where: { clinicId: currentUser.clinicId },
        select: {
          id: true,
          email: true,
          name: true,
          clinicName: true,
          clinicId: true,
          onboardingCompleted: true,
          role: true,
          plan: true,
          avatarUrl: true
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.user.count({
        where: { clinicId: currentUser.clinicId }
      })
    ]);

    const result = {
      data: members.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        clinicName: u.clinicName,
        clinicId: u.clinicId,
        onboardingCompleted: u.onboardingCompleted,
        role: u.role,
        plan: u.plan || 'free',
        avatar_url: u.avatarUrl
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    // Cachear por 5 minutos
    await cache.set(cacheKey, result, 300);

    res.json(result);
  } catch (error) {
    logger.error('Erro get clinic members:', error);
    res.status(500).json({ error: 'Erro ao buscar membros' });
  }
});

// PUT /api/users/profile
router.put('/profile', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, clinicName, avatarUrl } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name, clinicName, avatarUrl }
    });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      clinicName: user.clinicName,
      clinicId: user.clinicId,
      onboardingCompleted: user.onboardingCompleted,
      role: user.role,
      avatar_url: user.avatarUrl
    });
  } catch (error) {
    logger.error('Erro update profile:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// POST /api/users - Criar novo usuário
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verificar se o usuário tem permissão (apenas admin e superadmin)
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!currentUser) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      res.status(403).json({ error: 'Você não tem permissão para criar usuários' });
      return;
    }

    const { email, password, name, role } = createUserSchema.parse(req.body);

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Email já cadastrado' });
      return;
    }

    // Verificar limite de usuários (opcional - pode ser implementado com subscription)
    const memberCount = await prisma.user.count({
      where: { clinicId: currentUser.clinicId }
    });

    // Limite padrão de 10 usuários (pode ser ajustado baseado no plano)
    if (memberCount >= 10) {
      res.status(400).json({ error: 'Limite de usuários atingido. Máximo de 10 usuários por clínica.' });
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário com o mesmo clinicId
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        clinicName: currentUser.clinicName,
        clinicId: currentUser.clinicId,
        role: role || 'viewer',
        onboardingCompleted: false
      }
    });

    // Invalidar cache após criar usuário
    await cache.invalidatePattern(`clinic-members:${currentUser.clinicId}*`);

    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      clinicName: newUser.clinicName,
      clinicId: newUser.clinicId,
      onboardingCompleted: newUser.onboardingCompleted,
      role: newUser.role,
      avatar_url: newUser.avatarUrl
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    logger.error('Erro create user:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// PUT /api/users/:id - Atualizar usuário
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    logger.debug('[PUT /users/:id] Requisição recebida', { params: req.params, body: req.body, userId: req.userId });
    
    const { id } = req.params;

    // Verificar se o usuário tem permissão
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!currentUser) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      res.status(403).json({ error: 'Você não tem permissão para atualizar usuários' });
      return;
    }

    // Buscar usuário a ser atualizado
    const userToUpdate = await prisma.user.findUnique({
      where: { id }
    });

    if (!userToUpdate) {
      res.status(404).json({ error: 'Usuário a ser atualizado não encontrado' });
      return;
    }

    // Verificar se o usuário pertence à mesma clínica
    if (userToUpdate.clinicId !== currentUser.clinicId) {
      res.status(403).json({ error: 'Você não tem permissão para atualizar este usuário' });
      return;
    }

    // Não permitir que o usuário altere seu próprio role se for o único admin
    if (id === req.userId) {
      const adminCount = await prisma.user.count({
        where: {
          clinicId: currentUser.clinicId,
          role: { in: ['admin', 'superadmin'] }
        }
      });

      if (adminCount === 1 && req.body.role && req.body.role !== 'admin' && req.body.role !== 'superadmin') {
        res.status(400).json({ error: 'Não é possível alterar seu próprio cargo. Você é o único administrador da clínica.' });
        return;
      }
    }

    // Validar dados
    const updateData = updateUserSchema.parse(req.body);

    // Se estiver atualizando email, verificar se não existe outro usuário com o mesmo email
    if (updateData.email && updateData.email !== userToUpdate.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: updateData.email } });
      if (existingUser) {
        res.status(400).json({ error: 'Email já cadastrado' });
        return;
      }
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    // Invalidar cache após atualizar usuário
    await cache.invalidatePattern(`clinic-members:${currentUser.clinicId}*`);

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      clinicName: updatedUser.clinicName,
      clinicId: updatedUser.clinicId,
      onboardingCompleted: updatedUser.onboardingCompleted,
      role: updatedUser.role,
      plan: updatedUser.plan || 'free',
      avatar_url: updatedUser.avatarUrl
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    logger.error('Erro update user:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// DELETE /api/users/:id - Remover usuário
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verificar se o usuário tem permissão
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!currentUser) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      res.status(403).json({ error: 'Você não tem permissão para remover usuários' });
      return;
    }

    // Não permitir remover a si mesmo
    if (id === req.userId) {
      res.status(400).json({ error: 'Você não pode remover seu próprio usuário' });
      return;
    }

    // Buscar usuário a ser removido
    const userToDelete = await prisma.user.findUnique({
      where: { id }
    });

    if (!userToDelete) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    // Verificar se o usuário pertence à mesma clínica
    if (userToDelete.clinicId !== currentUser.clinicId) {
      res.status(403).json({ error: 'Você não tem permissão para remover este usuário' });
      return;
    }

    // Verificar se é o último admin
    if (userToDelete.role === 'admin' || userToDelete.role === 'superadmin') {
      const adminCount = await prisma.user.count({
        where: {
          clinicId: currentUser.clinicId,
          role: { in: ['admin', 'superadmin'] }
        }
      });

      if (adminCount === 1) {
        res.status(400).json({ error: 'Não é possível remover o último administrador da clínica' });
        return;
      }
    }

    // Remover usuário
    await prisma.user.delete({
      where: { id }
    });

    // Invalidar cache após deletar usuário
    await cache.invalidatePattern(`clinic-members:${currentUser.clinicId}*`);

    res.json({ success: true, message: 'Usuário removido com sucesso' });
  } catch (error) {
    logger.error('Erro delete user:', error);
    res.status(500).json({ error: 'Erro ao remover usuário' });
  }
});

export default router;





