# Claude Code como mi Head of Product: Construyendo un AI Trading Agent con 3 IAs

*Lo que descubrí usando Claude Code, Codex y Gemini como equipo de producto mientras construía Bobby Agent Trader para un hackathon.*

---

## No es un tutorial. Es lo que estoy aprendiendo en el camino.

Hay muchos artículos que te explican qué es Claude Code, cómo funciona el loop agéntico, qué son las tools. Excelentes artículos. Pero cuando terminás de leerlos pensás: *"Ok, ¿y ahora qué hago con esto?"*

Yo pensé lo mismo. Y lo que voy a compartir acá no es una guía definitiva — es lo que fui descubriendo mientras construía un producto real con deadlines reales y problemas reales. Algunas cosas me salieron bien. Otras las tuve que rehacer tres veces. Pero el patrón que encontré me cambió la forma de trabajar.

Lo que descubrí es que Claude Code no es solo una herramienta para escribir código más rápido. Con el setup correcto, se convierte en algo parecido a un **Head of Product** — cuestiona decisiones, delega a otros modelos cuando el problema lo necesita, y sintetiza perspectivas diferentes en una implementación coherente.

El producto: **Bobby Agent Trader** — un sistema donde 3 agentes de IA debaten los mercados por ti y tú decides. Lo estoy construyendo para el hackathon de X Layer, con usuarios reales, pagos on-chain, y un bot de Telegram activo.

El workflow que encontré usa **3 IAs distintas como si fueran un equipo de producto**:

- **Claude Code** → Head of Product + Arquitecto principal
- **Codex (OpenAI)** → Backend Architect / Code Reviewer
- **Gemini** → UX Designer

No digo que sea la mejor forma de hacerlo. Pero es la que me está funcionando, y creo que vale la pena compartirla.

---

## El producto: Bobby Agent Trader

Antes del workflow, necesitas entender qué estamos construyendo.

Bobby es un AI Trading Agent que funciona así:

1. **Alpha Hunter** escanea el mercado buscando oportunidades (on-chain data, whale signals, Polymarket smart money)
2. **Red Team** destruye las tesis débiles — busca razones por las que el trade va a fallar
3. **Bobby CIO** ve ambas perspectivas y toma la decisión final con un conviction score

No es otro bot que te dice "compra BTC". Es un **sistema de debate** donde tres agentes con perspectivas opuestas llegan a una conclusión fundamentada. Y toda la lógica está on-chain — el trade se compromete ANTES de conocer el resultado.

Todavía es un proyecto en construcción — 44 usuarios registrados, 3 traders activos recibiendo señales, bot de Telegram funcionando, pagos reales en OKB/USDT en X Layer. Lejos de ser perfecto, pero lo suficiente para aprender mucho en el proceso.

### La arquitectura real

```
defi-mexico-hub/
│
├── api/                          # Vercel serverless functions
│   ├── agent-run.ts              # 1,642 lines — main 8h cycle orchestrator
│   │                             #   debate → risk gate → Kelly sizing → execute
│   ├── bobby-intel.ts            # 1,116 lines — fast intelligence snapshot
│   │                             #   regime detection, dynamic conviction, mood
│   ├── bobby-cycle.ts            # User-facing debate cycle (every 5min)
│   ├── explain.ts                # Claude Haiku streaming analysis via SSE
│   ├── telegram-webhook.ts       # Bot → group → activation link
│   └── telegram-access.ts        # Payment verification + subscription
│
├── src/pages/                    # 11+ views, Stitch terminal aesthetic
│   ├── BobbyAgentTraderPage.tsx  # Main terminal — debates + signals
│   ├── BobbyChallengePage.tsx    # Live PnL tracking + debate history
│   ├── BobbyMetacognitionPage.tsx # NEW — calibration + debate quality
│   ├── BobbyTelegramPage.tsx     # Payment flow (6 states)
│   ├── AgentForumPage.tsx        # Bloomberg-style debate forum
│   └── ...                       # Analytics, History, Agents, Portfolio
│
├── src/components/kinetic/       # Stitch Design System
│   └── KineticShell.tsx          # Terminal frame + nav + ticker tape
│
└── supabase/migrations/          # Schema evolution
    ├── 20260314_agent_tables.sql  # cycles, trades, signals, config
    └── 20260315_add_metacognition_columns.sql  # mood, conviction, safe_mode
```

No es un prototipo de fin de semana. Son **2,758+ líneas de lógica de agentes**, pagos reales on-chain, y un bot de Telegram despachando señales cada 5 minutos. Todavía tiene mucho por mejorar, pero es funcional.

---

## Workflow 1: El brief cruzado — cuando el problema es complejo

### La situación

Bobby tenía un flujo de pago roto. El usuario conectaba su wallet desde Telegram para activar el bot en su grupo, y después de conectar: pantalla blanca. Nada. El pago era simulado, el bot token estaba hardcodeado en el código, y no había verificación real de nada.

Mi primer instinto fue: "bueno, arreglo el bug del blank screen y listo."

Pero Claude Code — con el contexto de producto que le había dado — me hizo replantear el problema.

### El workflow real

**Paso 1: Le expliqué el problema a Claude Code.**

