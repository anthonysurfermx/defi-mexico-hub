# Gemini Response — CEX AI Tools Deep Dive

**Modelo:** Gemini 3.1 Pro Preview
**Fecha de respuesta:** 2026-05-18
**Brief recibido:** Codex brief (lente técnico) — Gemini eligió este ángulo sobre el UX/LATAM
**Brief original:** `.ai/briefs/2026-05-18_cex-ai-deepdive_codex.md`

---

## Resumen ejecutivo

- **Seguridad vs. Pragmatismo:** Coinbase AgentKit ofrece la mejor seguridad on-chain (TEEs, CDP), pero para un agente de trading en LATAM enfocado en perps y optimizado para velocidad de desarrollo, **Bybit y Binance** ofrecen la mejor relación entre herramientas (skills) y liquidez.
- **El problema de Vercel Serverless (300s):** Aunque Bybit brille en WebSockets, los lambdas de Vercel (maxDuration 300s) son incompatibles con conexiones WS persistentes. La arquitectura debe depender de REST API optimizado (polling) o webhooks, y las órdenes condicionales *deben* delegarse al server-side del exchange.
- **X Layer Synergy:** Si Bobby Agent ya opera en X Layer, OKX OnchainOS reduce la fricción on-chain, pero su oferta de perps es históricamente menos agresiva en fees para takers de bajo volumen en comparación con Bybit.
- **Veredicto Single-CEX:** Para un hackathon con AUM de $10k, la arquitectura multi-CEX es un suicidio operativo. Concentra todo en **Bybit** por su madurez de API, soporte robusto en LATAM y extenso módulo MCP (253 skills).

---

## Ranking final 1-7

1. **Bybit** — El ganador para este caso; 253 skills cubren todo, liquidez masiva en perps, amigable con LATAM y fees competitivos.
2. **Binance** — Altamente versátil y profundo, pero su historial de cambiar rate limits sin previo aviso y mayor escrutinio regulatorio lo bajan al segundo puesto.
3. **OKX OnchainOS** — La opción lógica si la sinergia con X Layer (Chain 196) on-chain es estricta, pero su ecosistema CEX es menos flexible para un agente puro de perps.
4. **Kraken** — Excelente CLI/MCP y abstracción temprana, pero los fees de perps y la liquidez en pares exóticos son inferiores a Bybit/Binance.
5. **Coinbase** — El rey de la seguridad "agent-native" (TEE + CDP), pero la fricción de KYC para LATAM y el bajo número de comandos brutos (5) no justifican su uso para un agente *trader* puro.
6. **Bitget Wallet** — Ecosistema prometedor pero con solo 10 skills y menor liquidez global; riesgo alto para producción sin supervisión.
7. **Crypto.com** — Descartado inmediatamente por ser read-only (4 skills de market data); inútil para ejecución autónoma.

---

## Respuestas por sección

### 4.1 Auth & Security

1. **Modelo de auth menos peligroso:** Coinbase AgentKit es el claro ganador. Al utilizar TEEs (Trusted Execution Environments) y carteras delegadas por CDP, el agente firma transacciones de forma aislada sin exponer jamás una llave privada de acceso total. Los API keys clásicos (Kraken, Binance, Bybit) son radiactivos; si se filtran, el *blast radius* es total (drain de fondos vía trades ilíquidos cruzados) a menos que se restrinjan.
2. **Session limits / Daily caps:** Nativamente, las APIs de CEXes como Binance y Bybit ofrecen sub-cuentas que pueden aislar capital. Ningún CEX masivo implementa un "max drawdown cap" a nivel de API key por defecto. Todo control de riesgo (daily caps, max position) suele vivir en el client-side. Coinbase, a través de sus Smart Wallets / CDP, permite ciertas políticas de gasto (spending caps), siendo el más maduro en este aspecto.
3. **Revocación de API keys:** En Binance, Bybit, OKX y Kraken la revocación desde el dashboard web es instantánea. Sin embargo, un bot automatizado puede drenar una cuenta (comprando NFTs basura o tokens sin liquidez contra una cuenta atacante) en milisegundos. *Mitigación obligatoria:* Whitelist estricto de IPs y deshabilitar permisos de retiro.

