import { callBobbyTool } from './bobby-client.mjs';

const symbol = process.env.SYMBOL || 'BTC';
const question = process.env.QUESTION || `${symbol} in the next 24h: breakout, chop, or bull trap? Give a publishable market note.`;

const result = await callBobbyTool(
  'bobby_debate',
  { question, language: process.env.LANGUAGE || 'en' },
  { premium: true, agentName: 'newsletter-agent' },
);

console.log('=== NEWSLETTER AGENT ===');
console.log(`Payment tx: ${result.payment?.txHash}`);
console.log(`Payer: ${result.payment?.payer}`);
console.log('');
console.log(result.text);
