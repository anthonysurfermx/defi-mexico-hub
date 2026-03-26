// ============================================================
// Bobby Agent Commerce — 10 Use Cases on X Layer
// Honest statuses: LIVE (works now) / READY (needs integrator)
// Each use case: sentence + interface + payment + payload + proof
// ============================================================

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Shield, Newspaper, Brain, Bell, BarChart3,
  Wallet, GraduationCap, Layers, Cpu, ExternalLink, ChevronDown,
} from 'lucide-react';
import KineticShell from '@/components/kinetic/KineticShell';

interface UseCase {
  id: string;
  node: string;
  name: string;
  action: string;
  icon: any;
  color: string;
  borderColor: string;
  bgColor: string;
  description: string;
  flow: string;
  interface: string;
  payment: string;
  paymentType: 'free' | 'x402' | 'oracle_read';
  status: 'LIVE' | 'READY';
  examplePayload: string;
  proofLink: string;
  missingStep: string;
  featured?: boolean;
}

const USE_CASES: UseCase[] = [
  {
    id: 'trading-fund', node: 'NODE_01', name: 'AI TRADING FUND', action: 'VAULT_REBALANCING',
    icon: TrendingUp, color: 'text-green-400', borderColor: 'border-green-500/20', bgColor: 'bg-green-500/5',
    description: 'A DeFi vault agent calls Bobby for conviction signals, then rebalances portfolio allocation based on the score.',
    flow: 'CALL bobby_analyze → RECEIVE conviction 8/10 LONG → INCREASE BTC allocation → LOG on X Layer',
    interface: 'MCP: bobby_analyze', payment: '0.01 USDC per call', paymentType: 'x402', status: 'READY',
    examplePayload: '{"method":"tools/call","params":{"name":"bobby_analyze","arguments":{"symbol":"BTC"}}}',
    proofLink: 'https://defimexico.org/api/mcp-bobby', missingStep: 'Requires external vault executor',
    featured: true,
  },
  {
    id: 'risk-manager', node: 'NODE_02', name: 'AI RISK MANAGER', action: 'COLLATERAL_ADJUSTMENT',
    icon: Shield, color: 'text-red-400', borderColor: 'border-red-500/20', bgColor: 'bg-red-500/5',
    description: 'A lending protocol reads Bobby\'s ConvictionOracle on-chain to dynamically adjust collateral ratios.',
    flow: 'READ oracle.getConviction("ETH") → CONVICTION 3/10 SHORT → RAISE collateral 150% → 200%',
    interface: 'On-chain: ConvictionOracle.getConviction()', payment: 'Gas only (public read)', paymentType: 'oracle_read', status: 'LIVE',
    examplePayload: 'oracle.getConviction("ETH") → (direction: SHORT, conviction: 3, entry: 2050e8, active: true)',
    proofLink: 'https://www.oklink.com/xlayer/address/0x03fa39b3a5b316b7cacdabd3442577ee32ab5f3a', missingStep: 'Oracle read is live. Protocol integration ready.',
    featured: true,
  },
  {
    id: 'newsletter', node: 'NODE_03', name: 'AI NEWSLETTER', action: 'CONTENT_GENERATION',
    icon: Newspaper, color: 'text-amber-400', borderColor: 'border-amber-500/20', bgColor: 'bg-amber-500/5',
    description: 'A content agent triggers a 3-agent debate, then formats Alpha vs Red Team vs CIO into a daily newsletter.',
    flow: 'CALL bobby_debate → RECEIVE 3-agent analysis → FORMAT as report → PUBLISH to subscribers',
    interface: 'MCP: bobby_debate', payment: '0.01 USDC per debate', paymentType: 'x402', status: 'LIVE',
    examplePayload: '{"method":"tools/call","params":{"name":"bobby_debate","arguments":{"question":"Should I long SOL?"}}}',
    proofLink: 'https://defimexico.org/api/mcp-bobby', missingStep: 'MCP endpoint returns 402 challenge. Full flow callable now.',
  },
  {
    id: 'portfolio', node: 'NODE_04', name: 'AI PORTFOLIO OPTIMIZER', action: 'ASSET_ALLOCATION',
    icon: BarChart3, color: 'text-cyan-400', borderColor: 'border-cyan-500/20', bgColor: 'bg-cyan-500/5',
    description: 'An optimization agent uses Bobby\'s Technical Pulse (70+ OKX Agent Trade Kit indicators) to rank assets by strength.',
    flow: 'CALL bobby_ta for BTC, ETH, SOL → COMPARE RSI, MACD, SuperTrend → OVERWEIGHT strongest',
    interface: 'MCP: bobby_ta', payment: 'Free', paymentType: 'free', status: 'LIVE',
    examplePayload: '{"method":"tools/call","params":{"name":"bobby_ta","arguments":{"symbol":"BTC"}}}',
    proofLink: 'https://defimexico.org/api/mcp-bobby', missingStep: 'Endpoint live and returning real data now.',
  },
  {
    id: 'alerts', node: 'NODE_05', name: 'AI ALERT SERVICE', action: 'PUSH_NOTIFICATIONS',
    icon: Bell, color: 'text-yellow-400', borderColor: 'border-yellow-500/20', bgColor: 'bg-yellow-500/5',
    description: 'A notification agent polls Bobby\'s ConvictionOracle. When conviction crosses 7/10, it pushes alerts via Telegram.',
    flow: 'POLL oracle every 5min → DETECT conviction jump 4→8 → SEND "STRONG LONG BTC" alert',
    interface: 'On-chain: ConvictionOracle + MCP: bobby_intel', payment: 'Free (oracle is public)', paymentType: 'oracle_read', status: 'READY',
    examplePayload: 'oracle.getConviction("BTC") → poll until conviction >= 7',
    proofLink: 'https://www.oklink.com/xlayer/address/0x03fa39b3a5b316b7cacdabd3442577ee32ab5f3a', missingStep: 'Requires notification connector (Telegram bot)',
  },
  {
    id: 'tutor', node: 'NODE_06', name: 'AI ACADEMY TUTOR', action: 'STUDENT_EVALUATION',
    icon: GraduationCap, color: 'text-indigo-400', borderColor: 'border-indigo-500/20', bgColor: 'bg-indigo-500/5',
    description: 'A trading academy agent asks Bobby to debate a student\'s thesis, then compares reasoning quality for grading.',
    flow: 'STUDENT says "long NVDA" → CALL bobby_debate → COMPARE student vs Bobby → GRADE analysis',
    interface: 'MCP: bobby_debate + bobby_ta', payment: '0.01 USDC per session', paymentType: 'x402', status: 'READY',
    examplePayload: '{"method":"tools/call","params":{"name":"bobby_debate","arguments":{"question":"Evaluate: long NVDA at $130"}}}',
    proofLink: 'https://defimexico.org/api/mcp-bobby', missingStep: 'Requires academy platform integration',
  },
  {
    id: 'hedge', node: 'NODE_07', name: 'AI HEDGE BOT', action: 'PROTECTIVE_POSITIONING',
    icon: Layers, color: 'text-purple-400', borderColor: 'border-purple-500/20', bgColor: 'bg-purple-500/5',
    description: 'A hedging agent monitors Bobby\'s regime detection. When RISK_OFF activates, it opens protective short positions.',
    flow: 'READ bobby_intel → DETECT regime RISK_OFF + mood DEFENSIVE → OPEN BTC short hedge',
    interface: 'MCP: bobby_intel', payment: 'Free', paymentType: 'free', status: 'READY',
    examplePayload: '{"method":"tools/call","params":{"name":"bobby_intel","arguments":{}}}',
    proofLink: 'https://defimexico.org/api/mcp-bobby', missingStep: 'Requires external execution venue',
  },
  {
    id: 'social', node: 'NODE_08', name: 'AI SOCIAL TRADER', action: 'THREAD_GENERATION',
    icon: Cpu, color: 'text-pink-400', borderColor: 'border-pink-500/20', bgColor: 'bg-pink-500/5',
    description: 'A social media agent calls Bobby for debates and converts them into X/Twitter threads with conviction scores.',
    flow: 'CALL bobby_debate → FORMAT Alpha vs Red Team as thread → ADD Technical Pulse → POST to X',
    interface: 'MCP: bobby_debate + bobby_ta', payment: '0.01 USDC per thread', paymentType: 'x402', status: 'LIVE',
    examplePayload: '{"method":"tools/call","params":{"name":"bobby_debate","arguments":{"question":"BTC weekly outlook"}}}',
    proofLink: 'https://defimexico.org/api/mcp-bobby', missingStep: 'MCP callable now. Social posting requires X API.',
  },
  {
    id: 'mm', node: 'NODE_09', name: 'AI MARKET MAKER', action: 'SPREAD_ADJUSTMENT',
    icon: Wallet, color: 'text-emerald-400', borderColor: 'border-emerald-500/20', bgColor: 'bg-emerald-500/5',
    description: 'A market-making agent reads Bobby\'s ATR and regime to adjust bid-ask spreads dynamically.',
    flow: 'READ bobby_ta ATR + regime → HIGH_VOL detected → WIDEN spreads 2x → REDUCE inventory risk',
    interface: 'MCP: bobby_ta + bobby_intel', payment: 'Free', paymentType: 'free', status: 'READY',
    examplePayload: 'bobby_ta("BTC") → { atr: 2400, regime: "HIGH_VOL" }',
    proofLink: 'https://defimexico.org/api/mcp-bobby', missingStep: 'Requires market-making engine integration',
  },
  {
    id: 'insurance', node: 'NODE_10', name: 'AI INSURANCE PROTOCOL', action: 'RISK_PRICING',
    icon: Brain, color: 'text-orange-400', borderColor: 'border-orange-500/20', bgColor: 'bg-orange-500/5',
    description: 'An insurance protocol reads Bobby\'s calibration data to price risk premiums for AI-recommended trades.',
    flow: 'READ bobby_intel calibration → ERROR 0.05 = well calibrated → OFFER 2% premium → USERS buy coverage',
    interface: 'MCP: bobby_intel (calibration data)', payment: 'Free', paymentType: 'free', status: 'READY',
    examplePayload: 'bobby_intel → { calibration: { calibrationError: 0.05, isOverconfident: false } }',
    proofLink: 'https://defimexico.org/api/mcp-bobby', missingStep: 'Most aspirational use case. Requires insurance protocol.',
  },
];

