import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://egpixaunlnzauztbrnuz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/pro_waitlist`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ email: cleanEmail }),
    });

    if (resp.ok || resp.status === 201 || resp.status === 204) {
      return res.status(200).json({ status: 'ok' });
    }

    const body = await resp.text();
    if (body.includes('23505')) {
      return res.status(200).json({ status: 'ok' });
    }

    return res.status(500).json({ error: 'Failed to save' });
  } catch {
    return res.status(500).json({ error: 'Failed to save' });
  }
}
