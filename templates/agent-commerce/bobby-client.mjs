import { Interface, JsonRpcProvider, Wallet, formatEther } from 'ethers';

export const BASE_URL = process.env.BOBBY_BASE_URL || 'https://defimexico.org';
export const XLAYER_RPC_URL = process.env.XLAYER_RPC_URL || 'https://rpc.xlayer.tech';
export const AGENT_ECONOMY_ADDRESS = process.env.BOBBY_AGENT_ECONOMY || '0xa4704E92E9d9eCA646716C14a124907C356C78D7';
export const PREMIUM_FEE_WEI = 1000000000000000n; // 0.001 OKB

const ECONOMY_INTERFACE = new Interface([
  'function payMCPCall(string toolName) payable',
]);

function requirePrivateKey() {
  const privateKey = process.env.XLAYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Set XLAYER_PRIVATE_KEY before running this template');
  }
  return privateKey;
}

export async function payForPremiumTool(toolName) {
  const provider = new JsonRpcProvider(XLAYER_RPC_URL);
  const wallet = new Wallet(requirePrivateKey(), provider);

  const tx = await wallet.sendTransaction({
    to: AGENT_ECONOMY_ADDRESS,
    data: ECONOMY_INTERFACE.encodeFunctionData('payMCPCall', [toolName]),
    value: PREMIUM_FEE_WEI,
  });

  const receipt = await tx.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error(`Payment failed for ${toolName}`);
  }

  return {
    toolName,
    txHash: tx.hash,
    payer: wallet.address,
    amountWei: PREMIUM_FEE_WEI.toString(),
    amountOkb: formatEther(PREMIUM_FEE_WEI),
    blockNumber: receipt.blockNumber,
  };
}

export async function callBobbyTool(name, args = {}, options = {}) {
  const premium = Boolean(options.premium);
  const agentName = options.agentName || 'external-node-agent';
  const payment = premium ? await payForPremiumTool(name) : null;

  const res = await fetch(`${BASE_URL}/api/mcp-bobby`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-agent-name': agentName,
      ...(payment ? { 'x-402-payment': payment.txHash } : {}),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name, arguments: args },
      id: Date.now(),
    }),
  });

  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json?.error?.message || `Bobby call failed with ${res.status}`);
  }

  return {
    payment,
    response: json,
    text: extractText(json),
  };
}

export function extractText(json) {
  return json?.result?.content?.map((entry) => entry?.text || '').join('\n').trim() || '';
}
