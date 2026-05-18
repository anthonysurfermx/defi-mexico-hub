# Brief — Gemini — CEX AI Tools Deep Dive

**Fecha:** 2026-05-18
**Autor:** Anthony (Head of Product) + Claude
**Para:** Gemini (UX, accessibility, agent-developer experience, brand)

---

## 1. Contexto del proyecto

**DeFi Mexico Hub** es la webapp de la comunidad DeFi LATAM (defimexico.org). Está construida en Vite + React + TS, Supabase, Vercel.

**Bobby Agent Trader** es nuestro flagship dentro del hub. Es un sistema de 3 agentes AI (Alpha Hunter, Red Team, CIO) que debaten señales y ejecutan trades autónomos en **OKX X Layer (Chain 196)**. Bobby ganó **3er lugar en el hackathon S1 de OKX X Layer** (abril 2026). Estamos por entrar al **Build X Season 2** con deadline 15 abril 2026 (extendido).

Acabamos de publicar nuestro **Agentic World Leaderboard** (defimexico.org/agentic-world/leaderboard) — comparativa de 45 plataformas con AI/MCP launched entre Feb–May 2026. Está siendo compartido por la comunidad cripto LATAM.

---

## 2. El problema a resolver

La sección **CEXes** del leaderboard tiene 7 entradas con metadata superficial. Necesito tu lente UX/accessibility/dev-experience para complementar el análisis técnico de Codex y producir un veredicto final: **¿qué CEX ofrece la mejor experiencia para que un desarrollador LATAM construya un agente AI y un usuario LATAM lo opere?**

Los 7 CEXes:

| Nombre | Skills | Lanzamiento | Disponible en MX | Idioma docs |
|---|---|---|---|---|
| Kraken | 50+ workflow skills + 6 módulos | Mar 2026 | Sí (limited) | EN, parcial ES |
| Binance | 12 skills | Mar 2026 | Sí (Binance LATAM) | ES nativo |
| OKX OnchainOS | 11 skills + 60+ chains | Mar 3, 2026 | Sí | ES nativo |
| Coinbase | 5 skills (AgentKit) | Feb 11, 2026 | Sí (limited LATAM) | EN, parcial ES |
| Crypto.com | 4 skills (market data) | Mar 2026 | Sí | ES disponible |
| Bitget Wallet | 10 skills | Feb 27, 2026 | Sí | ES disponible |
| Bybit | 253 skills | **Apr 22, 2026** | Sí | ES nativo |

---

## 3. Lo que sabemos hasta ahora

- **Kraken** lidera en breadth técnica (crypto + xStocks + forex + futures + earn) pero su UX está más diseñado para US/EU traders, no LATAM.
- **Bybit** acaba de lanzar (22 abril) con 253 tools — número más alto. ES disponible. Onboarding LATAM-friendly.
- **OKX** tiene la ventaja "casa" para Bobby (vivimos en X Layer). El stack más DeFi-aware (Trenches, Smart Money, DEX Signal).
- **Coinbase** es el más "agent-native" arquitecturalmente (AgentKit, x402, TEE wallets) pero menos comandos.
- **Binance LATAM** es el CEX más reconocible para usuarios mexicanos. Su MCP cubre Square posting (social) y Meme Rush — features culturalmente relevantes.

---

## 4. Preguntas concretas para Gemini

Por favor responde cada una con bullets + ejemplos UX cuando aplique.

### 4.1 Onboarding del desarrollador
1. Para un developer LATAM **junior–mid level** que quiere conectar un agente Claude/ChatGPT a uno de estos CEXes en menos de 1 tarde, ¿cuál tiene el path más corto desde "leí el README" hasta "mi agente hizo su primer trade en testnet"?
2. Compara la calidad de la documentación: ¿tutoriales paso-a-paso? ¿ejemplos de código en TypeScript? ¿videos? ¿demos interactivas?
3. ¿Cuál tiene la mejor sandbox/testnet/paper-trading? Para un hackathon, esto es vida o muerte.

