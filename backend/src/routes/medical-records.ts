import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/medical-records/:patientId
router.get('/:patientId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const userId = req.userId!;

    // Verificar se o paciente pertence ao usuário
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, userId }
    });

    if (!patient) {
      res.status(404).json({ error: 'Paciente não encontrado' });
      return;
    }

    // Buscar ou criar prontuário
    let medicalRecord = await prisma.medicalRecord.findUnique({
      where: { patientId },
      include: {
        consultationRecords: {
          orderBy: { createdAt: 'desc' }
        },
        clinicalNotes: {
          orderBy: { createdAt: 'desc' }
        },
        anamnesisResponses: {
          orderBy: { createdAt: 'desc' }
        },
        medicalAttachments: {
          orderBy: { createdAt: 'desc' }
        },
        digitalSignatures: {
          orderBy: { signedAt: 'desc' }
        },
        odontogram: true
      }
    });

    // Se não existe, criar um novo prontuário
    if (!medicalRecord) {
      const now = BigInt(Date.now());
      medicalRecord = await prisma.medicalRecord.create({
        data: {
          patientId,
          userId,
          createdAt: now,
          updatedAt: now
        },
        include: {
          consultationRecords: true,
          clinicalNotes: true,
          anamnesisResponses: true,
          medicalAttachments: true,
          digitalSignatures: true,
          odontogram: true
        }
      });
    }

    // Buscar agendamentos completados que ainda não têm consulta associada
    const allCompletedAppointments = await prisma.appointment.findMany({
      where: {
        patientId,
        userId,
        status: 'completed'
      },
      include: {
        staff: true
      },
      orderBy: { startTime: 'desc' }
    });

    // Buscar consultas existentes com appointmentId
    const existingConsultationAppointmentIds = await prisma.consultationRecord.findMany({
      where: {
        patientId,
        appointmentId: { not: null }
      },
      select: {
        appointmentId: true
      }
    });

    const existingAppointmentIds = new Set(
      existingConsultationAppointmentIds
        .map(c => c.appointmentId)
        .filter((id): id is string => id !== null)
    );

    // Filtrar apenas agendamentos sem consulta
    const completedAppointments = allCompletedAppointments.filter(
      appt => !existingAppointmentIds.has(appt.id)
    );

    // Converter agendamentos em consultas
    const consultationPromises = completedAppointments.map(async (appt) => {
      const appointmentTime = Number(appt.startTime);
      const consultation = await prisma.consultationRecord.create({
        data: {
          medicalRecordId: medicalRecord!.id,
          patientId,
          appointmentId: appt.id,
          professionalId: appt.staffId || userId,
          professionalName: appt.staff?.name || 'Profissional',
          chiefComplaint: appt.serviceName || 'Consulta de rotina',
          clinicalExam: appt.notes || '',
          diagnosis: '',
          treatmentPlan: '',
          procedures: [appt.serviceName].filter(Boolean),
          prescriptions: [],
          createdAt: BigInt(appointmentTime),
          updatedAt: BigInt(appointmentTime)
        }
      });
      return consultation;
    });

    await Promise.all(consultationPromises);

    // Buscar novamente com as novas consultas
    const updatedMedicalRecord = await prisma.medicalRecord.findUnique({
      where: { patientId },
      include: {
        consultationRecords: {
          orderBy: { createdAt: 'desc' }
        },
        clinicalNotes: {
          orderBy: { createdAt: 'desc' }
        },
        anamnesisResponses: {
          orderBy: { createdAt: 'desc' }
        },
        medicalAttachments: {
          orderBy: { createdAt: 'desc' }
        },
        digitalSignatures: {
          orderBy: { signedAt: 'desc' }
        },
        odontogram: true
      }
    });

    // Converter para formato esperado pelo frontend
    const response = {
      id: updatedMedicalRecord!.id,
      patientId: updatedMedicalRecord!.patientId,
      anamnesis: updatedMedicalRecord!.anamnesisResponses.map(a => ({
        id: a.id,
        patientId: a.patientId,
        templateId: a.templateId,
        responses: a.responses as any,
        createdAt: Number(a.createdAt),
        updatedAt: Number(a.updatedAt)
      })),
      consultations: updatedMedicalRecord!.consultationRecords.map(c => ({
        id: c.id,
        patientId: c.patientId,
        appointmentId: c.appointmentId,
        professionalId: c.professionalId,
        professionalName: c.professionalName,
        chiefComplaint: c.chiefComplaint,
        clinicalExam: c.clinicalExam,
        diagnosis: c.diagnosis,
        treatmentPlan: c.treatmentPlan,
        procedures: c.procedures,
        prescriptions: c.prescriptions,
        odontogramSnapshot: c.odontogramSnapshot,
        signatureId: c.signatureId,
        attachments: [],
        notes: [],
        createdAt: Number(c.createdAt),
        updatedAt: Number(c.updatedAt)
      })),
      odontogram: updatedMedicalRecord!.odontogram ? {
        id: updatedMedicalRecord!.odontogram.id,
        patientId: updatedMedicalRecord!.odontogram.patientId,
        teeth: updatedMedicalRecord!.odontogram.teeth as any,
        createdAt: Number(updatedMedicalRecord!.odontogram.createdAt),
        updatedAt: Number(updatedMedicalRecord!.odontogram.updatedAt)
      } : {
        id: `od-${patientId}`,
        patientId,
        teeth: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      attachments: updatedMedicalRecord!.medicalAttachments.map(a => ({
        id: a.id,
        patientId: a.patientId,
        name: a.name,
        type: a.type,
        url: a.url,
        mimeType: a.mimeType,
        size: Number(a.size),
        description: a.description,
        uploadedBy: a.uploadedBy,
        createdAt: Number(a.createdAt)
      })),
      notes: updatedMedicalRecord!.clinicalNotes.map(n => ({
        id: n.id,
        patientId: n.patientId,
        professionalId: n.professionalId,
        professionalName: n.professionalName,
        content: n.content,
        type: n.type,
        attachments: n.attachments,
        createdAt: Number(n.createdAt),
        updatedAt: Number(n.updatedAt)
      })),
      signatures: updatedMedicalRecord!.digitalSignatures.map(s => ({
        id: s.id,
        patientId: s.patientId,
        documentType: s.documentType,
        documentId: s.documentId,
        signatureData: s.signatureData,
        signedAt: Number(s.signedAt)
      })),
      createdAt: Number(updatedMedicalRecord!.createdAt),
      updatedAt: Number(updatedMedicalRecord!.updatedAt)
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar prontuário:', error);
    res.status(500).json({ error: 'Erro ao buscar prontuário' });
  }
});

