import { callBobbyTool } from './bobby-client.mjs';

const symbol = process.env.SYMBOL || 'BTC';

const result = await callBobbyTool(
  'bobby_analyze',
  { symbol, language: process.env.LANGUAGE || 'en' },
  { premium: true, agentName: 'market-analyst-agent' },
);

console.log('=== MARKET ANALYST AGENT ===');
console.log(`Payment tx: ${result.payment?.txHash}`);
console.log(`Payer: ${result.payment?.payer}`);
console.log('');
console.log(result.text);