### 4.2 Documentación + i18n
4. ¿Cuál tiene **documentación oficial en español**? No Google-translate — hecho por hablantes nativos. Cita la URL `/es/` si existe.
5. Para errores: ¿cuál de los 7 tiene los mejores error messages? ("Insufficient funds" es flojo. "Insufficient USDT balance: need 100, have 87.3, increase by 12.7 or reduce order size" es bueno.)
6. ¿Algún CEX publica un **glosario** de términos para AI/agent developers que están aprendiendo trading? Esto es importante para LATAM donde el dev no necesariamente es trader.

### 4.3 UX para el usuario final del agente
7. Bobby es un agent — pero el usuario LATAM eventualmente abre el CEX en su teléfono para verificar el trade o retirar. ¿Cuál tiene la mejor app móvil en español? (Pongo en duda: Kraken/Coinbase pueden ser técnicamente superiores pero pésimos en UX móvil LATAM.)
8. Verification flow: KYC para un usuario mexicano con INE — ¿cuál es el más rápido? ¿Cuál permite operar con AUM bajo ($100 USD) sin full KYC?
9. Para retiros a CLABE / SPEI mexicano, ¿qué tan fluido es cada CEX? Esto define si un usuario puede *salir* de Bobby al fiat sin dolor.

### 4.4 Posicionamiento de marca para agents
10. ¿Cuál de los 7 está posicionándose más fuerte como "el CEX para AI agents"? Cita campaigns, twitter cuentas, branding. Esto importa porque queremos asociarnos con un winner.
11. ¿Alguno está activamente cortejando devs hackathon? (Bounties, grants, ambassador programs.) Para nosotros, partnership > tech specs.
12. ¿Cuál tiene la comunidad de developers AI más activa? (Discord, foro, Telegram.) Mide por: posts/día, response time, calidad de respuestas técnicas.

### 4.5 Riesgos UX que pueden quemar usuarios
13. ¿Algún CEX tiene **dark patterns** que un agent + un usuario novato pueden caer? (auto-renew suscripciones, fees ocultas, default leverage alto, etc.)
14. ¿Cuál tiene mejor "circuit breaker" UX cuando el mercado se vuelve loco? (notificaciones, position halts, sanity checks.)
15. **Pregunta abogado del diablo:** si tú fueras el PM contrarian, ¿qué CEX recomendarías evitar para LATAM y por qué? (No el peor tech, el peor LATAM-fit.)

### 4.6 La decisión final
16. Dame tu ranking 1–7 con **una sentence justificando cada posición**. El criterio combinado: dev-experience + LATAM accessibility + posicionamiento agent-friendly.
17. ¿Recomendarías que Bobby Agent Trader **integre múltiples CEXes** (user elige al onboarding) o **se case con uno**? Justifica desde la perspectiva del usuario final, no del developer.
18. Bonus: ¿Hay algún CEX *no* listado que deberíamos considerar? (Lemon, Buenbit, Ripio para LATAM?) Si crees que sí, dilo y argumenta.

---

## 5. Constraints / criterios

- **Honestidad sobre datos no verificables:** si no encuentras source oficial, dilo. No inventes ranking sin evidencia.
- **LATAM-first lens:** un CEX puede ser tech-superior pero si un usuario en Monterrey no puede usarlo sin VPN, pierde puntos enormes.
- **Stitch Kinetic Terminal aesthetic:** nuestra UI es dark + green-400 + glassmorphism + Inter font + animaciones Framer Motion. Si recomendamos integrar un CEX, queremos que su brand combine. Comenta si alguno choca visualmente.
- **Hackathon timeline:** S2 deadline ~15 abril 2026. Si pides "spend 6 months integrating Kraken's full surface", es no-go. Tiempo es la constraint.

---

## 6. Salida esperada

Pon tu respuesta en `.ai/responses/2026-05-18_cex-ai-deepdive_gemini.md` con esta estructura:

```
## Resumen ejecutivo (3-5 bullets, lente UX/LATAM)

## Ranking final 1-7 con one-line justification each

## Respuestas por sección
### 4.1 Onboarding del developer
### 4.2 Documentación + i18n
### 4.3 UX del usuario final
### 4.4 Posicionamiento de marca
### 4.5 Riesgos UX
### 4.6 Decisión final

## Disagreements esperados con Codex
(predict qué responderá distinto al lente técnico)

## Recomendación para Bobby Agent Trader S2
(specific to this hackathon, not a general top-10 list)

## Sources
(URLs citadas)
```

Gracias.
