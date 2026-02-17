const BASE_URL = 'https://data-api.polymarket.com';

export interface BotSignals {
  intervalRegularity: number;   // S1: 0-100
  splitMergeRatio: number;      // S2: 0-100
  sizingConsistency: number;    // S3: 0-100
  activity24h: number;          // S4: 0-100
  winRateExtreme: number;       // S5: 0-100
  marketConcentration: number;  // S6: 0-100
  bothSidesBonus: number;       // Bonus modifier
}

export interface BotDetectionResult {
  address: string;
  botScore: number;             // 0-100 final score
  signals: BotSignals;
  classification: 'bot' | 'likely-bot' | 'mixed' | 'human';
  tradeCount: number;
  mergeCount: number;
  activeHours: number;
  bothSidesPercent: number;
}

const WEIGHTS = {
  intervalRegularity: 0.20,
  splitMergeRatio: 0.25,
  sizingConsistency: 0.15,
  activity24h: 0.15,
  winRateExtreme: 0.15,
  marketConcentration: 0.10,
};

function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 1;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 1;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

function scoreFromCV(cv: number, inverted: boolean): number {
  // inverted=true means low CV = high score (regular = bot)
  if (inverted) {
    if (cv < 0.3) return 90 + (0.3 - cv) / 0.3 * 10;
    if (cv < 0.7) return 40 + (0.7 - cv) / 0.4 * 50;
    return Math.max(0, 20 - (cv - 0.7) * 20);
  }
  return cv < 0.3 ? 90 : cv < 0.7 ? 50 : 10;
}

