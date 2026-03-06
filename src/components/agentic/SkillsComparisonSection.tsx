import { useState, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Zap, Shield, Wallet, BarChart3, Globe, Users, Fingerprint, ArrowLeftRight, Github } from 'lucide-react';

interface Skill {
  name: string;
  description: string;
}

interface Platform {
  name: string;
  type: 'CEX' | 'DEX' | 'Wallet' | 'DEX Aggregator' | 'Bridge/DEX Aggregator' | 'L1 Ecosystem';
  launch: string;
  chains: string;
  chainCount: number;
  mcp: boolean;
  skills: Skill[];
  integration: string[];
  github: { label: string; url: string }[];
}

const PLATFORMS: Platform[] = [
  {
    name: 'BANKR',
    type: 'DEX',
    launch: 'Active',
    chains: 'EVM + Solana',
    chainCount: 5,
    mcp: true,
    integration: ['OpenClaw', 'Claude', 'X/Farcaster', 'ERC-8004'],
    github: [{ label: 'BankrBot/skills', url: 'https://github.com/BankrBot/skills' }],
    skills: [
      { name: 'bankr', description: 'Launch tokens, earn from every trade, fund agents. Built-in wallet with hallucination guards + TX verification' },
      { name: 'siwa', description: 'Sign-In With Agent (SIWA) auth for ERC-8004 agents. Message signing via Bankr wallets + ERC-8128 route protection' },
      { name: 'bankr-signals', description: 'Transaction-verified trading signals on Base. Register as provider, publish trades with TX hash proof' },
      { name: 'botchan', description: 'On-chain agent messaging on Base. Explore agents, post to feeds, send DMs, store data via Net Protocol' },
      { name: 'endaoment', description: 'Charitable donations on-chain. Look up 501(c)(3) orgs by EIN, donate crypto, deploy DAF entities' },
      { name: 'ens-primary-name', description: 'ENS name management. Set primary names, update avatars, manage reverse resolution L1/L2' },
      { name: 'erc-8004', description: 'On-chain agent identity registry. ERC-721 NFTs representing agent identities with trust scores' },
      { name: 'onchainkit', description: 'React components for on-chain UX: wallet connectors, swap widgets, identity, NFT displays on Base' },
      { name: 'qrcoin', description: 'QR code auction game. Scan codes to place bids in on-chain auctions with token mechanics' },
      { name: 'veil', description: 'Privacy-preserving transactions. Shielded pools, ZK withdrawals, private transfers' },
      { name: 'yoink', description: 'Social on-chain game. Yoink a token from the current holder, executed via Bankr' },
      { name: 'neynar', description: 'Full Farcaster API: post casts, like, recast, follow, search content, manage Farcaster identities' },
    ],
  },
  {
    name: 'Binance',
    type: 'CEX',
    launch: 'Mar 2026',
    chains: 'BNB Chain',
    chainCount: 1,
    mcp: true,
    integration: ['MCP', 'Cursor', 'Claude Desktop', 'OpenClaw'],
    github: [{ label: 'binance/binance-skills-hub', url: 'https://github.com/binance/binance-skills-hub' }],
    skills: [
      { name: 'Binance Spot Skill', description: 'Real-time market data (order book, price, depth, candlesticks) + trade execution (OCO/OPO/OTOCO)' },
      { name: 'Query Address Info', description: 'Wallet holdings breakdown, valuation, 24h changes, concentration insights, whale tracking' },
      { name: 'Query Token Info', description: 'Token metadata: symbol, chain, price, liquidity, holders, trading activities' },
      { name: 'Crypto Market Rank', description: 'Aggregated rankings: trends, hot searches, smart money inflows, meme narratives, trader PnL' },
      { name: 'Meme Rush', description: 'Meme token tracking across lifecycle stages (newly launched, migrating, migrated) + narrative mapping' },
      { name: 'Trading Signal', description: 'Smart money buy/sell signals with trigger price, current price, maxGain, exitRate, signal status' },
      { name: 'Query Token Audit', description: 'Contract risk detection: mintability, freeze functions, ownership privileges, trading restrictions' },
    ],
  },
  {
    name: 'OKX OnchainOS',
    type: 'CEX',
    launch: 'Mar 3, 2026',
    chains: '60+ chains',
    chainCount: 60,
    mcp: true,
    integration: ['MCP', 'AI Skills', 'REST API', 'Claude Code', 'Cursor'],
    github: [{ label: 'okx/onchainos-skills', url: 'https://github.com/okx/onchainos-skills' }],
    skills: [
      { name: 'Wallet', description: 'Query balances, broadcast transactions, retrieve history across 20+ chains' },
      { name: 'Trade', description: 'Smart routing across 500+ DEXs for optimal swap execution and pricing' },
      { name: 'Market', description: 'Real-time on-chain data: tokens, trades, transfers, accounts across 60+ networks' },
      { name: 'Payments', description: 'x402 protocol for AI-native pay-per-use micropayments, zero gas on X Layer' },
      { name: 'DApp Connect', description: 'SDK to integrate OKX Wallet into any dApp for ecosystem access' },
    ],
  },
  {
    name: 'Bitget Wallet',
    type: 'CEX',
    launch: 'Feb 27, 2026',
    chains: '9 chains',
    chainCount: 9,
    mcp: true,
    integration: ['MCP Server', 'CLI', 'OpenClaw', 'Manus', 'Claude'],
    github: [{ label: 'bitget-wallet-ai-lab/bitget-wallet-skill', url: 'https://github.com/bitget-wallet-ai-lab/bitget-wallet-skill' }],
    skills: [
      { name: 'Token Info Queries', description: 'Detailed data about any cryptocurrency token via natural language' },
      { name: 'Candlestick Market Data', description: 'Historical and real-time price charting across supported chains' },
      { name: 'Transaction Statistics', description: 'On-chain transaction metrics and pattern analysis' },
      { name: 'Gainers/Losers Rankings', description: 'Top-performing and underperforming assets identification' },
      { name: 'Liquidity Pool Metrics', description: 'DEX pool analytics across 110+ integrated protocols' },
      { name: 'Contract Security Checks', description: 'Smart contract safety evaluation and verification status' },
      { name: 'Swap Routing Quotes', description: 'Optimal trading paths calculated across 110+ DEX protocols' },
    ],
  },
  {
    name: 'Uniswap',
    type: 'DEX',
    launch: 'Feb 21, 2026',
    chains: '12+ chains',
    chainCount: 12,
    mcp: false,
    integration: ['CLI', 'Python', 'TypeScript', 'GitHub'],
    github: [{ label: 'Uniswap/uniswap-ai', url: 'https://github.com/Uniswap/uniswap-ai' }],
    skills: [
      { name: 'v4-security-foundations', description: 'Security patterns for Uniswap v4 hooks, prevents agent-introduced vulnerabilities' },
      { name: 'configurator', description: 'Pool configuration, parameter setup, treasury pool initialization' },
      { name: 'deployer', description: 'Smart contract deployment workflows, agent-driven infrastructure provisioning' },
      { name: 'viem-integration', description: 'Ethereum client integration layer, foundational for all on-chain agent ops' },
      { name: 'swap-integration', description: 'Token swap execution, autonomous trading, real-time treasury rebalancing' },
      { name: 'liquidity-planner', description: 'LP position strategy, agent-managed yield optimization' },
      { name: 'swap-planner', description: 'Multi-step swap routing, cost-efficient cross-token path calculation' },
    ],
  },
  {
    name: 'Coinbase',
    type: 'CEX',
    launch: 'Feb 11, 2026',
    chains: 'EVM + Solana',
    chainCount: 15,
    mcp: false,
    integration: ['x402 Protocol', 'Agentic Wallets SDK', 'Base L2'],
    github: [
      { label: 'coinbase/agentkit', url: 'https://github.com/coinbase/agentkit' },
      { label: 'coinbase/x402', url: 'https://github.com/coinbase/x402' },
    ],
    skills: [
      { name: 'Agentic Wallets', description: 'Non-custodial wallets in TEEs for autonomous agent fund management' },
      { name: 'x402 Payments', description: 'Machine-to-machine payments, 50M+ transactions processed' },
      { name: 'Spending Controls', description: 'Programmable session caps, per-transaction limits, guardrails' },
      { name: 'Gasless Base Txns', description: 'Zero-gas transactions on Base L2 for cost-efficient agent operations' },
      { name: 'Auto Key Acquisition', description: 'Agents autonomously acquire API keys, compute, data streams, storage' },
    ],
  },
  {
    name: 'PancakeSwap',
    type: 'DEX',
    launch: 'Mar 2026',
    chains: 'BSC, ETH, Arb, Base, zkSync, Linea',
    chainCount: 6,
    mcp: false,
    integration: ['Claude Code', 'Cursor', 'Windsurf', 'Copilot', 'SKILL.md'],
    github: [{ label: 'pancakeswap/pancakeswap-ai', url: 'https://github.com/pancakeswap/pancakeswap-ai' }],
    skills: [
      { name: 'swap-planner', description: 'Token discovery, contract verification, pricing data retrieval, and deep link generation to PancakeSwap swap UI' },
      { name: 'liquidity-planner', description: 'LP position management across V2, V3, and StableSwap pools with pool analysis and APY calculations' },
      { name: 'farming-planner', description: 'Farm identification, yield comparison, CAKE staking strategy planning, and farming UI link generation' },
      { name: 'pancakeswap-driver', description: 'Plugin for programmatic interaction with PancakeSwap protocols — execute swaps and manage positions on-chain' },
      { name: 'pancakeswap-farming', description: 'Plugin for automated farming workflows — stake/unstake LP tokens, harvest CAKE rewards, compound yields' },
    ],
  },
  {
    name: 'Aster DEX',
    type: 'DEX',
    launch: 'Mar 2026',
    chains: 'Aster L1',
    chainCount: 1,
    mcp: true,
    integration: ['Cursor', 'Claude', 'LangChain', 'MCP', 'CLI'],
    github: [{ label: 'asterdex/aster-mcp', url: 'https://github.com/asterdex/aster-mcp' }],
    skills: [
      { name: 'Futures Trading', description: 'Market data, order management (limit/market/OCO), leverage control, margin transfers, income tracking across futures markets' },
      { name: 'Spot Trading', description: 'Spot market data, order placement and cancellation, trade history, transaction records, commission rates' },
      { name: 'Account Management', description: 'Multi-account support with Fernet-encrypted API key storage, balance queries, position tracking' },
      { name: 'V3 Key Signing', description: 'EIP-712 authentication for secure agent-to-exchange interaction without exposing raw API secrets' },
    ],
  },
  {
    name: 'Trust Wallet',
    type: 'Wallet',
    launch: 'Mar 2026',
    chains: '140+ chains (EVM, Solana, Cosmos, BTC, Aptos)',
    chainCount: 140,
    mcp: true,
    integration: ['Claude Code', 'MCP', 'Claude Skills'],
    github: [{ label: 'trustwallet/developer', url: 'https://github.com/trustwallet/developer' }],
    skills: [
      { name: 'wallet-core', description: 'Key management and transaction signing across 140+ blockchains, multi-chain wallet operations' },
      { name: 'web3-provider', description: 'Web3 provider integrations for EVM, Solana, Cosmos, Bitcoin, and Aptos ecosystems' },
      { name: 'token-tooling', description: 'Asset metadata, token discovery, balance queries, and portfolio tracking across supported chains' },
      { name: 'ERC-4337 Smart Wallets', description: 'Account abstraction modules for gasless transactions, session keys, and smart wallet management' },
    ],
  },
  {
    name: '1inch',
    type: 'DEX Aggregator',
    launch: 'Feb 2026',
    chains: '18 EVM chains (ETH, Arb, Base, Polygon, OP...)',
    chainCount: 18,
    mcp: true,
    integration: ['Claude Code', 'Cursor', 'Claude Desktop', 'MCP'],
    github: [{ label: 'vaibhavgeek/one_inch_mcp', url: 'https://github.com/vaibhavgeek/one_inch_mcp' }],
    skills: [
      { name: 'Cross-Chain Swap', description: 'Execute single-chain and cross-chain token swaps via Fusion+ API with natural language commands' },
      { name: 'Quote Engine', description: 'Real-time swap quotes and optimal routing across 18 EVM chains with gas estimation' },
      { name: 'Order Monitoring', description: 'Background worker system to track swap execution status from initiation to completion' },
    ],
  },
  {
    name: 'LI.FI',
    type: 'Bridge/DEX Aggregator',
    launch: 'Feb 2026',
    chains: 'Multi-chain (30+ chains)',
    chainCount: 30,
    mcp: true,
    integration: ['Claude Code', 'Cursor', 'Claude Desktop', 'MCP'],
    github: [{ label: 'demomagic/lifi-mcp-server', url: 'https://github.com/demomagic/lifi-mcp-server' }],
    skills: [
      { name: 'Cross-Chain Bridge', description: 'Bridge tokens across 30+ chains with optimal route selection and fee comparison' },
      { name: 'DEX Aggregation', description: 'Aggregate quotes from multiple DEXs for best swap execution across supported networks' },
      { name: 'Chain & Token Info', description: 'Query supported chains, tokens, connections, gas prices, and available bridging tools' },
      { name: 'Transaction Tracking', description: 'Monitor cross-chain transfer status, fee withdrawal management, and wallet operations' },
    ],
  },
  {
    name: 'BNB Chain',
    type: 'L1 Ecosystem',
    launch: 'Mar 2026',
    chains: 'BNB Chain (BSC)',
    chainCount: 1,
    mcp: true,
    integration: ['Cursor', 'Claude Desktop', 'OpenClaw', 'MCP', 'npx skills add'],
    github: [{ label: 'bnb-chain/bnbchain-skills', url: 'https://github.com/bnb-chain/bnbchain-skills' }],
    skills: [
      { name: 'On-Chain Data', description: 'Read blockchain data, query balances, transaction history, and contract state on BNB Chain' },
      { name: 'Transaction Execution', description: 'Execute real transactions on BSC mainnet and testnet via AI agent commands' },
      { name: 'Wallet Management', description: 'Create and manage wallets, sign transactions, and interact with dApps on BNB ecosystem' },
      { name: 'Agent Registry', description: 'Register and verify AI agents on-chain for trusted agent-to-agent and agent-to-protocol interactions' },
    ],
  },
];

