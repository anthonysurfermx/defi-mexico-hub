import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectIntent } from '../src/lib/router/detectIntent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DATASET_FILES = [
  path.join(rootDir, 'data', 'training-phrases.ndjson'),
  path.join(rootDir, 'data', 'yahoo', 'training-phrases.ndjson'),
];

const OUTPUT_FILE = path.join(rootDir, 'data', 'router-benchmark-results.json');
const MAX_FAILS = 20;

function readNdjson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return [];
  return raw.split('\n').map(line => JSON.parse(line));
}

function normalizePredictedIntent(intent) {
  if (intent === 'chat') return 'trade_chat';
  return intent;
}

function aggregateFails(fails) {
  const grouped = new Map();

  for (const fail of fails) {
    const key = `${fail.expected} -> ${fail.predicted}`;
    const current = grouped.get(key) || {
      expected: fail.expected,
      predicted: fail.predicted,
      count: 0,
      sample: fail.text,
      source: fail.source,
    };
    current.count += 1;
    grouped.set(key, current);
  }

  return [...grouped.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_FAILS);
}

function formatPct(value) {
  return `${(value * 100).toFixed(2)}%`;
}

const rows = DATASET_FILES.flatMap(filePath =>
  readNdjson(filePath).map(row => ({
    ...row,
    dataset: path.relative(rootDir, filePath),
  }))
);

const failures = [];
const byIntent = {};
let correct = 0;
let ambiguous = 0;

for (const row of rows) {
  const rawIntent = detectIntent(row.text || '');
  const predicted = normalizePredictedIntent(rawIntent);
  const expected = row.expected_intent;

  if (!byIntent[expected]) {
    byIntent[expected] = { total: 0, correct: 0 };
  }

  byIntent[expected].total += 1;

  if (rawIntent === 'ambiguous') {
    ambiguous += 1;
  }

  if (predicted === expected) {
    correct += 1;
    byIntent[expected].correct += 1;
  } else {
    failures.push({
      text: row.text,
      expected,
      predicted,
      rawIntent,
      source: row.source || row.source_kind || row.dataset,
      dataset: row.dataset,
    });
  }
}

const total = rows.length;
const accuracy = total > 0 ? correct / total : 0;
const ambiguousRate = total > 0 ? ambiguous / total : 0;
const topFails = aggregateFails(failures);
const perIntent = Object.fromEntries(
  Object.entries(byIntent).map(([intent, stats]) => [
    intent,
    {
      total: stats.total,
      accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
    },
  ])
);

const report = {
  generatedAt: new Date().toISOString(),
  datasets: DATASET_FILES.map(filePath => path.relative(rootDir, filePath)),
  totalRows: total,
  accuracy,
  ambiguousRate,
  perIntent,
  topFails,
};

fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(report, null, 2)}\n`);

console.log('Router benchmark');
console.log(`Rows: ${total}`);
console.log(`Accuracy: ${formatPct(accuracy)}`);
console.log(`Ambiguous rate: ${formatPct(ambiguousRate)}`);
console.log('');
console.log('Top 20 fails');
for (const fail of topFails) {
  console.log(`- ${fail.expected} -> ${fail.predicted} (${fail.count})`);
  console.log(`  sample: ${fail.sample}`);
  console.log(`  source: ${fail.source}`);
}
console.log('');
console.log(`JSON report: ${path.relative(rootDir, OUTPUT_FILE)}`);
