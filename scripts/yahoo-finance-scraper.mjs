import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  DEFAULT_USER_AGENT,
  buildTrainingRecord,
  ensureDir,
  extractAnchors,
  extractJsonLd,
  extractMetaTag,
  extractTitleTag,
  isUsablePhrase,
  normalizeWhitespace,
  parseArgs,
  safeSlug,
  sha1,
  sleep,
  splitIntoPhrases,
  writeJson,
  writeNdjson,
} from './tradingview-common.mjs';

const execFileAsync = promisify(execFile);

const args = parseArgs(process.argv.slice(2));
const outDir = path.resolve(args['out-dir'] || 'data/yahoo');
const rawTopicsDir = path.join(outDir, 'raw', 'topics');
const rawArticlesDir = path.join(outDir, 'raw', 'articles');
const indexFile = path.join(outDir, 'topic-index.ndjson');
const articlesFile = path.join(outDir, 'articles.ndjson');
const trainingFile = path.join(outDir, 'training-phrases.ndjson');
const reportFile = path.join(outDir, 'report.json');

const topicUrls = [
  'https://finance.yahoo.com/topic/crypto/',
  'https://finance.yahoo.com/topic/stock-market-news/',
];
const articleLimit = Number(args.limit || 120);
const minRows = Number(args['min-rows'] || 200);
const delayMs = Number(args.delay || 1200);

function isStrongLead(text) {
  const normalized = normalizeWhitespace(text);
  const words = normalized.split(/\s+/).filter(Boolean);
  return isUsablePhrase(normalized) && words.length >= 5 && normalized.length >= 28;
}

await ensureDir(rawTopicsDir);
await ensureDir(rawArticlesDir);

async function fetchYahooText(url) {
  const sentinel = '__CURL_EFFECTIVE_URL__:';
  const { stdout } = await execFileAsync('curl', [
    '-L',
    '-sS',
    '--compressed',
    '-A',
    DEFAULT_USER_AGENT,
    '-H',
    'accept: text/html,application/xhtml+xml',
    '-w',
    `\n${sentinel}%{url_effective}`,
    url,
  ], {
    maxBuffer: 15 * 1024 * 1024,
  });

  const markerIndex = stdout.lastIndexOf(`\n${sentinel}`);
  if (markerIndex === -1) {
    return {
      url,
      text: stdout,
    };
  }

  return {
    text: stdout.slice(0, markerIndex),
    url: stdout.slice(markerIndex + sentinel.length + 1).trim(),
  };
}

function normalizeYahooUrl(href, baseUrl) {
  const absolute = href.startsWith('http') ? href : new URL(href, baseUrl).toString();
  const url = new URL(absolute);
  url.search = '';
  url.hash = '';
  return url.toString();
}

function isYahooArticleUrl(url) {
  try {
    const parsed = new URL(url);
    if (!/yahoo\.com$/i.test(parsed.hostname) && !/finance\.yahoo\.com$/i.test(parsed.hostname)) return false;
    return /\/news\/.+\.html$/i.test(parsed.pathname)
      || /\/markets\/.+\/articles\/.+\.html$/i.test(parsed.pathname)
      || /\/video\/.+\.html$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function extractEmbeddedYahooStories(html) {
  const stories = [];
  const scripts = [...html.matchAll(/<script type="application\/json" data-sveltekit-fetched data-url="([^"]+)"[^>]*>([\s\S]*?)<\/script>/g)];

  for (const [, dataUrl, raw] of scripts) {
    if (!/\/xhr\/ncp\?/i.test(dataUrl) || !/topicsDetailFeed/i.test(dataUrl)) continue;
    try {
      const outer = JSON.parse(raw);
      const inner = JSON.parse(outer.body);
      const stream = inner?.data?.main?.stream || [];
      for (const item of stream) {
        const content = item?.content;
        if (!content || content.contentType !== 'STORY') continue;
        const title = normalizeWhitespace(content.title || '');
        const summary = normalizeWhitespace(content.summary || content.description || '');
        const articleUrl = normalizeWhitespace(
          content?.clickThroughUrl?.url
          || content?.canonicalUrl?.url
          || content?.providerContentUrl
          || '',
        );
        stories.push({
          article_url: articleUrl,
          discovered_headline: title || null,
          discovered_summary: summary || null,
          provider: normalizeWhitespace(content?.provider?.displayName || ''),
        });
      }
    } catch {
      // ignore malformed embedded payloads
    }
  }

  return stories;
}

function extractYahooTopicSummaries(html) {
  const topics = [];
  const scripts = [...html.matchAll(/<script type="application\/json" data-sveltekit-fetched data-url="([^"]+)"[^>]*>([\s\S]*?)<\/script>/g)];

  for (const [, dataUrl, raw] of scripts) {
    if (!/\/xhr\/config\?name=follow/i.test(dataUrl)) continue;
    try {
      const outer = JSON.parse(raw);
      const body = JSON.parse(outer.body);
      for (const item of body.followTopics || []) {
        const title = normalizeWhitespace(item.title || '');
        const summary = normalizeWhitespace(item.summary || item.metaDescription || '');
        if (!title || !summary) continue;
        topics.push({
          title,
          summary,
          topicName: item.topicName || null,
        });
      }
    } catch {
      // ignore malformed payloads
    }
  }

  return topics;
}

function discoverArticleLinks(html, topicUrl) {
  const byUrl = new Map();

  for (const anchor of extractAnchors(html)) {
    const text = normalizeWhitespace(anchor.text || '');
    const href = anchor.href || '';
    if (!href) continue;
    const url = normalizeYahooUrl(href, topicUrl);
    if (!isYahooArticleUrl(url)) continue;
    if (text.length < 12 || text.length > 220) continue;
    const prev = byUrl.get(url);
    if (!prev || text.length > prev.headline.length) {
      byUrl.set(url, {
        article_url: url,
        discovered_headline: text,
        topic_url: topicUrl,
      });
    }
  }

  const regex = /https:\/\/finance\.yahoo\.com\/news\/[^"'\\<>\s]+/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = normalizeYahooUrl(match[0], topicUrl);
    if (!isYahooArticleUrl(url) || byUrl.has(url)) continue;
    byUrl.set(url, {
      article_url: url,
      discovered_headline: null,
      topic_url: topicUrl,
      });
  }

  for (const story of extractEmbeddedYahooStories(html)) {
    const url = normalizeYahooUrl(story.article_url || '', topicUrl);
    if (!url || !isYahooArticleUrl(url)) continue;
    const prev = byUrl.get(url);
    if (!prev) {
      byUrl.set(url, {
        article_url: url,
        discovered_headline: story.discovered_headline,
        discovered_summary: story.discovered_summary,
        provider: story.provider || null,
        topic_url: topicUrl,
      });
      continue;
    }

    if (!prev.discovered_headline && story.discovered_headline) prev.discovered_headline = story.discovered_headline;
    if (!prev.discovered_summary && story.discovered_summary) prev.discovered_summary = story.discovered_summary;
    if (!prev.provider && story.provider) prev.provider = story.provider;
  }

  return Array.from(byUrl.values());
}

function extractParagraphsFromHtml(html) {
  const paragraphs = [];
  const regex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = normalizeWhitespace(match[1].replace(/<[^>]+>/g, ' '));
    if (isUsablePhrase(text)) paragraphs.push(text);
  }
  return paragraphs;
}

function parseYahooArticle(html, articleUrl, discoveredHeadline = null, discoveredSummary = null) {
  let title = extractMetaTag(html, 'property', 'og:title')
    || extractMetaTag(html, 'name', 'twitter:title')
    || extractTitleTag(html)
    || discoveredHeadline;
  let description = extractMetaTag(html, 'property', 'og:description')
    || extractMetaTag(html, 'name', 'description')
    || extractMetaTag(html, 'name', 'twitter:description');
  let articleBody = null;

  for (const entry of extractJsonLd(html)) {
    const items = Array.isArray(entry) ? entry : [entry];
    for (const item of items) {
      const bodyCandidate = normalizeWhitespace(item?.articleBody || item?.description || '');
      if (bodyCandidate && (!articleBody || bodyCandidate.length > articleBody.length)) {
        articleBody = bodyCandidate;
      }
      if (!title && item?.headline) title = normalizeWhitespace(item.headline);
      if (!description && item?.description) description = normalizeWhitespace(item.description);
    }
  }

  if (!articleBody) {
    const bodyCandidates = [];
    const propertyRegex = /"(?:articleBody|description|summary|content)":"((?:\\.|[^"\\]){60,6000})"/g;
    let match;
    while ((match = propertyRegex.exec(html)) !== null) {
      bodyCandidates.push(normalizeWhitespace(match[1]));
    }
    articleBody = bodyCandidates.sort((a, b) => b.length - a.length)[0] || null;
  }

  const paragraphCandidates = articleBody
    ? splitIntoPhrases(articleBody)
    : extractParagraphsFromHtml(html);

  const firstParagraph = paragraphCandidates.find((paragraph) => isStrongLead(paragraph))
    || (isStrongLead(discoveredSummary) ? normalizeWhitespace(discoveredSummary) : null);

  return {
    article_id: sha1(articleUrl),
    url: articleUrl,
    title: normalizeWhitespace(title || ''),
    description: normalizeWhitespace(description || ''),
    first_paragraph: firstParagraph,
  };
}

function pushTraining(rows, seen, text, sourceKind, sourceUrl, symbolContext) {
  const normalized = normalizeWhitespace(text);
  if (!isUsablePhrase(normalized)) return;
  const key = `${sourceKind}|${normalized.toLowerCase()}`;
  if (seen.has(key)) return;
  seen.add(key);
  rows.push(buildTrainingRecord(normalized, sourceKind, sourceUrl, symbolContext, { idPrefix: 'yf' }));
}

const topicIndex = [];
const discoveredByUrl = new Map();
const supplementalTopicSummaries = [];

for (const topicUrl of topicUrls) {
  const topicRes = await fetchYahooText(topicUrl);
  const rawName = `${safeSlug(topicUrl)}-${sha1(topicRes.url).slice(0, 8)}.html`;
  await writeFile(path.join(rawTopicsDir, rawName), topicRes.text, 'utf8');

  const links = discoverArticleLinks(topicRes.text, topicRes.url);
  const followTopics = extractYahooTopicSummaries(topicRes.text);
  for (const link of links) {
    if (!discoveredByUrl.has(link.article_url)) {
      discoveredByUrl.set(link.article_url, {
        ...link,
        discovered_at: new Date().toISOString(),
      });
    }
  }

  topicIndex.push({
    topic_url: topicUrl,
    final_url: topicRes.url,
    discovered_links: links.length,
    supplemental_topics: followTopics.length,
    fetched_at: new Date().toISOString(),
  });
  for (const topic of followTopics) {
    supplementalTopicSummaries.push({
      ...topic,
      topic_url: topicUrl,
    });
  }

  await sleep(delayMs);
}

const discoveredLinks = Array.from(discoveredByUrl.values()).slice(0, articleLimit);
const articles = [];
const trainingRows = [];
const seenTraining = new Set();

for (const link of discoveredLinks) {
  try {
    const articleRes = await fetchYahooText(link.article_url);
    const parsed = parseYahooArticle(
      articleRes.text,
      link.article_url,
      link.discovered_headline,
      link.discovered_summary,
    );
    const rawName = `${safeSlug(parsed.title || link.discovered_headline || 'article')}-${parsed.article_id.slice(0, 8)}.html`;
    await writeFile(path.join(rawArticlesDir, rawName), articleRes.text, 'utf8');

    const row = {
      ...link,
      ...parsed,
      fetched_at: new Date().toISOString(),
    };
    articles.push(row);

    pushTraining(trainingRows, seenTraining, row.title, 'yahoo_headline', row.url, row.title);
    if (row.first_paragraph) {
      pushTraining(trainingRows, seenTraining, row.first_paragraph, 'yahoo_first_paragraph', row.url, row.title);
    } else if (row.description) {
      pushTraining(trainingRows, seenTraining, row.description, 'yahoo_first_paragraph', row.url, row.title);
    } else if (row.discovered_summary) {
      pushTraining(trainingRows, seenTraining, row.discovered_summary, 'yahoo_first_paragraph', row.url, row.title);
    }
  } catch (error) {
    articles.push({
      ...link,
      fetch_error: error instanceof Error ? error.message : String(error),
      fetched_at: new Date().toISOString(),
    });
  }

  await sleep(delayMs);
}

if (trainingRows.length < minRows) {
  for (const topic of supplementalTopicSummaries) {
    if (trainingRows.length >= minRows) break;
    pushTraining(
      trainingRows,
      seenTraining,
      topic.summary,
      'yahoo_topic_summary',
      topic.topic_url,
      topic.title,
    );
  }
}

await writeNdjson(indexFile, discoveredLinks);
await writeNdjson(articlesFile, articles);
await writeNdjson(trainingFile, trainingRows);
await writeJson(reportFile, {
  generatedAt: new Date().toISOString(),
  topicUrls,
  articleLimit,
  discoveredLinks: discoveredLinks.length,
  articlesFetched: articles.filter((row) => !row.fetch_error).length,
  trainingRows: trainingRows.length,
  bySource: trainingRows.reduce((acc, row) => {
    acc[row.source] = (acc[row.source] || 0) + 1;
    return acc;
  }, {}),
  byLanguage: trainingRows.reduce((acc, row) => {
    acc[row.language] = (acc[row.language] || 0) + 1;
    return acc;
  }, {}),
  topics: topicIndex,
});

console.log(JSON.stringify({
  ok: true,
  discoveredLinks: discoveredLinks.length,
  articlesFetched: articles.filter((row) => !row.fetch_error).length,
  trainingRows: trainingRows.length,
  indexFile: path.relative(process.cwd(), indexFile),
  articlesFile: path.relative(process.cwd(), articlesFile),
  trainingFile: path.relative(process.cwd(), trainingFile),
}, null, 2));
