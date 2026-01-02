import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';
import { debugLog } from '../utils/debugLog.js';

const router = Router();

router.use(authMiddleware);

// GET /api/appointments
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  // #region agent log
  await debugLog({location:'appointments.ts:10',message:'GET /appointments iniciado',data:{userId:req.userId,start:req.query.start,end:req.query.end,page:req.query.page,limit:req.query.limit},hypothesisId:'A'});
  // #endregion
  try {
    const { start, end } = req.query;
    // Suporte para paginação
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    
    const finalLimit = Math.min(limit, 200);
    const skip = page !== undefined ? (page - 1) * finalLimit : 0;

    const where: any = {
      userId: req.userId
    };

    if (start && end) {
      where.startTime = {
        gte: BigInt(start as string),
        lte: BigInt(end as string)
      };
    }

    const queryStartTime = Date.now();
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        select: {
          id: true,
          userId: true,
          patientId: true,
          patientName: true,
          staffId: true,
          startTime: true,
          endTime: true,
          serviceName: true,
          status: true,
          notes: true
        },
        orderBy: { startTime: 'asc' },
        skip,
        take: finalLimit
      }),
      prisma.appointment.count({ where })
    ]);

    const queryElapsed = Date.now() - queryStartTime;
    // #region agent log
    await debugLog({location:'appointments.ts:51',message:'GET /appointments query concluída',data:{appointmentsCount:appointments.length,total,queryElapsedMs:queryElapsed,limit:finalLimit,skip,hasDateRange:!!(start&&end)},hypothesisId:'A'});
    // #endregion

    const result = {
      data: appointments.map(a => ({
        id: a.id,
        userId: a.userId,
        patientId: a.patientId,
        patientName: a.patientName,
        staffId: a.staffId,
        startTime: Number(a.startTime),
        endTime: Number(a.endTime),
        serviceName: a.serviceName,
        status: a.status,
        notes: a.notes
      })),
      pagination: page !== undefined ? {
        page,
        limit: finalLimit,
        total,
        totalPages: Math.ceil(total / finalLimit)
      } : {
        total,
        limit: finalLimit
      }
    };

    const totalElapsed = Date.now() - startTime;
    // #region agent log
    await debugLog({location:'appointments.ts:75',message:'GET /appointments concluído',data:{totalElapsedMs:totalElapsed,returnedCount:result.data.length},hypothesisId:'A'});
    // #endregion

    res.json(result);
  } catch (error) {
    console.error('Erro get appointments:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

// GET /api/appointments/today
router.get('/today', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: req.userId,
        startTime: {
          gte: BigInt(start.getTime()),
          lte: BigInt(end.getTime())
        }
      }
    });

    res.json(appointments.map(a => ({
      id: a.id,
      userId: a.userId,
      patientId: a.patientId,
      patientName: a.patientName,
      staffId: a.staffId,
      startTime: Number(a.startTime),
      endTime: Number(a.endTime),
      serviceName: a.serviceName,
      status: a.status,
      notes: a.notes
    })));
  } catch (error) {
    console.error('Erro get today:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos de hoje' });
  }
});

// POST /api/appointments
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId, patientName, staffId, startTime, endTime, serviceName, status, notes } = req.body;

    const appointment = await prisma.appointment.create({
      data: {
        userId: req.userId!,
        patientId,
        patientName,
        staffId,
        startTime: BigInt(startTime),
        endTime: BigInt(endTime),
        serviceName,
        status: status || 'scheduled',
        notes
      }
    });

    res.status(201).json({
      id: appointment.id,
      userId: appointment.userId,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      staffId: appointment.staffId,
      startTime: Number(appointment.startTime),
      endTime: Number(appointment.endTime),
      serviceName: appointment.serviceName,
      status: appointment.status,
      notes: appointment.notes
    });
  } catch (error) {
    console.error('Erro create appointment:', error);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

// PUT /api/appointments/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { patientId, patientName, staffId, startTime, endTime, serviceName, status, notes } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id, userId: req.userId },
      data: {
        patientId,
        patientName,
        staffId,
        startTime: startTime ? BigInt(startTime) : undefined,
        endTime: endTime ? BigInt(endTime) : undefined,
        serviceName,
        status,
        notes
      }
    });

    res.json({
      id: appointment.id,
      userId: appointment.userId,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      staffId: appointment.staffId,
      startTime: Number(appointment.startTime),
      endTime: Number(appointment.endTime),
      serviceName: appointment.serviceName,
      status: appointment.status,
      notes: appointment.notes
    });
  } catch (error) {
    console.error('Erro update appointment:', error);
    res.status(500).json({ error: 'Erro ao atualizar agendamento' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.appointment.delete({
      where: { id, userId: req.userId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro delete appointment:', error);
    res.status(500).json({ error: 'Erro ao deletar agendamento' });
  }
});

export default router;










