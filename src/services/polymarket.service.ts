export interface PolymarketAgent {
  address: string;
  name: string;
  description?: string;
  isVerified?: boolean;
  tags?: string[];
}

export interface AgentMetrics {
  address: string;
  positionsValue: number;
  portfolioValue: number;
  profitPnL: number | null;
  volumeTraded: number;
  openPositions: number;
  lastActive: string | null;
  lastTradeTitle: string | null;
  pseudonym: string | null;
}

export interface PolymarketPosition {
  title: string;
  outcome: string;
  size: number;
  avgPrice: number;
  curPrice: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  slug: string;
}

const BASE_URL = 'https://data-api.polymarket.com';

const DEFAULT_AGENTS: PolymarketAgent[] = [
  {
    address: '0x6031b6eed1c97e853c6e0f03ad3ce3529351f96d',
    name: 'gabagool22',
    description: 'Confirmed arbitrage bot. 27K+ trades, $142M volume. Exploits crypto 15-min mispricings.',
    isVerified: true,
    tags: ['Bot', 'Arbitrage']
  },
  {
    address: '0x777d9f00c2b4f7b829c9de0049ca3e707db05143',
    name: 'CarlosMC',
    description: 'Sports & politics markets',
    tags: ['Human', 'Active']
  },
  {
    address: '0x56687bf447db6ffa42ffe2204a05edaa20f55839',
    name: 'Theo4',
    description: 'French whale. $48M+ profit from 2024 US election bets using quantitative polling.',
    tags: ['Whale']
  }
];

const STORAGE_KEY = 'polymarket_agent_registry';

export const polymarketService = {
  getAgents(): PolymarketAgent[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const customAgents = stored ? JSON.parse(stored) : [];
      const allAgents = [...DEFAULT_AGENTS];

      customAgents.forEach((ca: PolymarketAgent) => {
        if (!allAgents.find(a => a.address.toLowerCase() === ca.address.toLowerCase())) {
          allAgents.push(ca);
        }
      });

      return allAgents;
    } catch {
      return DEFAULT_AGENTS;
    }
  },

  addAgent(agent: PolymarketAgent): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    const customAgents = stored ? JSON.parse(stored) : [];

    if (!customAgents.find((a: PolymarketAgent) => a.address.toLowerCase() === agent.address.toLowerCase())) {
      customAgents.push(agent);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customAgents));
    }
  },

  removeAgent(address: string): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const customAgents = JSON.parse(stored);
    const filtered = customAgents.filter(
      (a: PolymarketAgent) => a.address.toLowerCase() !== address.toLowerCase()
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  async getAgentMetrics(address: string): Promise<AgentMetrics> {
    try {
      const [positionsRes, tradesRes, valueRes] = await Promise.all([
        fetch(`${BASE_URL}/positions?user=${address}&limit=500&sortBy=CURRENT&sortDirection=DESC`),
        fetch(`${BASE_URL}/trades?user=${address}&limit=100`),
        fetch(`${BASE_URL}/value?user=${address}`),
      ]);

      const positionsData = await positionsRes.json();
      const tradesData = await tradesRes.json();
      const valueData = await valueRes.json();

      let positionsValue = 0;
      let totalPnl = 0;
      let openPositions = 0;

      if (Array.isArray(positionsData)) {
        openPositions = positionsData.length;
        positionsValue = positionsData.reduce((acc: number, p: any) => {
          return acc + (parseFloat(p.currentValue) || 0);
        }, 0);
        totalPnl = positionsData.reduce((acc: number, p: any) => {
          return acc + (parseFloat(p.cashPnl) || 0);
        }, 0);
      }

      let portfolioValue = 0;
      if (Array.isArray(valueData) && valueData.length > 0) {
        portfolioValue = valueData[0].value || 0;
      }

      let volume = 0;
      let lastActive: string | null = null;
      let lastTradeTitle: string | null = null;
      let pseudonym: string | null = null;

      if (Array.isArray(tradesData) && tradesData.length > 0) {
        const firstTrade = tradesData[0];
        lastActive = new Date(firstTrade.timestamp * 1000).toISOString();
        lastTradeTitle = firstTrade.title || null;
        pseudonym = firstTrade.pseudonym || firstTrade.name || null;

        volume = tradesData.reduce((acc: number, t: any) => {
          return acc + (parseFloat(t.size) * parseFloat(t.price));
        }, 0);
      }

      return {
        address,
        positionsValue,
        portfolioValue,
        profitPnL: totalPnl || null,
        volumeTraded: volume,
        openPositions,
        lastActive,
        lastTradeTitle,
        pseudonym,
      };
    } catch (error) {
      console.error(`Error fetching metrics for ${address}`, error);
      return {
        address,
        positionsValue: 0,
        portfolioValue: 0,
        profitPnL: null,
        volumeTraded: 0,
        openPositions: 0,
        lastActive: null,
        lastTradeTitle: null,
        pseudonym: null,
      };
    }
  },

  async getAgentPositions(address: string): Promise<PolymarketPosition[]> {
    try {
      const res = await fetch(
        `${BASE_URL}/positions?user=${address}&limit=50&sortBy=CURRENT&sortDirection=DESC`
      );
      const data = await res.json();

      if (!Array.isArray(data)) return [];

      return data.map((p: any) => ({
        title: p.title || '',
        outcome: p.outcome || '',
        size: parseFloat(p.size) || 0,
        avgPrice: parseFloat(p.avgPrice) || 0,
        curPrice: parseFloat(p.curPrice) || 0,
        currentValue: parseFloat(p.currentValue) || 0,
        cashPnl: parseFloat(p.cashPnl) || 0,
        percentPnl: parseFloat(p.percentPnl) || 0,
        slug: p.slug || '',
      }));
    } catch {
      return [];
    }
  },
};
