import { next } from '@vercel/functions';

const CRAWLER_UA = /Twitterbot|facebookexternalhit|LinkedInBot|Slackbot|TelegramBot|WhatsApp|Discordbot/i;

const POLYMARKET_DATA = 'https://data-api.polymarket.com';
const POLYMARKET_GAMMA = 'https://gamma-api.polymarket.com';

const SITE = 'https://defimexico.org';
const DEFAULT_IMAGE = `${SITE}/maincover.jpeg`;

function shortenAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatUsd(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function fetchWalletOgData(wallet: string) {
  try {
    const [posRes, valRes] = await Promise.all([
      fetch(`${POLYMARKET_DATA}/positions?user=${wallet}&limit=50&sortBy=CURRENT&sortDirection=DESC`),
      fetch(`${POLYMARKET_DATA}/value?user=${wallet}`),
    ]);

    const positions = await posRes.json();
    const valueData = await valRes.json();

    let portfolioValue = 0;
    if (Array.isArray(valueData) && valueData.length > 0) {
      portfolioValue = valueData[0].value || 0;
    }

    let totalPnl = 0;
    let openPositions = 0;
    let topMarket = '';

    if (Array.isArray(positions)) {
      openPositions = positions.length;
      totalPnl = positions.reduce((acc: number, p: any) => acc + (parseFloat(p.cashPnl) || 0), 0);
      if (positions.length > 0) {
        topMarket = positions[0].title || '';
      }
    }

    return { portfolioValue, totalPnl, openPositions, topMarket };
  } catch {
    return null;
  }
}

async function fetchMarketOgData(slug: string) {
  try {
    let res = await fetch(`${POLYMARKET_GAMMA}/markets?slug=${slug}&limit=1`);
    let data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      const m = data[0];
      const prices = JSON.parse(m.outcomePrices || '[]');
      const outcomes = JSON.parse(m.outcomes || '[]');
      return {
        title: m.question || '',
        volume: parseFloat(m.volume) || 0,
        image: m.image || '',
        topOutcome: outcomes[0] || 'Yes',
        topPrice: Math.round((parseFloat(prices[0]) || 0) * 100),
      };
    }

    res = await fetch(`${POLYMARKET_GAMMA}/events?slug=${slug}&limit=1`);
    data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const event = data[0];
      return {
        title: event.title || '',
        volume: event.volume || 0,
        image: event.image || '',
        topOutcome: '',
        topPrice: 0,
      };
    }

    return null;
  } catch {
    return null;
  }
}

function buildOgHtml(meta: { title: string; description: string; image: string; url: string }): Response {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${t}</title>
<meta name="description" content="${d}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${meta.url}" />
<meta property="og:title" content="${t}" />
<meta property="og:description" content="${d}" />
<meta property="og:image" content="${meta.image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="DeFi Mexico" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${d}" />
<meta name="twitter:image" content="${meta.image}" />
<meta name="twitter:site" content="@DeFiMexico" />
</head>
<body>
<script>window.location.href="${meta.url}";</script>
<noscript><a href="${meta.url}">View on DeFi Mexico</a></noscript>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300',
    },
  });
}

export default async function middleware(request: Request) {
  const ua = request.headers.get('user-agent') || '';

  // Only intercept crawlers; real users get the SPA
  if (!CRAWLER_UA.test(ua)) {
    return next();
  }

  const url = new URL(request.url);
  const { pathname, searchParams } = url;

  // Wallet X-Ray (consensus page)
  if (pathname === '/agentic-world/consensus' && searchParams.has('wallet')) {
    const wallet = searchParams.get('wallet')!;
    const walletData = await fetchWalletOgData(wallet);

    const short = shortenAddress(wallet);
    const title = `Wallet X-Ray: ${short} | DeFi Mexico`;
    let description = `On-chain analysis of Polymarket wallet ${short}. Bot detection, strategy classification & position breakdown.`;

    if (walletData) {
      const parts: string[] = [];
      if (walletData.portfolioValue > 0) parts.push(`Portfolio: ${formatUsd(walletData.portfolioValue)}`);
      if (walletData.totalPnl !== 0) parts.push(`PnL: ${walletData.totalPnl >= 0 ? '+' : ''}${formatUsd(walletData.totalPnl)}`);
      if (walletData.openPositions > 0) parts.push(`${walletData.openPositions} positions`);
      if (parts.length > 0) {
        description = `${parts.join(' | ')}. Bot detection & strategy analysis.`;
      }
      if (walletData.topMarket) {
        description += ` Top: ${walletData.topMarket.slice(0, 50)}`;
      }
    }

    const fullUrl = `${SITE}${pathname}?wallet=${wallet}`;
    return buildOgHtml({ title, description, image: DEFAULT_IMAGE, url: fullUrl });
  }

  // Polymarket tracker with market URL
  if (pathname === '/agentic-world/polymarket' && searchParams.has('market')) {
    const marketUrl = searchParams.get('market')!;
    try {
      const u = new URL(marketUrl);
      const parts = u.pathname.split('/').filter(Boolean);
      const slug = parts[parts.length - 1] || '';

      if (slug) {
        const marketData = await fetchMarketOgData(slug);

        if (marketData) {
          const title = `${marketData.title.slice(0, 70)} | DeFi Mexico`;
          let description = `Polymarket: ${formatUsd(marketData.volume)} volume.`;
          if (marketData.topPrice > 0) {
            description += ` ${marketData.topOutcome}: ${marketData.topPrice}%.`;
          }
          description += ' Holder composition, bot detection & smart money tracking.';

          const image = marketData.image || DEFAULT_IMAGE;
          const fullUrl = `${SITE}${pathname}?market=${encodeURIComponent(marketUrl)}`;
          return buildOgHtml({ title, description, image, url: fullUrl });
        }
      }
    } catch {
      // Fall through to default
    }
  }

  // Leaderboard page
  if (pathname === '/agentic-world/leaderboard') {
    return buildOgHtml({
      title: 'AI Agents Leaderboard | DeFi Mexico',
      description: 'Track DeFi protocol TVL, volume & fees. Real-time rankings powered by DeFi Llama data.',
      image: DEFAULT_IMAGE,
      url: `${SITE}${pathname}`,
    });
  }

  // Generic agentic-world fallback for crawlers
  return buildOgHtml({
    title: 'OpenClaw AI | DeFi Mexico',
    description: 'On-chain intelligence platform. Polymarket bot detection, wallet X-ray, strategy classification & smart money tracking.',
    image: DEFAULT_IMAGE,
    url: `${SITE}${pathname}`,
  });
}

export const config = {
  matcher: ['/agentic-world/:path*'],
};
