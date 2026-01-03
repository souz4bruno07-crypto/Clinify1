/**
 * Script para gerar todos os ícones PWA do Clinify
 * Execute com: node scripts/generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');

// Verifica se sharp está instalado
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Sharp não está instalado. Execute: npm install sharp');
  process.exit(1);
}

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'public', 'screenshots');

// Tamanhos dos ícones padrão
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Configuração dos ícones
const iconsToGenerate = [
  // Ícones principais
  ...ICON_SIZES.map(size => ({
    source: 'icon.svg',
    output: `icon-${size}x${size}.png`,
    width: size,
    height: size
  })),
  // Ícone maskable
  {
    source: 'icon-maskable.svg',
    output: 'maskable-icon-512x512.png',
    width: 512,
    height: 512
  },
  // Ícones de atalho
  {
    source: 'shortcut-transaction.svg',
    output: 'shortcut-transaction.png',
    width: 192,
    height: 192
  },
  {
    source: 'shortcut-calendar.svg',
    output: 'shortcut-calendar.png',
    width: 192,
    height: 192
  },
  {
    source: 'shortcut-crm.svg',
    output: 'shortcut-crm.png',
    width: 192,
    height: 192
  }
];

async function generateIcon(config) {
  const sourcePath = path.join(ICONS_DIR, config.source);
  const outputPath = path.join(ICONS_DIR, config.output);

  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Arquivo fonte não encontrado: ${config.source}`);
    return false;
  }

  try {
    await sharp(sourcePath)
      .resize(config.width, config.height)
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Gerado: ${config.output} (${config.width}x${config.height})`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao gerar ${config.output}:`, error.message);
    return false;
  }
}

async function generateScreenshots() {
  // Criar diretório de screenshots se não existir
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  // Gerar screenshot desktop (placeholder com design do Clinify)
  const desktopSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0f172a"/>
          <stop offset="100%" style="stop-color:#1e293b"/>
        </linearGradient>
        <linearGradient id="sidebar" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#10b981"/>
          <stop offset="100%" style="stop-color:#059669"/>
        </linearGradient>
        <linearGradient id="card" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e293b"/>
          <stop offset="100%" style="stop-color:#334155"/>
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="1920" height="1080" fill="url(#bg)"/>
      
      <!-- Sidebar -->
      <rect x="0" y="0" width="280" height="1080" fill="#0f172a"/>
      <rect x="0" y="0" width="4" height="1080" fill="url(#sidebar)"/>
      
      <!-- Logo area -->
      <rect x="24" y="24" width="48" height="48" rx="12" fill="url(#sidebar)"/>
      <text x="88" y="56" font-family="system-ui" font-size="24" font-weight="700" fill="white">Clinify</text>
      
      <!-- Sidebar menu items -->
      <rect x="16" y="100" width="248" height="48" rx="8" fill="#10b981" opacity="0.2"/>
      <rect x="16" y="100" width="4" height="48" rx="2" fill="#10b981"/>
      <circle cx="48" cy="124" r="8" fill="#10b981"/>
      <rect x="70" y="116" width="100" height="16" rx="4" fill="white" opacity="0.8"/>
      
      <circle cx="48" cy="180" r="8" fill="#64748b"/>
      <rect x="70" y="172" width="80" height="16" rx="4" fill="#64748b"/>
      
      <circle cx="48" cy="236" r="8" fill="#64748b"/>
      <rect x="70" y="228" width="120" height="16" rx="4" fill="#64748b"/>
      
      <circle cx="48" cy="292" r="8" fill="#64748b"/>
      <rect x="70" y="284" width="90" height="16" rx="4" fill="#64748b"/>
      
      <!-- Main content header -->
      <text x="320" y="60" font-family="system-ui" font-size="32" font-weight="700" fill="white">Dashboard</text>
      <text x="320" y="90" font-family="system-ui" font-size="16" fill="#94a3b8">Visão geral das suas finanças</text>
      
      <!-- Stats cards -->
      <rect x="320" y="120" width="380" height="140" rx="16" fill="url(#card)"/>
      <text x="350" y="160" font-family="system-ui" font-size="14" fill="#94a3b8">Receita do Mês</text>
      <text x="350" y="210" font-family="system-ui" font-size="36" font-weight="700" fill="#10b981">R$ 45.890</text>
      <rect x="350" y="230" width="80" height="20" rx="10" fill="#10b981" opacity="0.2"/>
      <text x="365" y="245" font-family="system-ui" font-size="12" fill="#10b981">+12.5%</text>
      
      <rect x="720" y="120" width="380" height="140" rx="16" fill="url(#card)"/>
      <text x="750" y="160" font-family="system-ui" font-size="14" fill="#94a3b8">Despesas do Mês</text>
      <text x="750" y="210" font-family="system-ui" font-size="36" font-weight="700" fill="#ef4444">R$ 18.450</text>
      <rect x="750" y="230" width="80" height="20" rx="10" fill="#ef4444" opacity="0.2"/>
      <text x="768" y="245" font-family="system-ui" font-size="12" fill="#ef4444">-3.2%</text>
      
      <rect x="1120" y="120" width="380" height="140" rx="16" fill="url(#card)"/>
      <text x="1150" y="160" font-family="system-ui" font-size="14" fill="#94a3b8">Lucro Líquido</text>
      <text x="1150" y="210" font-family="system-ui" font-size="36" font-weight="700" fill="white">R$ 27.440</text>
      <rect x="1150" y="230" width="80" height="20" rx="10" fill="#10b981" opacity="0.2"/>
      <text x="1165" y="245" font-family="system-ui" font-size="12" fill="#10b981">+24.8%</text>
      
      <rect x="1520" y="120" width="380" height="140" rx="16" fill="url(#card)"/>
      <text x="1550" y="160" font-family="system-ui" font-size="14" fill="#94a3b8">Agendamentos Hoje</text>
      <text x="1550" y="210" font-family="system-ui" font-size="36" font-weight="700" fill="#3b82f6">12</text>
      <text x="1550" y="245" font-family="system-ui" font-size="14" fill="#94a3b8">3 confirmados</text>
      
      <!-- Chart area -->
      <rect x="320" y="290" width="780" height="400" rx="16" fill="url(#card)"/>
      <text x="350" y="330" font-family="system-ui" font-size="18" font-weight="600" fill="white">Evolução Financeira</text>
      
      <!-- Chart bars -->
      <rect x="380" y="480" width="40" height="160" rx="4" fill="#10b981" opacity="0.3"/>
      <rect x="380" y="540" width="40" height="100" rx="4" fill="#10b981"/>
      
      <rect x="460" y="450" width="40" height="190" rx="4" fill="#10b981" opacity="0.3"/>
      <rect x="460" y="520" width="40" height="120" rx="4" fill="#10b981"/>
      
      <rect x="540" y="420" width="40" height="220" rx="4" fill="#10b981" opacity="0.3"/>
      <rect x="540" y="490" width="40" height="150" rx="4" fill="#10b981"/>
      
      <rect x="620" y="380" width="40" height="260" rx="4" fill="#10b981" opacity="0.3"/>
      <rect x="620" y="460" width="40" height="180" rx="4" fill="#10b981"/>
      
      <rect x="700" y="400" width="40" height="240" rx="4" fill="#10b981" opacity="0.3"/>
      <rect x="700" y="480" width="40" height="160" rx="4" fill="#10b981"/>
      
      <rect x="780" y="360" width="40" height="280" rx="4" fill="#10b981" opacity="0.3"/>
      <rect x="780" y="420" width="40" height="220" rx="4" fill="#10b981"/>
      
      <rect x="860" y="380" width="40" height="260" rx="4" fill="#10b981" opacity="0.3"/>
      <rect x="860" y="450" width="40" height="190" rx="4" fill="#10b981"/>
      
      <rect x="940" y="350" width="40" height="290" rx="4" fill="#10b981" opacity="0.3"/>
      <rect x="940" y="400" width="40" height="240" rx="4" fill="#10b981"/>
      
      <rect x="1020" y="370" width="40" height="270" rx="4" fill="#10b981" opacity="0.3"/>
      <rect x="1020" y="420" width="40" height="220" rx="4" fill="#10b981"/>
      
      <!-- Right panel -->
      <rect x="1120" y="290" width="780" height="400" rx="16" fill="url(#card)"/>
      <text x="1150" y="330" font-family="system-ui" font-size="18" font-weight="600" fill="white">Próximos Agendamentos</text>
      
      <!-- Appointments -->
      <rect x="1140" y="360" width="740" height="70" rx="12" fill="#0f172a"/>
      <circle cx="1180" cy="395" r="20" fill="#10b981" opacity="0.2"/>
      <text x="1180" y="400" font-family="system-ui" font-size="12" font-weight="600" fill="#10b981" text-anchor="middle">MC</text>
      <text x="1220" y="385" font-family="system-ui" font-size="14" font-weight="600" fill="white">Maria Costa</text>
      <text x="1220" y="410" font-family="system-ui" font-size="12" fill="#94a3b8">Limpeza de Pele • 09:00</text>
      <rect x="1780" y="382" width="80" height="26" rx="13" fill="#10b981" opacity="0.2"/>
      <text x="1820" y="400" font-family="system-ui" font-size="11" fill="#10b981" text-anchor="middle">Confirmado</text>
      
      <rect x="1140" y="440" width="740" height="70" rx="12" fill="#0f172a"/>
      <circle cx="1180" cy="475" r="20" fill="#3b82f6" opacity="0.2"/>
      <text x="1180" y="480" font-family="system-ui" font-size="12" font-weight="600" fill="#3b82f6" text-anchor="middle">JS</text>
      <text x="1220" y="465" font-family="system-ui" font-size="14" font-weight="600" fill="white">João Silva</text>
      <text x="1220" y="490" font-family="system-ui" font-size="12" fill="#94a3b8">Botox • 10:30</text>
      <rect x="1780" y="462" width="80" height="26" rx="13" fill="#f59e0b" opacity="0.2"/>
      <text x="1820" y="480" font-family="system-ui" font-size="11" fill="#f59e0b" text-anchor="middle">Pendente</text>
      
      <rect x="1140" y="520" width="740" height="70" rx="12" fill="#0f172a"/>
      <circle cx="1180" cy="555" r="20" fill="#a855f7" opacity="0.2"/>
      <text x="1180" y="560" font-family="system-ui" font-size="12" font-weight="600" fill="#a855f7" text-anchor="middle">AS</text>
      <text x="1220" y="545" font-family="system-ui" font-size="14" font-weight="600" fill="white">Ana Santos</text>
      <text x="1220" y="570" font-family="system-ui" font-size="12" fill="#94a3b8">Preenchimento • 14:00</text>
      <rect x="1780" y="542" width="80" height="26" rx="13" fill="#10b981" opacity="0.2"/>
      <text x="1820" y="560" font-family="system-ui" font-size="11" fill="#10b981" text-anchor="middle">Confirmado</text>
      
      <rect x="1140" y="600" width="740" height="70" rx="12" fill="#0f172a"/>
      <circle cx="1180" cy="635" r="20" fill="#ec4899" opacity="0.2"/>
      <text x="1180" y="640" font-family="system-ui" font-size="12" font-weight="600" fill="#ec4899" text-anchor="middle">PM</text>
      <text x="1220" y="625" font-family="system-ui" font-size="14" font-weight="600" fill="white">Paula Mendes</text>
      <text x="1220" y="650" font-family="system-ui" font-size="12" fill="#94a3b8">Microagulhamento • 16:00</text>
      <rect x="1780" y="622" width="80" height="26" rx="13" fill="#10b981" opacity="0.2"/>
      <text x="1820" y="640" font-family="system-ui" font-size="11" fill="#10b981" text-anchor="middle">Confirmado</text>
      
      <!-- Bottom cards -->
      <rect x="320" y="720" width="580" height="300" rx="16" fill="url(#card)"/>
      <text x="350" y="760" font-family="system-ui" font-size="18" font-weight="600" fill="white">Últimas Transações</text>
      
      <!-- Transaction items -->
      <rect x="340" y="790" width="540" height="50" rx="8" fill="#0f172a"/>
      <circle cx="370" cy="815" r="16" fill="#10b981" opacity="0.2"/>
      <text x="400" y="810" font-family="system-ui" font-size="13" fill="white">Limpeza de Pele - Maria Costa</text>
      <text x="400" y="828" font-family="system-ui" font-size="11" fill="#94a3b8">Hoje, 09:45</text>
      <text x="850" y="820" font-family="system-ui" font-size="14" font-weight="600" fill="#10b981" text-anchor="end">+R$ 250,00</text>
      
      <rect x="340" y="850" width="540" height="50" rx="8" fill="#0f172a"/>
      <circle cx="370" cy="875" r="16" fill="#ef4444" opacity="0.2"/>
      <text x="400" y="870" font-family="system-ui" font-size="13" fill="white">Produtos de Limpeza</text>
      <text x="400" y="888" font-family="system-ui" font-size="11" fill="#94a3b8">Ontem, 15:30</text>
      <text x="850" y="880" font-family="system-ui" font-size="14" font-weight="600" fill="#ef4444" text-anchor="end">-R$ 89,90</text>
      
      <rect x="340" y="910" width="540" height="50" rx="8" fill="#0f172a"/>
      <circle cx="370" cy="935" r="16" fill="#10b981" opacity="0.2"/>
      <text x="400" y="930" font-family="system-ui" font-size="13" fill="white">Botox - João Silva</text>
      <text x="400" y="948" font-family="system-ui" font-size="11" fill="#94a3b8">Ontem, 14:20</text>
      <text x="850" y="940" font-family="system-ui" font-size="14" font-weight="600" fill="#10b981" text-anchor="end">+R$ 1.200,00</text>
      
      <rect x="340" y="970" width="540" height="50" rx="8" fill="#0f172a"/>
      <circle cx="370" cy="995" r="16" fill="#10b981" opacity="0.2"/>
      <text x="400" y="990" font-family="system-ui" font-size="13" fill="white">Preenchimento - Carla Lima</text>
      <text x="400" y="1008" font-family="system-ui" font-size="11" fill="#94a3b8">22/12, 11:00</text>
      <text x="850" y="1000" font-family="system-ui" font-size="14" font-weight="600" fill="#10b981" text-anchor="end">+R$ 2.500,00</text>
      
      <!-- AI Insights card -->
      <rect x="920" y="720" width="580" height="300" rx="16" fill="url(#card)"/>
      <rect x="920" y="720" width="580" height="4" rx="2" fill="url(#sidebar)"/>
      <text x="950" y="760" font-family="system-ui" font-size="18" font-weight="600" fill="white">💡 Insights da IA</text>
      
      <rect x="940" y="790" width="540" height="80" rx="12" fill="#10b981" opacity="0.1"/>
      <text x="960" y="820" font-family="system-ui" font-size="13" fill="white">Seu faturamento aumentou 24% este mês!</text>
      <text x="960" y="845" font-family="system-ui" font-size="12" fill="#94a3b8">Continue assim. Procedimentos de botox lideram suas receitas.</text>
      
      <rect x="940" y="885" width="540" height="80" rx="12" fill="#f59e0b" opacity="0.1"/>
      <text x="960" y="915" font-family="system-ui" font-size="13" fill="white">3 pacientes não retornaram nos últimos 60 dias</text>
      <text x="960" y="940" font-family="system-ui" font-size="12" fill="#94a3b8">Considere enviar uma mensagem de reativação.</text>
      
      <!-- Quick Actions -->
      <rect x="1520" y="720" width="380" height="300" rx="16" fill="url(#card)"/>
      <text x="1550" y="760" font-family="system-ui" font-size="18" font-weight="600" fill="white">Ações Rápidas</text>
      
      <rect x="1540" y="790" width="340" height="50" rx="12" fill="#10b981"/>
      <text x="1710" y="822" font-family="system-ui" font-size="14" font-weight="600" fill="white" text-anchor="middle">+ Nova Transação</text>
      
      <rect x="1540" y="850" width="340" height="50" rx="12" fill="#0f172a" stroke="#334155" stroke-width="2"/>
      <text x="1710" y="882" font-family="system-ui" font-size="14" font-weight="600" fill="white" text-anchor="middle">📅 Novo Agendamento</text>
      
      <rect x="1540" y="910" width="340" height="50" rx="12" fill="#0f172a" stroke="#334155" stroke-width="2"/>
      <text x="1710" y="942" font-family="system-ui" font-size="14" font-weight="600" fill="white" text-anchor="middle">👤 Novo Paciente</text>
      
      <rect x="1540" y="970" width="340" height="50" rx="12" fill="#0f172a" stroke="#334155" stroke-width="2"/>
      <text x="1710" y="1002" font-family="system-ui" font-size="14" font-weight="600" fill="white" text-anchor="middle">💬 Abrir CRM</text>
    </svg>
  `;

  // Gerar screenshot mobile
  const mobileSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0f172a"/>
          <stop offset="100%" style="stop-color:#1e293b"/>
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#10b981"/>
          <stop offset="100%" style="stop-color:#059669"/>
        </linearGradient>
        <linearGradient id="card" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e293b"/>
          <stop offset="100%" style="stop-color:#334155"/>
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="390" height="844" fill="url(#bg)"/>
      
      <!-- Status bar area -->
      <rect x="0" y="0" width="390" height="44" fill="#0f172a"/>
      
      <!-- Header -->
      <rect x="0" y="44" width="390" height="70" fill="#0f172a"/>
      <rect x="16" y="56" width="40" height="40" rx="10" fill="url(#accent)"/>
      <text x="72" y="82" font-family="system-ui" font-size="20" font-weight="700" fill="white">Clinify</text>
      
      <!-- Notification bell -->
      <circle cx="350" cy="76" r="18" fill="#1e293b"/>
      <text x="350" y="82" font-family="system-ui" font-size="16" text-anchor="middle">🔔</text>
      
      <!-- Welcome section -->
      <text x="16" y="150" font-family="system-ui" font-size="14" fill="#94a3b8">Olá, Dra. Marina 👋</text>
      <text x="16" y="175" font-family="system-ui" font-size="22" font-weight="700" fill="white">Seu resumo de hoje</text>
      
      <!-- Stats cards row -->
      <rect x="16" y="200" width="175" height="90" rx="16" fill="url(#card)"/>
      <text x="32" y="230" font-family="system-ui" font-size="11" fill="#94a3b8">Receita Hoje</text>
      <text x="32" y="260" font-family="system-ui" font-size="22" font-weight="700" fill="#10b981">R$ 3.450</text>
      <rect x="32" y="272" width="50" height="16" rx="8" fill="#10b981" opacity="0.2"/>
      <text x="42" y="284" font-family="system-ui" font-size="10" fill="#10b981">+15%</text>
      
      <rect x="199" y="200" width="175" height="90" rx="16" fill="url(#card)"/>
      <text x="215" y="230" font-family="system-ui" font-size="11" fill="#94a3b8">Agendamentos</text>
      <text x="215" y="260" font-family="system-ui" font-size="22" font-weight="700" fill="#3b82f6">8</text>
      <text x="215" y="284" font-family="system-ui" font-size="11" fill="#94a3b8">5 confirmados</text>
      
      <!-- Chart card -->
      <rect x="16" y="310" width="358" height="180" rx="16" fill="url(#card)"/>
      <text x="32" y="345" font-family="system-ui" font-size="14" font-weight="600" fill="white">Receita Semanal</text>
      
      <!-- Mini chart -->
      <rect x="50" y="410" width="30" height="60" rx="4" fill="#10b981" opacity="0.3"/>
      <rect x="50" y="440" width="30" height="30" rx="4" fill="#10b981"/>
      
      <rect x="95" y="390" width="30" height="80" rx="4" fill="#10b981" opacity="0.3"/>
      <rect x="95" y="430" width="30" height="40" rx="4" fill="#10b981"/>
      
      <rect x="140" y="370" width="30" height="100" rx="4" fill="#10b981" opacity="0.3"/>
      <rect x="140" y="410" width="30" height="60" rx="4" fill="#10b981"/>
      
      <rect x="185" y="380" width="30" height="90" rx="4" fill="#10b981" opacity="0.3"/>
      <rect x="185" y="420" width="30" height="50" rx="4" fill="#10b981"/>
      
      <rect x="230" y="360" width="30" height="110" rx="4" fill="#10b981" opacity="0.3"/>
      <rect x="230" y="390" width="30" height="80" rx="4" fill="#10b981"/>
      
      <rect x="275" y="375" width="30" height="95" rx="4" fill="#10b981" opacity="0.3"/>
      <rect x="275" y="405" width="30" height="65" rx="4" fill="#10b981"/>
      
      <rect x="320" y="365" width="30" height="105" rx="4" fill="#10b981" opacity="0.3"/>
      <rect x="320" y="395" width="30" height="75" rx="4" fill="#10b981"/>
      
      <!-- Day labels -->
      <text x="65" y="485" font-family="system-ui" font-size="10" fill="#64748b" text-anchor="middle">Seg</text>
      <text x="110" y="485" font-family="system-ui" font-size="10" fill="#64748b" text-anchor="middle">Ter</text>
      <text x="155" y="485" font-family="system-ui" font-size="10" fill="#64748b" text-anchor="middle">Qua</text>
      <text x="200" y="485" font-family="system-ui" font-size="10" fill="#64748b" text-anchor="middle">Qui</text>
      <text x="245" y="485" font-family="system-ui" font-size="10" fill="#64748b" text-anchor="middle">Sex</text>
      <text x="290" y="485" font-family="system-ui" font-size="10" fill="#64748b" text-anchor="middle">Sab</text>
      <text x="335" y="485" font-family="system-ui" font-size="10" fill="#10b981" text-anchor="middle">Hoje</text>
      
      <!-- Appointments section -->
      <text x="16" y="525" font-family="system-ui" font-size="16" font-weight="600" fill="white">Próximos Agendamentos</text>
      
      <rect x="16" y="545" width="358" height="70" rx="12" fill="url(#card)"/>
      <circle cx="50" cy="580" r="18" fill="#10b981" opacity="0.2"/>
      <text x="50" y="585" font-family="system-ui" font-size="11" font-weight="600" fill="#10b981" text-anchor="middle">MC</text>
      <text x="80" y="572" font-family="system-ui" font-size="13" font-weight="600" fill="white">Maria Costa</text>
      <text x="80" y="592" font-family="system-ui" font-size="11" fill="#94a3b8">Limpeza de Pele</text>
      <text x="340" y="572" font-family="system-ui" font-size="12" font-weight="600" fill="white" text-anchor="end">09:00</text>
      <rect x="300" y="582" width="58" height="18" rx="9" fill="#10b981" opacity="0.2"/>
      <text x="329" y="595" font-family="system-ui" font-size="9" fill="#10b981" text-anchor="middle">Confirmado</text>
      
      <rect x="16" y="625" width="358" height="70" rx="12" fill="url(#card)"/>
      <circle cx="50" cy="660" r="18" fill="#3b82f6" opacity="0.2"/>
      <text x="50" y="665" font-family="system-ui" font-size="11" font-weight="600" fill="#3b82f6" text-anchor="middle">JS</text>
      <text x="80" y="652" font-family="system-ui" font-size="13" font-weight="600" fill="white">João Silva</text>
      <text x="80" y="672" font-family="system-ui" font-size="11" fill="#94a3b8">Botox</text>
      <text x="340" y="652" font-family="system-ui" font-size="12" font-weight="600" fill="white" text-anchor="end">10:30</text>
      <rect x="300" y="662" width="58" height="18" rx="9" fill="#f59e0b" opacity="0.2"/>
      <text x="329" y="675" font-family="system-ui" font-size="9" fill="#f59e0b" text-anchor="middle">Pendente</text>
      
      <rect x="16" y="705" width="358" height="70" rx="12" fill="url(#card)"/>
      <circle cx="50" cy="740" r="18" fill="#a855f7" opacity="0.2"/>
      <text x="50" y="745" font-family="system-ui" font-size="11" font-weight="600" fill="#a855f7" text-anchor="middle">AS</text>
      <text x="80" y="732" font-family="system-ui" font-size="13" font-weight="600" fill="white">Ana Santos</text>
      <text x="80" y="752" font-family="system-ui" font-size="11" fill="#94a3b8">Preenchimento</text>
      <text x="340" y="732" font-family="system-ui" font-size="12" font-weight="600" fill="white" text-anchor="end">14:00</text>
      <rect x="300" y="742" width="58" height="18" rx="9" fill="#10b981" opacity="0.2"/>
      <text x="329" y="755" font-family="system-ui" font-size="9" fill="#10b981" text-anchor="middle">Confirmado</text>
      
      <!-- Bottom navigation -->
      <rect x="0" y="788" width="390" height="56" fill="#0f172a"/>
      <rect x="0" y="788" width="390" height="1" fill="#1e293b"/>
      
      <!-- Nav items -->
      <g fill="#94a3b8">
        <rect x="35" y="800" width="24" height="24" rx="4" fill="#10b981"/>
        <text x="47" y="836" font-family="system-ui" font-size="10" fill="#10b981" text-anchor="middle">Início</text>
        
        <text x="117" y="818" font-family="system-ui" font-size="20" text-anchor="middle">📅</text>
        <text x="117" y="836" font-family="system-ui" font-size="10" fill="#94a3b8" text-anchor="middle">Agenda</text>
        
        <text x="195" y="818" font-family="system-ui" font-size="20" text-anchor="middle">👥</text>
        <text x="195" y="836" font-family="system-ui" font-size="10" fill="#94a3b8" text-anchor="middle">Pacientes</text>
        
        <text x="273" y="818" font-family="system-ui" font-size="20" text-anchor="middle">💰</text>
        <text x="273" y="836" font-family="system-ui" font-size="10" fill="#94a3b8" text-anchor="middle">Finanças</text>
        
        <text x="351" y="818" font-family="system-ui" font-size="20" text-anchor="middle">⚙️</text>
        <text x="351" y="836" font-family="system-ui" font-size="10" fill="#94a3b8" text-anchor="middle">Config</text>
      </g>
    </svg>
  `;

  try {
    await sharp(Buffer.from(desktopSvg))
      .resize(1920, 1080)
      .png()
      .toFile(path.join(SCREENSHOTS_DIR, 'desktop-dashboard.png'));
    console.log('✅ Gerado: desktop-dashboard.png (1920x1080)');

    await sharp(Buffer.from(mobileSvg))
      .resize(390, 844)
      .png()
      .toFile(path.join(SCREENSHOTS_DIR, 'mobile-dashboard.png'));
    console.log('✅ Gerado: mobile-dashboard.png (390x844)');

    return true;
  } catch (error) {
    console.error('❌ Erro ao gerar screenshots:', error.message);
    return false;
  }
}

async function main() {
  console.log('🎨 Clinify PWA Icons Generator\n');
  console.log('Gerando ícones com identidade visual verde esmeralda (#10b981)...\n');

  let successCount = 0;
  let failCount = 0;

  // Gerar ícones
  for (const config of iconsToGenerate) {
    const success = await generateIcon(config);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n📸 Gerando screenshots...\n');
  await generateScreenshots();

  console.log('\n-----------------------------------');
  console.log(`✨ Concluído: ${successCount} ícones gerados`);
  if (failCount > 0) {
    console.log(`⚠️  ${failCount} ícones falharam`);
  }
}

main().catch(console.error);












