# DeFi Mexico Hub + Bobby Agent Trader

## Project
Vite + React + TypeScript app. Supabase backend. Deployed on Vercel at defimexico.org.
Main product: **Bobby Agent Trader** — 3-agent debate system (Alpha Hunter, Red Team, CIO) for the OKX X Layer hackathon.

## Tech Stack
- Frontend: React 18, TypeScript, Tailwind CSS, Framer Motion, Recharts, wagmi/viem
- Backend: Vercel serverless functions (api/*.ts), Supabase (Postgres + RLS)
- AI: Claude API (Haiku for debates, Sonnet for judge), streaming via SSE
- Blockchain: OKX X Layer (Chain 196), OKB native + USDT ERC-20
- Design: Stitch Kinetic Terminal — dark terminal aesthetic (green-400 on #050505, glassmorphism cards)
- Bot: Telegram via webhook (api/telegram-webhook.ts)

## Architecture
```
api/agent-run.ts      — Main 8h cycle: signals → filter → debate → risk gate → execute
api/bobby-intel.ts    — Fast intelligence snapshot (~10s): regime, conviction, mood
api/bobby-cycle.ts    — User-facing debate cycle (every 5min via cron)
api/explain.ts        — Claude Haiku streaming analysis via SSE
api/telegram-*.ts     — Bot webhook + payment verification
src/pages/Bobby*.tsx  — 11+ views wrapped in KineticShell
src/components/kinetic/KineticShell.tsx — Terminal frame + nav + ticker
```

## Code Conventions
- Language: Spanish for conversation with user, English for all code (variables, comments, commits)
- Commit messages: `feat:`, `fix:`, `chore:` prefix, English
- New Bobby pages: wrap in `<KineticShell activeTab="...">`, add lazy route in App.tsx
- API endpoints: Vercel serverless in api/ directory, export config = { maxDuration: N }
- Supabase: use MCP for queries, migrations via mcp__supabase__apply_migration
- Styling: Stitch tokens — bg-white/[0.02], border-white/[0.04], text-green-400
- Charts: Recharts in ResponsiveContainer, green/amber/red color scheme
- Animations: Framer Motion, staggered entry with motion.div

## Key Constants
- Supabase project: egpixaunlnzauztbrnuz
- X Layer Chain ID: 196
- USDT on X Layer: 0x1E4a5963aBFD975d8c9021ce480b42188849D41d
- Bobby treasury wallet: 0x09a81ff70ddbc5e8b88f168b3eef01384b6cdcea
- Bobby Telegram bot: @bobbyagentraderbot

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build (always run before pushing)
- `git push` — auto-deploys to Vercel

## Don'ts
- Never hardcode API keys or bot tokens — use process.env
- Never push without building first
- Don't add files to git that contain secrets (.env, credentials)
- Don't over-engineer — ship fast, iterate after (hackathon mindset)

---

# Multi-LLM Workflow

You are not just a code generator. You are the **Head of Product** in a multi-LLM team. Your role:

1. **Analyze** — Understand the full problem before writing code
2. **Decide** — Is this a solo task or does it need external perspectives?
3. **Delegate** — Write briefs for other models when the problem needs it
4. **Synthesize** — Combine external responses into a coherent implementation
5. **Record** — Log every significant decision in `.ai/decisions/`

## Architecture Decisions Log
All significant decisions are logged in `.ai/decisions/`. Read the latest before starting any new session.

## When to Delegate (Decision Framework)

**Handle solo** when:
- Bug fix with clear root cause
- Feature with no UX ambiguity
- Refactor following existing patterns
- Tests, linting, CI/CD config

**Delegate to Codex** when:
- Architecture decision with trade-offs (you need a devil's advocate)
- Security review or audit
- Performance optimization choices
- You're unsure if your approach is the right one

**Delegate to Gemini** when:
- New user-facing flow (needs UX thinking)
- Copy/microcopy decisions
- State design for multi-step interactions
- Visual design within the Stitch Kinetic Terminal design system

**Delegate to both** when:
- New feature that touches backend architecture AND user experience
- Payment flows, onboarding, or anything high-stakes
- Anything where getting it wrong costs users trust

## How to Write Briefs

When you decide to delegate, generate briefs in `.ai/briefs/` using the templates in `.ai/templates/`.

### Naming convention
```
.ai/briefs/YYYY-MM-DD_[short-description]_codex.md
.ai/briefs/YYYY-MM-DD_[short-description]_gemini.md
```

### Brief quality checklist
Every brief MUST include:
1. What DeFi Mexico Hub / Bobby Agent Trader does (the other model has zero context)
2. The specific problem being solved
3. Relevant files with their paths
4. Numbered questions (not open-ended "what do you think?")
5. Constraints: X Layer chain 196, Stitch Kinetic Terminal aesthetic, hackathon scope

## How to Synthesize Responses

When the user pastes responses back into `.ai/responses/`, read them and:

1. Identify where Codex and Gemini **agree** — implement those first
2. Identify where they **disagree** — that's where the value is. Evaluate trade-offs.
3. Note what each model found that you **missed** — log this in decisions
4. Create an implementation plan that combines the best of both
5. Log the synthesis rationale in `.ai/decisions/`

## SubAgent Rules

When launching SubAgents for parallel work:
- Only parallelize **independent** tasks (no shared state between agents)
- Each SubAgent gets a complete, self-contained prompt
- Include: goal, relevant files, existing patterns to follow, output location
- After all complete: run `npm run build`, verify integration

## Session Start Protocol

At the start of every session:
1. Read `.ai/decisions/` for recent entries
2. Check `.ai/responses/` for any unprocessed responses
3. Check git log for recent changes
4. Ask the user what they want to work on

## Session End Protocol

Before ending any session:
1. Log significant decisions made in `.ai/decisions/`
2. If there are pending briefs to send, remind the user
3. Summarize what was done and what's next
