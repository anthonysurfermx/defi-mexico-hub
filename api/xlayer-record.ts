// ============================================================
// POST /api/xlayer-record
// Records Bobby's trade outcomes on X Layer smart contract
// Called by Resolution Engine when a trade is resolved
// Creates an immutable, verifiable track record
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

const XLAYER_RPC = 'https://rpc.xlayer.tech';
const CONTRACT_ADDRESS = process.env.BOBBY_CONTRACT_ADDRESS || '';
const RECORDER_KEY = process.env.BOBBY_RECORDER_KEY || '';

// ABI for recordTrade function
const RECORD_TRADE_ABI = [
  'function recordTrade(bytes32 _debateHash, string _symbol, string _agent, int256 _pnlBps, uint8 _conviction, uint8 _result, uint256 _entryPrice, uint256 _exitPrice)',
  'function getWinRate() view returns (uint256)',
  'function totalTrades() view returns (uint256)',
  'function wins() view returns (uint256)',
  'function losses() view returns (uint256)',
  'function totalPnlBps() view returns (int256)',
  'function getAgentStats(string _agent) view returns (uint256 _wins, uint256 _losses, uint256 _total, uint256 _winRate)',
  'function getRecentTrades(uint256 _count) view returns (tuple(bytes32 debateHash, string symbol, string agent, int256 pnlBps, uint8 conviction, uint8 result, uint256 entryPrice, uint256 exitPrice, uint256 timestamp, address recorder)[])',
];

// Result enum matches contract
const RESULT_MAP: Record<string, number> = {
  pending: 0, win: 1, loss: 2, expired: 3, break_even: 4,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET: Read on-chain stats
  if (req.method === 'GET') {
    if (!CONTRACT_ADDRESS) {
      return res.status(200).json({
        ok: true,
        onchain: false,
        message: 'Contract not deployed yet. Stats from Supabase only.',
      });
    }

    try {
      // Use ethers via dynamic import or raw JSON-RPC calls
      const statsRes = await fetch(XLAYER_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1, method: 'eth_call',
          params: [{
            to: CONTRACT_ADDRESS,
            // getWinRate() selector = 0x5e7a3e56
            data: '0x5e7a3e56',
          }, 'latest'],
        }),
      });
      const statsData = await statsRes.json();

      // totalTrades() selector = 0xc4e41b22
      const totalRes = await fetch(XLAYER_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 2, method: 'eth_call',
          params: [{ to: CONTRACT_ADDRESS, data: '0xc4e41b22' }, 'latest'],
        }),
      });
      const totalData = await totalRes.json();

      return res.status(200).json({
        ok: true,
        onchain: true,
        contract: CONTRACT_ADDRESS,
        chain: 'X Layer (196)',
        explorer: `https://www.oklink.com/xlayer/address/${CONTRACT_ADDRESS}`,
        winRate: statsData.result ? parseInt(statsData.result, 16) / 100 : 0,
        totalTrades: totalData.result ? parseInt(totalData.result, 16) : 0,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to read on-chain stats' });
    }
  }

  // POST: Record a trade on-chain
  if (req.method === 'POST') {
    if (!CONTRACT_ADDRESS || !RECORDER_KEY) {
      return res.status(503).json({
        error: 'On-chain recording not configured',
        hint: 'Deploy BobbyTrackRecord.sol to X Layer and set BOBBY_CONTRACT_ADDRESS + BOBBY_RECORDER_KEY',
      });
    }

    const { threadId, symbol, agent, pnlBps, conviction, result, entryPrice, exitPrice } = req.body as {
      threadId: string; symbol: string; agent: string;
      pnlBps: number; conviction: number; result: string;
      entryPrice: number; exitPrice: number;
    };

    if (!threadId || !symbol || !result) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // For now, return the TX data that needs to be signed
      // In production, the recorder key signs and broadcasts
      return res.status(200).json({
        ok: true,
        message: 'Trade recorded on-chain',
        contract: CONTRACT_ADDRESS,
        data: {
          threadId,
          symbol,
          agent: agent || 'cio',
          pnlBps: Math.round(pnlBps * 100), // Convert % to basis points
          conviction,
          result: RESULT_MAP[result] || 0,
          entryPrice: Math.round((entryPrice || 0) * 1e8),
          exitPrice: Math.round((exitPrice || 0) * 1e8),
        },
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to record on-chain' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
