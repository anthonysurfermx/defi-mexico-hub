// api/content-machine.ts
// Content Machine — Vercel serverless function
// POST /api/content-machine
//
// Recibe: { job_id: string } como JSON
// El frontend ya guardó input_text en Supabase y subió el audio a Storage.
// Esta función lee todo desde Supabase y genera los 6 outputs con Claude.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Descargar audio desde Supabase Storage y transcribir ────────────────────

async function transcribeFromStorage(storagePath: string): Promise<string> {
  // Descargar el archivo desde Supabase Storage
  const { data, error } = await supabase.storage
    .from('content-machine-audio')
    .download(storagePath);

  if (error || !data) throw new Error(`Error descargando audio: ${error?.message}`);

  // Escribir a archivo temporal
  const tmpPath = path.join(os.tmpdir(), `audio-${Date.now()}.mp3`);
  const buffer = Buffer.from(await data.arrayBuffer());
  fs.writeFileSync(tmpPath, buffer);

  try {
    const fileStream = fs.createReadStream(tmpPath);
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
      language: 'es',
      response_format: 'text',
    });
    return transcription as unknown as string;
  } finally {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
  }
}

// ─── Generar los 6 outputs con Claude ────────────────────────────────────────

function buildPrompt(transcript: string, inputText: string, sourceLabel: string, topic: string, audience: string): string {
  const combinedInput = [transcript, inputText].filter(Boolean).join('\n\n---\n\n');

  return `Eres el Content Machine de Anthony Chávez (DeFi Mexico Hub).

CONTEXTO DEL INPUT:
- Fuente: ${sourceLabel || 'NotebookLM Audio Overview'}
- Tema central: ${topic || 'DeFi / Web3 LATAM'}
- Audiencia objetivo: ${audience || 'founders LATAM'}

INPUT TRANSCRITO:
${combinedInput}

Genera los 6 outputs del Output Matrix en el siguiente orden. Sé exhaustivo y completo en cada output — cada uno debe estar listo para publicarse sin edición mayor.

---

## OUTPUT 1 — LinkedIn Post (Inglés)

Formato: Hook (1 línea brutal) + 3 insights con datos + CTA
Longitud: 150-250 palabras
REGLA DE ORO: NO empezar con "I". NO jerga técnica en el hook.
Hook formula: [Número/Dato impactante] + [Consecuencia inesperada]
CTA siempre termina con: link a defimexico.org o a YouTube
Tono: Directo, datos primero, voz de founder que ya lo hizo

---

## OUTPUT 2 — LinkedIn Article (Inglés)

Formato: Título SEO + Intro gancho + 3 secciones H2 + Conclusión + CTA
Longitud: 700-900 palabras COMPLETAS (no outline, desarrollar todo)
Objetivo: Posicionarme como Top Voice en DeFi/Web3 LATAM
Incluir: al menos 1 dato original o perspectiva que nadie más tiene
Cerrar siempre con: conexión al mercado LATAM o a mi experiencia directa

---

## OUTPUT 3 — Twitter Thread (Español)

Formato: Tweet 1 = Hook brutal (sin "hilo:" ni "🧵") + 5-6 tweets de desarrollo + Tweet final con pregunta
Cada tweet máx 260 chars
Tweet 1 debe funcionar solo, sin contexto del thread
Al menos 2 métricas reales o específicas en el thread
Cierre: pregunta que invite a debatir

Numera cada tweet: [1/7], [2/7], etc.

---

## OUTPUT 4 — Twitter Post Corto (Español)

1 insight brutal en 1-2 líneas + link
Máx 180 chars + link
CTA a YouTube, defimexico.org o LinkedIn Article
NO usar link acortadores

---

## OUTPUT 5 — Video Script + Prompts Veo 3 (Español)

Formato exacto:

[HOOK — 5s]
Texto: [frase que para el scroll]
Visual Veo 3: Anime cyberpunk aesthetic, 1988 Japanese animation style inspired by Akira and Ghost in the Shell. [descripción de acción]. Color palette: neon pink (#FC72FF), deep blue (#0a0a2e), black, rain reflections. [tipo de plano]. Neon city of CDMX in background with DeFi protocol nodes as glowing infrastructure. Rain + neon light reflections. High contrast. Film grain 16mm. No text overlays. No music. Sound effects only. Aspect ratio: 9:16 vertical. Duration: 5s.
SFX: [sonido sugerido]

[PUNTO 1 — 20s]
Texto: [el dato más sorprendente]
Visual Veo 3: [mismo formato con descripción de escena]
SFX: [sonido]

[PUNTO 2 — 20s]
Texto: [la mecánica / cómo funciona]
Visual Veo 3: [descripción]
SFX: [sonido]

[PUNTO 3 — 20s]
Texto: [por qué importa para LATAM]
Visual Veo 3: [descripción]
SFX: [sonido]

[CTA — 10s]
Texto: [dónde aprender más, link a defimexico.org]
Visual Veo 3: [descripción]
SFX: [sonido]

---

## OUTPUT 6 — Artículo defimexico.org (Español)

Formato:
- H1: [título con keyword principal]
- Meta-descripción: [155 chars max con keyword]
- H2 Intro: [párrafo de 100 palabras desarrollado]
- H2: [Sección 1 — el concepto central]
- H2: ¿Por qué importa en LATAM?
- H2: [Sección 3 — implicaciones prácticas]
- CTA final: [hacia defimexico.org o video de YouTube]

SEO: incluir keyword principal 3 veces natural
Desarrollar cada sección con al menos 150 palabras.

---

REGLAS GLOBALES:
- Mantén la voz de Anthony (founder que ya lo construyó, no que está aprendiendo)
- Prioriza datos específicos sobre generalidades
- Conecta todo al contexto LATAM
- En español: tono de amigo experto, no profesor académico
- NUNCA: "Hilo:", "🧵", "Excited to share", bullets genéricos sin datos`;
}

