// ============================================================
// POST /api/bobby-voice-free
// Free TTS using Microsoft Edge Neural voices via WebSocket
// Zero cost, zero API key, high quality (same engine as Copilot)
// Protocol implemented directly — no broken npm dependencies
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { WebSocket } from 'ws';
import { randomUUID } from 'crypto';

const BASE_URL = 'speech.platform.bing.com/consumer/speech/synthesize/readaloud';
const TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WS_URL = `wss://${BASE_URL}/edge/v1?TrustedClientToken=${TOKEN}`;

// Multi-agent voices — Microsoft Neural (free, high quality)
const VOICE_PROFILES: Record<string, { voice: string; rate: string; pitch: string }> = {
  cio:     { voice: 'en-US-GuyNeural',   rate: '+0%',  pitch: '-5Hz' },
  alpha:   { voice: 'en-US-JennyNeural', rate: '+10%', pitch: '+2Hz' },
  redteam: { voice: 'en-GB-RyanNeural',  rate: '-5%',  pitch: '-10Hz' },
};

const VOICE_PROFILES_ES: Record<string, { voice: string; rate: string; pitch: string }> = {
  cio:     { voice: 'es-MX-JorgeNeural', rate: '+0%',  pitch: '-5Hz' },
  alpha:   { voice: 'es-MX-DaliaNeural', rate: '+10%', pitch: '+2Hz' },
  redteam: { voice: 'es-ES-AlvaroNeural',rate: '-5%',  pitch: '-10Hz' },
};

function edgeTTS(text: string, voice: string, rate: string, pitch: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const connId = randomUUID().replaceAll('-', '');
    const ws = new WebSocket(`${WS_URL}&ConnectionId=${connId}`, {
      host: 'speech.platform.bing.com',
      origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
      },
    });

    const audioChunks: Buffer[] = [];
    const timeout = setTimeout(() => { ws.close(); reject(new Error('TTS timeout')); }, 15000);

    ws.on('message', (rawData: Buffer, isBinary: boolean) => {
      if (!isBinary) {
        const data = rawData.toString('utf8');
        if (data.includes('turn.end')) {
          clearTimeout(timeout);
          resolve(Buffer.concat(audioChunks));
          ws.close();
        }
        return;
      }
      const separator = 'Path:audio\r\n';
      const idx = rawData.indexOf(separator);
      if (idx >= 0) {
        audioChunks.push(rawData.subarray(idx + separator.length));
      }
    });

    ws.on('error', (err) => { clearTimeout(timeout); reject(err); });

    ws.on('open', () => {
      // Send speech config
      const speechConfig = JSON.stringify({
        context: { synthesis: { audio: {
          metadataoptions: { sentenceBoundaryEnabled: false, wordBoundaryEnabled: false },
          outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
        } } },
      });
      const configMsg = `X-Timestamp:${new Date().toISOString()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${speechConfig}`;

      ws.send(configMsg, { compress: true }, (err) => {
        if (err) { reject(err); return; }

        // Escape XML special chars in text
        const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // Send SSML
        const reqId = randomUUID().replaceAll('-', '');
        const ssml = `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date().toISOString()}Z\r\nPath:ssml\r\n\r\n`
          + `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>`
          + `<voice name='${voice}'><prosody pitch='${pitch}' rate='${rate}' volume='+0%'>`
          + `${safeText}</prosody></voice></speak>`;

        ws.send(ssml, { compress: true }, (ssmlErr) => {
          if (ssmlErr) reject(ssmlErr);
        });
      });
    });
  });
}

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
    const audioBuffer = await edgeTTS(safeText, profile.voice, profile.rate, profile.pitch);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(audioBuffer);
  } catch (error) {
    console.error('[Voice Free] Error:', error instanceof Error ? error.message : error);
    return res.status(502).json({ error: 'TTS generation failed' });
  }
}
