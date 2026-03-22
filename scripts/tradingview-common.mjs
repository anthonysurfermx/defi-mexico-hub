import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

export const TV_BASE = 'https://www.tradingview.com';
export const COMMENTS_BASE = 'https://www.tradingview.com/ideas/comments/';
export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (compatible; BobbyRouterResearch/1.0; +https://defimexico.org)';

export const LOCALE_BASES = {
  en: 'https://www.tradingview.com',
  es: 'https://es.tradingview.com',
  in: 'https://in.tradingview.com',
};

const STOPWORDS = new Set([
  'share this idea',
  'click boost',
  'support the idea',
  'house rules',
  'copyright',
  'tradingview',
  'get started',
  'products',
  'community',
  'markets',
  'brokers',
  'select market data provided',
  'explore yield curves',
  'explore economies on maps',
  'analyze all stocks',
  'analyze all crypto',
  'analyze all forex',
  'analyze all bonds',
  'analyze all etfs',
  'analice todas las acciones',
  'analice todas las cripto',
  'analice todas las divisas',
  'analizar todos los bonos',
  'analice todos los etf',
  'explore las curvas de rendimiento',
  'explore las economías en mapas',
]);

const ASSET_PATTERNS = [
  ['BTC', /\b(?:btc|bitcoin|btcusdt|btcusd)\b/i],
  ['ETH', /\b(?:eth|ethereum|ethusdt|ethusd)\b/i],
  ['SOL', /\b(?:sol|solana|solusdt)\b/i],
  ['XRP', /\b(?:xrp|xrpusdt)\b/i],
  ['DOGE', /\b(?:doge|dogecoin)\b/i],
  ['PEPE', /\bpepe\b/i],
  ['WIF', /\bwif\b/i],
  ['ONDO', /\bondo\b/i],
  ['GOLD', /\b(?:gold|xau|xaut|xauusd)\b/i],
  ['SILVER', /\b(?:silver|xag|xagusd)\b/i],
  ['NVDA', /\b(?:nvda|nvidia)\b/i],
  ['AAPL', /\b(?:aapl|apple)\b/i],
  ['TSLA', /\b(?:tsla|tesla)\b/i],
  ['META', /\b(?:meta|facebook)\b/i],
  ['SPY', /\b(?:spy|s&p ?500|sp500)\b/i],
  ['QQQ', /\b(?:qqq|nasdaq)\b/i],
  ['DXY', /\bdxy\b/i],
];

export function parseArgs(argv) {
  const args = {};
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue;
    const [key, value] = raw.slice(2).split('=');
    args[key] = value === undefined ? true : value;
  }
  return args;
}