### 4.2 Rate limits & costos ocultos

4. **Rate limits para 50 calls/min:** 50 llamadas por minuto es menos de 1 req/sec. Absolutamente **todos** los CEXes del top 5 manejan esto en sus tiers gratuitos.
   - *Binance:* Límite de peso estándar es 1200 a 6000/min. (Docs: `binance.com/en/binance-api`).
   - *Bybit:* Límite de REST API suele ser de 120 req/sec para cuentas base. (Docs: `bybit.com/en-US/help-center/api-guidelines`).
   No necesitas tiers pagados para esta frecuencia.
5. **Costos MCP/CLI:** Los wrappers MCP/CLI son open-source (interfaces). No hay costo por su uso, solo pagas los fees de trading estándar. Hasta el momento, no hay precios "agent-specific", se rigen por los tiers VIP de volumen tradicional.
6. **Maker/Taker fees (Perps, $10k AUM):** Binance y Bybit son los líderes. Para un volumen de $10k, estás en VIP 0.
   - *Bybit (Taker):* ~0.05%
   - *Binance (Taker):* ~0.05% (o 0.04% si usas BNB para fees).
   Kraken y OKX suelen rondar el 0.05% - 0.06% para takers base. Bybit y Binance son los más baratos.

### 4.3 Confiabilidad de ejecución

7. **SLA y Downtime:** Coinbase tiene el status page más transparente y auditable históricamente. Binance es robusto pero sufre latencia severa durante caídas masivas de mercado. Kraken tiene un excelente track record de uptime publicado.
8. **WebSocket Streaming:** Bybit y Binance dominan aquí. **Pero cuidado con tu arquitectura Vercel:** Los lambdas de Vercel con `maxDuration: 300s` te matarán cualquier conexión WebSocket. No puedes mantener un listener 24/7 en Serverless sin incurrir en reinicios costosos de conexión, perdiendo mensajes críticos.
9. **Órdenes Condicionales (Crítico):** Binance, Bybit, OKX y Kraken ejecutan stop-loss y take-profit **server-side**. Esto es innegociable. Mandas la orden OCO/Stop y el motor de matching del exchange se encarga. Nunca dependas de un agente evaluando el ticker para disparar un stop-loss en un entorno de Vercel (la latencia o un cold start liquidarán a Bobby).

### 4.4 Ecosystem fit

10. **Ventaja de OKX OnchainOS para X Layer:** Total. Si el agente opera en X Layer, OKX OnchainOS te da una rampa sin fricción entre CEX y DEX. Tienes acceso a Smart Money signals de su propia cadena y abstracción de gas. Sin embargo, si Bobby es 90% perps, Bybit tiene mejor liquidez de libros de órdenes centralizados.
11. **MCP Discovery / Agent Identity:** Coinbase y OKX están liderando esto. AgentKit de Coinbase está empujando fuertemente el estándar de carteras agénticas (Agentic Wallets), posicionándose como el identity provider (IDP) de facto para agentes de IA on-chain.
12. **Coinbase x402 para A2A:** Sí. Para arquitecturas donde Agente A paga a Agente B por un dato (ej. el CIO le compra una señal al Alpha Hunter), micropagos x402 en L2 (Base) de Coinbase son muy superiores. Pero para *trading direccional contra el mercado* (tu caso de uso), necesitas los 253 skills de Bybit.

### 4.5 Trampas conocidas

13. **Cambios de Rate Limits:** Binance tiene la mala costumbre de alterar dinámicamente los pesos de sus endpoints durante extrema volatilidad del mercado, devolviendo errores HTTP 429 sin aviso previo en la documentación, lo que crashea agentes.
14. **Bugs en MCPs tempranos:** En implementaciones tempranas (Feb/Mar 2026), herramientas como AgentKit o wrappers generados automáticamente suelen fallar al parsear JSONs profundos en órdenes complejas (ej. trailing stops). Las validaciones de tipos estrictos en TypeScript suelen chocar con respuestas mutadas de la API.
15. **Pregunta Abogado del Diablo:** Descartaría **Coinbase** inmediatamente para *este específico hackathon*. Razón: Eres de LATAM (México), Coinbase tiene barreras de KYC altas para usuarios internacionales completos comparado con Bybit/Binance. Además, tiene solo 5 skills. Es un producto brillante de infraestructura A2A, pero un motor de perps pobre para tu hackathon de LATAM.

