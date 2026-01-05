/**
 * Job para limpar dados de usuários com subscription expirada há mais de 30 dias
 * Executa diariamente para excluir dados de contas não renovadas
 */

import prisma from '../config/database.js';
import { logger } from '../config/logger.js';
import { SubscriptionPlan } from '../middlewares/subscription.js';

const PAID_PLANS: SubscriptionPlan[] = ['basic', 'professional', 'enterprise'];
const GRACE_PERIOD_DAYS = 30;

export async function cleanupExpiredData() {
  try {
    logger.info('🧹 Iniciando limpeza de dados expirados...');

    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - GRACE_PERIOD_DAYS);

    // Buscar subscriptions de planos pagos expiradas há mais de 30 dias
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        plan: { in: PAID_PLANS },
        endDate: { lt: cutoffDate },
        status: { in: ['canceled', 'past_due'] }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            clinicId: true
          }
        }
      }
    }) as Array<{
      id: string;
      userId: string;
      plan: SubscriptionPlan;
      status: string;
      endDate: Date | null;
      user: {
        id: string;
        email: string;
        clinicId: string;
      };
    }>;

    logger.info(`📊 Encontradas ${expiredSubscriptions.length} subscriptions expiradas há mais de 30 dias`);

    let deletedCount = 0;
    let errorCount = 0;

    for (const subscription of expiredSubscriptions) {
      try {
        const userId = subscription.userId;
        const clinicId = subscription.user.clinicId;

        logger.info(`🗑️  Excluindo dados do usuário ${subscription.user.email} (ID: ${userId})`);

        // Excluir todos os dados relacionados ao usuário (cascade já faz isso, mas vamos ser explícitos)
        // O Prisma já cuida do cascade devido às relações definidas no schema
        
        // Excluir subscription primeiro
        await prisma.subscription.delete({
          where: { id: subscription.id }
        });

        // Excluir o usuário (isso vai excluir todos os dados relacionados devido ao cascade)
        await prisma.user.delete({
          where: { id: userId }
        });

        deletedCount++;
        logger.info(`✅ Dados excluídos para usuário ${subscription.user.email}`);

      } catch (error: any) {
        errorCount++;
        logger.error(`❌ Erro ao excluir dados do usuário ${subscription.user.email}:`, error.message);
      }
    }

    logger.info(`\n📈 Resumo da limpeza:`);
    logger.info(`   ✅ Excluídos: ${deletedCount}`);
    logger.info(`   ❌ Erros: ${errorCount}`);
    logger.info(`\n🎉 Limpeza concluída!`);

    return { deletedCount, errorCount };
  } catch (error) {
    logger.error('❌ Erro ao executar limpeza de dados:', error);
    throw error;
  }
}

// Se executado diretamente (não como módulo)
if (require.main === module) {
  cleanupExpiredData()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Erro fatal na limpeza:', error);
      process.exit(1);
    });
}
