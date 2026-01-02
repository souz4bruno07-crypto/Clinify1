import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { 
  Check, ArrowRight, Menu, X, 
  TrendingUp, Users, Calendar, DollarSign,
  Shield, Sparkles, BarChart3, Clock,
  MessageSquare, Package, Stethoscope,
  Activity, Gift, FileText, Settings,
  Zap, Award, ChevronDown
} from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';

const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // SEO: Título e meta description
  useEffect(() => {
    document.title = 'Clinify - Sistema de Gestão para Clínicas de Estética | Gestão Financeira e CRM';
    
    // Atualizar meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Sistema completo de gestão para clínicas de estética. Controle financeiro, CRM de pacientes, agendamentos, prontuário eletrônico e estoque. Teste grátis por 14 dias.');
    
    // Garantir que a página seja indexada
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', 'index, follow');
    
    // Cleanup: restaurar valores padrão ao sair
    return () => {
      document.title = 'Clinify - Gestão Estética Inteligente';
    };
  }, []);

  const features = [
    {
      icon: DollarSign,
      title: 'Gestão Financeira Completa',
      description: 'Controle total de receitas, despesas, DRE e relatórios financeiros em tempo real.'
    },
    {
      icon: Users,
      title: 'CRM de Pacientes',
      description: 'Gerencie seu relacionamento com pacientes, histórico e comunicação integrada.'
    },
    {
      icon: Calendar,
      title: 'Agendamento Inteligente',
      description: 'Sistema completo de agendamento com lembretes e gestão de horários.'
    },
    {
      icon: BarChart3,
      title: 'Relatórios e Analytics',
      description: 'Dashboards interativos com insights e análises para tomada de decisão.'
    },
    {
      icon: Package,
      title: 'Controle de Estoque',
      description: 'Gestão completa de produtos e insumos com alertas e movimentações.'
    },
    {
      icon: Sparkles,
      title: 'IA Integrada',
      description: 'Análises inteligentes e recomendações automáticas para seu negócio.'
    },
    {
      icon: Stethoscope,
      title: 'Prontuário Eletrônico',
      description: 'Sistema completo de PEP com anamnese, prescrições e histórico clínico.'
    },
    {
      icon: Gift,
      title: 'Programa de Fidelidade',
      description: 'Gerencie programas de pontos e benefícios para seus pacientes.'
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: 'Economia de Tempo',
      description: 'Automatize processos e ganhe até 10 horas por semana para focar no que importa.'
    },
    {
      icon: TrendingUp,
      title: 'Controle Financeiro Total',
      description: 'Tenha visão completa do seu negócio com relatórios em tempo real e DRE automatizado.'
    },
    {
      icon: Shield,
      title: 'Dados Seguros',
      description: 'Informações protegidas com criptografia de ponta e backups automáticos.'
    },
    {
      icon: Zap,
      title: 'Processos Automatizados',
      description: 'Reduza erros manuais e aumente a eficiência com automações inteligentes.'
    }
  ];


  const pricingPlans = [
    {
      name: 'Starter',
      price: 'R$ 297',
      period: '/mês',
      description: 'Ideal para clínicas pequenas',
      features: [
        'Até 500 pacientes',
        'Gestão financeira completa',
        'Agendamento básico',
        'Relatórios essenciais',
        'Suporte por email',
        '1 usuário'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: 'R$ 497',
      period: '/mês',
      description: 'Para clínicas em crescimento',
      features: [
        'Até 2.000 pacientes',
        'Todos os recursos Starter',
        'CRM completo',
        'Prontuário eletrônico',
        'Controle de estoque',
        'IA integrada',
        'Suporte prioritário',
        'Até 5 usuários'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Sob consulta',
      period: '',
      description: 'Para grandes operações',
      features: [
        'Pacientes ilimitados',
        'Todos os recursos Professional',
        'Programa de fidelidade',
        'API personalizada',
        'Suporte 24/7 dedicado',
        'Treinamento personalizado',
        'Usuários ilimitados',
        'Customizações'
      ],
      popular: false
    }
  ];

  const faqs = [
    {
      question: 'Posso testar antes de contratar?',
      answer: 'Sim! Oferecemos 14 dias de teste gratuito com acesso completo a todos os recursos. Não é necessário cartão de crédito para começar.'
    },
    {
      question: 'Meus dados estão seguros?',
      answer: 'Absolutamente. Utilizamos criptografia de ponta a ponta, backups automáticos diários e estamos em conformidade com a LGPD. Seus dados são 100% seus.'
    },
    {
      question: 'Preciso de conhecimento técnico para usar?',
      answer: 'Não! O Clinify foi desenvolvido para ser intuitivo e fácil de usar. Oferecemos treinamento completo e nossa equipe de suporte está sempre disponível para ajudar.'
    },
    {
      question: 'Posso migrar dados de outro sistema?',
      answer: 'Sim, oferecemos suporte para migração de dados de outros sistemas. Nossa equipe técnica pode ajudar no processo de importação.'
    },
    {
      question: 'O sistema funciona offline?',
      answer: 'O Clinify funciona como PWA (Progressive Web App), permitindo uso básico offline. A sincronização acontece automaticamente quando a conexão é restabelecida.'
    },
    {
      question: 'Como funciona o cancelamento?',
      answer: 'Você pode cancelar a qualquer momento sem taxas ou multas. Seus dados ficam disponíveis por 30 dias após o cancelamento para exportação.'
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Clinify
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#screenshots" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors uppercase tracking-widest">
                Demonstração
              </a>
              <a href="#features" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors uppercase tracking-widest">
                Recursos
              </a>
              <a href="#pricing" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors uppercase tracking-widest">
                Preços
              </a>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">
                  Começar Grátis
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-400"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="px-4 py-6 space-y-4">
              <a href="#screenshots" className="block text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest" onClick={() => setMobileMenuOpen(false)}>
                Demonstração
              </a>
              <a href="#features" className="block text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest" onClick={() => setMobileMenuOpen(false)}>
                Recursos
              </a>
              <a href="#pricing" className="block text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest" onClick={() => setMobileMenuOpen(false)}>
                Preços
              </a>
              <Link to="/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" fullWidth>
                  Entrar
                </Button>
              </Link>
              <Link to="/signup" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" fullWidth>
                  Começar Grátis
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="absolute inset-0 -z-10 mesh-gradient opacity-50" />
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-full mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Sistema Completo de Gestão para Clínicas
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tight animate-slide-up">
              Gerencie sua clínica com{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                inteligência
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up">
              Gestão financeira, pacientes, agendamentos e muito mais em uma única plataforma.
              Economize tempo e aumente sua receita.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up">
              <Link to="/signup">
                <Button size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Começar Gratuitamente
                </Button>
              </Link>
              <a href="#screenshots">
                <Button variant="outline" size="xl">
                  Ver Demonstração
                </Button>
              </a>
            </div>
            <div className="flex items-center justify-center gap-8 text-sm text-slate-500 dark:text-slate-500 animate-fade-in">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>14 dias grátis</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>Cancele quando quiser</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Section - Demonstração do Dashboard */}
      <section id="screenshots" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-full mb-6">
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Demonstração Interativa
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Veja o Dashboard em Ação
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
              Interface moderna e intuitiva desenvolvida especialmente para clínicas. 
              Controle financeiro completo em tempo real.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>Gestão financeira completa</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>Relatórios em tempo real</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>Insights com IA</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-3xl blur-3xl -z-10" />
            <Card variant="elevated" padding="none" rounded="3xl" className="overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-slate-800">
              <div className="relative">
                <img
                  src="/screenshots/desktop-dashboard.png"
                  alt="Screenshot do dashboard do Clinify mostrando interface de gestão financeira para clínicas de estética"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent pointer-events-none" />
              </div>
            </Card>
            <div className="mt-8 text-center">
              <Link to="/signup">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Experimente Agora Grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Recursos Completos para sua Clínica
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar seu negócio em um único lugar
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  variant="default"
                  hover
                  className="text-center"
                >
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Por que Escolher o Clinify?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Benefícios reais para transformar sua clínica
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} variant="default" hover className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Planos que Cabe no Seu Bolso
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Escolha o plano ideal para sua clínica. Todos incluem teste grátis de 14 dias.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                variant={plan.popular ? 'gradient' : 'default'}
                hover
                className={plan.popular ? 'relative border-4 border-emerald-500' : ''}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-emerald-600 text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-widest">
                      Mais Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-black mb-2 ${plan.popular ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className={`text-5xl font-black ${plan.popular ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={`text-lg ${plan.popular ? 'text-white/80' : 'text-slate-600 dark:text-slate-400'}`}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${plan.popular ? 'text-white/80' : 'text-slate-600 dark:text-slate-400'}`}>
                    {plan.description}
                  </p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 shrink-0 mt-0.5 ${plan.popular ? 'text-white' : 'text-emerald-600'}`} />
                      <span className={`text-sm ${plan.popular ? 'text-white/90' : 'text-slate-700 dark:text-slate-300'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button
                    variant={plan.popular ? 'secondary' : 'primary'}
                    fullWidth
                    size="lg"
                  >
                    Começar Agora
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Tire suas dúvidas sobre o Clinify
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                variant="default"
                className="overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between gap-4 text-left"
                >
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex-1">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-600 dark:text-slate-400 shrink-0 transition-transform ${
                      openFaqIndex === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaqIndex === index && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-600 to-emerald-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Pronto para Transformar sua Clínica?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Comece hoje mesmo com 14 dias grátis. Sem cartão de crédito necessário.
          </p>
          <Link to="/signup">
            <Button variant="secondary" size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Começar Gratuitamente
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tight">
                  Clinify
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Sistema completo de gestão para clínicas. Gerencie financeiro, pacientes e operações em uma única plataforma.
              </p>
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-widest mb-4">
                Produto
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Recursos
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Preços
                  </a>
                </li>
                <li>
                  <a href="#screenshots" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Demonstração
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-widest mb-4">
                Empresa
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Sobre
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Contato
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-widest mb-4">
                Suporte
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Central de Ajuda
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Documentação
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Privacidade
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              © 2024 Clinify. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                Termos
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                Privacidade
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