### 4.6 La decisión final

16. *(Ver sección "Ranking final 1-7")*
17. **Multi-CEX vs Single-CEX:** **Single-CEX absoluto.** Una arquitectura Multi-CEX requiere reconciliación de estados distribuidos, manejo de fallos cruzados (ej. OKX te da el dato, pero la API de Bybit tira un 500, ¿qué hace el agente?) y lógica de retry asíncrona. En un entorno Vercel Serverless con un equipo pequeño optimizando para un hackathon, Multi-CEX garantiza que pases el 80% del tiempo debuggeando infraestructura y el 20% en la inteligencia de Bobby. Quédate con Bybit para todo.

---

## 💡 Arquitectura Sugerida para Vercel Serverless (Workaround para WebSockets)

Dado que Vercel destruirá tu conexión WebSocket cada 300 segundos, debes usar un patrón de *Stateless Polling* con caché (ej. Upstash Redis) o delegar todo al exchange.

```typescript
import { RestClientV5 } from 'bybit-api';
import { Redis } from '@upstash/redis';

// Inicialización fuera del handler permite reutilización en "warm starts"
const bybit = new RestClientV5({
  key: process.env.BYBIT_KEY,
  secret: process.env.BYBIT_SECRET,
  enable_time_sync: true, // Vital para serverless
});
const redis = Redis.fromEnv();

export async function executeAgentCycle(agentDecision: DecisionPayload) {
  // 1. En lugar de WS, hacemos un polling eficiente con protección de Rate Limit
  const lastSync = await redis.get<number>('last_sync_time') || 0;

  if (Date.now() - lastSync < 1000) {
    throw new Error("Rate limit preventivo: Operación demasiado rápida para el ciclo Vercel.");
  }

  // 2. Ejecutar la orden SIEMPRE delegando las condiciones al Server-Side (CEX)
  // NUNCA simular stop-loss en este lambda.
  if (agentDecision.action === 'LONG') {
    const response = await bybit.submitOrder({
      category: 'linear',
      symbol: agentDecision.ticker,
      side: 'Buy',
      orderType: 'Market',
      qty: agentDecision.size,
      stopLoss: agentDecision.sl.toString(),   // <- Bybit Servers manejan esto
      takeProfit: agentDecision.tp.toString(), // <- Bybit Servers manejan esto
    });

    await redis.set('last_sync_time', Date.now());
    return response;
  }
}
```

**Mejora aplicada:** Delegar `stopLoss` y `takeProfit` directamente en la carga de creación de orden de Bybit asegura que tu agente no necesite estar vivo para reaccionar a caídas de precio.

---

## Disagreements esperados con Gemini (Base Models)

> *Nota del Head of Product: Gemini predijo sus propias divergencias contra modelos base / Claude.*

- Es probable que modelos estándar asuman que Kraken es mejor por ser el "primero en tener CLI" o por su enfoque histórico en seguridad. Sin embargo, su volumen en perps es marginal comparado con el duopolio asiático, lo cual es perjudicial para tu caso.
- Modelos menos técnicos sugerirían Multi-CEX para "resiliencia". Desde la perspectiva de ingeniería de software pragmática, esto es un anti-patrón para un MVP de hackathon serverless.
- Muchos agentes AI por defecto intentan usar WebSockets porque es el "best practice" de trading. He ido en contra de esto y he abogado fuertemente por REST Server-Side params debido a tu restricción específica de Vercel.

## Sources

- Binance API Docs: https://binance.com/en/binance-api
- Bybit API V5 Docs: https://bybit.com/en-US/help-center/api-guidelines
- AgentKit Docs (Coinbase): https://github.com/coinbase/agentkit
