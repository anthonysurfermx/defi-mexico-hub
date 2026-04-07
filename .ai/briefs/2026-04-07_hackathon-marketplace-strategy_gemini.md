# Brief para Gemini — UX Designer / User Advocate + Hackathon Strategist

> **Instrucciones**: Copia este brief y pégalo en Gemini (Google AI Studio o Gemini Pro). Guarda la respuesta en `.ai/responses/` con el mismo nombre pero sufijo `_response`.

---

## Contexto del Producto
**Producto**: Bobby Agent Trader — Un CIO autónomo de AI trading con debate interno de 3 agentes (Alpha Hunter, Red Team, CIO). Analiza mercados, debate internamente, y ejecuta trades on-chain en X Layer (la L2 de OKX).
**Usuarios**: Dos tipos: (1) Traders retail que usan Bobby como advisor, (2) **Otros agentes AI** que compran inteligencia de Bobby — este segundo grupo es el foco del marketplace.
**Plataforma**: Web app (defimexico.org) + Telegram bot + MCP server para agent-to-agent
**Design system**: "Stitch Kinetic Terminal" — estética de terminal hacker, fondo negro (#050505), texto verde (#4be277), glassmorphism, monospace fonts, animaciones con Framer Motion

## Contexto del Hackathon
Bobby ganó **3er lugar** en el hackathon anterior de OKX X Layer. Ahora queremos participar en "Build X Season 2" (deadline: 15 abril, 8 días). Dos arenas:
- **X Layer Arena**: Apps agenticas full-stack en X Layer (premio: 2K USDT 1er lugar)
- **Skills Arena**: Skills reutilizables para agentes (premio: 2K USDT 1er lugar)
- **Premios especiales**: "Most Active Agent" (500 USDT), "Most Popular" (500 USDT)
- **Jueces**: Combinación de AI agents (revisan código + on-chain data) y humanos (evalúan creatividad + practicidad)

## El Marketplace Actual

Bobby tiene una página "Agent Commerce" que muestra 10 use cases de cómo otros agentes AI pueden comprar inteligencia de Bobby:

**Modelo de monetización por tiers:**
- **FREE**: bobby_ta (technical analysis), bobby_intel (regime detection)
- **x402 PAID (0.01 USDC)**: bobby_analyze (conviction), bobby_debate (3-agent debate)
- **ON-CHAIN READ**: ConvictionOracle contract (público, solo gas)

**Use cases mostrados:**
1. AI Trading Fund — rebalanceo de vault
2. AI Risk Manager — ajuste de colateral
3. AI Newsletter — debates → contenido
4. AI Portfolio Optimizer — ranking de assets
5. AI Alert Service — alertas de conviction
6. AI Academy Tutor — evaluación de tesis
7. AI Hedge Bot — hedging por régimen
8. AI Social Trader — debates → threads de X
9. AI Market Maker — ajuste de spreads
10. AI Insurance Protocol — pricing de riesgo

**UI actual**: Cards con información, botón "Try It Now" que simula una respuesta MCP, flow diagram animado, activity stream con logs simulados, contador de "live agents".

## Lo que necesito que diseñes/propongas

1. **Estrategia de presentación para el hackathon**: ¿Cómo posicionamos Bobby Marketplace para ganar? Los jueces son AI agents + humanos. ¿Qué narrativa/demo flow impresiona más? ¿"Agent economy on X Layer" o "AI trading intelligence marketplace" o algo diferente?

2. **Demo video storyboard (1-3 min)**: El hackathon da bonus por demo video. Diseña un storyboard que muestre el flow end-to-end: agente externo descubre Bobby → conecta via MCP → hace un call → paga x402 en X Layer → recibe debate/análisis → settlement on-chain. ¿Qué momentos son los "wow moments" que hay que enfatizar?

3. **UX del marketplace para jueces AI**: Los jueces AI revisan código y on-chain data automáticamente. ¿Deberíamos agregar algo en la UI que facilite su evaluación? ¿Un "judge mode" con links a contratos, txs, y código? ¿O eso es over-engineering?

4. **Diferenciación vs otros proyectos**: En un hackathon de X Layer, la mayoría de proyectos serán DEXs, bridges, o NFT apps. Bobby es un **marketplace de inteligencia agent-to-agent**. ¿Cómo comunicamos que esto es más innovador sin que suene a buzzword soup?

5. **Ideas nuevas para los 8 días restantes**: ¿Hay algún feature que podríamos agregar rápidamente que multiplique el impacto? Por ejemplo:
   - ¿Un "playground" donde los jueces puedan hacer calls en vivo?
   - ¿Un leaderboard de agentes que han comprado inteligencia?
   - ¿Un dashboard de settlement txs en X Layer?
   - ¿Algo con el premio especial "Most Active Agent"?

6. **Doble submission strategy**: Podemos competir en X Layer Arena (marketplace) Y Skills Arena (bobby-trader skill como paquete reutilizable). ¿Cómo presentamos cada uno de forma que se complementen sin ser redundantes?

## Constraints de Diseño
- Terminal hacker aesthetic — fondo negro, verde primario, monospace, glassmorphism
- 8 días de desarrollo — no podemos rediseñar todo, solo agregar/pulir
- Los jueces AI probablemente escanean repos de GitHub y on-chain explorers (OKLink)
- El marketplace actual ya está live en defimexico.org/agentic-world/bobby/marketplace
- Bobby ya tiene 11+ views implementadas — el marketplace es una de ellas
- Video demo es opcional pero da bonus — vale la pena invertir

## Formato de Respuesta
Dame:
- Ranking de prioridades (qué hacer primero con 8 días)
- Storyboard del demo video con timestamps
- Copy/messaging key para el submission form
- Ideas concretas, no genéricas — piensa como si fueras juez del hackathon, ¿qué te impresionaría?
- Si algo del approach actual está mal o es débil, dilo directamente
