import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { 
  generateTokenPair, 
  generateToken,
  authMiddleware, 
  AuthRequest,
  revokeToken,
  verifyRefreshToken
} from '../middlewares/auth.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { 
  signUpSchema, 
  signInSchema, 
  refreshTokenSchema,
  resetPasswordSchema,
  changePasswordSchema
} from '../validators/auth.validator.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';
import { sanitizeFields } from '../utils/sanitize.js';
import { logger } from '../config/logger.js';

const router = Router();

// POST /api/auth/signup
router.post('/signup', asyncHandler(async (req, res: Response) => {
  // Sanitizar e validar entrada
  const sanitized = sanitizeFields(req.body, ['email', 'name', 'clinicName']);
  const { email, password, name, clinicName } = signUpSchema.parse(sanitized);

  // Verificar se email já existe
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError('Email já cadastrado');
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // Criar usuário
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

  // Gerar tokens
  const { accessToken, refreshToken } = generateTokenPair(user.id, user.role);

  logger.info('Novo usuário criado:', { userId: user.id, email: user.email });

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
    accessToken,
    refreshToken
  });
}));

// POST /api/auth/signin
router.post('/signin', asyncHandler(async (req, res: Response) => {
  const { email, password } = signInSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new UnauthorizedError('Credenciais inválidas');
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new UnauthorizedError('Credenciais inválidas');
  }

  // Gerar tokens
  const { accessToken, refreshToken } = generateTokenPair(user.id, user.role);

  logger.info('Login realizado:', { userId: user.id, email: user.email });

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
    accessToken,
    refreshToken
  });
}));

// POST /api/auth/refresh
router.post('/refresh', asyncHandler(async (req, res: Response) => {
  const { refreshToken: token } = refreshTokenSchema.parse(req.body);

  // Verificar refresh token
  const { id } = verifyRefreshToken(token);

  // Buscar usuário
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new NotFoundError('Usuário');
  }

  // Gerar novo par de tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user.id, user.role);

  // Revogar refresh token antigo (opcional, mas recomendado)
  await revokeToken(token);

  res.json({
    accessToken,
    refreshToken: newRefreshToken
  });
}));

// POST /api/auth/logout
router.post('/logout', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    await revokeToken(token);
  }

  // Se houver refresh token no body, revogar também
  if (req.body.refreshToken) {
    await revokeToken(req.body.refreshToken);
  }

  logger.info('Logout realizado:', { userId: req.userId });

  res.json({ success: true, message: 'Logout realizado com sucesso' });
}));

// GET /api/auth/me
router.get('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId }
  });

  if (!user) {
    throw new NotFoundError('Usuário');
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
}));

// PUT /api/auth/complete-onboarding
router.put('/complete-onboarding', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.user.update({
    where: { id: req.userId },
    data: { onboardingCompleted: true }
  });
  
  logger.info('Onboarding completado:', { userId: req.userId });
  
  res.json({ success: true });
}));

// POST /api/auth/reset-password
router.post('/reset-password', asyncHandler(async (req, res: Response) => {
  const { email } = resetPasswordSchema.parse(req.body);
  
  // Verificar se usuário existe (não revelar se não existir por segurança)
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (user) {
    // TODO: Implementar envio de email com link de reset
    // Por enquanto, apenas logar
    logger.info('Reset de senha solicitado:', { email, userId: user.id });
  }
  
  // Sempre retornar sucesso (não revelar se email existe)
  res.json({ 
    success: true, 
    message: 'Se o email existir, você receberá instruções' 
  });
}));

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    throw new NotFoundError('Usuário');
  }
  
  // Verificar senha atual
  const validPassword = await bcrypt.compare(currentPassword, user.password);
  if (!validPassword) {
    throw new UnauthorizedError('Senha atual incorreta');
  }
  
  // Hash da nova senha
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // Atualizar senha
  await prisma.user.update({
    where: { id: req.userId },
    data: { password: hashedPassword }
  });
  
  logger.info('Senha alterada:', { userId: req.userId });
  
  res.json({ success: true, message: 'Senha alterada com sucesso' });
}));

export default router;