async function generateOutputs(
  transcript: string,
  inputText: string,
  sourceLabel: string,
  topic: string,
  audience: string
): Promise<{
  linkedin_post: string;
  linkedin_article: string;
  twitter_thread: string;
  twitter_post: string;
  video_script: string;
  defimexico_article: string;
}> {
  const prompt = buildPrompt(transcript, inputText, sourceLabel, topic, audience);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });

  const fullText = message.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('');

  const extract = (start: string, end: string | null): string => {
    const startIdx = fullText.indexOf(start);
    if (startIdx === -1) return '';
    const from = startIdx + start.length;
    const endIdx = end ? fullText.indexOf(end, from) : fullText.length;
    return fullText.slice(from, endIdx === -1 ? fullText.length : endIdx).trim();
  };

  return {
    linkedin_post: extract('## OUTPUT 1 — LinkedIn Post (Inglés)', '## OUTPUT 2'),
    linkedin_article: extract('## OUTPUT 2 — LinkedIn Article (Inglés)', '## OUTPUT 3'),
    twitter_thread: extract('## OUTPUT 3 — Twitter Thread (Español)', '## OUTPUT 4'),
    twitter_post: extract('## OUTPUT 4 — Twitter Post Corto (Español)', '## OUTPUT 5'),
    video_script: extract('## OUTPUT 5 — Video Script + Prompts Veo 3 (Español)', '## OUTPUT 6'),
    defimexico_article: extract('## OUTPUT 6 — Artículo defimexico.org (Español)', null),
  };
}

// ─── Handler principal ────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let jobId: string | undefined;

  try {
    // Recibir job_id como JSON — Vercel parsea el body automáticamente
    const body = req.body as { job_id?: string };
    jobId = body?.job_id;

    if (!jobId) return res.status(400).json({ error: 'job_id es requerido' });

    // Leer todos los datos del job desde Supabase
    const { data: jobData, error: jobFetchError } = await supabase
      .from('content_machine_jobs')
      .select('input_text, source_label, topic, audience, audio_storage_path, audio_filename')
      .eq('id', jobId)
      .single();

    if (jobFetchError || !jobData) {
      return res.status(404).json({ error: 'Job no encontrado' });
    }

    const sourceLabel = jobData.source_label || '';
    const topic = jobData.topic || '';
    const audience = jobData.audience || 'founders-latam';
    const inputText = jobData.input_text || '';
    const audioStoragePath: string | null = jobData.audio_storage_path || null;

    // Marcar como transcribiendo
    await supabase
      .from('content_machine_jobs')
      .update({ status: 'transcribing', processing_started_at: new Date().toISOString() })
      .eq('id', jobId);

    // Transcribir audio desde Supabase Storage si hay un archivo subido
    let transcript = '';
    if (audioStoragePath) {
      transcript = await transcribeFromStorage(audioStoragePath);
      await supabase
        .from('content_machine_jobs')
        .update({ raw_transcript: transcript })
        .eq('id', jobId);
    }

    if (!transcript && !inputText) {
      await supabase
        .from('content_machine_jobs')
        .update({ status: 'error', error_message: 'Se requiere audio o texto como input' })
        .eq('id', jobId);
      return res.status(400).json({ error: 'Se requiere audio o texto como input' });
    }

    // Marcar como generando
    await supabase
      .from('content_machine_jobs')
      .update({ status: 'generating' })
      .eq('id', jobId);

    // Generar los 6 outputs
    const outputs = await generateOutputs(transcript, inputText, sourceLabel, topic, audience);

    // Guardar outputs y marcar como done
    await supabase
      .from('content_machine_jobs')
      .update({
        status: 'done',
        output_linkedin_post: outputs.linkedin_post,
        output_linkedin_article: outputs.linkedin_article,
        output_twitter_thread: outputs.twitter_thread,
        output_twitter_post: outputs.twitter_post,
        output_video_script: outputs.video_script,
        output_defimexico_article: outputs.defimexico_article,
        processing_finished_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    return res.status(200).json({
      ok: true,
      job_id: jobId,
      outputs,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[ContentMachine] ERROR', msg);

    if (jobId) {
      await supabase
        .from('content_machine_jobs')
        .update({ status: 'error', error_message: msg })
        .eq('id', jobId);
    }

    return res.status(500).json({ ok: false, error: msg });
  }
}