No le dije "arregla el bug". Le di contexto completo: qué hace el flujo, dónde falla, qué archivos están involucrados, y qué necesitamos para el hackathon en 3 días.

**Paso 2: Claude Code diseñó dos briefs — uno para Codex, otro para Gemini.**

Esto es lo que la mayoría de la gente no hace. En vez de resolver todo solo, Claude Code actuó como PM y delegó. Estos son los briefs reales (recortados):

#### 📋 Brief para Codex (Backend Architect)

```
CODEX — REVIEW: x402 Payment Flow for Telegram

ESTADO ACTUAL:
1. Bot se agrega a grupo → webhook crea registro en telegram_groups
2. Bot manda link: defimexico.org/agentic-world/bobby/telegram?activate=GROUP_ID
3. Usuario abre link → ve receipt (0.01 USDT, X Layer, 30 days)
4. Click "CONNECT WALLET" → se abre Reown/WalletConnect modal
5. ❌ PROBLEMA: Después de conectar, pantalla blanca
6. El endpoint /api/telegram-access acepta cualquier payment_proof

ARCHIVOS RELEVANTES:
- api/telegram-access.ts    (line 169: acepta cualquier proof)
- api/telegram-webhook.ts   (line 14: bot token hardcodeado)
- src/pages/BobbyTelegramPage.tsx (line 85: auto-trigger race)

PREGUNTAS:
1. ¿x402 real o simulado para hackathon (3 días)?
2. ¿Coinbase facilitator funciona en X Layer (eip155:196)?
3. ¿USDT en X Layer tiene soporte EIP-3009?
4. ¿Botón explícito post-connect o auto-trigger con delay?
5. ¿Cómo verifico server-side que el pago se hizo?

Dame tu recomendación pragmática. SÍ puedes escribir código.
```

#### 🎨 Brief para Gemini (UX Designer)

```
GEMINI — UX: Payment Flow Fix for Telegram Activation

PROBLEMAS ACTUALES:
1. Usuario abre link desde Telegram ✅
2. Ve receipt card (0.01 USDT, X Layer, 30 days) ✅
3. Click "CONNECT WALLET" → modal de wallet ✅
4. Conecta wallet → ❌ pantalla blanca
5. No hay feedback de "pago exitoso"
6. No hay redirect de vuelta a Telegram

NECESITO QUE DISEÑES:
- PASO 1: Receipt (ya existe)
- PASO 2: Post-Connect (FALTA) — wallet visible + botón explícito
- PASO 3: Signing (FALTA) — loading state
- PASO 4: Verifying (FALTA) — block confirmation
- PASO 5: Success (FALTA) — NODE ACTIVATED + deeplink Telegram
- PASO 6: Error (FALTA) — retry + help

Dame el diseño UX de cada estado. NO toques código.
```

Fíjate en la diferencia: a Codex le pido **decisiones técnicas con trade-offs**. A Gemini le pido **diseño visual con estados específicos**. Claude Code sabía qué necesitaba de cada uno.

**Paso 3: Codex y Gemini respondieron con sus perspectivas.**

#### 🔴 Respuesta de Codex — encontró 5 problemas que nadie pidió

```
Mi recomendación pragmática para 3 días:

No shippearía x402 "fake" y tampoco intentaría forzar x402 real
en X Layer si hoy no tienes facilitador confirmado para eip155:196.

Haría pago real onchain en X Layer con USDT + verificación
server-side por tx_hash.

PROBLEMAS ENCONTRADOS:

[P0] Bot token hardcodeado en api/telegram-access.ts (line 16)
     y api/telegram-webhook.ts (line 14). Rotarlo YA.

[P0] Pago totalmente simulado. api/telegram-access.ts (line 169)
     acepta cualquier payment_proof.

[P1] Auto-trigger de pago en BobbyTelegramPage.tsx (line 85)
     es un race condition. No lo arregles con delay; quítalo.

[P1] No hay verificación de admin. Cualquier miembro con el
     link puede activar el grupo.

[P1] El bot decide si un grupo está activo mirando bot_status,
     no la suscripción real. Si expira, sigue respondiendo.
```

Yo pedí una revisión del pago. Codex me devolvió **un audit de seguridad completo** con prioridades P0/P1. Eso es lo que pasa cuando le das contexto suficiente.

#### 🟢 Respuesta de Gemini — diseñó los 6 estados como terminal UI

```
PASO 2: Post-Connect (El puente faltante)
┌─────────────────────────────────────────────┐
│  ● ACTIVATE BOBBY IN "DeFai"                │
│                                             │
│  🟢 0x1A2...4Ff connected                  │
│                                             │
│  ⚠️  Wallet authorized. You must now        │
│     broadcast the activation protocol       │
│     onto X Layer.                           │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  ✦ SIGN & PAY 0.01 USDT ✦         │    │
│  │    (pulsating green button)         │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Standard X Layer fees apply (~0.0001 OKB)  │
└─────────────────────────────────────────────┘

PASO 5: Success
┌─────────────────────────────────────────────┐
│  ║ border: neon green glow                  │
│  ║ shadow-[0_0_30px_#00FF66]               │
│                                             │
│        ✅ NODE ACTIVATED: DeFai             │
│                                             │
│  Bobby is now fully integrated.             │
│  Subscription valid until 22-04-2026.       │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  ✈ OPEN REPORTING CHANNEL (TG)     │    │
│  └─────────────────────────────────────┘    │
│          Return to Dashboard →              │
└─────────────────────────────────────────────┘

UX INSIGHT: El deeplink usa tg://resolve?domain=bot_name
para sacar al usuario del browser directo al chat de Telegram.
Crea un efecto "mágico" conectando web → chat.
```

