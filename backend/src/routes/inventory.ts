import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// =====================================================
// PRODUTOS
// =====================================================

// GET /api/inventory/products - Listar todos os produtos
router.get('/products', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, lowStock, expiring } = req.query;
    
    const where: any = { userId: req.userId };
    
    if (category && category !== 'all') {
      where.category = category;
    }

    const products = await prisma.inventoryProduct.findMany({
      where,
      include: {
        procedures: true,
        movements: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    let result = products.map(p => ({
      id: p.id,
      userId: p.userId,
      name: p.name,
      description: p.description,
      barcode: p.barcode,
      sku: p.sku,
      category: p.category,
      unit: p.unit,
      currentStock: Number(p.currentStock),
      minStock: Number(p.minStock),
      maxStock: p.maxStock ? Number(p.maxStock) : null,
      costPrice: Number(p.costPrice),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      supplier: p.supplier,
      location: p.location,
      expirationDate: p.expirationDate ? Number(p.expirationDate) : null,
      batchNumber: p.batchNumber,
      isActive: p.isActive,
      createdAt: p.createdAt.getTime(),
      updatedAt: p.updatedAt.getTime(),
      procedures: p.procedures.map(proc => ({
        id: proc.id,
        productId: proc.productId,
        procedureName: proc.procedureName,
        quantityPerUse: Number(proc.quantityPerUse),
        isRequired: proc.isRequired,
        notes: proc.notes
      })),
      recentMovements: p.movements.map(m => ({
        id: m.id,
        type: m.type,
        quantity: Number(m.quantity),
        createdAt: m.createdAt.getTime()
      }))
    }));

    // Filtrar por estoque baixo
    if (lowStock === 'true') {
      result = result.filter(p => p.currentStock <= p.minStock);
    }

    // Filtrar por produtos vencendo (próximos 30 dias)
    if (expiring === 'true') {
      const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
      result = result.filter(p => 
        p.expirationDate && p.expirationDate <= thirtyDaysFromNow
      );
    }

    res.json(result);
  } catch (error) {
    console.error('Erro get products:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// GET /api/inventory/products/:id - Buscar produto por ID
router.get('/products/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.inventoryProduct.findFirst({
      where: { id, userId: req.userId },
      include: {
        procedures: true,
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    res.json({
      id: product.id,
      userId: product.userId,
      name: product.name,
      description: product.description,
      barcode: product.barcode,
      sku: product.sku,
      category: product.category,
      unit: product.unit,
      currentStock: Number(product.currentStock),
      minStock: Number(product.minStock),
      maxStock: product.maxStock ? Number(product.maxStock) : null,
      costPrice: Number(product.costPrice),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      supplier: product.supplier,
      location: product.location,
      expirationDate: product.expirationDate ? Number(product.expirationDate) : null,
      batchNumber: product.batchNumber,
      isActive: product.isActive,
      createdAt: product.createdAt.getTime(),
      updatedAt: product.updatedAt.getTime(),
      procedures: product.procedures,
      movements: product.movements.map(m => ({
        id: m.id,
        type: m.type,
        quantity: Number(m.quantity),
        previousStock: Number(m.previousStock),
        newStock: Number(m.newStock),
        unitCost: m.unitCost ? Number(m.unitCost) : null,
        totalCost: m.totalCost ? Number(m.totalCost) : null,
        reason: m.reason,
        batchNumber: m.batchNumber,
        invoiceNumber: m.invoiceNumber,
        createdAt: m.createdAt.getTime()
      }))
    });
  } catch (error) {
    console.error('Erro get product:', error);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// GET /api/inventory/products/barcode/:barcode - Buscar produto por código de barras
router.get('/products/barcode/:barcode', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { barcode } = req.params;

    const product = await prisma.inventoryProduct.findFirst({
      where: { barcode, userId: req.userId }
    });

    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    res.json({
      id: product.id,
      name: product.name,
      currentStock: Number(product.currentStock),
      unit: product.unit,
      costPrice: Number(product.costPrice)
    });
  } catch (error) {
    console.error('Erro get product by barcode:', error);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// POST /api/inventory/products - Criar produto
router.post('/products', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name, description, barcode, sku, category, unit,
      currentStock, minStock, maxStock, costPrice, salePrice,
      supplier, location, expirationDate, batchNumber
    } = req.body;

    const product = await prisma.inventoryProduct.create({
      data: {
        userId: req.userId!,
        name,
        description,
        barcode,
        sku,
        category: category || 'Geral',
        unit: unit || 'un',
        currentStock: currentStock || 0,
        minStock: minStock || 0,
        maxStock,
        costPrice: costPrice || 0,
        salePrice,
        supplier,
        location,
        expirationDate: expirationDate ? BigInt(expirationDate) : null,
        batchNumber
      }
    });

    // Se tiver estoque inicial, criar movimentação de entrada
    if (currentStock && currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          userId: req.userId!,
          type: 'entrada',
          quantity: currentStock,
          previousStock: 0,
          newStock: currentStock,
          unitCost: costPrice || 0,
          totalCost: (costPrice || 0) * currentStock,
          reason: 'Estoque inicial',
          batchNumber,
          expirationDate: expirationDate ? BigInt(expirationDate) : null
        }
      });
    }

    // Verificar e criar alerta se necessário
    await checkAndCreateAlerts(product.id, req.userId!);

    res.status(201).json({
      id: product.id,
      name: product.name,
      currentStock: Number(product.currentStock),
      createdAt: product.createdAt.getTime()
    });
  } catch (error) {
    console.error('Erro create product:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// PUT /api/inventory/products/:id - Atualizar produto
router.put('/products/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name, description, barcode, sku, category, unit,
      minStock, maxStock, costPrice, salePrice,
      supplier, location, expirationDate, batchNumber, isActive
    } = req.body;

    const product = await prisma.inventoryProduct.update({
      where: { id, userId: req.userId },
      data: {
        name,
        description,
        barcode,
        sku,
        category,
        unit,
        minStock,
        maxStock,
        costPrice,
        salePrice,
        supplier,
        location,
        expirationDate: expirationDate ? BigInt(expirationDate) : null,
        batchNumber,
        isActive
      }
    });

    // Verificar e criar alerta se necessário
    await checkAndCreateAlerts(product.id, req.userId!);

    res.json({
      id: product.id,
      name: product.name,
      updatedAt: product.updatedAt.getTime()
    });
  } catch (error) {
    console.error('Erro update product:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// DELETE /api/inventory/products/:id - Deletar produto
router.delete('/products/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.inventoryProduct.delete({
      where: { id, userId: req.userId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro delete product:', error);
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

// =====================================================
// MOVIMENTAÇÕES DE ESTOQUE
// =====================================================

// GET /api/inventory/movements - Listar movimentações
router.get('/movements', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, type, startDate, endDate, staffId, limit: limitParam = '100', offset: offsetParam } = req.query;

    const where: any = {};

    // Filtrar por produtos do usuário
    if (productId) {
      where.productId = productId;
    } else {
      where.product = { userId: req.userId };
    }

    if (type) {
      where.type = type;
    }

    if (staffId) {
      where.staffId = staffId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(Number(startDate));
      if (endDate) where.createdAt.lte = new Date(Number(endDate));
    }

    const limit = parseInt(limitParam as string);
    const offset = offsetParam ? parseInt(offsetParam as string) : 0;

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: {
            select: { name: true, unit: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.stockMovement.count({ where })
    ]);

    // Buscar nomes dos staff
    const staffIds = movements.map(m => m.staffId).filter(Boolean) as string[];
    const staffMembers = staffIds.length > 0 
      ? await prisma.staff.findMany({ where: { id: { in: staffIds } } })
      : [];
    const staffMap = new Map(staffMembers.map(s => [s.id, s.name]));

    res.json({
      data: movements.map(m => ({
        id: m.id,
        productId: m.productId,
        productName: m.product.name,
        productUnit: m.product.unit,
        userId: m.userId,
        staffId: m.staffId,
        staffName: m.staffId ? staffMap.get(m.staffId) : null,
        type: m.type,
        quantity: Number(m.quantity),
        previousStock: Number(m.previousStock),
        newStock: Number(m.newStock),
        unitCost: m.unitCost ? Number(m.unitCost) : null,
        totalCost: m.totalCost ? Number(m.totalCost) : null,
        reason: m.reason,
        appointmentId: m.appointmentId,
        patientName: m.patientName,
        batchNumber: m.batchNumber,
        expirationDate: m.expirationDate ? Number(m.expirationDate) : null,
        invoiceNumber: m.invoiceNumber,
        createdAt: m.createdAt.getTime()
      })),
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Erro get movements:', error);
    res.status(500).json({ error: 'Erro ao buscar movimentações' });
  }
});

// POST /api/inventory/movements - Criar movimentação
router.post('/movements', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      productId, type, quantity, reason, staffId,
      appointmentId, patientName, batchNumber, expirationDate,
      invoiceNumber, unitCost
    } = req.body;

    // Buscar produto atual
    const product = await prisma.inventoryProduct.findFirst({
      where: { id: productId, userId: req.userId }
    });

    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    const currentStock = Number(product.currentStock);
    let newStock = currentStock;
    let calculatedUnitCost = unitCost || Number(product.costPrice);

    // Calcular novo estoque baseado no tipo
    switch (type) {
      case 'entrada':
        newStock = currentStock + quantity;
        break;
      case 'saida':
      case 'perda':
      case 'vencido':
        newStock = currentStock - quantity;
        if (newStock < 0) {
          res.status(400).json({ error: 'Estoque insuficiente' });
          return;
        }
        break;
      case 'ajuste':
        newStock = quantity; // Ajuste define o valor absoluto
        break;
    }

    const totalCost = calculatedUnitCost * (type === 'ajuste' ? Math.abs(quantity - currentStock) : quantity);

    // Criar movimentação
    const movement = await prisma.stockMovement.create({
      data: {
        productId,
        userId: req.userId!,
        staffId,
        type,
        quantity,
        previousStock: currentStock,
        newStock,
        unitCost: calculatedUnitCost,
        totalCost,
        reason,
        appointmentId,
        patientName,
        batchNumber: batchNumber || product.batchNumber,
        expirationDate: expirationDate ? BigInt(expirationDate) : product.expirationDate,
        invoiceNumber
      }
    });

    // Atualizar estoque do produto
    await prisma.inventoryProduct.update({
      where: { id: productId },
      data: {
        currentStock: newStock,
        ...(type === 'entrada' && batchNumber ? { batchNumber } : {}),
        ...(type === 'entrada' && expirationDate ? { expirationDate: BigInt(expirationDate) } : {}),
        ...(type === 'entrada' && unitCost ? { costPrice: unitCost } : {})
      }
    });

    // Verificar e criar alertas
    await checkAndCreateAlerts(productId, req.userId!);

    res.status(201).json({
      id: movement.id,
      productId: movement.productId,
      type: movement.type,
      quantity: Number(movement.quantity),
      previousStock: Number(movement.previousStock),
      newStock: Number(movement.newStock),
      createdAt: movement.createdAt.getTime()
    });
  } catch (error) {
    console.error('Erro create movement:', error);
    res.status(500).json({ error: 'Erro ao criar movimentação' });
  }
});

// POST /api/inventory/movements/bulk - Baixa em lote (para procedimentos)
router.post('/movements/bulk', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, staffId, appointmentId, patientName, reason } = req.body;

    const results = [];

    for (const item of items) {
      const { productId, quantity } = item;

      const product = await prisma.inventoryProduct.findFirst({
        where: { id: productId, userId: req.userId }
      });

      if (!product) continue;

      const currentStock = Number(product.currentStock);
      const newStock = currentStock - quantity;

      if (newStock < 0) continue;

      const movement = await prisma.stockMovement.create({
        data: {
          productId,
          userId: req.userId!,
          staffId,
          type: 'saida',
          quantity,
          previousStock: currentStock,
          newStock,
          unitCost: Number(product.costPrice),
          totalCost: Number(product.costPrice) * quantity,
          reason: reason || 'Baixa por procedimento',
          appointmentId,
          patientName
        }
      });

      await prisma.inventoryProduct.update({
        where: { id: productId },
        data: { currentStock: newStock }
      });

      await checkAndCreateAlerts(productId, req.userId!);

      results.push({
        productId,
        quantity,
        newStock
      });
    }

    res.status(201).json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error('Erro bulk movement:', error);
    res.status(500).json({ error: 'Erro ao processar baixas' });
  }
});

// =====================================================
// VINCULAÇÃO PRODUTO-PROCEDIMENTO
// =====================================================

// GET /api/inventory/procedures - Listar procedimentos vinculados
router.get('/procedures', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const procedures = await prisma.productProcedure.findMany({
      where: {
        product: { userId: req.userId }
      },
      include: {
        product: {
          select: { name: true, unit: true, currentStock: true }
        }
      },
      orderBy: { procedureName: 'asc' }
    });

    res.json(procedures.map(p => ({
      id: p.id,
      productId: p.productId,
      productName: p.product.name,
      productUnit: p.product.unit,
      productStock: Number(p.product.currentStock),
      procedureName: p.procedureName,
      quantityPerUse: Number(p.quantityPerUse),
      isRequired: p.isRequired,
      notes: p.notes
    })));
  } catch (error) {
    console.error('Erro get procedures:', error);
    res.status(500).json({ error: 'Erro ao buscar procedimentos' });
  }
});

