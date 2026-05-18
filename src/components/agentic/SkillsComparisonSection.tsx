import { useState, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Zap, Shield, Wallet, BarChart3, Globe, Users, Fingerprint, ArrowLeftRight, Github } from 'lucide-react';

interface Skill {
  name: string;
  description: string;
}

type PlatformType =
  | 'CEX' | 'DEX' | 'Wallet' | 'DEX Aggregator' | 'Bridge/DEX Aggregator'
  | 'L1 Ecosystem' | 'CEX/Multi-Asset' | 'Perp DEX' | 'Data' | 'NFT'
  | 'Lending' | 'Analytics' | 'Security' | 'Custody' | 'Infra' | 'Identity';

interface Platform {
  name: string;
  type: PlatformType;
  skillCount?: number; // override displayed count when real count differs from skills array length
  launch: string;
  chains: string;
  chainCount: number;
  mcp: boolean;
  /** false = community-built MCP (not endorsed by the protocol team) */
  official?: boolean;
  /** Authentication model used to access the agent surface. */
  auth?: 'API key' | 'OAuth' | 'EIP-712' | 'SIWE' | 'x402' | 'Wallet signing' | 'Bearer' | 'None';
  /** Commercial model of the AGENT surface (trading fees billed separately). */
  pricing?: 'Free' | 'Freemium' | 'Paid' | 'Per-call (x402)';
  status?: 'Active' | 'Beta' | 'Alpha' | 'Deprecated';
  docs?: string;
  skills: Skill[];
  integration: string[];
  github: { label: string; url: string }[];
}

