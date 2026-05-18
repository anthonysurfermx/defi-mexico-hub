## Resumen ejecutivo (3-5 bullets)

- **Mi ranking para Bobby-style autonomous trading es: Bybit #1, OKX #2, Kraken #3, Binance #4, Coinbase #5, Bitget Wallet #6, Crypto.com #7.** El criterio decisivo no es "cantidad de skills", sino: perps reales, WebSocket privado, ordenes condicionales server-side, limites claros, revocacion rapida y blast radius acotable por subcuenta/IP.
- **El modelo de auth menos peligroso no es el API key clasico de CEX; es wallet/session/spend-policy on-chain.** Para CEX perps, sin embargo, casi todos vuelven a API keys. Ahi gana quien permita aislar subcuentas, IP whitelist, permisos minimos, demo/read-only y ordenes kill-switch.
- **Ninguno de los 7, en las fuentes verificadas, publica un modelo maduro de "agent spending caps" exchange-enforced para trading CEX.** Kraken Futures tiene el control mas cercano con Dead Man's Switch; OKX/Bybit/Binance tienen risk limits, rate limits, subcuentas y permisos, pero no un presupuesto diario configurable por agente.
- **Para 50 calls/min, los mejores no deberian sufrir si el agent usa WebSocket para market data y REST/WS solo para ordenes.** El riesgo real no es throughput promedio, sino bursts de cancel/amend, polling de estado y limites por endpoint.
- **Arquitectura recomendada: multi-CEX ligera, no multi-CEX completa al inicio.** Ship rapido con un primary executor y un secondary data/sentinel; no meter smart order routing multi-exchange hasta que Bobby tenga PnL/risk telemetry estable.

## Ranking final 1-7 con one-line justification each

1. **Bybit** - Mejor default para Bobby si el objetivo es perps 24/7: MCP oficial grande, V5 API madura, WebSocket, ordenes condicionales server-side, alta usabilidad LATAM/Mexico y limites suficientes para $10k-$1M AUM.
2. **OKX** - Mejor fit estrategico con X Layer y on-chain agent infra; Agent Trade Kit tiene buen safety local, demo/read-only, swap/perps/options/algo orders, pero sus ventajas X Layer no eliminan el riesgo de API key CEX.
3. **Kraken** - Mejor ergonomia ingenieril y guardrails para agentes serios: CLI/MCP open source, paper trading, WebSocket, multi-asset y Dead Man's Switch, aunque LATAM/KYC/liquidez-perps pesan mas que en Bybit/OKX.
4. **Binance** - Excelente liquidez, fees y APIs, pero el Skills Hub es menos "execution-grade" que Bybit/OKX/Kraken y el contrato operacional requiere mas disciplina por weights, bans 418 y cambios frecuentes.
5. **Coinbase** - El mejor stack agent-native para A2A/x402/wallets/spending limits, pero no el mejor CEX-perps executor para Bobby por cobertura, eligibility y menor superficie de comandos de trading.
6. **Bitget Wallet** - Muy interesante para on-chain swaps, gasless/cross-chain y wallet signing, pero la entrada evaluada es wallet tooling, no CEX perps autonomo; para execution CEX habria que evaluar Bitget Exchange aparte.
7. **Crypto.com** - Su MCP verificado es market-data/read-only y gratis, util como fuente secundaria, pero no sirve como venue principal de ejecucion autonoma.

## Respuestas por sección

### 4.1 Auth & Security

- **1. Auth menos peligroso para agente autonomo**
  - Si incluimos wallet/on-chain: **Coinbase Agentic Wallet / x402 y Bitget Wallet** son menos peligrosos conceptualmente porque pueden operar con pagos/firmas limitadas, spending limits y transacciones firmadas por wallet en vez de una API key CEX con permiso de trading amplio. Coinbase documenta Agentic Wallet con spending limits por llamada/sesion; Bitget Wallet declara human-in-the-loop por default para swaps y generacion de unsigned tx.
  - Si hablamos estrictamente de **CEX perps execution**, todos los venues fuertes terminan en **API key clasica**. En ese mundo, mi orden de seguridad operacional es: **Kraken > OKX > Bybit > Binance > Coinbase Advanced/INTX > Bitget Wallet > Crypto.com MCP**.
  - **Kraken** destaca por paper trading y Dead Man's Switch en futures (`cancel-all-orders-after`). **OKX** destaca por sub-account key, IP binding recomendado, demo/read-only mode y el MCP que oculta order tools si la key no tiene permisos. **Bybit** tiene permisos, subaccounts, API key query/delete/freeze flows y buen ecosistema V5. **Binance** tiene IP/permission controls, pero el blast radius sigue siendo alto si se otorga trade sobre una cuenta grande.

