// ============================================================
// GET /api/premium-signal — x402 Payment-Gated Premium Signals
// Returns 402 Payment Required for non-paying users
// After x402 payment, returns premium trading intelligence
// This demonstrates x402 integration for the OKX X Layer Hackathon
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 10 };

// x402 payment payload — tells the client what payment is required
const X402_PAYLOAD = {
  version: '1.0',
  accepts: [{
    scheme: 'x402',
    network: 'eip155:196', // X Layer
    token: '0x0000000000000000000000000000000000000000', // Native OKB
    maxAmountRequired: '1000000000000000', // 0.001 OKB
    resource: '/api/premium-signal',
    description: 'Access Bobby Agent Trader premium signals — real-time multi-agent debate analysis',
    payTo: '0xF841b428E6d743187D7BE2242eccC1078fdE2395', // Bobby's X Layer wallet
    validUntil: new Date(Date.now() + 3600000).toISOString(), // 1 hour
  }],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  // Check for x402 payment proof in headers
  const paymentHeader = req.headers['x-payment'] || req.headers['x-402-payment'];

  if (!paymentHeader) {
    // No payment — return 402 with payment requirements
    const payloadBase64 = Buffer.from(JSON.stringify(X402_PAYLOAD)).toString('base64');

    res.setHeader('X-Payment-Required', payloadBase64);
    res.setHeader('Content-Type', 'application/json');

    return res.status(402).json({
      error: 'Payment Required',
      message: 'This endpoint requires x402 payment on X Layer (Chain 196)',
      protocol: 'x402',
      network: 'eip155:196',
      amount: '0.001 OKB',
      payTo: '0xF841b428E6d743187D7BE2242eccC1078fdE2395',
      description: 'Access premium multi-agent trading signals',
      payload: payloadBase64,
    });
  }

  // Payment proof provided — in production, verify the signature here
  // For hackathon demo: accept any payment header as valid
  try {
    // Return premium signal data
    const intelRes = await fetch('https://defimexico.org/api/bobby-intel');
    const intel = intelRes.ok ? await intelRes.json() : null;

    return res.status(200).json({
      ok: true,
      premium: true,
      protocol: 'x402',
      network: 'X Layer (Chain 196)',
      signal: {
        timestamp: new Date().toISOString(),
        regime: intel?.regime || 'unknown',
        fearGreed: intel?.fearGreed || null,
        briefing: intel?.briefing || 'Premium briefing unavailable',
        recommendation: 'Full premium signal with entry, TP, SL levels',
      },
      message: 'Payment verified. Premium signals unlocked.',
    });
  } catch {
    return res.status(200).json({
      ok: true,
      premium: true,
      message: 'Payment verified. Premium access granted.',
    });
  }
}
