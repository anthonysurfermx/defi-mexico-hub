import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import {
  ensureDir,
  extractIdeaCardsFromListing,
  fetchText,
  getCommentsBase,
  getTvBase,
  normalizeLocale,
  parseArgs,
  readNdjson,
  resolveCommentsPageUrl,
  resolveIdeasPageUrl,
  safeSlug,
  sha1,
  sleep,
  splitCsvArg,
  writeJson,
  writeNdjson,
} from './tradingview-common.mjs';

const args = parseArgs(process.argv.slice(2));
const pages = Number(args.pages || 50);
const locales = splitCsvArg(args.locales, ['en']).map(normalizeLocale);
const delayMs = Number(args.delay || 1800);
const outDir = path.resolve(args['out-dir'] || 'data/tradingview');
const rawDir = path.join(outDir, 'raw', 'listings');
const indexFile = path.join(outDir, 'idea-index.ndjson');
const pagesFile = path.join(outDir, 'discover-pages.json');

await ensureDir(rawDir);

const discovered = new Map();
const pageReports = [];

function mergeDiscovery(prev, next) {
  const mergedListingSamples = new Map();
  for (const sample of [...(prev.listing_samples || []), ...(next.listing_samples || [])]) {
    if (!sample?.text) continue;
    const key = `${sample.kind}|${sample.locale}|${sample.text.toLowerCase()}`;
    if (!mergedListingSamples.has(key)) mergedListingSamples.set(key, sample);
  }

  const mergeUnique = (...values) => Array.from(new Set(values.flat().filter(Boolean)));

  const listingText = [prev.listingText, next.listingText]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)[0] || null;

  return {
    ...prev,
    ...next,
    listingText,
    locale: next.locale || prev.locale || 'en',
    pageKind: next.pageKind || prev.pageKind,
    source_host: next.source_host || prev.source_host,
    source_hosts: mergeUnique(prev.source_hosts || [], next.source_hosts || [], prev.source_host, next.source_host),
    discovered_locales: mergeUnique(prev.discovered_locales || [], next.discovered_locales || [], prev.locale, next.locale),
    discovered_froms: mergeUnique(prev.discovered_froms || [], next.discovered_froms || [], prev.pageKind, next.pageKind),
    discovered_pages: mergeUnique(prev.discovered_pages || [], next.discovered_pages || [], prev.pageUrl, next.pageUrl),
    listing_samples: Array.from(mergedListingSamples.values()),
    discovered_at: prev.discovered_at || next.discovered_at || new Date().toISOString(),
  };
}

async function fetchListing(kind, page, locale, candidates) {
  let lastError = null;
  for (const candidate of candidates) {
    try {
      const result = await fetchText(candidate, { retries: 1, timeoutMs: 15000 });
      const pageSlug = `${locale}-${kind}-page-${String(page).padStart(3, '0')}-${sha1(result.url).slice(0, 8)}`;
      const rawPath = path.join(rawDir, `${pageSlug}.html`);
      await writeJson(rawPath.replace(/\.html$/, '.meta.json'), {
        page,
        kind,
        locale,
        requestedUrl: candidate,
        finalUrl: result.url,
        fetchedAt: new Date().toISOString(),
        htmlLength: result.text.length,
      });
      await writeFile(rawPath, result.text, 'utf8');

      const cards = extractIdeaCardsFromListing(result.text, result.url, kind);
      return {
        requestedUrl: candidate,
        finalUrl: result.url,
        rawPath,
        cards,
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error(`Failed to fetch listing page ${kind} ${page}`);
}

for (const locale of locales) {
  for (let page = 1; page <= pages; page += 1) {
    const kind = page % 5 === 0 ? 'comments' : 'ideas_recent';
    const candidates = kind === 'comments'
      ? resolveCommentsPageUrl(Math.ceil(page / 5), locale)
      : resolveIdeasPageUrl(page - Math.floor(page / 5), 'recent', locale);

    try {
      const report = await fetchListing(kind, page, locale, candidates);
      for (const card of report.cards) {
        const nextRow = {
          ...card,
          locale,
          discovered_at: new Date().toISOString(),
          source_host: kind === 'comments' ? getCommentsBase(locale) : getTvBase(locale),
          source_hosts: [kind === 'comments' ? getCommentsBase(locale) : getTvBase(locale)],
          discovered_locales: [locale],
          discovered_froms: [kind],
          discovered_pages: [report.finalUrl],
          listing_samples: card.listingText
            ? [{ kind, locale, text: card.listingText, page_url: report.finalUrl }]
            : [],
        };
        if (!discovered.has(card.ideaUrl)) {
          discovered.set(card.ideaUrl, nextRow);
        } else {
          discovered.set(card.ideaUrl, mergeDiscovery(discovered.get(card.ideaUrl), nextRow));
        }
      }
      pageReports.push({
        locale,
        page,
        kind,
        requested_url: report.requestedUrl,
        final_url: report.finalUrl,
        raw_path: path.relative(process.cwd(), report.rawPath),
        discovered_links: report.cards.length,
      });
    } catch (error) {
      pageReports.push({
        locale,
        page,
        kind,
        error: error instanceof Error ? error.message : String(error),
        discovered_links: 0,
      });
    }

    if (!(locale === locales.at(-1) && page === pages)) {
      await sleep(delayMs);
    }
  }
}

const existing = await readNdjson(indexFile);
for (const row of existing) {
  if (!discovered.has(row.ideaUrl)) {
    discovered.set(row.ideaUrl, row);
  } else {
    discovered.set(row.ideaUrl, mergeDiscovery(row, discovered.get(row.ideaUrl)));
  }
}

const rows = Array.from(discovered.values())
  .sort((a, b) => a.ideaUrl.localeCompare(b.ideaUrl))
  .map((row) => ({
    ...row,
    listing_slug: safeSlug(row.listingText || row.ideaUrl),
  }));

await writeNdjson(indexFile, rows);
await writeJson(pagesFile, {
  locales,
  pagesAttempted: pages,
  pagesAttemptedTotal: pages * locales.length,
  linksDiscovered: rows.length,
  generatedAt: new Date().toISOString(),
  reports: pageReports,
});

console.log(JSON.stringify({
  ok: true,
  locales,
  pagesAttempted: pages,
  pagesAttemptedTotal: pages * locales.length,
  uniqueIdeas: rows.length,
  indexFile: path.relative(process.cwd(), indexFile),
  pagesFile: path.relative(process.cwd(), pagesFile),
}, null, 2));