- **2. Session limits / daily caps / max position exchange-enforced**
  - **No encontre, en fuentes oficiales verificadas, un CEX de los 7 con spending cap diario por agente/API key equivalente a una policy wallet.**
  - **Kraken Futures Dead Man's Switch** es el control mas maduro para sesiones: puedes configurar cancelacion automatica de ordenes si el bot deja de renovar el timeout.
  - **OKX** publica max order size, position/user risk fields y sub-account order rate limits; eso limita exposicion mecanica, pero no es un presupuesto diario de agente.
  - **Bybit** documenta open-order caps y conditional-order caps por simbolo, ademas de monitoreo/risk controls por exceso de ordenes diarias; no es un cap configurable de perdida diaria.
  - **Coinbase Agentic Wallet** si tiene spending limits, pero aplica al flujo wallet/x402, no a un CEX perp matching engine.

- **3. Si se filtra la API key**
  - **Regla comun:** con `trade` pero sin `withdraw`, el atacante puede perder tu dinero via trading, liquidacion, churn de fees o posiciones toxicas; con `withdraw`, el blast radius puede ser total. Para agentes, nunca dar withdraw al executor.
  - **OKX:** IP binding recomendado; hasta 20 IPs; keys con trade/withdraw sin IP expiran tras 14 dias de inactividad. Revocacion desde API/web; usar subaccount financiada con max risk capital.
  - **Bybit:** API key info/delete/freeze sub UID existen en V5; si no hay IP whitelist, el atacante puede tradear inmediatamente. Subaccounts y key revocation reducen ventana, pero no hay garantia publica de "instant global revocation" que yo haya verificado.
  - **Binance:** IP limits y permisos ayudan; si violan rate limits hay 429/418, pero eso no protege capital. Revocar key y aislar cuenta/subcuenta es obligatorio.
  - **Kraken:** separar spot/futures keys, permissions minimos, paper env y Dead Man's Switch reducen dano; aun asi, una key de trading filtrada puede abrir/cerrar posiciones hasta que la revoques o el DMS cancele ordenes abiertas.
  - **Coinbase:** CDP/Advanced usan JWT generado desde key; puedes rotate/regenerate/disable keys, y JWTs expiran rapido, pero la private key filtrada permite emitir nuevos JWTs hasta revocacion.
  - **Bitget Wallet:** el README indica token auth para API y signing separado; si el token se filtra, data/API actions se exponen, pero fund-moving actions requieren signing key/social wallet flow. Si la private key/mnemonic se filtra, el blast radius es wallet balance/allowances.
  - **Crypto.com MCP:** no requiere API keys y es read-only; key leak no aplica al MCP verificado.

### 4.2 Rate limits & costos

