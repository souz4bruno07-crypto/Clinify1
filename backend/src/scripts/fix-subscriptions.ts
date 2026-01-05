/**
 * Script para criar subscriptions para usuários que não têm
 * Executa: npx tsx src/scripts/fix-subscriptions.ts
 */

import prisma from '../config/database.js';
import { logger } from '../config/logger.js';

async function fixSubscriptions() {
  try {
    logger.info('🔍 Buscando usuários sem subscription...');

    // Buscar todos os usuários
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    logger.info(`📊 Total de usuários encontrados: ${allUsers.length}`);

    // Buscar usuários que já têm subscription
    const usersWithSubscription = await prisma.subscription.findMany({
      select: {
        userId: true
      }
    });

    const userIdsWithSubscription = new Set(usersWithSubscription.map(s => s.userId));
    const usersWithoutSubscription = allUsers.filter(u => !userIdsWithSubscription.has(u.id));

    logger.info(`⚠️  Usuários sem subscription: ${usersWithoutSubscription.length}`);

    if (usersWithoutSubscription.length === 0) {
      logger.info('✅ Todos os usuários já têm subscription!');
      return;
    }

    // Criar subscriptions para usuários sem
    let created = 0;
    let errors = 0;

    for (const user of usersWithoutSubscription) {
      try {
        // Calcular data de início (data de criação do usuário ou hoje)
        const startDate = user.createdAt || new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 14); // Trial de 14 dias

        // Verificar se o trial já expirou
        const now = new Date();
        const isTrialExpired = endDate < now;

        await prisma.subscription.create({
          data: {
            userId: user.id,
            plan: 'free',
            status: isTrialExpired ? 'canceled' : 'trialing', // Se expirou, marcar como cancelado
            startDate: startDate,
            endDate: endDate, // Manter a data original de expiração
            cancelAtPeriodEnd: false,
            canceledAt: isTrialExpired ? now : null
          }
        });

        // Atualizar o plano do usuário também
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: 'free' }
        });

        created++;
        logger.info(`✅ Subscription criada para: ${user.name} (${user.email})`);
      } catch (error: any) {
        errors++;
        logger.error(`❌ Erro ao criar subscription para ${user.email}:`, error.message);
      }
    }

    logger.info(`\n📈 Resumo:`);
    logger.info(`   ✅ Criadas: ${created}`);
    logger.info(`   ❌ Erros: ${errors}`);
    logger.info(`\n🎉 Processo concluído!`);

  } catch (error) {
    logger.error('❌ Erro ao executar script:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
fixSubscriptions();