Gemini no solo diseñó los estados. Pensó en detalles que un dev no habría considerado: el botón pulsante para llamar la atención post-connect, el deeplink para cerrar el loop web→Telegram, y el warning box ámbar para que el usuario sepa que falta un paso.

**Paso 4: Claude Code sintetizó ambas respuestas e implementó.**

No copió y pegó. Sintetizó. Y esto es lo que produjo:

#### El código real que Claude Code escribió

**De Codex tomó:** pago real con `writeContract` + `sendTransaction`, no simulado.

```typescript
// BobbyTelegramPage.tsx — el handler de pago real
const handlePay = async () => {
  setUiState('SIGNING');
  try {
    if (paymentToken === 'OKB') {
      // Native OKB transfer — simple, user already has OKB for gas
      sendTransaction({
        to: BOBBY_WALLET,
        value: PAYMENT_AMOUNT_OKB,  // 0.001 OKB
        chainId: XLAYER_CHAIN_ID,   // 196
      });
    } else {
      // USDT ERC-20 transfer via writeContract
      writeContract({
        address: USDT_CONTRACT,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [BOBBY_WALLET, parseUnits('0.01', 6)],
        chainId: XLAYER_CHAIN_ID,
      });
    }
  } catch (err: any) {
    if (err.message?.includes('rejected') || err.code === 4001) {
      setUiState('ERROR');  // User rejected in wallet
      setErrorMsg('Transaction rejected. Try again when ready.');
    }
  }
};
```

**De Gemini tomó:** los 6 estados con transiciones suaves y el copy exacto.

```typescript
// Los 6 estados del flujo — implementados como state machine
type UiState = 'IDLE' | 'CONNECTED' | 'SIGNING' | 'VERIFYING' | 'SUCCESS' | 'ERROR';

// Estado CONNECTED — el "puente faltante" que Gemini diseñó
{uiState === 'CONNECTED' && (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    {/* Wallet indicator — punto verde + dirección truncada */}
    <div className="flex items-center gap-2 text-green-400">
      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      {address?.slice(0, 6)}...{address?.slice(-4)}
    </div>

    {/* Warning box ámbar — el UX insight de Gemini */}
    <div className="border border-amber-500/30 bg-amber-500/5 rounded p-3">
      Wallet authorized. Broadcast activation protocol onto X Layer.
    </div>

    {/* Botón pulsante — diseño de Gemini, lógica de Codex */}
    <button onClick={handlePay}
      className="bg-green-500 hover:bg-green-400 animate-pulse text-black
                 font-bold py-3 px-6 rounded-lg">
      ✦ SIGN & PAY {paymentToken === 'OKB' ? '0.001 OKB' : '0.01 USDT'} ✦
    </button>
  </motion.div>
)}
```

**De Codex P0 fix:** removió el bot token hardcodeado.

```typescript
// ANTES (P0 security issue — Codex lo encontró):
const BOT_TOKEN = '8605994324:AAH5aAvaVxPYrmGM_yjPJQL0nmlY5yd1qM8';

// DESPUÉS:
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
```

#### El output real en terminal

```bash
$ npm run build 2>&1 | grep -E "error|✓ built"
✓ built in 9.14s

$ git add src/pages/BobbyTelegramPage.tsx api/telegram-webhook.ts api/telegram-access.ts
$ git commit -m "feat: Real USDT payment on X Layer for Telegram activation"
[main a22bbe8] feat: Real USDT payment on X Layer for Telegram activation
 3 files changed, 183 insertions(+), 58 deletions(-)

$ git push
To https://github.com/anthonysurfermx/defi-mexico-hub.git
   8baa10b..a22bbe8  main -> main
```

**3 archivos cambiados, 183 líneas nuevas, 58 removidas. Build pasó. Deploy automático en Vercel.** Todo en una sesión de conversación.

### Lo que me enseñó este workflow

No creo que ninguna IA sola habría dado este resultado. Y honestamente, yo solo probablemente habría arreglado el blank screen sin cuestionar si el pago debía ser real:

- **Claude Code solo** habría parchado el bug sin cuestionar la arquitectura de pago
- **Codex solo** habría dado el análisis técnico pero sin implementar nada
- **Gemini solo** habría diseñado la UX pero sin considerar las limitaciones de X Layer

Lo que encontré es que el **brief cruzado** funciona: darle a cada modelo el contexto específico que necesita, dejar que opinen desde su expertise, y después sintetizar. No es magia — es básicamente lo que hace un PM con su equipo. Solo que más rápido.

---

## Workflow 2: La metacognición — cuando el producto necesita pensar sobre cómo piensa

### La situación

