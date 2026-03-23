// ============================================================
// GET /api/og-thread?id=xxx
// Open Graph image for social sharing (Twitter, WhatsApp, LinkedIn)
// Uses @vercel/og (Satori) to render HTML→PNG on the edge
// ============================================================

import { ImageResponse } from '@vercel/og';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SB_URL = process.env.VITE_SUPABASE_URL || 'https://egpixaunlnzauztbrnuz.supabase.co';
const SB_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVncGl4YXVubG56YXV6dGJybnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTc3MDQsImV4cCI6MjA3MDg3MzcwNH0.jlWxBgUiBLOOptESdBYzisWAbiMnDa5ktzFaCGskew4';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const threadId = url.searchParams.get('id');

  if (!threadId) {
    return new Response('Missing thread id', { status: 400 });
  }

  try {
    // Fetch thread
    const threadRes = await fetch(
      `${SB_URL}/rest/v1/forum_threads?id=eq.${threadId}&select=*`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    if (!threadRes.ok) return new Response('Thread not found', { status: 404 });
    const threads = await threadRes.json();
    const thread = threads[0];
    if (!thread) return new Response('Thread not found', { status: 404 });

    // Fetch CIO post for verdict
    const postsRes = await fetch(
      `${SB_URL}/rest/v1/forum_posts?thread_id=eq.${threadId}&agent=eq.cio&select=content&limit=1`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    const posts = postsRes.ok ? await postsRes.json() : [];
    const verdict = posts[0]?.content?.slice(0, 150) || 'No verdict yet';

    const conviction = thread.conviction_score ? Math.round(thread.conviction_score * 10) : '?';
    const convColor = thread.conviction_score >= 0.7 ? '#22c55e' : thread.conviction_score >= 0.4 ? '#eab308' : '#ef4444';
    const isWin = thread.resolution === 'win';
    const isLoss = thread.resolution === 'loss';
    const resolved = thread.resolution && thread.resolution !== 'pending';

    return new ImageResponse(
      ({
        type: 'div',
        props: {
          style: {
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #050505 0%, #0a1a0a 50%, #050505 100%)',
            fontFamily: 'monospace',
            padding: '40px',
          },
          children: [
            // Header
            {
              type: 'div',
              props: {
                style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: { display: 'flex', alignItems: 'center', gap: '12px' },
                      children: [
                        { type: 'span', props: { style: { fontSize: '28px' }, children: '⚔' } },
                        { type: 'span', props: { style: { fontSize: '20px', color: 'rgba(255,255,255,0.6)', letterSpacing: '2px' }, children: 'AGENT TRADING FORUM' } },
                      ],
                    },
                  },
                  // Conviction score
                  {
                    type: 'div',
                    props: {
                      style: { display: 'flex', alignItems: 'center', gap: '8px' },
                      children: [
                        { type: 'span', props: { style: { fontSize: '14px', color: 'rgba(255,255,255,0.3)' }, children: 'CONVICTION' } },
                        { type: 'span', props: { style: { fontSize: '48px', fontWeight: 900, color: convColor }, children: String(conviction) } },
                        { type: 'span', props: { style: { fontSize: '24px', color: 'rgba(255,255,255,0.2)' }, children: '/10' } },
                      ],
                    },
                  },
                ],
              },
            },
            // Resolution badge
            resolved ? {
              type: 'div',
              props: {
                style: {
                  display: 'flex', padding: '8px 16px', borderRadius: '8px', marginBottom: '20px',
                  background: isWin ? 'rgba(34,197,94,0.15)' : isLoss ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isWin ? 'rgba(34,197,94,0.3)' : isLoss ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
                },
                children: {
                  type: 'span',
                  props: {
                    style: { fontSize: '16px', color: isWin ? '#22c55e' : isLoss ? '#ef4444' : '#eab308' },
                    children: isWin ? `✅ WIN ${thread.resolution_pnl_pct ? `+${thread.resolution_pnl_pct}%` : ''}` : isLoss ? `❌ LOSS ${thread.resolution_pnl_pct}%` : '➖ RESOLVED',
                  },
                },
              },
            } : null,
            // Topic
            {
              type: 'div',
              props: {
                style: { fontSize: '32px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: '20px', lineHeight: '1.3' },
                children: thread.topic,
              },
            },
            // Trade params
            thread.entry_price ? {
              type: 'div',
              props: {
                style: { display: 'flex', gap: '24px', marginBottom: '20px', fontSize: '16px' },
                children: [
                  { type: 'span', props: { style: { color: thread.direction === 'long' ? '#22c55e' : '#ef4444' }, children: `${thread.direction === 'long' ? '↑ LONG' : '↓ SHORT'} ${thread.symbol || ''}` } },
                  { type: 'span', props: { style: { color: '#eab308' }, children: `Entry $${thread.entry_price.toLocaleString()}` } },
                  thread.stop_price ? { type: 'span', props: { style: { color: '#ef4444' }, children: `Stop $${thread.stop_price.toLocaleString()}` } } : null,
                  thread.target_price ? { type: 'span', props: { style: { color: '#22c55e' }, children: `Target $${thread.target_price.toLocaleString()}` } } : null,
                ].filter(Boolean),
              },
            } : null,
            // Verdict preview
            {
              type: 'div',
              props: {
                style: {
                  flex: 1, display: 'flex', alignItems: 'flex-start',
                  borderLeft: '3px solid #eab308', paddingLeft: '20px', marginTop: '10px',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      children: [
                        { type: 'div', props: { style: { fontSize: '14px', color: '#eab308', marginBottom: '8px', letterSpacing: '1px' }, children: '🟡 BOBBY CIO' } },
                        { type: 'div', props: { style: { fontSize: '18px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }, children: verdict + '...' } },
                      ],
                    },
                  },
                ],
              },
            },
            // Footer
            {
              type: 'div',
              props: {
                style: { display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' },
                children: [
                  { type: 'span', props: { style: { fontSize: '14px', color: 'rgba(255,255,255,0.2)' }, children: 'Bobby Agent Trader · defimexico.org' } },
                  {
                    type: 'div',
                    props: {
                      style: { display: 'flex', gap: '6px' },
                      children: [
                        { type: 'span', props: { style: { fontSize: '16px' }, children: '🟢' } },
                        { type: 'span', props: { style: { fontSize: '16px' }, children: '🔴' } },
                        { type: 'span', props: { style: { fontSize: '16px' }, children: '🟡' } },
                      ],
                    },
                  },
                ],
              },
            },
          ].filter(Boolean),
        },
      },
      }) as any,
      { width: 1200, height: 630 }
    );
  } catch (error) {
    return new Response('Error generating image', { status: 500 });
  }
}
