/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Endpoints de autenticação e autorização
 *   - name: Transactions
 *     description: Gerenciamento de transações financeiras
 *   - name: Patients
 *     description: Gerenciamento de pacientes
 *   - name: Staff
 *     description: Gerenciamento de equipe e colaboradores
 *   - name: Appointments
 *     description: Gerenciamento de agendamentos
 *   - name: Quotes
 *     description: Gerenciamento de orçamentos
 *   - name: Inventory
 *     description: Controle de estoque e inventário
 *   - name: Chat
 *     description: Sistema de chat e CRM
 *   - name: Prescriptions
 *     description: Gerenciamento de prescrições médicas
 *   - name: Categories
 *     description: Gerenciamento de categorias
 *   - name: Targets
 *     description: Metas financeiras mensais
 *   - name: Users
 *     description: Gerenciamento de usuários
 *   - name: Billing
 *     description: Assinaturas e cobrança
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Criar nova conta
 *     description: Registra um novo usuário no sistema
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - clinicName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: medico@clinica.com.br
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: senha123
 *               name:
 *                 type: string
 *                 example: Dr. João Silva
 *               clinicName:
 *                 type: string
 *                 example: Clínica Estética Premium
 *     responses:
 *       201:
 *         description: Conta criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Email já cadastrado ou dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     tags: [Auth]
 *     summary: Fazer login
 *     description: Autentica um usuário e retorna o token JWT
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: medico@clinica.com.br
 *               password:
 *                 type: string
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       401:
 *         description: Credenciais inválidas
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Obter dados do usuário autenticado
 *     description: Retorna os dados do usuário atual baseado no token JWT
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Não autenticado
 */

/**
 * @swagger
 * /api/auth/complete-onboarding:
 *   put:
 *     tags: [Auth]
 *     summary: Completar onboarding
 *     description: Marca o onboarding como completo para o usuário
 *     responses:
 *       200:
 *         description: Onboarding completado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Solicitar reset de senha
 *     description: Envia email com instruções para reset de senha
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email enviado (se o email existir)
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: Listar transações
 *     description: Retorna lista paginada de transações financeiras
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número máximo de registros
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de registros a pular
 *     responses:
 *       200:
 *         description: Lista de transações
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *   post:
 *     tags: [Transactions]
 *     summary: Criar transação
 *     description: Cria uma nova transação financeira
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - amount
 *               - type
 *               - date
 *             properties:
 *               description:
 *                 type: string
 *                 example: Consulta médica
 *               amount:
 *                 type: number
 *                 example: 350.00
 *               type:
 *                 type: string
 *                 enum: [revenue, expense]
 *               category:
 *                 type: string
 *                 example: Consultas
 *               date:
 *                 type: integer
 *                 format: int64
 *                 example: 1704067200000
 *               patientName:
 *                 type: string
 *                 nullable: true
 *               paymentMethod:
 *                 type: string
 *                 enum: [pix, credit, debit, cash]
 *               isPaid:
 *                 type: boolean
 *                 default: true
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Transação criada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 */

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     tags: [Transactions]
 *     summary: Atualizar transação
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transaction'
 *     responses:
 *       200:
 *         description: Transação atualizada
 *   delete:
 *     tags: [Transactions]
 *     summary: Deletar transação
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transação deletada

 * @swagger
 * /api/transactions/bulk:
 *   post:
 *     tags: [Transactions]
 *     summary: Criar múltiplas transações
 *     description: Importa várias transações de uma vez
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactions:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Transaction'
 *     responses:
 *       201:
 *         description: Transações criadas
 */

/**
 * @swagger
 * /api/transactions/seed:
 *   post:
 *     tags: [Transactions]
 *     summary: Criar dados de exemplo
 *     description: Gera dados mock para teste (staff, pacientes, agendamentos, transações, etc)
 *     responses:
 *       200:
 *         description: Dados criados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 created:
 *                   type: object
 *                   properties:
 *                     staff:
 *                       type: integer
 *                     patients:
 *                       type: integer
 *                     appointments:
 *                       type: integer
 *                     transactions:
 *                       type: integer
 */

/**
 * @swagger
 * /api/patients:
 *   get:
 *     tags: [Patients]
 *     summary: Listar pacientes
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de pacientes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *   post:
 *     tags: [Patients]
 *     summary: Criar paciente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       201:
 *         description: Paciente criado
 */

