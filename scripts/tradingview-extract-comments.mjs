import path from 'node:path';
import {
  buildTrainingRecord,
  isUsablePhrase,
  normalizeWhitespace,
  parseArgs,
  readNdjson,
  splitIntoPhrases,
  writeNdjson,
} from './tradingview-common.mjs';

const args = parseArgs(process.argv.slice(2));
const outDir = path.resolve(args['out-dir'] || 'data/tradingview');
const ideasFile = path.join(outDir, 'ideas.ndjson');
const phrasesFile = path.join(outDir, 'phrases.ndjson');

const ideas = await readNdjson(ideasFile);
const rows = [];
const seen = new Set();

function pushPhrase(text, sourceKind, sourceUrl, symbolContext = null) {
  const normalized = normalizeWhitespace(text);
  if (!isUsablePhrase(normalized)) return;
  const key = `${sourceKind}|${sourceUrl}|${normalized.toLowerCase()}`;
  if (seen.has(key)) return;
  seen.add(key);
  rows.push(
    buildTrainingRecord(normalized, sourceKind, sourceUrl, symbolContext),
  );
}

for (const idea of ideas) {
  const symbolContext = idea.title || idea.listing_text || null;

  if (idea.title) pushPhrase(idea.title, 'tradingview_idea_title', idea.url, symbolContext);
  if (idea.description) {
    for (const phrase of splitIntoPhrases(idea.description)) {
      pushPhrase(phrase, 'tradingview_idea_description', idea.url, symbolContext);
    }
  }
  if (Array.isArray(idea.listing_samples) && idea.listing_samples.length > 0) {
    for (const sample of idea.listing_samples) {
      const sourceKind = sample.kind === 'comments'
        ? 'tradingview_comments_hub_excerpt'
        : 'tradingview_listing_excerpt';
      for (const phrase of splitIntoPhrases(sample.text || '')) {
        pushPhrase(phrase, sourceKind, idea.url, symbolContext);
      }
    }
  } else if (idea.listing_text) {
    for (const phrase of splitIntoPhrases(idea.listing_text)) {
      pushPhrase(phrase, 'tradingview_listing_excerpt', idea.url, symbolContext);
    }
  }
  if (idea.articleBody) {
    for (const phrase of splitIntoPhrases(idea.articleBody)) {
      pushPhrase(phrase, 'tradingview_idea_body_sentence', idea.url, symbolContext);
    }
  }
  if (Array.isArray(idea.commentCandidates)) {
    for (const candidate of idea.commentCandidates) {
      for (const phrase of splitIntoPhrases(candidate)) {
        pushPhrase(phrase, 'tradingview_comment_candidate', idea.url, symbolContext);
      }
    }
  }
}

await writeNdjson(phrasesFile, rows);

const bySource = rows.reduce((acc, row) => {
  acc[row.source] = (acc[row.source] || 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({
  ok: true,
  ideaCount: ideas.length,
  phraseCount: rows.length,
  phrasesFile: path.relative(process.cwd(), phrasesFile),
  bySource,
}, null, 2));
