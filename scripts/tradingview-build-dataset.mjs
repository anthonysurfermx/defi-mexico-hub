import path from 'node:path';
import { parseArgs, readNdjson, writeNdjson, writeJson } from './tradingview-common.mjs';

const args = parseArgs(process.argv.slice(2));
const outDir = path.resolve(args['out-dir'] || 'data/tradingview');
const phrasesFile = path.join(outDir, 'phrases.ndjson');
const limit = Number(args.limit || 500);
const finalFile = path.resolve(args.out || 'data/training-phrases.ndjson');
const reportFile = path.join(outDir, 'dataset-report.json');

const phrases = await readNdjson(phrasesFile);

const sourceOrder = [
  'tradingview_comment_candidate',
  'tradingview_comments_hub_excerpt',
  'tradingview_idea_title',
  'tradingview_idea_description',
  'tradingview_listing_excerpt',
  'tradingview_idea_body_sentence',
];
const languageOrder = ['es', 'en'];

function scoreRow(row) {
  let score = 0;
  if (/[?¿]/.test(row.text)) score += 30;
  if (/\b(?:should|what|why|how|when|where|can|is|are|will|qué|cómo|cuándo|dónde|por qué|conviene)\b/i.test(row.text)) score += 20;
  if (row.word_count >= 4 && row.word_count <= 18) score += 10;
  if (row.expected_intent === 'trade_chat') score += 5;
  return score;
}

const buckets = new Map();
for (const source of sourceOrder) {
  for (const language of languageOrder) {
    buckets.set(`${source}::${language}`, []);
  }
  buckets.set(`${source}::__other__`, []);
}
for (const row of phrases) {
  const language = languageOrder.includes(row.language) ? row.language : '__other__';
  const bucket = buckets.get(`${row.source}::${language}`);
  if (bucket) bucket.push(row);
}

for (const rows of buckets.values()) {
  rows.sort((a, b) => {
    const scoreDelta = scoreRow(b) - scoreRow(a);
    if (scoreDelta !== 0) return scoreDelta;
    const intentDelta = a.expected_intent.localeCompare(b.expected_intent);
    if (intentDelta !== 0) return intentDelta;
    const wordDelta = a.word_count - b.word_count;
    if (wordDelta !== 0) return wordDelta;
    return a.id.localeCompare(b.id);
  });
}

const finalRows = [];
const seenText = new Set();
const byIntent = {};
const byLanguage = {};
const byType = {};
const bySource = {};

let madeProgress = true;
while (finalRows.length < limit && madeProgress) {
  madeProgress = false;
  for (const source of sourceOrder) {
    let pickedFromSource = false;
    for (const language of [...languageOrder, '__other__']) {
      const bucket = buckets.get(`${source}::${language}`) || [];
      while (bucket.length > 0) {
        const row = bucket.shift();
        const textKey = row.text.toLowerCase();
        if (seenText.has(textKey)) continue;
        seenText.add(textKey);
        finalRows.push(row);
        byIntent[row.expected_intent] = (byIntent[row.expected_intent] || 0) + 1;
        byLanguage[row.language] = (byLanguage[row.language] || 0) + 1;
        byType[row.question_type] = (byType[row.question_type] || 0) + 1;
        bySource[row.source] = (bySource[row.source] || 0) + 1;
        madeProgress = true;
        pickedFromSource = true;
        break;
      }
      if (pickedFromSource || finalRows.length >= limit) break;
    }
    if (finalRows.length >= limit) break;
  }
}

await writeNdjson(finalFile, finalRows);
await writeJson(reportFile, {
  generatedAt: new Date().toISOString(),
  inputPhrases: phrases.length,
  outputRows: finalRows.length,
  byIntent,
  byLanguage,
  byQuestionType: byType,
  bySource,
  finalFile: path.relative(process.cwd(), finalFile),
});

console.log(JSON.stringify({
  ok: true,
  inputPhrases: phrases.length,
  outputRows: finalRows.length,
  finalFile: path.relative(process.cwd(), finalFile),
  reportFile: path.relative(process.cwd(), reportFile),
}, null, 2));
