import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Clinify API',
      version: '1.0.0',
      description: 'API REST para o sistema de gestão clínica Clinify. Documentação completa de todos os endpoints disponíveis.',
      contact: {
        name: 'Suporte Clinify',
        email: 'suporte@clinify.com.br'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de desenvolvimento'
      },
      {
        url: 'https://api.clinify.com.br',
        description: 'Servidor de produção'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido através do endpoint /api/auth/signin'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            clinicName: { type: 'string' },
            clinicId: { type: 'string' },
            onboardingCompleted: { type: 'boolean' },
            role: { type: 'string', enum: ['admin', 'user'] },
            avatar_url: { type: 'string', format: 'uri', nullable: true }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            description: { type: 'string' },
            amount: { type: 'number' },
            type: { type: 'string', enum: ['revenue', 'expense'] },
            category: { type: 'string' },
            date: { type: 'integer', format: 'int64', description: 'Timestamp em milissegundos' },
            patientName: { type: 'string', nullable: true },
            paymentMethod: { type: 'string', enum: ['pix', 'credit', 'debit', 'cash'], nullable: true },
            isPaid: { type: 'boolean' },
            tags: { type: 'array', items: { type: 'string' }, nullable: true }
          }
        },
        Patient: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            name: { type: 'string' },
            phone: { type: 'string', nullable: true },
            email: { type: 'string', format: 'email', nullable: true },
            cpf: { type: 'string', nullable: true },
            birthDate: { type: 'string', format: 'date', nullable: true },
            profession: { type: 'string', nullable: true },
            marketingSource: { type: 'string', nullable: true },
            addressStreet: { type: 'string', nullable: true },
            addressNumber: { type: 'string', nullable: true },
            addressComplement: { type: 'string', nullable: true },
            addressNeighborhood: { type: 'string', nullable: true },
            addressCity: { type: 'string', nullable: true },
            addressState: { type: 'string', nullable: true },
            height: { type: 'number', nullable: true },
            weight: { type: 'number', nullable: true },
            notes: { type: 'string', nullable: true },
            avatarUrl: { type: 'string', format: 'uri', nullable: true }
          }
        },
        Staff: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string' },
            color: { type: 'string', format: 'color' },
            commissionRate: { type: 'number', minimum: 0, maximum: 100 },
            phone: { type: 'string', nullable: true }
          }
        },
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            patientId: { type: 'string' },
            patientName: { type: 'string' },
            staffId: { type: 'string', nullable: true },
            startTime: { type: 'integer', format: 'int64', description: 'Timestamp em milissegundos' },
            endTime: { type: 'integer', format: 'int64', description: 'Timestamp em milissegundos' },
            serviceName: { type: 'string' },
            status: { type: 'string', enum: ['scheduled', 'confirmed', 'completed', 'canceled'] },
            notes: { type: 'string', nullable: true }
          }
        },
        Quote: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            patientId: { type: 'string' },
            patientName: { type: 'string' },
            items: { type: 'array', items: { type: 'object' } },
            mapPoints: { type: 'array', items: { type: 'object' } },
            totalAmount: { type: 'number' },
            status: { type: 'string', enum: ['draft', 'sent', 'approved', 'rejected'] },
            createdAt: { type: 'integer', format: 'int64' },
            validUntil: { type: 'integer', format: 'int64' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string', nullable: true },
            name: { type: 'string' },
            type: { type: 'string', enum: ['revenue', 'expense_fixed', 'expense_variable'] }
          }
        },
        ChatThread: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            user_id: { type: 'string' },
            contact_name: { type: 'string' },
            last_message: { type: 'string', nullable: true },
            last_timestamp: { type: 'integer', format: 'int64', nullable: true },
            avatar_url: { type: 'string', format: 'uri', nullable: true },
            crm_stage: { type: 'string', enum: ['new', 'contacted', 'interested', 'scheduled', 'closed_won', 'closed_lost'] }
          }
        },
        ChatMessage: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            patientId: { type: 'string' },
            content: { type: 'string' },
            direction: { type: 'string', enum: ['inbound', 'outbound'] },
            timestamp: { type: 'integer', format: 'int64' },
            status: { type: 'string', enum: ['sent', 'delivered', 'read'] }
          }
        },
        InventoryProduct: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            barcode: { type: 'string', nullable: true },
            sku: { type: 'string', nullable: true },
            category: { type: 'string' },
            unit: { type: 'string', enum: ['un', 'fr', 'cx', 'pct', 'amp'] },
            currentStock: { type: 'number' },
            minStock: { type: 'number' },
            maxStock: { type: 'number', nullable: true },
            costPrice: { type: 'number' },
            salePrice: { type: 'number', nullable: true },
            supplier: { type: 'string', nullable: true },
            location: { type: 'string', nullable: true },
            expirationDate: { type: 'integer', format: 'int64', nullable: true },
            batchNumber: { type: 'string', nullable: true },
            isActive: { type: 'boolean' }
          }
        },
        StockMovement: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            userId: { type: 'string' },
            staffId: { type: 'string', nullable: true },
            type: { type: 'string', enum: ['entrada', 'saida', 'perda', 'vencido', 'ajuste'] },
            quantity: { type: 'number' },
            previousStock: { type: 'number' },
            newStock: { type: 'number' },
            unitCost: { type: 'number', nullable: true },
            totalCost: { type: 'number', nullable: true },
            reason: { type: 'string', nullable: true },
            patientName: { type: 'string', nullable: true },
            batchNumber: { type: 'string', nullable: true },
            invoiceNumber: { type: 'string', nullable: true },
            createdAt: { type: 'integer', format: 'int64' }
          }
        },
        Prescription: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            clinicId: { type: 'string' },
            userId: { type: 'string' },
            patientId: { type: 'string', nullable: true },
            patientName: { type: 'string' },
            patientCpf: { type: 'string', nullable: true },
            patientBirthDate: { type: 'string', format: 'date', nullable: true },
            patientAddress: { type: 'string', nullable: true },
            professionalId: { type: 'string' },
            professionalName: { type: 'string' },
            professionalCrm: { type: 'string', nullable: true },
            professionalSpecialty: { type: 'string', nullable: true },
            items: { type: 'array', items: { type: 'object' } },
            diagnosis: { type: 'string', nullable: true },
            additionalNotes: { type: 'string', nullable: true },
            signatureData: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['draft', 'signed', 'sent', 'archived'] },
            sentVia: { type: 'array', items: { type: 'string' } },
            pdfUrl: { type: 'string', nullable: true },
            validUntil: { type: 'integer', format: 'int64', nullable: true },
            isControlled: { type: 'boolean' }
          }
        },
        MonthlyTarget: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            month_year: { type: 'string', pattern: '^\\d{4}-\\d{2}$', example: '2024-01' },
            planned_revenue: { type: 'number' },
            planned_purchases: { type: 'number' }
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            plan: { type: 'string', enum: ['free', 'basic', 'professional', 'enterprise'] },
            status: { type: 'string', enum: ['active', 'canceled', 'past_due', 'trialing', 'incomplete'] },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time', nullable: true },
            cancelAtPeriodEnd: { type: 'boolean' },
            canceledAt: { type: 'string', format: 'date-time', nullable: true },
            hasStripeIntegration: { type: 'boolean' },
            hasMercadoPagoIntegration: { type: 'boolean' }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            total: { type: 'integer' },
            limit: { type: 'integer' },
            offset: { type: 'integer' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/index.ts', './src/config/swagger-routes.ts']
};

export const swaggerSpec = swaggerJsdoc(options);

