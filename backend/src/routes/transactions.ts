import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';
import { debugLog } from '../utils/debugLog.js';
import { canCreateTransaction, hasModuleAccess } from '../utils/planLimits.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// GET /api/transactions
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  // #region agent log
  await debugLog({location:'transactions.ts:11',message:'GET /transactions iniciado',data:{userId:req.userId,page:req.query.page,limit:req.query.limit,offset:req.query.offset},hypothesisId:'A'});
  // #endregion
  try {
    const userId = req.userId;
    // Suporte para ambos os formatos: page/limit e offset/limit
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    
    const finalLimit = Math.min(limit, 200);
    const skip = page !== undefined ? (page - 1) * finalLimit : (offset || 0);

    console.log(`[GET /transactions] Buscando transações para userId: ${userId}, page: ${page}, limit: ${finalLimit}, offset: ${skip}`);

    const queryStartTime = Date.now();
    
    // Adicionar timeout para evitar travamentos em conexões lentas (mobile)
    const queryPromise = Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        select: {
          id: true,
          userId: true,
          description: true,
          amount: true,
          type: true,
          category: true,
          date: true,
          patientName: true,
          paymentMethod: true,
          isPaid: true,
          tags: true
        },
        orderBy: { date: 'desc' },
        skip,
        take: finalLimit
      }),
      prisma.transaction.count({
        where: { userId }
      })
    ]);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout após 30 segundos')), 30000)
    );
    
    const [transactions, total] = await Promise.race([queryPromise, timeoutPromise]) as [Awaited<ReturnType<typeof prisma.transaction.findMany>>, number];

    const queryElapsed = Date.now() - queryStartTime;
    // #region agent log
    await debugLog({location:'transactions.ts:49',message:'GET /transactions query concluída',data:{transactionsCount:transactions.length,total,queryElapsedMs:queryElapsed,limit:finalLimit,skip},hypothesisId:'A'});
  // #endregion

    console.log(`[GET /transactions] Encontradas ${transactions.length} transações (total no banco: ${total}) para userId: ${userId}`);

    const response = {
      data: transactions.map(t => ({
        id: t.id,
        userId: t.userId,
        description: t.description,
        amount: Number(t.amount),
        type: t.type,
        category: t.category,
        date: Number(t.date),
        patientName: t.patientName,
        paymentMethod: t.paymentMethod,
        isPaid: t.isPaid,
        tags: t.tags || null // Garantir que tags seja string ou null
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
    
    // Log para debug: verificar tags nas transações
    const revenueTxs = response.data.filter(t => t.type === 'revenue');
    const revenueWithTags = revenueTxs.filter(t => t.tags);
    const revenueWithoutTags = revenueTxs.filter(t => !t.tags);
    
    // #region agent log
    console.log('========================================');
    console.log(`[GET /transactions] ANÁLISE DE TAGS`);
    console.log('========================================');
    console.log(`[GET /transactions] Total transações: ${response.data.length}`);
    console.log(`[GET /transactions] Receitas: ${revenueTxs.length}`);
    console.log(`[GET /transactions] Receitas COM tags: ${revenueWithTags.length}`);
    console.log(`[GET /transactions] Receitas SEM tags: ${revenueWithoutTags.length}`);
    console.log('========================================');
    // #endregion
    
    if (revenueWithTags.length > 0) {
      console.log(`[GET /transactions] ✅ Exemplo de tag:`, revenueWithTags[0].tags);
      console.log(`[GET /transactions] Primeiras 3 tags:`, revenueWithTags.slice(0, 3).map(t => t.tags));
    } else if (revenueTxs.length > 0) {
      console.log(`[GET /transactions] ❌ PROBLEMA CRÍTICO: ${revenueTxs.length} transações de receita mas NENHUMA tem tags!`);
      console.log(`[GET /transactions] Exemplo de transação sem tag:`, {
        description: revenueTxs[0].description,
        tags: revenueTxs[0].tags,
        tagsType: typeof revenueTxs[0].tags,
        tagsValue: revenueTxs[0].tags,
        tagsIsNull: revenueTxs[0].tags === null,
        tagsIsUndefined: revenueTxs[0].tags === undefined
      });
      
      // Verificar diretamente no banco
      const dbCheck = await prisma.transaction.findFirst({
        where: { userId, type: 'revenue' },
        select: { id: true, description: true, tags: true }
      });
      console.log(`[GET /transactions] Verificação direta no banco:`, {
        id: dbCheck?.id,
        description: dbCheck?.description,
        tags: dbCheck?.tags,
        tagsType: typeof dbCheck?.tags,
        tagsIsNull: dbCheck?.tags === null,
        tagsIsUndefined: dbCheck?.tags === undefined
      });
    }

    const totalElapsed = Date.now() - startTime;
    // #region agent log
    await debugLog({location:'transactions.ts:123',message:'GET /transactions concluído',data:{totalElapsedMs:totalElapsed,returnedCount:response.data.length},hypothesisId:'A'});
  // #endregion

    console.log(`[GET /transactions] Retornando ${response.data.length} transações`);
    res.json(response);
  } catch (error) {
    console.error('[GET /transactions] Erro get transactions:', error);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

// POST /api/transactions
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verificar se o módulo financeiro está disponível
    const hasFinanceAccess = await hasModuleAccess(req.userId!, 'finance');
    if (!hasFinanceAccess) {
      res.status(403).json({ 
        error: 'Módulo financeiro não está disponível no seu plano. Faça upgrade para acessar esta funcionalidade.'
      });
      return;
    }

    // Verificar limitações do plano
    const limitCheck = await canCreateTransaction(req.userId!);
    if (!limitCheck.allowed) {
      res.status(403).json({ 
        error: `Limite de transações mensais atingido. Seu plano permite ${limitCheck.limit} transações por mês e você já possui ${limitCheck.current}. Faça upgrade para aumentar o limite.`,
        limit: limitCheck.limit,
        current: limitCheck.current
      });
      return;
    }

    const { description, amount, type, category, date, patientName, paymentMethod, isPaid, tags } = req.body;

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.userId!,
        description,
        amount,
        type,
        category: category || 'Geral',
        date: BigInt(date),
        patientName,
        paymentMethod,
        isPaid: isPaid ?? true,
        tags
      }
    });

    res.status(201).json({
      id: transaction.id,
      userId: transaction.userId,
      description: transaction.description,
      amount: Number(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      date: Number(transaction.date),
      patientName: transaction.patientName,
      paymentMethod: transaction.paymentMethod,
      isPaid: transaction.isPaid,
      tags: transaction.tags
    });
  } catch (error) {
    console.error('Erro create transaction:', error);
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

// POST /api/transactions/bulk
router.post('/bulk', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { transactions } = req.body;

    await prisma.transaction.createMany({
      data: transactions.map((t: any) => ({
        userId: req.userId!,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category || 'Geral',
        date: BigInt(t.date),
        patientName: t.patientName,
        paymentMethod: t.paymentMethod,
        isPaid: t.isPaid ?? true,
        tags: t.tags
      }))
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erro bulk create:', error);
    res.status(500).json({ error: 'Erro ao importar transações' });
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { description, amount, type, category, date, patientName, paymentMethod, isPaid, tags } = req.body;

    const transaction = await prisma.transaction.update({
      where: { id, userId: req.userId },
      data: {
        description,
        amount,
        type,
        category,
        date: date ? BigInt(date) : undefined,
        patientName,
        paymentMethod,
        isPaid,
        tags
      }
    });

    res.json({
      id: transaction.id,
      userId: transaction.userId,
      description: transaction.description,
      amount: Number(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      date: Number(transaction.date),
      patientName: transaction.patientName,
      paymentMethod: transaction.paymentMethod,
      isPaid: transaction.isPaid,
      tags: transaction.tags
    });
  } catch (error) {
    console.error('Erro update transaction:', error);
    res.status(500).json({ error: 'Erro ao atualizar transação' });
  }
});

// DELETE /api/transactions/reset-all - Deleta TODOS os dados da clínica (exceto User e Subscription)
// IMPORTANTE: Esta rota deve vir ANTES da rota /:id para evitar que "reset-all" seja interpretado como um ID
router.delete('/reset-all', async (req: AuthRequest, res: Response): Promise<void> => {
  const deleteStartTime = Date.now();
  // #region agent log
  await debugLog({location:'transactions.ts:238',message:'DELETE /reset-all iniciado',data:{userId:req.userId},hypothesisId:'B'});
  // #endregion
  console.log('[DELETE /reset-all] ========== ROTA RESET-ALL CHAMADA ==========');
  console.log('[DELETE /reset-all] URL:', req.url);
  console.log('[DELETE /reset-all] Path:', req.path);
  console.log('[DELETE /reset-all] Params:', req.params);
  
  try {
    const userId = req.userId;
    
    if (!userId) {
      console.error('[DELETE /reset-all] Erro: userId não encontrado na requisição');
      res.status(401).json({ 
        error: 'Usuário não autenticado', 
        details: 'userId não encontrado na requisição'
      });
      return;
    }
    
    console.log(`[DELETE /reset-all] Iniciando deleção de todos os dados para userId: ${userId}`);
    
    // Primeiro, verificar quantos registros existem para este userId
    console.log('[DELETE /reset-all] Verificando quantidades de registros antes da deleção...');
    let beforeCounts: any = {};
    try {
      // Buscar IDs dos membros de fidelidade uma vez para reutilizar
      const loyaltyMemberIds = (await prisma.loyaltyMember.findMany({ 
        where: { userId }, 
        select: { id: true } 
      })).map(m => m.id);
      
      beforeCounts = {
        transactions: await prisma.transaction.count({ where: { userId } }),
        patients: await prisma.patient.count({ where: { userId } }),
        staff: await prisma.staff.count({ where: { userId } }),
        appointments: await prisma.appointment.count({ where: { userId } }),
        quotes: await prisma.quote.count({ where: { userId } }),
        prescriptions: await prisma.prescription.count({ where: { userId } }),
        inventoryProducts: await prisma.inventoryProduct.count({ where: { userId } }),
        categories: await prisma.category.count({ where: { userId } }),
        monthlyTargets: await prisma.monthlyTarget.count({ where: { userId } }),
        chatMessages: await prisma.chatMessage.count({ where: { userId } }),
        chatThreads: await prisma.chatThread.count({ where: { userId } }),
        stockAlerts: await prisma.stockAlert.count({ where: { userId } }),
        loyaltyRedemptions: loyaltyMemberIds.length > 0 
          ? await prisma.loyaltyRedemption.count({ where: { memberId: { in: loyaltyMemberIds } } }) 
          : 0,
        loyaltyPointsHistory: loyaltyMemberIds.length > 0 
          ? await prisma.loyaltyPointsHistory.count({ where: { memberId: { in: loyaltyMemberIds } } }) 
          : 0,
        loyaltyReferrals: loyaltyMemberIds.length > 0 
          ? await prisma.loyaltyReferral.count({ where: { referrerId: { in: loyaltyMemberIds } } }) 
          : 0,
        loyaltyMembers: await prisma.loyaltyMember.count({ where: { userId } }),
        loyaltyRewards: await prisma.loyaltyReward.count({ where: { userId } }),
      };
      console.log('[DELETE /reset-all] Contagens antes da deleção:', JSON.stringify(beforeCounts, null, 2));
    } catch (countError: any) {
      console.error('[DELETE /reset-all] Erro ao contar registros:', countError);
      throw new Error(`Erro ao contar registros antes da deleção: ${countError?.message || 'Erro desconhecido'}`);
    }
    
    const transactionStartTime = Date.now();
    // #region agent log
    await debugLog({location:'transactions.ts:300',message:'DELETE /reset-all: Iniciando transação de deleção',data:{userId,beforeCounts},hypothesisId:'B'});
    // #endregion
    
    // Usar transação para garantir atomicidade
    await prisma.$transaction(async (tx) => {
      // Ordem de deleção respeitando foreign keys
      // Deletar primeiro as tabelas filhas (que referenciam outras)
      
      try {
        // Ordem de deleção respeitando foreign keys e constraints
        // Tabelas que não dependem de outras (podem ser deletadas primeiro)
        
        // 1. Chat Messages
        console.log('[DELETE /reset-all] Deletando Chat Messages...');
        const chatMessagesCount = await tx.chatMessage.deleteMany({ where: { userId } });
        console.log(`[DELETE /reset-all] ${chatMessagesCount.count} Chat Messages deletados (esperado: ${beforeCounts.chatMessages})`);
        
        // 2. Chat Threads
        console.log('[DELETE /reset-all] Deletando Chat Threads...');
        const chatThreadsCount = await tx.chatThread.deleteMany({ where: { userId } });
        console.log(`[DELETE /reset-all] ${chatThreadsCount.count} Chat Threads deletados (esperado: ${beforeCounts.chatThreads})`);
        
        // 3. Stock Alerts (não tem FK para InventoryProduct, pode deletar antes)
        console.log('[DELETE /reset-all] Deletando Stock Alerts...');
        const stockAlertsCount = await tx.stockAlert.deleteMany({ where: { userId } });
        console.log(`[DELETE /reset-all] ${stockAlertsCount.count} Stock Alerts deletados (esperado: ${beforeCounts.stockAlerts})`);
        
        // 4. Inventory Products (deletar isso vai cascadear ProductProcedures e StockMovements automaticamente)
        console.log('[DELETE /reset-all] Deletando Inventory Products (cascadeará ProductProcedures e StockMovements)...');
        const inventoryProductsCount = await tx.inventoryProduct.deleteMany({ where: { userId } });
        console.log(`[DELETE /reset-all] ${inventoryProductsCount.count} Inventory Products deletados (esperado: ${beforeCounts.inventoryProducts})`);
        
        // 5. Prescriptions
        console.log('[DELETE /reset-all] Deletando Prescriptions...');
        const prescriptionsCount = await tx.prescription.deleteMany({ where: { userId } });
        console.log(`[DELETE /reset-all] ${prescriptionsCount.count} Prescriptions deletados (esperado: ${beforeCounts.prescriptions})`);
        
        // 6. Quotes (tem patientId com SetNull, então pode deletar antes de pacientes)
        console.log('[DELETE /reset-all] Deletando Quotes...');
        const quotesCount = await tx.quote.deleteMany({ where: { userId } });
        console.log(`[DELETE /reset-all] ${quotesCount.count} Quotes deletados (esperado: ${beforeCounts.quotes})`);
        
        // 7. Appointments (tem patientId e staffId com SetNull)
        console.log('[DELETE /reset-all] Deletando Appointments...');
        const appointmentsCount = await tx.appointment.deleteMany({ where: { userId } });
        console.log(`[DELETE /reset-all] ${appointmentsCount.count} Appointments deletados (esperado: ${beforeCounts.appointments})`);
        
        // 8. Patients
        console.log('[DELETE /reset-all] Deletando Patients...');
        const patientsCount = await tx.patient.deleteMany({ where: { userId } });
        console.log(`[DELETE /reset-all] ${patientsCount.count} Patients deletados (esperado: ${beforeCounts.patients})`);
        
        // 9. Staff
        console.log('[DELETE /reset-all] Deletando Staff...');
        const staffCount = await tx.staff.deleteMany({ where: { userId } });
        console.log(`[DELETE /reset-all] ${staffCount.count} Staff deletados (esperado: ${beforeCounts.staff})`);
        
        // 10. Programa de Fidelidade (deletar na ordem correta de dependências)
        // Primeiro, buscar os IDs dos membros para deletar registros relacionados
        const loyaltyMemberIds = await tx.loyaltyMember.findMany({
          where: { userId },
          select: { id: true }
        });
        const memberIds = loyaltyMemberIds.map(m => m.id);
        
        if (memberIds.length > 0) {
          console.log('[DELETE /reset-all] Deletando Loyalty Redemptions...');
          const loyaltyRedemptionsCount = await tx.loyaltyRedemption.deleteMany({ 
            where: { memberId: { in: memberIds } } 
          });
          console.log(`[DELETE /reset-all] ${loyaltyRedemptionsCount.count} Loyalty Redemptions deletados (esperado: ${beforeCounts.loyaltyRedemptions})`);
          
          console.log('[DELETE /reset-all] Deletando Loyalty Points History...');
          const loyaltyPointsHistoryCount = await tx.loyaltyPointsHistory.deleteMany({ 
            where: { memberId: { in: memberIds } } 
          });
          console.log(`[DELETE /reset-all] ${loyaltyPointsHistoryCount.count} Loyalty Points History deletados (esperado: ${beforeCounts.loyaltyPointsHistory})`);
          
          console.log('[DELETE /reset-all] Deletando Loyalty Referrals...');
          const loyaltyReferralsCount = await tx.loyaltyReferral.deleteMany({ 
            where: { referrerId: { in: memberIds } } 
          });
          console.log(`[DELETE /reset-all] ${loyaltyReferralsCount.count} Loyalty Referrals deletados (esperado: ${beforeCounts.loyaltyReferrals})`);
        } else {
          console.log('[DELETE /reset-all] Nenhum Loyalty Member encontrado, pulando deleções relacionadas');
        }
        
        console.log('[DELETE /reset-all] Deletando Loyalty Members...');
        const loyaltyMembersCount = await tx.loyaltyMember.deleteMany({ where: { userId } });
        console.log(`[DELETE /reset-all] ${loyaltyMembersCount.count} Loyalty Members deletados (esperado: ${beforeCounts.loyaltyMembers})`);
        
        console.log('[DELETE /reset-all] Deletando Loyalty Rewards...');
        const loyaltyRewardsCount = await tx.loyaltyReward.deleteMany({ where: { userId } });
        console.log(`[DELETE /reset-all] ${loyaltyRewardsCount.count} Loyalty Rewards deletados (esperado: ${beforeCounts.loyaltyRewards})`);
        
        // 11. Transactions
        console.log('[DELETE /reset-all] Deletando Transactions...');
        const transactionsCount = await tx.transaction.deleteMany({ where: { userId } });
        console.log(`[DELETE /reset-all] ${transactionsCount.count} Transactions deletados (esperado: ${beforeCounts.transactions})`);
        
        // 12. Monthly Targets
        console.log('[DELETE /reset-all] Deletando Monthly Targets...');
        const monthlyTargetsCount = await tx.monthlyTarget.deleteMany({ where: { userId } });
        console.log(`[DELETE /reset-all] ${monthlyTargetsCount.count} Monthly Targets deletados (esperado: ${beforeCounts.monthlyTargets})`);
        
        // 13. Categories personalizadas
        console.log('[DELETE /reset-all] Deletando Categories...');
        const categoriesCount = await tx.category.deleteMany({ where: { userId } });
        console.log(`[DELETE /reset-all] ${categoriesCount.count} Categories deletados (esperado: ${beforeCounts.categories})`);
        
        // Verificar se todas as deleções foram bem-sucedidas
        const afterCounts = {
          transactions: await tx.transaction.count({ where: { userId } }),
          patients: await tx.patient.count({ where: { userId } }),
          staff: await tx.staff.count({ where: { userId } }),
          appointments: await tx.appointment.count({ where: { userId } }),
          quotes: await tx.quote.count({ where: { userId } }),
          prescriptions: await tx.prescription.count({ where: { userId } }),
          inventoryProducts: await tx.inventoryProduct.count({ where: { userId } }),
          categories: await tx.category.count({ where: { userId } }),
          monthlyTargets: await tx.monthlyTarget.count({ where: { userId } }),
          chatMessages: await tx.chatMessage.count({ where: { userId } }),
          chatThreads: await tx.chatThread.count({ where: { userId } }),
          stockAlerts: await tx.stockAlert.count({ where: { userId } }),
          loyaltyRedemptions: await (async () => {
            const memberIds = (await tx.loyaltyMember.findMany({ where: { userId }, select: { id: true } })).map(m => m.id);
            return memberIds.length > 0 ? await tx.loyaltyRedemption.count({ where: { memberId: { in: memberIds } } }) : 0;
          })(),
          loyaltyPointsHistory: await (async () => {
            const memberIds = (await tx.loyaltyMember.findMany({ where: { userId }, select: { id: true } })).map(m => m.id);
            return memberIds.length > 0 ? await tx.loyaltyPointsHistory.count({ where: { memberId: { in: memberIds } } }) : 0;
          })(),
          loyaltyReferrals: await (async () => {
            const memberIds = (await tx.loyaltyMember.findMany({ where: { userId }, select: { id: true } })).map(m => m.id);
            return memberIds.length > 0 ? await tx.loyaltyReferral.count({ where: { referrerId: { in: memberIds } } }) : 0;
          })(),
          loyaltyMembers: await tx.loyaltyMember.count({ where: { userId } }),
          loyaltyRewards: await tx.loyaltyReward.count({ where: { userId } }),
        };
        console.log('[DELETE /reset-all] Contagens após a deleção:', JSON.stringify(afterCounts, null, 2));
        
        // Verificar se há registros restantes
        const remainingRecords = Object.entries(afterCounts).filter(([_, count]) => count > 0);
        if (remainingRecords.length > 0) {
          console.warn('[DELETE /reset-all] ⚠️ Ainda existem registros após a deleção:', remainingRecords);
        }
        
        const transactionElapsed = Date.now() - transactionStartTime;
        // #region agent log
        await debugLog({location:'transactions.ts:443',message:'DELETE /reset-all: Transação de deleção concluída',data:{transactionElapsedMs:transactionElapsed,afterCounts},hypothesisId:'B'});
        // #endregion
        console.log('[DELETE /reset-all] ✅ Todas as deleções concluídas com sucesso');
      } catch (stepError: any) {
        console.error('[DELETE /reset-all] Erro em uma etapa específica:', stepError);
        console.error('[DELETE /reset-all] Error name:', stepError?.name);
        console.error('[DELETE /reset-all] Error code:', stepError?.code);
        console.error('[DELETE /reset-all] Error meta:', JSON.stringify(stepError?.meta, null, 2));
        throw stepError;
      }
    }, {
      timeout: 60000, // Aumentar timeout para 60 segundos
    });

    // Verificar contagens finais para confirmar
    const finalCounts = {
      transactions: await prisma.transaction.count({ where: { userId } }),
      patients: await prisma.patient.count({ where: { userId } }),
      staff: await prisma.staff.count({ where: { userId } }),
      appointments: await prisma.appointment.count({ where: { userId } }),
      quotes: await prisma.quote.count({ where: { userId } }),
      prescriptions: await prisma.prescription.count({ where: { userId } }),
      inventoryProducts: await prisma.inventoryProduct.count({ where: { userId } }),
      categories: await prisma.category.count({ where: { userId } }),
      monthlyTargets: await prisma.monthlyTarget.count({ where: { userId } }),
      chatMessages: await prisma.chatMessage.count({ where: { userId } }),
      chatThreads: await prisma.chatThread.count({ where: { userId } }),
      stockAlerts: await prisma.stockAlert.count({ where: { userId } }),
      loyaltyRedemptions: await (async () => {
        const memberIds = (await prisma.loyaltyMember.findMany({ where: { userId }, select: { id: true } })).map(m => m.id);
        return memberIds.length > 0 ? await prisma.loyaltyRedemption.count({ where: { memberId: { in: memberIds } } }) : 0;
      })(),
      loyaltyPointsHistory: await (async () => {
        const memberIds = (await prisma.loyaltyMember.findMany({ where: { userId }, select: { id: true } })).map(m => m.id);
        return memberIds.length > 0 ? await prisma.loyaltyPointsHistory.count({ where: { memberId: { in: memberIds } } }) : 0;
      })(),
      loyaltyReferrals: await (async () => {
        const memberIds = (await prisma.loyaltyMember.findMany({ where: { userId }, select: { id: true } })).map(m => m.id);
        return memberIds.length > 0 ? await prisma.loyaltyReferral.count({ where: { referrerId: { in: memberIds } } }) : 0;
      })(),
      loyaltyMembers: await prisma.loyaltyMember.count({ where: { userId } }),
      loyaltyRewards: await prisma.loyaltyReward.count({ where: { userId } }),
    };
    
    const deletedCounts = {
      transactions: beforeCounts.transactions - finalCounts.transactions,
      patients: beforeCounts.patients - finalCounts.patients,
      staff: beforeCounts.staff - finalCounts.staff,
      appointments: beforeCounts.appointments - finalCounts.appointments,
      quotes: beforeCounts.quotes - finalCounts.quotes,
      prescriptions: beforeCounts.prescriptions - finalCounts.prescriptions,
      inventoryProducts: beforeCounts.inventoryProducts - finalCounts.inventoryProducts,
      categories: beforeCounts.categories - finalCounts.categories,
      monthlyTargets: beforeCounts.monthlyTargets - finalCounts.monthlyTargets,
      chatMessages: beforeCounts.chatMessages - finalCounts.chatMessages,
      chatThreads: beforeCounts.chatThreads - finalCounts.chatThreads,
      stockAlerts: beforeCounts.stockAlerts - finalCounts.stockAlerts,
      loyaltyRedemptions: beforeCounts.loyaltyRedemptions - finalCounts.loyaltyRedemptions,
      loyaltyPointsHistory: beforeCounts.loyaltyPointsHistory - finalCounts.loyaltyPointsHistory,
      loyaltyReferrals: beforeCounts.loyaltyReferrals - finalCounts.loyaltyReferrals,
      loyaltyMembers: beforeCounts.loyaltyMembers - finalCounts.loyaltyMembers,
      loyaltyRewards: beforeCounts.loyaltyRewards - finalCounts.loyaltyRewards,
    };
    
    const totalElapsed = Date.now() - deleteStartTime;
    // #region agent log
    await debugLog({location:'transactions.ts:512',message:'DELETE /reset-all: Concluído',data:{totalElapsedMs:totalElapsed,deletedCounts,finalCounts},hypothesisId:'B'});
    // #endregion

    console.log('[DELETE /reset-all] Resumo final:', {
      userId,
      antes: beforeCounts,
      depois: finalCounts,
      deletados: deletedCounts,
      tempoTotal: `${totalElapsed}ms`
    });

    res.json({ 
      success: true, 
      message: 'Todos os dados da clínica foram deletados com sucesso',
      deleted: deletedCounts,
      remaining: finalCounts
    });
  } catch (error: any) {
    console.error('[DELETE /reset-all] ========== ERRO CAPTURADO ==========');
    console.error('[DELETE /reset-all] Erro ao resetar todos os dados:', error);
    console.error('[DELETE /reset-all] Tipo do erro:', typeof error);
    console.error('[DELETE /reset-all] É instância de Error?', error instanceof Error);
    console.error('[DELETE /reset-all] Stack trace completo:', error?.stack);
    console.error('[DELETE /reset-all] Error code:', error?.code);
    console.error('[DELETE /reset-all] Error meta:', JSON.stringify(error?.meta, null, 2));
    console.error('[DELETE /reset-all] Error message:', error?.message);
    console.error('[DELETE /reset-all] Error name:', error?.name);
    console.error('[DELETE /reset-all] Error response:', error?.response);
    console.error('[DELETE /reset-all] ====================================');
    
    // Mensagem de erro mais detalhada
    let errorMessage = 'Erro desconhecido ao deletar todos os dados da clínica';
    if (error?.code === 'P2003') {
      errorMessage = `Erro de integridade referencial: ${error?.meta?.field_name || 'campo desconhecido'}. Algum registro está sendo referenciado por outro.`;
    } else if (error?.code === 'P2025') {
      errorMessage = 'Registro não encontrado para deleção.';
    } else if (error?.code === 'P2034') {
      errorMessage = 'Transação falhou devido a uma condição de corrida ou conflito. Tente novamente.';
    } else if (error?.code === 'P2014') {
      errorMessage = `Erro de constraint: ${error?.meta?.target || 'constraint desconhecida'}`;
    } else if (error?.message && !error.message.includes('Erro ao deletar transação')) {
      // Só usar a mensagem do erro se não for a mensagem genérica da rota errada
      errorMessage = error.message;
    }
    
    // Garantir que a mensagem de erro seja específica para reset-all
    const finalErrorMessage = errorMessage.includes('deletar transação') 
      ? 'Erro ao deletar todos os dados da clínica. Verifique os logs do servidor para mais detalhes.'
      : errorMessage;
    
    res.status(500).json({ 
      error: 'Erro ao deletar todos os dados', 
      details: finalErrorMessage,
      code: error?.code || 'UNKNOWN_ERROR',
      // Incluir informações adicionais apenas em desenvolvimento
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          name: error?.name,
          message: error?.message,
          meta: error?.meta,
          stack: error?.stack?.split('\n').slice(0, 10) // Primeiras 10 linhas do stack
        }
      })
    });
  }
});