// GET /api/inventory/procedures/:procedureName - Buscar insumos de um procedimento
router.get('/procedures/:procedureName', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { procedureName } = req.params;

    const procedures = await prisma.productProcedure.findMany({
      where: {
        procedureName: { contains: procedureName, mode: 'insensitive' },
        product: { userId: req.userId }
      },
      include: {
        product: {
          select: { name: true, unit: true, currentStock: true, costPrice: true }
        }
      }
    });

    res.json(procedures.map(p => ({
      id: p.id,
      productId: p.productId,
      productName: p.product.name,
      productUnit: p.product.unit,
      productStock: Number(p.product.currentStock),
      productCost: Number(p.product.costPrice),
      procedureName: p.procedureName,
      quantityPerUse: Number(p.quantityPerUse),
      isRequired: p.isRequired,
      notes: p.notes,
      totalCost: Number(p.quantityPerUse) * Number(p.product.costPrice)
    })));
  } catch (error) {
    console.error('Erro get procedure items:', error);
    res.status(500).json({ error: 'Erro ao buscar insumos do procedimento' });
  }
});

// POST /api/inventory/procedures - Criar vinculação
router.post('/procedures', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, procedureName, quantityPerUse, isRequired, notes } = req.body;

    // Verificar se produto pertence ao usuário
    const product = await prisma.inventoryProduct.findFirst({
      where: { id: productId, userId: req.userId }
    });

    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    const procedure = await prisma.productProcedure.create({
      data: {
        productId,
        procedureName,
        quantityPerUse,
        isRequired: isRequired ?? true,
        notes
      }
    });

    res.status(201).json({
      id: procedure.id,
      productId: procedure.productId,
      procedureName: procedure.procedureName,
      quantityPerUse: Number(procedure.quantityPerUse)
    });
  } catch (error) {
    console.error('Erro create procedure link:', error);
    res.status(500).json({ error: 'Erro ao criar vinculação' });
  }
});

