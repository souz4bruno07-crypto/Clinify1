import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/prescriptions - Listar prescrições
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const patientId = req.query.patientId as string | undefined;
    const status = req.query.status as string | undefined;

    const where: any = {
      userId: req.userId
    };

    if (patientId) {
      where.patientId = patientId;
    }

    if (status) {
      where.status = status;
    }

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.prescription.count({ where })
    ]);

    res.json({
      data: prescriptions,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Erro ao buscar prescrições:', error);
    res.status(500).json({ error: 'Erro ao buscar prescrições' });
  }
});

// GET /api/prescriptions/:id - Obter prescrição específica
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescription.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!prescription) {
      res.status(404).json({ error: 'Prescrição não encontrada' });
      return;
    }

    res.json(prescription);
  } catch (error) {
    console.error('Erro ao buscar prescrição:', error);
    res.status(500).json({ error: 'Erro ao buscar prescrição' });
  }
});

// POST /api/prescriptions - Criar prescrição
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;

    const prescription = await prisma.prescription.create({
      data: {
        clinicId: req.userId!,
        userId: req.userId!,
        patientId: data.patientId || null,
        patientName: data.patientName || 'Paciente',
        patientCpf: data.patientCpf,
        patientBirthDate: data.patientBirthDate,
        patientAddress: data.patientAddress,
        professionalId: data.professionalId || req.userId!,
        professionalName: data.professionalName || 'Profissional',
        professionalCrm: data.professionalCrm,
        professionalSpecialty: data.professionalSpecialty,
        items: data.items || [],
        diagnosis: data.diagnosis,
        additionalNotes: data.additionalNotes,
        templateId: data.templateId,
        signatureData: data.signatureData,
        signedAt: data.signedAt ? BigInt(data.signedAt) : null,
        status: data.status || 'draft',
        sentVia: data.sentVia || [],
        sentAt: data.sentAt ? BigInt(data.sentAt) : null,
        pdfUrl: data.pdfUrl,
        validUntil: data.validUntil ? BigInt(data.validUntil) : null,
        isControlled: data.isControlled || false,
        createdAt: BigInt(data.createdAt || Date.now()),
        updatedAt: BigInt(data.updatedAt || Date.now())
      }
    });

    res.status(201).json(prescription);
  } catch (error) {
    console.error('Erro ao criar prescrição:', error);
    res.status(500).json({ error: 'Erro ao criar prescrição' });
  }
});

// PUT /api/prescriptions/:id - Atualizar prescrição
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    const prescription = await prisma.prescription.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!prescription) {
      res.status(404).json({ error: 'Prescrição não encontrada' });
      return;
    }

    const updated = await prisma.prescription.update({
      where: { id },
      data: {
        patientId: data.patientId !== undefined ? data.patientId : prescription.patientId,
        patientName: data.patientName || prescription.patientName,
        patientCpf: data.patientCpf !== undefined ? data.patientCpf : prescription.patientCpf,
        patientBirthDate: data.patientBirthDate !== undefined ? data.patientBirthDate : prescription.patientBirthDate,
        patientAddress: data.patientAddress !== undefined ? data.patientAddress : prescription.patientAddress,
        professionalCrm: data.professionalCrm !== undefined ? data.professionalCrm : prescription.professionalCrm,
        professionalSpecialty: data.professionalSpecialty !== undefined ? data.professionalSpecialty : prescription.professionalSpecialty,
        items: data.items !== undefined ? data.items : prescription.items,
        diagnosis: data.diagnosis !== undefined ? data.diagnosis : prescription.diagnosis,
        additionalNotes: data.additionalNotes !== undefined ? data.additionalNotes : prescription.additionalNotes,
        signatureData: data.signatureData !== undefined ? data.signatureData : prescription.signatureData,
        signedAt: data.signedAt ? BigInt(data.signedAt) : prescription.signedAt,
        status: data.status || prescription.status,
        sentVia: data.sentVia !== undefined ? data.sentVia : prescription.sentVia,
        sentAt: data.sentAt ? BigInt(data.sentAt) : prescription.sentAt,
        pdfUrl: data.pdfUrl !== undefined ? data.pdfUrl : prescription.pdfUrl,
        validUntil: data.validUntil ? BigInt(data.validUntil) : prescription.validUntil,
        isControlled: data.isControlled !== undefined ? data.isControlled : prescription.isControlled,
        updatedAt: BigInt(Date.now())
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar prescrição:', error);
    res.status(500).json({ error: 'Erro ao atualizar prescrição' });
  }
});

// DELETE /api/prescriptions/:id - Deletar prescrição
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescription.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!prescription) {
      res.status(404).json({ error: 'Prescrição não encontrada' });
      return;
    }

    await prisma.prescription.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar prescrição:', error);
    res.status(500).json({ error: 'Erro ao deletar prescrição' });
  }
});

// GET /api/prescriptions/patient/:patientId - Listar prescrições de um paciente
router.get('/patient/:patientId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const prescriptions = await prisma.prescription.findMany({
      where: {
        patientId,
        userId: req.userId
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: prescriptions });
  } catch (error) {
    console.error('Erro ao buscar prescrições do paciente:', error);
    res.status(500).json({ error: 'Erro ao buscar prescrições do paciente' });
  }
});

export default router;