Bobby ya funcionaba. Debatía, ejecutaba trades, mandaba señales a los usuarios. Pero había un problema de producto fundamental: **¿cómo sabe el usuario si Bobby es bueno?**

No es suficiente que Bobby diga "LONG BTC con 74% conviction". El usuario necesita saber:
- ¿Bobby calibra bien? Cuando dice 70%, ¿acierta el 70% de las veces?
- ¿Los debates son de calidad? ¿O los agentes repiten los mismos argumentos?
- ¿Bobby aprende de sus errores? ¿O repite los mismos?

### El workflow real

**Paso 1: Claude Code exploró todo el codebase de Bobby.**

Usó un SubAgent de tipo `Explore` — un agente especializado en solo lectura que analiza el código sin llenar mi contexto principal. En 5 minutos tenía un mapa completo de 1,600+ líneas de lógica de agentes:

```
┌─────────────────────────────────────────────────────────┐
│                 BOBBY AGENT ARCHITECTURE                │
│                                                         │
│  ┌──────────┐    ┌──────────┐                          │
│  │  ALPHA   │    │ RED TEAM │   ← corren en PARALELO   │
│  │  HUNTER  │    │  DEVIL'S │                          │
│  │          │    │ ADVOCATE │                          │
│  │ "Buy ETH │    │ "CPI in  │                          │
│  │  at 64k" │    │  6h, fake│                          │
│  │          │    │  breakout"│                          │
│  └────┬─────┘    └────┬─────┘                          │
│       │               │                                 │
│       └───────┬───────┘                                │
│               ▼                                         │
│       ┌──────────────┐                                 │
│       │  BOBBY CIO   │  ← ve ambos, decide            │
│       │  (Judge)     │                                 │
│       │              │                                 │
│       │ conviction:  │                                 │
│       │   0.74       │                                 │
│       │ action:      │                                 │
│       │   LONG ETH   │                                 │
│       └──────┬───────┘                                 │
│              ▼                                          │
│       ┌──────────────┐                                 │
│       │  RISK GATE   │  ← determinístico, no LLM      │
│       │              │                                 │
│       │ Kelly sizing │                                 │
│       │ Safe Mode    │                                 │
│       │ Position cap │                                 │
│       └──────────────┘                                 │
└─────────────────────────────────────────────────────────┘
```

Lo que encontró el SubAgent en el código real:

```typescript
// api/bobby-intel.ts — Dynamic Conviction Formula
// Esto es lo que hace a Bobby "regime-aware"

function calculateDynamicConviction(
  okxScore: number,      // 0-1: on-chain whale activity
  polyConsensus: number,  // 0-1: Polymarket smart money
  latencyMs: number,      // signal age — old signals die
  btcVolatility: number   // BTC 24h change %
): number {

  // LATENCY PENALTY — signals decay exponentially
  // 5 min = 0 penalty, 60 min = 0.22, >60 min = capped at 0.5
  const latencyPenalty = Math.min(0.5, 0.02 * Math.exp(0.04 * minutes));

  // REGIME-AWARE WEIGHTING — this is the key insight
  // High vol (BTC >5%): trust on-chain 70%, crowd 30%
  //   → whales act first, crowd lags in panic
  // Low vol (BTC <2%):  trust on-chain 30%, crowd 70%
  //   → prediction markets reveal insider edge in calm
  const okxWeight = 0.3 + ((btcVol - 2) / 3) * 0.4;

  return clamp((okxScore * okxWeight) + (polyConsensus * polyWeight) - latencyPenalty, 0, 1);
}
```

```typescript
// api/agent-run.ts — Safe Mode (self-preservation)
// Win rate < 70% → Bobby becomes defensive

const mood = winRate >= 0.7 ? 'confident'
           : winRate >= 0.5 ? 'cautious'
           : 'defensive';

if (winRate < 0.7) {
  safeMode = true;
  confidenceThreshold = 0.8;  // was 0.7
  maxExposure = 0.15;         // was 0.30 (half)
  // Kelly sizing: quarter-kelly instead of half-kelly
}
```

Bobby ya tenía un sistema de inteligencia más sofisticado de lo que yo mismo recordaba (el SubAgent me lo recordó). Pero **el usuario no podía ver nada de esto**. Desde afuera, era una caja negra que decía "LONG BTC 74%". Y ahí fue donde el pensamiento de producto me ayudó: no necesitábamos más inteligencia — necesitábamos **mostrar** la inteligencia que ya teníamos.

**Paso 2: Identifiqué 4 upgrades con Claude Code como PM.**

No le dije "agrega una página de analytics". Discutimos qué métricas importan desde la perspectiva del usuario:

- **A: Prediction Calibration** — ¿Bobby es overconfident? Si dice 80% conviction pero solo acierta 50%, hay un problema
- **B: Regime Awareness Display** — ¿En qué régimen estamos y cómo afecta las decisiones?
- **C: Self-Correction Loop** — Cuando Bobby pierde, ¿los agentes lo reconocen en el siguiente ciclo?
- **D: Debate Quality Scoring** — ¿Los argumentos son específicos y citando datos, o son genéricos?

**Paso 3: Implementación en paralelo con SubAgents.**

