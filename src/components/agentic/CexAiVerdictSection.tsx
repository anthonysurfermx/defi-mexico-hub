// ============================================================
// CEX AI Verdict — Top 5 consensus (Claude + Gemini + Codex)
// Multi-LLM synthesis of the best CEXes for autonomous AI agents
// Sources: .ai/decisions/2026-05-18_cex-ai-final-verdict.md
// ============================================================

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Minus, Trophy } from 'lucide-react';

type Score = 'yes' | 'partial' | 'no';

interface CexRow {
  rank: number;
  name: string;
  tagline: string;
  perpsExec: Score;
  conditional: Score;
  websocket: Score;
  blastRadius: Score;
  mcpVerified: Score;
  latam: Score;
  paper: Score;
  xLayer: Score;
  rateLimits: Score;
  verdict: string;
  verdictColor: 'green' | 'amber' | 'cyan' | 'red' | 'purple';
}

const CEXES: CexRow[] = [
  {
    rank: 1,
    name: 'Bybit',
    tagline: '253 skills MCP · perps 24/7 · LATAM-ready',
    perpsExec: 'yes',
    conditional: 'yes',
    websocket: 'yes',
    blastRadius: 'partial',
    mcpVerified: 'yes',
    latam: 'yes',
    paper: 'yes',
    xLayer: 'no',
    rateLimits: 'yes',
    verdict: 'PRIMARY EXECUTOR',
    verdictColor: 'green',
  },
  {
    rank: 2,
    name: 'OKX OnchainOS',
    tagline: 'X Layer sinergia · 60+ chains · DEX + Smart Money',
    perpsExec: 'yes',
    conditional: 'yes',
    websocket: 'yes',
    blastRadius: 'yes',
    mcpVerified: 'yes',
    latam: 'yes',
    paper: 'yes',
    xLayer: 'yes',
    rateLimits: 'yes',
    verdict: 'X LAYER + INTEL',
    verdictColor: 'cyan',
  },
  {
    rank: 3,
    name: 'Kraken',
    tagline: 'Dead Man\'s Switch · paper trading · xStocks + forex',
    perpsExec: 'partial',
    conditional: 'yes',
    websocket: 'yes',
    blastRadius: 'yes',
    mcpVerified: 'yes',
    latam: 'partial',
    paper: 'yes',
    xLayer: 'no',
    rateLimits: 'partial',
    verdict: 'GUARDRAILS + SENTINEL',
    verdictColor: 'amber',
  },
  {
    rank: 4,
    name: 'Binance',
    tagline: 'Liquidez TOP · fees ~0.04% · LATAM nativo',
    perpsExec: 'yes',
    conditional: 'yes',
    websocket: 'yes',
    blastRadius: 'partial',
    mcpVerified: 'partial',
    latam: 'yes',
    paper: 'partial',
    xLayer: 'no',
    rateLimits: 'partial',
    verdict: 'LIQUIDEZ BACKUP',
    verdictColor: 'purple',
  },
  {
    rank: 5,
    name: 'Coinbase',
    tagline: 'AgentKit + x402 + Agentic Wallets (TEE)',
    perpsExec: 'partial',
    conditional: 'partial',
    websocket: 'yes',
    blastRadius: 'yes',
    mcpVerified: 'yes',
    latam: 'partial',
    paper: 'yes',
    xLayer: 'partial',
    rateLimits: 'partial',
    verdict: 'A2A PAYMENTS · NO PERPS',
    verdictColor: 'red',
  },
];

const CRITERIA = [
  { key: 'perpsExec', label: 'Perps execution', tooltip: 'Bobby is 90% perps — server-side matching, liquidez, leverage maduro' },
  { key: 'conditional', label: 'Stop/TP server-side', tooltip: 'Stop-loss y take-profit ejecutados por el exchange (no por lambda)' },
  { key: 'websocket', label: 'WebSocket privado', tooltip: 'Streaming de order updates + market data en tiempo real' },
  { key: 'blastRadius', label: 'Blast radius mitigado', tooltip: 'Subcuentas + IP whitelist + permisos mínimos + revocación rápida' },
  { key: 'mcpVerified', label: 'MCP oficial verificado', tooltip: 'Repo GitHub oficial o docs.exchange.com/agent verificado' },
  { key: 'latam', label: 'LATAM accessibility', tooltip: 'KYC manejable, retiros a CLABE/SPEI, docs en ES' },
  { key: 'paper', label: 'Paper trading / testnet', tooltip: 'Ambiente de simulación con prices reales, cero riesgo' },
  { key: 'xLayer', label: 'X Layer / on-chain fit', tooltip: 'Sinergia con la chain donde vive Bobby (Chain 196)' },
  { key: 'rateLimits', label: 'Rate limits >50 calls/min', tooltip: 'Headroom para ciclos sostenidos sin 429/418 bans' },
] as const;

const SCORE_ICON: Record<Score, React.ReactNode> = {
  yes: <Check className="w-3.5 h-3.5 text-green-400" strokeWidth={3} />,
  partial: <Minus className="w-3.5 h-3.5 text-amber-400" strokeWidth={3} />,
  no: <X className="w-3.5 h-3.5 text-red-400/60" strokeWidth={2.5} />,
};

const SCORE_BG: Record<Score, string> = {
  yes: 'bg-green-500/10',
  partial: 'bg-amber-500/10',
  no: 'bg-red-500/5',
};

const VERDICT_STYLE: Record<CexRow['verdictColor'], string> = {
  green: 'bg-green-500/15 text-green-300 border-green-500/30',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  red: 'bg-red-500/15 text-red-300 border-red-500/30',
  purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
};