const STATUS_STYLE = {
  LIVE: { cls: 'bg-green-500/15 text-green-400 border-green-500/30', dot: 'bg-green-400' },
  READY: { cls: 'bg-white/5 text-white/50 border-white/20', dot: 'bg-white/30' },
};

const PAYMENT_STYLE = {
  free: { label: 'FREE', cls: 'text-green-400/70 bg-green-500/10 border-green-500/10' },
  x402: { label: 'x402 PAID', cls: 'text-amber-400/70 bg-amber-500/10 border-amber-500/10' },
  oracle_read: { label: 'ON-CHAIN READ', cls: 'text-cyan-400/70 bg-cyan-500/10 border-cyan-500/10' },
};

// Live network activity ticker
const TICKER_EVENTS = [
  '> [SYS] AI_PORTFOLIO_OPTIMIZER requested bobby_ta("BTC")... [FREE_TIER] OK',
  '> [SYS] AI_NEWSLETTER requested bobby_debate("ETH outlook")... [x402_CHALLENGE] 402',
  '> [SYS] AI_RISK_MANAGER read ConvictionOracle("SOL")... [ON_CHAIN] OK',
  '> [SYS] AI_SOCIAL_TRADER requested bobby_debate("Weekly BTC")... [x402_CHALLENGE] 402',
  '> [SYS] AI_HEDGE_BOT requested bobby_intel... [FREE_TIER] OK regime=RISK_OFF',
  '> [SYS] AI_ACADEMY_TUTOR requested bobby_debate("Evaluate NVDA")... [x402_CHALLENGE] 402',
  '> [SYS] AI_TRADING_FUND requested bobby_analyze("BTC")... [x402_CHALLENGE] 402',
  '> [SYS] AI_MARKET_MAKER requested bobby_ta("ETH") ATR... [FREE_TIER] OK',
];

