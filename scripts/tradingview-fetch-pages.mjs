import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import {
  ensureDir,
  fetchText,
  normalizeLocale,
  parseArgs,
  parseIdeaDocument,
  readNdjson,
  safeSlug,
  sleep,
  splitCsvArg,
  writeNdjson,
} from './tradingview-common.mjs';

const args = parseArgs(process.argv.slice(2));
const outDir = path.resolve(args['out-dir'] || 'data/tradingview');
const limit = Number(args.limit || 300);
const delayMs = Number(args.delay || 1800);
const filterLocales = splitCsvArg(args['filter-locale']).map(normalizeLocale);
const filterSources = splitCsvArg(args['filter-source']);
const rawDir = path.join(outDir, 'raw', 'ideas');
const indexFile = path.join(outDir, 'idea-index.ndjson');
const ideasFile = path.join(outDir, 'ideas.ndjson');

await ensureDir(rawDir);

const indexRows = await readNdjson(indexFile);
const existingIdeas = await readNdjson(ideasFile);
const existingByUrl = new Map(existingIdeas.map((row) => [row.url, row]));
const nextRows = [];

let selectedRows = indexRows;
if (filterLocales.length > 0) {
  selectedRows = selectedRows.filter((row) => {
    const locales = row.discovered_locales || [row.locale].filter(Boolean);
    return locales.some((locale) => filterLocales.includes(normalizeLocale(locale)));
  });
}
if (filterSources.length > 0) {
  selectedRows = selectedRows.filter((row) => {
    const sources = row.discovered_froms || [row.pageKind].filter(Boolean);
    return sources.some((source) => filterSources.includes(source));
  });
}

for (const item of selectedRows.slice(0, limit)) {
  if (existingByUrl.has(item.ideaUrl) && !args.refresh) {
    nextRows.push({
      ...existingByUrl.get(item.ideaUrl),
      listing_text: item.listingText || existingByUrl.get(item.ideaUrl).listing_text || null,
      listing_samples: item.listing_samples || existingByUrl.get(item.ideaUrl).listing_samples || [],
      discovered_froms: item.discovered_froms || existingByUrl.get(item.ideaUrl).discovered_froms || [],
      discovered_locales: item.discovered_locales || existingByUrl.get(item.ideaUrl).discovered_locales || [],
      source_hosts: item.source_hosts || existingByUrl.get(item.ideaUrl).source_hosts || [],
    });
    continue;
  }

  try {
    const result = await fetchText(item.ideaUrl, { retries: 1, timeoutMs: 18000 });
    const parsed = parseIdeaDocument(result.text, item.ideaUrl);
    const slug = `${safeSlug(parsed.title || item.listingText || 'idea')}-${parsed.ideaId.slice(0, 8)}`;
    const rawPath = path.join(rawDir, `${slug}.html`);
    await writeFile(rawPath, result.text, 'utf8');

    nextRows.push({
      ...parsed,
      raw_path: path.relative(process.cwd(), rawPath),
      locale: item.locale || null,
      listing_text: item.listingText || null,
      listing_samples: item.listing_samples || [],
      discovered_from: item.pageKind,
      discovered_froms: item.discovered_froms || [item.pageKind].filter(Boolean),
      discovered_locales: item.discovered_locales || [item.locale].filter(Boolean),
      source_hosts: item.source_hosts || [item.source_host].filter(Boolean),
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    nextRows.push({
      ideaId: item.ideaId,
      url: item.ideaUrl,
      title: null,
      description: null,
      articleBody: null,
      author: null,
      keywords: [],
      commentCandidates: [],
      locale: item.locale || null,
      listing_text: item.listingText || null,
      listing_samples: item.listing_samples || [],
      discovered_from: item.pageKind,
      discovered_froms: item.discovered_froms || [item.pageKind].filter(Boolean),
      discovered_locales: item.discovered_locales || [item.locale].filter(Boolean),
      source_hosts: item.source_hosts || [item.source_host].filter(Boolean),
      fetch_error: error instanceof Error ? error.message : String(error),
      fetched_at: new Date().toISOString(),
    });
  }

  await sleep(delayMs);
}

const mergedByUrl = new Map(existingIdeas.map((row) => [row.url, row]));
for (const row of nextRows) {
  mergedByUrl.set(row.url, row);
}
const finalRows = Array.from(mergedByUrl.values()).sort((a, b) => a.url.localeCompare(b.url));

await writeNdjson(ideasFile, finalRows);

console.log(JSON.stringify({
  ok: true,
  requested: Math.min(limit, selectedRows.length),
  saved: nextRows.length,
  totalRows: finalRows.length,
  ideasFile: path.relative(process.cwd(), ideasFile),
}, null, 2));