export async function detectBot(address: string): Promise<BotDetectionResult> {
  const [tradesData, mergeData, positionsData] = await Promise.all([
    fetchJSON(`${BASE_URL}/trades?user=${address}&limit=500`),
    fetchJSON(`${BASE_URL}/activity?user=${address}&type=MERGE&limit=500`),
    fetchJSON(`${BASE_URL}/positions?user=${address}&limit=200`),
  ]);

  const trades: any[] = Array.isArray(tradesData) ? tradesData : [];
  const merges: any[] = Array.isArray(mergeData) ? mergeData : [];
  const positions: any[] = Array.isArray(positionsData) ? positionsData : [];

  // S1: Interval Regularity
  let s1 = 0;
  if (trades.length > 10) {
    const intervals: number[] = [];
    for (let i = 0; i < trades.length - 1; i++) {
      const diff = Math.abs(trades[i].timestamp - trades[i + 1].timestamp);
      if (diff > 0 && diff < 86400) intervals.push(diff);
    }
    if (intervals.length > 5) {
      const cv = coefficientOfVariation(intervals);
      // Bots with burst trading (like gabagool22) can have high CV but very short intervals
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgInterval < 30) {
        // Sub-30s average = machine speed regardless of CV
        s1 = 85 + Math.min(15, (30 - avgInterval) / 30 * 15);
      } else {
        s1 = scoreFromCV(cv, true);
      }
    }
  }

  // S2: SPLIT/MERGE Activity
  let s2 = 0;
  const mergeCount = merges.length;
  const tradeCount = trades.length;
  if (tradeCount > 0) {
    const ratio = mergeCount / (tradeCount + mergeCount);
    if (ratio > 0.3) s2 = 90 + Math.min(10, (ratio - 0.3) * 30);
    else if (ratio > 0.1) s2 = 40 + (ratio - 0.1) / 0.2 * 50;
    else if (mergeCount > 0) s2 = 10 + mergeCount * 2;
    else s2 = 0;
  }

  // Both-sides detection (bonus signal that amplifies S2)
  let bothSidesPercent = 0;
  if (positions.length > 0) {
    const conditionMap = new Map<string, Set<string>>();
    for (const p of positions) {
      const cid = p.conditionId || '';
      if (!conditionMap.has(cid)) conditionMap.set(cid, new Set());
      conditionMap.get(cid)!.add(p.outcome || '');
    }
    const totalConditions = conditionMap.size;
    const bothSides = Array.from(conditionMap.values()).filter(s => s.size > 1).length;
    bothSidesPercent = totalConditions > 0 ? (bothSides / totalConditions) * 100 : 0;
  }

  // Both-sides bonus: if >30% of positions are on both sides, boost S2
  const bothSidesBonus = bothSidesPercent > 50 ? 20 : bothSidesPercent > 30 ? 15 : bothSidesPercent > 10 ? 8 : 0;

  // S3: Position Sizing Consistency
  let s3 = 0;
  if (trades.length > 10) {
    const usdSizes = trades.map((t: any) => parseFloat(t.size) * parseFloat(t.price));
    const cv = coefficientOfVariation(usdSizes);
    s3 = scoreFromCV(cv, true);
  }

  // S4: 24/7 Activity
  let s4 = 0;
  let activeHours = 0;
  if (trades.length > 20) {
    // Need trades over multiple days to detect 24/7
    // Use activity endpoint with broader time range
    const hourBuckets = new Set<number>();
    for (const t of trades) {
      const hour = new Date(t.timestamp * 1000).getUTCHours();
      hourBuckets.add(hour);
    }
    activeHours = hourBuckets.size;

    if (activeHours >= 22) s4 = 90 + (activeHours - 22) * 5;
    else if (activeHours >= 16) s4 = 30 + (activeHours - 16) / 6 * 60;
    else s4 = Math.max(0, (activeHours / 16) * 20);
  }

  // S5: Win Rate (from positions PnL)
  let s5 = 0;
  if (positions.length > 5) {
    const winners = positions.filter((p: any) => parseFloat(p.cashPnl || 0) > 0).length;
    const losers = positions.filter((p: any) => parseFloat(p.cashPnl || 0) < 0).length;
    const total = winners + losers;
    if (total > 0) {
      const winRate = winners / total;
      if (winRate > 0.85) s5 = 80 + (winRate - 0.85) / 0.15 * 20;
      else if (winRate > 0.65) s5 = 30 + (winRate - 0.65) / 0.2 * 50;
      else {
        // Per feedback: normal win rate should not penalize if other signals are strong
        s5 = 10;
      }
    }
  }

  // S6: Market Concentration
  let s6 = 0;
  if (trades.length > 10) {
    const categories = new Map<string, number>();
    for (const t of trades) {
      const slug = (t.slug || '').toLowerCase();
      let cat = 'other';
      if (slug.includes('up-or-down') || slug.includes('15-minute') || slug.includes('btc') || slug.includes('bitcoin') || slug.includes('ethereum') || slug.includes('eth') || slug.includes('solana') || slug.includes('sol')) {
        cat = 'crypto-shortterm';
      } else if (slug.includes('temperature') || slug.includes('weather') || slug.includes('rain') || slug.includes('snow')) {
        cat = 'weather';
      } else if (slug.includes('nba') || slug.includes('nfl') || slug.includes('epl') || slug.includes('mlb') || slug.includes('soccer') || slug.includes('football')) {
        cat = 'sports';
      } else if (slug.includes('trump') || slug.includes('biden') || slug.includes('election') || slug.includes('president')) {
        cat = 'politics';
      }
      categories.set(cat, (categories.get(cat) || 0) + 1);
    }

    const topCategory = Math.max(...categories.values());
    const concentration = topCategory / trades.length;

    if (concentration > 0.8) s6 = 70 + (concentration - 0.8) / 0.2 * 30;
    else if (concentration > 0.5) s6 = 30 + (concentration - 0.5) / 0.3 * 40;
    else s6 = Math.max(0, concentration * 40);
  }

  // Final score with both-sides bonus (capped at 100)
  const rawScore =
    s1 * WEIGHTS.intervalRegularity +
    s2 * WEIGHTS.splitMergeRatio +
    s3 * WEIGHTS.sizingConsistency +
    s4 * WEIGHTS.activity24h +
    s5 * WEIGHTS.winRateExtreme +
    s6 * WEIGHTS.marketConcentration;

  const botScore = Math.min(100, Math.round(rawScore + bothSidesBonus));

  let classification: BotDetectionResult['classification'];
  if (botScore >= 80) classification = 'bot';
  else if (botScore >= 60) classification = 'likely-bot';
  else if (botScore >= 40) classification = 'mixed';
  else classification = 'human';

  return {
    address,
    botScore,
    signals: {
      intervalRegularity: Math.round(s1),
      splitMergeRatio: Math.round(s2),
      sizingConsistency: Math.round(s3),
      activity24h: Math.round(s4),
      winRateExtreme: Math.round(s5),
      marketConcentration: Math.round(s6),
      bothSidesBonus: Math.round(bothSidesBonus),
    },
    classification,
    tradeCount,
    mergeCount,
    activeHours,
    bothSidesPercent: Math.round(bothSidesPercent),
  };
}

async function fetchJSON(url: string): Promise<any> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