export function splitCsvArg(value, fallback = []) {
  if (!value) return fallback;
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeLocale(locale) {
  const raw = String(locale || 'en').toLowerCase();
  if (raw in LOCALE_BASES) return raw;
  if (raw.startsWith('es')) return 'es';
  if (raw.startsWith('in')) return 'in';
  return 'en';
}

export function getTvBase(locale = 'en') {
  return LOCALE_BASES[normalizeLocale(locale)] || TV_BASE;
}

export function getCommentsBase(locale = 'en') {
  return `${getTvBase(locale)}/ideas/comments/`;
}

export async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

export async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readNdjson(filePath) {
  if (!(await fileExists(filePath))) return [];
  const raw = await readFile(filePath, 'utf8');
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export async function writeNdjson(filePath, rows) {
  await ensureDir(path.dirname(filePath));
  const body = rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : '');
  await writeFile(filePath, body, 'utf8');
}

export async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchText(url, options = {}) {
  const {
    retries = 2,
    timeoutMs = 15000,
    headers = {},
    noRetryStatus = new Set([401, 403, 404]),
  } = options;

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        headers: {
          'user-agent': DEFAULT_USER_AGENT,
          accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.9,es;q=0.6',
          ...headers,
        },
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const text = await res.text();
      if (!res.ok) {
        const error = new Error(`HTTP ${res.status} for ${url}`);
        error.status = res.status;
        error.body = text.slice(0, 400);
        throw error;
      }
      return {
        ok: true,
        status: res.status,
        url: res.url,
        text,
      };
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      const status = error?.status;
      if (status && noRetryStatus.has(status)) break;
      if (attempt < retries) {
        await sleep(1200 * (attempt + 1));
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

export async function fetchJson(url, options = {}) {
  const result = await fetchText(url, {
    ...options,
    headers: {
      accept: 'application/json,text/plain;q=0.9,*/*;q=0.8',
      ...(options.headers || {}),
    },
  });

  return {
    ...result,
    json: JSON.parse(result.text),
  };
}

export function resolveIdeasPageUrl(page, flavor = 'recent', locale = 'en') {
  const base = getTvBase(locale);
  const candidates = [];
  if (page === 1) {
    candidates.push(`${base}/ideas/`);
    candidates.push(`${base}/ideas/?sort=${flavor}`);
  } else {
    candidates.push(`${base}/ideas/page-${page}/`);
    candidates.push(`${base}/ideas/?page=${page}`);
    candidates.push(`${base}/ideas/?sort=${flavor}&page=${page}`);
  }
  return candidates;
}

export function resolveCommentsPageUrl(page, locale = 'en') {
  const base = getCommentsBase(locale);
  const candidates = [];
  if (page === 1) {
    candidates.push(base);
  } else {
    candidates.push(`${base}page-${page}/`);
    candidates.push(`${base}?page=${page}`);
  }
  return candidates;
}

export function isIdeaUrl(href) {
  return /\/chart\/[^"'?#]+/i.test(href);
}

export function normalizeIdeaUrl(href, baseUrl = TV_BASE) {
  const absolute = href.startsWith('http') ? href : new URL(href, baseUrl).toString();
  const clean = absolute.split('#')[0].split('?')[0];
  return clean.endsWith('/') ? clean : `${clean}/`;
}

export function detectLocaleFromUrl(url) {
  try {
    const host = new URL(url).host.toLowerCase();
    if (host.startsWith('es.')) return 'es';
    if (host.startsWith('in.')) return 'in';
  } catch {
    // ignore parse errors
  }
  return 'en';
}

export function safeSlug(text) {
  const base = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base || 'item';
}

export function sha1(value) {
  return createHash('sha1').update(String(value)).digest('hex');
}

export function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, ' ')
    .replace(/\\\\/g, '\\');
}

export function stripTags(html) {
  return decodeHtml(String(html || '').replace(/<script[\s\S]*?<\/script>/gi, ' '))
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

export function normalizeWhitespace(text) {
  return decodeHtml(String(text || ''))
    .replace(/\s+/g, ' ')
    .replace(/[ \t]+([,.;:!?])/g, '$1')
    .trim();
}

export function extractAnchors(html) {
  const anchors = [];
  const regex = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    const text = normalizeWhitespace(stripTags(match[2]));
    anchors.push({ href, text });
  }
  return anchors;
}

export function extractIdeaCardsFromListing(html, pageUrl, pageKind) {
  const locale = detectLocaleFromUrl(pageUrl);
  const byUrl = new Map();
  for (const anchor of extractAnchors(html)) {
    if (!isIdeaUrl(anchor.href)) continue;
    const url = normalizeIdeaUrl(anchor.href, pageUrl);
    const prev = byUrl.get(url);
    const nextText = anchor.text;
    if (!prev || nextText.length > (prev.listingText || '').length) {
      byUrl.set(url, {
        ideaUrl: url,
        ideaId: sha1(url),
        pageUrl,
        pageKind,
        locale,
        listingText: nextText,
      });
    }
  }
  return Array.from(byUrl.values());
}

export function extractMetaTag(html, attr, key) {
  const regex = new RegExp(`<meta[^>]*${attr}="${key}"[^>]*content="([^"]*)"[^>]*>`, 'i');
  const match = html.match(regex);
  return match ? normalizeWhitespace(match[1]) : null;
}

export function extractTitleTag(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? normalizeWhitespace(stripTags(match[1])) : null;
}

export function extractCanonicalUrl(html, fallbackUrl) {
  const match = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"[^>]*>/i);
  return match ? normalizeIdeaUrl(match[1]) : normalizeIdeaUrl(fallbackUrl);
}

export function extractJsonLd(html) {
  const scripts = [];
  const regex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const raw = decodeHtml(match[1]).trim();
    if (!raw) continue;
    try {
      scripts.push(JSON.parse(raw));
    } catch {
      // Ignore malformed JSON-LD
    }
  }
  return scripts;
}

function pickLongestString(values) {
  return values
    .map((value) => normalizeWhitespace(value))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)[0] || null;
}