- **4. Rate limits reales para ~50 calls/min**
  - **Bybit:** HTTP default **600 requests / 5 seconds / IP**; order endpoints tienen limites por endpoint y tiers VIP/PRO. Para place-order en UTA/linear/spot, los docs muestran limites del orden de **10 req/s** en endpoints criticos y mas alto en consultas. 50 calls/min esta bien si market data va por WS.
  - **OKX:** public REST rate limits son por IP; private REST y WebSocket order management son por User ID/subaccount. OKX documenta **1000 new/amend order requests / 2s por subaccount**, y endpoints comunes como balance/positions suelen estar en **10 requests / 2s**. 50 calls/min esta bien, pero polling de balances/positions debe ser throttled.
  - **Binance:** Spot REST usa weights por IP, `/exchangeInfo` expone `REQUEST_WEIGHT`, `ORDERS` y otros limits; la doc advierte 429 y bans 418 de **2 min a 3 dias**. USD-M Futures publica `REQUEST_WEIGHT` y `ORDERS` rate limiters; el esquema comun reporta limites como **2400 request weight/min** y **1200 orders/min** para futures. 50 calls/min esta bien si no haces endpoints pesados.
  - **Kraken:** Spot REST usa un API call counter; Intermediate/Pro tienen max counter **20** con decay **0.5/s o 1/s**; trading engine tiene contador separado por pair y costos altos para cancels/amends de ordenes jovenes. 50 calls/min es viable si usas WebSocket y evitas cancel spam; es mas facil romperlo con scalping ingenuo.
  - **Coinbase:** Advanced Trade documenta REST/WS y recomienda WebSocket para datos en tiempo real; WebSocket Advanced Trade tiene **750 connections/s/IP** y **8 unauth messages/s/IP**. Para Coinbase Business docs vi **10,000 requests/hour** por API key/app; para Advanced Trade retail no encontre un numero REST unico oficial en la pagina principal, asi que trataria 50 calls/min como probable pero no garantizado sin backoff.
  - **Crypto.com MCP:** el MCP oficial es market data, sin API keys, gratuito y read-only; no encontre un rate limit MCP numerico en la pagina principal. Para trading CEX tendrias que usar Exchange API separada, que no es el MCP evaluado.
  - **Bitget Wallet:** el skill usa Bitget Wallet API para data/swap flows; README no publica un rate limit numerico. Para CEX perps, la API relevante seria Bitget Exchange, que no es el artefacto listado.

- **5. Costos MCP/CLI**
  - No encontre precios agent-specific para llamadas MCP/CLI en ninguno de los 7.
  - **OKX Agent Trade Kit** declara ser free/open source/MIT; market data sin API key.
  - **Kraken CLI, Binance Skills Hub, Coinbase AgentKit y Bitget Wallet Skill** son repos/tooling open source o public docs; el costo real viene de trading fees, funding, spreads, liquidaciones, infra y tiers VIP/PRO si necesitas rate upgrades.
  - **Crypto.com MCP** se presenta como secure/free/no API key needed para market data.

- **6. Fees/funding para perps-focused, ~$10k AUM**
  - En volumen hackathon, casi todos caen en **VIP0/retail**. El orden practico por costo de perps suele ser **Binance ~= OKX ~= Kraken ~= Bybit**, con diferencias pequenas frente al costo de slippage/funding.
  - Public schedules que conviene validar el dia de deploy: Binance Futures, OKX fee schedule, Bybit trading fee structure, Kraken Futures fees, Coinbase Advanced/International fees, Bitget Exchange fees, Crypto.com Exchange fees.
  - Funding no tiene "ganador" estatico: es dinamico por simbolo y hora. Para Bobby, la metrica real es **net execution cost = taker/maker fee + spread + impact + funding paid/received + borrow/margin cost + liquidation risk**.
  - Para $10k AUM, no optimizaria el ranking por 0.5-1 bps de fee; optimizaria por conditional orders server-side, WebSocket state, latency y KYC/usabilidad Mexico.

### 4.3 Confiabilidad

- **7. SLA documentado / downtime historico**
  - No encontre un **SLA duro retail/API** comparable a enterprise procurement para ninguno. Si existe para institucional, no lo trataria como disponible para hackathon sin contrato.
  - **OKX, Kraken, Coinbase, Bybit y Crypto.com** publican status pages. OKX ademas muestra incidentes/maintenance historicos y, al revisar el 2026-05-18, habia mantenimiento programado de trailing stop para 2026-05-18/19, justo el tipo de feature que un agent puede depender de.
  - **Kraken status** y **Coinbase status** son probablemente los mejores para auditoria publica/historica. **Binance** publica announcements/changelogs, pero su API status historico no es tan limpio como una status page unica para el bot.

