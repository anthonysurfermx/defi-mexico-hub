// ============================================================
// PTS AI TRADER — White-label sales demo for Pro Trading Skills
// Full sales page for Javier Trujillo (CEO of PTS)
// Route: /demopts (standalone, no KineticShell/MainLayout)
// ============================================================

import { Helmet } from 'react-helmet-async';
import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import {
  Brain, BarChart3, Users, MessageSquare, Shield, DollarSign,
  ChevronRight, Zap, ArrowRight, Check, Terminal, TrendingUp,
  Activity, Globe, Cpu, Lock, Clock, Sparkles,
} from 'lucide-react';

// ============================================================
// BRAND TOKENS — PTS (from Stitch)
// ============================================================
const PTS = {
  gold: '#F8CF2C',
  goldLight: '#ffeebe',
  bg: '#11121e',
  surface: '#1e1f2b',
  surfaceAlt: '#282936',
  text: '#e2e1f2',
  textMuted: '#999079',
  outline: '#999079',
  btnText: '#3b2f00',
};

// ============================================================
// DATA
// ============================================================
const MARKETS = [
  { symbol: 'SPY', name: 'S&P 500', type: 'INDEX' },
  { symbol: 'QQQ', name: 'Nasdaq 100', type: 'INDEX' },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'STOCK' },
  { symbol: 'AAPL', name: 'Apple', type: 'STOCK' },
  { symbol: 'TSLA', name: 'Tesla', type: 'STOCK' },
  { symbol: 'META', name: 'Meta', type: 'STOCK' },
  { symbol: 'BTC', name: 'Bitcoin', type: 'CRYPTO' },
  { symbol: 'ETH', name: 'Ethereum', type: 'CRYPTO' },
  { symbol: 'EUR/USD', name: 'Euro/Dollar', type: 'FOREX' },
  { symbol: 'GBP/USD', name: 'Libra/Dollar', type: 'FOREX' },
  { symbol: 'GOLD', name: 'Oro', type: 'COMMODITY' },
  { symbol: 'OIL', name: 'Petroleo', type: 'COMMODITY' },
];