export function parseIdeaDocument(html, sourceUrl) {
  const canonicalUrl = extractCanonicalUrl(html, sourceUrl);
  const metaTitle = extractMetaTag(html, 'property', 'og:title')
    || extractMetaTag(html, 'name', 'twitter:title')
    || extractTitleTag(html);
  const metaDescription = extractMetaTag(html, 'property', 'og:description')
    || extractMetaTag(html, 'name', 'description')
    || extractMetaTag(html, 'name', 'twitter:description');

  let author = null;
  let articleBody = null;
  const keywords = new Set();

  for (const entry of extractJsonLd(html)) {
    const items = Array.isArray(entry) ? entry : [entry];
    for (const item of items) {
      if (item?.author?.name && !author) author = normalizeWhitespace(item.author.name);
      if (Array.isArray(item?.keywords)) {
        for (const keyword of item.keywords) keywords.add(normalizeWhitespace(keyword));
      } else if (typeof item?.keywords === 'string') {
        for (const keyword of item.keywords.split(',')) keywords.add(normalizeWhitespace(keyword));
      }
      const bodyCandidate = pickLongestString([
        item?.articleBody,
        item?.description,
        item?.headline,
      ]);
      if (bodyCandidate && (!articleBody || bodyCandidate.length > articleBody.length)) {
        articleBody = bodyCandidate;
      }
    }
  }

  if (!articleBody) {
    const bodyCandidates = [];
    const propertyRegex = /"(?:articleBody|description|content|body|text)":"((?:\\.|[^"\\]){60,4000})"/g;
    let match;
    while ((match = propertyRegex.exec(html)) !== null) {
      bodyCandidates.push(decodeHtml(match[1]));
    }
    articleBody = pickLongestString(bodyCandidates);
  }

  const commentCandidates = extractCommentCandidatesFromHtml(html);

  return {
    ideaId: sha1(canonicalUrl),
    url: canonicalUrl,
    title: metaTitle,
    description: metaDescription,
    articleBody,
    author,
    keywords: Array.from(keywords).filter(Boolean),
    commentCandidates,
  };
}

export function extractCommentCandidatesFromHtml(html) {
  const results = new Set();
  const patterns = [
    /"(?:comment|commentText|body|content|text)":"((?:\\.|[^"\\]){20,800})"/g,
    /"message":"((?:\\.|[^"\\]){20,800})"/g,
  ];

  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(html)) !== null) {
      const candidate = normalizeWhitespace(decodeHtml(match[1]));
      if (isUsablePhrase(candidate)) results.add(candidate);
    }
  }

  return Array.from(results);
}

export function splitIntoPhrases(text) {
  const normalized = normalizeWhitespace(text).replace(/\s*[|•]\s*/g, '. ');
  if (!normalized) return [];

  const fragments = normalized
    .split(/(?<=[.?!])\s+|\s{2,}|\n+/)
    .map((fragment) => normalizeWhitespace(fragment))
    .filter((fragment) => fragment.length >= 12 && fragment.length <= 280);

  const deduped = [];
  const seen = new Set();
  for (const fragment of fragments) {
    const key = fragment.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(fragment);
  }
  return deduped;
}

export function isUsablePhrase(text) {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return false;
  if (normalized.length < 12 || normalized.length > 280) return false;
  if (/https?:\/\//i.test(normalized)) return false;
  if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(normalized)) return false;

  const lower = normalized.toLowerCase();
  for (const stop of STOPWORDS) {
    if (lower.includes(stop)) return false;
  }

  const alphaCount = (normalized.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g) || []).length;
  const totalCount = normalized.length;
  if (alphaCount / totalCount < 0.45) return false;
  return true;
}

export function detectLanguage(text) {
  const lower = String(text || '').toLowerCase();
  const spanishScore = [
    /\b(?:qué|que|como|cómo|cu[aá]ndo|cuando|d[oó]nde|donde|por qu[eé]|por que|conviene|riesgo|seguro|mercado|subir|bajar|comprar|vender|d[oó]lares|dolares|venta|compra|entrada|salida|operaci[oó]n|operacion|analiza|analice|retroceso|alcista|bajista|soporte|resistencia)\b/g,
    /[áéíóúñ¿¡]/g,
  ].reduce((acc, regex) => acc + ((lower.match(regex) || []).length), 0);
  return spanishScore > 0 ? 'es' : 'en';
}

export function detectAssets(text) {
  const found = [];
  for (const [asset, regex] of ASSET_PATTERNS) {
    if (regex.test(text) && !found.includes(asset)) found.push(asset);
  }
  return found;
}

