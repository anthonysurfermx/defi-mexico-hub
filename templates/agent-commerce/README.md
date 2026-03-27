# Bobby Agent Commerce Templates

These are the fastest path to real external agent commerce on Bobby in the next 24 hours.

## What they do

- `newsletter-agent.mjs` pays on X Layer, calls `bobby_debate`, and prints a publishable market brief.
- `market-analyst-agent.mjs` pays on X Layer, calls `bobby_analyze`, and prints Bobby's trade thesis.
- `social-trader-agent.mjs` pays on X Layer, calls `bobby_debate`, and prints content for an X thread.

## Setup

1. Fund a wallet with a small amount of OKB on X Layer.
2. Export a private key:

```bash
export XLAYER_PRIVATE_KEY=0xyour_private_key
```

3. Run a template:

```bash
node templates/agent-commerce/newsletter-agent.mjs
node templates/agent-commerce/market-analyst-agent.mjs
node templates/agent-commerce/social-trader-agent.mjs
```

## Optional env vars

```bash
export SYMBOL=ETH
export LANGUAGE=es
export QUESTION="BTC this week: breakout or mean reversion?"
export BOBBY_BASE_URL=https://defimexico.org
export XLAYER_RPC_URL=https://rpc.xlayer.tech
```

## How payment works

Each template:

1. Sends an on-chain transaction to `BobbyAgentEconomy.payMCPCall(toolName)`.
2. Waits for confirmation on X Layer.
3. Calls `POST /api/mcp-bobby` with the confirmed tx hash in `x-402-payment`.
4. Receives Bobby's premium intelligence.

That means every premium call can be shown as:

- one external wallet
- one real X Layer transaction
- one real Bobby MCP response

## Best practice for outreach

Ask external builders to:

1. Fork this folder.
2. Replace the prompt or symbol.
3. Run it from their own wallet.
4. Send you their tx hash and output screenshot.
