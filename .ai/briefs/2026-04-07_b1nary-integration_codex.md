# Brief para Codex — Backend Architect / Devil's Advocate

> **Instrucciones**: Copia este brief y pégalo en Codex (ChatGPT con modelo o1/o3). Guarda la respuesta en `.ai/responses/` con el mismo nombre pero sufijo `_response`.

---

## Contexto del Producto
**Producto**: Bobby Agent Trader — CIO autónomo de AI trading con debate de 3 agentes (Alpha Hunter, Red Team, CIO) + Conviction Bounties (adversarial intelligence procurement). Ejecuta on-chain en X Layer (OKX L2, Chain ID 196).
**Stack**: Vite + React + TypeScript, Vercel serverless, Supabase, Claude API, wagmi/viem
**Chain principal**: OKX X Layer (Chain ID 196), OKB nativo para pagos
**Hackathon**: Build X Season 2, deadline 15 abril (8 días), jueces AI + humanos

## Contexto de b1nary
**Producto**: b1nary.app — Protocolo DeFi para ganar income de volatilidad crypto. Los usuarios setean precios target en assets, reciben pago (premium) upfront, y al expiry ejecutan o recuperan capital. Básicamente cash-secured puts y covered calls simplificadas.
**Chain**: Base (Ethereum L2)
**Status**: Open source, audited, live
**API pública** (sin auth para sellers):
- `GET https://api.b1nary.app/prices?asset=eth` — pricing de opciones disponibles (strike, expiry, premium, delta, IV, spot)
- `GET https://api.b1nary.app/spot?asset=eth` — precio spot
- `GET https://api.b1nary.app/capacity?asset=eth` — capacidad del mercado
- `GET https://api.b1nary.app/positions/{address}` — posiciones de una wallet
- `GET https://api.b1nary.app/prices/simulate?strike=X&side=sell` — backtesting de 7-day puts
- `POST https://api.b1nary.app/faucet` — testnet tokens (Base Sepolia)
**Ejecución on-chain**: `executeOrder(quote, signature, amount, collateral)` en `BatchSettler` contract en Base
**Testnet contracts**:
- BatchSettler: `0x766bD3aF1D102f7EbcB65a7B7bC12478C2DbA918`
- MarginPool: `0x727ddBD04A691E73feaE26349F48144953Ef20d6`
- USDC (LUSD): `0xAB51a471493832C1D70cef8ff937A850cf37c860`
**Settlement**: Physical delivery via Aave flash loan + Uniswap
**Gas**: Sponsored by protocol (zero gas for users)

## La conexión Bobby ↔ b1nary

Bobby tiene conviction scores + análisis técnico + Conviction Bounties (adversarial correction). b1nary necesita que alguien ponga precios inteligentes. La integración natural:

1. Bobby analiza ETH → conviction 8/10 LONG
2. Conviction Bounty abierto → contrarian baja conviction a 6/10
3. Bobby usa su conviction ajustada para decidir QUÉ hacer
4. En lugar de un swap directo, Bobby usa b1nary para ESCRIBIR opciones (sell puts/calls) basadas en conviction
5. Bobby cobra premium upfront → income basado en inteligencia adversarial

**El problema**: b1nary está en **Base**, el hackathon es de **X Layer**. La ejecución on-chain de b1nary no está en X Layer.

## Dos caminos posibles

### Camino A — Integración cross-chain real
- Bobby ejecuta `executeOrder()` en b1nary (Base) via Vercel serverless
- Bobby registra el proof de la posición en X Layer (ConvictionOracle o nuevo evento)
- Los jueces ven: bounty en X Layer → evaluación → ejecución en b1nary (Base) → proof en X Layer
- **Riesgo**: jueces penalizan por no ser 100% X Layer

### Camino B — b1nary como data source + recommendation engine
- Bobby consume la API de b1nary (`/prices`, `/spot`, `/capacity`, `/simulate`) como fuente de datos
- Bobby genera recomendación de opciones basada en conviction post-bounty
- La "ejecución" queda como recomendación con parámetros pre-calculados + link a b1nary
- Todo el settlement real sigue en X Layer (pagos MCP, bounties, ConvictionOracle)
- **Riesgo**: se ve como mockup/vapor si no hay ejecución real

### Camino C — (¿hay otro que no estoy viendo?)

## Preguntas Específicas

1. **¿Camino A o B para el hackathon de X Layer?** El hackathon requiere "at least one component deployed on X Layer". Ya tenemos eso con el marketplace + bounties. ¿Agregar ejecución en Base suma o resta puntos? ¿Los jueces ven "ecosystem interoperability" o "not built on X Layer"?

2. **¿Cómo integro la API de b1nary en el ciclo de Bobby técnicamente?** Bobby corre como Vercel serverless. El ciclo actual es:
   - `api/bobby-cycle.ts` (cada 5min) → análisis → debate → conviction → ConvictionOracle
   - Si agrego b1nary, ¿dónde en el ciclo? ¿Después del ConvictionOracle write? ¿Como paso separado?
   - ¿Llamo `/prices` + `/simulate` para encontrar la mejor opción dada la conviction?

3. **¿Cómo se ve la "strategy selection" basada en conviction?** Ejemplo concreto:
   - Conviction 8/10 LONG → sell deep OTM put (alta confianza de que no se ejecuta) → cobra premium fácil
   - Conviction 5/10 NEUTRAL → no hacer nada o sell straddle
   - Conviction 3/10 SHORT → sell covered call (espera que baje)
   - ¿Tiene sentido esta lógica? ¿Hay edge cases que rompen esto?

4. **¿Puedo hacer la ejecución real en testnet (Base Sepolia) para el demo?** b1nary tiene faucet + testnet contracts. Si hago la ejecución en testnet y muestro el proof, ¿es suficiente para jueces? ¿O se ve fake?

5. **¿Esto cabe en los 8 días SIN romper el plan base?** Plan actual:
   - Días 1-5: marketplace base (limpiar, contrato V2, MCP HTTP, bobby_analyze, Judge Mode)
   - Día 6: Conviction Bounties MVP
   - Día 7: polish + verify + docs
   - Día 8: video + submit
   - ¿Dónde meto b1nary? ¿Es un use case más en el marketplace (UI + API call) o requiere su propio día?

6. **¿Hay riesgos de depender de una API externa para el hackathon?** Si la API de b1nary se cae durante el demo o la evaluación, Bobby se ve roto. ¿Cache? ¿Fallback? ¿Mock data si falla?

## Constraints
- Hackathon de OKX X Layer — el foco es X Layer, no Base
- 8 días, b1nary es un ADDON, no reemplaza nada del plan base
- b1nary API es pública para lectura, pero ejecución requiere wallet en Base
- Bobby treasury está en X Layer, no tiene fondos en Base (excepto testnet faucet)
- El amigo dueño de b1nary quiere que lo usemos, no hay tema de permisos

## Lo que espero de ti
- **Decisión clara**: Camino A, B, o C
- **Arquitectura de la integración**: dónde en el ciclo de Bobby, qué endpoints llamar, cómo mapear conviction → strategy
- **Red flags técnicos**: qué puede salir mal
- **Si crees que no vale la pena para el hackathon, dímelo directamente** — prefiero invertir esos días en hardening del plan base