const PLATFORMS: Platform[] = [
  // ── CEX ──────────────────────────────────────────────────
  {
    name: 'Kraken',
    type: 'CEX/Multi-Asset',
    skillCount: 50,
    launch: 'Mar 2026',
    chains: 'Crypto, xStocks, Forex, Futures, Earn',
    chainCount: 6,
    mcp: true,
    official: true,
    auth: 'API key',
    pricing: 'Free',
    status: 'Active',
    docs: 'https://www.kraken.com/kraken-cli',
    integration: ['Claude Desktop', 'Cursor', 'Windsurf', 'VS Code', 'Gemini CLI', 'ChatGPT', 'MCP', 'SKILL.md', 'CLI'],
    github: [{ label: 'krakenfx/kraken-cli', url: 'https://github.com/krakenfx/kraken-cli' }],
    skills: [
      { name: 'Market Data (10 cmds)', description: 'Ticker, OHLC, order book, recent trades across 1,400+ crypto pairs, 79 xStocks, 11 forex pairs, 317 futures contracts' },
      { name: 'Trading (9 cmds)', description: 'Place, amend, and cancel spot/margin orders with up to 10x leverage. 32 dangerous commands require explicit acknowledgment' },
      { name: 'Futures & Derivatives (39 cmds)', description: 'Perpetual and fixed-date futures across crypto, forex, and equities with up to 50x leverage. Real-time WebSocket streaming' },
      { name: 'Account & Funding (28 cmds)', description: 'Balances, open positions, trade history, ledger, deposits, withdrawals, wallet transfers, and subaccount management' },
      { name: 'Earn / Staking (6 cmds)', description: 'Flexible and bonded staking strategies across multiple assets. Earn yield directly from agent commands' },
      { name: 'Paper Trading (10 cmds)', description: 'Full simulation environment with live prices and no real funds. Safe iteration for strategy testing' },
      { name: '50 Workflow Skills', description: 'Goal-oriented SKILL.md packages for complex multi-step trading strategies, market analysis, and portfolio management' },
    ],
  },
  {
    name: 'Binance',
    type: 'CEX',
    launch: 'Mar 2026',
    chains: 'BNB Chain',
    chainCount: 1,
    mcp: true,
    official: true,
    auth: 'API key',
    pricing: 'Free',
    status: 'Active',
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
      { name: 'Binance Alpha', description: 'Binance Alpha token data: early-stage token discovery, alpha signals, and emerging asset tracking' },
      { name: 'Derivatives USDS Futures', description: 'USDS-margined perpetual futures trading: order placement, position management, and PnL tracking' },
      { name: 'Margin Trading', description: 'Cross and isolated margin trading operations: borrow, repay, transfer, and margin order management' },
      { name: 'Assets Management', description: 'Portfolio-wide asset management: holdings overview, transfer between accounts, and asset allocation' },
      { name: 'Square Post', description: 'Binance Square social content publishing: create posts, share trading insights, engage community' },
    ],
  },
  {
    name: 'OKX OnchainOS',
    type: 'CEX',
    launch: 'Mar 3, 2026',
    chains: '60+ chains',
    chainCount: 60,
    mcp: true,
    official: true,
    auth: 'API key',
    pricing: 'Free',
    status: 'Active',
    docs: 'https://www.okx.com/docs-v5/agent_en/',
    integration: ['MCP', 'AI Skills', 'REST API', 'Claude Code', 'Cursor'],
    github: [
      { label: 'okx/onchainos-skills', url: 'https://github.com/okx/onchainos-skills' },
      { label: 'okx/agent-trade-kit', url: 'https://github.com/okx/agent-trade-kit' },
    ],
    skillCount: 11,
    skills: [
      { name: 'Agentic Wallet', description: 'Auth (login, OTP, switch), balance, send tokens (ERC-20/SPL), tx history, smart contract calls across 20+ chains' },
      { name: 'DEX Swap', description: 'Multi-chain swap aggregation across 500+ DEXes with slippage control, price impact protection, and optimal routing' },
      { name: 'DEX Market', description: 'Token prices, K-line/OHLC charts, wallet PnL (win rate, realized/unrealized), DEX trade feed for tracked addresses' },
      { name: 'DEX Signal', description: 'Smart money/whale/KOL aggregated buy signals + leaderboard rankings filtered by wallet type, size, and market cap' },
      { name: 'DEX Token', description: '14 commands: token search, trending, holder distribution, honeypot detection, liquidity pools, top trader analysis' },
      { name: 'DEX Trenches', description: 'Meme/pump.fun scanner: new launches, dev reputation, bundle/sniper detection, bonding curve status, co-investor tracking' },
      { name: 'Security', description: 'Token risk analysis, DApp phishing detection, tx pre-execution scan, signature safety, approval management (ERC-20/Permit2)' },
      { name: 'Onchain Gateway', description: 'Gas estimation, tx simulation, broadcasting, and order tracking across 20+ chains including X Layer' },
      { name: 'Wallet Portfolio', description: 'Multi-chain portfolio of any address: total value, all token balances, specific token lookups' },
      { name: 'x402 Payment', description: 'Sign x402 payment authorization for payment-gated APIs. TEE signing via wallet session or local EIP-3009' },
      { name: 'Audit Log', description: 'Structured JSONL audit trail of all CLI/MCP operations with auto-rotation (10K lines max)' },
    ],
  },
  {
    name: 'Coinbase',
    type: 'CEX',
    launch: 'Feb 11, 2026',
    chains: 'EVM + Solana',
    chainCount: 15,
    mcp: true,
    official: true,
    auth: 'API key',
    pricing: 'Freemium',
    status: 'Active',
    docs: 'https://docs.cdp.coinbase.com/agent-kit/welcome',
    integration: ['MCP', 'x402 Protocol', 'Agentic Wallets SDK', 'Base L2', 'LangChain', 'Vercel AI'],
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
    name: 'Crypto.com',
    type: 'CEX',
    launch: 'Mar 2026',
    chains: 'Cronos EVM, Cronos zkEVM',
    chainCount: 2,
    mcp: true,
    official: true,
    auth: 'None',
    pricing: 'Free',
    status: 'Active',
    docs: 'https://mcp.crypto.com/docs',
    integration: ['MCP', 'AI Agent SDK', 'Claude', 'ChatGPT'],
    github: [{ label: 'crypto.com/ai-agent-sdk', url: 'https://ai-agent-sdk-docs.crypto.com/' }],
    skills: [
      { name: 'Market Data MCP', description: 'Real-time crypto market data feed: prices, volumes, market caps for AI/LLM consumption' },
      { name: 'AI Financial Analysis', description: 'AI-powered crypto financial analysis: trend detection, sentiment, portfolio insights' },
      { name: 'Blockchain Status', description: 'On-chain queries: block numbers, gas prices, transaction counts, network health on Cronos' },
      { name: 'DeFi APR Queries', description: 'H2 Finance integration for real-time APR/APY queries across DeFi protocols on Cronos' },
    ],
  },
  {
    name: 'Bitget Wallet',
    type: 'CEX',
    launch: 'Feb 27, 2026',
    chains: '9 chains',
    chainCount: 9,
    mcp: true,
    official: true,
    auth: 'API key',
    pricing: 'Free',
    status: 'Active',
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
      { name: 'x402 Payments', description: 'EIP-3009 and Permit2 payment protocol for agent-to-agent micropayments' },
      { name: 'Order Mode (Gasless)', description: 'Cross-chain + gasless swaps with EIP-7702 smart account abstraction' },
      { name: 'Hotpicks Ranking', description: 'Trending tokens ranking: discover hot tokens across supported chains in real-time' },
    ],
  },
  {
    name: 'Bybit',
    type: 'CEX',
    skillCount: 253,
    launch: 'Apr 22, 2026',
    chains: 'Multi-chain',
    chainCount: 30,
    mcp: true,
    official: true,
    auth: 'API key',
    pricing: 'Free',
    status: 'Active',
    integration: ['MCP', 'Claude', 'ChatGPT', 'OpenClaw', 'Gemini', 'Cursor', 'Windsurf', 'SKILL.md', 'npm'],
    github: [{ label: 'bybit/ai-skills', url: 'https://www.bybit.com/en/ai-trading-skill' }],
    skills: [
      { name: 'Market Intelligence', description: 'Real-time prices, candle lines, order book depth, funding rates, and market analytics across all Bybit markets' },
      { name: 'Spot Trading', description: 'Market buy/sell, limit orders, batch operations, and portfolio management for spot markets' },
      { name: 'Derivatives Trading', description: 'Leverage trading, take-profit/stop-loss, conditional orders, and perpetual futures management' },
      { name: 'Earn / Staking', description: 'Flexible Savings and On-Chain Earn products with yield optimization strategies' },
      { name: 'Account & Assets', description: 'Account info, deposits, withdrawals, currency conversion, and multi-account management' },
      { name: 'Paper Trading', description: 'Testnet simulation environment with live prices — safe iteration for strategy testing before real funds' },
    ],
  },
  // ── DEX ──────────────────────────────────────────────────
  {
    name: 'BANKR',
    type: 'DEX',
    launch: 'Active',
    chains: 'EVM + Solana',
    chainCount: 5,
    mcp: true,
    official: true,
    auth: 'SIWE',
    pricing: 'Free',
    status: 'Active',
    integration: ['OpenClaw', 'Claude', 'X/Farcaster', 'ERC-8004'],
    github: [{ label: 'BankrBot/skills', url: 'https://github.com/BankrBot/skills' }],
    skills: [
      { name: 'bankr', description: 'Launch tokens, earn from every trade, fund agents. Built-in wallet with hallucination guards + TX verification' },
      { name: 'siwa', description: 'Sign-In With Agent (SIWA) auth for ERC-8004 agents. Message signing via Bankr wallets + ERC-8128 route protection' },
      { name: 'bankr-signals', description: 'Transaction-verified trading signals on Base. Register as provider, publish trades with TX hash proof' },
      { name: 'hydrex', description: 'Locking, voting, and LP skills for Hydrex protocol. Governance participation + liquidity provision via agent' },
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
    name: 'Uniswap',
    type: 'DEX',
    launch: 'Feb 21, 2026',
    chains: '12+ chains',
    chainCount: 12,
    mcp: false,
    official: true,
    auth: 'Wallet signing',
    pricing: 'Free',
    status: 'Active',
    integration: ['CLI', 'Python', 'TypeScript', 'GitHub'],
    github: [{ label: 'Uniswap/uniswap-ai', url: 'https://github.com/Uniswap/uniswap-ai' }],
    skills: [
      { name: 'uniswap-hooks', description: 'Security patterns for Uniswap v4 hooks, prevents agent-introduced vulnerabilities' },
      { name: 'uniswap-trading', description: 'Token swap execution, UniswapX quote/signing flow, real-time treasury rebalancing' },
      { name: 'uniswap-cca', description: 'Cross-chain agent operations, multi-step swap routing across supported networks' },
      { name: 'uniswap-driver', description: 'Programmatic protocol interaction — execute swaps, manage positions, deploy contracts on-chain' },
      { name: 'uniswap-viem', description: 'Ethereum client integration layer (viem), foundational for all on-chain agent operations' },
    ],
  },
  {
    name: 'PancakeSwap',
    type: 'DEX',
    launch: 'Mar 2026',
    chains: 'BSC, ETH, Arb, Base, zkSync, Linea',
    chainCount: 6,
    mcp: false,
    official: true,
    auth: 'Wallet signing',
    pricing: 'Free',
    status: 'Active',
    integration: ['Claude Code', 'Cursor', 'Windsurf', 'Copilot', 'SKILL.md'],
    github: [{ label: 'pancakeswap/pancakeswap-ai', url: 'https://github.com/pancakeswap/pancakeswap-ai' }],
    skills: [
      { name: 'swap-planner', description: 'Token discovery, contract verification, pricing via GeckoTerminal, PCSX routing, and deep link generation' },
      { name: 'liquidity-planner', description: 'LP position management across V2, V3, and StableSwap pools with pool analysis and APY calculations' },
      { name: 'farming-planner', description: 'Farm identification, yield comparison, CAKE staking strategy planning, and farming UI link generation' },
    ],
  },
  {
    name: 'Aster DEX',
    type: 'DEX',
    launch: 'Mar 2026',
    chains: 'Aster L1',
    chainCount: 1,
    mcp: true,
    official: true,
    auth: 'EIP-712',
    pricing: 'Free',
    status: 'Active',
    skillCount: 45,
    integration: ['Cursor', 'Claude', 'LangChain', 'MCP', 'CLI'],
    github: [{ label: 'asterdex/aster-mcp', url: 'https://github.com/asterdex/aster-mcp' }],
    skills: [
      { name: 'Futures Trading (22 tools)', description: 'Market data, order management (limit/market/OCO), leverage control, margin transfers, income tracking across futures markets' },
      { name: 'Spot Trading (11 tools)', description: 'Spot market data, order placement and cancellation, trade history, transaction records, commission rates' },
      { name: 'Account Management', description: 'Multi-account support with Fernet-encrypted API key storage, balance queries, position tracking' },
      { name: 'V3 Key Signing', description: 'EIP-712 authentication for secure agent-to-exchange interaction without exposing raw API secrets' },
    ],
  },
  // ── Perp DEX ─────────────────────────────────────────────
  {
    name: 'Injective',
    type: 'Perp DEX',
    launch: 'Mar 2026',
    chains: 'Injective (+ bridge ETH, SOL, Arb)',
    chainCount: 4,
    mcp: true,
    official: true,
    auth: 'Wallet signing',
    pricing: 'Free',
    status: 'Active',
    integration: ['MCP', 'Claude', 'Open Source'],
    github: [{ label: 'injectivelabs/injective-mcp', url: 'https://github.com/injectivelabs' }],
    skills: [
      { name: 'Perp Futures (22 tools)', description: 'Open/close leveraged positions, monitor P&L, funding rate queries, real-time market data' },
      { name: 'Spot Trading', description: 'Spot transfers, order placement, trade execution on Injective DEX' },
      { name: 'Cross-Chain Bridge', description: 'Bridge assets from Ethereum, Solana, Arbitrum into Injective ecosystem' },
      { name: 'Subaccount Management', description: 'Subaccount deposits, balance queries, position isolation for risk management' },
      { name: 'Raw EVM Transactions', description: 'Execute arbitrary EVM transactions with price quantization auto-handling' },
    ],
  },
  {
    name: 'Paradex',
    type: 'Perp DEX',
    launch: 'Mar 2026',
    chains: 'Starknet',
    chainCount: 1,
    mcp: true,
    official: false,
    auth: 'Wallet signing',
    pricing: 'Free',
    status: 'Active',
    integration: ['MCP', 'Claude', 'Python', 'Community-built'],
    github: [{ label: 'sv/mcp-paradex-py', url: 'https://github.com/sv/mcp-paradex-py' }],
    skills: [
      { name: 'Market Data', description: 'Historical funding rates, orderbook depth, candlestick (klines), recent trades, best bid/offer' },
      { name: 'Order Management', description: 'Place, amend, cancel orders on Paradex perpetual futures exchange on Starknet' },
      { name: 'Position Monitoring', description: 'Track open positions, P&L, liquidation prices, and vault management' },
      { name: 'AI Prompts', description: 'Structured prompts: market_overview, market_analysis, position_management, create_optimal_order' },
    ],
  },
  {
    name: 'Hyperliquid',
    type: 'Perp DEX',
    launch: 'Mar 2026',
    chains: 'Hyperliquid L1 / HyperEVM',
    chainCount: 1,
    mcp: true,
    official: false,
    auth: 'EIP-712',
    pricing: 'Free',
    status: 'Active',
    integration: ['MCP', 'Claude', 'npm', 'Python', 'Community-built'],
    github: [{ label: 'edkdev/hyperliquid-mcp (community)', url: 'https://github.com/edkdev/hyperliquid-mcp' }],
    skills: [
      { name: 'Perp Trading', description: 'Place/cancel orders on perpetual futures, EIP-712 signing, agent mode, testnet support' },
      { name: 'Market Data', description: 'Real-time orderbook, funding rates, open interest, recent trades on Hyperliquid' },
      { name: 'Account Analytics', description: 'Position tracking, P&L monitoring, account state, and vault interactions' },
      { name: 'HyperEVM', description: 'Interact with HyperEVM ecosystem: deploy contracts, read state, execute transactions' },
    ],
  },
  // ── Wallets ──────────────────────────────────────────────
  {
    name: 'Phantom',
    type: 'Wallet',
    launch: 'Feb 18, 2026',
    chains: 'Solana, Ethereum, Bitcoin, Sui',
    chainCount: 4,
    mcp: true,
    official: true,
    auth: 'Wallet signing',
    pricing: 'Free',
    status: 'Active',
    docs: 'https://docs.phantom.com/updates',
    integration: ['MCP', 'Claude', 'OpenClaw'],
    github: [{ label: 'phantom/mcp', url: 'https://help.phantom.com/hc/en-us/articles/49235725504147' }],
    skills: [
      { name: 'Transaction Signing', description: 'Sign transactions across Solana, Ethereum, Bitcoin, and Sui with per-action security prompts' },
      { name: 'Token Swaps', description: 'Execute token swaps directly from Phantom wallet via AI agent commands' },
      { name: 'Cross-Chain Swaps (Apr 2026)', description: 'Solana ↔ Ethereum/Base/Polygon/Arbitrum via buy_token; agents get dedicated wallets via get_wallet_addresses' },
      { name: 'Cross-Chain Bridge', description: 'Bridge assets between supported chains with built-in route optimization' },
      { name: 'Portfolio Management', description: 'View wallet addresses, balances, holdings, and transaction history across all chains' },
      { name: 'Message Signing', description: 'Sign arbitrary messages for dApp authentication, with revocable scopes and parameter bounds' },
    ],
  },
  {
    name: 'Trust Wallet',
    type: 'Wallet',
    launch: 'Mar 2026',
    chains: '140+ chains (EVM, Solana, Cosmos, BTC, Aptos)',
    chainCount: 140,
    mcp: true,
    official: true,
    auth: 'Wallet signing',
    pricing: 'Free',
    status: 'Active',
    docs: 'https://trustwallet.com/blog/announcements/introducing-the-trust-wallet-agent-kit-twak-your-ai-agent-can-now-act-on-crypto',
    integration: ['Claude Code', 'MCP', 'Claude Skills', 'CLI'],
    github: [{ label: 'trustwallet/developer', url: 'https://github.com/trustwallet/developer' }],
    skills: [
      { name: 'wallet-core', description: 'Key management and transaction signing across 140+ blockchains, multi-chain wallet operations' },
      { name: 'web3-provider', description: 'Web3 provider integrations for EVM, Solana, Cosmos, Bitcoin, and Aptos ecosystems' },
      { name: 'token-tooling', description: 'Asset metadata, token discovery, balance queries, and portfolio tracking across supported chains' },
      { name: 'ERC-4337 Smart Wallets', description: 'Account abstraction modules for gasless transactions, session keys, and smart wallet management' },
    ],
  },
  // ── DEX Aggregators & Bridges ────────────────────────────
  {
    name: '1inch',
    type: 'DEX Aggregator',
    launch: 'Mar 30, 2026',
    chains: '18 EVM chains (ETH, Arb, Base, Polygon, OP...)',
    chainCount: 18,
    mcp: true,
    official: true,
    auth: 'OAuth',
    pricing: 'Freemium',
    status: 'Active',
    docs: 'https://business.1inch.com/1inch-mcp',
    skillCount: 7,
    integration: ['Claude Code', 'Cursor', 'Claude Desktop', 'MCP', 'OAuth'],
    github: [{ label: 'vaibhavgeek/one_inch_mcp', url: 'https://github.com/vaibhavgeek/one_inch_mcp' }],
    skills: [
      { name: 'Swap API', description: 'Single-chain swap execution via Fusion+ with optimal routing and MEV protection' },
      { name: 'Cross-Chain Swap', description: 'Fusion+ cross-chain swaps across 18 EVM networks with atomic settlement' },
      { name: 'Balance API', description: 'Multi-chain token balances and allowances for connected wallets' },
      { name: 'Portfolio API', description: 'Portfolio value broken down by DeFi protocol, token, and historical charts across all supported chains' },
      { name: 'Token API', description: 'Token metadata, prices, logos, decimals across 18 EVM chains' },
      { name: 'Gas Price API', description: 'Real-time gas prices with fast/standard/slow tiers per chain' },
      { name: 'Transaction API', description: 'Transaction history retrieval, decoding, and status tracking per address' },
    ],
  },
  {
    name: 'Jupiter',
    type: 'DEX Aggregator',
    launch: 'Mar 2026',
    chains: 'Solana',
    chainCount: 1,
    mcp: true,
    official: false,
    auth: 'Wallet signing',
    pricing: 'Free',
    status: 'Active',
    integration: ['MCP', 'Claude', 'TypeScript', 'Community-built'],
    github: [{ label: 'dcSpark/mcp-server-jupiter', url: 'https://github.com/dcSpark/mcp-server-jupiter' }],
    skills: [
      { name: 'Get Quote', description: 'Real-time market pricing for any Solana token pair via Jupiter aggregation engine' },
      { name: 'Build Swap TX', description: 'Construct optimized swap transactions with slippage protection and priority fees' },
      { name: 'Send Swap TX', description: 'Submit signed swap transactions to Solana with confirmation tracking' },
    ],
  },
  {
    name: 'LI.FI',
    type: 'Bridge/DEX Aggregator',
    launch: 'Feb 2026',
    chains: 'Multi-chain (30+ chains)',
    chainCount: 30,
    mcp: true,
    official: false,
    auth: 'API key',
    pricing: 'Freemium',
    status: 'Active',
    integration: ['Claude Code', 'Cursor', 'Claude Desktop', 'MCP', 'Community-built'],
    github: [{ label: 'demomagic/lifi-mcp-server', url: 'https://github.com/demomagic/lifi-mcp-server' }],
    skills: [
      { name: 'Cross-Chain Bridge', description: 'Bridge tokens across 30+ chains with optimal route selection and fee comparison' },
      { name: 'DEX Aggregation', description: 'Aggregate quotes from multiple DEXs for best swap execution across supported networks' },
      { name: 'Chain & Token Info', description: 'Query supported chains, tokens, connections, gas prices, and available bridging tools' },
      { name: 'Transaction Tracking', description: 'Monitor cross-chain transfer status, fee withdrawal management, and wallet operations' },
    ],
  },
  // ── Cross-Chain & Multi-Chain Toolkits ───────────────────
  {
    name: 'GOAT (Crossmint)',
    type: 'DEX Aggregator',
    skillCount: 200,
    launch: 'Feb 2026',
    chains: '30+ chains (EVM, Solana, Base)',
    chainCount: 30,
    mcp: true,
    official: true,
    auth: 'Wallet signing',
    pricing: 'Free',
    status: 'Active',
    integration: ['MCP', 'Claude Desktop', 'LangChain', 'Vercel AI SDK', 'Python', 'TypeScript'],
    github: [{ label: 'goat-sdk/goat', url: 'https://github.com/goat-sdk/goat' }],
    skills: [
      { name: 'On-Chain Actions (200+)', description: 'Unified library of 200+ on-chain actions: token transfers, swaps, staking, lending, NFT minting across 30+ chains' },
      { name: 'Multi-Wallet Support', description: 'Any wallet architecture — custodial, MPC, smart accounts — integrated via a single abstraction layer' },
      { name: 'Plugin System', description: 'Modular plugin architecture — install only the tools you need. Lightweight core with extensible action providers' },
      { name: 'Smart Contract Execution', description: 'Deploy contracts, call functions, read state — arbitrary on-chain interaction via agent commands' },
    ],
  },
  {
    name: 'Solana Agent Kit (SendAI)',
    type: 'L1 Ecosystem',
    skillCount: 60,
    launch: 'Feb 2026',
    chains: 'Solana',
    chainCount: 1,
    mcp: true,
    official: true,
    auth: 'Wallet signing',
    pricing: 'Free',
    status: 'Active',
    docs: 'https://kit.sendai.fun/',
    integration: ['MCP', 'Claude Desktop', 'LangChain', 'Vercel AI SDK', 'OpenAI', 'TypeScript'],
    github: [
      { label: 'sendaifun/solana-agent-kit', url: 'https://github.com/sendaifun/solana-agent-kit' },
      { label: 'sendaifun/solana-mcp', url: 'https://github.com/sendaifun/solana-mcp' },
    ],
    skills: [
      { name: 'Token Operations (20+)', description: 'Deploy SPL tokens, transfer, mint, burn, manage metadata, and interact with Token-2022 extensions' },
      { name: 'DeFi Actions', description: 'Swap via Jupiter, provide liquidity on Raydium/Orca, stake SOL, interact with lending protocols' },
      { name: 'NFT & Compressed NFTs', description: 'Mint NFTs, create collections, manage compressed NFTs on Metaplex Bubblegum' },
      { name: 'Cross-Chain (Wormhole)', description: 'Bridge assets between Solana and other chains via Wormhole integration' },
      { name: 'Blink & Actions', description: 'Create Solana Actions and Blinks for shareable transaction links and social integrations' },
    ],
  },
  {
    name: 'deBridge',
    type: 'Bridge/DEX Aggregator',
    launch: 'Feb 2026 (TRON integration Apr 17, 2026)',
    chains: '29+ chains (EVM + Solana + TRON)',
    chainCount: 30,
    mcp: true,
    official: true,
    auth: 'Wallet signing',
    pricing: 'Free',
    status: 'Active',
    integration: ['MCP', 'Claude', 'ChatGPT', 'Cursor', 'Gemini', 'TRON dev portal'],
    github: [{ label: 'debridge-finance/debridge-mcp', url: 'https://github.com/debridge-finance/debridge-mcp' }],
    skills: [
      { name: 'Cross-Chain Swap Routes', description: 'Find optimal cross-chain swap routes across 29+ blockchains with fee comparison and slippage estimation' },
      { name: 'Non-Custodial Execution', description: 'Execute trades without surrendering custody — agent handles routing, bridging, chain switching, and retries' },
      { name: 'Portfolio Rebalancing', description: 'AI-driven portfolio analysis: detect excessive exposure in specific networks and auto-rebalance across chains' },
      { name: '"Vibe Trading"', description: 'Describe desired outcome in natural language — agent handles routing, bridging, swapping, and execution across chains' },
    ],
  },
  // ── L1 Ecosystems ────────────────────────────────────────
  {
    name: 'BNB Chain',
    type: 'L1 Ecosystem',
    launch: 'Mar 2026',
    chains: 'BNB Chain (BSC)',
    chainCount: 1,
    mcp: true,
    official: true,
    auth: 'Wallet signing',
    pricing: 'Free',
    status: 'Active',
    integration: ['Cursor', 'Claude Desktop', 'OpenClaw', 'MCP', 'npx skills add'],
    github: [{ label: 'bnb-chain/bnbchain-skills', url: 'https://github.com/bnb-chain/bnbchain-skills' }],
    skills: [
      { name: 'On-Chain Data', description: 'Read blockchain data, query balances, transaction history, and contract state on BNB Chain' },
      { name: 'Transaction Execution', description: 'Execute real transactions on BSC mainnet and testnet via AI agent commands' },
      { name: 'Wallet Management', description: 'Create and manage wallets, sign transactions, and interact with dApps on BNB ecosystem' },
      { name: 'Agent Registry', description: 'Register and verify AI agents on-chain for trusted agent-to-agent and agent-to-protocol interactions' },
    ],
  },
  // ── DeFi Protocols ───────────────────────────────────────
  {
    name: 'Aave',
    type: 'Lending',
    launch: 'Mar 2026',
    chains: 'Base (+ 7 chains via Graph)',
    chainCount: 7,
    mcp: true,
    official: false,
    auth: 'Wallet signing',
    pricing: 'Free',
    status: 'Active',
    integration: ['MCP', 'Claude', 'LangChain', 'Community-built'],
    github: [{ label: 'Tairon-ai/aave-mcp', url: 'https://github.com/Tairon-ai/aave-mcp' }],
    skills: [
      { name: 'Stake & Lend', description: 'Aave V3 staking on Base: supply assets, earn yield, auto-fund from external wallets' },
      { name: 'Lending Data (14 tools)', description: 'Query V2/V3 lending pools, user positions, health factors, liquidation thresholds across 7 chains' },
      { name: 'Flash Loans', description: 'Flash loan data queries, governance proposals, and protocol analytics via The Graph' },
      { name: '1inch Integration', description: 'Integrated swap quotes via 1inch for optimal token routing before staking' },
    ],
  },
  {
    name: 'Arcadia Finance',
    type: 'Lending',
    launch: 'Mar 2026',
    chains: 'Base, Optimism',
    chainCount: 2,
    mcp: true,
    official: true,
    auth: 'Wallet signing',
    pricing: 'Free',
    status: 'Active',
    integration: ['MCP', 'Claude', 'Cursor'],
    github: [{ label: 'arcadia-finance/mcp-server', url: 'https://github.com/arcadia-finance/arcadia-finance-mcp-server' }],
    skills: [
      { name: 'LP Management', description: 'Manage Uniswap & Aerodrome concentrated liquidity positions with automated rebalancing and yield optimization' },
      { name: 'Leveraged LP', description: 'Open leveraged liquidity positions — borrow against LP collateral with smart contract accounts' },
      { name: 'Swap Routing', description: 'Optimal swap routing with Tenderly simulation for safe, pre-verified transactions' },
      { name: 'Unsigned TX Builder', description: 'Returns unsigned transactions as {to, data, value, chainId} — agent/app handles signing and broadcast' },
    ],
  },
  // ── Data & Analytics ─────────────────────────────────────
  {
    name: 'CoinGecko',
    type: 'Data',
    launch: 'Feb 2026',
    chains: '200+ networks (GeckoTerminal)',
    chainCount: 200,
    mcp: true,
    official: true,
    auth: 'API key',
    pricing: 'Freemium',
    status: 'Active',
    docs: 'https://docs.coingecko.com/docs/mcp-server',
    integration: ['MCP', 'Claude', 'Any MCP Client', 'npm', 'Hosted endpoint'],
    github: [{ label: 'coingecko/mcp', url: 'https://docs.coingecko.com/docs/mcp-server' }],
    skills: [
      { name: 'Market Data', description: 'Real-time prices, market cap, volume for 15,000+ coins with historical OHLCV charts' },
      { name: 'DEX Analytics', description: 'On-chain DEX price and liquidity data for 8M+ tokens via GeckoTerminal across 200+ networks' },
      { name: 'Trending & Discovery', description: 'Trending coins, top gainers/losers, and new token discovery with search and filtering' },
      { name: 'NFT Data', description: 'NFT collection floor prices, volumes, market cap, and trending collections' },
      { name: 'Market Insights (Apr 22, 2026)', description: 'AI-driven market commentary tool — narrative recap and key movers for any time window' },
      { name: 'Advanced Charts (Apr 22, 2026)', description: 'Programmatic OHLCV chart rendering for agents to embed in responses' },
      { name: 'Portfolio Insights (Apr 22, 2026)', description: 'Portfolio breakdown and performance attribution across tracked wallets' },
    ],
  },
  {
    name: 'CoinMarketCap',
    type: 'Data',
    skillCount: 12,
    launch: 'Mar 2026',
    chains: 'Multi-chain',
    chainCount: 100,
    mcp: true,
    official: true,
    auth: 'API key',
    pricing: 'Freemium',
    status: 'Active',
    integration: ['MCP', 'Claude Desktop', 'Cursor', 'ChatGPT', 'Gemini CLI'],
    github: [{ label: 'coinmarketcap/mcp', url: 'https://coinmarketcap.com/api/mcp/' }],
    skills: [
      { name: 'Market Quotes', description: 'Real-time and historical quotes, listings, and global market overview for thousands of assets' },
      { name: 'Technical Analysis', description: 'SMA/EMA, MACD, RSI, Fibonacci, pivot points — automated TA for any tracked asset' },
      { name: 'On-Chain Metrics', description: 'On-chain data, derivatives metrics, and token metadata (descriptions, logos, URLs)' },
      { name: 'Trending Narratives', description: 'Trending narratives, macro events, news aggregation, and semantic search across crypto concepts' },
    ],
  },
  {
    name: 'altFINS',
    type: 'Analytics',
    launch: 'Mar 11, 2026',
    chains: 'Multi-chain (2,000+ coins)',
    chainCount: 50,
    mcp: true,
    official: true,
    auth: 'API key',
    pricing: 'Paid',
    status: 'Active',
    integration: ['MCP', 'Claude Desktop', 'VS Code', 'Copilot Studio'],
    github: [{ label: 'altfins-com/mcp', url: 'https://github.com/altfins-com/' }],
    skills: [
      { name: 'Screening & Filtering', description: 'Filter by RSI, MACD, SMA, candlestick patterns, categories across 2,000+ coins' },
      { name: 'Trading Signals (130+)', description: '130+ standardized trading signals with entry/exit points and pattern recognition' },
      { name: 'Historical Price Data', description: 'OHLCV data from 15min to daily intervals, up to 7 years of history' },
      { name: 'Portfolio Analysis', description: 'Connected exchange/wallet holdings analysis with performance tracking' },
      { name: '150+ Indicators', description: 'Technical analysis with 150+ indicators, news aggregation, and calendar events' },
    ],
  },
  {
    name: 'Arkham Intelligence',
    type: 'Analytics',
    launch: 'Mar 2026',
    chains: '10+ blockchains',
    chainCount: 10,
    mcp: false,
    official: false,
    auth: 'API key',
    pricing: 'Freemium',
    status: 'Active',
    integration: ['Claude Code', 'SKILL.md', 'Community-built'],
    github: [{ label: 'Vyntral/arkham-intelligence-claude-skill', url: 'https://github.com/Vyntral/arkham-intelligence-claude-skill' }],
    skills: [
      { name: 'Whale Tracking', description: 'Track whale wallet movements, large transfers, and smart money position changes' },
      { name: 'Wallet Analysis', description: 'Deep wallet holdings analysis, historical activity, and entity identification' },
      { name: 'Token Flow Intelligence', description: 'Monitor token flows between exchanges, protocols, and whale wallets across 10+ chains' },
    ],
  },
  {
    name: 'CryptoRank',
    type: 'Data',
    launch: 'Mar 2026',
    chains: 'Multi-chain',
    chainCount: 50,
    mcp: true,
    official: true,
    auth: 'API key',
    pricing: 'Paid',
    status: 'Active',
    integration: ['MCP', 'Claude', 'PRO API'],
    github: [{ label: 'cryptorank/mcp', url: 'https://cryptorank.io/public-api/mcp' }],
    skills: [
      { name: 'Market Data', description: 'Real-time prices and historical data for 5,000+ crypto assets with market analytics' },
      { name: 'Funding Rounds', description: 'ICO, IDO, and private round data: fundraising history, valuations, and investor participation' },
      { name: 'Token Unlocks', description: 'Token unlock schedules, vesting timelines, and circulating supply impact projections' },
      { name: 'VC Intelligence', description: 'VC profiles, investment portfolios, funding activity tracking, and investor analytics' },
    ],
  },
  {
    name: 'DexPaprika',
    type: 'Data',
    launch: 'Mar 2026',
    chains: '20+ blockchains',
    chainCount: 20,
    mcp: true,
    official: true,
    auth: 'None',
    pricing: 'Free',
    status: 'Active',
    integration: ['MCP', 'Claude', 'Hosted MCP Server'],
    github: [{ label: 'coinpaprika/dexpaprika-mcp', url: 'https://github.com/coinpaprika/dexpaprika-mcp' }],
    skills: [
      { name: 'DEX Analytics', description: 'Token price movements, liquidity depth, fee structures, and volume comparisons across DEXs' },
      { name: 'Pool Analytics', description: 'Liquidity pool TVL tracking, historical changes, and cross-chain pool comparisons' },
      { name: 'Historical OHLCV', description: 'Historical price data with batched token pricing — no API key required' },
    ],
  },
  {
    name: 'Heurist Mesh',
    type: 'Analytics',
    skillCount: 30,
    launch: 'Mar 2026',
    chains: 'Multi-chain',
    chainCount: 20,
    mcp: true,
    official: true,
    auth: 'API key',
    pricing: 'Freemium',
    status: 'Active',
    integration: ['MCP', 'Claude', 'REST API', 'Open Source'],
    github: [{ label: 'heurist-network/heurist-mesh-mcp-server', url: 'https://github.com/heurist-network/heurist-mesh-mcp-server' }],
    skills: [
      { name: 'Smart Contract Audit', description: '30+ specialized AI agents for blockchain analysis, smart contract security assessment, and vulnerability detection' },
      { name: 'Token Metrics', description: 'Token information, trending coins, and asset prices via CoinGecko integration with AI-powered analysis' },
      { name: 'Twitter Intelligence', description: 'Track trending tokens via Twitter/X mentions, analyze account activity for crypto alpha signals' },
      { name: 'Token Security (GoPlus)', description: 'Contract risk checks via GoPlus: honeypot detection, mint functions, ownership privileges, trading restrictions' },
    ],
  },
  {
    name: 'Philidor',
    type: 'Analytics',
    launch: 'Mar 2026',
    chains: 'ETH, Base, Arb, OP, Polygon, Avalanche',
    chainCount: 6,
    mcp: true,
    official: true,
    auth: 'API key',
    pricing: 'Freemium',
    status: 'Active',
    integration: ['MCP', 'Claude', 'Natural Language'],
    github: [{ label: 'Philidor-Labs/philidor-mcp', url: 'https://github.com/Philidor-Labs/philidor-mcp' }],
    skills: [
      { name: 'Vault Risk Scoring (700+)', description: 'Risk analytics for 700+ DeFi vaults across Morpho, Aave, Yearn, Beefy, Spark, Fluid, Euler with 3-tier scoring' },
      { name: 'Multi-Vector Analysis', description: 'Three-vector risk assessment: Asset quality, Code maturity, and Governance structure — independent and unbiased' },
      { name: 'APR & TVL Tracking', description: 'Real-time APR, TVL, curator actions, and yield comparisons across all tracked vaults and protocols' },
      { name: 'Protocol Comparison', description: 'Compare risk scores across protocols via natural language — search, filter, and rank 700+ vaults instantly' },
    ],
  },
  // ── NFT ──────────────────────────────────────────────────
  {
    name: 'OpenSea',
    type: 'NFT',
    launch: 'Mar 2026',
    chains: 'ETH, Polygon, Solana, Base, + 16 more',
    chainCount: 20,
    mcp: true,
    official: true,
    auth: 'API key',
    pricing: 'Freemium',
    status: 'Active',
    integration: ['MCP', 'Claude', 'SSE Transport'],
    github: [{ label: 'ProjectOpenSea/opensea-mcp', url: 'https://github.com/ProjectOpenSea/opensea-mcp-next-sample' }],
    skills: [
      { name: 'Collection Data', description: 'Collection verification, rarity scores, floor prices, and volume analytics across 20+ chains' },
      { name: 'Wallet NFT Balances', description: 'NFT ownership patterns, portfolio evaluation across multiple wallets' },
      { name: 'Trading Activity', description: 'Live marketplace activity, trending collections, and swap quote generation' },
      { name: 'Token Discovery', description: 'NFT search, trending analytics, and new collection discovery across all supported chains' },
    ],
  },
  // ── NEW: April–May 2026 wave ─────────────────────────────
  {
    name: 'Morpho Agents',
    type: 'Lending',
    launch: 'Apr 8, 2026',
    chains: 'Ethereum, Base',
    chainCount: 2,
    mcp: true,
    official: true,
    auth: 'EIP-712',
    pricing: 'Free',
    status: 'Beta',
    docs: 'https://agents.morpho.org/',
    skillCount: 17,
    integration: ['MCP', 'Claude', 'Cursor', 'Codex', 'Windsurf', '30+ clients', 'CLI', 'npx skills add'],
    github: [
      { label: 'morpho-org/morpho-skills', url: 'https://github.com/morpho-org' },
      { label: 'Morpho blog', url: 'https://morpho.org/blog/introducing-morpho-agents-beta-interface-built-for-ai-agents/' },
    ],
    skills: [
      { name: 'User Agent', description: 'End-user lending agent: supply, borrow, repay, withdraw across all Morpho markets via natural language' },
      { name: 'Builder Agent', description: 'Protocol-builder agent: deploy markets, configure IRMs, manage curated vaults, run integration tests' },
      { name: 'Read Tools', description: 'Query markets, positions, health factors, available liquidity, IRM parameters, and curator actions across Ethereum + Base' },
      { name: 'Simulate Tools', description: 'Pre-execution simulation of every write op — preview borrow capacity, liquidation risk, expected APY before signing' },
      { name: 'Write Tools', description: 'Signed write operations: supply collateral, borrow/repay, withdraw, manage MetaMorpho vault allocations with EIP-712 signing' },
    ],
  },
  {
    name: 'Polygon Agent CLI',
    type: 'L1 Ecosystem',
    launch: 'Mar 5, 2026',
    chains: 'Polygon PoS, zkEVM, AggLayer',
    chainCount: 3,
    mcp: true,
    official: true,
    auth: 'Wallet signing',
    pricing: 'Free',
    status: 'Active',
    docs: 'https://polygon.technology/blog/polygon-launches-an-onchain-toolkit-built-for-the-agent-economy',
    integration: ['LangChain', 'CrewAI', 'Claude', 'MCP', 'CLI'],
    github: [{ label: '0xPolygon/polygon-agent-cli', url: 'https://github.com/0xPolygon/polygon-agent-cli' }],
    skills: [
      { name: 'Session Wallets', description: 'Disposable session-scoped wallets with per-action spending limits — agent never holds long-lived keys' },
      { name: 'Multi-Chain Balances', description: 'Read balances across Polygon PoS, zkEVM, and AggLayer-connected chains in a single query' },
      { name: 'Stablecoin Send', description: 'Send USDC/USDT with built-in slippage/gas estimation and AggLayer routing' },
      { name: 'Swaps', description: 'Token swaps via integrated DEX routing on Polygon ecosystem' },
      { name: 'Cross-Chain Bridge', description: 'AggLayer bridging between Polygon PoS, zkEVM, and connected chains' },
      { name: 'DeFi Access', description: 'Unified access to Polygon-deployed DeFi: lending, LP, staking via standardized tool surface' },
      { name: 'ERC-8004 Identity', description: 'On-chain agent identity registration and reputation accumulation per ERC-8004 spec' },
    ],
  },
  {
    name: 'Kite AI',
    type: 'Identity',
    launch: 'Apr 28, 2026',
    chains: 'Kite Chain (AI-native L1)',
    chainCount: 1,
    mcp: false,
    official: true,
    auth: 'Wallet signing',
    pricing: 'Per-call (x402)',
    status: 'Active',
    integration: ['Agent Passport SDK', 'x402-style stablecoin settlement', 'Avalanche subnet stack'],
    github: [{ label: 'Kite AI mainnet announcement', url: 'https://www.ethnews.com/avalanche-expands-ai-push-as-kite-mainnet-goes-live/' }],
    skills: [
      { name: 'Agent Passport', description: 'Cryptographic identity primitive for AI agents — verifiable identity, scoped permissions, revocable credentials' },
      { name: 'Spending Controls', description: 'Per-passport spending limits and budgets enforced on-chain before transaction settlement' },
      { name: 'Stablecoin Payment Rail', description: 'x402-style pay-per-call settlement in stablecoins, sub-cent fees for agent-to-agent commerce' },
      { name: 'L1 Settlement', description: 'AI-native L1 (Kite Chain) settling via Avalanche subnet stack — optimized for high-frequency agent micropayments' },
    ],
  },
  {
    name: 'Cryptopolitan MCP',
    type: 'Data',
    launch: 'Apr 21, 2026',
    chains: 'N/A (news data)',
    chainCount: 0,
    mcp: true,
    official: true,
    status: 'Active',
    docs: 'https://agent.cryptopolitan.com',
    integration: ['MCP', 'Claude', 'ChatGPT', 'Cursor', 'Perplexity', 'Any MCP-compliant agent'],
    github: [{ label: 'Cryptopolitan press release', url: 'https://natlawreview.com/press-releases/cryptopolitan-launches-first-mcp-server-crypto-media-opening-its-newsroom-ai' }],
    skills: [
      { name: 'Live News Feed', description: 'Query the live Cryptopolitan newsroom feed — first official crypto-media MCP server' },
      { name: 'Full-Text Search', description: 'Search across Cryptopolitan archive with semantic + keyword retrieval for any topic, ticker, or person' },
      { name: 'Category Browse', description: 'Browse articles by category (Markets, DeFi, NFTs, Regulation, Macro) for narrative tracking' },
      { name: 'Article by URL', description: 'Fetch full article content by URL — agents can cite primary sources in their analysis' },
    ],
  },
  {
    name: 'DefiLlama MCP',
    type: 'Data',
    launch: 'Mar 2026',
    chains: 'All DefiLlama-tracked (300+)',
    chainCount: 300,
    mcp: true,
    official: true,
    auth: 'API key',
    pricing: 'Paid',
    status: 'Active',
    docs: 'https://defillama.com/mcp',
    skillCount: 9,
    integration: ['MCP', 'Claude', 'Hosted endpoint', 'CLI', 'npx skills add'],
    github: [{ label: 'DefiLlama/defillama-skills', url: 'https://github.com/DefiLlama/defillama-skills' }],
    skills: [
      { name: 'defi-data', description: 'Query TVL, protocol fundamentals, chain TVL, and protocol-level metrics across the DefiLlama dataset' },
      { name: 'defi-market-overview', description: 'Macro DeFi overview: TVL by category, chain dominance, sector rotation snapshots' },
      { name: 'protocol-deep-dive', description: 'Per-protocol analytics: TVL history, revenue/fees, token holders, pool composition' },
      { name: 'token-research', description: 'Token-level research: prices, holders, liquidity venues, recent activity' },
      { name: 'chain-ecosystem', description: 'Chain-level ecosystem snapshot: top protocols, TVL trend, native asset stats' },
      { name: 'market-analysis', description: 'Cross-protocol comparisons and category-level analysis for thematic research' },
      { name: 'yield-strategies', description: 'Curated yield opportunities: stablecoin yields, LST yields, restaking, RWA, with risk tags' },
      { name: 'risk-assessment', description: 'Protocol risk signals: TVL volatility, governance changes, audit history, dependency tree' },
      { name: 'flows-and-events', description: 'Capital flows between protocols/chains and material protocol-level events' },
    ],
  },
  {
    name: 'Dune MCP',
    type: 'Analytics',
    launch: 'Mar 3, 2026',
    chains: 'All chains in Dune (50+)',
    chainCount: 50,
    mcp: true,
    official: true,
    auth: 'API key',
    pricing: 'Freemium',
    status: 'Active',
    docs: 'https://dune.com/blog/dune-mcp',
    skillCount: 12,
    integration: ['MCP', 'Claude', 'Cursor', 'ChatGPT', 'Codex', 'OpenCode'],
    github: [{ label: 'Dune MCP blog', url: 'https://dune.com/blog/dune-mcp' }],
    skills: [
      { name: 'getUsage', description: 'Inspect remaining Dune API credits and quota for the active key' },
      { name: 'listBlockchains', description: 'List every chain indexed in Dune with table-prefix metadata' },
      { name: 'Table Discovery', description: 'Discover tables/schemas across raw, decoded, and curated datasets per chain' },
      { name: 'DuneSQL Query Writing', description: 'Construct DuneSQL queries with column/type hints from the schema catalog' },
      { name: 'DuneSQL Execution', description: 'Execute DuneSQL queries against the engine and stream results back to the agent' },
      { name: 'Result Retrieval', description: 'Fetch query results in JSON/CSV with pagination and execution metadata' },
      { name: 'Visualization Generation', description: 'Generate Dune visualization specs (charts, counters, tables) from query results' },
      { name: 'Saved Query Lookup', description: 'Find, fork, and re-run saved community queries — bypass writing from scratch' },
      { name: 'Schema Hints', description: 'Per-table column hints with sample values to guide query construction' },
      { name: 'Spellbook Discovery', description: 'Explore Spellbook (community-curated) tables for higher-level abstractions' },
      { name: 'Query Optimization', description: 'Suggest query rewrites to reduce execution time / credit burn' },
      { name: 'Result Export', description: 'Export query results in formats compatible with downstream tools (CSV, JSON, Parquet)' },
    ],
  },
  {
    name: 'Alchemy MCP',
    type: 'Infra',
    launch: 'Mar 28, 2026',
    chains: '100+ chains (EVM + Solana + Starknet)',
    chainCount: 100,
    mcp: true,
    official: true,
    auth: 'OAuth',
    pricing: 'Freemium',
    status: 'Beta',
    docs: 'https://www.alchemy.com/docs/alchemy-mcp-server',
    skillCount: 159,
    integration: ['MCP', 'Claude', 'Hosted endpoint', 'Self-host', 'OAuth'],
    github: [{ label: 'alchemyplatform/alchemy-mcp-server', url: 'https://github.com/alchemyplatform/alchemy-mcp-server' }],
    skills: [
      { name: 'Token Prices', description: 'Token-level prices across 100+ chains with historical OHLCV — Ethereum, Base, Polygon, Arbitrum, Optimism, Solana, Starknet, zkSync, Scroll, Linea, Mantle, Blast' },
      { name: 'NFT Metadata', description: 'NFT collection + token-level metadata, ownership, transfers, rarity across all supported chains' },
      { name: 'Transaction History', description: 'Per-address transaction history with decoded calls, internal txns, and asset transfers' },
      { name: 'Contract Simulation', description: 'Pre-flight transaction simulation: balance changes, gas estimate, revert reason — before signing' },
      { name: 'Transaction Tracing', description: 'Full execution trace of any tx — every call, return, log, state change — for debugging or analysis' },
      { name: 'Account Abstraction', description: 'ERC-4337 bundler ops: build/send UserOps, sponsor gas via Paymaster, manage smart accounts' },
      { name: 'Solana DAS', description: 'Digital Asset Standard read API for Solana NFTs, fungible tokens, and inscriptions' },
      { name: 'Webhooks', description: 'Subscribe to address activity, mined transactions, dropped txns — agents react to on-chain events' },
      { name: 'Gas Manager', description: 'Sponsored transactions via Paymaster policy rules per dApp/agent' },
      { name: 'Smart Wallets', description: 'Deploy and manage Alchemy Smart Wallets with session keys, passkeys, and policy engines' },
    ],
  },
  {
    name: 'TronScan MCP',
    type: 'Analytics',
    launch: 'Mar 9, 2026',
    chains: 'TRON',
    chainCount: 1,
    mcp: true,
    official: true,
    auth: 'API key',
    pricing: 'Freemium',
    status: 'Active',
    docs: 'https://mcpdoc.tronscan.org/en/mcp',
    skillCount: 105,
    integration: ['MCP', 'Claude', 'Hosted endpoint'],
    github: [{ label: 'TronScan MCP docs', url: 'https://mcpdoc.tronscan.org/en/mcp' }],
    skills: [
      { name: 'Blocks (10+ tools)', description: 'Block lookup by number/hash, latest block, block transactions, block events on TRON' },
      { name: 'Accounts (15+ tools)', description: 'Account details, balances (TRX + TRC-20/TRC-10), resource bandwidth, energy, votes, witnesses' },
      { name: 'Contracts (15+ tools)', description: 'Smart contract metadata, source code, ABI, events, internal txns, energy/bandwidth consumption' },
      { name: 'Transactions (15+ tools)', description: 'TX lookup, decoded events, internal transfers, receipt status, fee breakdown' },
      { name: 'Tokens (15+ tools)', description: 'TRC-20/TRC-10/TRC-721 metadata, transfers, holders, liquidity, top-holders distribution' },
      { name: 'Witnesses', description: 'Super Representative (witness) data: votes, blocks produced, productivity, rewards' },
      { name: 'Wallets', description: 'Multi-address wallet aggregation and portfolio snapshots' },
      { name: 'Statistics', description: 'Network-level stats: TPS, active addresses, total accounts, energy/bandwidth usage trends' },
      { name: 'Deep Analysis', description: 'Address relationship graphs, contract interaction patterns, and forensic-style flow tracing' },
    ],
  },
  {
    name: 'BitGo MCP',
    type: 'Custody',
    launch: 'Mar 23, 2026',
    chains: 'All BitGo-supported chains',
    chainCount: 50,
    mcp: true,
    official: true,
    pricing: 'Free',
    status: 'Active',
    docs: 'https://www.businesswire.com/news/home/20260323339524/en/BitGo-Launches-MCP-Server-Bringing-Institutional-Grade-Crypto-Infrastructure-to-AI-Agents',
    integration: ['Claude Code', 'Claude Desktop', 'Cursor', 'ChatGPT', 'JetBrains', 'VS Code', 'Windsurf'],
    github: [{ label: 'BitGo MCP launch', url: 'https://news.bitcoin.com/bitgo-launches-mcp-server-to-power-ai-driven-crypto-development-tools/' }],
    skills: [
      { name: 'Documentation Search', description: 'Search across BitGo Developer Portal — institutional custody, wallet APIs, SDKs, integration guides' },
      { name: 'API Reference Retrieval', description: 'Fetch BitGo API reference snippets with parameter schemas and example requests' },
      { name: 'Setup Guidance', description: 'Step-by-step setup walkthroughs for BitGo Wallet Platform, GUS, and Go Network' },
      { name: 'Product Info', description: 'Up-to-date product info on BitGo Trust, Prime, Stablecoin Studio, and custody offerings' },
    ],
  },
  {
    name: 'GoPlus Security',
    type: 'Security',
    launch: 'Mar 27, 2026',
    chains: '40+ chains',
    chainCount: 40,
    mcp: true,
    official: true,
    auth: 'x402',
    pricing: 'Per-call (x402)',
    status: 'Active',
    integration: ['MCP', 'x402 micropayments', 'No API key required'],
    github: [{ label: 'GoPlusSecurity/goplus-mcp', url: 'https://github.com/GoPlusSecurity/goplus-mcp' }],
    skills: [
      { name: 'Malicious Address Detection', description: 'Flag addresses tied to phishing, mixers, sanctions, exploits across 40+ chains' },
      { name: 'Token Security Checks', description: 'Detect honeypots, mintable supply, freeze functions, owner privileges, blacklist functions on any token' },
      { name: 'Transaction Simulation', description: 'Pre-execution simulation to surface unexpected balance changes, approvals, and ownership transfers' },
      { name: 'Rug-Pull Risk Analysis', description: 'Token risk scoring: liquidity locks, dev wallet concentration, holder distribution, recent suspicious activity' },
      { name: 'NFT Security', description: 'NFT contract checks: privileged mint, transferability restrictions, royalty manipulation' },
      { name: 'dApp Security', description: 'Phishing/safe-browsing checks for dApp URLs and signature requests' },
      { name: 'Approval Risk', description: 'Identify risky ERC-20/ERC-721 approvals and recommend revocations' },
    ],
  },
  {
    name: 'Pendle MCP',
    type: 'DEX Aggregator',
    launch: 'Apr 13, 2026',
    chains: 'Pendle-supported (ETH, Arb, Base, BNB, OP, Mantle)',
    chainCount: 6,
    mcp: true,
    official: false,
    pricing: 'Free',
    status: 'Beta',
    docs: 'https://pendle.mcp.junct.dev/',
    skillCount: 32,
    integration: ['Cursor', 'Windsurf', 'Claude Desktop', 'Auto-generated wrapper', 'Community-built (junct.dev)'],
    github: [{ label: 'pendle.mcp.junct.dev', url: 'https://pendle.mcp.junct.dev/' }],
    skills: [
      { name: 'PT/YT Discovery', description: 'List Principal Tokens (PT) and Yield Tokens (YT) across all Pendle markets with maturity, APY, and implied yield' },
      { name: 'Market Snapshots', description: 'Per-market liquidity, TVL, swap fees, and underlying SY composition' },
      { name: 'Yield Strategies', description: 'Discover fixed-yield (PT), leveraged yield (YT), and LP strategies with expected APY ranges' },
      { name: 'Swap Routing', description: 'Build PT/YT swap routes with price impact and slippage estimates' },
      { name: 'Historical APY', description: 'Implied APY and underlying APY history for any Pendle market' },
      { name: '32 Auto-Generated Tools', description: 'Full coverage of Pendle public API surface, wrapped as MCP tools by junct.dev (third-party, not endorsed by Pendle)' },
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
    case 'market_data': return /market data|price|candlestick|ranking|ticker|order book|signal|ohlc|quote|trending|indicator|technical analysis/.test(text);
    case 'trading': return /trade|swap|execution|order|oco|otoco|routing|launch token|perp|futures|margin|leverage/.test(text);
    case 'onchain': return /on-chain|address|token info|smart money|transfer|transaction stat|whale|flow|block|gas price/.test(text);
    case 'risk': return /risk|audit|security|contract.*check|mint|freeze|vulnerability|hallucination guard|health factor|liquidat/.test(text);
    case 'wallet': return /wallet|balance|payment|x402|spending|fund|portfolio|holdings|signing/.test(text);
    case 'defi': return /liquidity|pool|lp|yield|hook|deploy|dex|lend|stake|farming|flash loan|apr|apy/.test(text);
    case 'social': return /farcaster|social|cast|message|feed|dm|square post|community/.test(text);
    case 'identity': return /identity|erc-8004|ens|siwa|sign-in|nft.*identity|trust score|verification|rarity/.test(text);
    default: return false;
  }
}

function capabilityScore(platform: Platform): number {
  return CATEGORIES.filter(c => hasCapability(platform, c.key)).length;
}

const TOTAL_SKILLS = PLATFORMS.reduce((a, p) => a + (p.skillCount ?? p.skills.length), 0);
const MCP_COUNT = PLATFORMS.filter(p => p.mcp).length;
const OFFICIAL_COUNT = PLATFORMS.filter(p => p.official !== false).length;

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
              {PLATFORMS.length} platforms with AI agent infrastructure (Feb 2026 – May 2026). Tap any row to inspect skills, auth, pricing, and source.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary stats - terminal style */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
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
            <div className="text-[9px] text-amber-400/60">{'>'} OFFICIAL_SRC</div>
            <div className="text-lg font-bold text-amber-400">{OFFICIAL_COUNT}/{PLATFORMS.length}</div>
          </div>
          <div className="border border-amber-500/30 bg-black/60 px-3 py-2 font-mono">
            <div className="text-[9px] text-amber-400/60">{'>'} LAUNCH_WINDOW</div>
            <div className="text-lg font-bold text-amber-400">Feb–May 2026</div>
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
                              p.type === 'CEX' || p.type === 'CEX/Multi-Asset'
                                ? 'bg-orange-500/15 text-orange-400'
                                : p.type === 'Data' || p.type === 'Analytics'
                                ? 'bg-blue-500/15 text-blue-400'
                                : p.type === 'NFT'
                                ? 'bg-purple-500/15 text-purple-400'
                                : p.type === 'Lending'
                                ? 'bg-cyan-500/15 text-cyan-400'
                                : p.type === 'Perp DEX'
                                ? 'bg-red-500/15 text-red-400'
                                : p.type === 'Wallet'
                                ? 'bg-yellow-500/15 text-yellow-400'
                                : p.type === 'Security'
                                ? 'bg-rose-500/15 text-rose-400'
                                : p.type === 'Custody'
                                ? 'bg-slate-500/15 text-slate-300'
                                : p.type === 'Infra'
                                ? 'bg-indigo-500/15 text-indigo-400'
                                : p.type === 'Identity'
                                ? 'bg-fuchsia-500/15 text-fuchsia-400'
                                : 'bg-green-500/15 text-green-400'
                            }`}
                          >
                            {p.type}
                          </Badge>
                          {p.official === false && (
                            <Badge
                              variant="outline"
                              className="text-[8px] px-1 py-0 font-mono border-0 bg-amber-500/10 text-amber-400/80"
                              title="Community-built — not endorsed by the protocol team"
                            >
                              COMMUNITY
                            </Badge>
                          )}
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
                          {p.skillCount ?? p.skills.length}
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
                            {/* Metadata chips row */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                                <span className="text-amber-400/60">LAUNCH</span> {p.launch}
                              </span>
                              {p.status && (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${
                                  p.status === 'Active' ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                  : p.status === 'Beta' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                  : p.status === 'Alpha' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                  : 'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}>
                                  <span className="opacity-60">STATUS</span> {p.status}
                                </span>
                              )}
                              {p.auth && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
                                  <span className="opacity-60">AUTH</span> {p.auth}
                                </span>
                              )}
                              {p.pricing && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                                  <span className="opacity-60">PRICING</span> {p.pricing}
                                </span>
                              )}
                              <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${
                                p.official === false
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                              }`}>
                                <span className="opacity-60">SOURCE</span> {p.official === false ? 'Community' : 'Official'}
                              </span>
                              {p.docs && (
                                <a
                                  href={p.docs}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-white/80 hover:bg-white/[0.08] transition-colors"
                                >
                                  <span className="opacity-60">DOCS</span> ↗
                                </a>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mb-2">
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
            Sources: Official docs, GitHub repos, press releases (Feb 2026 – May 2026) · DeFi Mexico
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
