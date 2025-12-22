
import {GoogleGenAI, Type} from "@google/genai";
import { Transaction, AIAnalysisResult, MonthlyTarget } from "../types";

const toBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const askFinancialAdvisor = async (
  question: string, 
  transactions: Transaction[], 
  clinicName: string
): Promise<string> => {
  const totalRev = transactions.filter(t => t.type === 'revenue').reduce((a, b) => a + b.amount, 0);
  const totalExp = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const balance = totalRev - totalExp;
  
  const lowerQ = question.toLowerCase();
  let fallbackResponse = "";

  if (lowerQ.includes('lucro') || lowerQ.includes('resultado') || lowerQ.includes('sobrou')) {
      const margin = totalRev > 0 ? ((balance / totalRev) * 100).toFixed(1) : "0";
      fallbackResponse = `Seu lucro atual é de **${toBRL(balance)}** com margem de **${margin}%**.`;
  } else if (lowerQ.includes('gasto') || lowerQ.includes('despesa') || lowerQ.includes('compras')) {
      fallbackResponse = `Você teve um total de **${toBRL(totalExp)}** em despesas totais.`;
  } else {
      fallbackResponse = `Analisei seus lançamentos: 🟢 Entradas: **${toBRL(totalRev)}** | 🔴 Saídas: **${toBRL(totalExp)}**.`;
  }

  if (!process.env.API_KEY) return fallbackResponse;
  
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  const summary = transactions.slice(0, 100).map(t => ({ d: new Date(t.date).toLocaleDateString(), desc: t.description, cat: t.category, v: t.amount, t: t.type }));
  const prompt = `Atue como CFO Sênior de uma clínica de estética. Dados atuais: ${JSON.stringify(summary)}. Pergunta da Doutora: "${question}". Responda de forma executiva, foco em lucratividade e gestão de caixa.`;

  try {
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text || fallbackResponse;
  } catch (error: any) {
    return fallbackResponse;
  }
};

export const analyzeFinancialHealth = async (
  transactions: Transaction[],
  clinicName: string,
  target?: MonthlyTarget | null
): Promise<AIAnalysisResult | null> => {
  const totalRev = transactions.filter(t => t.type === 'revenue').reduce((a, b) => a + b.amount, 0);
  
  const variableExpenses = transactions.filter(t => 
      t.type === 'expense' && 
      (t.category.toLowerCase().includes('insumo') || 
       t.category.toLowerCase().includes('produto') || 
       t.category.toLowerCase().includes('comiss'))
  ).reduce((a, b) => a + b.amount, 0);

  const purchaseExpenses = transactions.filter(t => 
    t.type === 'expense' && 
    (t.category.toLowerCase().includes('insumo') || t.category.toLowerCase().includes('produto'))
  ).reduce((a, b) => a + b.amount, 0);

  const fixedExpenses = transactions.filter(t => 
    t.type === 'expense' && 
    !(t.category.toLowerCase().includes('insumo') || 
      t.category.toLowerCase().includes('produto') || 
      t.category.toLowerCase().includes('imposto') ||
      t.category.toLowerCase().includes('taxa'))
  ).reduce((a, b) => a + b.amount, 0);

  const taxes = totalRev * 0.06; 
  const contributionMarginPct = totalRev > 0 ? ((totalRev - taxes - variableExpenses) / totalRev) * 100 : 0;
  const purchaseRatio = totalRev > 0 ? (purchaseExpenses / totalRev) * 100 : 0;

  const today = new Date();
  const day = today.getDate();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const projection = day > 0 ? (totalRev / day) * lastDay : 0;
  
  const targetGap = target?.planned_revenue ? (projection / target.planned_revenue) : 1;

  const businessAlerts: AIAnalysisResult['alerts'] = [];

  if (contributionMarginPct < 50 && totalRev > 0) {
      businessAlerts.push({
          type: "critical",
          title: "Margem de Contribuição Crítica",
          message: `Sua margem está em ${contributionMarginPct.toFixed(1)}%. Para cada R$ 100 vendidos, sobra pouco para pagar os custos fixos.`,
          action: "Revisar Precificação"
      });
  }

  if (purchaseRatio > 30) {
      businessAlerts.push({
          type: "warning",
          title: "Gasto com Insumos Elevado",
          message: `Suas compras representam ${purchaseRatio.toFixed(1)}% do faturamento. O ideal para clínicas lucrativas é abaixo de 25%.`,
          action: "Negociar Fornecedores"
      });
  }

  if (target?.planned_revenue && targetGap < 0.8) {
      businessAlerts.push({
          type: "critical",
          title: "Risco de Fechamento Negativo",
          message: `No ritmo atual, você atingirá apenas ${(targetGap * 100).toFixed(0)}% da meta de faturamento.`,
          action: "Aumentar Conversão"
      });
  }

  if (businessAlerts.length === 0 && totalRev > 0) {
      businessAlerts.push({
          type: "positive",
          title: "Indicadores Saudáveis",
          message: "Sua clínica está operando dentro dos benchmarks de lucratividade este mês.",
          action: "Manter Estratégia"
      });
  }

  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  
  const systemPrompt = `Você é um CFO Virtual especializado em clínicas de estética de alto padrão. 
  KPIs atuais: 
  - Margem de Contribuição: ${contributionMarginPct.toFixed(1)}%
  - Peso das Compras: ${purchaseRatio.toFixed(1)}%
  - Atingimento Meta: ${(targetGap * 100).toFixed(0)}%
  - Faturamento Atual: ${toBRL(totalRev)}
  - Custos Fixos: ${toBRL(fixedExpenses)}
  
  Com base nestes números reais, forneça 2 a 3 insights acionáveis e específicos para estética.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: "Gere os alertas em JSON conforme o schema definido.",
      config: { 
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            kpis: { 
                type: Type.OBJECT, 
                properties: { 
                    marketingROI: { type: Type.STRING }, 
                    costPerVisit: { type: Type.STRING }, 
                    cardDependency: { type: Type.STRING }, 
                    topProfessional: { type: Type.STRING } 
                } 
            },
            alerts: { 
                type: Type.ARRAY, 
                items: { 
                    type: Type.OBJECT, 
                    properties: { 
                        type: { type: Type.STRING }, 
                        title: { type: Type.STRING }, 
                        message: { type: Type.STRING }, 
                        action: { type: Type.STRING } 
                    } 
                } 
            },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      const aiData = JSON.parse(response.text) as AIAnalysisResult;
      return { 
          ...aiData, 
          alerts: [...businessAlerts, ...aiData.alerts].slice(0, 5) 
      };
    }
  } catch (error: any) {
    console.error("Erro AI Insights:", error);
  }

  return {
    kpis: {
      marketingROI: "N/A",
      costPerVisit: totalRev > 0 ? toBRL(variableExpenses / (transactions.filter(t => t.type === 'revenue').length || 1)) : "R$ 0",
      cardDependency: "2.5% est.",
      topProfessional: "Analisando..."
    },
    alerts: businessAlerts,
    summary: `Margem de Contribuição de ${contributionMarginPct.toFixed(1)}%.`
  };
};
