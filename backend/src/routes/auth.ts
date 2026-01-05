import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { generateToken, authMiddleware, AuthRequest } from '../middlewares/auth.js';
import { z } from 'zod';

const router = Router();

// Schemas de validação
const signUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  name: z.string().min(2, 'Nome é obrigatório'),
  clinicName: z.string().min(2, 'Nome da clínica é obrigatório')
});

const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

// POST /api/auth/signup
router.post('/signup', async (req, res: Response): Promise<void> => {
  try {
    const { email, password, name, clinicName } = signUpSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Email já cadastrado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        clinicName,
        clinicId: '', // será atualizado após criação
        role: 'admin',
        onboardingCompleted: false
      }
    });

    // Atualizar clinicId para o próprio ID do usuário (proprietário)
    await prisma.user.update({
      where: { id: user.id },
      data: { clinicId: user.id }
    });

    // Criar subscription automaticamente com trial de 14 dias
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14); // Trial de 14 dias

    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'free',
        status: 'trialing',
        startDate: startDate,
        endDate: endDate,
        cancelAtPeriodEnd: false
      }
    });

    // Atualizar o plano do usuário também
    await prisma.user.update({
      where: { id: user.id },
      data: { plan: 'free' }
    });

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        clinicName: user.clinicName,
        clinicId: user.id,
        onboardingCompleted: user.onboardingCompleted,
        role: user.role,
        avatar_url: user.avatarUrl
      },
      token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('Erro signup:', error);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

// POST /api/auth/signin
router.post('/signin', async (req, res: Response): Promise<void> => {
  try {
    const { email, password } = signInSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const token = generateToken(user.id, user.role);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        clinicName: user.clinicName,
        clinicId: user.clinicId,
        onboardingCompleted: user.onboardingCompleted,
        role: user.role,
        avatar_url: user.avatarUrl
      },
      token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('Erro signin:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

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
    console.error('Erro me:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// PUT /api/auth/complete-onboarding
router.put('/complete-onboarding', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { onboardingCompleted: true }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Erro onboarding:', error);
    res.status(500).json({ error: 'Erro ao completar onboarding' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    // Aqui você implementaria o envio de email com link de reset
    // Por enquanto, apenas retornamos sucesso
    console.log(`Reset password solicitado para: ${email}`);
    res.json({ success: true, message: 'Se o email existir, você receberá instruções' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
});

export default router;