// POST /api/medical-records/:patientId/consultations
router.post('/:patientId/consultations', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const userId = req.userId!;
    const {
      appointmentId,
      professionalId,
      professionalName,
      chiefComplaint,
      clinicalExam,
      diagnosis,
      treatmentPlan,
      procedures,
      prescriptions
    } = req.body;

    // Verificar se o paciente pertence ao usuário
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, userId }
    });

    if (!patient) {
      res.status(404).json({ error: 'Paciente não encontrado' });
      return;
    }

    // Buscar ou criar prontuário
    let medicalRecord = await prisma.medicalRecord.findUnique({
      where: { patientId }
    });

    if (!medicalRecord) {
      const now = BigInt(Date.now());
      medicalRecord = await prisma.medicalRecord.create({
        data: {
          patientId,
          userId,
          createdAt: now,
          updatedAt: now
        }
      });
    }

    const now = BigInt(Date.now());
    const consultation = await prisma.consultationRecord.create({
      data: {
        medicalRecordId: medicalRecord.id,
        patientId,
        appointmentId: appointmentId || null,
        professionalId: professionalId || userId,
        professionalName: professionalName || 'Profissional',
        chiefComplaint: chiefComplaint || 'Consulta de rotina',
        clinicalExam: clinicalExam || '',
        diagnosis: diagnosis || '',
        treatmentPlan: treatmentPlan || '',
        procedures: procedures || [],
        prescriptions: prescriptions || [],
        createdAt: now,
        updatedAt: now
      }
    });

    // Atualizar updatedAt do prontuário
    await prisma.medicalRecord.update({
      where: { id: medicalRecord.id },
      data: { updatedAt: now }
    });

    res.status(201).json({
      id: consultation.id,
      patientId: consultation.patientId,
      appointmentId: consultation.appointmentId,
      professionalId: consultation.professionalId,
      professionalName: consultation.professionalName,
      chiefComplaint: consultation.chiefComplaint,
      clinicalExam: consultation.clinicalExam,
      diagnosis: consultation.diagnosis,
      treatmentPlan: consultation.treatmentPlan,
      procedures: consultation.procedures,
      prescriptions: consultation.prescriptions,
      odontogramSnapshot: consultation.odontogramSnapshot,
      signatureId: consultation.signatureId,
      attachments: [],
      notes: [],
      createdAt: Number(consultation.createdAt),
      updatedAt: Number(consultation.updatedAt)
    });
  } catch (error) {
    console.error('Erro ao criar consulta:', error);
    res.status(500).json({ error: 'Erro ao criar consulta' });
  }
});

export default router;

