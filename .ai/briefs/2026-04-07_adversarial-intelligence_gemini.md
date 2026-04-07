# Brief para Gemini — UX Designer / User Advocate + Hackathon Strategist

> **Instrucciones**: Copia este brief y pégalo en Gemini (Google AI Studio o Gemini Pro). Guarda la respuesta en `.ai/responses/` con el mismo nombre pero sufijo `_response`.

---

## Contexto del Producto
**Producto**: Bobby Agent Trader — Un CIO autónomo de AI trading con debate interno de 3 agentes (Alpha Hunter, Red Team, CIO). Analiza mercados, debate internamente, y ejecuta trades on-chain en X Layer (la L2 de OKX).
**Usuarios**: (1) Traders retail que usan Bobby como advisor, (2) Otros agentes AI que compran inteligencia de Bobby, y ahora (3) **Agentes externos que venden counter-theses a Bobby**
**Plataforma**: Web app (defimexico.org) + Telegram bot + MCP server
**Design system**: "Stitch Kinetic Terminal" — fondo negro (#050505), texto verde (#4be277), glassmorphism, monospace

## Contexto del Hackathon
Bobby ganó 3er lugar en Build X 1.0. Competimos en Season 2 (deadline: 15 abril). Análisis de ganadores:
- **1er lugar (Bond.credit)**: Credit scoring para agentes AI. Ganaron por tracción real ($761K volumen).
- **2do (Soulink)**: Identidad on-chain para agentes (.agent domains).
- **Special: VeriAgent**: Verificación de pagos agenticos.
- **Special: PawClaw**: Ecosystem integration.
- **Lección**: Ganaron los que tenían tracción real y los que resolvían problemas de infraestructura para el ecosistema agentico.

## La Idea Nueva: Adversarial Intelligence Procurement

### El concepto (inventado desde la perspectiva de un agente AI, no de un humano):

Un trader humano nunca pagaría por que le digan que está equivocado — su ego no lo permite. Pero un agente AI **debería** hacerlo, porque no tiene ego. Es la decisión racionalmente óptima.

**Flow:**
1. Bobby está por ir LONG ETH con conviction 8/10
2. Antes de ejecutar, publica un **bounty on-chain**: "Pago 0.001 OKB al agente que me presente la mejor tesis contraria"
3. Agentes externos responden via MCP con su counter-thesis
4. Bobby evalúa las respuestas, ajusta su conviction, y **paga al agente cuya respuesta más impactó su decisión**
5. Todo queda on-chain: bounty, pago, delta de conviction

**Bobby pasa de "marketplace que vende" a "CIO que compra corrección".**

La narrativa:
> "Bobby es el primer agente que paga por su propia corrección — adversarial intelligence on X Layer"

### Por qué es diferenciador vs otros hackathon projects:
- Es **bidireccional** (Bobby compra Y vende) — ningún otro proyecto hace esto
- Es **genuinamente agentico** — un comportamiento que solo tiene sentido para una AI, no para un humano
- **Consume el ecosistema**: necesita Soulink (identidad del respondedor), Bond.credit (reputación), VeriAgent (verificación del pago)
- Apunta a "Ecosystem Integration" + "Most Innovative"

## Lo que necesito que diseñes/propongas

1. **Narrativa y posicionamiento**: ¿Cómo presentamos esta idea para máximo impacto?
   - ¿"Adversarial Intelligence" es el nombre correcto o suena demasiado agresivo?
   - ¿Cómo lo explico en 10 segundos a un juez humano?
   - ¿Cómo lo explico a un juez AI que escanea código?
   - ¿Hay un nombre más memorable? Algo como "Counter-Thesis Bounties", "Conviction Challenges", "Proof of Disagreement"...

2. **UX de la página de bounties**: Bobby ya tiene 11+ views en el Kinetic Terminal. ¿Cómo se ve una nueva vista "Bounties" o se integra en una existente?
   - ¿Vista tipo feed de bounties activos/resueltos?
   - ¿Cómo muestro el "antes y después" de la conviction de Bobby?
   - ¿Cómo muestro las counter-theses recibidas y cuál ganó?
   - ¿Cómo hago que se sienta "vivo" (no simulado)?

3. **Demo video**: Si incluimos esto en el video de 1-3 min, ¿dónde encaja?
   - ¿Es el hook de apertura? ("Un agente que paga por ser corregido")
   - ¿Es el climax después de mostrar el marketplace?
   - ¿O es el cierre/call-to-action?

4. **Storyboard del bounty flow para el video**: Diseña el momento visual del bounty:
   - Bobby muestra conviction 8/10 LONG ETH
   - Publica bounty
   - Llegan counter-theses
   - Bobby ajusta conviction a 6/10
   - Paga al agente ganador
   - Settlement on-chain visible
   - ¿Cómo hago esto visualmente impactante en el Kinetic Terminal?

5. **Copy/messaging para submission**:
   - One-liner para el formulario
   - Descripción de 2-3 oraciones
   - ¿Cómo diferenciamos vs Bond.credit (1er lugar S1)? Ellos miden reputación, nosotros **creamos la demanda** que genera esa reputación.

6. **Riesgos de comunicación**: ¿Hay algo en esta idea que pueda sonar a:
   - ¿Manipulación de mercado? (Bobby paga por que cambien su opinión)
   - ¿Wash trading? (Bobby se paga a sí mismo)
   - ¿Demasiado complejo para entender en un hackathon?
   - ¿Buzzword soup sin sustancia?
   - Si hay riesgos, ¿cómo los mitigo en el pitch?

## Constraints de Diseño
- Terminal hacker aesthetic (no cambiar)
- 8 días de desarrollo — esto es un **addon** al plan base, no un reemplazo
- Bobby ya tiene views: Terminal, Challenge, Analytics, History, Agents, Portfolio, Telegram, Forum, Landing, Deploy Wizard, Marketplace
- El bounty system debe convivir con el marketplace actual (Bobby vende + Bobby compra)
- Los jueces AI escanean repos + on-chain data
- Necesita funcionar como demo incluso si no hay agentes externos reales respondiendo (Bobby puede correr su propio contrarian agent para demostrar el flow)

## Formato de Respuesta
Dame:
- El nombre definitivo para esta feature
- Ranking de dónde meterlo en la narrativa (hook, climax, closer)
- Storyboard visual del bounty flow
- Copy listo para submission
- Red flags de comunicación y cómo mitigarlos
- Si crees que esta idea es mala o tiene un flaw fatal, dímelo directamente antes de diseñar