- **8. WebSocket streaming integrado**
  - **Bybit:** si. V5 tiene public/private/trade/system WebSocket streams, y el release MCP habla de real-time WebSocket Streams.
  - **OKX:** si a nivel core API; docs recomiendan WebSocket para market data/order book, con public/private/business endpoints. Agent Trade Kit lista real-time tickers/orderbook/candles/funding/OI; confirmar en implementacion si el MCP usa streaming persistente o llamadas puntuales para cada tool.
  - **Kraken:** si. El CLI README lista WebSocket streaming y paper trading.
  - **Binance:** si a nivel API core; WebSocket streams y user-data streams estan maduros. La integracion directa en skills depende de skill especifico.
  - **Coinbase:** si para Advanced Trade WebSocket; docs advierten disenos para gaps/out-of-order y recomiendan heartbeats.
  - **Crypto.com:** el MCP ofrece real-time market data para AI assistants, pero no execution streaming.
  - **Bitget Wallet:** el skill se orienta a API calls, monitoring y order lifecycle on-chain; no lo trataria como private CEX WS execution.

- **9. Ordenes condicionales server-side vs client-side**
  - **Bybit:** server-side. `triggerPrice` convierte la orden en conditional; TP/SL puede setearse al colocar orden; hay caps de active/conditional orders. Caveat: si no hay margen al trigger, la orden se cancela.
  - **OKX:** server-side. Agent Trade Kit y core API soportan conditional, OCO TP/SL y trailing stops; el status page de OKX publicando mantenimiento de trailing stop confirma que es feature de exchange/servicio, no solo simulacion cliente.
  - **Binance:** server-side para stop/take-profit/trailing en futures y OCO/order-list en spot; hay filtros `MAX_NUM_ALGO_ORDERS`.
  - **Kraken:** server-side para stop/take-profit/conditional close en productos soportados; Futures API incluye stop/take-profit y Dead Man's Switch.
  - **Coinbase:** Advanced Trade soporta Market/Limit/Stop Limit y attached/bracket-style TP/SL en docs de orders; para perps/INTX hay eligibility y beta/coverage caveats. Menos robusto para Bobby que Bybit/OKX/Binance/Kraken.
  - **Crypto.com MCP:** no ejecuta ordenes.
  - **Bitget Wallet:** swaps son transacciones on-chain firmadas/broadcast; stops persistentes dependen de protocolo externo, no de un CEX MCP.

### 4.4 Ecosystem fit

- **10. X Layer / OKX OnchainOS ventajas reales**
  - Para Bobby en **X Layer (Chain 196)**, OKX tiene ventajas reales en demo/hackathon/product narrative: misma marca/ecosistema, OnchainOS/DEX aggregation, chain support amplio, wallet/on-chain infra, smart-money/meme tooling y experiencia natural para deposit/withdraw/swap/on-chain signals.
  - Pero para **matching engine de perps CEX**, X Layer no te da magic latency ni garantiza ejecucion mejor. La ejecucion perps sigue dependiendo de OKX CEX API, rate limits, account permissions, regional access y estado del exchange.
  - No verifique una fuente oficial que diga "gas patrocinado de OKX para ejecutar CEX trades desde X Layer"; si existe para un flow especifico de wallet/x402, no lo extrapolaria al CEX matcher.

- **11. MCP discovery / ERC-8004 / agent identity provider**
  - No encontre que alguno de los 7 publique oficialmente **ERC-8004-style MCP discovery / agent registry** como parte de su CEX execution API.
  - **Kraken** publica agent resources (`AGENTS.md`, `CONTEXT.md`, tool catalog, skills) y es el mas ordenado como "AI-native CLI".
  - **OKX** publica MCP/CLI/skills y se mueve hacia skill marketplace/on-chain agent surface.
  - **Coinbase** es el que mas se acerca a "agent identity/payment provider" por Agentic Wallet + x402 + wallet-as-identity, pero eso es payments/wallet identity, no una identidad CEX universal.