export function estimateLevel(text) {
  const lower = text.toLowerCase();
  if (/\b(?:what is|qué es|soy nuevo|i'?m new|beginner|principiante|where do i start|por dónde empiezo|first time)\b/i.test(lower)) {
    return 'beginner';
  }
  if (/\b(?:fvg|order block|ob sweep|choch|bos|liquidity sweep|implied vol|realized vol|kelly|capitulation|divergence|4h|daily bias|ciod)\b/i.test(lower)) {
    return 'advanced';
  }
  return 'intermediate';
}

export function classifyQuestionType(text) {
  const lower = text.toLowerCase();
  if (/\b(?:enter|entry|exit|stop|target|take profit|tp\b|sl\b|pullback|retest|where do i enter|dónde entro|dónde pongo el stop)\b/i.test(lower)) return 'entry_exit';
  if (/\b(?:bullish|bearish|long|short|subir|bajar|up or down|direction|alcista|bajista)\b/i.test(lower)) return 'direction';
  if (/\b(?:head and shoulders|divergence|breakout|pattern|fvg|order block|ob sweep|choch|bos|support|resistance|chart)\b/i.test(lower)) return 'confirmation';
  if (/\b(?:risk|riesgo|size|sizing|leverage|10x|20x|liquidated|liquidation|kelly)\b/i.test(lower)) return 'risk';
  if (/\b(?:vs\.?|versus|better|which is better|or crypto|gold or|btc vs eth|compare)\b/i.test(lower)) return 'comparison';
  if (/\b(?:sentiment|feeling|fear|greed|miedo|market feeling|smart money|whales?)\b/i.test(lower)) return 'sentiment';
  if (/\b(?:what is|qué es|beginner|principiante|i'?m new|soy nuevo|where do i start|por dónde empiezo)\b/i.test(lower)) return 'newbie';
  if (/\b(?:why did i get liquidated|why did i lose|perdí todo|liquidado|wrecked)\b/i.test(lower)) return 'frustration';
  if (/\b(?:fvg|ob sweep|choch|bos|4h|ciod|daily bias|implied vol|realized vol)\b/i.test(lower)) return 'jargon';
  if (/\b(?:funding|open interest|polymarket|odds|probabilidad)\b/i.test(lower)) return 'market_data';
  if (/\b(?:price|precio|how much|cuánto vale)\b/i.test(lower)) return 'price';
  return 'general';
}

export function inferExpectedIntent(text, questionType, assets) {
  const lower = text.toLowerCase();
  if (assets.length > 0 && (lower.split(/\s+/).length <= 2 || /\b(?:price|precio|how much|cuánto vale)\b/i.test(lower))) return 'price';
  if (/\b(?:chart|gráfico|rsi|macd|sma|support|resistance|soporte|resistencia)\b/i.test(lower)) return 'chart';
  if (questionType === 'market_data' || /\b(?:funding|open interest|oi\b|polymarket|odds|fear.?greed|sentiment)\b/i.test(lower)) return 'market_data';
  if (questionType === 'newbie') return 'onboarding';
  if (/\b(?:safe|seguro|scam|honeypot|rug|fraud|risk)\b/i.test(lower)) return 'safety';
  if (/\b(?:why\??|por qué\??|and the stop|y el stop|and the target|y el target)\b/i.test(lower)) return 'follow_up';
  if (/\b(?:analyze|analiza|full debate|debate completo|scan)\b/i.test(lower)) return 'analyze';
  return 'trade_chat';
}

export function buildTrainingRecord(text, sourceKind, sourceUrl, symbolContext = null, options = {}) {
  const normalized = normalizeWhitespace(text);
  const assets = detectAssets(`${symbolContext || ''} ${normalized}`);
  const language = detectLanguage(normalized);
  const questionType = classifyQuestionType(normalized);
  const expectedIntent = inferExpectedIntent(normalized, questionType, assets);
  const hasTicker = assets.length > 0;
  const hasPrice = /\$?\d+(?:[.,]\d+)?/.test(normalized);
  const hasDirection = /\b(?:long|short|bullish|bearish|alcista|bajista|subir|bajar)\b/i.test(normalized);
  const idPrefix = options.idPrefix || 'tv';

  return {
    id: `${idPrefix}_${sha1(`${sourceUrl}|${sourceKind}|${normalized}`)}`,
    text: normalized,
    language,
    source: sourceKind,
    source_url: sourceUrl,
    asset_mentioned: assets,
    estimated_level: estimateLevel(normalized),
    question_type: questionType,
    word_count: normalized.split(/\s+/).filter(Boolean).length,
    has_ticker: hasTicker,
    has_price: hasPrice,
    has_direction: hasDirection,
    expected_intent: expectedIntent,
    symbol_context: symbolContext,
    scraped_at: new Date().toISOString(),
  };
}