export function CexAiVerdictSection() {
  return (
    <Card className="mb-8 border-green-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-green-400" />
              CEX AI Verdict — Top 5 Multi-LLM Consensus
              <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                CLAUDE + GEMINI + CODEX
              </Badge>
            </CardTitle>
            <CardDescription>
              Top 5 CEXes para agentes AI autónomos, evaluados por 3 modelos en paralelo sobre 9 criterios consensuados. Verdict para Bobby Agent Trader S2.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Methodology chip */}
        <div className="mb-4 flex flex-wrap gap-2 text-[10px] font-mono">
          <span className="px-2 py-1 rounded border border-green-500/20 bg-black/40 text-green-400/80">
            {'>'} 9 CRITERIOS · 3 LENTES (TÉCNICO + UX + PRODUCTO)
          </span>
          <span className="px-2 py-1 rounded border border-green-500/20 bg-black/40 text-green-400/80">
            {'>'} FUENTES: REPOS OFICIALES + DOCS + STATUS PAGES
          </span>
          <span className="px-2 py-1 rounded border border-green-500/20 bg-black/40 text-green-400/80">
            {'>'} CASO DE USO: AGENT AUTÓNOMO · PERPS + SPOT · $10k–$1M AUM
          </span>
        </div>

        {/* Consensus table */}
        <div className="overflow-x-auto border border-green-500/20 rounded-lg">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-green-500/20 bg-black/40">
                <th className="text-left py-2.5 px-3 text-green-400/80 font-mono font-normal sticky left-0 z-10 bg-black/90 min-w-[180px]">
                  CEX
                </th>
                {CRITERIA.map((c) => (
                  <th
                    key={c.key}
                    title={c.tooltip}
                    className="py-2.5 px-1.5 text-center text-green-400/60 font-mono font-normal min-w-[80px] cursor-help"
                  >
                    <span className="text-[9px] leading-tight block">{c.label}</span>
                  </th>
                ))}
                <th className="py-2.5 px-3 text-left text-green-400/80 font-mono font-normal min-w-[180px]">
                  VERDICT
                </th>
              </tr>
            </thead>
            <tbody>
              {CEXES.map((cex) => (
                <tr
                  key={cex.name}
                  className="border-b border-green-500/10 hover:bg-green-500/[0.02] transition-colors"
                >
                  <td className="py-3 px-3 sticky left-0 z-10 bg-background">
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center justify-center w-6 h-6 rounded font-mono font-bold text-xs ${
                        cex.rank === 1 ? 'bg-green-500/20 text-green-300' :
                        cex.rank === 2 ? 'bg-cyan-500/20 text-cyan-300' :
                        cex.rank === 3 ? 'bg-amber-500/20 text-amber-300' :
                        cex.rank === 4 ? 'bg-purple-500/20 text-purple-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        #{cex.rank}
                      </span>
                      <div>
                        <div className="font-semibold text-sm">{cex.name}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight max-w-[180px]">
                          {cex.tagline}
                        </div>
                      </div>
                    </div>
                  </td>
                  {CRITERIA.map((c) => {
                    const score = cex[c.key as keyof CexRow] as Score;
                    return (
                      <td key={c.key} className="py-3 px-1.5 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded ${SCORE_BG[score]}`}>
                          {SCORE_ICON[score]}
                        </span>
                      </td>
                    );
                  })}
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded border font-mono text-[10px] font-bold ${VERDICT_STYLE[cex.verdictColor]}`}>
                      {cex.verdict}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-green-500/10">
              <Check className="w-2.5 h-2.5 text-green-400" strokeWidth={3} />
            </span>
            <span>Cumple completamente</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-amber-500/10">
              <Minus className="w-2.5 h-2.5 text-amber-400" strokeWidth={3} />
            </span>
            <span>Parcial / con caveat</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-red-500/5">
              <X className="w-2.5 h-2.5 text-red-400/60" strokeWidth={2.5} />
            </span>
            <span>No aplica / inferior</span>
          </span>
        </div>

        {/* Architecture recommendation */}
        <div className="mt-4 border border-green-500/20 bg-black/40 rounded-lg p-4">
          <div className="text-[10px] font-mono text-green-400/60 mb-2">
            {'>'} ARQUITECTURA RECOMENDADA PARA BOBBY AGENT TRADER S2
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="border-l-2 border-green-500/40 pl-3">
              <div className="font-bold text-green-300 mb-1">Single-CEX primary + observers</div>
              <div className="text-muted-foreground leading-relaxed">
                <strong className="text-green-400">Bybit</strong> ejecuta perps · <strong className="text-cyan-400">OKX</strong> entrega intel y on-chain · <strong className="text-amber-400">Kraken paper</strong> corre como sentinel · <strong className="text-purple-400">Binance</strong> sólo si Bybit cae · <strong className="text-red-400">Coinbase x402</strong> para A2A payments
              </div>
            </div>
            <div className="border-l-2 border-amber-500/40 pl-3">
              <div className="font-bold text-amber-300 mb-1">Reglas operativas no-negociables</div>
              <div className="text-muted-foreground leading-relaxed">
                Conditional orders SIEMPRE server-side · API keys con trade pero NUNCA withdraw · IP whitelist obligatoria · Subcuenta dedicada para el agent · Dead Man's Switch equivalente
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <span>
            Acuerdos unánimes: Crypto.com #7 (read-only), Bitget Wallet #6 (wallet tooling), single-CEX &gt; multi-CEX para hackathon.
          </span>
          <span>
            Síntesis · 2026-05-18 · DeFi México x Bobby Agent Trader
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