const TYPE_COLORS: Record<string, string> = {
  INDEX: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  STOCK: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  CRYPTO: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  FOREX: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  COMMODITY: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

const FEATURES = [
  {
    icon: Brain,
    title: '3 Agentes de IA Debaten',
    desc: 'Alpha Hunter busca oportunidades, Red Team destruye la tesis, el CIO decide. Tus alumnos ven el debate completo antes de cada senal.',
  },
  {
    icon: BarChart3,
    title: '70+ Indicadores Tecnicos',
    desc: 'RSI, MACD, Bollinger Bands, SuperTrend, ATR — powered by OKX Agent Trade Kit. Los mismos indicadores que ensenas en tu programa.',
  },
  {
    icon: MessageSquare,
    title: 'Telegram Integrado',
    desc: 'Bobby se conecta a tu canal @protradingskills. Los debates llegan como mensajes. Tus alumnos interactuan directamente con la IA.',
  },
  {
    icon: Shield,
    title: 'Track Record On-Chain',
    desc: 'Cada prediccion se graba en blockchain ANTES del resultado. No hay cherry-picking. Es el track record mas honesto del mercado.',
  },
  {
    icon: Users,
    title: 'Escalable a 1,500+ Alumnos',
    desc: 'Bobby opera 24/7 sin descanso. Genera contenido para tus sesiones de lunes, miercoles y viernes. Tus profesores se enfocan en ensenar.',
  },
  {
    icon: DollarSign,
    title: 'Nuevo Modelo de Ingresos',
    desc: 'Cobra acceso premium via wallet. Los alumnos pagan por senales avanzadas. PTS genera revenue pasivo sin trabajo adicional.',
  },
];

const STEPS = [
  { step: '01', title: 'CONFIGURAR', desc: 'Personalizamos Bobby con tu marca, tus mercados, tu Telegram' },
  { step: '02', title: 'CONECTAR', desc: 'Bobby se integra a @protradingskills y analiza tus mercados' },
  { step: '03', title: 'DEBATIR', desc: 'Cada hora, 3 agentes debaten. Los debates llegan a tu canal' },
  { step: '04', title: 'MONETIZAR', desc: 'Tus alumnos pagan por acceso premium. Revenue 24/7' },
];

const WHAT_PTS_GETS = [
  'Terminal web personalizado con marca PTS',
  'Bot de Telegram integrado',
  '70+ indicadores tecnicos en tiempo real',
  'Debates autonomos 24/7',
  'Acceso a busqueda universal de activos',
  'Dashboard de metacognicion',
  'On-chain track record verificable',
  'Soporte tecnico prioritario',
];

const PRICING = [
  {
    name: 'SETUP',
    price: '$1,200 USD',
    period: 'una vez',
    features: [
      'Bobby personalizado con marca PTS',
      'Config mercados (acciones, crypto, forex, options)',
      'Integracion Telegram',
      'Terminal web con tu branding',
      'Onboarding para Javier y equipo',
    ],
    highlighted: false,
  },
  {
    name: 'OPERACION',
    price: '$100 USD',
    period: '/mes',
    features: [
      'Bobby corriendo 24/7',
      'Debates diarios automaticos',
      'Soporte tecnico prioritario',
      'Actualizaciones de indicadores',
      'Hosting y mantenimiento',
    ],
    highlighted: true,
  },
];

const STATS = [
  { label: 'DEBATES', value: '220+', sub: 'Autonomos' },
  { label: 'ON-CHAIN', value: '56+', sub: 'Commits verificables' },
  { label: 'INDICADORES', value: '70+', sub: 'OKX Agent Trade Kit' },
  { label: 'CONTRATOS', value: '4', sub: 'En X Layer' },
];

const DEMO_CHIPS = ['SPY', 'QQQ', 'NVDA', 'BTC', 'ETH', 'GOLD'];

// ============================================================
// ANIMATED TERMINAL COMPONENT
// ============================================================
const TERMINAL_LINES = [
  { text: '> bobby.analyze("SPY")', color: PTS.gold, delay: 0 },
  { text: '[Alpha Hunter] SPY at $582.34 — bullish structure intact', color: '#6ee7b7', delay: 800 },
  { text: '[Alpha Hunter] RSI(14): 58.2 | MACD: bullish cross | BB: mid-band', color: '#6ee7b7', delay: 1600 },
  { text: '[Red Team] Warning: VIX rising +8% today. Resistance at $585', color: '#fca5a5', delay: 2800 },
  { text: '[Red Team] Volume declining on rally — distribution pattern?', color: '#fca5a5', delay: 3600 },
  { text: '[CIO] VERDICT: CAUTIOUS LONG — size 60% of max', color: PTS.gold, delay: 5000 },
  { text: '[CIO] Entry: $581.50 | Stop: $576.20 | Target: $592.00', color: PTS.gold, delay: 5800 },
  { text: '[System] Signal committed on-chain: 0x3f7a...c21d', color: '#a5b4fc', delay: 7000 },
  { text: '> _', color: PTS.gold, delay: 8000 },
];

function AnimatedTerminal() {
  const [visibleLines, setVisibleLines] = useState<number>(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    TERMINAL_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), line.delay));
    });
    // Loop the animation
    const loopTimer = setTimeout(() => {
      setVisibleLines(0);
      // Restart
      TERMINAL_LINES.forEach((line, i) => {
        timers.push(setTimeout(() => setVisibleLines(i + 1), line.delay + 500));
      });
    }, 10000);
    timers.push(loopTimer);
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className="rounded-xl border overflow-hidden font-mono text-xs"
      style={{
        background: 'rgba(30,31,43,0.8)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(153,144,121,0.3)',
      }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'rgba(153,144,121,0.15)' }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="text-[10px] ml-2" style={{ color: PTS.textMuted }}>PTS AI TRADER — Terminal</span>
      </div>
      {/* Content */}
      <div className="p-4 space-y-1.5 min-h-[220px]">
        {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="leading-relaxed"
            style={{ color: line.color }}
          >
            {line.text}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SECTION WRAPPER WITH INVIEW ANIMATION
// ============================================================
function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function PTSDemoPage() {
  return (
    <div className="min-h-screen" style={{ background: PTS.bg, color: PTS.text }}>
      <Helmet>
        <title>PTS AI TRADER — Demo Exclusiva para Pro Trading Skills</title>
        <meta name="description" content="Bobby Agent Trader personalizado para Pro Trading Skills. 3 agentes de IA debaten cada trade." />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Helmet>

      {/* ========== NAV BAR ========== */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{
          background: 'rgba(17,18,30,0.85)',
          backdropFilter: 'blur(16px)',
          borderColor: 'rgba(153,144,121,0.15)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${PTS.gold}, ${PTS.goldLight})` }}
            >
              <Cpu className="w-4 h-4" style={{ color: PTS.btnText }} />
            </div>
            <span
              className="text-sm font-bold tracking-wider"
              style={{ fontFamily: 'Manrope, sans-serif', color: PTS.gold }}
            >
              PTS AI TRADER
            </span>
          </div>
          <span className="text-[10px] hidden sm:block" style={{ color: 'rgba(226,225,242,0.3)', fontFamily: 'Space Grotesk, monospace' }}>
            Powered by Bobby Agent Trader
          </span>
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-16" />

      {/* ========== 1. HERO ========== */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 30% 20%, rgba(248,207,44,0.08) 0%, transparent 60%)` }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold tracking-wide mb-6"
                style={{
                  background: 'rgba(248,207,44,0.08)',
                  borderColor: 'rgba(248,207,44,0.25)',
                  color: PTS.gold,
                  fontFamily: 'Space Grotesk, monospace',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                EXCLUSIVO PARA PRO TRADING SKILLS
              </div>

              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.1] tracking-tight mb-5"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Tu propio CIO de Inteligencia Artificial{' '}
                <span style={{ color: PTS.gold }}>que nunca duerme.</span>
              </h1>

              <p
                className="text-sm sm:text-base leading-relaxed mb-8 max-w-lg"
                style={{ color: 'rgba(226,225,242,0.55)', fontFamily: 'Inter, sans-serif' }}
              >
                3 agentes de IA debaten cada trade antes de generar una senal.
                Acciones, crypto, forex, opciones — los mercados que ensenas a tus 1,500+ alumnos.
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                  href="/agentic-world/bobby"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${PTS.gold}, ${PTS.goldLight})`,
                    color: PTS.btnText,
                    fontFamily: 'Manrope, sans-serif',
                  }}
                >
                  VER DEMO EN VIVO <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="/agentic-world/bobby/marketplace"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold tracking-wide border transition-all hover:bg-white/[0.03]"
                  style={{
                    borderColor: 'rgba(153,144,121,0.4)',
                    color: PTS.text,
                    fontFamily: 'Manrope, sans-serif',
                  }}
                >
                  AGENT COMMERCE
                </a>
              </div>
            </motion.div>

            {/* Right — Animated Terminal */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block"
            >
              <AnimatedTerminal />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== 2. MARKETS CONFIGURED ========== */}
      <section className="border-t border-b" style={{ borderColor: 'rgba(153,144,121,0.1)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <AnimatedSection>
            <div
              className="text-[10px] tracking-[0.2em] mb-4 font-semibold"
              style={{ color: PTS.textMuted, fontFamily: 'Space Grotesk, monospace' }}
            >
              MERCADOS CONFIGURADOS PARA PTS
            </div>
            <div className="flex flex-wrap gap-2">
              {MARKETS.map(m => (
                <div
                  key={m.symbol}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                  style={{
                    background: 'rgba(30,31,43,0.6)',
                    borderColor: 'rgba(153,144,121,0.12)',
                  }}
                >
                  <span className="font-bold text-sm" style={{ color: PTS.gold, fontFamily: 'Manrope, sans-serif' }}>
                    {m.symbol}
                  </span>
                  <span className="text-xs" style={{ color: 'rgba(226,225,242,0.35)' }}>{m.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${TYPE_COLORS[m.type]}`}>
                    {m.type}
                  </span>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ========== 3. HOW IT WORKS ========== */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div
              className="text-[10px] tracking-[0.2em] mb-2 font-semibold"
              style={{ color: PTS.textMuted, fontFamily: 'Space Grotesk, monospace' }}
            >
              COMO FUNCIONA
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-10" style={{ fontFamily: 'Manrope, sans-serif' }}>
              De instalacion a senales en <span style={{ color: PTS.gold }}>48 horas</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s, i) => (
              <AnimatedSection key={s.step} delay={i * 0.1}>
                <div
                  className="relative p-5 rounded-xl border h-full group hover:border-[rgba(248,207,44,0.3)] transition-colors"
                  style={{
                    background: 'rgba(30,31,43,0.8)',
                    backdropFilter: 'blur(12px)',
                    borderColor: 'rgba(153,144,121,0.1)',
                  }}
                >
                  <div
                    className="text-3xl font-extrabold mb-3"
                    style={{ color: 'rgba(248,207,44,0.2)', fontFamily: 'Manrope, sans-serif' }}
                  >
                    {s.step}
                  </div>
                  <div
                    className="text-xs font-bold tracking-wider mb-2"
                    style={{ color: PTS.gold, fontFamily: 'Space Grotesk, monospace' }}
                  >
                    {s.title}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(226,225,242,0.4)', fontFamily: 'Inter, sans-serif' }}>
                    {s.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 4. FEATURES (2x3 grid) ========== */}
      <section className="py-16 md:py-20 border-t" style={{ borderColor: 'rgba(153,144,121,0.1)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div
              className="text-[10px] tracking-[0.2em] mb-2 font-semibold"
              style={{ color: PTS.textMuted, fontFamily: 'Space Grotesk, monospace' }}
            >
              CAPACIDADES
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-10" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Bobby trabaja para ti <span style={{ color: PTS.gold }}>24/7</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <AnimatedSection key={f.title} delay={i * 0.08}>
                <div
                  className="p-6 rounded-xl border h-full group hover:border-[rgba(248,207,44,0.25)] transition-all"
                  style={{
                    background: 'rgba(30,31,43,0.8)',
                    backdropFilter: 'blur(12px)',
                    borderColor: 'rgba(153,144,121,0.1)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: 'rgba(248,207,44,0.1)' }}
                  >
                    <f.icon className="w-5 h-5" style={{ color: PTS.gold }} />
                  </div>
                  <h3
                    className="text-sm font-bold tracking-wide mb-2"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(226,225,242,0.4)', fontFamily: 'Inter, sans-serif' }}>
                    {f.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 5. LIVE DEMO ========== */}
      <section className="py-16 md:py-20 border-t" style={{ borderColor: 'rgba(153,144,121,0.1)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center max-w-2xl mx-auto">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold tracking-wide mb-6"
                style={{
                  background: 'rgba(248,207,44,0.08)',
                  borderColor: 'rgba(248,207,44,0.25)',
                  color: PTS.gold,
                  fontFamily: 'Space Grotesk, monospace',
                }}
              >
                <Terminal className="w-3.5 h-3.5" />
                DEMO EN VIVO
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Prueba Bobby <span style={{ color: PTS.gold }}>ahora mismo</span>
              </h2>
              <p className="text-sm mb-8" style={{ color: 'rgba(226,225,242,0.45)', fontFamily: 'Inter, sans-serif' }}>
                Escribe cualquier activo y Bobby te dara un analisis completo con debate de 3 agentes
              </p>

              {/* Quick action chips */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {DEMO_CHIPS.map(chip => (
                  <a
                    key={chip}
                    href="/agentic-world/bobby"
                    className="px-4 py-2 rounded-lg border text-xs font-bold tracking-wide transition-all hover:scale-105"
                    style={{
                      background: 'rgba(30,31,43,0.8)',
                      borderColor: 'rgba(248,207,44,0.2)',
                      color: PTS.gold,
                      fontFamily: 'Space Grotesk, monospace',
                    }}
                  >
                    {chip}
                  </a>
                ))}
              </div>

              {/* CTA to terminal */}
              <a
                href="/agentic-world/bobby"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg text-sm font-bold tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${PTS.gold}, ${PTS.goldLight})`,
                  color: PTS.btnText,
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                ABRIR TERMINAL DE BOBBY <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ========== 6. WHAT PTS GETS ========== */}
      <section className="py-16 md:py-20 border-t" style={{ borderColor: 'rgba(153,144,121,0.1)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div
                  className="text-[10px] tracking-[0.2em] mb-2 font-semibold"
                  style={{ color: PTS.textMuted, fontFamily: 'Space Grotesk, monospace' }}
                >
                  QUE OBTIENE PTS
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Todo lo que incluye tu <span style={{ color: PTS.gold }}>Bobby personalizado</span>
                </h2>
                <p className="text-sm mb-8" style={{ color: 'rgba(226,225,242,0.4)', fontFamily: 'Inter, sans-serif' }}>
                  Bobby se convierte en el CIO de inteligencia artificial de Pro Trading Skills.
                  Tu marca, tus mercados, tu canal.
                </p>
              </div>
              <div className="space-y-3">
                {WHAT_PTS_GETS.map((item, i) => (
                  <AnimatedSection key={item} delay={i * 0.06}>
                    <div
                      className="flex items-center gap-3 p-3.5 rounded-lg border"
                      style={{
                        background: 'rgba(30,31,43,0.6)',
                        borderColor: 'rgba(153,144,121,0.1)',
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(248,207,44,0.15)' }}
                      >
                        <Check className="w-3.5 h-3.5" style={{ color: PTS.gold }} />
                      </div>
                      <span className="text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{item}</span>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ========== 7. PRICING ========== */}
      <section className="py-16 md:py-20 border-t" style={{ borderColor: 'rgba(153,144,121,0.1)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-10">
              <div
                className="text-[10px] tracking-[0.2em] mb-2 font-semibold"
                style={{ color: PTS.textMuted, fontFamily: 'Space Grotestring, monospace' }}
              >
                INVERSION
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Pricing exclusivo para <span style={{ color: PTS.gold }}>PTS</span>
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {PRICING.map((p, i) => (
              <AnimatedSection key={p.name} delay={i * 0.15}>
                <div
                  className="p-7 rounded-xl border h-full flex flex-col"
                  style={{
                    background: p.highlighted ? 'rgba(248,207,44,0.04)' : 'rgba(30,31,43,0.8)',
                    backdropFilter: 'blur(12px)',
                    borderColor: p.highlighted ? 'rgba(248,207,44,0.4)' : 'rgba(153,144,121,0.12)',
                  }}
                >
                  <div
                    className="text-[10px] tracking-[0.2em] mb-2 font-semibold"
                    style={{ color: PTS.textMuted, fontFamily: 'Space Grotesk, monospace' }}
                  >
                    {p.name}
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span
                      className="text-3xl font-extrabold"
                      style={{ color: PTS.gold, fontFamily: 'Manrope, sans-serif' }}
                    >
                      {p.price}
                    </span>
                    <span className="text-xs" style={{ color: 'rgba(226,225,242,0.3)' }}>{p.period}</span>
                  </div>

                  <div className="space-y-2.5 mt-5 mb-7 flex-1">
                    {p.features.map(f => (
                      <div key={f} className="flex items-start gap-2.5">
                        <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: PTS.gold }} />
                        <span className="text-xs leading-relaxed" style={{ color: 'rgba(226,225,242,0.5)', fontFamily: 'Inter, sans-serif' }}>
                          {f}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    className="w-full py-3 rounded-lg text-xs font-bold tracking-wider transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={
                      p.highlighted
                        ? {
                            background: `linear-gradient(135deg, ${PTS.gold}, ${PTS.goldLight})`,
                            color: PTS.btnText,
                            fontFamily: 'Manrope, sans-serif',
                          }
                        : {
                            background: 'transparent',
                            border: '1px solid rgba(153,144,121,0.25)',
                            color: 'rgba(226,225,242,0.5)',
                            fontFamily: 'Manrope, sans-serif',
                          }
                    }
                  >
                    {p.highlighted ? 'ACTIVAR' : 'IMPLEMENTAR'}
                  </button>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 8. INFRASTRUCTURE PROOF ========== */}
      <section className="py-16 md:py-20 border-t" style={{ borderColor: 'rgba(153,144,121,0.1)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-10">
              <div
                className="text-[10px] tracking-[0.2em] mb-2 font-semibold"
                style={{ color: PTS.textMuted, fontFamily: 'Space Grotesk, monospace' }}
              >
                INFRAESTRUCTURA VERIFICABLE
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Todo verificable en <span style={{ color: PTS.gold }}>blockchain</span>
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <AnimatedSection key={s.label} delay={i * 0.1}>
                <div
                  className="p-5 rounded-xl border text-center"
                  style={{
                    background: 'rgba(30,31,43,0.8)',
                    backdropFilter: 'blur(12px)',
                    borderColor: 'rgba(153,144,121,0.1)',
                  }}
                >
                  <div
                    className="text-2xl md:text-3xl font-extrabold"
                    style={{ color: PTS.gold, fontFamily: 'Manrope, sans-serif' }}
                  >
                    {s.value}
                  </div>
                  <div
                    className="text-[10px] tracking-[0.15em] mt-1.5 font-semibold"
                    style={{ color: 'rgba(226,225,242,0.4)', fontFamily: 'Space Grotesk, monospace' }}
                  >
                    {s.label}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'rgba(226,225,242,0.2)' }}>
                    {s.sub}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 9. FINAL CTA ========== */}
      <section className="py-20 md:py-28 border-t" style={{ borderColor: 'rgba(248,207,44,0.15)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4 leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Listo para darle IA a tus{' '}
                <span style={{ color: PTS.gold }}>1,500 alumnos</span>?
              </h2>
              <p className="text-sm mb-8" style={{ color: 'rgba(226,225,242,0.4)', fontFamily: 'Inter, sans-serif' }}>
                La implementacion toma 48 horas. Bobby empieza a debatir desde el dia uno.
              </p>

              <a
                href="/agentic-world/bobby"
                className="inline-flex items-center gap-2 px-10 py-4 rounded-lg text-base font-bold tracking-wide transition-all hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${PTS.gold}, ${PTS.goldLight})`,
                  color: PTS.btnText,
                  fontFamily: 'Manrope, sans-serif',
                  boxShadow: '0 0 40px rgba(248,207,44,0.15)',
                }}
              >
                AGENDAR LLAMADA <ArrowRight className="w-5 h-5" />
              </a>

              <p className="text-[10px] mt-6" style={{ color: 'rgba(226,225,242,0.2)', fontFamily: 'Space Grotesk, monospace' }}>
                Powered by Bobby Agent Trader — DeFi Mexico
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t py-6" style={{ borderColor: 'rgba(153,144,121,0.1)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[10px]" style={{ color: 'rgba(226,225,242,0.2)', fontFamily: 'Space Grotesk, monospace' }}>
            2026 Bobby Agent Trader. Todos los derechos reservados.
          </span>
          <a
            href="/agentic-world/bobby"
            className="text-[10px] transition-colors hover:underline"
            style={{ color: PTS.gold, fontFamily: 'Space Grotesk, monospace' }}
          >
            defimexico.org/agentic-world/bobby
          </a>
        </div>
      </footer>
    </div>
  );
}