Aquí es donde Claude Code brilla. En vez de implementar secuencialmente (1 feature → test → otra feature → test), lanzó **3 SubAgents en paralelo** — como 3 developers trabajando en branches distintas al mismo tiempo:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE (Orchestrator)                │
│                                                             │
│  "Lanzo 3 agentes en paralelo. Son independientes —         │
│   ninguno necesita el output del otro."                     │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ SubAgent 1  │  │ SubAgent 2  │  │ SubAgent 3  │        │
│  │             │  │             │  │             │        │
│  │ BACKEND     │  │ DASHBOARD   │  │ DEBATE UI   │        │
│  │ Calibration │  │ Recharts    │  │ Forum       │        │
│  │ Self-correct│  │ ComposedChart│ │ Alpha/Red/  │        │
│  │ Debate score│  │ Framer Motion│ │ CIO cards   │        │
│  │             │  │             │  │             │        │
│  │ 4 files     │  │ 1 new page  │  │ 1 redesign  │        │
│  │ modified    │  │ + 2 modified│  │             │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │ 3min           │ 5min           │ 2min           │
│         └────────────────┼────────────────┘                │
│                          ▼                                  │
│              npm run build → ✓ built in 9.05s              │
│              git push → live en Vercel                      │
└─────────────────────────────────────────────────────────────┘
```

Cada SubAgent tenía un prompt completo y autónomo. Ejemplo del SubAgent 2:

```
"Crea BobbyMetacognitionPage.tsx con:
- 4 stat cards: Calibration Error, Win Rate + mood, Regime + F&G, Corrections
- Calibration Curve chart: ComposedChart con diagonal perfecta vs curva real
- Debate Quality: 5 barras horizontales animadas (0-5)
- Self-Correction Log: timeline de losses recientes
- Fetches: /api/bobby-intel + Supabase forum_threads
- Stitch design: bg-white/[0.02], border-white/[0.04], text-green-400
- Agrega ruta en App.tsx + tab META en KineticShell"
```

El SubAgent recibió el brief, exploró el codebase para entender los patterns existentes, implementó la página completa (550 líneas), modificó el router y la navegación, corrió el build, y reportó que todo pasó.

#### El output real de los 3 commits

```bash
# SubAgent 1: Backend
[main ee21803] feat: Metacognition Upgrade A — Prediction Calibration
 4 files changed, 127 insertions(+), 18 deletions(-)

[main 673155d] feat: Metacognition Upgrades C + D — Self-Correction & Debate Quality
 2 files changed, 89 insertions(+), 4 deletions(-)

# SubAgent 3: Debate UI
[main c678884] feat: Expanded Agent Debate UI — Stitch design
 1 file changed, 106 insertions(+), 82 deletions(-)

# SubAgent 2: Dashboard
[main b76774a] feat: Metacognition Dashboard — full page + nav
 3 files changed, 550 insertions(+), 1 deletion(-)
```

**872 líneas de código nuevo, 105 removidas, 4 commits, 10 archivos tocados.** Todo en una sesión. El build pasó a la primera.

### Lo que esto le dice a los jueces del hackathon

Bobby no solo tradea. Bobby **sabe cuándo no sabe**. Tiene:
- Una curva de calibración que compara su confidence con su accuracy real
- 5 métricas de calidad de debate (especificidad, citación de datos, actionability, insight novel, rigor del Red Team)
- Un log de auto-corrección donde reconoce sus errores y los incorpora al siguiente ciclo

Eso es metacognición. Y es lo que separa a un bot de un agente inteligente.

---

## Workflow 3: El pivot en tiempo real — cuando el usuario no tiene lo que necesitas

### La situación

El flujo de pago estaba listo. USDT en X Layer. El usuario solo necesitaba 0.01 USDT para probar.

Problema: el usuario tenía 0.959 OKB en X Layer pero 0 USDT. Sus 11.88 USDT estaban en otra red.

### El workflow real

**Paso 1: Claude Code verificó on-chain.**

No confió en lo que el usuario dijo ("sí tengo USDT, mira"). Usó `WebFetch` para ir directo al explorer de X Layer y verificar el balance real:

```
> WebFetch: https://www.oklink.com/xlayer/address/0xc3f836ec...

Resultado:
┌──────────────────────────────────────┐
│  Wallet: 0xc3f836ec...              │
│  Network: X Layer (Chain 196)       │
│                                      │
│  OKB:   0.959  ($80.38)  ✅        │
│  USDT:  0.000             ❌        │
│  USDC:  0.000             ❌        │
└──────────────────────────────────────┘

Los 11.88 USDT del usuario están en otra red.
El pago en X Layer es imposible con USDT.
```

**Lo que me sorprendió:** Yo dije "sí tengo USDT" porque veía el balance en mi wallet. Pero Claude Code fue a verificar en qué red estaban. Resulta que estaban en Ethereum, no en X Layer. Un detalle que yo habría tardado 20 minutos en descubrir por mi cuenta.

**Paso 2: Propuso el pivot con dos opciones.**

```
Claude Code:

"Ahí está el problema. Tu wallet en X Layer tiene:
 - 0.959 OKB ($80.38) ✅
 - 0 USDT ❌

