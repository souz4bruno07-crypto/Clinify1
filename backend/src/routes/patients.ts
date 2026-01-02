import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';
import { cache } from '../config/cache.js';
import { debugLog } from '../utils/debugLog.js';

const router = Router();

router.use(authMiddleware);

// GET /api/patients
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  // #region agent log
  await debugLog({location:'patients.ts:11',message:'GET /patients iniciado',data:{userId:req.userId,page:req.query.page,limit:req.query.limit,offset:req.query.offset},hypothesisId:'A'});
  // #endregion
  try {
    // Suporte para ambos os formatos: page/limit e offset/limit
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    
    const finalLimit = Math.min(limit, 100);
    const skip = page !== undefined ? (page - 1) * finalLimit : (offset || 0);

    const cacheKey = `patients:${req.userId}:${page || offset || 0}:${finalLimit}`;
    
    // CACHE COMPLETAMENTE DESABILITADO PARA DEBUG - Redis está causando timeout de 8-19 segundos
    // const cacheKey = `patients:${req.userId}:${page || offset || 0}:${finalLimit}`;
    // const cached = await cache.get(cacheKey);
    // if (cached) {
    //   res.json(cached);
    //   return;
    // }

    const queryStartTime = Date.now();
    // #region agent log
    await debugLog({location:'patients.ts:38',message:'GET /patients iniciando query do banco',data:{userId:req.userId,skip,take:finalLimit},hypothesisId:'A'});
    // #endregion
    
    // Executar queries com timeout de 5 segundos
    const queryPromise = Promise.all([
      prisma.patient.findMany({
        where: { userId: req.userId },
        select: {
          id: true,
          userId: true,
          name: true,
          phone: true,
          email: true,
          cpf: true,
          birthDate: true,
          profession: true,
          marketingSource: true,
          cep: true,
          addressStreet: true,
          addressNumber: true,
          addressComplement: true,
          addressNeighborhood: true,
          addressCity: true,
          addressState: true,
          height: true,
          weight: true,
          notes: true,
          avatarUrl: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: finalLimit
      }),
      prisma.patient.count({
        where: { userId: req.userId }
      })
    ]);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout após 5 segundos')), 5000)
    );
    
    const [patients, total] = await Promise.race([queryPromise, timeoutPromise]) as [typeof patients, typeof total];

    const queryElapsed = Date.now() - queryStartTime;
    // #region agent log
    await debugLog({location:'patients.ts:65',message:'GET /patients query do banco concluída',data:{patientsCount:patients.length,total,queryElapsedMs:queryElapsed,limit:finalLimit,skip},hypothesisId:'A'});
    // #endregion

    const result = {
      data: patients.map(p => ({
        ...p,
        user_id: p.userId,
        clinicId: req.userId,
        avatarUrl: p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random`
      })),
      pagination: page !== undefined ? {
        page,
        limit: finalLimit,
        total,
        totalPages: Math.ceil(total / finalLimit)
      } : {
        total,
        limit: finalLimit,
        offset: skip
      }
    };

    // DESABILITAR CACHE TEMPORARIAMENTE - não cachear para evitar problemas
    // await cache.set(cacheKey, result, 300);

    const totalElapsed = Date.now() - startTime;
    // #region agent log
    await debugLog({location:'patients.ts:87',message:'GET /patients concluído',data:{totalElapsedMs:totalElapsed,returnedCount:result.data.length},hypothesisId:'A'});
    // #endregion

    res.json(result);
  } catch (error) {
    console.error('Erro get patients:', error);
    res.status(500).json({ error: 'Erro ao buscar pacientes' });
  }
});

// POST /api/patients
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;

    const patient = await prisma.patient.create({
      data: {
        userId: req.userId!,
        name: data.name || '',
        phone: data.phone || '',
        email: data.email,
        cpf: data.cpf,
        birthDate: data.birth_date || data.birthDate,
        profession: data.profession,
        marketingSource: data.marketing_source || data.marketingSource,
        cep: data.cep,
        addressStreet: data.address_street || data.addressStreet,
        addressNumber: data.address_number || data.addressNumber,
        addressComplement: data.address_complement || data.addressComplement,
        addressNeighborhood: data.address_neighborhood || data.addressNeighborhood,
        addressCity: data.address_city || data.addressCity,
        addressState: data.address_state || data.addressState,
        height: data.height,
        weight: data.weight,
        notes: data.notes,
        avatarUrl: data.avatar_url || data.avatarUrl
      }
    });

    // Invalidar cache após criar paciente
    await cache.invalidatePattern(`patients:${req.userId}*`);

    res.status(201).json({
      ...patient,
      user_id: patient.userId,
      clinicId: req.userId,
      avatarUrl: patient.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=random`
    });
  } catch (error) {
    console.error('Erro create patient:', error);
    res.status(500).json({ error: 'Erro ao criar paciente' });
  }
});