/**
 * @swagger
 * /api/patients/{id}:
 *   put:
 *     tags: [Patients]
 *     summary: Atualizar paciente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       200:
 *         description: Paciente atualizado
 *   delete:
 *     tags: [Patients]
 *     summary: Deletar paciente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paciente deletado
 */

/**
 * @swagger
 * /api/patients/birthdays:
 *   get:
 *     tags: [Patients]
 *     summary: Aniversariantes próximos
 *     description: Retorna pacientes com aniversário nos próximos 7 dias
 *     responses:
 *       200:
 *         description: Lista de aniversariantes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   daysUntil:
 *                     type: integer
 */

/**
 * @swagger
 * /api/staff:
 *   get:
 *     tags: [Staff]
 *     summary: Listar equipe
 *     responses:
 *       200:
 *         description: Lista de membros da equipe
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Staff'
 *   post:
 *     tags: [Staff]
 *     summary: Adicionar membro da equipe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dra. Marina Santos
 *               role:
 *                 type: string
 *                 example: Médica Dermatologista
 *               color:
 *                 type: string
 *                 example: "#8B5CF6"
 *               commissionRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 40
 *               phone:
 *                 type: string
 *                 example: "(11) 99876-5432"
 *     responses:
 *       201:
 *         description: Membro adicionado
 */

/**
 * @swagger
 * /api/staff/{id}:
 *   put:
 *     tags: [Staff]
 *     summary: Atualizar membro da equipe
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Staff'
 *     responses:
 *       200:
 *         description: Membro atualizado
 *   delete:
 *     tags: [Staff]
 *     summary: Remover membro da equipe
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Membro removido
 */

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     tags: [Appointments]
 *     summary: Listar agendamentos
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           format: int64
 *         description: Timestamp início (opcional)
 *       - in: query
 *         name: end
 *         schema:
 *           type: integer
 *           format: int64
 *         description: Timestamp fim (opcional)
 *     responses:
 *       200:
 *         description: Lista de agendamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 *   post:
 *     tags: [Appointments]
 *     summary: Criar agendamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - patientName
 *               - startTime
 *               - endTime
 *               - serviceName
 *             properties:
 *               patientId:
 *                 type: string
 *               patientName:
 *                 type: string
 *               staffId:
 *                 type: string
 *               startTime:
 *                 type: integer
 *                 format: int64
 *               endTime:
 *                 type: integer
 *                 format: int64
 *               serviceName:
 *                 type: string
 *                 example: Botox 3 Áreas
 *               status:
 *                 type: string
 *                 enum: [scheduled, confirmed, completed, canceled]
 *                 default: scheduled
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Agendamento criado
 */

/**
 * @swagger
 * /api/appointments/today:
 *   get:
 *     tags: [Appointments]
 *     summary: Agendamentos de hoje
 *     description: Retorna todos os agendamentos do dia atual
 *     responses:
 *       200:
 *         description: Lista de agendamentos
 */

/**
 * @swagger
 * /api/appointments/{id}:
 *   put:
 *     tags: [Appointments]
 *     summary: Atualizar agendamento
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       200:
 *         description: Agendamento atualizado
 *   delete:
 *     tags: [Appointments]
 *     summary: Cancelar/deletar agendamento
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agendamento deletado
 */

/**
 * @swagger
 * /api/quotes:
 *   get:
 *     tags: [Quotes]
 *     summary: Listar orçamentos
 *     responses:
 *       200:
 *         description: Lista de orçamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Quote'
 *   post:
 *     tags: [Quotes]
 *     summary: Criar orçamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - patientName
 *             properties:
 *               patientId:
 *                 type: string
 *               patientName:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     price:
 *                       type: number
 *               totalAmount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [draft, sent, approved, rejected]
 *               validUntil:
 *                 type: integer
 *                 format: int64
 *     responses:
 *       201:
 *         description: Orçamento criado
 */

/**
 * @swagger
 * /api/quotes/{id}:
 *   put:
 *     tags: [Quotes]
 *     summary: Atualizar orçamento
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Quote'
 *     responses:
 *       200:
 *         description: Orçamento atualizado
 *   delete:
 *     tags: [Quotes]
 *     summary: Deletar orçamento
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orçamento deletado
 */