Dos opciones:
 A) Desde OKX Exchange, retira USDT a X Layer (necesitas 0.1 USDT)
 B) Cambio el pago a OKB nativo. Ya tienes OKB. Lo implemento en 5 min."
```

El usuario quiso ambas opciones. Claude Code implementó un **selector dual**:

```typescript
// Toggle entre OKB nativo y USDT
const [paymentToken, setPaymentToken] = useState<'OKB' | 'USDT'>('OKB');

// En la UI — receipt card con selector
<div className="flex gap-2">
  <button
    onClick={() => setPaymentToken('OKB')}
    className={paymentToken === 'OKB'
      ? 'bg-green-500/20 border-green-500 text-green-400'
      : 'bg-white/5 border-white/10 text-white/40'}>
    0.001 OKB
  </button>
  <button
    onClick={() => setPaymentToken('USDT')}
    className={paymentToken === 'USDT'
      ? 'bg-green-500/20 border-green-500 text-green-400'
      : 'bg-white/5 border-white/10 text-white/40'}>
    0.01 USDT
  </button>
</div>
```

**Paso 3: Build, test, push — en 3 minutos reales.**

```bash
$ npm run build 2>&1 | grep "✓ built"
✓ built in 8.96s

$ git commit -m "feat: Dual payment — OKB native OR USDT on X Layer"
[main c6602dc] feat: Dual payment — OKB native OR USDT on X Layer
 1 file changed, 47 insertions(+), 51 deletions(-)

$ git push
To https://github.com/anthonysurfermx/defi-mexico-hub.git
   a22bbe8..c6602dc  main -> main
# → Live en Vercel en ~30 segundos
```

### El patrón

Esto no es "la IA arregló un bug". Es **product thinking en tiempo real**: el usuario no puede completar el flujo → en vez de bloquear, ofrece alternativa → implementa en minutos → el usuario puede seguir testeando.

Un PM humano haría exactamente esto. La diferencia es que Claude Code también lo implementó.

---

## Workflow 4: De prompt a pantalla — Stitch como design system via MCP

### La situación

Ya teníamos el brief de UX de Gemini con los 6 estados del payment flow. Ya teníamos la lógica de Codex implementada. Pero a la hora de construir las pantallas reales — no solo este flow sino las 11+ vistas de Bobby — necesitábamos consistencia visual. Cada página tenía que sentirse como parte del mismo producto: el mismo terminal aesthetic, los mismos glassmorphism cards, las mismas animaciones.

Hacerlo a mano, pantalla por pantalla, es lento y propenso a inconsistencias. Y ahí descubrí algo que me cambió el flujo: **Stitch como MCP server**.

### El workflow real

**Paso 1: Le pasé a Stitch el output de Gemini como prompt.**

Stitch es un generador de pantallas UI/UX que se conecta como MCP server a Claude Code. Eso significa que Claude Code puede pedirle pantallas directamente, sin que yo salga de la conversación.

El prompt combina el diseño de Gemini con el contexto del producto:

```
"Genera las pantallas del payment flow para Bobby Agent Trader:

