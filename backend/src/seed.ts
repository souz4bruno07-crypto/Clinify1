import prisma from './config/database.js';

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar categorias padrão
  const defaultCategories = [
    { name: 'Procedimentos', type: 'revenue' as const },
    { name: 'Consultas', type: 'revenue' as const },
    { name: 'Produtos', type: 'revenue' as const },
    { name: 'Insumos', type: 'expense_variable' as const },
    { name: 'Marketing', type: 'expense_variable' as const },
    { name: 'Aluguel', type: 'expense_fixed' as const },
    { name: 'Salários', type: 'expense_fixed' as const },
    { name: 'Custos Fixos', type: 'expense_fixed' as const },
  ];

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { id: cat.name.toLowerCase().replace(/\s/g, '-') },
      update: {},
      create: {
        id: cat.name.toLowerCase().replace(/\s/g, '-'),
        name: cat.name,
        type: cat.type,
        userId: null
      }
    });
  }

  console.log('✅ Categorias padrão criadas!');
  console.log('🎉 Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });













