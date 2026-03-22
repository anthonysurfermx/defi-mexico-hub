import path from 'node:path';
import {
  buildTrainingRecord,
  ensureDir,
  fetchJson,
  isUsablePhrase,
  normalizeWhitespace,
  parseArgs,
  sha1,
  sleep,
  splitCsvArg,
  splitIntoPhrases,
  writeJson,
  writeNdjson,
} from './tradingview-common.mjs';

const args = parseArgs(process.argv.slice(2));
const outDir = path.resolve(args['out-dir'] || 'data/reddit');
const rawDir = path.join(outDir, 'raw');
const postsFile = path.join(outDir, 'posts.ndjson');
const commentsFile = path.join(outDir, 'comments.ndjson');
const trainingFile = path.join(outDir, 'training-phrases.ndjson');
const reportFile = path.join(outDir, 'report.json');

const subreddits = splitCsvArg(args.subreddits, ['wallstreetbets', 'cryptocurrency', 'stocks']);
const postsPerSub = Number(args['posts-per-sub'] || 40);
const commentsPerPost = Number(args['comments-per-post'] || 10);
const delayMs = Number(args.delay || 800);
const sort = String(args.sort || 'top');
const timeRange = String(args.time || args.t || 'month');

await ensureDir(rawDir);

function buildListingUrl(subreddit) {
  const url = new URL(`https://www.reddit.com/r/${subreddit}/${sort}.json`);
  url.searchParams.set('limit', String(postsPerSub));
  url.searchParams.set('raw_json', '1');
  if (sort === 'top' || sort === 'controversial') {
    url.searchParams.set('t', timeRange);
  }
  return url.toString();
}

function buildCommentsUrl(permalink) {
  const url = new URL(`https://www.reddit.com${permalink}.json`);
  url.searchParams.set('limit', String(commentsPerPost));
  url.searchParams.set('sort', 'top');
  url.searchParams.set('depth', '1');
  url.searchParams.set('raw_json', '1');
  return url.toString();
}

function flattenTopComments(children, acc = []) {
  for (const child of children || []) {
    if (child?.kind !== 't1' || !child.data) continue;
    const body = normalizeWhitespace(child.data.body || '');
    if (body && !['[deleted]', '[removed]'].includes(body.toLowerCase())) {
      acc.push({
        commentId: child.data.id,
        body,
        score: child.data.score ?? 0,
        permalink: child.data.permalink || null,
        author: child.data.author || null,
        created_utc: child.data.created_utc || null,
      });
    }
  }
  return acc;
}

function pushTraining(rows, seen, text, sourceKind, sourceUrl, symbolContext) {
  const normalized = normalizeWhitespace(text);
  if (!isUsablePhrase(normalized)) return;
  const key = `${sourceKind}|${normalized.toLowerCase()}`;
  if (seen.has(key)) return;
  seen.add(key);
  rows.push(buildTrainingRecord(normalized, sourceKind, sourceUrl, symbolContext, { idPrefix: 'rd' }));
}

const posts = [];
const comments = [];
const trainingRows = [];
const seenTraining = new Set();
const subReports = [];

for (const subreddit of subreddits) {
  const listingUrl = buildListingUrl(subreddit);
  const listingRes = await fetchJson(listingUrl, {
    retries: 2,
    timeoutMs: 20000,
    headers: {
      accept: 'application/json',
    },
  });

  const children = listingRes.json?.data?.children || [];
  const subredditPosts = [];
  let commentCountForSub = 0;

  for (const child of children) {
    if (child?.kind !== 't3' || !child.data) continue;
    const post = child.data;
    const permalink = post.permalink || `/r/${subreddit}/comments/${post.id}/`;
    const postUrl = `https://www.reddit.com${permalink}`;
    const postRow = {
      post_id: post.id,
      subreddit,
      title: normalizeWhitespace(post.title || ''),
      selftext: normalizeWhitespace(post.selftext || ''),
      score: post.score ?? 0,
      num_comments: post.num_comments ?? 0,
      permalink,
      url: postUrl,
      author: post.author || null,
      created_utc: post.created_utc || null,
      fetched_at: new Date().toISOString(),
    };

    posts.push(postRow);
    subredditPosts.push(postRow);
    pushTraining(trainingRows, seenTraining, postRow.title, 'reddit_post_title', postUrl, postRow.title);

    try {
      const commentsRes = await fetchJson(buildCommentsUrl(permalink), {
        retries: 1,
        timeoutMs: 20000,
        headers: {
          accept: 'application/json',
        },
      });

      const commentListing = Array.isArray(commentsRes.json) ? commentsRes.json[1] : null;
      const topComments = flattenTopComments(commentListing?.data?.children || [])
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, commentsPerPost);

      for (const comment of topComments) {
        const row = {
          ...comment,
          subreddit,
          post_id: post.id,
          post_title: postRow.title,
          source_url: comment.permalink ? `https://www.reddit.com${comment.permalink}` : postUrl,
          fetched_at: new Date().toISOString(),
        };
        comments.push(row);
        commentCountForSub += 1;
        for (const phrase of splitIntoPhrases(comment.body)) {
          pushTraining(trainingRows, seenTraining, phrase, 'reddit_comment', row.source_url, postRow.title);
        }
      }
    } catch (error) {
      comments.push({
        subreddit,
        post_id: post.id,
        post_title: postRow.title,
        source_url: postUrl,
        fetch_error: error instanceof Error ? error.message : String(error),
        fetched_at: new Date().toISOString(),
      });
    }

    await sleep(delayMs);
  }

  subReports.push({
    subreddit,
    posts: subredditPosts.length,
    comments: commentCountForSub,
    listing_url: listingUrl,
  });
}

await writeNdjson(postsFile, posts);
await writeNdjson(commentsFile, comments);
await writeNdjson(trainingFile, trainingRows);
await writeJson(reportFile, {
  generatedAt: new Date().toISOString(),
  subreddits,
  postsPerSub,
  commentsPerPost,
  posts: posts.length,
  comments: comments.filter((row) => row.commentId).length,
  trainingRows: trainingRows.length,
  bySource: trainingRows.reduce((acc, row) => {
    acc[row.source] = (acc[row.source] || 0) + 1;
    return acc;
  }, {}),
  byLanguage: trainingRows.reduce((acc, row) => {
    acc[row.language] = (acc[row.language] || 0) + 1;
    return acc;
  }, {}),
  subReports,
});

console.log(JSON.stringify({
  ok: true,
  subreddits,
  posts: posts.length,
  comments: comments.filter((row) => row.commentId).length,
  trainingRows: trainingRows.length,
  postsFile: path.relative(process.cwd(), postsFile),
  commentsFile: path.relative(process.cwd(), commentsFile),
  trainingFile: path.relative(process.cwd(), trainingFile),
}, null, 2));
