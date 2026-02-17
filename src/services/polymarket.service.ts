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

const BASE_URL = '/api/polymarket-data';
const GAMMA_URL = '/api/polymarket-gamma';

export interface MarketInfo {
  conditionId: string;
  question: string;
  slug: string;
  volume: number;
  outcomePrices: string[];
  outcomes: string[];
  image: string;
  endDate: string;
}

export interface SubMarket {
  conditionId: string;
  question: string;
  slug: string;
  groupItemTitle: string;
  volume: number;
  yesPrice: number;
  active: boolean;
  closed: boolean;
  clobTokenId: string;
}

export interface PricePoint {
  t: number;
  p: number;
}

export interface OutcomePriceHistory {
  label: string;
  history: PricePoint[];
}

export interface EventInfo {
  title: string;
  slug: string;
  image: string;
  volume: number;
  volume24hr: number;
  liquidity: number;
  endDate: string;
  markets: SubMarket[];
}

export interface MarketHolder {
  address: string;
  pseudonym: string;
  amount: number;
  outcome: string;
}

const DEFAULT_AGENTS: PolymarketAgent[] = [];

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

  parseMarketUrl(url: string): string | null {
    try {
      const u = new URL(url);
      if (!u.hostname.includes('polymarket.com')) return null;
      // URL formats:
      // /event/slug-name OR /event/slug-name/sub-market-slug
      // /es/event/slug-name (with locale prefix)
      const parts = u.pathname.split('/').filter(Boolean);
      // Find the 'event' segment (could be at index 0 or after a locale like /es/)
      const eventIdx = parts.indexOf('event');
      if (eventIdx !== -1 && parts.length > eventIdx + 1) {
        return parts[parts.length - 1]; // last segment is the market slug
      }
      return null;
    } catch {
      return null;
    }
  },

  parseEventSlug(url: string): string | null {
    try {
      const u = new URL(url);
      if (!u.hostname.includes('polymarket.com')) return null;
      const parts = u.pathname.split('/').filter(Boolean);
      const eventIdx = parts.indexOf('event');
      if (eventIdx !== -1 && parts.length > eventIdx + 1) {
        return parts[eventIdx + 1]; // event slug is always right after 'event'
      }
      return null;
    } catch {
      return null;
    }
  },

  async getMarketBySlug(slug: string): Promise<MarketInfo | null> {
    try {
      const res = await fetch(`${GAMMA_URL}/markets?slug=${slug}&limit=1`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        // Try as event slug
        const eventRes = await fetch(`${GAMMA_URL}/events?slug=${slug}&limit=1`);
        const eventData = await eventRes.json();
        if (Array.isArray(eventData) && eventData.length > 0) {
          const markets = eventData[0].markets || [];
          if (markets.length > 0) {
            const m = markets[0];
            return {
              conditionId: m.conditionId || '',
              question: m.question || eventData[0].title || '',
              slug: m.slug || slug,
              volume: parseFloat(m.volume) || 0,
              outcomePrices: JSON.parse(m.outcomePrices || '[]'),
              outcomes: JSON.parse(m.outcomes || '[]'),
              image: m.image || eventData[0].image || '',
              endDate: m.endDate || '',
            };
          }
        }
        return null;
      }
      const m = data[0];
      return {
        conditionId: m.conditionId || '',
        question: m.question || '',
        slug: m.slug || slug,
        volume: parseFloat(m.volume) || 0,
        outcomePrices: JSON.parse(m.outcomePrices || '[]'),
        outcomes: JSON.parse(m.outcomes || '[]'),
        image: m.image || '',
        endDate: m.endDate || '',
      };
    } catch {
      return null;
    }
  },

  async getEventBySlug(slug: string): Promise<EventInfo | null> {
    try {
      const res = await fetch(`${GAMMA_URL}/events?slug=${slug}&limit=1`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return null;
      const event = data[0];
      const rawMarkets = event.markets || [];
      const markets: SubMarket[] = rawMarkets.map((m: any) => {
        const prices = JSON.parse(m.outcomePrices || '[]');
        const tokenIds = JSON.parse(m.clobTokenIds || '[]');
        return {
          conditionId: m.conditionId || '',
          question: m.question || '',
          slug: m.slug || '',
          groupItemTitle: m.groupItemTitle || m.question || '',
          volume: parseFloat(m.volume) || 0,
          yesPrice: parseFloat(prices[0]) || 0,
          active: m.acceptingOrders ?? m.active ?? false,
          closed: m.closed ?? false,
          clobTokenId: tokenIds[0] || '',
        };
      });
      return {
        title: event.title || '',
        slug: event.slug || slug,
        image: event.image || '',
        volume: event.volume || 0,
        volume24hr: event.volume24hr || 0,
        liquidity: event.liquidity || 0,
        endDate: event.endDate || '',
        markets,
      };
    } catch {
      return null;
    }
  },

  async getMarketHolders(conditionId: string): Promise<MarketHolder[]> {
    try {
      const res = await fetch(`${BASE_URL}/holders?market=${conditionId}&limit=100`);
      const data = await res.json();
      if (!Array.isArray(data)) return [];

      const holders: MarketHolder[] = [];
      for (const group of data) {
        const outcomeIndex = group.holders?.[0]?.outcomeIndex ?? 0;
        const outcome = outcomeIndex === 0 ? 'Yes' : 'No';
        for (const h of group.holders || []) {
          holders.push({
            address: h.proxyWallet || '',
            pseudonym: h.pseudonym || h.name || '',
            amount: parseFloat(h.amount) || 0,
            outcome,
          });
        }
      }

      // Sort by amount descending
      holders.sort((a, b) => b.amount - a.amount);
      return holders;
    } catch {
      return [];
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

  async getEventPriceHistory(markets: SubMarket[], maxOutcomes = 6): Promise<OutcomePriceHistory[]> {
    const CLOB_URL = '/api/polymarket-clob';
    // Pick top outcomes by current price, only active ones with tokens
    const topMarkets = markets
      .filter(m => m.clobTokenId)
      .sort((a, b) => b.yesPrice - a.yesPrice)
      .slice(0, maxOutcomes);

    const results = await Promise.all(
      topMarkets.map(async (m) => {
        try {
          const res = await fetch(
            `${CLOB_URL}/prices-history?market=${m.clobTokenId}&interval=all&fidelity=60`
          );
          const data = await res.json();
          const history: PricePoint[] = (data.history || []).map((h: any) => ({
            t: h.t,
            p: h.p,
          }));
          return { label: m.groupItemTitle, history };
        } catch {
          return { label: m.groupItemTitle, history: [] };
        }
      })
    );

    return results.filter(r => r.history.length > 0);
  },
};
