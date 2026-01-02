/**
 * Script para gerar assets de branding do Clinify
 * - Favicons (ico, 16x16, 32x32)
 * - Apple Touch Icon (180x180)
 * - Open Graph Image (1200x630)
 * Execute com: node scripts/generate-branding-assets.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verifica se sharp está instalado
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  console.error('❌ Sharp não está instalado. Execute: npm install sharp');
  process.exit(1);
}

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');
const FAVICON_SVG = path.join(PUBLIC_DIR, 'favicon.svg');

async function generateFavicon() {
  console.log('🎨 Gerando favicons...\n');

  if (!fs.existsSync(FAVICON_SVG)) {
    console.error(`❌ Arquivo fonte não encontrado: ${FAVICON_SVG}`);
    return false;
  }

  try {
    // Ler o SVG
    const svgBuffer = fs.readFileSync(FAVICON_SVG);

    // Gerar favicon.ico (32x32)
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'favicon.ico'));
    console.log('✅ Gerado: favicon.ico (32x32)');

    // Gerar favicon-16x16.png
    await sharp(svgBuffer)
      .resize(16, 16)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'favicon-16x16.png'));
    console.log('✅ Gerado: favicon-16x16.png');

    // Gerar favicon-32x32.png
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'));
    console.log('✅ Gerado: favicon-32x32.png');

    // Gerar apple-touch-icon.png (180x180)
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
    console.log('✅ Gerado: apple-touch-icon.png (180x180)');

    return true;
  } catch (error) {
    console.error('❌ Erro ao gerar favicons:', error.message);
    return false;
  }
}

async function generateOGImage() {
  console.log('\n📸 Gerando imagem Open Graph (1200x630)...\n');

  // Criar SVG do dashboard para og:image
  const ogImageSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
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
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bg)"/>
      
      <!-- Header com logo -->
      <rect x="0" y="0" width="1200" height="100" fill="#0f172a"/>
      <rect x="40" y="30" width="50" height="50" rx="12" fill="url(#accent)"/>
      <text x="110" y="75" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="700" fill="white">Clinify</text>
      <text x="110" y="100" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#94a3b8">Gestão Estética Inteligente</text>
      
      <!-- Main content area -->
      <text x="40" y="160" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="700" fill="white">Sistema Completo de Gestão</text>
      <text x="40" y="200" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="700" fill="white">para Clínicas de Estética</text>
      <text x="40" y="250" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#94a3b8">Controle suas finanças, agendamentos, pacientes, estoque e muito mais</text>
      <text x="40" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#94a3b8">em uma única plataforma intuitiva e moderna.</text>
      
      <!-- Feature cards -->
      <rect x="40" y="320" width="280" height="240" rx="20" fill="url(#card)"/>
      <rect x="40" y="320" width="280" height="4" rx="2" fill="url(#accent)"/>
      <circle cx="80" cy="380" r="24" fill="url(#accent)" opacity="0.2"/>
      <text x="80" y="390" font-family="system-ui" font-size="28" text-anchor="middle">💰</text>
      <text x="120" y="385" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="white">Gestão Financeira</text>
      <text x="120" y="410" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94a3b8">Controle completo de receitas,</text>
      <text x="120" y="430" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94a3b8">despesas e relatórios</text>
      
      <rect x="340" y="320" width="280" height="240" rx="20" fill="url(#card)"/>
      <rect x="340" y="320" width="280" height="4" rx="2" fill="url(#accent)"/>
      <circle cx="380" cy="380" r="24" fill="url(#accent)" opacity="0.2"/>
      <text x="380" y="390" font-family="system-ui" font-size="28" text-anchor="middle">📅</text>
      <text x="420" y="385" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="white">Agendamentos</text>
      <text x="420" y="410" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94a3b8">Agende consultas e gerencie</text>
      <text x="420" y="430" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94a3b8">sua agenda com facilidade</text>
      
      <rect x="640" y="320" width="280" height="240" rx="20" fill="url(#card)"/>
      <rect x="640" y="320" width="280" height="4" rx="2" fill="url(#accent)"/>
      <circle cx="680" cy="380" r="24" fill="url(#accent)" opacity="0.2"/>
      <text x="680" y="390" font-family="system-ui" font-size="28" text-anchor="middle">👥</text>
      <text x="720" y="385" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="white">CRM Integrado</text>
      <text x="720" y="410" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94a3b8">WhatsApp integrado e</text>
      <text x="720" y="430" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94a3b8">gestão de relacionamento</text>
      
      <rect x="940" y="320" width="240" height="240" rx="20" fill="url(#card)"/>
      <rect x="940" y="320" width="240" height="4" rx="2" fill="url(#accent)"/>
      <circle cx="980" cy="380" r="24" fill="url(#accent)" opacity="0.2"/>
      <text x="980" y="390" font-family="system-ui" font-size="28" text-anchor="middle">📊</text>
      <text x="1020" y="385" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="white">Relatórios</text>
      <text x="1020" y="410" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94a3b8">Insights e análises</text>
      <text x="1020" y="430" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94a3b8">em tempo real</text>
      
      <!-- Dashboard preview (direita) -->
      <rect x="700" y="100" width="460" height="200" rx="16" fill="url(#card)"/>
      <rect x="720" y="120" width="420" height="160" rx="12" fill="#0f172a"/>
      
      <!-- Mini dashboard elements -->
      <rect x="740" y="140" width="180" height="50" rx="8" fill="#10b981" opacity="0.1"/>
      <text x="750" y="165" font-family="system-ui" font-size="12" fill="#94a3b8">Receita do Mês</text>
      <text x="750" y="185" font-family="system-ui" font-size="20" font-weight="700" fill="#10b981">R$ 45.890</text>
      
      <rect x="940" y="140" width="180" height="50" rx="8" fill="#ef4444" opacity="0.1"/>
      <text x="950" y="165" font-family="system-ui" font-size="12" fill="#94a3b8">Despesas</text>
      <text x="950" y="185" font-family="system-ui" font-size="20" font-weight="700" fill="#ef4444">R$ 18.450</text>
      
      <rect x="740" y="210" width="180" height="50" rx="8" fill="#3b82f6" opacity="0.1"/>
      <text x="750" y="235" font-family="system-ui" font-size="12" fill="#94a3b8">Agendamentos</text>
      <text x="750" y="255" font-family="system-ui" font-size="20" font-weight="700" fill="#3b82f6">12 hoje</text>
      
      <rect x="940" y="210" width="180" height="50" rx="8" fill="#a855f7" opacity="0.1"/>
      <text x="950" y="235" font-family="system-ui" font-size="12" fill="#94a3b8">Pacientes</text>
      <text x="950" y="255" font-family="system-ui" font-size="20" font-weight="700" fill="#a855f7">248 ativos</text>
      
      <!-- Mini chart -->
      <rect x="740" y="280" width="380" height="60" rx="8" fill="#0f172a"/>
      <text x="750" y="305" font-family="system-ui" font-size="11" fill="#94a3b8">Evolução Financeira</text>
      <rect x="750" y="315" width="25" height="20" rx="2" fill="#10b981" opacity="0.3"/>
      <rect x="750" y="325" width="25" height="10" rx="2" fill="#10b981"/>
      <rect x="785" y="310" width="25" height="25" rx="2" fill="#10b981" opacity="0.3"/>
      <rect x="785" y="320" width="25" height="15" rx="2" fill="#10b981"/>
      <rect x="820" y="305" width="25" height="30" rx="2" fill="#10b981" opacity="0.3"/>
      <rect x="820" y="315" width="25" height="20" rx="2" fill="#10b981"/>
      <rect x="855" y="300" width="25" height="35" rx="2" fill="#10b981" opacity="0.3"/>
      <rect x="855" y="310" width="25" height="25" rx="2" fill="#10b981"/>
      <rect x="890" y="302" width="25" height="33" rx="2" fill="#10b981" opacity="0.3"/>
      <rect x="890" y="312" width="25" height="23" rx="2" fill="#10b981"/>
      <rect x="925" y="298" width="25" height="37" rx="2" fill="#10b981" opacity="0.3"/>
      <rect x="925" y="308" width="25" height="27" rx="2" fill="#10b981"/>
      <rect x="960" y="300" width="25" height="35" rx="2" fill="#10b981" opacity="0.3"/>
      <rect x="960" y="310" width="25" height="25" rx="2" fill="#10b981"/>
      <rect x="995" y="295" width="25" height="40" rx="2" fill="#10b981" opacity="0.3"/>
      <rect x="995" y="305" width="25" height="30" rx="2" fill="#10b981"/>
      <rect x="1030" y="297" width="25" height="38" rx="2" fill="#10b981" opacity="0.3"/>
      <rect x="1030" y="307" width="25" height="28" rx="2" fill="#10b981"/>
      <rect x="1065" y="299" width="25" height="36" rx="2" fill="#10b981" opacity="0.3"/>
      <rect x="1065" y="309" width="25" height="26" rx="2" fill="#10b981"/>
      
      <!-- CTA badge -->
      <rect x="40" y="580" width="200" height="40" rx="20" fill="url(#accent)"/>
      <text x="140" y="605" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="white" text-anchor="middle">Experimente Grátis</text>
      
      <!-- Decorative elements -->
      <circle cx="1100" cy="100" r="80" fill="url(#accent)" opacity="0.1"/>
      <circle cx="1150" cy="550" r="60" fill="url(#accent)" opacity="0.1"/>
    </svg>
  `;

  try {
    await sharp(Buffer.from(ogImageSvg))
      .resize(1200, 630)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'og-image.png'));
    console.log('✅ Gerado: og-image.png (1200x630)');
    return true;
  } catch (error) {
    console.error('❌ Erro ao gerar og-image:', error.message);
    return false;
  }
}

async function main() {
  console.log('🎨 Clinify Branding Assets Generator\n');
  console.log('Gerando favicons e imagem Open Graph...\n');

  const faviconSuccess = await generateFavicon();
  const ogImageSuccess = await generateOGImage();

  console.log('\n-----------------------------------');
  if (faviconSuccess && ogImageSuccess) {
    console.log('✨ Todos os assets foram gerados com sucesso!');
  } else {
    console.log('⚠️  Alguns assets falharam ao serem gerados');
  }
}

main().catch(console.error);



