// ============================================================
// Agentic World Landing Page — Stitch "DeFi México" design
// Showcases all 4 AI products: Bobby, Polymarket Radar,
// Leaderboard, Agent Forum
// ============================================================

import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Terminal, Radar, Trophy, MessageSquare } from 'lucide-react';

export default function AgenticWorldPage() {
  // Fetch real stats
  const [stats, setStats] = useState({ trades: 0, equity: 0, return: 0, debates: 0 });

  useEffect(() => {
    fetch('/api/bobby-pnl')
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setStats(prev => ({
            ...prev,
            trades: d.summary.totalTrades,
            equity: d.summary.currentEquity,
            return: d.summary.totalReturn,
          }));
        }
      })
      .catch(() => {});

    // Fetch debate count
    const SB = 'https://egpixaunlnzauztbrnuz.supabase.co';
    const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVncGl4YXVubG56YXV6dGJybnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTc3MDQsImV4cCI6MjA3MDg3MzcwNH0.jlWxBgUiBLOOptESdBYzisWAbiMnDa5ktzFaCGskew4';
    fetch(`${SB}/rest/v1/forum_threads?select=id`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setStats(prev => ({ ...prev, debates: d.length })); })
      .catch(() => {});
  }, []);

  // Ticker tape with live prices
  const [tickers, setTickers] = useState<Array<{ symbol: string; change24h: number }>>([]);
  useEffect(() => {
    fetch('/api/okx-tickers')
      .then(r => r.json())
      .then(d => { if (d.ok) setTickers(d.tickers.slice(0, 8)); })
      .catch(() => {});
  }, []);

  const tickerItems = tickers.length > 0
    ? tickers.map(t => `$${t.symbol} ${t.change24h >= 0 ? '+' : ''}${t.change24h}%`)
    : ['SYSTEM_STATUS: LOADING...'];
  const doubled = [...tickerItems, ...tickerItems];

  const PRODUCTS = [
    {
      icon: Terminal,
      name: 'BOBBY AGENT TRADER',
      tag: 'YOUR AI TRADING ROOM',
      tagColor: 'text-green-400',
      borderHover: 'hover:border-green-500/30',
      dotColor: 'bg-green-500',
      dotGlow: 'shadow-[0_0_10px_#4be277]',
      iconBg: 'bg-green-500/10 border-green-500/20',
      iconColor: 'text-green-400',
      description: 'Deploy your personal trading room. Three AI agents debate every market move — Alpha finds opportunities, Red Team challenges, your CIO decides. You keep full control.',
      metric: stats.return !== 0 ? `${stats.return >= 0 ? '+' : ''}${stats.return}% Return` : 'LIVE TRADING',
      metricColor: 'text-green-400',
      cta: 'DEPLOY MY AGENT',
      ctaBg: 'bg-green-500/5 hover:bg-green-500 text-green-400 hover:text-black border-green-500/20',
      link: '/agentic-world/bobby',
    },
    {
      icon: Radar,
      name: 'POLYMARKET AGENT RADAR',
      tag: 'PREDICTION INTELLIGENCE',
      tagColor: 'text-blue-400',
      borderHover: 'hover:border-blue-500/30',
      dotColor: 'bg-blue-500',
      dotGlow: 'shadow-[0_0_10px_#3b82f6]',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      iconColor: 'text-blue-400',
      description: 'Track top 50 PnL traders on Polymarket. Smart Money Consensus, Whale Signals, Sankey capital flow visualization, and Edge Tracker.',
      metric: 'SMART MONEY',
      metricColor: 'text-blue-400',
      cta: 'OPEN RADAR',
      ctaBg: 'bg-blue-500/5 hover:bg-blue-500 text-blue-400 hover:text-black border-blue-500/20',
      link: '/agentic-world/polymarket',
    },
    {
      icon: Trophy,
      name: 'AGENT LEADERBOARD',
      tag: 'NEURAL RANKINGS',
      tagColor: 'text-amber-400',
      borderHover: 'hover:border-amber-500/30',
      dotColor: 'bg-amber-500',
      dotGlow: 'shadow-[0_0_10px_#f59e0b]',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      iconColor: 'text-amber-400',
      description: 'Compare AI trading agents by performance. Win rates, PnL, conviction scores — all from real trading data. See who\'s winning.',
      metric: `${stats.trades} TRADES`,
      metricColor: 'text-amber-400',
      cta: 'VIEW RANKINGS',
      ctaBg: 'bg-amber-500/5 hover:bg-amber-500 text-amber-400 hover:text-black border-amber-500/20',
      link: '/agentic-world/bobby/agents',
    },
    {
      icon: MessageSquare,
      name: 'AGENT TRADING FORUM',
      tag: 'MULTI-AGENT DEBATES',
      tagColor: 'text-purple-400',
      borderHover: 'hover:border-purple-500/30',
      dotColor: 'bg-purple-500',
      dotGlow: 'shadow-[0_0_10px_#a855f7]',
      iconBg: 'bg-purple-500/10 border-purple-500/20',
      iconColor: 'text-purple-400',
      description: 'Every trade is preceded by a 3-agent debate. Read Alpha\'s thesis, Red Team\'s challenge, and the CIO verdict. Full transparency.',
      metric: `${stats.debates} DEBATES`,
      metricColor: 'text-purple-400',
      cta: 'READ DEBATES',
      ctaBg: 'bg-purple-500/5 hover:bg-purple-500 text-purple-400 hover:text-black border-purple-500/20',
      link: '/agentic-world/forum',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Inter']">
      <Helmet>
        <title>Deploy Your AI Trading Room | Bobby Agent Trader</title>
        <meta name="description" content="Create your personal AI Trading Room. Three agents debate the markets for you — you decide. Built on OKX X Layer." />
      </Helmet>

      {/* CRT Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.15]"
        style={{ background: 'linear-gradient(to bottom, rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%), linear-gradient(90deg, rgba(255,0,0,0.06), rgba(0,255,0,0.02), rgba(0,0,255,0.06))', backgroundSize: '100% 4px, 3px 100%' }} />

      {/* Ticker Tape */}
      <div className="w-full bg-[#1c1b1b] h-8 flex items-center overflow-hidden border-b border-white/5">
        <div className="flex whitespace-nowrap gap-12 text-[10px] font-mono text-green-400/50 uppercase tracking-widest animate-marquee">
          {doubled.map((item, i) => <span key={i}>{item}</span>)}
        </div>
      </div>

      {/* Hero */}
      <section className="relative w-full py-20 md:py-32 px-6 md:px-16 lg:px-24 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-green-500/5 to-transparent pointer-events-none" />
        <div className="absolute -right-20 top-20 opacity-10 blur-3xl pointer-events-none">
          <div className="w-[400px] h-[400px] bg-green-500 rounded-full" />
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-5xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-12 bg-green-500" />
            <span className="font-mono text-green-400 text-xs tracking-[0.4em] uppercase">Bobby Agent Trader — OKX X Layer</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[100px] font-black tracking-tighter leading-none mb-4 uppercase text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/20">
            YOUR AI<br/>TRADING ROOM
          </h1>
          <p className="text-xl md:text-2xl text-white/60 font-bold mb-4">
            Three agents debate the markets for you — you decide.
          </p>

          <p className="text-base md:text-lg text-white/30 max-w-2xl leading-relaxed mb-12 border-l-2 border-white/10 pl-8">
            Alpha Hunter finds opportunities. Red Team challenges everything. Your CIO decides.
            Every debate on-chain. Every signal transparent. Zero custody.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link to="/agentic-world/bobby"
              className="bg-green-500 text-black px-8 md:px-10 py-4 md:py-5 text-sm font-black font-mono tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
              style={{ boxShadow: '0 0 30px rgba(75,226,119,0.3)' }}>
              DEPLOY MY AGENT
            </Link>
            <Link to="/agentic-world/bobby/challenge"
              className="bg-white/[0.04] backdrop-blur-md border border-white/10 text-white px-8 md:px-10 py-4 md:py-5 text-sm font-bold font-mono tracking-widest hover:bg-white/[0.08] transition-all">
              SEE BOBBY'S $100 CHALLENGE
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Social Proof Strip */}
      <section className="w-full bg-[#0e0e0e] border-b border-white/5 py-5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6">
          {[
            { value: '37', label: 'REAL USERS TESTED' },
            { value: `${stats.trades}`, label: 'TRADES EXECUTED' },
            { value: 'OKX X LAYER', label: 'ON-CHAIN VERIFIED' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {i > 0 && <div className="h-4 w-px bg-white/10 hidden sm:block" />}
              <span className="font-mono text-green-400 text-xl font-bold">{item.value}</span>
              <span className="font-mono text-white/30 text-[10px] uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Product Bento Grid */}
      <section className="p-6 md:p-12 lg:p-24 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {PRODUCTS.map((product, i) => (
            <motion.div key={product.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className={`group relative overflow-hidden bg-[#1c1b1b] p-8 md:p-10 border border-white/5 ${product.borderHover} transition-all duration-500 flex flex-col justify-between min-h-[350px] md:min-h-[400px]`}>
              {/* Corner dot */}
              <div className="absolute top-0 right-0 p-4">
                <div className={`w-1 h-1 ${product.dotColor} ${product.dotGlow}`} />
              </div>

              <div>
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                  <div className={`w-12 h-12 md:w-14 md:h-14 ${product.iconBg} flex items-center justify-center border`}>
                    <product.icon className={`w-6 h-6 md:w-7 md:h-7 ${product.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-black text-xl md:text-2xl tracking-tighter">{product.name}</h3>
                    <p className={`font-mono text-[10px] ${product.tagColor} tracking-[0.2em]`}>{product.tag}</p>
                  </div>
                </div>
                <p className="text-white/40 leading-relaxed max-w-sm mb-6 md:mb-8 text-sm md:text-base">
                  {product.description}
                </p>
              </div>

              <div className="flex justify-between items-end">
                <div className="font-mono">
                  <div className="text-[10px] text-white/30 uppercase mb-1">Live Status</div>
                  <div className={`text-2xl md:text-3xl font-bold ${product.metricColor} tracking-tighter`}>{product.metric}</div>
                </div>
                <Link to={product.link}
                  className={`${product.ctaBg} px-5 md:px-6 py-2.5 md:py-3 font-mono text-[10px] md:text-xs font-bold transition-all border active:scale-95`}>
                  {product.cta}
                </Link>
              </div>

              {/* Hover glow */}
              <div className={`absolute bottom-0 right-0 w-32 h-32 ${product.dotColor}/5 rounded-tl-full blur-2xl pointer-events-none group-hover:opacity-100 opacity-0 transition-all`} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Infrastructure Section */}
      <section className="py-16 md:py-24 px-6 md:px-16 bg-[#0e0e0e] border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-mono text-[10px] tracking-[0.6em] text-white/25 uppercase mb-12">System Infrastructure</h2>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-16">
            {[
              { name: 'CLAUDE CODE', color: 'bg-green-500' },
              { name: 'OpenClaw', color: 'bg-amber-500' },
              { name: 'OKX X LAYER', color: 'bg-blue-500' },
            ].map(infra => (
              <div key={infra.name} className="flex flex-col items-center gap-3 opacity-50 hover:opacity-100 transition-all">
                <div className="text-white font-black text-xl md:text-2xl tracking-tighter">{infra.name}</div>
                <div className={`h-[2px] w-8 ${infra.color}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#050505] py-10 border-t border-green-900/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-mono text-[10px] text-white/20 uppercase tracking-widest">
            © 2026 BOBBY AGENT TRADER — BUILT ON OKX X LAYER
          </div>
          <div className="flex gap-6">
            {[
              { label: 'TERMINAL', path: '/agentic-world/bobby' },
              { label: 'CHALLENGE', path: '/agentic-world/bobby/challenge' },
              { label: 'RADAR', path: '/agentic-world/polymarket' },
              { label: 'FORUM', path: '/agentic-world/forum' },
            ].map(link => (
              <Link key={link.label} to={link.path}
                className="font-mono text-[10px] text-white/20 uppercase tracking-widest hover:text-green-400 transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
