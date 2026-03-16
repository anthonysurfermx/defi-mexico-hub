// ============================================================
// POST /api/bobby-voice
// ElevenLabs TTS streaming — Bobby's voice
// Returns audio/mpeg stream for direct playback
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';

// Multi-agent voice system — each agent has a distinct voice personality
const VOICE_PROFILES: Record<string, { id: string; stability: number; similarity: number; style: number }> = {
  // Bobby CIO — "Josh": confident, measured, authoritative (the boss)
  cio:     { id: process.env.ELEVENLABS_VOICE_ID || 'TxGEqnHWrfWFTfGW9XjX', stability: 0.35, similarity: 0.85, style: 0.3 },
  // Alpha Hunter — "Adam": energetic, fast, aggressive (the opportunist)
  alpha:   { id: 'pNInz6obpgDQGcFmaJgB', stability: 0.25, similarity: 0.80, style: 0.5 },
  // Red Team — "Antoni": deep, slow, skeptical (the risk manager)
  redteam: { id: 'ErXwobaYiN019PkySvjV', stability: 0.50, similarity: 0.85, style: 0.15 },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ELEVENLABS_API_KEY) {
    return res.status(503).json({ error: 'ElevenLabs API key not configured' });
  }

  const { text, voice } = req.body as { text?: string; voice?: string };

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }

  // Cap at 5000 chars to protect ElevenLabs quota
  const safeText = text.slice(0, 5000);

  try {
    const profile = VOICE_PROFILES[voice || 'cio'] || VOICE_PROFILES.cio;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${profile.id}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: safeText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: profile.stability,
            similarity_boost: profile.similarity,
            style: profile.style,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs error:', response.status, errorText);
      return res.status(502).json({ error: 'ElevenLabs API error', status: response.status });
    }

    // Stream audio back
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Transfer-Encoding', 'chunked');

    const reader = response.body?.getReader();
    if (!reader) {
      return res.status(502).json({ error: 'No audio stream' });
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
    } catch (streamError) {
      console.error('Audio stream error:', streamError);
    } finally {
      reader.releaseLock();
      res.end();
    }
  } catch (error) {
    console.error('Bobby voice error:', error);
    return res.status(502).json({ error: 'Failed to generate voice' });
  }
}
