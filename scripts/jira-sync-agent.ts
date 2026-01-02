#!/usr/bin/env node
/**
 * Clinify Jira Sync Agent
 * 
 * Agente que analisa o projeto Clinify e sincroniza implementações com o Jira.
 * Funcionalidades:
 * - Análise completa do código (componentes, rotas, serviços)
 * - Detecção automática de features e integrações
 * - Rastreamento de mudanças via Git
 * - Detecção de TODOs e bugs
 * - Criação e atualização de issues no Jira
 * - Organização por status (Analisando, Em Teste, Feita)
 * - Geração de relatórios
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Implementation {
  id: string;
  name: string;
  description: string;
  files: string[];
  type: 'feature' | 'component' | 'route' | 'service' | 'integration' | 'bug' | 'improvement';
  status: 'analisando' | 'em-teste' | 'feita';
  category: string;
  priority: 'low' | 'medium' | 'high';
  todos?: string[];
  bugs?: string[];
  lastModified?: string;
  linesOfCode?: number;
  dependencies?: string[];
  jiraKey?: string;
}

interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
  issueTypeMap?: Record<string, string>;
  statusMap?: Record<string, string>;
}

interface ProjectStats {
  totalFiles: number;
  totalLines: number;
  components: number;
  routes: number;
  services: number;
  integrations: number;
  todos: number;
  bugs: number;
}

class ClinifyJiraAgent {
  private jiraConfig: JiraConfig;
  private implementations: Implementation[] = [];
  private projectRoot: string;
  private stats: ProjectStats = {
    totalFiles: 0,
    totalLines: 0,
    components: 0,
    routes: 0,
    services: 0,
    integrations: 0,
    todos: 0,
    bugs: 0
  };

  constructor(config: JiraConfig) {
    this.jiraConfig = {
      ...config,
      issueTypeMap: config.issueTypeMap || {
        'feature': 'Story',
        'component': 'Task',
        'route': 'Task',
        'service': 'Task',
        'integration': 'Epic',
        'bug': 'Bug',
        'improvement': 'Task' // Usando Task pois Improvement pode não existir em todos os projetos
      },
      statusMap: config.statusMap || {
        'analisando': 'Analisando Implementação',
        'em-teste': 'Em Teste',
        'feita': 'Feita'
      }
    };
    this.projectRoot = path.resolve(__dirname, '..');
  }

  /**
   * Analisa o projeto completo e identifica todas as implementações
   */
  async analyzeProject(): Promise<Implementation[]> {
    console.log('🔍 Iniciando análise do projeto Clinify...\n');
    
    this.implementations = [];

    // 1. Analisar componentes do frontend
    console.log('📦 Analisando componentes React...');
    await this.analyzeComponents();

    // 2. Analisar rotas do backend
    console.log('🔌 Analisando rotas da API...');
    await this.analyzeRoutes();

    // 3. Analisar serviços
    console.log('⚙️  Analisando serviços...');
    await this.analyzeServices();

    // 4. Analisar integrações
    console.log('🔗 Analisando integrações...');
    await this.analyzeIntegrations();

    // 5. Analisar TODOs e bugs
    console.log('🐛 Analisando TODOs e bugs...');
    await this.analyzeTodosAndBugs();

    // 6. Analisar melhorias potenciais
    console.log('💡 Analisando melhorias...');
    await this.analyzeImprovements();

    // 7. Enriquecer com dados do Git
    console.log('📝 Enriquecendo com dados do Git...');
    await this.enrichWithGitData();

    console.log(`\n✅ Análise concluída: ${this.implementations.length} implementações encontradas\n`);
    return this.implementations;
  }

  private async analyzeComponents(): Promise<void> {
    const componentsDir = path.join(this.projectRoot, 'components');
    if (!fs.existsSync(componentsDir)) return;

    const files = this.scanDirectory(componentsDir, ['.tsx', '.ts']);
    const featureMap: Record<string, string[]> = {};

    // Agrupar por categoria
    for (const file of files) {
      const relativePath = path.relative(componentsDir, file);
      const parts = relativePath.split(path.sep);
      const category = parts.length > 1 ? parts[0] : 'core';
      
      if (!featureMap[category]) featureMap[category] = [];
      featureMap[category].push(file);
    }

    // Criar implementações por categoria
    for (const [category, categoryFiles] of Object.entries(featureMap)) {
      const content = this.readFilesContent(categoryFiles);
      const todos = this.extractTodos(content);
      const bugs = this.extractBugs(content);
      const lines = this.countLines(categoryFiles);

      this.implementations.push({
        id: `component-${category}`,
        name: this.getFeatureName(category),
        description: this.generateComponentDescription(category, categoryFiles),
        files: categoryFiles,
        type: 'component',
        status: this.determineStatus(categoryFiles, todos, bugs),
        category: category === 'core' ? 'Componentes Core' : this.formatCategory(category),
        priority: this.determinePriority(categoryFiles, todos, bugs),
        todos,
        bugs,
        linesOfCode: lines,
        dependencies: this.extractDependencies(content)
      });

      this.stats.components += categoryFiles.length;
    }
  }

  private async analyzeRoutes(): Promise<void> {
    const routesDir = path.join(this.projectRoot, 'backend', 'src', 'routes');
    if (!fs.existsSync(routesDir)) return;

    const files = this.scanDirectory(routesDir, ['.ts']);
    
    for (const file of files) {
      const routeName = path.basename(file, '.ts');
      const content = fs.readFileSync(file, 'utf-8');
      const endpoints = this.extractEndpoints(content);
      const todos = this.extractTodos(content);
      const bugs = this.extractBugs(content);
      const lines = this.countLines([file]);

      this.implementations.push({
        id: `route-${routeName}`,
        name: this.formatRouteName(routeName),
        description: this.generateRouteDescription(routeName, endpoints),
        files: [file],
        type: 'route',
        status: this.determineStatus([file], todos, bugs),
        category: 'Backend API',
        priority: this.determinePriority([file], todos, bugs),
        todos,
        bugs,
        linesOfCode: lines,
        dependencies: this.extractDependencies(content)
      });

      this.stats.routes++;
    }
  }

  private async analyzeServices(): Promise<void> {
    const servicesDir = path.join(this.projectRoot, 'services');
    if (!fs.existsSync(servicesDir)) return;

    const files = this.scanDirectory(servicesDir, ['.ts']);
    
    for (const file of files) {
      const serviceName = path.basename(file, '.ts');
      const content = fs.readFileSync(file, 'utf-8');
      const todos = this.extractTodos(content);
      const bugs = this.extractBugs(content);
      const lines = this.countLines([file]);

      this.implementations.push({
        id: `service-${serviceName}`,
        name: this.formatServiceName(serviceName),
        description: this.generateServiceDescription(serviceName, content),
        files: [file],
        type: 'service',
        status: this.determineStatus([file], todos, bugs),
        category: 'Serviços',
        priority: this.determinePriority([file], todos, bugs),
        todos,
        bugs,
        linesOfCode: lines,
        dependencies: this.extractDependencies(content)
      });

      this.stats.services++;
    }
  }

  private async analyzeIntegrations(): Promise<void> {
    const integrations = [
      {
        name: 'Stripe Payment',
        check: () => {
          const files = [
            path.join(this.projectRoot, 'backend', 'src', 'routes', 'billing.ts'),
            path.join(this.projectRoot, 'backend', '.env')
          ];
          const exists = files.some(f => fs.existsSync(f));
          if (exists) {
            const envContent = fs.existsSync(files[1]) ? fs.readFileSync(files[1], 'utf-8') : '';
            return envContent.includes('STRIPE');
          }
          return false;
        },
        description: '💳 **Integração com Stripe**\n\nSistema completo de pagamentos online integrado com Stripe. Permite processar pagamentos de forma segura, gerenciar assinaturas recorrentes e controlar planos de pagamento dos clientes.\n\n✨ **Funcionalidades:**\n• Processamento de pagamentos\n• Assinaturas recorrentes\n• Gestão de planos\n• Webhooks para atualizações',
        files: [
          path.join(this.projectRoot, 'backend', 'src', 'routes', 'billing.ts')
        ]
      },
      {
        name: 'Mercado Pago',
        check: () => {
          try {
            const pkg = JSON.parse(
              fs.readFileSync(path.join(this.projectRoot, 'backend', 'package.json'), 'utf-8')
            );
            return pkg.dependencies?.mercadopago !== undefined;
          } catch {
            return false;
          }
        },
        description: '💳 **Integração com Mercado Pago**\n\nSistema de pagamentos alternativo usando Mercado Pago. Oferece mais opções de pagamento para os clientes, incluindo boleto e PIX.\n\n✨ **Funcionalidades:**\n• Pagamentos via Mercado Pago\n• Suporte a múltiplas formas de pagamento\n• Integração com gateway de pagamento',
        files: []
      },
      {
        name: 'Google Gemini AI',
        check: () => {
          try {
            const pkg = JSON.parse(
              fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf-8')
            );
            return pkg.dependencies?.['@google/genai'] !== undefined;
          } catch {
            return false;
          }
        },
        description: '🤖 **Integração com Google Gemini AI**\n\nSistema de inteligência artificial integrado com Google Gemini para análise inteligente de dados financeiros, geração de insights automáticos e assistente virtual.\n\n✨ **Funcionalidades:**\n• Análise inteligente de dados financeiros\n• Geração automática de insights\n• Chat assistente com IA\n• Recomendações baseadas em dados',
        files: [
          path.join(this.projectRoot, 'services', 'aiService.ts'),
          path.join(this.projectRoot, 'components', 'AIChatWidget.tsx')
        ]
      },
      {
        name: 'Prontuário Eletrônico (PEP)',
        check: () => {
          const pepDir = path.join(this.projectRoot, 'components', 'pep');
          return fs.existsSync(pepDir);
        },
        description: '🏥 **Prontuário Eletrônico do Paciente (PEP)**\n\nSistema completo e profissional de prontuário eletrônico que permite gerenciar todo o histórico médico dos pacientes de forma digital e segura.\n\n✨ **Funcionalidades:**\n• Anamnese completa\n• Histórico de consultas\n• Odontograma interativo\n• Assinatura digital\n• Anexos e documentos\n• Notas clínicas',
        files: this.scanDirectory(path.join(this.projectRoot, 'components', 'pep'), ['.tsx', '.ts'])
      },
      {
        name: 'Prescrições Digitais',
        check: () => {
          const prescDir = path.join(this.projectRoot, 'components', 'prescription');
          return fs.existsSync(prescDir);
        },
        description: '💊 **Sistema de Prescrições Digitais**\n\nSistema completo para criação e gerenciamento de prescrições médicas digitais, com geração automática de PDF para impressão ou envio aos pacientes.\n\n✨ **Funcionalidades:**\n• Criação de prescrições digitais\n• Geração automática de PDF\n• Histórico de prescrições\n• Validação de medicamentos',
        files: this.scanDirectory(path.join(this.projectRoot, 'components', 'prescription'), ['.tsx', '.ts'])
      },
      {
        name: 'CRM com Chat',
        check: () => {
          const crmFile = path.join(this.projectRoot, 'components', 'crm', 'CRMTab.tsx');
          return fs.existsSync(crmFile);
        },
        description: '💬 **CRM com Chat Integrado**\n\nSistema completo de Customer Relationship Management (CRM) com chat integrado para comunicação direta com pacientes e gestão completa do relacionamento.\n\n✨ **Funcionalidades:**\n• Chat em tempo real\n• Histórico de conversas\n• Gestão de relacionamento\n• Follow-up automático\n• Notificações',
        files: this.scanDirectory(path.join(this.projectRoot, 'components', 'crm'), ['.tsx', '.ts'])
      },
      {
        name: 'Controle de Estoque',
        check: () => {
          const inventoryDir = path.join(this.projectRoot, 'components', 'dashboard', 'inventory');
          return fs.existsSync(inventoryDir);
        },
        description: '📦 **Sistema de Controle de Estoque**\n\nSistema completo para gerenciar o estoque e inventário da clínica, com alertas automáticos de reposição e controle de entrada/saída de produtos.\n\n✨ **Funcionalidades:**\n• Controle de estoque em tempo real\n• Alertas de reposição\n• Histórico de movimentações\n• Relatórios de inventário\n• Gestão de fornecedores',
        files: this.scanDirectory(path.join(this.projectRoot, 'components', 'dashboard', 'inventory'), ['.tsx', '.ts'])
      },
      {
        name: 'Programa de Fidelidade',
        check: () => {
          const loyaltyFiles = [
            path.join(this.projectRoot, 'components', 'dashboard', 'LoyaltyTab.tsx'),
            path.join(this.projectRoot, 'backend', 'src', 'routes', 'loyalty.ts')
          ];
          return loyaltyFiles.some(f => fs.existsSync(f));
        },
        description: '🎁 **Programa de Fidelidade**\n\nSistema completo de programa de fidelidade que permite criar e gerenciar pontos, recompensas e benefícios para os pacientes da clínica.\n\n✨ **Funcionalidades:**\n• Sistema de pontos\n• Recompensas e benefícios\n• Histórico de pontos\n• Campanhas promocionais\n• Relatórios de fidelidade',
        files: [
          path.join(this.projectRoot, 'components', 'dashboard', 'LoyaltyTab.tsx'),
          path.join(this.projectRoot, 'backend', 'src', 'routes', 'loyalty.ts')
        ].filter(f => fs.existsSync(f))
      },
      {
        name: 'Sistema de Comissões',
        check: () => {
          const commissionsDir = path.join(this.projectRoot, 'components', 'dashboard', 'commissions');
          return fs.existsSync(commissionsDir);
        },
        description: '💵 **Sistema de Comissões**\n\nSistema completo para calcular e gerenciar comissões dos profissionais da clínica, com diferentes regras e percentuais por tipo de procedimento.\n\n✨ **Funcionalidades:**\n• Cálculo automático de comissões\n• Diferentes regras por profissional\n• Relatórios de comissões\n• Histórico de pagamentos\n• Metas e bonificações',
        files: this.scanDirectory(path.join(this.projectRoot, 'components', 'dashboard', 'commissions'), ['.tsx', '.ts'])
      },
      {
        name: 'Dashboard Financeiro',
        check: () => {
          const financeDir = path.join(this.projectRoot, 'components', 'dashboard', 'finance');
          return fs.existsSync(financeDir);
        },
        description: '💰 **Dashboard Financeiro Completo**\n\nDashboard completo para visualização e análise financeira da clínica, com DRE, relatórios detalhados, gráficos interativos e análise de receitas e despesas.\n\n✨ **Funcionalidades:**\n• DRE (Demonstração do Resultado do Exercício)\n• Gráficos e visualizações\n• Análise de receitas e despesas\n• Relatórios personalizados\n• Metas e orçamentos\n• Análise de tendências',
        files: this.scanDirectory(path.join(this.projectRoot, 'components', 'dashboard', 'finance'), ['.tsx', '.ts'])
      },
      {
        name: 'PWA (Progressive Web App)',
        check: () => {
          const manifest = path.join(this.projectRoot, 'public', 'manifest.json');
          return fs.existsSync(manifest);
        },
        description: '📱 **Progressive Web App (PWA)**\n\nAplicação web progressiva que funciona como um app nativo, com suporte offline, instalação no dispositivo e notificações push.\n\n✨ **Funcionalidades:**\n• Funciona offline\n• Instalação como app\n• Service Workers\n• Notificações push\n• Experiência mobile otimizada',
        files: [
          path.join(this.projectRoot, 'public', 'manifest.json'),
          path.join(this.projectRoot, 'vite.config.ts')
        ].filter(f => fs.existsSync(f))
      }
    ];

    for (const integration of integrations) {
      if (integration.check()) {
        const files = integration.files.filter(f => fs.existsSync(f));
        const content = this.readFilesContent(files);
        const todos = this.extractTodos(content);
        const bugs = this.extractBugs(content);
        const lines = this.countLines(files);

        this.implementations.push({
          id: `integration-${integration.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: integration.name,
          description: integration.description,
          files: files.length > 0 ? files : [],
          type: 'integration',
          status: files.length > 0 ? this.determineStatus(files, todos, bugs) : 'analisando',
          category: 'Integrações',
          priority: 'high',
          todos,
          bugs,
          linesOfCode: lines,
          dependencies: this.extractDependencies(content)
        });

        this.stats.integrations++;
      }
    }
  }

  private async analyzeTodosAndBugs(): Promise<void> {
    const allFiles = [
      ...this.scanDirectory(path.join(this.projectRoot, 'components'), ['.tsx', '.ts']),
      ...this.scanDirectory(path.join(this.projectRoot, 'backend', 'src'), ['.ts']),
      ...this.scanDirectory(path.join(this.projectRoot, 'services'), ['.ts'])
    ];

    const todos: Array<{ file: string; line: number; message: string }> = [];
    const bugs: Array<{ file: string; line: number; message: string }> = [];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Detectar TODOs
        const todoMatch = line.match(/\/\/\s*TODO:?\s*(.+)/i) || 
                         line.match(/\/\*\s*TODO:?\s*(.+?)\*\//i);
        if (todoMatch) {
          todos.push({
            file: path.relative(this.projectRoot, file),
            line: index + 1,
            message: todoMatch[1].trim()
          });
        }

        // Detectar FIXMEs e bugs
        const bugMatch = line.match(/\/\/\s*FIXME:?\s*(.+)/i) ||
                         line.match(/\/\/\s*BUG:?\s*(.+)/i) ||
                         line.match(/\/\*\s*FIXME:?\s*(.+?)\*\//i);
        if (bugMatch) {
          bugs.push({
            file: path.relative(this.projectRoot, file),
            line: index + 1,
            message: bugMatch[1].trim()
          });
        }
      });
    }

    this.stats.todos = todos.length;
    this.stats.bugs = bugs.length;

    // Criar issues para TODOs agrupados
    if (todos.length > 0) {
      const todosByCategory = this.groupByCategory(todos);
      for (const [category, items] of Object.entries(todosByCategory)) {
        this.implementations.push({
          id: `todos-${category}`,
          name: `TODOs - ${category}`,
          description: `${items.length} TODO(s) encontrado(s) em ${category}`,
          files: [...new Set(items.map(t => t.file))],
          type: 'improvement',
          status: 'analisando',
          category: 'Melhorias',
          priority: 'medium',
          todos: items.map(t => `${t.file}:${t.line} - ${t.message}`)
        });
      }
    }

    // Criar issues para bugs
    if (bugs.length > 0) {
      const bugsByCategory = this.groupByCategory(bugs);
      for (const [category, items] of Object.entries(bugsByCategory)) {
        this.implementations.push({
          id: `bugs-${category}`,
          name: `Bugs - ${category}`,
          description: `${items.length} bug(s) encontrado(s) em ${category}`,
          files: [...new Set(items.map(b => b.file))],
          type: 'bug',
          status: 'analisando',
          category: 'Bugs',
          priority: 'high',
          bugs: items.map(b => `${b.file}:${b.line} - ${b.message}`)
        });
      }
    }
  }

  private async analyzeImprovements(): Promise<void> {
    // Detectar possíveis melhorias baseadas em padrões
    const improvements: Implementation[] = [];

    // Verificar se há testes
    const hasTests = fs.existsSync(path.join(this.projectRoot, 'tests')) ||
                     fs.existsSync(path.join(this.projectRoot, '__tests__'));
    
    if (!hasTests) {
      improvements.push({
        id: 'improvement-tests',
        name: 'Implementar Testes Automatizados',
        description: 'Adicionar testes unitários e de integração para garantir qualidade do código',
        files: [],
        type: 'improvement',
        status: 'analisando',
        category: 'Melhorias',
        priority: 'high'
      });
    }

    // Verificar documentação
    const hasDocs = fs.existsSync(path.join(this.projectRoot, 'docs'));
    if (!hasDocs || this.scanDirectory(path.join(this.projectRoot, 'docs'), ['.md']).length < 5) {
      improvements.push({
        id: 'improvement-docs',
        name: 'Melhorar Documentação',
        description: 'Expandir documentação do projeto com guias de uso e exemplos',
        files: [],
        type: 'improvement',
        status: 'analisando',
        category: 'Melhorias',
        priority: 'medium'
      });
    }

    this.implementations.push(...improvements);
  }

  private async enrichWithGitData(): Promise<void> {
    // Tentar obter informações do Git
    try {
      const gitLog = execSync('git log --pretty=format:"%H|%an|%ad|%s" --date=short -20', {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      });

      // Associar arquivos modificados recentemente
      for (const impl of this.implementations) {
        for (const file of impl.files) {
          try {
            const gitBlame = execSync(`git log -1 --format="%ai|%an" -- "${file}"`, {
              cwd: this.projectRoot,
              encoding: 'utf-8'
            }).trim();
            
            if (gitBlame) {
              const [date, author] = gitBlame.split('|');
              impl.lastModified = date;
            }
          } catch {
            // Ignorar erros do git
          }
        }
      }
    } catch {
      // Git não disponível ou não é um repositório
    }
  }

  // Métodos auxiliares
  private scanDirectory(dir: string, extensions: string[]): string[] {
    if (!fs.existsSync(dir)) return [];
    
    const files: string[] = [];
    
    const scan = (currentDir: string) => {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory() && 
              !entry.name.startsWith('.') && 
              entry.name !== 'node_modules' &&
              entry.name !== 'dist' &&
              entry.name !== 'build') {
            scan(fullPath);
          } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
            this.stats.totalFiles++;
          }
        }
      } catch (error) {
        // Ignorar erros de leitura
      }
    };

    scan(dir);
    return files;
  }

  private readFilesContent(files: string[]): string {
    return files
      .filter(f => fs.existsSync(f))
      .map(f => fs.readFileSync(f, 'utf-8'))
      .join('\n');
  }

  private extractEndpoints(content: string): string[] {
    const endpoints: string[] = [];
    const routeRegex = /router\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = routeRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const path = match[2];
      endpoints.push(`${method} ${path}`);
    }
    
    return endpoints;
  }

  private extractTodos(content: string): string[] {
    const todos: string[] = [];
    const todoRegex = /\/\/\s*TODO:?\s*(.+)/gi;
    const todoBlockRegex = /\/\*\s*TODO:?\s*(.+?)\*\//gis;
    
    let match;
    while ((match = todoRegex.exec(content)) !== null) {
      todos.push(match[1].trim());
    }
    while ((match = todoBlockRegex.exec(content)) !== null) {
      todos.push(match[1].trim());
    }
    
    return todos;
  }

  private extractBugs(content: string): string[] {
    const bugs: string[] = [];
    const bugRegex = /\/\/\s*(FIXME|BUG):?\s*(.+)/gi;
    const bugBlockRegex = /\/\*\s*(FIXME|BUG):?\s*(.+?)\*\//gis;
    
    let match;
    while ((match = bugRegex.exec(content)) !== null) {
      bugs.push(match[2].trim());
    }
    while ((match = bugBlockRegex.exec(content)) !== null) {
      bugs.push(match[2].trim());
    }
    
    return bugs;
  }

  private extractDependencies(content: string): string[] {
    const deps: string[] = [];
    const importRegex = /import\s+.+\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const dep = match[1];
      if (!dep.startsWith('.') && !dep.startsWith('/')) {
        deps.push(dep.split('/')[0]);
      }
    }
    
    return [...new Set(deps)];
  }

  private countLines(files: string[]): number {
    let total = 0;
    for (const file of files) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        total += content.split('\n').length;
      }
    }
    this.stats.totalLines += total;
    return total;
  }

  private determineStatus(
    files: string[], 
    todos: string[] = [], 
    bugs: string[] = []
  ): 'analisando' | 'em-teste' | 'feita' {
    if (bugs.length > 0) return 'analisando';
    if (todos.length > 0) return 'analisando';
    
    // Verificar se há testes
    const hasTests = files.some(f => {
      const testFile = f.replace(/\.(ts|tsx)$/, '.test.$1');
      return fs.existsSync(testFile);
    });
    
    if (hasTests) return 'em-teste';
    
    // Se o arquivo existe e tem conteúdo significativo, assume "feita"
    const hasContent = files.some(f => {
      if (!fs.existsSync(f)) return false;
      const content = fs.readFileSync(f, 'utf-8');
      return content.trim().length > 100;
    });
    
    return hasContent ? 'feita' : 'analisando';
  }

  private determinePriority(
    files: string[], 
    todos: string[] = [], 
    bugs: string[] = []
  ): 'low' | 'medium' | 'high' {
    if (bugs.length > 0) return 'high';
    if (todos.length > 3) return 'high';
    if (todos.length > 0) return 'medium';
    return 'low';
  }

  private groupByCategory<T extends { file: string }>(items: T[]): Record<string, T[]> {
    const grouped: Record<string, T[]> = {};
    
    for (const item of items) {
      const parts = item.file.split(path.sep);
      const category = parts.length > 1 ? parts[0] : 'root';
      
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(item);
    }
    
    return grouped;
  }

  private getFeatureName(category: string): string {
    const nameMap: Record<string, string> = {
      'dashboard': '📊 Dashboard',
      'pep': '🏥 Prontuário Eletrônico',
      'prescription': '💊 Prescrições',
      'crm': '💬 CRM',
      'finance': '💰 Financeiro',
      'inventory': '📦 Estoque',
      'loyalty': '🎁 Fidelidade',
      'commissions': '💵 Comissões',
      'core': '🧩 Componentes Core',
      'ui': '🎨 Componentes UI'
    };
    return nameMap[category] || this.formatCategory(category);
  }

  private getEmojiForType(type: string): string {
    const emojiMap: Record<string, string> = {
      'feature': '✨',
      'component': '🧩',
      'route': '🔌',
      'service': '⚙️',
      'integration': '🔗',
      'bug': '🐛',
      'improvement': '💡'
    };
    return emojiMap[type] || '📝';
  }

  private getEmojiForCategory(category: string): string {
    const emojiMap: Record<string, string> = {
      'Componentes Core': '🧩',
      'Backend API': '🔌',
      'Serviços': '⚙️',
      'Integrações': '🔗',
      'Melhorias': '💡',
      'Bugs': '🐛',
      'Dashboard': '📊',
      'Financeiro': '💰',
      'Estoque': '📦',
      'Fidelidade': '🎁',
      'Comissões': '💵'
    };
    return emojiMap[category] || '📝';
  }

  private getStatusEmoji(status: string): string {
    const emojiMap: Record<string, string> = {
      'analisando': '🔍',
      'em-teste': '🧪',
      'feita': '✅'
    };
    return emojiMap[status] || '📝';
  }

  private formatCategory(category: string): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private formatRouteName(route: string): string {
    return route
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') + ' API';
  }

  private formatServiceName(service: string): string {
    return service
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^\w/, c => c.toUpperCase());
  }

  private generateComponentDescription(category: string, files: string[]): string {
    const componentNames = files.map(f => {
      const name = path.basename(f, path.extname(f));
      return name.replace(/([A-Z])/g, ' $1').trim();
    });

    const featureName = this.getFeatureName(category).replace(/^[^\s]+\s/, ''); // Remove emoji do nome
    return `🎯 **O que é?**\n\nEsta é a implementação completa do módulo ${featureName} do Clinify.\n\n📦 **Componentes incluídos:**\n${componentNames.slice(0, 5).map(name => `• ${name}`).join('\n')}${componentNames.length > 5 ? `\n• E mais ${componentNames.length - 5} componente(s)...` : ''}\n\n📁 **Total de arquivos:** ${files.length}`;
  }

  private generateRouteDescription(routeName: string, endpoints: string[]): string {
    const cleanName = routeName.replace(' API', '');
    return `🔌 **API REST para ${cleanName}**\n\nEsta implementação contém todos os endpoints da API relacionados a ${cleanName}.\n\n📡 **Endpoints disponíveis:**\n${endpoints.slice(0, 8).map(ep => `• \`${ep}\``).join('\n')}${endpoints.length > 8 ? `\n• E mais ${endpoints.length - 8} endpoint(s)...` : ''}\n\n💡 **Total de endpoints:** ${endpoints.length}`;
  }

  private generateServiceDescription(serviceName: string, content: string): string {
    const commentMatch = content.match(/\/\*\*[\s\S]*?\*\//) || 
                        content.match(/\/\/\s*(.+)/);
    const desc = commentMatch ? commentMatch[1] : 'Serviço de integração e lógica de negócio';
    return `⚙️ **Serviço: ${serviceName}**\n\n${desc}\n\n🔧 Este serviço é responsável por gerenciar a lógica de negócio e integrações relacionadas a ${serviceName}.`;
  }

  /**
   * Sincroniza implementações com o Jira
   */
  async syncToJira(dryRun: boolean = false): Promise<void> {
    if (this.implementations.length === 0) {
      await this.analyzeProject();
    }

    console.log(`📤 ${dryRun ? '[DRY RUN] ' : ''}Sincronizando ${this.implementations.length} implementações para o Jira...\n`);

    let created = 0;
    let updated = 0;
    let errors = 0;
    let requestCount = 0;

    // Função helper para delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const impl of this.implementations) {
      try {
        if (dryRun) {
          console.log(`[DRY RUN] Criaria issue: ${impl.name} - Status: ${impl.status}`);
          continue;
        }

        requestCount++;

        // Adicionar delay entre requisições para evitar rate limiting
        if (requestCount > 1) {
          await delay(500); // 500ms entre requisições
        }

        // Verificar se já existe
        const existing = await this.findExistingIssue(impl);
        
        if (existing) {
          await this.updateJiraIssue(existing.key, impl);
          updated++;
          console.log(`🔄 ${existing.key} - ${impl.name} (atualizado)`);
        } else {
          const createdIssue = await this.createJiraIssue(impl);
          impl.jiraKey = createdIssue.key;
          created++;
          console.log(`✅ ${createdIssue.key} - ${impl.name} (criado)`);
        }
      } catch (error: any) {
        errors++;
        console.error(`❌ Erro ao processar ${impl.name}:`, error.message);
        
        // Se houver muitos erros consecutivos, adicionar delay maior
        if (errors > 5 && errors % 5 === 0) {
          console.log('⏳ Aguardando 2 segundos devido a múltiplos erros...');
          await delay(2000);
        }
      }
    }

    console.log(`\n📊 Resumo: ${created} criadas, ${updated} atualizadas, ${errors} erros\n`);
  }

  private async findExistingIssue(impl: Implementation): Promise<{ key: string } | null> {
    try {
      const jql = `project = ${this.jiraConfig.projectKey} AND summary ~ "${impl.name}" AND status != Closed`;
      const url = `${this.jiraConfig.baseUrl}/rest/api/3/search`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.jiraConfig.email}:${this.jiraConfig.apiToken}`).toString('base64')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          jql: jql,
          maxResults: 50,
          fields: ['summary', 'status']
        })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.issues && data.issues.length > 0) {
        return { key: data.issues[0].key };
      }
    } catch (error: any) {
      // Ignorar erros silenciosamente
    }
    
    return null;
  }

  private async createJiraIssue(impl: Implementation): Promise<{ key: string }> {
    const priorityMap: Record<string, string> = {
      'low': 'Lowest',
      'medium': 'Medium',
      'high': 'Highest'
    };

    const emoji = this.getEmojiForType(impl.type);
    const title = `${emoji} ${impl.name}`;
    
    const issue = {
      fields: {
        project: {
          key: this.jiraConfig.projectKey
        },
        summary: title,
        description: {
          type: 'doc',
          version: 1,
          content: this.buildDescription(impl)
        },
        issuetype: {
          name: this.jiraConfig.issueTypeMap![impl.type] || 'Task'
        },
        labels: [
          'clinify',
          impl.category.toLowerCase().replace(/\s+/g, '-'),
          impl.type,
          impl.status,
          ...(impl.category === 'Mudanças no Código' ? ['mudanças-código'] : [])
        ],
        priority: {
          name: priorityMap[impl.priority] || 'Medium'
        }
      }
    };

    const url = `${this.jiraConfig.baseUrl}/rest/api/3/issue`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.jiraConfig.email}:${this.jiraConfig.apiToken}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(issue)
    });

    if (!response.ok) {
      const error = await response.text();
      let errorMessage = `Jira API error: ${error}`;
      
      // Melhorar mensagem de erro para tipo de issue inválido
      try {
        const errorObj = JSON.parse(error);
        if (errorObj.errors && errorObj.errors.issuetype) {
          const issueType = this.jiraConfig.issueTypeMap![impl.type] || 'Task';
          errorMessage = `Tipo de issue inválido: "${issueType}". O projeto Jira pode não ter esse tipo disponível. Tente usar "Task" ou "Story". Erro original: ${error}`;
        }
      } catch {
        // Se não conseguir parsear, usar mensagem original
      }
      
      throw new Error(errorMessage);
    }

    const created = await response.json();
    return { key: created.key };
  }

  private async updateJiraIssue(issueKey: string, impl: Implementation): Promise<void> {
    const emoji = this.getEmojiForType(impl.type);
    const title = `${emoji} ${impl.name}`;
    
    const update = {
      fields: {
        summary: title,
        description: {
          type: 'doc',
          version: 1,
          content: this.buildDescription(impl)
        }
      }
    };

    const response = await fetch(
      `${this.jiraConfig.baseUrl}/rest/api/3/issue/${issueKey}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.jiraConfig.email}:${this.jiraConfig.apiToken}`).toString('base64')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(update)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jira API error: ${error}`);
    }
  }

  private buildDescription(impl: Implementation): any[] {
    const categoryEmoji = this.getEmojiForCategory(impl.category);
    const statusEmoji = this.getStatusEmoji(impl.status);
    
    const content: any[] = [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: impl.description,
            marks: [{ type: 'strong' }]
          }
        ]
      },
      {
        type: 'rule'
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: '📋 Informações da Implementação' }]
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: `${categoryEmoji} Categoria: ${impl.category}` }]
            }]
          },
          {
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: `📝 Tipo: ${impl.type}` }]
            }]
          },
          {
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: `${statusEmoji} Status: ${this.jiraConfig.statusMap![impl.status]}` }]
            }]
          }
        ]
      }
    ];

    if (impl.linesOfCode) {
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: '📊 Estatísticas' }]
      });
      content.push({
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: `📏 Linhas de código: ${impl.linesOfCode.toLocaleString()}` }]
            }]
          },
          {
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: `📁 Arquivos: ${impl.files.length}` }]
            }]
          }
        ]
      });
    }

    if (impl.files.length > 0) {
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: '📂 Arquivos Relacionados' }]
      });
      content.push({
        type: 'bulletList',
        content: impl.files.slice(0, 15).map(file => ({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: `\`${path.relative(this.projectRoot, file)}\``,
              marks: [{ type: 'code' }]
            }]
          }]
        }))
      });
      if (impl.files.length > 15) {
        content.push({
          type: 'paragraph',
          content: [{
            type: 'text',
            text: `... e mais ${impl.files.length - 15} arquivo(s)`
          }]
        });
      }
    }

    if (impl.todos && impl.todos.length > 0) {
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: '📝 TODOs Encontrados' }]
      });
      content.push({
        type: 'panel',
        attrs: { panelType: 'info' },
        content: [{
          type: 'bulletList',
          content: impl.todos.slice(0, 10).map(todo => ({
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: todo }]
            }]
          }))
        }]
      });
      if (impl.todos.length > 10) {
        content.push({
          type: 'paragraph',
          content: [{
            type: 'text',
            text: `... e mais ${impl.todos.length - 10} TODO(s)`
          }]
        });
      }
    }

    if (impl.bugs && impl.bugs.length > 0) {
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: '🐛 Bugs Encontrados' }]
      });
      content.push({
        type: 'panel',
        attrs: { panelType: 'warning' },
        content: [{
          type: 'bulletList',
          content: impl.bugs.slice(0, 10).map(bug => ({
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: bug }]
            }]
          }))
        }]
      });
      if (impl.bugs.length > 10) {
        content.push({
          type: 'paragraph',
          content: [{
            type: 'text',
            text: `... e mais ${impl.bugs.length - 10} bug(s)`
          }]
        });
      }
    }

    if (impl.dependencies && impl.dependencies.length > 0) {
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: '📦 Dependências' }]
      });
      content.push({
        type: 'paragraph',
        content: [{
          type: 'text',
          text: impl.dependencies.slice(0, 10).map(dep => `\`${dep}\``).join(', '),
          marks: [{ type: 'code' }]
        }]
      });
      if (impl.dependencies.length > 10) {
        content.push({
          type: 'paragraph',
          content: [{
            type: 'text',
            text: `... e mais ${impl.dependencies.length - 10} dependência(s)`
          }]
        });
      }
    }

    return content;
  }

  /**
   * Lista implementações disponíveis para adicionar
   */
  listAvailableImplementations(): void {
    console.log('\n📋 Implementações disponíveis para adicionar ao Jira:\n');
    this.implementations.forEach((impl, index) => {
      const emoji = this.getEmojiForType(impl.type);
      console.log(`   ${index + 1}. ${emoji} ${impl.name}`);
      console.log(`      Categoria: ${impl.category} | Tipo: ${impl.type} | Status: ${impl.status}`);
    });
    console.log(`\n💡 Use: npm run jira:add "Nome da Implementação"\n`);
  }

  /**
   * Lista todas as implementações encontradas
   */
  listImplementations(): void {
    console.log('\n📋 Implementações encontradas no Clinify:\n');
    
    const byStatus = {
      'analisando': [] as Implementation[],
      'em-teste': [] as Implementation[],
      'feita': [] as Implementation[]
    };

    for (const impl of this.implementations) {
      byStatus[impl.status].push(impl);
    }

    console.log('🔍 Analisando Implementação:');
    for (const impl of byStatus['analisando']) {
      console.log(`  - ${impl.name} (${impl.category}) ${impl.linesOfCode ? `[${impl.linesOfCode} linhas]` : ''}`);
    }

    console.log('\n🧪 Em Teste:');
    for (const impl of byStatus['em-teste']) {
      console.log(`  - ${impl.name} (${impl.category}) ${impl.linesOfCode ? `[${impl.linesOfCode} linhas]` : ''}`);
    }

    console.log('\n✅ Feita:');
    for (const impl of byStatus['feita']) {
      console.log(`  - ${impl.name} (${impl.category}) ${impl.linesOfCode ? `[${impl.linesOfCode} linhas]` : ''}`);
    }

    console.log(`\nTotal: ${this.implementations.length} implementações\n`);
  }

  /**
   * Gera relatório completo do projeto
   */
  generateReport(): void {
    console.log('\n📊 RELATÓRIO DO PROJETO CLINIFY\n');
    console.log('═'.repeat(60));
    console.log(`\n📁 Estatísticas Gerais:`);
    console.log(`   - Total de arquivos: ${this.stats.totalFiles}`);
    console.log(`   - Total de linhas: ${this.stats.totalLines.toLocaleString()}`);
    console.log(`   - Componentes: ${this.stats.components}`);
    console.log(`   - Rotas API: ${this.stats.routes}`);
    console.log(`   - Serviços: ${this.stats.services}`);
    console.log(`   - Integrações: ${this.stats.integrations}`);
    console.log(`   - TODOs: ${this.stats.todos}`);
    console.log(`   - Bugs: ${this.stats.bugs}`);

    const byType = {
      'feature': 0,
      'component': 0,
      'route': 0,
      'service': 0,
      'integration': 0,
      'bug': 0,
      'improvement': 0
    };

    for (const impl of this.implementations) {
      byType[impl.type]++;
    }

    console.log(`\n📦 Implementações por Tipo:`);
    for (const [type, count] of Object.entries(byType)) {
      if (count > 0) {
        console.log(`   - ${type}: ${count}`);
      }
    }

    const byCategory: Record<string, number> = {};
    for (const impl of this.implementations) {
      byCategory[impl.category] = (byCategory[impl.category] || 0) + 1;
    }

    console.log(`\n📂 Implementações por Categoria:`);
    for (const [category, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
      console.log(`   - ${category}: ${count}`);
    }

    console.log('\n' + '═'.repeat(60) + '\n');
  }

  /**
   * Exporta implementações para JSON
   */
  exportToJSON(filePath?: string): void {
    const outputPath = filePath || path.join(this.projectRoot, 'clinify-implementations.json');
    const data = {
      generatedAt: new Date().toISOString(),
      stats: this.stats,
      implementations: this.implementations
    };

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`\n💾 Dados exportados para: ${outputPath}\n`);
  }

  /**
   * Deleta todas as issues do projeto Jira
   */
  async deleteAllIssues(): Promise<void> {
    console.log('🗑️  Buscando todas as issues do projeto...\n');

    let startAt = 0;
    const maxResults = 100;
    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const jql = `project = ${this.jiraConfig.projectKey} ORDER BY created DESC`;
        // Nova API v3 com formato correto
        const url = `${this.jiraConfig.baseUrl}/rest/api/3/search`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.jiraConfig.email}:${this.jiraConfig.apiToken}`).toString('base64')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            jql: jql,
            startAt: startAt,
            maxResults: maxResults,
            fields: ['summary', 'status', 'created', 'updated']
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Erro ao buscar issues: ${error}`);
        }

        const data = await response.json();
        const issues = data.issues || [];

        if (issues.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`📋 Encontradas ${issues.length} issues (lote ${Math.floor(startAt / maxResults) + 1})...`);

        // Deletar issues em lote
        for (const issue of issues) {
          try {
            await this.deleteIssue(issue.key);
            totalDeleted++;
            console.log(`  ✅ ${issue.key} - ${issue.fields.summary.substring(0, 50)}...`);
          } catch (error: any) {
            console.error(`  ❌ Erro ao deletar ${issue.key}:`, error.message);
          }
          
          // Pequeno delay para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Verificar se há mais issues
        if (issues.length < maxResults || startAt + issues.length >= data.total) {
          hasMore = false;
        } else {
          startAt += maxResults;
        }
      } catch (error: any) {
        console.error(`❌ Erro ao processar lote:`, error.message);
        hasMore = false;
      }
    }

    console.log(`\n✅ Concluído! ${totalDeleted} issue(s) deletada(s)\n`);
  }

  /**
   * Deleta uma issue específica
   */
  private async deleteIssue(issueKey: string): Promise<void> {
    const url = `${this.jiraConfig.baseUrl}/rest/api/3/issue/${issueKey}?deleteSubtasks=false`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.jiraConfig.email}:${this.jiraConfig.apiToken}`).toString('base64')}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      throw new Error(`Erro ao deletar issue: ${error}`);
    }
  }

  /**
   * Adiciona implementações específicas ao Jira
   */
  async addSpecificImplementations(implementationNames: string[]): Promise<void> {
    if (this.implementations.length === 0) {
      await this.analyzeProject();
    }

    // Filtrar implementações solicitadas
    const toAdd = this.implementations.filter(impl => 
      implementationNames.some(name => 
        impl.name.toLowerCase().includes(name.toLowerCase()) ||
        impl.id.toLowerCase().includes(name.toLowerCase())
      )
    );

    if (toAdd.length === 0) {
      console.log('\n❌ Nenhuma implementação encontrada com os nomes fornecidos.\n');
      console.log('💡 Implementações disponíveis:');
      this.implementations.forEach(impl => {
        console.log(`   - ${impl.name} (${impl.category})`);
      });
      console.log();
      return;
    }

    console.log(`\n📤 Adicionando ${toAdd.length} implementação(ões) ao Jira...\n`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const impl of toAdd) {
      try {
        // Verificar se já existe
        const existing = await this.findExistingIssue(impl);
        
        if (existing) {
          await this.updateJiraIssue(existing.key, impl);
          updated++;
          console.log(`🔄 ${existing.key} - ${impl.name} (atualizado)`);
        } else {
          const createdIssue = await this.createJiraIssue(impl);
          impl.jiraKey = createdIssue.key;
          created++;
          console.log(`✅ ${createdIssue.key} - ${impl.name} (criado)`);
        }

        // Delay entre requisições
        await delay(500);
      } catch (error: any) {
        errors++;
        console.error(`❌ Erro ao processar ${impl.name}:`, error.message);
      }
    }

    console.log(`\n📊 Resumo: ${created} criadas, ${updated} atualizadas, ${errors} erros\n`);
  }

  /**
   * Detecta mudanças no código usando Git e registra no Jira
   */
  async registerCodeChanges(fromCommit?: string, toCommit?: string): Promise<void> {
    console.log('🔍 Detectando mudanças no código...\n');

    try {
      // Verificar se é um repositório Git
      execSync('git rev-parse --git-dir', { cwd: this.projectRoot, stdio: 'ignore' });
    } catch {
      console.error('❌ Erro: Este diretório não é um repositório Git!\n');
      console.log('💡 Inicialize um repositório Git primeiro:');
      console.log('   git init\n');
      process.exit(1);
    }

    // Obter arquivos modificados
    const changedFiles = this.getChangedFiles(fromCommit, toCommit);
    
    if (changedFiles.length === 0) {
      console.log('✅ Nenhuma mudança detectada.\n');
      return;
    }

    console.log(`📝 ${changedFiles.length} arquivo(s) modificado(s):\n`);
    changedFiles.forEach(file => {
      console.log(`   - ${file.path} (${file.status})`);
    });
    console.log();

    // Agrupar mudanças por categoria/funcionalidade
    const changesByCategory = this.groupChangesByCategory(changedFiles);
    
    // Criar issues no Jira para cada grupo de mudanças
    let created = 0;
    let updated = 0;
    let errors = 0;

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const [category, files] of Object.entries(changesByCategory)) {
      try {
        const changeSummary = this.analyzeChanges(files);
        const impl = this.createChangeImplementation(category, files, changeSummary);

        // Verificar se já existe issue recente para esta categoria
        const existing = await this.findRecentChangeIssue(category);
        
        if (existing && this.shouldUpdateIssue(existing, files)) {
          // Adicionar comentário na issue existente
          await this.addCommentToIssue(existing.key, changeSummary);
          updated++;
          console.log(`💬 ${existing.key} - Comentário adicionado: ${category}`);
        } else {
          // Criar nova issue
          const createdIssue = await this.createJiraIssue(impl);
          created++;
          console.log(`✅ ${createdIssue.key} - ${impl.name} (criado)`);
        }

        await delay(500);
      } catch (error: any) {
        errors++;
        console.error(`❌ Erro ao processar ${category}:`, error.message);
      }
    }

    console.log(`\n📊 Resumo: ${created} issues criadas, ${updated} atualizadas, ${errors} erros\n`);
  }

  /**
   * Obtém lista de arquivos modificados via Git
   */
  private getChangedFiles(fromCommit?: string, toCommit?: string): Array<{ path: string; status: string; additions?: number; deletions?: number }> {
    try {
      let command: string;
      
      if (fromCommit && toCommit) {
        // Comparar dois commits específicos
        command = `git diff --name-status --numstat ${fromCommit}..${toCommit}`;
      } else if (fromCommit) {
        // Comparar commit específico com HEAD
        command = `git diff --name-status --numstat ${fromCommit}..HEAD`;
      } else {
        // Usar arquivos staged ou modificados desde último commit
        try {
          // Tentar arquivos staged primeiro
          const staged = execSync('git diff --cached --name-status --numstat', {
            cwd: this.projectRoot,
            encoding: 'utf-8'
          }).trim();
          
          if (staged) {
            return this.parseGitDiff(staged);
          }
        } catch {
          // Se não houver staged, usar modificados
        }
        
        // Usar arquivos modificados desde último commit
        command = 'git diff HEAD --name-status --numstat';
      }

      const output = execSync(command, {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      }).trim();

      if (!output) {
        // Tentar obter último commit
        try {
          const lastCommit = execSync('git rev-parse HEAD', {
            cwd: this.projectRoot,
            encoding: 'utf-8'
          }).trim();
          
          const lastCommitTime = execSync(`git log -1 --format=%ct ${lastCommit}`, {
            cwd: this.projectRoot,
            encoding: 'utf-8'
          }).trim();
          
          const now = Math.floor(Date.now() / 1000);
          const diffSeconds = now - parseInt(lastCommitTime);
          
          // Se último commit foi há menos de 1 hora, usar arquivos modificados
          if (diffSeconds < 3600) {
            const modified = execSync('git diff --name-status --numstat HEAD', {
              cwd: this.projectRoot,
              encoding: 'utf-8'
            }).trim();
            
            if (modified) {
              return this.parseGitDiff(modified);
            }
          }
        } catch {
          // Ignorar erros
        }
        
        return [];
      }

      return this.parseGitDiff(output);
    } catch (error: any) {
      console.error('❌ Erro ao obter mudanças do Git:', error.message);
      return [];
    }
  }

  /**
   * Parse do output do git diff
   */
  private parseGitDiff(output: string): Array<{ path: string; status: string; additions?: number; deletions?: number }> {
    const lines = output.split('\n').filter(line => line.trim());
    const files: Array<{ path: string; status: string; additions?: number; deletions?: number }> = [];

    for (const line of lines) {
      const parts = line.split('\t');
      
      if (parts.length >= 2) {
        // Formato: additions deletions status path
        if (parts.length >= 4) {
          const additions = parseInt(parts[0]) || 0;
          const deletions = parseInt(parts[1]) || 0;
          const status = parts[2];
          const filePath = parts.slice(3).join('\t');
          
          // Filtrar apenas arquivos relevantes
          if (this.isRelevantFile(filePath)) {
            files.push({
              path: filePath,
              status: this.normalizeStatus(status),
              additions,
              deletions
            });
          }
        } else {
          // Formato: status path
          const status = parts[0];
          const filePath = parts.slice(1).join('\t');
          
          if (this.isRelevantFile(filePath)) {
            files.push({
              path: filePath,
              status: this.normalizeStatus(status)
            });
          }
        }
      }
    }

    return files;
  }

  /**
   * Verifica se o arquivo é relevante para rastreamento
   */
  private isRelevantFile(filePath: string): boolean {
    const ignored = [
      'node_modules',
      'dist',
      'build',
      '.git',
      '.env',
      'package-lock.json',
      'yarn.lock',
      '.log',
      '.md'
    ];

    return !ignored.some(pattern => filePath.includes(pattern)) &&
           (filePath.endsWith('.ts') || 
            filePath.endsWith('.tsx') || 
            filePath.endsWith('.js') || 
            filePath.endsWith('.jsx') ||
            filePath.endsWith('.json') ||
            filePath.endsWith('.css') ||
            filePath.endsWith('.prisma'));
  }

  /**
   * Normaliza status do Git
   */
  private normalizeStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'A': 'adicionado',
      'M': 'modificado',
      'D': 'deletado',
      'R': 'renomeado',
      'C': 'copiado',
      'U': 'não mesclado'
    };

    return statusMap[status] || status.toLowerCase();
  }

  /**
   * Agrupa mudanças por categoria/funcionalidade
   */
  private groupChangesByCategory(files: Array<{ path: string; status: string }>): Record<string, Array<{ path: string; status: string }>> {
    const grouped: Record<string, Array<{ path: string; status: string }>> = {};

    for (const file of files) {
      const category = this.determineCategory(file.path);
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push(file);
    }

    return grouped;
  }

  /**
   * Determina categoria baseada no caminho do arquivo
   */
  private determineCategory(filePath: string): string {
    if (filePath.includes('components/')) {
      if (filePath.includes('dashboard/')) {
        const parts = filePath.split('/');
        const dashboardPart = parts.find(p => p === 'dashboard');
        const index = parts.indexOf(dashboardPart || '');
        if (index >= 0 && parts[index + 1]) {
          return `Dashboard - ${this.formatCategory(parts[index + 1])}`;
        }
        return 'Dashboard';
      }
      if (filePath.includes('pep/')) return 'Prontuário Eletrônico (PEP)';
      if (filePath.includes('prescription/')) return 'Prescrições Digitais';
      if (filePath.includes('crm/')) return 'CRM com Chat';
      return 'Componentes';
    }
    
    if (filePath.includes('backend/src/routes/')) {
      const routeName = path.basename(filePath, '.ts');
      return `API - ${this.formatRouteName(routeName)}`;
    }
    
    if (filePath.includes('services/')) {
      const serviceName = path.basename(filePath, '.ts');
      return `Serviço - ${this.formatServiceName(serviceName)}`;
    }
    
    if (filePath.includes('backend/prisma/')) return 'Banco de Dados';
    if (filePath.includes('hooks/')) return 'Hooks React';
    if (filePath.includes('contexts/')) return 'Contextos React';
    if (filePath.includes('utils/')) return 'Utilitários';
    
    return 'Outros';
  }

  /**
   * Analisa as mudanças e gera um resumo
   */
  private analyzeChanges(files: Array<{ path: string; status: string; additions?: number; deletions?: number }>): {
    summary: string;
    totalAdditions: number;
    totalDeletions: number;
    filesAdded: number;
    filesModified: number;
    filesDeleted: number;
  } {
    let totalAdditions = 0;
    let totalDeletions = 0;
    let filesAdded = 0;
    let filesModified = 0;
    let filesDeleted = 0;

    for (const file of files) {
      if (file.additions) totalAdditions += file.additions;
      if (file.deletions) totalDeletions += file.deletions;
      
      if (file.status === 'adicionado') filesAdded++;
      else if (file.status === 'deletado') filesDeleted++;
      else filesModified++;
    }

    const summary = `Mudanças detectadas:\n` +
      `• ${filesAdded} arquivo(s) adicionado(s)\n` +
      `• ${filesModified} arquivo(s) modificado(s)\n` +
      `• ${filesDeleted} arquivo(s) deletado(s)\n` +
      (totalAdditions > 0 || totalDeletions > 0 
        ? `• ${totalAdditions} linha(s) adicionada(s)\n• ${totalDeletions} linha(s) removida(s)` 
        : '');

    return {
      summary,
      totalAdditions,
      totalDeletions,
      filesAdded,
      filesModified,
      filesDeleted
    };
  }

  /**
   * Cria uma implementação baseada em mudanças
   */
  private createChangeImplementation(
    category: string,
    files: Array<{ path: string; status: string }>,
    changeSummary: { summary: string; totalAdditions: number; totalDeletions: number }
  ): Implementation {
    const filePaths = files.map(f => path.join(this.projectRoot, f.path));
    const now = new Date().toISOString();
    
    // Obter commit atual se disponível
    let commitHash = '';
    let commitMessage = '';
    try {
      commitHash = execSync('git rev-parse --short HEAD', {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      }).trim();
      
      commitMessage = execSync('git log -1 --pretty=%B', {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      }).trim();
    } catch {
      // Ignorar erros
    }

    const description = `🔄 **Mudanças no Código - ${category}**\n\n` +
      `${changeSummary.summary}\n\n` +
      `📅 **Data:** ${new Date().toLocaleString('pt-BR')}\n` +
      (commitHash ? `🔖 **Commit:** ${commitHash}\n` : '') +
      (commitMessage ? `💬 **Mensagem:** ${commitMessage.substring(0, 200)}\n` : '');

    return {
      id: `change-${category.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: `Mudanças: ${category}`,
      description,
      files: filePaths,
      type: 'improvement',
      status: 'feita',
      category: 'Mudanças no Código',
      priority: this.determineChangePriority(files, changeSummary),
      lastModified: now,
      linesOfCode: changeSummary.totalAdditions + changeSummary.totalDeletions
    };
  }

  /**
   * Determina prioridade baseada nas mudanças
   */
  private determineChangePriority(
    files: Array<{ path: string; status: string }>,
    changeSummary: { totalAdditions: number; totalDeletions: number }
  ): 'low' | 'medium' | 'high' {
    const totalChanges = changeSummary.totalAdditions + changeSummary.totalDeletions;
    
    if (totalChanges > 500 || files.length > 10) return 'high';
    if (totalChanges > 100 || files.length > 5) return 'medium';
    return 'low';
  }

  /**
   * Busca issue recente de mudanças para uma categoria
   */
  private async findRecentChangeIssue(category: string): Promise<{ key: string; updated: string } | null> {
    try {
      const jql = `project = ${this.jiraConfig.projectKey} AND summary ~ "Mudanças: ${category}" AND labels = "mudanças-código" ORDER BY updated DESC`;
      const url = `${this.jiraConfig.baseUrl}/rest/api/3/search`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.jiraConfig.email}:${this.jiraConfig.apiToken}`).toString('base64')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          jql: jql,
          maxResults: 1,
          fields: ['summary', 'updated']
        })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.issues && data.issues.length > 0) {
        const issue = data.issues[0];
        const updated = issue.fields.updated;
        
        // Verificar se foi atualizada nas últimas 24 horas
        const updatedDate = new Date(updated);
        const now = new Date();
        const hoursDiff = (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          return { key: issue.key, updated };
        }
      }
    } catch {
      // Ignorar erros
    }
    
    return null;
  }

  /**
   * Verifica se deve atualizar issue existente
   */
  private shouldUpdateIssue(existing: { key: string; updated: string }, files: Array<{ path: string; status: string }>): boolean {
    // Sempre atualizar se houver mudanças significativas
    return files.length > 0;
  }

  /**
   * Adiciona comentário em uma issue existente
   */
  private async addCommentToIssue(issueKey: string, changeSummary: { summary: string }): Promise<void> {
    const comment = {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: `🔄 Nova atualização - ${new Date().toLocaleString('pt-BR')}\n\n${changeSummary.summary}`,
                marks: [{ type: 'strong' }]
              }
            ]
          }
        ]
      }
    };

    const url = `${this.jiraConfig.baseUrl}/rest/api/3/issue/${issueKey}/comment`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.jiraConfig.email}:${this.jiraConfig.apiToken}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(comment)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao adicionar comentário: ${error}`);
    }
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  // Carregar configuração
  const envPath = path.join(path.resolve(__dirname, '..'), '.env.jira');
  let jiraConfig: JiraConfig;

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars: Record<string, string> = {};
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });

    jiraConfig = {
      baseUrl: envVars.JIRA_BASE_URL || process.env.JIRA_BASE_URL || '',
      email: envVars.JIRA_EMAIL || process.env.JIRA_EMAIL || '',
      apiToken: envVars.JIRA_API_TOKEN || process.env.JIRA_API_TOKEN || '',
      projectKey: envVars.JIRA_PROJECT_KEY || process.env.JIRA_PROJECT_KEY || ''
    };
  } else {
    jiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || '',
      email: process.env.JIRA_EMAIL || '',
      apiToken: process.env.JIRA_API_TOKEN || '',
      projectKey: process.env.JIRA_PROJECT_KEY || ''
    };
  }

  // Validar configuração apenas para comandos que precisam
  if (['sync', 'dry-run'].includes(command)) {
    // Verificar se arquivo existe
    const envFileExists = fs.existsSync(envPath);
    
    // Detectar valores de exemplo
    const isExampleValue = (value: string): boolean => {
      const examplePatterns = [
        'seu-projeto',
        'seu-email@exemplo.com',
        'seu-api-token',
        'seu-api-token-aqui',
        'CLIN',
        'https://seu-projeto.atlassian.net'
      ];
      return examplePatterns.some(pattern => value.includes(pattern));
    };

    const hasExampleValues = 
      isExampleValue(jiraConfig.baseUrl) ||
      isExampleValue(jiraConfig.email) ||
      isExampleValue(jiraConfig.apiToken) ||
      (jiraConfig.projectKey === 'CLIN' && jiraConfig.apiToken.length < 30);

    if (!jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken || !jiraConfig.projectKey) {
      console.error('\n❌ Erro: Configuração do Jira não encontrada!\n');
      
      if (!envFileExists) {
        console.log('📝 O arquivo .env.jira não existe na raiz do projeto.');
        console.log('   Crie o arquivo copiando o exemplo:');
        console.log('   cp scripts/env.jira.example .env.jira\n');
      } else {
        console.log('📝 O arquivo .env.jira existe mas está incompleto.');
        console.log('   Preencha todas as variáveis necessárias.\n');
      }
      
      console.log('📋 Configure o arquivo .env.jira com suas credenciais reais:');
      console.log('   JIRA_BASE_URL=https://seu-projeto.atlassian.net');
      console.log('   JIRA_EMAIL=seu-email@exemplo.com');
      console.log('   JIRA_API_TOKEN=seu-api-token');
      console.log('   JIRA_PROJECT_KEY=CLIN\n');
      console.log('💡 Para mais detalhes, consulte: scripts/COMO_CONFIGURAR_JIRA.md\n');
      process.exit(1);
    }

    if (hasExampleValues) {
      console.error('\n❌ Erro: Você está usando valores de exemplo!\n');
      console.log('📝 O arquivo .env.jira contém valores de exemplo que precisam ser substituídos.');
      console.log('   Detectado:');
      
      if (isExampleValue(jiraConfig.baseUrl)) {
        console.log(`   ❌ JIRA_BASE_URL="${jiraConfig.baseUrl}" (valor de exemplo)`);
      }
      if (isExampleValue(jiraConfig.email)) {
        console.log(`   ❌ JIRA_EMAIL="${jiraConfig.email}" (valor de exemplo)`);
      }
      if (isExampleValue(jiraConfig.apiToken) || jiraConfig.apiToken.length < 30) {
        console.log(`   ❌ JIRA_API_TOKEN (muito curto ou valor de exemplo)`);
      }
      
      console.log('\n📋 Substitua os valores de exemplo pelas suas credenciais reais:');
      console.log('   1. JIRA_BASE_URL: Sua URL do Jira (ex: https://arco-team-z4j097q7.atlassian.net)');
      console.log('   2. JIRA_EMAIL: Seu email da conta Atlassian');
      console.log('   3. JIRA_API_TOKEN: Token obtido em https://id.atlassian.com/manage-profile/security/api-tokens');
      console.log('   4. JIRA_PROJECT_KEY: Chave do projeto (ex: KAN)\n');
      console.log('💡 Para mais detalhes, consulte: scripts/COMO_CONFIGURAR_JIRA.md\n');
      process.exit(1);
    }

    // Validação adicional: verificar formato da URL
    if (!jiraConfig.baseUrl.startsWith('https://') || !jiraConfig.baseUrl.includes('.atlassian.net')) {
      console.error('\n❌ Erro: JIRA_BASE_URL está em formato inválido!\n');
      console.log(`   Valor atual: ${jiraConfig.baseUrl}`);
      console.log('   Formato esperado: https://seu-projeto.atlassian.net\n');
      process.exit(1);
    }

    // Validação: token muito curto
    if (jiraConfig.apiToken.length < 30) {
      console.error('\n❌ Erro: JIRA_API_TOKEN parece estar incorreto!\n');
      console.log('   Tokens de API do Jira geralmente têm mais de 30 caracteres.');
      console.log('   Verifique se você copiou o token completo.\n');
      console.log('💡 Obtenha um novo token em: https://id.atlassian.com/manage-profile/security/api-tokens\n');
      process.exit(1);
    }
  }

  const agent = new ClinifyJiraAgent(jiraConfig);

  switch (command) {
    case 'analyze':
      await agent.analyzeProject();
      agent.listImplementations();
      break;

    case 'sync':
      await agent.analyzeProject();
      await agent.syncToJira(false);
      break;

    case 'dry-run':
      await agent.analyzeProject();
      await agent.syncToJira(true);
      break;

    case 'report':
      await agent.analyzeProject();
      agent.generateReport();
      break;

    case 'export':
      await agent.analyzeProject();
      agent.exportToJSON(args[1]);
      break;

    case 'clean':
      if (!jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken || !jiraConfig.projectKey) {
        console.error('\n❌ Erro: Configuração do Jira não encontrada!\n');
        process.exit(1);
      }
      console.log('⚠️  ATENÇÃO: Isso irá DELETAR TODAS as issues do projeto!');
      console.log(`   Projeto: ${jiraConfig.projectKey}`);
      console.log('   Esta ação não pode ser desfeita!\n');
      
      // Em produção, você pode adicionar uma confirmação aqui
      await agent.deleteAllIssues();
      break;

    case 'add':
      if (args.length < 2) {
        console.error('\n❌ Erro: Especifique pelo menos uma implementação para adicionar.\n');
        console.log('Uso: npm run jira:add "Nome da Implementação" "Outra Implementação"\n');
        console.log('Exemplo: npm run jira:add "Dashboard Financeiro" "Stripe Payment"\n');
        process.exit(1);
      }
      await agent.analyzeProject();
      await agent.addSpecificImplementations(args.slice(1));
      break;

    case 'register-changes':
    case 'register':
      if (!jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken || !jiraConfig.projectKey) {
        console.error('\n❌ Erro: Configuração do Jira não encontrada!\n');
        console.log('💡 Configure o arquivo .env.jira primeiro.\n');
        process.exit(1);
      }
      // Suportar: register-changes [from-commit] [to-commit]
      await agent.registerCodeChanges(args[1], args[2]);
      break;

    case 'list':
      await agent.analyzeProject();
      agent.listAvailableImplementations();
      break;

    case 'help':
    default:
      console.log('\n🔧 Clinify Jira Sync Agent\n');
      console.log('Comandos disponíveis:');
      console.log('  analyze          - Analisa o projeto e lista implementações');
      console.log('  sync             - Sincroniza TODAS as implementações com o Jira');
      console.log('  add              - Adiciona implementações específicas ao Jira');
      console.log('  register-changes - Registra mudanças no código no Jira (via Git)');
      console.log('  list             - Lista todas as implementações disponíveis');
      console.log('  clean            - Deleta TODAS as issues do projeto Jira');
      console.log('  dry-run          - Simula sincronização sem criar issues');
      console.log('  report           - Gera relatório completo do projeto');
      console.log('  export           - Exporta dados para JSON');
      console.log('  help             - Mostra esta ajuda\n');
      console.log('Exemplos:');
      console.log('  npm run jira:analyze');
      console.log('  npm run jira:list');
      console.log('  npm run jira:add "Dashboard Financeiro" "Stripe Payment"');
      console.log('  npm run jira:register-changes          # Registra mudanças desde último commit');
      console.log('  npm run jira:register-changes HEAD~1   # Registra mudanças do último commit');
      console.log('  npm run jira:register-changes abc123 def456  # Compara dois commits');
      console.log('  npm run jira:clean');
      console.log('  npm run jira:sync\n');
      break;
  }
}

main().catch(console.error);

