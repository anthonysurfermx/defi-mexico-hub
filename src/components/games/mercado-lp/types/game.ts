export interface Token {
  id: string;
  name: string;
  symbol: string;
  emoji: string;
  color: string;
  isBaseToken: boolean;
}

export interface Pool {
  id: string;
  tokenA: Token;
  tokenB: Token;
  reserveA: number;
  reserveB: number;
  baseFeeBps: number;
  hook?: PoolHook;
  totalFeesCollected: { tokenA: number; tokenB: number };
  createdBy: string;
}

export interface PoolHook {
  id: string;
  name: string;
  type: 'dynamic_fee' | 'anti_mev' | 'oracle' | 'custom';
  description: string;
  feeRangeBps?: [number, number];
  icon?: string;
}

export interface LPPosition {
  poolId: string;
  sharePercent: number;
  initialReserveA: number;
  initialReserveB: number;
  feesEarned: { tokenA: number; tokenB: number };
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  level: number;
  completed: boolean;
  xpReward: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

export interface NPCTrader {
  id: string;
  name: string;
  avatar: string;
  personality: 'comprador' | 'vendedor' | 'especulador' | 'casual';
  preferredTokens: string[];
  catchphrase: string;
  lastTradeTime: number;
}

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  effect: 'volume_boost' | 'volume_drop' | 'price_volatility' | 'token_hype';
  affectedTokens: string[];
  multiplier: number;
  duration: number;
  startTime: number;
  icon: string;
}

export interface TutorialTip {
  id: string;
  trigger: string;
  character: string;
  message: string;
  position: 'top' | 'bottom';
  shown: boolean;
}

export interface PlayerLevel {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  icon: string;
  perks: string[];
}

export interface PlayerStats {
  totalSwapVolume: number;
  profitableSwaps: number;
  totalLPProvided: number;
  tokensCreated: number;
  auctionBidsPlaced: number;
  auctionTokensWon: number;
}

export interface PlayerState {
  inventory: Record<string, number>;
  lpPositions: LPPosition[];
  xp: number;
  level: number;
  reputation: number;
  completedChallenges: string[];
  badges: Badge[];
  tutorialProgress: Record<string, boolean>;
  swapCount: number;
  totalFeesEarned: number;
  stats: PlayerStats;
  lastPlayedDate?: string;
  currentStreak: number;
  bestStreak: number;
}

export interface NPCActivity {
  id: string;
  npcId: string;
  action: string;
  timestamp: number;
  poolId?: string;
  tokenIn?: string;
  tokenOut?: string;
  amount?: number;
}

export type GameLevel = 1 | 2 | 3 | 4;

export interface AuctionBlock {
  id: string;
  blockNumber: number;
  tokensAvailable: number;
  currentPrice: number;
  minPrice: number;
  bids: AuctionBid[];
  executed: boolean;
}

export interface AuctionBid {
  id: string;
  bidderId: string;
  bidderName: string;
  maxPrice: number;
  totalSpend: number;
  tokensWon?: number;
  averagePrice?: number;
}

export interface Auction {
  id: string;
  tokenOffered: Token;
  totalSupply: number;
  blocksCount: number;
  tokensPerBlock: number;
  blocks: AuctionBlock[];
  currentBlock: number;
  startPrice: number;
  active: boolean;
  createdBy: string;
}
