import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/chat/threads
router.get('/threads', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const threads = await prisma.chatThread.findMany({
      where: { userId: req.userId },
      orderBy: { lastTimestamp: 'desc' }
    });

    res.json(threads.map(t => ({
      id: t.id,
      user_id: t.userId,
      contact_name: t.contactName,
      last_message: t.lastMessage,
      last_timestamp: t.lastTimestamp ? Number(t.lastTimestamp) : null,
      avatar_url: t.avatarUrl,
      crm_stage: t.crmStage
    })));
  } catch (error) {
    console.error('Erro get threads:', error);
    res.status(500).json({ error: 'Erro ao buscar conversas' });
  }
});

// GET /api/chat/messages/:patientId
router.get('/messages/:patientId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const messages = await prisma.chatMessage.findMany({
      where: { patientId },
      orderBy: { timestamp: 'asc' }
    });

    res.json(messages.map(m => ({
      id: m.id,
      patientId: m.patientId,
      content: m.content,
      direction: m.direction,
      timestamp: Number(m.timestamp),
      status: m.status
    })));
  } catch (error) {
    console.error('Erro get messages:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// POST /api/chat/messages
router.post('/messages', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId, content, direction, timestamp, contactName, contactPhone } = req.body;

    const message = await prisma.chatMessage.create({
      data: {
        userId: req.userId,
        patientId,
        content,
        direction,
        timestamp: BigInt(timestamp || Date.now()),
        contactName,
        contactPhone,
        status: 'sent'
      }
    });

    res.status(201).json({
      id: message.id,
      patientId: message.patientId,
      content: message.content,
      direction: message.direction,
      timestamp: Number(message.timestamp),
      status: message.status
    });
  } catch (error) {
    console.error('Erro create message:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// PUT /api/chat/threads/:id
router.put('/threads/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { contactName, lastMessage, lastTimestamp, avatarUrl, crmStage } = req.body;

    await prisma.chatThread.upsert({
      where: { id },
      update: {
        contactName,
        lastMessage,
        lastTimestamp: lastTimestamp ? BigInt(lastTimestamp) : undefined,
        avatarUrl,
        crmStage
      },
      create: {
        id,
        userId: req.userId!,
        contactName,
        lastMessage,
        lastTimestamp: lastTimestamp ? BigInt(lastTimestamp) : null,
        avatarUrl,
        crmStage: crmStage || 'new'
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro update thread:', error);
    res.status(500).json({ error: 'Erro ao atualizar conversa' });
  }
});

// PUT /api/chat/threads/:id/stage
router.put('/threads/:id/stage', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    await prisma.chatThread.update({
      where: { id, userId: req.userId },
      data: { crmStage: stage }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro update stage:', error);
    res.status(500).json({ error: 'Erro ao atualizar estágio' });
  }
});

// GET /api/chat/contacts (busca pacientes como contatos)
router.get('/contacts', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const patients = await prisma.patient.findMany({
      where: { userId: req.userId }
    });

    res.json(patients.map(p => ({
      id: p.id,
      clinicId: req.userId,
      name: p.name,
      phone: p.phone,
      email: p.email,
      avatarUrl: p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random`,
      lastMessage: 'Abrir conversa',
      unreadCount: 0
    })));
  } catch (error) {
    console.error('Erro get contacts:', error);
    res.status(500).json({ error: 'Erro ao buscar contatos' });
  }
});

export default router;











