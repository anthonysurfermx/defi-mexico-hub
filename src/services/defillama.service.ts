// src/services/defillama.service.ts

export interface AIAgentProtocol {
  name: string;
  slug: string;
  tvl: number;
  mcap: number;
  change_1d: number | null;
  change_7d: number | null;
  chains: string[];
  url: string;
  twitter: string;
  symbol: string;
  fees24h: number;
  fees7d: number;
  fees30d: number;
  feesAllTime: number;
}

const CACHE_KEY = 'defillama_ai_agents';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface CachedData {
  data: AIAgentProtocol[];
  timestamp: number;
}

function getCached(): AIAgentProtocol[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedData = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

function setCache(data: AIAgentProtocol[]): void {
  try {
    const cached: CachedData = { data, timestamp: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // sessionStorage full or unavailable
  }
}

export const defillamaService = {
  async getAIAgentProtocols(): Promise<AIAgentProtocol[]> {
    const cached = getCached();
    if (cached) return cached;

    const [protocolsRes, feesRes] = await Promise.all([
      fetch('https://api.llama.fi/protocols'),
      fetch('https://api.llama.fi/overview/fees'),
    ]);

    if (!protocolsRes.ok || !feesRes.ok) {
      throw new Error('Failed to fetch DefiLlama data');
    }

    const protocols = await protocolsRes.json();
    const feesData = await feesRes.json();

    // Filter AI Agents category
    const aiProtocols = protocols.filter(
      (p: any) => p.category === 'AI Agents'
    );

    // Build fees lookup by name (lowercase)
    const feesLookup = new Map<string, any>();
    for (const fp of feesData.protocols || []) {
      feesLookup.set(fp.name.toLowerCase(), fp);
    }

    // Merge protocols with fees data
    const merged: AIAgentProtocol[] = aiProtocols.map((p: any) => {
      const fees = feesLookup.get(p.name.toLowerCase());
      return {
        name: p.name || '',
        slug: p.slug || '',
        tvl: p.tvl || 0,
        mcap: p.mcap || 0,
        change_1d: p.change_1d ?? null,
        change_7d: p.change_7d ?? null,
        chains: p.chains || [],
        url: p.url || '',
        twitter: p.twitter || '',
        symbol: p.symbol || '',
        fees24h: fees?.total24h || 0,
        fees7d: fees?.total7d || 0,
        fees30d: fees?.total30d || 0,
        feesAllTime: fees?.totalAllTime || 0,
      };
    });

    // Sort by TVL descending
    merged.sort((a, b) => b.tvl - a.tvl);

    setCache(merged);
    return merged;
  },
};
