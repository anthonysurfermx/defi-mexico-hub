// Free tier scan limits (per day, stored in localStorage)
const FREE_WALLET_SCANS = 10;
const FREE_MARKET_SCANS = 10;
const STORAGE_KEY = 'scan_limits';

interface ScanLimits {
  walletScans: number;
  marketScans: number;
  date: string; // YYYY-MM-DD, resets daily
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function getLimits(): ScanLimits {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { walletScans: 0, marketScans: 0, date: today() };
    const parsed = JSON.parse(raw) as ScanLimits;
    // Reset if new day
    if (parsed.date !== today()) {
      return { walletScans: 0, marketScans: 0, date: today() };
    }
    return parsed;
  } catch {
    return { walletScans: 0, marketScans: 0, date: today() };
  }
}

function saveLimits(limits: ScanLimits) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limits));
}

export function useScanLimit() {
  const limits = getLimits();

  const canScanWallet = limits.walletScans < FREE_WALLET_SCANS;
  const canScanMarket = limits.marketScans < FREE_MARKET_SCANS;
  const walletScansRemaining = Math.max(0, FREE_WALLET_SCANS - limits.walletScans);
  const marketScansRemaining = Math.max(0, FREE_MARKET_SCANS - limits.marketScans);

  const consumeWalletScan = () => {
    const current = getLimits();
    current.walletScans += 1;
    current.date = today();
    saveLimits(current);
  };

  const consumeMarketScan = () => {
    const current = getLimits();
    current.marketScans += 1;
    current.date = today();
    saveLimits(current);
  };

  return {
    canScanWallet,
    canScanMarket,
    walletScansRemaining,
    marketScansRemaining,
    walletScanLimit: FREE_WALLET_SCANS,
    marketScanLimit: FREE_MARKET_SCANS,
    consumeWalletScan,
    consumeMarketScan,
  };
}