- **12. Coinbase x402 + Agentic Wallets TEE para A2A**
  - Si la arquitectura es **agent-to-agent commerce**, Coinbase es preferible: x402 es HTTP-native, permite pagos automaticos, Bazaar/discovery, spending limits por llamada/sesion y wallet identity.
  - Si la arquitectura es **Bobby ejecutando perps 24/7**, Coinbase no deberia ser primary executor. Usaria Coinbase/x402 para pagos, data/service access y wallet UX; usaria Bybit/OKX/Kraken/Binance para matching/execution.

### 4.5 Trampas

- **13. Cambios de rate limit / API contract sin warning suficiente**
  - **Binance** es el mayor riesgo operacional por complejidad: weights por endpoint, headers, 429/418, changelogs frecuentes y bans por no backoff. No digo que sea peor API; digo que exige mas disciplina de cliente.
  - **Kraken** tiene rate counters menos intuitivos; cancel/amend de ordenes jovenes puede costar mucho mas de lo que un agent naive espera.
  - **OKX/Bybit** tienen documentacion clara, pero tambien tiers, fill-ratio rules, VIP/PRO upgrades y mantenimiento de features criticas. No hard-codear limites; leer headers/config y tener circuit breakers.

- **14. Bugs publicos en MCPs**
  - Los MCP/repos de 2026 son jovenes; la senal de issues publicos todavia es baja. No encontre un bug publico, reproducible y severo que por si solo descalifique a Kraken/OKX/Binance/Coinbase/Bitget.
  - Esto no es prueba de madurez; es falta de historial. Para produccion, trataria cada MCP como thin adapter auditable y pondria pruebas E2E propias: dry-run, paper/demo, sandbox, order reconciliation, WebSocket gap handling y idempotency.
  - Recomendacion concreta: antes de usar cualquier MCP con real funds, auditar si el tool expone `withdraw`, transferencias internas, leverage changes, `cancel_all`, batch orders y bot creation al modelo sin policy layer externo.

- **15. Abogado del diablo: que descartaria inmediatamente**
  - **Descartaria Crypto.com como executor** porque el MCP verificado es market-data/read-only. Puede ser feed, no venue.
  - **Descartaria Bitget Wallet como CEX-perps executor** porque es wallet/on-chain swap tooling; si quieren Bitget para Bobby, evaluen Bitget Exchange API/MCP por separado.
  - **No empezaria con Coinbase como primary perps venue** aunque su agent stack sea elegante; lo usaria para A2A/x402/wallet y no para la pata principal de execution.

### 4.6 Decisión final

- **16. Ranking final**
  1. **Bybit** - Mejor combinacion de perps, WebSocket, conditional orders, tool surface y usabilidad LATAM/Mexico para ship rapido.
  2. **OKX** - Mejor ecosystem fit con X Layer/OnchainOS y muy buen Agent Trade Kit, ideal como primary o close second para Bobby.
  3. **Kraken** - Mejor postura ingenieril y safety controls, pero menos obvio para LATAM/perps-first que Bybit/OKX.
  4. **Binance** - Liquidez/fees excelentes, pero mas complejo y menos agent-safe por default.
  5. **Coinbase** - Superior para A2A/x402/wallet identity, inferior como venue principal de perps autonomos.
  6. **Bitget Wallet** - Buen on-chain wallet agent, no CEX perps executor en el artefacto listado.
  7. **Crypto.com** - MCP read-only; no resuelve ejecucion.

- **17. Multi-CEX vs single-CEX**
  - Recomendacion: **single primary executor + secondary observer**, no full multi-CEX al inicio.
  - Para S2/hackathon, haria **Bybit primary execution**, **OKX/X Layer data + on-chain flows + fallback/execution experiments**, y opcional **Kraken paper/sentinel** para comparar quotes/latency/behavior.
  - Full multi-CEX execution agrega reconciliacion, transfer liquidity, basis/funding normalization, KYC drift, fee schedule drift, websocket state machines, retries idempotentes, liquidation models y incident response. Eso es una plataforma de trading, no una demo productiva.
  - Cambiaria a full multi-CEX cuando Bobby tenga: per-venue PnL attribution, unified risk engine, venue health scoring, simulated failover drills, capital allocation rules y kill switch global probado.

## Disagreements esperados con Gemini