interface CategoryDef {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryDef[] = [
  { key: 'market_data', label: 'Market Data', icon: <BarChart3 className="w-3 h-3" /> },
  { key: 'trading', label: 'Trading', icon: <ArrowLeftRight className="w-3 h-3" /> },
  { key: 'onchain', label: 'On-chain', icon: <Globe className="w-3 h-3" /> },
  { key: 'risk', label: 'Risk', icon: <Shield className="w-3 h-3" /> },
  { key: 'wallet', label: 'Wallet', icon: <Wallet className="w-3 h-3" /> },
  { key: 'defi', label: 'DeFi', icon: <Zap className="w-3 h-3" /> },
  { key: 'social', label: 'Social', icon: <Users className="w-3 h-3" /> },
  { key: 'identity', label: 'Identity', icon: <Fingerprint className="w-3 h-3" /> },
];

function hasCapability(platform: Platform, category: string): boolean {
  const text = platform.skills.map(s => `${s.name} ${s.description}`).join(' ').toLowerCase();
  switch (category) {
    case 'market_data': return /market data|price|candlestick|ranking|ticker|order book|signal/.test(text);
    case 'trading': return /trade|swap|execution|order|oco|otoco|routing|launch token/.test(text);
    case 'onchain': return /on-chain|address|token info|smart money|transfer|transaction stat/.test(text);
    case 'risk': return /risk|audit|security|contract.*check|mint|freeze|vulnerability|hallucination guard/.test(text);
    case 'wallet': return /wallet|balance|payment|x402|spending|fund/.test(text);
    case 'defi': return /liquidity|pool|lp|yield|hook|deploy|dex/.test(text);
    case 'social': return /farcaster|social|cast|message|feed|dm/.test(text);
    case 'identity': return /identity|erc-8004|ens|siwa|sign-in|nft.*identity|trust score/.test(text);
    default: return false;
  }
}

function capabilityScore(platform: Platform): number {
  return CATEGORIES.filter(c => hasCapability(platform, c.key)).length;
}

const TOTAL_SKILLS = PLATFORMS.reduce((a, p) => a + p.skills.length, 0);
const MCP_COUNT = PLATFORMS.filter(p => p.mcp).length;

export function SkillsComparisonSection() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Card className="mb-8 border-amber-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              AI Agent Skills Comparison
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">
                {TOTAL_SKILLS} SKILLS
              </Badge>
            </CardTitle>
            <CardDescription>
              {PLATFORMS.length} platforms launched AI agent infrastructure in Feb-Mar 2026. Tap any row to inspect individual skills.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary stats - terminal style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <div className="border border-amber-500/30 bg-black/60 px-3 py-2 font-mono">
            <div className="text-[9px] text-amber-400/60">{'>'} TOTAL_SKILLS</div>
            <div className="text-lg font-bold text-amber-400">{TOTAL_SKILLS}</div>
          </div>
          <div className="border border-amber-500/30 bg-black/60 px-3 py-2 font-mono">
            <div className="text-[9px] text-amber-400/60">{'>'} PLATFORMS</div>
            <div className="text-lg font-bold text-amber-400">{PLATFORMS.length}</div>
          </div>
          <div className="border border-amber-500/30 bg-black/60 px-3 py-2 font-mono">
            <div className="text-[9px] text-amber-400/60">{'>'} MCP_COMPAT</div>
            <div className="text-lg font-bold text-amber-400">{MCP_COUNT}/{PLATFORMS.length}</div>
          </div>
          <div className="border border-amber-500/30 bg-black/60 px-3 py-2 font-mono">
            <div className="text-[9px] text-amber-400/60">{'>'} LAUNCH_WINDOW</div>
            <div className="text-lg font-bold text-amber-400">21d</div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto border border-amber-500/20 rounded-lg">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-amber-500/20 bg-black/40">
                <th className="text-left py-2.5 px-3 text-amber-400/80 font-mono font-normal sticky left-0 z-10 bg-black/90 min-w-[140px]">
                  PLATFORM
                </th>
                <th className="py-2.5 px-2 text-center text-amber-400/80 font-mono font-normal min-w-[50px]">
                  SKILLS
                </th>
                <th className="py-2.5 px-2 text-center text-amber-400/80 font-mono font-normal min-w-[55px]">
                  CHAINS
                </th>
                <th className="py-2.5 px-2 text-center text-amber-400/80 font-mono font-normal min-w-[40px]">
                  MCP
                </th>
                {CATEGORIES.map(c => (
                  <th key={c.key} className="py-2.5 px-1.5 text-center text-amber-400/60 font-mono font-normal min-w-[55px]">
                    <span className="flex flex-col items-center gap-0.5">
                      {c.icon}
                      <span className="text-[9px]">{c.label}</span>
                    </span>
                  </th>
                ))}
                <th className="py-2.5 px-2 text-center text-amber-400/80 font-mono font-normal min-w-[45px]">
                  SCORE
                </th>
              </tr>
            </thead>
            <tbody>
              {PLATFORMS.map((p) => {
                const isExpanded = expanded === p.name;
                const score = capabilityScore(p);
                return (
                  <Fragment key={p.name}>
                    <tr
                      className="border-b border-amber-500/10 cursor-pointer transition-colors hover:bg-amber-500/5"
                      onClick={() => setExpanded(isExpanded ? null : p.name)}
                    >
                      <td className="py-3 px-3 sticky left-0 z-10 bg-background">
                        <span className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1 py-0 font-mono border-0 ${
                              p.type === 'CEX'
                                ? 'bg-orange-500/15 text-orange-400'
                                : 'bg-green-500/15 text-green-400'
                            }`}
                          >
                            {p.type}
                          </Badge>
                          <span className="font-semibold text-sm">{p.name}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 text-amber-500/50" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="font-mono font-bold text-sm text-amber-400">
                          {p.skills.length}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-sm text-foreground">
                        {p.chains}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {p.mcp ? (
                          <span className="text-green-400 font-mono text-[10px] font-bold">YES</span>
                        ) : (
                          <span className="text-muted-foreground font-mono text-[10px]">NO</span>
                        )}
                      </td>
                      {CATEGORIES.map(c => (
                        <td key={c.key} className="py-3 px-1.5 text-center">
                          {hasCapability(p, c.key) ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-green-500/15 text-green-400 text-[10px] font-bold">
                              ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-muted/30 text-muted-foreground/30 text-[10px]">
                              —
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="py-3 px-2 text-center">
                        <span className={`font-mono font-bold text-sm ${
                          score >= 7 ? 'text-green-400' :
                          score >= 5 ? 'text-amber-400' :
                          'text-muted-foreground'
                        }`}>
                          {score}/{CATEGORIES.length}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-amber-500/10">
                        <td colSpan={5 + CATEGORIES.length} className="p-0">
                          <div className="bg-black/40 px-4 py-3 border-l-2 border-amber-500/40">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <span className="text-[10px] font-mono text-amber-400/60">
                                {'>'} LAUNCH: {p.launch}
                              </span>
                              <span className="text-[10px] font-mono text-amber-400/60">
                                {'>'} INTEGRATIONS: {p.integration.join(', ')}
                              </span>
                              {p.github.map((g) => (
                                <a
                                  key={g.url}
                                  href={g.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400/80 hover:text-amber-300 transition-colors"
                                >
                                  <Github className="w-3 h-3" />
                                  {g.label}
                                </a>
                              ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {p.skills.map((s, i) => (
                                <div
                                  key={i}
                                  className="border border-amber-500/10 bg-black/30 rounded px-3 py-2"
                                >
                                  <p className="text-[11px] font-mono font-semibold text-amber-300">
                                    {s.name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                                    {s.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Methodology note */}
        <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            Capability scoring: {CATEGORIES.length} categories assessed per platform. Score = categories covered.
          </span>
          <span>
            Sources: Official docs, GitHub repos, press releases (Feb-Mar 2026) · DeFi Mexico
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
