import { callBobbyTool } from './bobby-client.mjs';

const symbol = process.env.SYMBOL || 'BTC';
const question = process.env.QUESTION || `${symbol}: generate a tight bull-vs-bear debate summary for an X thread.`;

const result = await callBobbyTool(
  'bobby_debate',
  { question, language: process.env.LANGUAGE || 'en' },
  { premium: true, agentName: 'social-trader-agent' },
);

console.log('=== SOCIAL TRADER AGENT ===');
console.log(`Payment tx: ${result.payment?.txHash}`);
console.log(`Payer: ${result.payment?.payer}`);
console.log('');
console.log(result.text);
