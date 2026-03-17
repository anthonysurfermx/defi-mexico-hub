// ============================================================
// POST /api/bobby-voice-free
// Free TTS using Microsoft Edge Neural voices
// Zero cost, zero API key, high quality (same engine as Copilot)
// 3 distinct voices for multi-agent debate
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tts } from 'edge-tts';

// Multi-agent voices — Microsoft Neural (free, high quality)
const VOICE_PROFILES: Record<string, { voice: string; rate: string; pitch: string }> = {
  // Bobby CIO — authoritative, measured male (British English = sophisticated)
  cio: { voice: 'en-US-GuyNeural', rate: '+0%', pitch: '-5Hz' },
  // Alpha Hunter — confident, fast female (energetic)
  alpha: { voice: 'en-US-JennyNeural', rate: '+10%', pitch: '+2Hz' },
  // Red Team — deep, slow, skeptical male (grave, deliberate)
  redteam: { voice: 'en-GB-RyanNeural', rate: '-5%', pitch: '-10Hz' },
};

// Spanish voices
const VOICE_PROFILES_ES: Record<string, { voice: string; rate: string; pitch: string }> = {
  cio: { voice: 'es-MX-JorgeNeural', rate: '+0%', pitch: '-5Hz' },
  alpha: { voice: 'es-MX-DaliaNeural', rate: '+10%', pitch: '+2Hz' },
  redteam: { voice: 'es-ES-AlvaroNeural', rate: '-5%', pitch: '-10Hz' },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, voice = 'cio', lang = 'en' } = req.body as { text?: string; voice?: string; lang?: string };

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }

  const safeText = text.slice(0, 5000);
  const profiles = lang === 'es' ? VOICE_PROFILES_ES : VOICE_PROFILES;
  const profile = profiles[voice] || profiles.cio;

  try {
    const audioBuffer = await tts(safeText, {
      voice: profile.voice,
      rate: profile.rate,
      pitch: profile.pitch,
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24h — same text = same audio
    res.setHeader('Transfer-Encoding', 'chunked');
    res.send(audioBuffer);
  } catch (error) {
    console.error('[Voice Free] Error:', error);
    return res.status(502).json({ error: 'TTS generation failed' });
  }
}