/**
 * @swagger
 * /api/inventory/products:
 *   get:
 *     tags: [Inventory]
 *     summary: Listar produtos
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filtrar produtos com estoque baixo
 *       - in: query
 *         name: expiring
 *         schema:
 *           type: boolean
 *         description: Filtrar produtos vencendo em 30 dias
 *     responses:
 *       200:
 *         description: Lista de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryProduct'
 *   post:
 *     tags: [Inventory]
 *     summary: Criar produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - unit
 *             properties:
 *               name:
 *                 type: string
 *                 example: Botox 100U
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 example: Toxinas
 *               unit:
 *                 type: string
 *                 enum: [un, fr, cx, pct, amp]
 *               currentStock:
 *                 type: number
 *                 default: 0
 *               minStock:
 *                 type: number
 *               maxStock:
 *                 type: number
 *               costPrice:
 *                 type: number
 *               supplier:
 *                 type: string
 *               expirationDate:
 *                 type: integer
 *                 format: int64
 *               batchNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Produto criado
 */

/**
 * @swagger
 * /api/inventory/products/{id}:
 *   get:
 *     tags: [Inventory]
 *     summary: Obter produto por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados do produto
 *   put:
 *     tags: [Inventory]
 *     summary: Atualizar produto
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InventoryProduct'
 *     responses:
 *       200:
 *         description: Produto atualizado
 *   delete:
 *     tags: [Inventory]
 *     summary: Deletar produto
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produto deletado
 */

/**
 * @swagger
 * /api/inventory/movements:
 *   get:
 *     tags: [Inventory]
 *     summary: Listar movimentações
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [entrada, saida, perda, vencido, ajuste]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: integer
 *           format: int64
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: Lista de movimentações
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *   post:
 *     tags: [Inventory]
 *     summary: Criar movimentação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - type
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [entrada, saida, perda, vencido, ajuste]
 *               quantity:
 *                 type: number
 *               reason:
 *                 type: string
 *               staffId:
 *                 type: string
 *               patientName:
 *                 type: string
 *               unitCost:
 *                 type: number
 *     responses:
 *       201:
 *         description: Movimentação criada
 */

/**
 * @swagger
 * /api/inventory/alerts:
 *   get:
 *     tags: [Inventory]
 *     summary: Listar alertas de estoque
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Apenas alertas não lidos
 *     responses:
 *       200:
 *         description: Lista de alertas
 */

/**
 * @swagger
 * /api/chat/threads:
 *   get:
 *     tags: [Chat]
 *     summary: Listar conversas
 *     description: Retorna todas as threads de conversa do usuário
 *     responses:
 *       200:
 *         description: Lista de threads
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatThread'
 *   put:
 *     tags: [Chat]
 *     summary: Criar ou atualizar thread
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatThread'
 *     responses:
 *       200:
 *         description: Thread atualizada
 */

/**
 * @swagger
 * /api/chat/messages/{patientId}:
 *   get:
 *     tags: [Chat]
 *     summary: Obter mensagens de um paciente
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de mensagens
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatMessage'
 *   post:
 *     tags: [Chat]
 *     summary: Enviar mensagem
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - content
 *               - direction
 *             properties:
 *               patientId:
 *                 type: string
 *               content:
 *                 type: string
 *               direction:
 *                 type: string
 *                 enum: [inbound, outbound]
 *               timestamp:
 *                 type: integer
 *                 format: int64
 *     responses:
 *       201:
 *         description: Mensagem enviada
 */

/**
 * @swagger
 * /api/chat/contacts:
 *   get:
 *     tags: [Chat]
 *     summary: Listar contatos
 *     description: Retorna lista de pacientes que podem ser contatados
 *     responses:
 *       200:
 *         description: Lista de contatos
 */

/**
 * @swagger
 * /api/prescriptions:
 *   get:
 *     tags: [Prescriptions]
 *     summary: Listar prescrições
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, signed, sent, archived]
 *     responses:
 *       200:
 *         description: Lista de prescrições
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *   post:
 *     tags: [Prescriptions]
 *     summary: Criar prescrição
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Prescription'
 *     responses:
 *       201:
 *         description: Prescrição criada
 */