// POST /api/transactions/seed (dados de exemplo COMPLETOS)
router.post('/seed', async (req: AuthRequest, res: Response): Promise<void> => {
  const seedStartTime = Date.now();
  // #region agent log
  await debugLog({location:'transactions.ts:569',message:'POST /seed iniciado',data:{userId:req.userId},hypothesisId:'B'});
  // #endregion
  try {
    const userId = req.userId!;
    
    // #region agent log
    console.log('========================================');
    console.log('🌱 [SEED] INICIANDO GERAÇÃO DE DADOS FICTÍCIOS');
    console.log('========================================');
    console.log(`[SEED] UserId: ${userId}`);
    console.log(`[SEED] Timestamp: ${new Date().toISOString()}`);
    // #endregion
    
    // ============================================
    // PRIMEIRO: LIMPAR TODOS OS DADOS EXISTENTES
    // ============================================
    console.log('🧹 [SEED] Limpando dados existentes...');
    const deleteStartTime = Date.now();
    // #region agent log
    await debugLog({location:'transactions.ts:584',message:'SEED: Iniciando deleção de dados',data:{userId},hypothesisId:'B'});
    // #endregion
    
    // Usar transação para garantir atomicidade
    await prisma.$transaction(async (tx) => {
      // Ordem de deleção respeitando foreign keys
      await tx.chatMessage.deleteMany({ where: { userId } });
      await tx.chatThread.deleteMany({ where: { userId } });
      await tx.stockAlert.deleteMany({ where: { userId } });
      await tx.stockMovement.deleteMany({ where: { userId } });
      await tx.inventoryProduct.deleteMany({ where: { userId } });
      await tx.prescription.deleteMany({ where: { userId } });
      await tx.quote.deleteMany({ where: { userId } });
      await tx.appointment.deleteMany({ where: { userId } });
      await tx.patient.deleteMany({ where: { userId } });
      await tx.staff.deleteMany({ where: { userId } });
      await tx.transaction.deleteMany({ where: { userId } });
      await tx.monthlyTarget.deleteMany({ where: { userId } });
      await tx.category.deleteMany({ where: { userId } });
      await tx.loyaltyRedemption.deleteMany({ where: { member: { userId } } });
      await tx.loyaltyPointsHistory.deleteMany({ where: { member: { userId } } });
      await tx.loyaltyReferral.deleteMany({ where: { referrer: { userId } } });
      await tx.loyaltyMember.deleteMany({ where: { userId } });
      await tx.loyaltyReward.deleteMany({ where: { userId } });
    }, {
      timeout: 120000, // 120 segundos de timeout (2 minutos) para operações grandes
    });
    
    const deleteElapsed = Date.now() - deleteStartTime;
    // #region agent log
    await debugLog({location:'transactions.ts:611',message:'SEED: Deleção concluída',data:{deleteElapsedMs:deleteElapsed},hypothesisId:'B'});
    // #endregion
    
    console.log('✅ [SEED] Dados limpos, iniciando criação de novos dados...');
    
    // ============================================
    // AGORA: CRIAR DADOS COMPLETOS
    // ============================================
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // #region agent log
    console.log(`[SEED] Data atual: ${now.toISOString()}`);
    console.log(`[SEED] Mês atual: ${currentMonth + 1}/${currentYear}`);
    // #endregion

    // ============================================
    // 1. CRIAR COLABORADORES (STAFF)
    // ============================================
    const staffData = [
      { userId, name: 'Dra. Marina Santos', role: 'Médica Dermatologista', color: '#8B5CF6', commissionRate: 40, phone: '(11) 99876-5432' },
      { userId, name: 'Dr. Ricardo Almeida', role: 'Cirurgião Plástico', color: '#10B981', commissionRate: 45, phone: '(11) 99765-4321' },
      { userId, name: 'Amanda Costa', role: 'Esteticista', color: '#F59E0B', commissionRate: 25, phone: '(11) 99654-3210' },
      { userId, name: 'Juliana Ferreira', role: 'Biomédica', color: '#EC4899', commissionRate: 30, phone: '(11) 99543-2109' },
      { userId, name: 'Carla Souza', role: 'Recepcionista', color: '#06B6D4', commissionRate: 0, phone: '(11) 99432-1098' },
    ];

    const createdStaff = await prisma.staff.createManyAndReturn({ data: staffData });
    
    // Log para debug: verificar IDs dos staff criados
    console.log('========================================');
    console.log(`[SEED] ✅ Staff criados: ${createdStaff.length} profissionais`);
    console.log('========================================');
    createdStaff.forEach((s, idx) => {
      console.log(`[SEED] Staff ${idx + 1}: ID=${s.id}, Nome=${s.name}, Comissão=${Number(s.commissionRate)}%`);
    });

    // ============================================
    // 2. CRIAR PACIENTES
    // ============================================
    const patientNames = [
      { name: 'Fernanda Oliveira', phone: '(11) 98765-4321', email: 'fernanda@email.com', profession: 'Advogada', birthDate: '1985-03-15', marketingSource: 'Instagram' },
      { name: 'Camila Rodrigues', phone: '(11) 97654-3210', email: 'camila@email.com', profession: 'Médica', birthDate: '1990-07-22', marketingSource: 'Indicação' },
      { name: 'Patrícia Lima', phone: '(11) 96543-2109', email: 'patricia@email.com', profession: 'Empresária', birthDate: '1982-11-08', marketingSource: 'Google' },
      { name: 'Ana Carolina Mendes', phone: '(11) 95432-1098', email: 'anacarolina@email.com', profession: 'Arquiteta', birthDate: '1988-05-30', marketingSource: 'Instagram' },
      { name: 'Beatriz Santos', phone: '(11) 94321-0987', email: 'beatriz@email.com', profession: 'Designer', birthDate: '1995-09-12', marketingSource: 'TikTok' },
      { name: 'Larissa Costa', phone: '(11) 93210-9876', email: 'larissa@email.com', profession: 'Dentista', birthDate: '1987-01-25', marketingSource: 'Indicação' },
      { name: 'Mariana Alves', phone: '(11) 92109-8765', email: 'mariana@email.com', profession: 'Psicóloga', birthDate: '1992-04-18', marketingSource: 'Facebook' },
      { name: 'Gabriela Nunes', phone: '(11) 91098-7654', email: 'gabriela@email.com', profession: 'Jornalista', birthDate: '1989-08-07', marketingSource: 'Instagram' },
      { name: 'Renata Pereira', phone: '(11) 90987-6543', email: 'renata@email.com', profession: 'Contadora', birthDate: '1983-12-03', marketingSource: 'Google' },
      { name: 'Isabela Martins', phone: '(11) 89876-5432', email: 'isabela@email.com', profession: 'Engenheira', birthDate: '1991-06-20', marketingSource: 'Indicação' },
      { name: 'Carolina Fernandes', phone: '(11) 88765-4321', email: 'carolina@email.com', profession: 'Nutricionista', birthDate: '1986-02-14', marketingSource: 'Instagram' },
      { name: 'Juliana Ribeiro', phone: '(11) 87654-3210', email: 'juliana.r@email.com', profession: 'Fisioterapeuta', birthDate: '1993-10-28', marketingSource: 'TikTok' },
    ];

    const createdPatients = await prisma.patient.createManyAndReturn({
      data: patientNames.map(p => ({ userId, ...p }))
    });

    // ============================================
    // 3. CRIAR AGENDAMENTOS (APPOINTMENTS)
    // ============================================
    const procedures = [
      { name: 'Botox 3 Áreas', duration: 30 },
      { name: 'Preenchimento Labial', duration: 45 },
      { name: 'Bioestimulador de Colágeno', duration: 60 },
      { name: 'Limpeza de Pele', duration: 60 },
      { name: 'Peeling Químico', duration: 45 },
      { name: 'Harmonização Facial', duration: 90 },
      { name: 'Sculptra', duration: 60 },
      { name: 'Skinbooster', duration: 30 },
      { name: 'Fios de PDO', duration: 60 },
      { name: 'Microagulhamento', duration: 45 },
    ];

    const appointments: any[] = [];
    const today = new Date(currentYear, currentMonth, now.getDate());
    
    // Criar agendamentos para os próximos 14 dias
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const appointmentDate = new Date(today);
      appointmentDate.setDate(today.getDate() + dayOffset);
      
      // Pular domingos
      if (appointmentDate.getDay() === 0) continue;
      
      // 3-6 agendamentos por dia
      const appointmentsPerDay = 3 + Math.floor(Math.random() * 4);
      
      for (let i = 0; i < appointmentsPerDay; i++) {
        const hour = 8 + Math.floor(Math.random() * 10); // 8h às 18h
        const minute = Math.random() > 0.5 ? 0 : 30;
        
        const procedure = procedures[Math.floor(Math.random() * procedures.length)];
        const patient = createdPatients[Math.floor(Math.random() * createdPatients.length)];
        const staff = createdStaff[Math.floor(Math.random() * (createdStaff.length - 1))]; // Exclui recepcionista
        
        const startTime = new Date(appointmentDate);
        startTime.setHours(hour, minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + procedure.duration);
        
        // Status variado
        let status: 'scheduled' | 'confirmed' | 'completed' | 'canceled' = 'scheduled';
        if (dayOffset < 0) status = 'completed';
        else if (dayOffset === 0 && hour < now.getHours()) status = 'completed';
        else if (Math.random() > 0.8) status = 'confirmed';
        else if (Math.random() > 0.95) status = 'canceled';
        
        appointments.push({
          userId,
          patientId: patient.id,
          patientName: patient.name,
          staffId: staff.id,
          startTime: BigInt(startTime.getTime()),
          endTime: BigInt(endTime.getTime()),
          serviceName: procedure.name,
          status,
          notes: Math.random() > 0.7 ? 'Paciente com alergia a lidocaína' : null,
        });
      }
    }

    // Também criar agendamentos passados (últimos 7 dias)
    for (let dayOffset = -7; dayOffset < 0; dayOffset++) {
      const appointmentDate = new Date(today);
      appointmentDate.setDate(today.getDate() + dayOffset);
      
      if (appointmentDate.getDay() === 0) continue;
      
      const appointmentsPerDay = 4 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < appointmentsPerDay; i++) {
        const hour = 8 + Math.floor(Math.random() * 10);
        const minute = Math.random() > 0.5 ? 0 : 30;
        
        const procedure = procedures[Math.floor(Math.random() * procedures.length)];
        const patient = createdPatients[Math.floor(Math.random() * createdPatients.length)];
        const staff = createdStaff[Math.floor(Math.random() * (createdStaff.length - 1))];
        
        const startTime = new Date(appointmentDate);
        startTime.setHours(hour, minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + procedure.duration);
        
        appointments.push({
          userId,
          patientId: patient.id,
          patientName: patient.name,
          staffId: staff.id,
          startTime: BigInt(startTime.getTime()),
          endTime: BigInt(endTime.getTime()),
          serviceName: procedure.name,
          status: Math.random() > 0.1 ? 'completed' : 'canceled',
          notes: null,
        });
      }
    }

    await prisma.appointment.createMany({ data: appointments });

    // ============================================
    // 4. CRIAR TRANSAÇÕES FINANCEIRAS (EXPANDIDAS)
    // ============================================
    const revenueTransactions = [
      { description: 'Botox Full Face', amount: 2400.00, category: 'Procedimentos', paymentMethod: 'credit' },
      { description: 'Preenchimento Labial', amount: 1800.00, category: 'Procedimentos', paymentMethod: 'pix' },
      { description: 'Protocolo Glúteo Max', amount: 3500.00, category: 'Procedimentos', paymentMethod: 'credit' },
      { description: 'Bioestimulador Sculptra', amount: 4200.00, category: 'Procedimentos', paymentMethod: 'credit' },
      { description: 'Harmonização Facial', amount: 5800.00, category: 'Procedimentos', paymentMethod: 'pix' },
      { description: 'Skinbooster', amount: 1200.00, category: 'Procedimentos', paymentMethod: 'debit' },
      { description: 'Fios de PDO', amount: 2800.00, category: 'Procedimentos', paymentMethod: 'credit' },
      { description: 'Peeling Químico', amount: 450.00, category: 'Procedimentos', paymentMethod: 'pix' },
      { description: 'Limpeza de Pele Premium', amount: 280.00, category: 'Procedimentos', paymentMethod: 'debit' },
      { description: 'Microagulhamento', amount: 650.00, category: 'Procedimentos', paymentMethod: 'pix' },
      { description: 'Consulta Avaliação', amount: 350.00, category: 'Consultas', paymentMethod: 'pix' },
      { description: 'Retorno Pós-Procedimento', amount: 0.00, category: 'Consultas', paymentMethod: 'pix' },
      { description: 'Venda Protetor Solar', amount: 180.00, category: 'Produtos', paymentMethod: 'credit' },
      { description: 'Kit Home Care', amount: 450.00, category: 'Produtos', paymentMethod: 'credit' },
    ];

    const expenseTransactions = [
      { description: 'Compra Toxina Botulínica', amount: 4500.00, category: 'Insumos' },
      { description: 'Ácido Hialurônico (Caixa)', amount: 3200.00, category: 'Insumos' },
      { description: 'Sculptra 2 frascos', amount: 2800.00, category: 'Insumos' },
      { description: 'Material Descartável', amount: 850.00, category: 'Insumos' },
      { description: 'Fios PDO (Kit)', amount: 1200.00, category: 'Insumos' },
      { description: 'Anestésicos Tópicos', amount: 320.00, category: 'Insumos' },
      { description: 'Aluguel Unidade', amount: 5500.00, category: 'Aluguel' },
      { description: 'Condomínio', amount: 850.00, category: 'Aluguel' },
      { description: 'IPTU (Parcela)', amount: 420.00, category: 'Aluguel' },
      { description: 'Google Ads', amount: 2500.00, category: 'Marketing' },
      { description: 'Instagram Ads', amount: 1800.00, category: 'Marketing' },
      { description: 'Influencer Partnership', amount: 3000.00, category: 'Marketing' },
      { description: 'Produção de Conteúdo', amount: 1500.00, category: 'Marketing' },
      { description: 'Energia Elétrica', amount: 680.00, category: 'Custos Fixos' },
      { description: 'Água e Esgoto', amount: 180.00, category: 'Custos Fixos' },
      { description: 'Internet + Telefone', amount: 320.00, category: 'Custos Fixos' },
      { description: 'Seguro Clínica', amount: 450.00, category: 'Custos Fixos' },
      { description: 'Contador', amount: 800.00, category: 'Custos Fixos' },
      { description: 'Software Gestão', amount: 299.00, category: 'Custos Fixos' },
      { description: 'Salário Recepcionista', amount: 2800.00, category: 'Salários' },
      { description: 'Salário Esteticista', amount: 3500.00, category: 'Salários' },
      { description: 'Pro-labore', amount: 8000.00, category: 'Salários' },
    ];

    const mockTxs: any[] = [];
    
    // Filtrar apenas profissionais com comissão (excluir recepcionista)
    const staffWithCommission = createdStaff.filter(s => Number(s.commissionRate) > 0);
    
    console.log('========================================');
    console.log(`[SEED] 📊 Iniciando criação de transações`);
    console.log(`[SEED] Staff com comissão: ${staffWithCommission.length} profissionais`);
    staffWithCommission.forEach((s, idx) => {
      console.log(`[SEED]   ${idx + 1}. ${s.name} (ID: ${s.id})`);
    });
    console.log('========================================');
    
    // Gerar receitas para os últimos 3 meses (incluindo o mês atual completo)
    for (let monthOffset = -2; monthOffset <= 0; monthOffset++) {
      const targetMonth = currentMonth + monthOffset;
      const targetYear = currentYear + Math.floor(targetMonth / 12);
      const actualMonth = ((targetMonth % 12) + 12) % 12;
      const daysInMonth = new Date(targetYear, actualMonth + 1, 0).getDate();
      
      // Para o mês atual, criar até o dia atual. Para meses anteriores, criar o mês todo
      const maxDay = monthOffset === 0 ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
      
      // Gerar receitas do mês (distribuídas ao longo do mês)
      for (let day = 1; day <= maxDay; day++) {
        // 2-5 receitas por dia (mais no mês atual)
        const txPerDay = monthOffset === 0 
          ? 3 + Math.floor(Math.random() * 3) 
          : 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < txPerDay; i++) {
          const tx = revenueTransactions[Math.floor(Math.random() * revenueTransactions.length)];
          if (tx.amount === 0) continue; // Pula retornos
          
          const patient = createdPatients[Math.floor(Math.random() * createdPatients.length)];
          // Associar transação a um profissional aleatório (para cálculo de comissões)
          const staff = staffWithCommission[Math.floor(Math.random() * staffWithCommission.length)];
          const variation = 0.9 + Math.random() * 0.2; // ±10% variação no preço
          
          // Horário aleatório entre 8h e 18h
          const hour = 8 + Math.floor(Math.random() * 10);
          const minute = Math.random() > 0.5 ? 0 : 30;
          
          // Criar tag no formato: staffId,staffName
          const tagValue = `${staff.id},${staff.name}`;
          
          // #region agent log
          console.log('[SEED] Criando transação com tag:', {
            staffId: staff.id,
            staffName: staff.name,
            tagValue,
            description: tx.description,
            date: new Date(targetYear, actualMonth, day, hour, minute, 0).toISOString()
          });
          // #endregion
          
          mockTxs.push({
            userId,
            description: tx.description,
            amount: Math.round(tx.amount * variation),
            type: 'revenue' as const,
            category: tx.category,
            date: BigInt(new Date(targetYear, actualMonth, day, hour, minute, 0).getTime()),
            patientName: patient.name,
            paymentMethod: tx.paymentMethod,
            isPaid: true,
            tags: tagValue || null, // Tag para associar ao profissional - garantir que seja string ou null
          });
        }
      }
    }

    // Gerar despesas para os últimos 3 meses
    for (let monthOffset = -2; monthOffset <= 0; monthOffset++) {
      const targetMonth = currentMonth + monthOffset;
      const targetYear = currentYear + Math.floor(targetMonth / 12);
      const actualMonth = ((targetMonth % 12) + 12) % 12;
      const daysInMonth = new Date(targetYear, actualMonth + 1, 0).getDate();
      const maxDay = monthOffset === 0 ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
      
      // Criar despesas do mês (distribuídas ao longo do mês)
      for (const tx of expenseTransactions) {
        const day = 1 + Math.floor(Math.random() * maxDay);
        mockTxs.push({
          userId,
          description: tx.description,
          amount: tx.amount,
          type: 'expense' as const,
          category: tx.category,
          date: BigInt(new Date(targetYear, actualMonth, day).getTime()),
          paymentMethod: null,
          isPaid: true,
        });
      }
    }

    // Log antes de salvar: verificar se as tags estão presentes
    const revenueTxsToSave = mockTxs.filter(t => t.type === 'revenue');
    const revenueTxsWithTags = revenueTxsToSave.filter(t => t.tags);
    console.log(`[SEED] Antes de salvar: ${revenueTxsToSave.length} receitas, ${revenueTxsWithTags.length} com tags`);
    if (revenueTxsWithTags.length > 0) {
      console.log(`[SEED] Exemplo de tag antes de salvar:`, revenueTxsWithTags[0].tags);
    } else {
      console.log(`[SEED] ⚠️ PROBLEMA: Nenhuma transação de receita tem tags antes de salvar!`);
      console.log(`[SEED] Exemplo de transação:`, {
        description: revenueTxsToSave[0]?.description,
        tags: revenueTxsToSave[0]?.tags,
        hasTags: !!revenueTxsToSave[0]?.tags
      });
    }
    
    // #region agent log
    console.log('[SEED] Salvando transações no banco. Total:', mockTxs.length);
    const revenueSample = mockTxs.filter(t => t.type === 'revenue').slice(0, 3);
    console.log('[SEED] Exemplo de 3 transações de receita antes de salvar:', revenueSample.map(t => ({
      description: t.description,
      type: t.type,
      tags: t.tags,
      tagsType: typeof t.tags,
      hasTags: !!t.tags,
      date: new Date(Number(t.date)).toISOString()
    })));
    // #endregion
    
    // Usar createMany em lotes para garantir que as tags sejam salvas corretamente
    // O Prisma createMany pode ter problemas com campos opcionais em grandes lotes
    // Aumentado para 500 para melhor performance (reduz número de queries)
    const BATCH_SIZE = 500;
    let totalCreated = 0;
    for (let i = 0; i < mockTxs.length; i += BATCH_SIZE) {
      const batch = mockTxs.slice(i, i + BATCH_SIZE);
      const batchWithTags = batch.map(tx => {
        // Garantir que tags seja string ou null, nunca undefined
        const tagsValue = tx.tags ? String(tx.tags) : null;
        return {
          ...tx,
          tags: tagsValue
        };
      });
      
      // #region agent log
      const revenueInBatch = batchWithTags.filter(t => t.type === 'revenue');
      const revenueWithTagsInBatch = revenueInBatch.filter(t => t.tags);
      console.log(`[SEED] Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${batchWithTags.length} transações, ${revenueInBatch.length} receitas, ${revenueWithTagsInBatch.length} com tags`);
      if (revenueWithTagsInBatch.length > 0) {
        console.log(`[SEED] Exemplo de tag no lote:`, revenueWithTagsInBatch[0].tags);
      }
      // #endregion
      
      // Verificar se há tags antes de salvar
      const revenueWithTags = revenueInBatch.filter(t => t.tags);
      
      // #region agent log
      if (revenueInBatch.length > 0 && revenueWithTags.length === 0) {
        console.log(`[SEED] ⚠️ PROBLEMA: Lote ${Math.floor(i / BATCH_SIZE) + 1} tem ${revenueInBatch.length} receitas mas NENHUMA tem tags antes de salvar!`);
        console.log(`[SEED] Exemplo de transação do lote:`, {
          description: revenueInBatch[0].description,
          tags: revenueInBatch[0].tags,
          tagsType: typeof revenueInBatch[0].tags,
          hasTags: !!revenueInBatch[0].tags
        });
      }
      // #endregion
      
      const result = await prisma.transaction.createMany({ 
        data: batchWithTags,
        skipDuplicates: false
      });
      totalCreated += result.count;
      
      // #region agent log
      console.log(`[SEED] Lote ${Math.floor(i / BATCH_SIZE) + 1} salvo: ${result.count} transações criadas`);
      // #endregion
    }
    
    console.log(`[SEED] Total de transações criadas: ${totalCreated} de ${mockTxs.length}`);
    
    // Verificar imediatamente após salvar se as tags foram salvas
    const verificationSample = await prisma.transaction.findMany({
      where: { 
        userId,
        type: 'revenue'
      },
      take: 5,
      select: { id: true, description: true, tags: true }
    });
    
    // #region agent log
    const verificationWithTags = verificationSample.filter(t => t.tags);
    console.log(`[SEED] Verificação pós-salvamento: ${verificationSample.length} transações verificadas, ${verificationWithTags.length} com tags`);
    if (verificationWithTags.length > 0) {
      console.log(`[SEED] ✅ Exemplo de tag salva:`, verificationWithTags[0].tags);
    } else if (verificationSample.length > 0) {
      console.log(`[SEED] ❌ PROBLEMA: Nenhuma das ${verificationSample.length} transações verificadas tem tags após salvar!`);
      console.log(`[SEED] Exemplo de transação sem tag:`, {
        description: verificationSample[0].description,
        tags: verificationSample[0].tags,
        tagsType: typeof verificationSample[0].tags
      });
    }
    // #endregion
    
    // Log para debug: verificar se as tags foram salvas corretamente
    const sampleTxs = await prisma.transaction.findMany({
      where: { 
        userId,
        type: 'revenue',
        tags: { not: null }
      },
      take: 10,
      select: { id: true, description: true, tags: true, date: true }
    });
    console.log('[SEED] Exemplo de transações com tags:', sampleTxs.map(tx => ({
      description: tx.description,
      tags: tx.tags,
      tagParts: tx.tags?.split(',') || [],
      date: new Date(Number(tx.date)).toISOString()
    })));
    
    // #region agent log
    console.log('[SEED] Verificação pós-salvamento:', {
      totalReceitas: await prisma.transaction.count({ where: { userId, type: 'revenue' } }),
      receitasComTags: await prisma.transaction.count({ where: { userId, type: 'revenue', tags: { not: null } } }),
      receitasSemTags: await prisma.transaction.count({ where: { userId, type: 'revenue', tags: null } }),
      exemploTags: sampleTxs[0]?.tags || null
    });
    // #endregion
    
    const sampleStaff = await prisma.staff.findMany({
      where: { userId },
      take: 5,
      select: { id: true, name: true, commissionRate: true }
    });
    console.log('[SEED] Exemplo de staff:', sampleStaff.map(s => ({
      id: s.id,
      name: s.name,
      commissionRate: Number(s.commissionRate)
    })));
    
    // Verificar se há correspondência entre tags e staff
    if (sampleTxs.length > 0 && sampleStaff.length > 0) {
      const firstTx = sampleTxs[0];
      const firstStaff = sampleStaff[0];
      if (firstTx.tags) {
        const tagParts = firstTx.tags.split(',');
        console.log('[SEED] Verificação de correspondência:', {
          tagStaffId: tagParts[0],
          tagStaffName: tagParts[1],
          firstStaffId: firstStaff.id,
          firstStaffName: firstStaff.name,
          matches: tagParts[0] === firstStaff.id || tagParts[1] === firstStaff.name
        });
      }
    }

    // ============================================
    // 5. CRIAR ORÇAMENTOS (QUOTES)
    // ============================================
    const quoteTemplates = [
      {
        items: [
          { name: 'Harmonização Facial Completa', quantity: 1, price: 5800 },
          { name: 'Botox 3 Áreas', quantity: 1, price: 2400 },
        ],
        total: 8200,
      },
      {
        items: [
          { name: 'Protocolo Rejuvenescimento', quantity: 3, price: 1500 },
          { name: 'Skinbooster', quantity: 2, price: 1200 },
        ],
        total: 6900,
      },
      {
        items: [
          { name: 'Bioestimulador Sculptra', quantity: 2, price: 4200 },
        ],
        total: 8400,
      },
      {
        items: [
          { name: 'Preenchimento Labial', quantity: 1, price: 1800 },
          { name: 'Preenchimento Malar', quantity: 1, price: 2500 },
        ],
        total: 4300,
      },
      {
        items: [
          { name: 'Fios de PDO (Pacote)', quantity: 1, price: 4500 },
          { name: 'Bioestimulador', quantity: 1, price: 3200 },
        ],
        total: 7700,
      },
    ];

    const quotes: any[] = [];
    const statuses: ('draft' | 'sent' | 'approved' | 'rejected')[] = ['draft', 'sent', 'approved', 'rejected'];
    
    for (let i = 0; i < 8; i++) {
      const template = quoteTemplates[Math.floor(Math.random() * quoteTemplates.length)];
      const patient = createdPatients[Math.floor(Math.random() * createdPatients.length)];
      const createdDaysAgo = Math.floor(Math.random() * 30);
      
      const createdAt = new Date(now);
      createdAt.setDate(createdAt.getDate() - createdDaysAgo);
      
      const validUntil = new Date(createdAt);
      validUntil.setDate(validUntil.getDate() + 15);
      
      quotes.push({
        userId,
        patientId: patient.id,
        patientName: patient.name,
        items: JSON.stringify(template.items),
        mapPoints: JSON.stringify([]),
        totalAmount: template.total,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdAt: BigInt(createdAt.getTime()),
        validUntil: BigInt(validUntil.getTime()),
      });
    }

    await prisma.quote.createMany({ data: quotes });

    // ============================================
    // 6. CRIAR METAS MENSAIS (MONTHLY TARGETS) - Últimos 3 meses e próximos 2 meses
    // ============================================
    const monthlyTargets: any[] = [];
    
    // Criar metas para os últimos 3 meses, mês atual e próximos 2 meses
    for (let monthOffset = -3; monthOffset <= 2; monthOffset++) {
      const targetDate = new Date(currentYear, currentMonth + monthOffset, 1);
      const monthYear = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Variação de meta baseada no mês (mês atual e futuro têm metas maiores)
      const baseRevenue = monthOffset <= 0 ? 80000 : 85000;
      const basePurchases = monthOffset <= 0 ? 15000 : 18000;
      
      monthlyTargets.push({
        userId,
        monthYear,
        plannedRevenue: Math.round(baseRevenue + (Math.random() * 10000 - 5000)), // ±5k variação
        plannedPurchases: Math.round(basePurchases + (Math.random() * 3000 - 1500)), // ±1.5k variação
      });
    }
    
    // Usar createMany com skipDuplicates para evitar erros se já existir
    for (const target of monthlyTargets) {
      await prisma.monthlyTarget.upsert({
        where: { userId_monthYear: { userId, monthYear: target.monthYear } },
        update: {},
        create: target,
      });
    }

    // ============================================
    // 7. CRIAR PRODUTOS DE ESTOQUE (INVENTORY)
    // ============================================
    const inventoryProducts = [
      // Toxinas Botulínicas
      { name: 'Botox 100U', description: 'Toxina botulínica tipo A - Allergan', category: 'Toxinas', unit: 'fr' as const, currentStock: 8, minStock: 3, maxStock: 15, costPrice: 850, supplier: 'Allergan Brasil', batchNumber: 'BTX2024-001', expirationDate: BigInt(Date.now() + 180 * 24 * 60 * 60 * 1000) },
      { name: 'Dysport 500U', description: 'Abobotulinumtoxina A - Ipsen', category: 'Toxinas', unit: 'fr' as const, currentStock: 5, minStock: 2, maxStock: 10, costPrice: 720, supplier: 'Ipsen Pharma', batchNumber: 'DYS2024-045', expirationDate: BigInt(Date.now() + 150 * 24 * 60 * 60 * 1000) },
      { name: 'Xeomin 100U', description: 'Incobotulinumtoxina A - Merz', category: 'Toxinas', unit: 'fr' as const, currentStock: 3, minStock: 2, maxStock: 8, costPrice: 780, supplier: 'Merz Aesthetics', batchNumber: 'XEO2024-012', expirationDate: BigInt(Date.now() + 200 * 24 * 60 * 60 * 1000) },
      
      // Ácidos Hialurônicos
      { name: 'Juvederm Ultra XC', description: 'Preenchedor HA - Allergan', category: 'Preenchedores', unit: 'un' as const, currentStock: 12, minStock: 5, maxStock: 25, costPrice: 1200, supplier: 'Allergan Brasil', batchNumber: 'JUV2024-089', expirationDate: BigInt(Date.now() + 365 * 24 * 60 * 60 * 1000) },
      { name: 'Restylane Lyft', description: 'Preenchedor HA volumizador', category: 'Preenchedores', unit: 'un' as const, currentStock: 8, minStock: 3, maxStock: 15, costPrice: 1100, supplier: 'Galderma', batchNumber: 'RST2024-156', expirationDate: BigInt(Date.now() + 300 * 24 * 60 * 60 * 1000) },
      { name: 'Belotero Balance', description: 'Preenchedor HA linhas finas', category: 'Preenchedores', unit: 'un' as const, currentStock: 6, minStock: 3, maxStock: 12, costPrice: 980, supplier: 'Merz Aesthetics', batchNumber: 'BEL2024-078', expirationDate: BigInt(Date.now() + 280 * 24 * 60 * 60 * 1000) },
      { name: 'Stylage M', description: 'Preenchedor HA médias rugas', category: 'Preenchedores', unit: 'un' as const, currentStock: 10, minStock: 4, maxStock: 20, costPrice: 650, supplier: 'Vivacy', batchNumber: 'STY2024-234', expirationDate: BigInt(Date.now() + 320 * 24 * 60 * 60 * 1000) },
      
      // Bioestimuladores
      { name: 'Sculptra 2 Frascos', description: 'PLLA Bioestimulador de colágeno', category: 'Bioestimuladores', unit: 'cx' as const, currentStock: 4, minStock: 2, maxStock: 8, costPrice: 2800, supplier: 'Galderma', batchNumber: 'SCP2024-045', expirationDate: BigInt(Date.now() + 400 * 24 * 60 * 60 * 1000) },
      { name: 'Radiesse 1.5ml', description: 'Hidroxiapatita de cálcio', category: 'Bioestimuladores', unit: 'un' as const, currentStock: 6, minStock: 3, maxStock: 12, costPrice: 1500, supplier: 'Merz Aesthetics', batchNumber: 'RAD2024-067', expirationDate: BigInt(Date.now() + 350 * 24 * 60 * 60 * 1000) },
      { name: 'Ellansé M', description: 'PCL Bioestimulador', category: 'Bioestimuladores', unit: 'un' as const, currentStock: 3, minStock: 2, maxStock: 6, costPrice: 1800, supplier: 'Sinclair', batchNumber: 'ELL2024-023', expirationDate: BigInt(Date.now() + 380 * 24 * 60 * 60 * 1000) },
      
      // Fios de PDO
      { name: 'Fios PDO Mono 29G', description: 'Fios lisos para rejuvenescimento', category: 'Fios', unit: 'cx' as const, currentStock: 15, minStock: 5, maxStock: 30, costPrice: 180, supplier: 'Korean Threads', batchNumber: 'PDO2024-890', expirationDate: BigInt(Date.now() + 500 * 24 * 60 * 60 * 1000) },
      { name: 'Fios PDO Espiculados', description: 'Fios com ganchos para lifting', category: 'Fios', unit: 'pct' as const, currentStock: 8, minStock: 3, maxStock: 15, costPrice: 450, supplier: 'Korean Threads', batchNumber: 'PDO2024-891', expirationDate: BigInt(Date.now() + 500 * 24 * 60 * 60 * 1000) },
      
      // Skinboosters
      { name: 'Profhilo H+L', description: 'Skinbooster HA alta concentração', category: 'Skinboosters', unit: 'un' as const, currentStock: 10, minStock: 4, maxStock: 20, costPrice: 980, supplier: 'IBSA', batchNumber: 'PRO2024-112', expirationDate: BigInt(Date.now() + 240 * 24 * 60 * 60 * 1000) },
      { name: 'Juvederm Volite', description: 'Skinbooster para hidratação', category: 'Skinboosters', unit: 'un' as const, currentStock: 7, minStock: 3, maxStock: 15, costPrice: 890, supplier: 'Allergan Brasil', batchNumber: 'VOL2024-056', expirationDate: BigInt(Date.now() + 260 * 24 * 60 * 60 * 1000) },
      
      // Anestésicos
      { name: 'Lidocaína 2%', description: 'Anestésico local', category: 'Anestésicos', unit: 'fr' as const, currentStock: 20, minStock: 10, maxStock: 40, costPrice: 15, supplier: 'Hipolabor', batchNumber: 'LID2024-567', expirationDate: BigInt(Date.now() + 180 * 24 * 60 * 60 * 1000) },
      { name: 'Creme EMLA', description: 'Anestésico tópico', category: 'Anestésicos', unit: 'un' as const, currentStock: 12, minStock: 5, maxStock: 25, costPrice: 45, supplier: 'AstraZeneca', batchNumber: 'EML2024-234', expirationDate: BigInt(Date.now() + 300 * 24 * 60 * 60 * 1000) },
      
      // Material Descartável
      { name: 'Agulha 30G x 13mm', description: 'Agulhas para aplicação', category: 'Descartáveis', unit: 'cx' as const, currentStock: 25, minStock: 10, maxStock: 50, costPrice: 35, supplier: 'BD Medical', batchNumber: 'AGU2024-789', expirationDate: BigInt(Date.now() + 730 * 24 * 60 * 60 * 1000) },
      { name: 'Agulha 27G x 40mm', description: 'Agulhas para cânula', category: 'Descartáveis', unit: 'cx' as const, currentStock: 18, minStock: 8, maxStock: 35, costPrice: 40, supplier: 'BD Medical', batchNumber: 'AGU2024-790', expirationDate: BigInt(Date.now() + 730 * 24 * 60 * 60 * 1000) },
      { name: 'Cânula 25G x 50mm', description: 'Cânulas flexíveis', category: 'Descartáveis', unit: 'cx' as const, currentStock: 12, minStock: 5, maxStock: 25, costPrice: 85, supplier: 'TSK Laboratory', batchNumber: 'CAN2024-123', expirationDate: BigInt(Date.now() + 730 * 24 * 60 * 60 * 1000) },
      { name: 'Seringa 1ml Luer Lock', description: 'Seringas descartáveis', category: 'Descartáveis', unit: 'cx' as const, currentStock: 30, minStock: 15, maxStock: 60, costPrice: 25, supplier: 'BD Medical', batchNumber: 'SER2024-456', expirationDate: BigInt(Date.now() + 730 * 24 * 60 * 60 * 1000) },
      { name: 'Luvas Nitrílicas M', description: 'Luvas procedimento', category: 'Descartáveis', unit: 'cx' as const, currentStock: 8, minStock: 4, maxStock: 20, costPrice: 55, supplier: 'Supermax', batchNumber: 'LUV2024-678', expirationDate: BigInt(Date.now() + 365 * 24 * 60 * 60 * 1000) },
      { name: 'Gaze Estéril 7.5x7.5', description: 'Gaze para procedimentos', category: 'Descartáveis', unit: 'pct' as const, currentStock: 40, minStock: 20, maxStock: 80, costPrice: 8, supplier: 'Cremer', batchNumber: 'GAZ2024-901', expirationDate: BigInt(Date.now() + 1095 * 24 * 60 * 60 * 1000) },
      
      // Peelings e Ácidos
      { name: 'Ácido Glicólico 70%', description: 'Peeling químico', category: 'Peelings', unit: 'fr' as const, currentStock: 4, minStock: 2, maxStock: 8, costPrice: 120, supplier: 'Mesoestetic', batchNumber: 'GLI2024-234', expirationDate: BigInt(Date.now() + 365 * 24 * 60 * 60 * 1000) },
      { name: 'Ácido Mandélico 40%', description: 'Peeling suave', category: 'Peelings', unit: 'fr' as const, currentStock: 3, minStock: 2, maxStock: 6, costPrice: 95, supplier: 'Mesoestetic', batchNumber: 'MAN2024-567', expirationDate: BigInt(Date.now() + 365 * 24 * 60 * 60 * 1000) },
      { name: 'TCA 35%', description: 'Peeling médio', category: 'Peelings', unit: 'fr' as const, currentStock: 2, minStock: 1, maxStock: 4, costPrice: 180, supplier: 'Mesoestetic', batchNumber: 'TCA2024-890', expirationDate: BigInt(Date.now() + 300 * 24 * 60 * 60 * 1000) },
      
      // Produtos com ESTOQUE BAIXO (para alertas)
      { name: 'Vitamina C Injetável', description: 'Ampolas vitamina C', category: 'Vitaminas', unit: 'amp' as const, currentStock: 2, minStock: 5, maxStock: 20, costPrice: 25, supplier: 'Farmacêutica', batchNumber: 'VTC2024-111', expirationDate: BigInt(Date.now() + 90 * 24 * 60 * 60 * 1000) },
      { name: 'Ácido Tranexâmico', description: 'Clareador injetável', category: 'Clareadores', unit: 'amp' as const, currentStock: 1, minStock: 3, maxStock: 10, costPrice: 35, supplier: 'Farmacêutica', batchNumber: 'ATX2024-222', expirationDate: BigInt(Date.now() + 60 * 24 * 60 * 60 * 1000) },
      
      // Produto VENCENDO EM BREVE
      { name: 'Enzimas Lipolíticas', description: 'Lipólise enzimática', category: 'Lipolíticos', unit: 'fr' as const, currentStock: 5, minStock: 2, maxStock: 10, costPrice: 280, supplier: 'Farmacêutica', batchNumber: 'ENZ2024-333', expirationDate: BigInt(Date.now() + 15 * 24 * 60 * 60 * 1000) },
      
      // Produto VENCIDO
      { name: 'DMAE Injetável', description: 'Tensor facial - VENCIDO', category: 'Firmadores', unit: 'amp' as const, currentStock: 3, minStock: 2, maxStock: 8, costPrice: 45, supplier: 'Farmacêutica', batchNumber: 'DMA2023-999', expirationDate: BigInt(Date.now() - 10 * 24 * 60 * 60 * 1000) },
    ];

    const createdProducts = await prisma.inventoryProduct.createManyAndReturn({
      data: inventoryProducts.map(p => ({ userId, ...p }))
    });

    // ============================================
    // 8. CRIAR MOVIMENTAÇÕES DE ESTOQUE
    // ============================================
    const movements: any[] = [];
    
    // Criar movimentações para cada produto
    for (const product of createdProducts) {
      const currentStock = Number(product.currentStock);
      
      // Entrada inicial (alguns dias atrás)
      const entryDaysAgo = 30 + Math.floor(Math.random() * 30);
      const entryDate = new Date(now);
      entryDate.setDate(entryDate.getDate() - entryDaysAgo);
      
      const initialStock = currentStock + Math.floor(Math.random() * 10) + 5;
      movements.push({
        productId: product.id,
        userId,
        type: 'entrada' as const,
        quantity: initialStock,
        previousStock: 0,
        newStock: initialStock,
        unitCost: Number(product.costPrice),
        totalCost: Number(product.costPrice) * initialStock,
        reason: 'Compra NF 2024/001',
        batchNumber: product.batchNumber,
        expirationDate: product.expirationDate,
        invoiceNumber: `NF-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        createdAt: entryDate,
      });
      
      // Saídas por procedimentos (simulando uso real)
      let runningStock = initialStock;
      const usageCount = Math.floor(Math.random() * 8) + 2;
      
      for (let i = 0; i < usageCount && runningStock > currentStock; i++) {
        const usageDaysAgo = Math.floor(Math.random() * entryDaysAgo);
        const usageDate = new Date(now);
        usageDate.setDate(usageDate.getDate() - usageDaysAgo);
        
        const quantity = Math.min(Math.floor(Math.random() * 3) + 1, runningStock - currentStock);
        if (quantity <= 0) break;
        
        const staff = createdStaff[Math.floor(Math.random() * (createdStaff.length - 1))];
        const patient = createdPatients[Math.floor(Math.random() * createdPatients.length)];
        
        movements.push({
          productId: product.id,
          userId,
          staffId: staff.id,
          type: 'saida' as const,
          quantity,
          previousStock: runningStock,
          newStock: runningStock - quantity,
          unitCost: Number(product.costPrice),
          totalCost: Number(product.costPrice) * quantity,
          reason: 'Utilizado em procedimento',
          patientName: patient.name,
          createdAt: usageDate,
        });
        
        runningStock -= quantity;
      }
      
      // Algumas perdas aleatórias
      if (Math.random() > 0.8 && runningStock > currentStock) {
        const lossDate = new Date(now);
        lossDate.setDate(lossDate.getDate() - Math.floor(Math.random() * 15));
        
        movements.push({
          productId: product.id,
          userId,
          type: 'perda' as const,
          quantity: 1,
          previousStock: runningStock,
          newStock: runningStock - 1,
          unitCost: Number(product.costPrice),
          totalCost: Number(product.costPrice),
          reason: 'Queda acidental / Contaminação',
          createdAt: lossDate,
        });
      }
    }

    // Criar movimentações em lotes para melhor performance
    const MOVEMENT_BATCH_SIZE = 500;
    for (let i = 0; i < movements.length; i += MOVEMENT_BATCH_SIZE) {
      const batch = movements.slice(i, i + MOVEMENT_BATCH_SIZE);
      await prisma.stockMovement.createMany({ data: batch });
      console.log(`[SEED] Movimentações lote ${Math.floor(i / MOVEMENT_BATCH_SIZE) + 1}: ${batch.length} criadas`);
    }

    // ============================================
    // 9. CRIAR LINKS PRODUTO-PROCEDIMENTO
    // ============================================
    const procedureLinks: any[] = [];
    
    // Mapear produtos por nome para facilitar
    const productsByName = new Map(createdProducts.map(p => [p.name, p]));
    
    const procedureMappings = [
      { procedure: 'Botox 3 Áreas', products: [
        { name: 'Botox 100U', qty: 0.5, required: true },
        { name: 'Agulha 30G x 13mm', qty: 3, required: true },
        { name: 'Seringa 1ml Luer Lock', qty: 1, required: true },
        { name: 'Gaze Estéril 7.5x7.5', qty: 2, required: true },
      ]},
      { procedure: 'Preenchimento Labial', products: [
        { name: 'Juvederm Ultra XC', qty: 1, required: true },
        { name: 'Cânula 25G x 50mm', qty: 1, required: true },
        { name: 'Creme EMLA', qty: 0.5, required: false },
        { name: 'Gaze Estéril 7.5x7.5', qty: 3, required: true },
      ]},
      { procedure: 'Harmonização Facial', products: [
        { name: 'Juvederm Ultra XC', qty: 2, required: true },
        { name: 'Restylane Lyft', qty: 1, required: true },
        { name: 'Cânula 25G x 50mm', qty: 3, required: true },
        { name: 'Lidocaína 2%', qty: 1, required: true },
        { name: 'Gaze Estéril 7.5x7.5', qty: 5, required: true },
      ]},
      { procedure: 'Sculptra', products: [
        { name: 'Sculptra 2 Frascos', qty: 1, required: true },
        { name: 'Agulha 27G x 40mm', qty: 2, required: true },
        { name: 'Seringa 1ml Luer Lock', qty: 2, required: true },
        { name: 'Gaze Estéril 7.5x7.5', qty: 4, required: true },
      ]},
      { procedure: 'Bioestimulador de Colágeno', products: [
        { name: 'Radiesse 1.5ml', qty: 1, required: true },
        { name: 'Cânula 25G x 50mm', qty: 2, required: true },
        { name: 'Lidocaína 2%', qty: 0.5, required: true },
        { name: 'Gaze Estéril 7.5x7.5', qty: 3, required: true },
      ]},
      { procedure: 'Skinbooster', products: [
        { name: 'Profhilo H+L', qty: 1, required: true },
        { name: 'Agulha 30G x 13mm', qty: 5, required: true },
        { name: 'Gaze Estéril 7.5x7.5', qty: 2, required: true },
      ]},
      { procedure: 'Fios de PDO', products: [
        { name: 'Fios PDO Mono 29G', qty: 10, required: true },
        { name: 'Fios PDO Espiculados', qty: 4, required: false },
        { name: 'Lidocaína 2%', qty: 2, required: true },
        { name: 'Gaze Estéril 7.5x7.5', qty: 5, required: true },
      ]},
      { procedure: 'Peeling Químico', products: [
        { name: 'Ácido Glicólico 70%', qty: 0.1, required: true },
        { name: 'Gaze Estéril 7.5x7.5', qty: 5, required: true },
        { name: 'Luvas Nitrílicas M', qty: 1, required: true },
      ]},
      { procedure: 'Microagulhamento', products: [
        { name: 'Vitamina C Injetável', qty: 1, required: false },
        { name: 'Creme EMLA', qty: 1, required: true },
        { name: 'Gaze Estéril 7.5x7.5', qty: 3, required: true },
      ]},
    ];

    for (const mapping of procedureMappings) {
      for (const item of mapping.products) {
        const product = productsByName.get(item.name);
        if (product) {
          procedureLinks.push({
            productId: product.id,
            procedureName: mapping.procedure,
            quantityPerUse: item.qty,
            isRequired: item.required,
            notes: item.required ? null : 'Opcional - uso a critério do profissional',
          });
        }
      }
    }

    await prisma.productProcedure.createMany({ data: procedureLinks });

    // ============================================
    // 10. CRIAR ALERTAS DE ESTOQUE
    // ============================================
    const alerts: any[] = [];
    
    for (const product of createdProducts) {
      const currentStock = Number(product.currentStock);
      const minStock = Number(product.minStock);
      const expirationDate = product.expirationDate ? Number(product.expirationDate) : null;
      
      // Alerta de estoque baixo
      if (currentStock <= minStock && currentStock > 0) {
        alerts.push({
          id: `${product.id}-low_stock`,
          userId,
          productId: product.id,
          alertType: 'low_stock' as const,
          currentStock,
          minStock,
          isRead: Math.random() > 0.5,
        });
      }
      
      // Alerta de estoque zerado
      if (currentStock === 0) {
        alerts.push({
          id: `${product.id}-out_of_stock`,
          userId,
          productId: product.id,
          alertType: 'out_of_stock' as const,
          currentStock: 0,
          minStock,
          isRead: false,
        });
      }
      
      // Alertas de validade
      if (expirationDate) {
        const daysUntilExpiry = Math.ceil((expirationDate - Date.now()) / (24 * 60 * 60 * 1000));
        
        if (daysUntilExpiry <= 0) {
          alerts.push({
            id: `${product.id}-expired`,
            userId,
            productId: product.id,
            alertType: 'expired' as const,
            currentStock,
            minStock,
            expirationDate: BigInt(expirationDate),
            daysUntilExpiry,
            isRead: false,
          });
        } else if (daysUntilExpiry <= 30) {
          alerts.push({
            id: `${product.id}-expiring`,
            userId,
            productId: product.id,
            alertType: 'expiring' as const,
            currentStock,
            minStock,
            expirationDate: BigInt(expirationDate),
            daysUntilExpiry,
            isRead: Math.random() > 0.7,
          });
        }
      }
    }

    if (alerts.length > 0) {
      await prisma.stockAlert.createMany({ data: alerts, skipDuplicates: true });
    }

    // ============================================
    // 11. CRIAR THREADS DE CHAT (CRM)
    // ============================================
    const chatThreads: any[] = [];
    const crmStages = ['new', 'contacted', 'interested', 'scheduled', 'closed_won', 'closed_lost'];
    
    const leadNames = [
      { name: 'Maria Silva', phone: '5511987654321' },
      { name: 'Ana Paula Santos', phone: '5511976543210' },
      { name: 'Carla Mendes', phone: '5511965432109' },
      { name: 'Juliana Costa', phone: '5511954321098' },
      { name: 'Roberta Lima', phone: '5511943210987' },
      { name: 'Daniela Ferreira', phone: '5511932109876' },
      { name: 'Paula Rodrigues', phone: '5511921098765' },
      { name: 'Luciana Alves', phone: '5511910987654' },
    ];

    const lastMessages = [
      'Olá! Gostaria de saber mais sobre harmonização facial',
      'Quanto custa o botox? Vocês parcelam?',
      'Posso agendar uma avaliação para essa semana?',
      'Obrigada pelo atendimento! Vou pensar e retorno',
      'Perfeito, confirmado para sexta às 14h',
      'Quais procedimentos vocês fazem para olheiras?',
      'Vi no Instagram e fiquei interessada no sculptra',
      'Vocês trabalham com lip flip?',
    ];

    for (let i = 0; i < leadNames.length; i++) {
      const lead = leadNames[i];
      const daysAgo = Math.floor(Math.random() * 14);
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - daysAgo);
      
      chatThreads.push({
        id: lead.phone,
        userId,
        contactName: lead.name,
        lastMessage: lastMessages[i],
        lastTimestamp: BigInt(timestamp.getTime()),
        crmStage: crmStages[Math.floor(Math.random() * crmStages.length)],
      });
    }

    await prisma.chatThread.createMany({ data: chatThreads, skipDuplicates: true });

    // ============================================
    // 12. CRIAR MENSAGENS DE CHAT
    // ============================================
    const chatMessages: any[] = [];
    
    for (const thread of chatThreads) {
      const messageCount = 3 + Math.floor(Math.random() * 5);
      let baseTime = Number(thread.lastTimestamp) - (messageCount * 60 * 60 * 1000);
      
      const conversationTemplates = [
        { direction: 'inbound', content: 'Oi! Vi vocês no Instagram e gostaria de saber mais sobre os procedimentos' },
        { direction: 'outbound', content: `Olá ${thread.contactName.split(' ')[0]}! 💜 Tudo bem? Fico feliz com seu interesse! O que você gostaria de saber?` },
        { direction: 'inbound', content: 'Quero saber sobre harmonização facial. Quanto custa mais ou menos?' },
        { direction: 'outbound', content: 'A harmonização facial é personalizada para cada paciente! Temos protocolos a partir de R$ 3.500. Podemos agendar uma avaliação gratuita para entender suas necessidades?' },
        { direction: 'inbound', content: 'Vocês parcelam no cartão?' },
        { direction: 'outbound', content: 'Sim! Parcelamos em até 12x no cartão. Também temos condições especiais à vista. Quando seria bom para você passar aqui?' },
        { direction: 'inbound', content: 'Pode ser essa semana?' },
        { direction: 'outbound', content: 'Perfeito! Temos horários disponíveis quinta às 15h ou sexta às 10h. Qual fica melhor para você?' },
      ];

      for (let i = 0; i < Math.min(messageCount, conversationTemplates.length); i++) {
        const template = conversationTemplates[i];
        baseTime += (20 + Math.floor(Math.random() * 40)) * 60 * 1000; // 20-60 min entre mensagens
        
        chatMessages.push({
          userId,
          patientId: thread.id,
          content: template.content,
          direction: template.direction as 'inbound' | 'outbound',
          timestamp: BigInt(baseTime),
          contactName: thread.contactName,
          contactPhone: thread.id,
          status: 'read' as const,
        });
      }
    }

    // Criar mensagens em lotes para melhor performance
    const CHAT_BATCH_SIZE = 500;
    for (let i = 0; i < chatMessages.length; i += CHAT_BATCH_SIZE) {
      const batch = chatMessages.slice(i, i + CHAT_BATCH_SIZE);
      await prisma.chatMessage.createMany({ data: batch });
      console.log(`[SEED] Mensagens lote ${Math.floor(i / CHAT_BATCH_SIZE) + 1}: ${batch.length} criadas`);
    }

    // ============================================
    // 13. CRIAR CATEGORIAS PERSONALIZADAS
    // ============================================
    const categories = [
      { name: 'Procedimentos', type: 'revenue' as const },
      { name: 'Consultas', type: 'revenue' as const },
      { name: 'Produtos', type: 'revenue' as const },
      { name: 'Pacotes', type: 'revenue' as const },
      { name: 'Insumos', type: 'expense_variable' as const },
      { name: 'Marketing', type: 'expense_variable' as const },
      { name: 'Comissões', type: 'expense_variable' as const },
      { name: 'Aluguel', type: 'expense_fixed' as const },
      { name: 'Salários', type: 'expense_fixed' as const },
      { name: 'Custos Fixos', type: 'expense_fixed' as const },
      { name: 'Impostos', type: 'expense_fixed' as const },
      { name: 'Manutenção', type: 'expense_variable' as const },
    ];

    await prisma.category.createMany({
      data: categories.map(c => ({ userId, ...c })),
      skipDuplicates: true,
    });

    // ============================================
    // 14. CRIAR PRESCRIÇÕES
    // ============================================
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { clinicId: true } });
    const clinicId = user?.clinicId || userId;
    
    const prescriptions: any[] = [];
    const prescriptionStatuses: ('draft' | 'signed' | 'sent' | 'cancelled')[] = ['draft', 'signed', 'sent'];
    
    const prescriptionTemplates = [
      {
        items: [
          { name: 'Protetor Solar FPS 50+', dosage: 'Aplicar diariamente pela manhã', quantity: 1, instructions: 'Reaplicar a cada 3 horas' },
          { name: 'Hidratante Facial', dosage: 'Aplicar 2x ao dia', quantity: 1, instructions: 'Manhã e noite' },
          { name: 'Vitamina C sérum', dosage: 'Aplicar pela manhã', quantity: 1, instructions: 'Antes do protetor solar' },
        ],
        diagnosis: 'Pós-procedimento: Harmonização Facial',
      },
      {
        items: [
          { name: 'Ácido Hialurônico Tópico', dosage: 'Aplicar à noite', quantity: 1, instructions: 'Aplicar antes do hidratante' },
          { name: 'Sabonete Facial Suave', dosage: 'Usar 2x ao dia', quantity: 1, instructions: 'Limpar suavemente' },
        ],
        diagnosis: 'Pós-procedimento: Preenchimento Labial',
      },
      {
        items: [
          { name: 'Retinóide 0.025%', dosage: 'Aplicar à noite, 3x por semana', quantity: 1, instructions: 'Iniciar gradualmente, intercalar dias' },
          { name: 'Hidratante Facial', dosage: 'Aplicar diariamente', quantity: 1, instructions: 'Usar sempre após retinóide' },
          { name: 'Protetor Solar FPS 60+', dosage: 'Aplicar diariamente', quantity: 1, instructions: 'Obrigatório durante uso de retinóide' },
        ],
        diagnosis: 'Tratamento antienvelhecimento e melasma',
      },
      {
        items: [
          { name: 'Ácido Tranexâmico Tópico', dosage: 'Aplicar 2x ao dia', quantity: 1, instructions: 'Manhã e noite' },
          { name: 'Vitamina C sérum', dosage: 'Aplicar pela manhã', quantity: 1, instructions: 'Antes do protetor' },
          { name: 'Protetor Solar FPS 50+', dosage: 'Aplicar diariamente', quantity: 1, instructions: 'Reaplicar durante o dia' },
        ],
        diagnosis: 'Melasma e hiperpigmentação',
      },
      {
        items: [
          { name: 'Creme para Cicatrização', dosage: 'Aplicar 3x ao dia', quantity: 1, instructions: 'Manter área sempre hidratada' },
          { name: 'Protetor Solar FPS 50+', dosage: 'Aplicar diariamente', quantity: 1, instructions: 'Evitar exposição solar' },
        ],
        diagnosis: 'Pós-procedimento: Microagulhamento',
      },
    ];
    
    // Criar 8-12 prescrições
    for (let i = 0; i < 10; i++) {
      const template = prescriptionTemplates[Math.floor(Math.random() * prescriptionTemplates.length)];
      const patient = createdPatients[Math.floor(Math.random() * createdPatients.length)];
      const professional = createdStaff[Math.floor(Math.random() * (createdStaff.length - 1))]; // Exclui recepcionista
      
      const createdDaysAgo = Math.floor(Math.random() * 60);
      const createdAt = new Date(now);
      createdAt.setDate(createdAt.getDate() - createdDaysAgo);
      
      const status = prescriptionStatuses[Math.floor(Math.random() * prescriptionStatuses.length)];
      const signedAt = status === 'signed' || status === 'sent' ? new Date(createdAt.getTime() + (2 * 60 * 60 * 1000)) : null;
      const sentAt = status === 'sent' ? new Date((signedAt?.getTime() || createdAt.getTime()) + (30 * 60 * 1000)) : null;
      const validUntil = new Date(createdAt.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 dias
      
      prescriptions.push({
        clinicId,
        userId,
        patientId: patient.id,
        patientName: patient.name,
        patientCpf: patient.cpf || null,
        patientBirthDate: patient.birthDate || null,
        patientAddress: patient.addressStreet ? `${patient.addressStreet}, ${patient.addressNumber || ''} - ${patient.addressNeighborhood || ''}, ${patient.addressCity || ''}` : null,
        professionalId: professional.id,
        professionalName: professional.name,
        professionalCrm: professional.role.includes('Médic') ? `CRM-SP ${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}` : null,
        professionalSpecialty: professional.role,
        items: JSON.stringify(template.items),
        diagnosis: template.diagnosis,
        additionalNotes: Math.random() > 0.7 ? 'Paciente orientada sobre cuidados pós-procedimento. Retorno em 15 dias.' : null,
        status,
        signedAt: signedAt ? BigInt(signedAt.getTime()) : null,
        sentAt: sentAt ? BigInt(sentAt.getTime()) : null,
        sentVia: status === 'sent' ? JSON.stringify(['whatsapp']) : JSON.stringify([]),
        validUntil: BigInt(validUntil.getTime()),
        isControlled: false,
        createdAt: BigInt(createdAt.getTime()),
        updatedAt: BigInt(createdAt.getTime()),
      });
    }
    
    await prisma.prescription.createMany({ data: prescriptions });

    // ============================================
    // 15. CRIAR DADOS DE FIDELIDADE
    // ============================================
    
    // Criar recompensas padrão
    const loyaltyRewards = [
      { name: 'Desconto 10%', description: 'Cupom de 10% em qualquer procedimento', pointsCost: 500, type: 'discount' as const, value: 10, tier: null, stock: null, validDays: 30, category: 'beauty' as const },
      { name: 'Kit Skincare', description: 'Kit completo de cuidados com a pele', pointsCost: 1500, type: 'product' as const, value: 150, tier: null, stock: 20, validDays: 60, category: 'beauty' as const },
      { name: 'Limpeza de Pele', description: 'Uma sessão completa de limpeza de pele', pointsCost: 2500, type: 'procedure' as const, value: 250, tier: 'silver' as const, stock: null, validDays: 90, category: 'beauty' as const },
      { name: 'Voucher R$100', description: 'Voucher de R$100 para usar em qualquer serviço', pointsCost: 3000, type: 'voucher' as const, value: 100, tier: 'silver' as const, stock: null, validDays: 60, category: 'special' as const },
      { name: 'Desconto 25%', description: 'Cupom de 25% em procedimentos estéticos', pointsCost: 4000, type: 'discount' as const, value: 25, tier: 'gold' as const, stock: null, validDays: 45, category: 'beauty' as const },
      { name: 'Botox Completo', description: 'Aplicação completa de toxina botulínica', pointsCost: 8000, type: 'procedure' as const, value: 1500, tier: 'gold' as const, stock: null, validDays: 120, category: 'beauty' as const },
      { name: 'Day Spa VIP', description: 'Dia completo de spa com todos os tratamentos', pointsCost: 12000, type: 'procedure' as const, value: 2000, tier: 'diamond' as const, stock: null, validDays: 180, category: 'wellness' as const },
      { name: 'Voucher R$500', description: 'Voucher premium de R$500', pointsCost: 15000, type: 'voucher' as const, value: 500, tier: 'diamond' as const, stock: null, validDays: 90, category: 'special' as const },
    ];

    const createdRewards = await prisma.loyaltyReward.createManyAndReturn({
      data: loyaltyRewards.map(r => ({ userId, ...r }))
    });

    // Criar membros de fidelidade para alguns pacientes (50% dos pacientes)
    const loyaltyMembers: any[] = [];
    const selectedPatients = createdPatients.slice(0, Math.ceil(createdPatients.length * 0.5));
    
    for (const patient of selectedPatients) {
      const joinedDaysAgo = Math.floor(Math.random() * 365) + 30; // Entre 30 e 395 dias atrás
      const joinedAt = new Date(now);
      joinedAt.setDate(joinedAt.getDate() - joinedDaysAgo);
      
      // Calcular pontos baseado em consultas e procedimentos simulados
      const consultations = Math.floor(Math.random() * 20) + 5; // 5-25 consultas
      const procedures = Math.floor(Math.random() * 15) + 3; // 3-18 procedimentos
      const referrals = Math.floor(Math.random() * 5); // 0-5 indicações
      
      // Pontos: 100 por consulta, 150 por procedimento, 500 por indicação, bônus aleatórios
      const consultationPoints = consultations * 100;
      const procedurePoints = procedures * 150;
      const referralPoints = referrals * 500;
      const bonusPoints = Math.floor(Math.random() * 1000); // Bônus aleatórios
      const totalPoints = consultationPoints + procedurePoints + referralPoints + bonusPoints;
      
      // Calcular tier baseado nos pontos
      let tier: 'bronze' | 'silver' | 'gold' | 'diamond' = 'bronze';
      if (totalPoints >= 15000) tier = 'diamond';
      else if (totalPoints >= 5000) tier = 'gold';
      else if (totalPoints >= 1000) tier = 'silver';
      
      // Pontos disponíveis (total menos pontos gastos em resgates)
      const spentPoints = Math.floor(Math.random() * (totalPoints * 0.3)); // Até 30% gastos
      const availablePoints = totalPoints - spentPoints;
      
      // Gerar código de indicação único
      const referralCode = `${patient.name.toUpperCase().substring(0, 5)}${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
      
      const lastActivityDaysAgo = Math.floor(Math.random() * 30); // Última atividade nos últimos 30 dias
      const lastActivityAt = new Date(now);
      lastActivityAt.setDate(lastActivityAt.getDate() - lastActivityDaysAgo);
      
      loyaltyMembers.push({
        userId,
        patientId: patient.id,
        patientName: patient.name,
        totalPoints,
        availablePoints,
        tier,
        totalConsultations: consultations,
        totalProcedures: procedures,
        totalReferrals: referrals,
        referralCode,
        joinedAt: BigInt(joinedAt.getTime()),
        lastActivityAt: BigInt(lastActivityAt.getTime()),
      });
    }

    const createdMembers = await prisma.loyaltyMember.createManyAndReturn({
      data: loyaltyMembers
    });

    // Criar histórico de pontos para cada membro
    const pointsHistory: any[] = [];
    for (const member of createdMembers) {
      const originalMember = loyaltyMembers.find(m => m.referralCode === member.referralCode);
      if (!originalMember) continue;
      
      // Histórico de consultas
      for (let i = 0; i < originalMember.totalConsultations; i++) {
        const daysAgo = Math.floor(Math.random() * 365);
        const createdAt = new Date(now);
        createdAt.setDate(createdAt.getDate() - daysAgo);
        
        pointsHistory.push({
          memberId: member.id,
          points: 100,
          source: 'consultation' as const,
          description: 'Consulta realizada',
          createdAt: BigInt(createdAt.getTime()),
        });
      }
      
      // Histórico de procedimentos
      for (let i = 0; i < originalMember.totalProcedures; i++) {
        const daysAgo = Math.floor(Math.random() * 365);
        const createdAt = new Date(now);
        createdAt.setDate(createdAt.getDate() - daysAgo);
        
        const procedureNames = ['Botox', 'Preenchimento', 'Limpeza de Pele', 'Peeling', 'Harmonização'];
        const procedureName = procedureNames[Math.floor(Math.random() * procedureNames.length)];
        
        pointsHistory.push({
          memberId: member.id,
          points: 150,
          source: 'procedure' as const,
          description: `${procedureName} realizado`,
          createdAt: BigInt(createdAt.getTime()),
        });
      }
      
      // Histórico de indicações
      for (let i = 0; i < originalMember.totalReferrals; i++) {
        const daysAgo = Math.floor(Math.random() * 180);
        const createdAt = new Date(now);
        createdAt.setDate(createdAt.getDate() - daysAgo);
        
        pointsHistory.push({
          memberId: member.id,
          points: 500,
          source: 'referral' as const,
          description: 'Indicação de amigo',
          createdAt: BigInt(createdAt.getTime()),
        });
      }
      
      // Bônus aleatórios
      if (Math.random() > 0.5) {
        const daysAgo = Math.floor(Math.random() * 365);
        const createdAt = new Date(now);
        createdAt.setDate(createdAt.getDate() - daysAgo);
        
        pointsHistory.push({
          memberId: member.id,
          points: 50,
          source: 'bonus' as const,
          description: 'Bônus especial',
          createdAt: BigInt(createdAt.getTime()),
        });
      }
    }

    if (pointsHistory.length > 0) {
      // Criar histórico de pontos em lotes para melhor performance
      const POINTS_BATCH_SIZE = 500;
      for (let i = 0; i < pointsHistory.length; i += POINTS_BATCH_SIZE) {
        const batch = pointsHistory.slice(i, i + POINTS_BATCH_SIZE);
        await prisma.loyaltyPointsHistory.createMany({ data: batch });
        console.log(`[SEED] Histórico de pontos lote ${Math.floor(i / POINTS_BATCH_SIZE) + 1}: ${batch.length} criados`);
      }
    }

    // Criar alguns resgates
    const redemptions: any[] = [];
    for (let i = 0; i < Math.min(createdMembers.length, 5); i++) {
      const member = createdMembers[i];
      const reward = createdRewards[Math.floor(Math.random() * createdRewards.length)];
      
      if (member.availablePoints >= reward.pointsCost) {
        const daysAgo = Math.floor(Math.random() * 30);
        const createdAt = new Date(now);
        createdAt.setDate(createdAt.getDate() - daysAgo);
        
        const expiresAt = new Date(createdAt);
        expiresAt.setDate(expiresAt.getDate() + reward.validDays);
        
        const status = expiresAt.getTime() < Date.now() ? 'expired' : (Math.random() > 0.7 ? 'used' : 'pending');
        const usedAt = status === 'used' ? new Date(createdAt.getTime() + (Math.random() * (expiresAt.getTime() - createdAt.getTime()))) : null;
        
        redemptions.push({
          memberId: member.id,
          rewardId: reward.id,
          rewardName: reward.name,
          pointsSpent: reward.pointsCost,
          status: status as 'pending' | 'used' | 'expired',
          code: `CUPOM-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
          createdAt: BigInt(createdAt.getTime()),
          expiresAt: BigInt(expiresAt.getTime()),
          usedAt: usedAt ? BigInt(usedAt.getTime()) : null,
        });
      }
    }

    if (redemptions.length > 0) {
      await prisma.loyaltyRedemption.createMany({ data: redemptions });
    }

    const seedElapsed = Date.now() - seedStartTime;
    // #region agent log
    await debugLog({location:'transactions.ts:1858',message:'SEED: Concluído com sucesso',data:{seedElapsedMs:seedElapsed,staff:createdStaff.length,patients:createdPatients.length,appointments:appointments.length,transactions:mockTxs.length,quotes:quotes.length,products:createdProducts.length,prescriptions:prescriptions.length},hypothesisId:'B'});
    // #endregion

    console.log('========================================');
    console.log('✅ [SEED] DADOS FICTÍCIOS CRIADOS COM SUCESSO!');
    console.log('========================================');
    console.log(`[SEED] Staff: ${createdStaff.length}`);
    console.log(`[SEED] Pacientes: ${createdPatients.length}`);
    console.log(`[SEED] Agendamentos: ${appointments.length}`);
    console.log(`[SEED] Transações: ${mockTxs.length}`);
    console.log(`[SEED] Orçamentos: ${quotes.length}`);
    console.log(`[SEED] Produtos: ${createdProducts.length}`);
    console.log(`[SEED] Prescrições: ${prescriptions.length}`);
    console.log(`[SEED] Tempo total: ${seedElapsed}ms`);
    console.log('========================================');

    res.json({ 
      success: true,
      created: {
        staff: createdStaff.length,
        patients: createdPatients.length,
        appointments: appointments.length,
        transactions: mockTxs.length,
        quotes: quotes.length,
        monthlyTargets: monthlyTargets.length,
        products: createdProducts.length,
        movements: movements.length,
        procedureLinks: procedureLinks.length,
        alerts: alerts.length,
        chatThreads: chatThreads.length,
        chatMessages: chatMessages.length,
        categories: categories.length,
        prescriptions: prescriptions.length,
        loyaltyRewards: createdRewards.length,
        loyaltyMembers: createdMembers.length,
        loyaltyPointsHistory: pointsHistory.length,
        loyaltyRedemptions: redemptions.length,
      }
    });
  } catch (error) {
    console.error('========================================');
    console.error('❌ [SEED] ERRO AO CRIAR DADOS FICTÍCIOS');
    console.error('========================================');
    console.error('[SEED] Erro:', error);
    console.error('========================================');
    res.status(500).json({ error: 'Erro ao criar dados de exemplo' });
  }
});

// DELETE /api/transactions (delete all transactions) - DEPRECATED, use /api/transactions/reset-all
router.delete('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.transaction.deleteMany({
      where: { userId: req.userId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro delete all:', error);
    res.status(500).json({ error: 'Erro ao deletar transações' });
  }
});

// DELETE /api/transactions/:id
// IMPORTANTE: Esta rota deve vir DEPOIS das rotas específicas como /reset-all
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  
  // VALIDAÇÃO CRÍTICA: Se o ID for "reset-all", redirecionar para a rota correta
  if (id === 'reset-all') {
    console.error('[DELETE /:id] ERRO: Rota /:id recebeu "reset-all" como ID! Isso não deveria acontecer.');
    res.status(400).json({ 
      error: 'Rota incorreta. Use DELETE /api/transactions/reset-all para deletar todos os dados.' 
    });
    return;
  }
  
  console.log(`[DELETE /:id] Deletando transação individual com ID: ${id}`);
  
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    // Verificar se a transação existe e pertence ao usuário
    const transaction = await prisma.transaction.findUnique({
      where: { id }
    });

    if (!transaction) {
      console.log(`[DELETE /:id] Transação ${id} não encontrada`);
      res.status(404).json({ error: 'Transação não encontrada' });
      return;
    }

    if (transaction.userId !== userId) {
      res.status(403).json({ error: 'Você não tem permissão para deletar esta transação' });
      return;
    }

    // Tentar deletar
    console.log(`[DELETE /:id] Deletando transação ${id} do usuário ${userId}`);
    await prisma.transaction.delete({
      where: { id, userId }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Erro delete transaction:', error);
    console.error('Error code:', error?.code);
    console.error('Error meta:', error?.meta);
    
    // Mensagens de erro mais específicas
    let errorMessage = 'Erro ao deletar transação';
    if (error?.code === 'P2025') {
      errorMessage = 'Transação não encontrada';
    } else if (error?.code === 'P2003') {
      errorMessage = 'Não é possível deletar esta transação pois ela está sendo referenciada por outros registros';
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ error: errorMessage, details: error?.code || 'UNKNOWN_ERROR' });
  }
});

export default router;