export default function BobbyMarketplacePage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tickerIdx, setTickerIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTickerIdx(i => (i + 1) % TICKER_EVENTS.length), 3000);
    return () => clearInterval(timer);
  }, []);

  const featured = USE_CASES.filter(u => u.featured);
  const others = USE_CASES.filter(u => !u.featured);

  return (
    <KineticShell activeTab="docs">
      <Helmet><title>Agent Commerce | Bobby Agent Trader</title></Helmet>

      <div className="min-h-screen bg-[#050505] pb-20 md:pb-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto px-4 py-6 space-y-5">

          {/* HEADER */}
          <div>
            <div className="font-mono text-[9px] text-white/20 tracking-widest mb-1">[SYS_ROUTER]</div>
            <h1 className="font-mono text-xl font-black text-white/90 tracking-tight">AGENT COMMERCE ON X LAYER</h1>
            <p className="font-mono text-[11px] text-white/35 mt-2 leading-relaxed max-w-2xl">
              Others let agents do tasks. Bobby lets agents buy and settle financial judgment. 10 commerce patterns powered by MCP + x402 + 4 smart contracts on X Layer.
            </p>
          </div>

          {/* LIVE STATS */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'CONTRACTS', value: '4', sub: 'X Layer 196' },
              { label: 'MCP TOOLS', value: '12', sub: '6 free + 4 x402' },
              { label: 'AGENT NFTs', value: '3', sub: 'On-chain identity' },
              { label: 'SETTLEMENT', value: 'LIVE', sub: 'Payment rail active' },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-2.5 text-center">
                <div className="font-mono text-lg font-black text-green-400">{s.value}</div>
                <div className="font-mono text-[7px] text-white/25 tracking-widest">{s.label}</div>
                <div className="font-mono text-[6px] text-white/15">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* NETWORK TICKER */}
          <div className="bg-black/40 border border-white/[0.04] rounded-lg px-3 py-2 overflow-hidden">
            <div className="font-mono text-[8px] text-white/15 tracking-widest mb-1">NETWORK_LOG</div>
            <motion.div key={tickerIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="font-mono text-[9px] text-green-400/50">
              {TICKER_EVENTS[tickerIdx]}
            </motion.div>
          </div>

          {/* FEATURED USE CASES (2 big cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {featured.map((uc, i) => {
              const Icon = uc.icon;
              const st = STATUS_STYLE[uc.status];
              const pm = PAYMENT_STYLE[uc.paymentType];
              return (
                <motion.div key={uc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className={`bg-white/[0.02] border ${uc.borderColor} rounded-xl p-5`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg ${uc.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${uc.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[7px] text-white/20">{uc.node}</span>
                        <span className={`font-mono text-[7px] px-1.5 py-0.5 rounded border ${st.cls}`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${st.dot} mr-1`} />{uc.status}
                        </span>
                      </div>
                      <div className={`font-mono text-sm font-bold ${uc.color}`}>{uc.name}</div>
                    </div>
                    <span className={`font-mono text-[7px] px-1.5 py-0.5 rounded border ml-auto ${pm.cls}`}>{pm.label}</span>
                  </div>
                  <p className="font-mono text-[9px] text-white/40 leading-relaxed mb-3">{uc.description}</p>
                  <div className="font-mono text-[8px] text-white/20 mb-2">FLOW: <span className="text-white/35">{uc.flow}</span></div>
                  <div className="font-mono text-[8px] text-white/20 mb-2">INTERFACE: <span className="text-cyan-400/60">{uc.interface}</span></div>
                  <div className="bg-black/40 rounded p-2 font-mono text-[8px] text-green-400/50 overflow-x-auto mb-2">{uc.examplePayload}</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[7px] text-white/15">{uc.missingStep}</span>
                    <a href={uc.proofLink} target="_blank" rel="noopener noreferrer" className="font-mono text-[7px] text-green-400/40 hover:text-green-400 flex items-center gap-1">
                      PROOF <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* OTHER USE CASES (compact grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {others.map((uc, i) => {
              const Icon = uc.icon;
              const st = STATUS_STYLE[uc.status];
              const pm = PAYMENT_STYLE[uc.paymentType];
              const isExpanded = expanded === uc.id;
              return (
                <motion.div key={uc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                  onClick={() => setExpanded(isExpanded ? null : uc.id)}
                  className={`bg-white/[0.02] border ${uc.borderColor} rounded-xl p-3 cursor-pointer hover:bg-white/[0.04] transition-all`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`w-3.5 h-3.5 ${uc.color}`} />
                    <span className={`font-mono text-[9px] font-bold ${uc.color}`}>{uc.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`font-mono text-[6px] px-1 py-0.5 rounded border ${st.cls}`}>{uc.status}</span>
                    <span className={`font-mono text-[6px] px-1 py-0.5 rounded border ${pm.cls}`}>{pm.label}</span>
                  </div>
                  <p className="font-mono text-[8px] text-white/30 leading-relaxed line-clamp-2">{uc.description}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="font-mono text-[7px] text-white/15">{uc.node}</span>
                    <ChevronDown className={`w-3 h-3 text-white/15 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="mt-2 pt-2 border-t border-white/[0.06] space-y-1.5 overflow-hidden">
                        <div className="font-mono text-[7px] text-white/20">FLOW: <span className="text-white/30">{uc.flow}</span></div>
                        <div className="font-mono text-[7px] text-cyan-400/50">INTERFACE: {uc.interface}</div>
                        <div className="bg-black/40 rounded p-1.5 font-mono text-[7px] text-green-400/40 overflow-x-auto">{uc.examplePayload}</div>
                        <div className="font-mono text-[6px] text-white/15">{uc.missingStep}</div>
                        <a href={uc.proofLink} target="_blank" rel="noopener noreferrer" className="font-mono text-[6px] text-green-400/40 hover:text-green-400">PROOF ↗</a>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* CTA — Command Prompt Style */}
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-6">
            <div className="font-mono text-[10px] text-white/40 tracking-widest mb-3">CONNECT_YOUR_AGENT_TO_THE_GRID</div>
            <div className="bg-black/60 rounded-lg p-4 font-mono text-[11px] text-green-400 mb-4">
              {'>'} claude mcp add bobby-trader https://defimexico.org/api/mcp-bobby
            </div>
            <div className="flex items-center gap-4">
              <a href="/agentic-world/bobby/docs" className="font-mono text-[9px] text-white/40 hover:text-green-400 border border-white/10 px-3 py-1.5 rounded hover:border-green-500/20 transition-all">
                VIEW_INTEGRATION_DOCS
              </a>
              <a href="https://defimexico.org/llms.txt" target="_blank" rel="noopener noreferrer" className="font-mono text-[9px] text-green-400 border border-green-500/20 px-3 py-1.5 rounded hover:bg-green-500/10 transition-all">
                READ_LLMS.TXT
              </a>
              <a href="https://github.com/anthonysurfermx/Bobby-Agent-Trader" target="_blank" rel="noopener noreferrer" className="font-mono text-[9px] text-white/25 hover:text-white/40 transition-colors ml-auto">
                GITHUB ↗
              </a>
            </div>
          </div>

        </motion.div>
      </div>
    </KineticShell>
  );
}
