// ============================================================
// GET /api/blog-audio?slug=my-article
// Generate audio narration for blog articles via Edge TTS
// Caches in Supabase Storage — generates once, serves forever
// Inspired by The Economist's "Listen to this article"
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

const TTS_SERVER = process.env.TTS_SERVER_URL || 'http://143.110.194.171:8787/api/tts';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Voice for articles — professional narrator
const NARRATOR_VOICE = 'cio'; // Jorge MX for Spanish, Guy US for English
const MAX_TEXT_LENGTH = 15000; // ~7 min of audio

// Strip HTML and markdown to plain text
function cleanContent(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // scripts
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // styles
    .replace(/<[^>]+>/g, ' ') // all HTML tags
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // markdown links
    .replace(/[#*_~`>]/g, '') // markdown formatting
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Detect language from text
function detectLanguage(text: string): string {
  const spanishWords = (text.match(/\b(el|la|los|las|de|en|que|por|con|para|una|del|al|es|como|más|pero|su|se|ya|fue|han|ser|sin|sobre|entre|está|hay|desde|son|este|era|puede|todo|esta|sido|tiene|muy|también|otro|fue|donde)\b/gi) || []).length;
  const englishWords = (text.match(/\b(the|and|for|are|but|not|you|all|can|her|was|one|our|out|day|get|has|him|his|how|its|may|new|now|old|see|way|who|boy|did|oil|sit|top|two|war|ago|big|end|far|few|got|had|let|put|run|say|she|too|use)\b/gi) || []).length;
  return spanishWords > englishWords ? 'es' : 'en';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  const slug = req.query.slug as string;
  if (!slug) {
    return res.status(400).json({ error: 'slug parameter required' });
  }

  // Check Supabase cache first
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const cacheUrl = `${SUPABASE_URL}/storage/v1/object/public/blog-audio/${slug}.mp3`;
      const cacheCheck = await fetch(cacheUrl, { method: 'HEAD' });
      if (cacheCheck.ok) {
        // Redirect to cached audio
        res.setHeader('Location', cacheUrl);
        res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
        return res.status(302).end();
      }
    } catch { /* cache miss, generate fresh */ }
  }

  // Fetch article content from Supabase
  try {
    const articleRes = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?slug=eq.${slug}&select=title,content,content_html,excerpt,author`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );

    if (!articleRes.ok) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const articles = await articleRes.json();
    const article = articles[0];
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Build narration text
    const rawContent = article.content_html || article.content || '';
    const cleanText = cleanContent(rawContent);
    const lang = detectLanguage(cleanText);

    // Narration intro
    const intro = lang === 'es'
      ? `${article.title}. Por ${article.author || 'DeFi México'}. `
      : `${article.title}. By ${article.author || 'DeFi México'}. `;

    const narrationText = (intro + cleanText).slice(0, MAX_TEXT_LENGTH);

    // Generate audio via Edge TTS
    const ttsRes = await fetch(TTS_SERVER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: narrationText,
        voice: NARRATOR_VOICE,
        lang,
      }),
    });

    if (!ttsRes.ok) {
      return res.status(502).json({ error: 'TTS generation failed' });
    }

    const audioBuffer = await ttsRes.arrayBuffer();

    // Cache in Supabase Storage (fire and forget)
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        await fetch(`${SUPABASE_URL}/storage/v1/object/blog-audio/${slug}.mp3`, {
          method: 'POST',
          headers: {
            'Content-Type': 'audio/mpeg',
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'x-upsert': 'true',
          },
          body: audioBuffer,
        });
      } catch { /* cache save failed, non-blocking */ }
    }

    // Return audio
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.setHeader('Content-Length', audioBuffer.byteLength.toString());
    return res.status(200).send(Buffer.from(audioBuffer));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate article audio' });
  }
}