// DELETE /api/inventory/procedures/:id - Remover vinculação
router.delete('/procedures/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.productProcedure.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro delete procedure link:', error);
    res.status(500).json({ error: 'Erro ao remover vinculação' });
  }
});

// =====================================================
// ALERTAS
// =====================================================

// GET /api/inventory/alerts - Listar alertas
router.get('/alerts', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { unreadOnly } = req.query;

    const where: any = { userId: req.userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const alerts = await prisma.stockAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Buscar nomes dos produtos
    const productIds = alerts.map(a => a.productId);
    const products = await prisma.inventoryProduct.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });
    const productMap = new Map(products.map(p => [p.id, p.name]));

    res.json(alerts.map(a => ({
      id: a.id,
      productId: a.productId,
      productName: productMap.get(a.productId) || 'Produto removido',
      alertType: a.alertType,
      currentStock: Number(a.currentStock),
      minStock: Number(a.minStock),
      expirationDate: a.expirationDate ? Number(a.expirationDate) : null,
      daysUntilExpiry: a.daysUntilExpiry,
      isRead: a.isRead,
      createdAt: a.createdAt.getTime()
    })));
  } catch (error) {
    console.error('Erro get alerts:', error);
    res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
});

// PUT /api/inventory/alerts/:id/read - Marcar alerta como lido
router.put('/alerts/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.stockAlert.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro mark alert read:', error);
    res.status(500).json({ error: 'Erro ao marcar alerta' });
  }
});