/**
 * @swagger
 * /api/prescriptions/{id}:
 *   get:
 *     tags: [Prescriptions]
 *     summary: Obter prescrição por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados da prescrição
 *   put:
 *     tags: [Prescriptions]
 *     summary: Atualizar prescrição
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Prescription'
 *     responses:
 *       200:
 *         description: Prescrição atualizada
 *   delete:
 *     tags: [Prescriptions]
 *     summary: Deletar prescrição
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prescrição deletada
 */

/**
 * @swagger
 * /api/prescriptions/patient/{patientId}:
 *   get:
 *     tags: [Prescriptions]
 *     summary: Listar prescrições de um paciente
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de prescrições do paciente
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags: [Categories]
 *     summary: Listar categorias
 *     responses:
 *       200:
 *         description: Lista de categorias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *   post:
 *     tags: [Categories]
 *     summary: Criar categoria
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: Procedimentos
 *               type:
 *                 type: string
 *                 enum: [revenue, expense_fixed, expense_variable]
 *     responses:
 *       201:
 *         description: Categoria criada
 */

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Atualizar categoria
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Categoria atualizada
 *   delete:
 *     tags: [Categories]
 *     summary: Deletar categoria
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoria deletada
 */

/**
 * @swagger
 * /api/targets/{monthYear}:
 *   get:
 *     tags: [Targets]
 *     summary: Obter meta mensal
 *     description: Retorna a meta financeira para um mês específico (formato YYYY-MM)
 *     parameters:
 *       - in: path
 *         name: monthYear
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *           example: '2024-01'
 *     responses:
 *       200:
 *         description: Meta mensal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonthlyTarget'
 *             example: null
 *       404:
 *         description: Meta não encontrada (retorna null)
 */

/**
 * @swagger
 * /api/targets:
 *   put:
 *     tags: [Targets]
 *     summary: Criar ou atualizar meta mensal
 *     description: Cria ou atualiza a meta financeira para um mês específico
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - month_year
 *               - planned_revenue
 *               - planned_purchases
 *             properties:
 *               month_year:
 *                 type: string
 *                 pattern: '^\d{4}-\d{2}$'
 *                 example: '2024-01'
 *               planned_revenue:
 *                 type: number
 *                 example: 80000
 *               planned_purchases:
 *                 type: number
 *                 example: 15000
 *     responses:
 *       200:
 *         description: Meta salva
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonthlyTarget'
 */

/**
 * @swagger
 * /api/users/clinic-members:
 *   get:
 *     tags: [Users]
 *     summary: Listar membros da clínica
 *     description: Retorna todos os usuários da mesma clínica
 *     responses:
 *       200:
 *         description: Lista de membros
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     tags: [Users]
 *     summary: Atualizar perfil
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               clinicName:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Perfil atualizado
 */

/**
 * @swagger
 * /api/billing/subscription:
 *   get:
 *     tags: [Billing]
 *     summary: Obter assinatura atual
 *     responses:
 *       200:
 *         description: Dados da assinatura
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 *       404:
 *         description: Nenhuma assinatura encontrada
 *   post:
 *     tags: [Billing]
 *     summary: Criar ou atualizar assinatura
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [free, basic, professional, enterprise]
 *               status:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Assinatura criada/atualizada
 */

/**
 * @swagger
 * /api/billing/subscription/plan:
 *   put:
 *     tags: [Billing]
 *     summary: Atualizar plano
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [free, basic, professional, enterprise]
 *     responses:
 *       200:
 *         description: Plano atualizado
 */

/**
 * @swagger
 * /api/billing/subscription/cancel:
 *   put:
 *     tags: [Billing]
 *     summary: Cancelar assinatura
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancelAtPeriodEnd:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Assinatura cancelada
 */

/**
 * @swagger
 * /api/billing/plans:
 *   get:
 *     tags: [Billing]
 *     summary: Listar planos disponíveis
 *     description: Retorna todos os planos de assinatura disponíveis
 *     responses:
 *       200:
 *         description: Lista de planos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   price:
 *                     type: number
 *                   features:
 *                     type: array
 *                     items:
 *                       type: string
 *                   limits:
 *                     type: object
 */

export {};