- Gemini probablemente premiara mas a **Coinbase** por "agent-native" y x402/TEE; yo lo separo: excelente para A2A payments, no top venue para perps 24/7.
- Gemini podria poner **OKX #1** por X Layer/on-chain surface; mi objecion es que el caso de uso dice capital real, perps + spot y sin human-in-the-loop, donde Bybit tiene mejor fit operativo inmediato para LATAM.
- Gemini podria inflar **Bybit 253 skills** como argumento suficiente; yo lo uso como senal, pero el ranking sale de execution primitives, WebSocket, conditionals y regional usability.
- Gemini podria tratar **Binance** como #1 por liquidez/fees; para un agent autonomo, la complejidad de rate-limit weights, bans y API governance pesa mas que unos bps de fee.
- Gemini podria descartar **Kraken** por menor LATAM mindshare; yo lo mantengo alto porque sus guardrails de paper trading, CLI/MCP y Dead Man's Switch son exactamente el tipo de cosas que salvan capital cuando el agent falla.

## Sources

- Kraken CLI/MCP repo: https://github.com/krakenfx/kraken-cli
- Kraken Spot REST rate limits: https://docs.kraken.com/api/docs/guides/spot-rest-ratelimits/
- Kraken Spot trading engine rate limits: https://docs.kraken.com/api/docs/guides/spot-ratelimits/
- Kraken Futures order management / Dead Man's Switch: https://docs.kraken.com/api/docs/futures-api/trading/order-management/
- Kraken status: https://status.kraken.com/
- Bybit V5 rate limits: https://bybit-exchange.github.io/docs/v5/rate-limit
- Bybit V5 place order / conditional orders: https://bybit-exchange.github.io/docs/v5/order/create-order
- Bybit V5 WebSocket: https://bybit-exchange.github.io/docs/v5/ws/connect
- Bybit API key info: https://bybit-exchange.github.io/docs/v5/user/apikey-info
- Bybit official MCP release via PRNewswire: https://www.prnewswire.com/news-releases/bybit-ai-expands-to-infrastructure-layer-with-official-mcp-release-for-multi-agent-trading-302750158.html
- Bybit status: https://status.bybit.com/
- OKX Agent Trade Kit docs: https://www.okx.com/docs-v5/agent_en/
- OKX Agent Trade Kit repo: https://github.com/okx/agent-trade-kit
- OKX API docs, auth/rate limits/WebSocket/subaccounts: https://www.okx.com/docs-v5/en/
- OKX status: https://www.okx.com/en-us/status
- Binance Skills Hub: https://github.com/binance/binance-skills-hub
- Binance Spot REST limits: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/limits
- Binance Spot trading endpoints / OCO/order lists: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/trading-endpoints
- Binance USD-M Futures common definitions: https://developers.binance.com/docs/derivatives/usds-margined-futures/common-definition
- Binance WebSocket streams: https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams
- Coinbase AgentKit repo: https://github.com/coinbase/agentkit
- Coinbase AgentKit docs: https://docs.cdp.coinbase.com/agent-kit/welcome
- Coinbase Advanced Trade REST endpoints: https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/rest-api
- Coinbase Advanced Trade WebSocket rate limits: https://docs.cdp.coinbase.com/coinbase-business/advanced-trade-apis/websocket/websocket-rate-limits
- Coinbase Advanced Trade order management: https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/guides/orders
- Coinbase Agentic Wallet: https://docs.cdp.coinbase.com/agentic-wallet/welcome
- Coinbase x402: https://docs.cdp.coinbase.com/x402/welcome
- Coinbase status: https://status.coinbase.com/
- Crypto.com MCP docs: https://mcp.crypto.com/docs
- Crypto.com Exchange API docs: https://exchange-docs.crypto.com/exchange/v1/rest-ws/index.html
- Crypto.com status: https://status.crypto.com/
- Bitget Wallet Skill repo: https://github.com/bitget-wallet-ai-lab/bitget-wallet-skill
- Bitget Wallet API docs: https://web3.bitget.com/en/docs
- Bitget API docs: https://www.bitget.com/api-doc/