// PUT /api/inventory/alerts/read-all - Marcar todos alertas como lidos
router.put('/alerts/read-all', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.stockAlert.updateMany({
      where: { userId: req.userId, isRead: false },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro mark all alerts read:', error);
    res.status(500).json({ error: 'Erro ao marcar alertas' });
  }
});

// =====================================================
// RELATÓRIOS
// =====================================================

// GET /api/inventory/reports/consumption - Relatório de consumo
router.get('/reports/consumption', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, staffId } = req.query;

    const start = startDate ? new Date(Number(startDate)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(Number(endDate)) : new Date();

    const where: any = {
      product: { userId: req.userId },
      type: { in: ['saida', 'perda', 'vencido'] },
      createdAt: { gte: start, lte: end }
    };

    if (staffId) {
      where.staffId = staffId;
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { name: true, category: true } }
      }
    });

    // Agrupar por produto
    const byProduct: Record<string, { name: string; quantity: number; totalCost: number }> = {};
    movements.forEach(m => {
      if (!byProduct[m.productId]) {
        byProduct[m.productId] = {
          name: m.product.name,
          quantity: 0,
          totalCost: 0
        };
      }
      byProduct[m.productId].quantity += Number(m.quantity);
      byProduct[m.productId].totalCost += Number(m.totalCost || 0);
    });

    const topConsumed = Object.entries(byProduct)
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        quantity: data.quantity,
        totalCost: data.totalCost
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 20);

    // Agrupar por profissional
    const staffIds = movements.map(m => m.staffId).filter(Boolean) as string[];
    const staffMembers = staffIds.length > 0
      ? await prisma.staff.findMany({ where: { id: { in: staffIds } } })
      : [];
    const staffMap = new Map(staffMembers.map(s => [s.id, s.name]));

    const byStaff: Record<string, { name: string; quantity: number; totalCost: number; products: Record<string, number> }> = {};
    movements.forEach(m => {
      if (!m.staffId) return;
      if (!byStaff[m.staffId]) {
        byStaff[m.staffId] = {
          name: staffMap.get(m.staffId) || 'Desconhecido',
          quantity: 0,
          totalCost: 0,
          products: {}
        };
      }
      byStaff[m.staffId].quantity += Number(m.quantity);
      byStaff[m.staffId].totalCost += Number(m.totalCost || 0);
      byStaff[m.staffId].products[m.product.name] = (byStaff[m.staffId].products[m.product.name] || 0) + Number(m.quantity);
    });

    const byProfessional = Object.entries(byStaff).map(([staffId, data]) => ({
      staffId,
      staffName: data.name,
      totalConsumed: data.quantity,
      totalCost: data.totalCost,
      products: Object.entries(data.products).map(([name, qty]) => ({ productName: name, quantity: qty }))
    }));

    res.json({
      period: { start: start.getTime(), end: end.getTime() },
      totalMovements: movements.length,
      totalQuantity: movements.reduce((acc, m) => acc + Number(m.quantity), 0),
      totalCost: movements.reduce((acc, m) => acc + Number(m.totalCost || 0), 0),
      topConsumed,
      byProfessional
    });
  } catch (error) {
    console.error('Erro get consumption report:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

// GET /api/inventory/reports/valuation - Relatório de valorização do estoque
router.get('/reports/valuation', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await prisma.inventoryProduct.findMany({
      where: { userId: req.userId, isActive: true }
    });

    const totalProducts = products.length;
    const totalValue = products.reduce((acc, p) => acc + (Number(p.currentStock) * Number(p.costPrice)), 0);
    const lowStockCount = products.filter(p => Number(p.currentStock) <= Number(p.minStock)).length;
    
    const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
    const expiringProducts = products
      .filter(p => p.expirationDate && Number(p.expirationDate) <= thirtyDaysFromNow)
      .map(p => ({
        productId: p.id,
        productName: p.name,
        expirationDate: Number(p.expirationDate),
        daysUntilExpiry: Math.ceil((Number(p.expirationDate) - Date.now()) / (24 * 60 * 60 * 1000)),
        stock: Number(p.currentStock),
        value: Number(p.currentStock) * Number(p.costPrice)
      }))
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    // Agrupar por categoria
    const byCategory: Record<string, { count: number; value: number }> = {};
    products.forEach(p => {
      if (!byCategory[p.category]) {
        byCategory[p.category] = { count: 0, value: 0 };
      }
      byCategory[p.category].count++;
      byCategory[p.category].value += Number(p.currentStock) * Number(p.costPrice);
    });

    res.json({
      totalProducts,
      totalValue,
      lowStockCount,
      expiringCount: expiringProducts.length,
      expiringProducts: expiringProducts.slice(0, 10),
      byCategory: Object.entries(byCategory).map(([category, data]) => ({
        category,
        count: data.count,
        value: data.value
      }))
    });
  } catch (error) {
    console.error('Erro get valuation report:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

// GET /api/inventory/categories - Listar categorias únicas
router.get('/categories', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await prisma.inventoryProduct.findMany({
      where: { userId: req.userId },
      select: { category: true },
      distinct: ['category']
    });

    res.json(products.map(p => p.category));
  } catch (error) {
    console.error('Erro get categories:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

async function checkAndCreateAlerts(productId: string, userId: string) {
  const product = await prisma.inventoryProduct.findUnique({
    where: { id: productId }
  });

  if (!product) return;

  const currentStock = Number(product.currentStock);
  const minStock = Number(product.minStock);

  // Verificar estoque baixo
  if (currentStock <= minStock && currentStock > 0) {
    await prisma.stockAlert.upsert({
      where: {
        id: `${productId}-low_stock`
      },
      update: {
        currentStock,
        minStock,
        isRead: false,
        createdAt: new Date()
      },
      create: {
        id: `${productId}-low_stock`,
        userId,
        productId,
        alertType: 'low_stock',
        currentStock,
        minStock
      }
    });
  }

  // Verificar estoque zerado
  if (currentStock === 0) {
    await prisma.stockAlert.upsert({
      where: {
        id: `${productId}-out_of_stock`
      },
      update: {
        currentStock: 0,
        minStock,
        isRead: false,
        createdAt: new Date()
      },
      create: {
        id: `${productId}-out_of_stock`,
        userId,
        productId,
        alertType: 'out_of_stock',
        currentStock: 0,
        minStock
      }
    });
  }

  // Verificar validade
  if (product.expirationDate) {
    const expirationDate = Number(product.expirationDate);
    const daysUntilExpiry = Math.ceil((expirationDate - Date.now()) / (24 * 60 * 60 * 1000));

    if (daysUntilExpiry <= 0) {
      await prisma.stockAlert.upsert({
        where: {
          id: `${productId}-expired`
        },
        update: {
          currentStock,
          minStock,
          expirationDate: BigInt(expirationDate),
          daysUntilExpiry,
          isRead: false,
          createdAt: new Date()
        },
        create: {
          id: `${productId}-expired`,
          userId,
          productId,
          alertType: 'expired',
          currentStock,
          minStock,
          expirationDate: BigInt(expirationDate),
          daysUntilExpiry
        }
      });
    } else if (daysUntilExpiry <= 30) {
      await prisma.stockAlert.upsert({
        where: {
          id: `${productId}-expiring`
        },
        update: {
          currentStock,
          minStock,
          expirationDate: BigInt(expirationDate),
          daysUntilExpiry,
          isRead: false,
          createdAt: new Date()
        },
        create: {
          id: `${productId}-expiring`,
          userId,
          productId,
          alertType: 'expiring',
          currentStock,
          minStock,
          expirationDate: BigInt(expirationDate),
          daysUntilExpiry
        }
      });
    }
  }
}

export default router;