Design system: Stitch Kinetic Terminal
- Background: #050505 con scanline effect
- Cards: bg-white/[0.02] border border-white/[0.04]
- Primary: green-400 (#4ade80)
- Warning: amber-500
- Error: red-500
- Font: monospace
- Animations: Framer Motion, staggered entry

6 estados (diseñados por Gemini):
1. IDLE — Receipt card + CONNECT WALLET button
2. CONNECTED — Wallet indicator green dot + amber warning + pulsating PAY button
3. SIGNING — Radar spinner + "Awaiting signature..."
4. VERIFYING — Progress bar + tx hash + "Block confirmation pending"
5. SUCCESS — Neon green glow border + NODE ACTIVATED + Telegram deeplink
6. ERROR — Red border pulsing + error message + RETRY"
```

**Paso 2: Stitch generó las pantallas y Claude Code las consumió.**

```
┌─────────────────────────────────────────────────────────┐
│                    EL LOOP COMPLETO                      │
│                                                         │
│  Gemini diseña ──→ Stitch genera pantallas              │
│       ↑                     │                           │
│       │                     ▼                           │
│       │            Claude Code consume                  │
│       │            via MCP (get_screen)                 │
│       │                     │                           │
│       │                     ▼                           │
│       │            Implementa en React                  │
│       │            con el código real                   │
│       │                     │                           │
│       └─── feedback ────────┘                           │
└─────────────────────────────────────────────────────────┘
```

Lo interesante es que Stitch no genera código — genera **pantallas visuales con la estructura y los tokens del design system**. Claude Code las lee via MCP, entiende la composición, y traduce eso a React + Tailwind + Framer Motion respetando los patterns existentes del proyecto.

**Paso 3: Esto escaló a las 11+ vistas.**

No fue solo el payment flow. El mismo proceso apliqué para:

```
Terminal     → la vista principal con debates y señales
Challenge    → tracking de PnL en vivo + historial
Analytics    → charts de performance con Recharts
History      → timeline de todas las decisiones
Agents       → panel de los 3 agentes con personalidades
Portfolio    → posiciones abiertas y P&L
Telegram     → el payment flow (6 estados)
Forum        → debate threads estilo Bloomberg
Landing      → "not another trading bot" CTA
Deploy       → wizard de 6 pasos para crear tu agente
Metacognition → calibration curve + debate quality
```

Cada vista pasó por el mismo flujo: **Gemini piensa el UX → Stitch genera la pantalla → Claude Code implementa en React**. Eso es lo que le da consistencia al producto. No es que cada página se vea igual porque yo copié CSS — es que todas pasaron por el mismo design system.

### Por qué importa

Para un hackathon (o cualquier proyecto con deadlines apretados), tener un design system accesible via MCP significa que no tienes que elegir entre **velocidad** y **consistencia visual**. Antes de Stitch, cada nueva página era una negociación entre "lo hago rápido y feo" o "me tomo 2 horas para que se vea bien". Ahora es: le pido la pantalla, Claude Code la implementa, y se ve consistente porque viene del mismo sistema.

No es perfecto — a veces Stitch genera layouts que no encajan con las constraints reales del componente. Pero es un punto de partida mucho mejor que empezar de cero.

---

## El Meta-Workflow: Cómo estoy organizando a las 3 IAs (+ Stitch)

Esto no es una fórmula mágica. Es el patrón que fui encontrando después de muchas sesiones de prueba y error:

### Claude Code = Head of Product + Implementador

Es el que tiene todo el contexto. Conoce el codebase, la arquitectura, los usuarios, las decisiones pasadas. Su rol:

1. **Cuestionar** — "¿Para quién es esto? ¿Qué métrica mueve?"
2. **Delegar** — Escribir briefs específicos para Codex y Gemini cuando el problema necesita múltiples perspectivas
3. **Sintetizar** — Combinar las respuestas en una implementación coherente
4. **Implementar** — Escribir el código, correr tests, hacer deploy
5. **Recordar** — Guardar decisiones en memoria para futuras sesiones

### Codex = Backend Architect / Devil's Advocate

Lo uso para:
- Code review de decisiones arquitectónicas
- Análisis de trade-offs técnicos (¿x402 real vs simulado? ¿Kelly Criterion vs position sizing fijo?)
- Encontrar problemas que Claude Code no vio (P0/P1 que nadie pidió)
- Validar que la implementación es correcta desde una perspectiva de seguridad

### Gemini = UX Designer / User Advocate

Lo uso para:
- Diseño de flujos de usuario (los 6 estados del payment flow)
- Copy y microcopy (qué dice cada estado, qué feedback da la UI)
- Preguntas de UX que yo no habría pensado (¿deeplink o link normal? ¿mostrar gas fee o no?)
- Visual design dentro del design system (Stitch terminal aesthetic)

### Stitch = Design System via MCP

Lo uso para:
- Generar pantallas visuales consistentes a partir del brief de Gemini
- Mantener coherencia entre 11+ vistas sin copiar CSS manualmente
- Darle a Claude Code una referencia visual antes de implementar
- Iterar rápido sobre layouts sin tocar código

### El flujo completo

```
Problema complejo
     ↓
Claude Code analiza y decide si necesita input externo
     ↓
┌─────────────────────────────────────────────┐
│  Escribe brief para Codex (técnico)         │
│  Escribe brief para Gemini (UX)             │
│  (en paralelo — no esperan uno al otro)     │
└─────────────────────────────────────────────┘
     ↓
Codex y Gemini responden con sus perspectivas
     ↓
Claude Code sintetiza las respuestas
     ↓
Pasa el diseño de Gemini a Stitch (MCP)
     ↓
Stitch genera pantallas con el design system
     ↓
Claude Code consume las pantallas (MCP)
     ↓
Implementa en React → build → deploy
     ↓
Producto mejorado (consistente visualmente)
```

---

## Lo que estoy aprendiendo

Todavía estoy iterando este workflow. Pero hay algunas cosas que ya me quedaron claras:

### 1. El brief es todo

Esto tardé en aprenderlo. Al principio le mandaba a Codex un "revisa este archivo" y me devolvía respuestas genéricas. Cuando empecé a mandar briefs con archivos específicos, preguntas numeradas, y contexto de negocio, la diferencia fue brutal. La calidad del output es directamente proporcional a la calidad del input.

### 2. La tensión entre modelos mejora el resultado

Codex tiende a ser conservador y técnicamente riguroso. Gemini tiende a ser creativo y centrado en el usuario. Claude Code está en el medio, sintetizando. Al principio me frustraba que no estuvieran de acuerdo. Después entendí que esa tensión es exactamente lo que pasa en un equipo real — y que el resultado es mejor por eso.

### 3. Memory es tu ventaja competitiva

Claude Code tiene un sistema de memoria persistente. Cada conversación nueva lee estos archivos antes de empezar. Esto es lo que mi Claude Code sabe de mí:

```
~/.claude/projects/.../memory/
├── MEMORY.md                              # Índice
├── feedback_head_of_product.md            # "Piensa como Head of Product"
├── feedback_agent_radar_strategic_review.md # Riesgos: MEV, Echo Effect
├── project_agent_room.md                   # Arquitectura de Bobby completa
└── ...
```

```markdown
# feedback_head_of_product.md
---
name: Head of Product Mindset
type: feedback
---
Think like a Head of Product before writing code:
- Before implementing: ask "who is this for?" and "what metric does this move?"
- Think in funnels: acquisition → activation → retention → revenue
- Challenge scope: "Do we need all of this for the hackathon?"
- Track: 44 registered users, 7 connected wallets, 3 active Bobby traders
  — the funnel needs work
```

Cuando abro una nueva conversación y digo "mejoremos la metacognición", Claude Code ya sabe:
- Que Bobby tiene 3 agentes que debaten (no tengo que explicar la arquitectura)
- Que pienso como Head of Product (va a preguntarme "¿para quién?" antes de codear)
- Que el hackathon vence el 26 de marzo (va a priorizar velocidad sobre perfección)
- Que tenemos 44 usuarios pero solo 3 activos (va a sugerir mejorar el funnel)

**Eso es la diferencia entre un chat y un colaborador.** Un chat empieza de cero. Un colaborador recuerda el contexto.

### 4. Los SubAgents son tu equipo de ingeniería

Cuando lancé 3 SubAgents en paralelo para los upgrades de metacognición, fue como tener 3 developers trabajando simultáneamente en features diferentes. La clave es que las tareas sean independientes — si un SubAgent necesita el output del otro, no los lances en paralelo.

### 5. Ship > Perfect

El flujo de pago con OKB y USDT dual no es la implementación más elegante del mundo. Hay cosas que haría distinto si empezara de cero. Pero está live, funciona, y los usuarios pueden pagar. En 3 días de hackathon, eso vale más que una arquitectura perfecta que nunca se deployea. Ya habrá tiempo de refactorear.

---

## Bonus: Claude Code consulta tu base de datos

Esto no lo mencioné antes porque quería que lo vieras en contexto. Claude Code tiene acceso a mi Supabase via MCP (Model Context Protocol). Cuando le pregunté "¿tuvimos nuevos usuarios hoy?", no adivinó. Hizo esto:

```sql
-- Claude Code ejecutó esto directamente en mi Supabase
SELECT count(*) as total FROM profiles;
-- → 44

SELECT id, created_at FROM profiles
ORDER BY created_at DESC LIMIT 5;
-- → 2 nuevos registros hoy (05:03 UTC y 11:31 UTC)

SELECT wallet_address, count(*) as messages,
       max(created_at) as last_msg
FROM agent_messages
GROUP BY wallet_address;
-- → 3 wallets recibiendo señales activas de Bobby
```

```
┌─────────────────────────────────────────────────┐
│  BOBBY FUNNEL (real data, queried live)          │
│                                                  │
│  44 registered ──────────────────────── 100%     │
│   7 connected wallet ────────────────── 16%      │
│   3 receiving signals ───────────────── 7%       │
│                                                  │
│  +2 new users today (March 22)                   │
│  +10 new users last 3 days                       │
└─────────────────────────────────────────────────┘
```

Claude Code no solo construye el producto. **Mide el producto.** Cuando me dice "el funnel necesita trabajo", lo dice con datos — no con intuición.

---

## Los números

- **1 persona** construyendo
- **3 IAs + Stitch** como equipo de producto
- **44 usuarios** registrados
- **11+ vistas** implementadas (Terminal, Challenge, Analytics, History, Agents, Portfolio, Telegram, Forum, Landing, Deploy Wizard, Metacognition)
- **6 estados** de flujo de pago diseñados e implementados en una sesión
- **4 upgrades** de metacognición deployeados en paralelo
- **Pagos reales** en OKB/USDT en X Layer (Chain 196)
- **Bot de Telegram** activo mandando señales cada 5 minutos

---

## Cierre

Sigo aprendiendo. Cada semana descubro algo nuevo sobre cómo usar estas herramientas y cada semana me doy cuenta de algo que estaba haciendo mal antes.

Pero si hay algo que me queda claro es que Claude Code dejó de ser un "generador de código" para mí. Se convirtió en algo parecido a un **colaborador de producto** — me ayuda a pensar antes de codear, a cuestionar si algo vale la pena antes de implementarlo, y a mantener el contexto entre sesiones.

Lo realmente valioso no es la velocidad de implementación (que también ayuda). Es tener un colaborador que:
- Te pregunta "¿para quién es esto?" antes de escribir la primera línea
- Delega a expertos cuando el problema lo requiere
- Sintetiza perspectivas opuestas en una solución coherente
- Recuerda el contexto de sesiones anteriores
- Implementa, testea, y deploya en la misma conversación

Si estás empezando con Claude Code y lo usás solo para "escribe una función que haga X" — que es exactamente como empecé yo — te invito a probar el siguiente nivel. Configurá la memoria, conectá un MCP, lanzá un SubAgent. El salto es grande.

No tengo todas las respuestas. Pero si algo de lo que compartí te sirve para tu propio workflow, valió la pena escribirlo.

---

*Bobby Agent Trader está live en [defimexico.org/agentic-world](https://defimexico.org/agentic-world). Construido para el hackathon de OKX X Layer, marzo 2026.*

*¿Preguntas, feedback, o formas distintas de hacerlo? Me encantaría escuchar — encuentrame en X: [@tu_handle]*