// PUT /api/patients/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    const patient = await prisma.patient.update({
      where: { id, userId: req.userId },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        cpf: data.cpf,
        birthDate: data.birth_date || data.birthDate,
        profession: data.profession,
        marketingSource: data.marketing_source || data.marketingSource,
        cep: data.cep,
        addressStreet: data.address_street || data.addressStreet,
        addressNumber: data.address_number || data.addressNumber,
        addressComplement: data.address_complement || data.addressComplement,
        addressNeighborhood: data.address_neighborhood || data.addressNeighborhood,
        addressCity: data.address_city || data.addressCity,
        addressState: data.address_state || data.addressState,
        height: data.height,
        weight: data.weight,
        notes: data.notes,
        avatarUrl: data.avatar_url || data.avatarUrl
      }
    });

    // Invalidar cache após atualizar paciente
    await cache.invalidatePattern(`patients:${req.userId}*`);

    res.json({
      ...patient,
      user_id: patient.userId,
      clinicId: req.userId,
      avatarUrl: patient.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=random`
    });
  } catch (error) {
    console.error('Erro update patient:', error);
    res.status(500).json({ error: 'Erro ao atualizar paciente' });
  }
});

// DELETE /api/patients/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.patient.delete({
      where: { id, userId: req.userId }
    });

    // Invalidar cache após deletar paciente
    await cache.invalidatePattern(`patients:${req.userId}*`);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro delete patient:', error);
    res.status(500).json({ error: 'Erro ao deletar paciente' });
  }
});

// GET /api/patients/birthdays - Busca pacientes com aniversário nos próximos 7 dias
router.get('/birthdays', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);

    // Buscar todos os pacientes do usuário que tenham data de nascimento
    const patients = await prisma.patient.findMany({
      where: { 
        userId: req.userId,
        birthDate: { not: null }
      }
    });

    const upcomingBirthdays: Array<{
      id: string;
      name: string;
      birth_date: string;
      daysUntil: number;
      user_id: string;
      clinicId: string;
      avatarUrl: string;
    }> = [];

    for (const patient of patients) {
      if (!patient.birthDate) continue;

      // Parse da data de nascimento (formato esperado: YYYY-MM-DD)
      const birthDateParts = patient.birthDate.split('-');
      if (birthDateParts.length !== 3) continue;

      const birthMonth = parseInt(birthDateParts[1], 10);
      const birthDay = parseInt(birthDateParts[2], 10);

      // Calcular o aniversário deste ano
      const thisYearBirthday = new Date(today.getFullYear(), birthMonth - 1, birthDay);
      thisYearBirthday.setHours(0, 0, 0, 0);

      // Se o aniversário já passou este ano, calcular para o próximo ano
      let nextBirthday = thisYearBirthday;
      if (thisYearBirthday < today) {
        nextBirthday = new Date(today.getFullYear() + 1, birthMonth - 1, birthDay);
        nextBirthday.setHours(0, 0, 0, 0);
      }

      // Verificar se está nos próximos 7 dias
      const daysUntil = Math.floor((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil >= 0 && daysUntil <= 7) {
        upcomingBirthdays.push({
          id: patient.id,
          name: patient.name,
          birth_date: patient.birthDate,
          daysUntil,
          user_id: patient.userId,
          clinicId: req.userId!,
          avatarUrl: patient.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=random`
        });
      }
    }

    // Ordenar por dias até o aniversário (mais próximo primeiro)
    upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);

    res.json(upcomingBirthdays);
  } catch (error) {
    console.error('Erro get birthdays:', error);
    res.status(500).json({ error: 'Erro ao buscar aniversariantes' });
  }
});

export default router;







