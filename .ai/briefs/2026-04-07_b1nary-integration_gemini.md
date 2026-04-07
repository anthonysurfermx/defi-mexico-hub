# Brief para Gemini — UX Designer / User Advocate + Hackathon Strategist

> **Instrucciones**: Copia este brief y pégalo en Gemini (Google AI Studio o Gemini Pro). Guarda la respuesta en `.ai/responses/` con el mismo nombre pero sufijo `_response`.

---

## Contexto del Producto
**Producto**: Bobby Agent Trader — CIO autónomo de AI trading con debate de 3 agentes + "Conviction Bounties" (paga a otros agentes por corregirlo). Opera en X Layer (OKX L2).
**Design system**: "Stitch Kinetic Terminal" — fondo negro (#050505), verde (#4be277), glassmorphism, monospace
**Hackathon**: Build X Season 2, deadline 15 abril (8 días), jueces AI + humanos

## Contexto de b1nary
**Producto**: b1nary.app — Protocolo DeFi en **Base** para ganar income de volatilidad crypto. Los usuarios setean precios target, reciben premium upfront, al expiry ejecutan o recuperan capital. Cash-secured puts y covered calls simplificadas.
**Diferenciador**: "Higher returns while keeping your crypto" — 15-60% returns, zero gas (sponsored), no liquidations.
**Relación**: Es de un amigo del usuario, quiere que lo usemos. Acceso total a la infra.

## La idea de integración

Bobby tiene conviction scores ajustados por Conviction Bounties. b1nary necesita que alguien ponga precios inteligentes en opciones. La conexión:

```
Bobby conviction 8/10 LONG ETH
  → Conviction Bounty → contrarian baja a 6/10
  → Bobby decide: en lugar de swap directo, monetizar conviction via b1nary
  → Sell put en ETH a strike basado en conviction ajustada
  → Cobra premium upfront = income basado en inteligencia adversarial
```

**El pitch**: "Bobby es el primer agente que no solo tradea — escribe opciones DeFi basadas en inteligencia adversarialmente corregida."

## El dilema para el hackathon

b1nary está en **Base**, no en X Layer. El hackathon es de OKX X Layer. Dos caminos:

**Camino A — Ejecución cross-chain real**: Bobby ejecuta en b1nary (Base) y registra proof en X Layer. Jueces ven actividad en ambas chains. Riesgo: "not built on X Layer".

**Camino B — Data source + recommendation**: Bobby consume la API de b1nary para pricing, genera recomendaciones de opciones, pero toda la ejecución queda en X Layer. b1nary es un "data oracle", no un execution venue. Riesgo: se ve como mockup.

## Lo que necesito que evalúes

1. **¿Esta integración suma o resta para el hackathon?** Ser honesto. Si meter b1nary distrae del mensaje central (Intelligence Protocol on X Layer + Conviction Bounties), mejor no hacerlo. ¿Los jueces lo ven como "nice ecosystem play" o como "este proyecto no está enfocado en X Layer"?

2. **¿Cómo lo presentamos en la narrativa sin diluir el mensaje?** Ya tenemos:
   - Bobby vende inteligencia (marketplace)
   - Bobby compra corrección (Conviction Bounties) — el climax
   - ¿b1nary es el tercer acto? ¿Un epilogo? ¿O satura la historia?
   
3. **¿Dónde va en la UI?** Opciones:
   - Nuevo use case #11 en el marketplace: "AI OPTIONS WRITER — powered by b1nary"
   - Sección en la página de Analytics: "Recommended structured products based on conviction"
   - Vista separada: "Execution Venues" con b1nary como primer partner
   - Integrado en el Terminal: después de cada ciclo, Bobby sugiere una posición en b1nary
   
4. **¿Cómo se ve en el demo video?** Si lo incluimos, ¿dónde? El storyboard actual:
   - Hook: Bobby es un CIO autónomo
   - Desarrollo: marketplace (Bobby vende)
   - Climax: Conviction Bounties (Bobby compra corrección)
   - Closer: bidirectional agent economy
   - ¿b1nary va entre el climax y el closer? ¿O es parte del closer?

5. **¿El branding de b1nary sumado al de Bobby se ve bien o se ve confuso?** b1nary tiene su propia identidad visual. ¿Cómo integro su marca en el Kinetic Terminal sin que se vea como un anuncio o como un proyecto diferente?

6. **Copy para el use case de opciones**: Si lo incluimos como use case #11 en el marketplace, necesito:
   - Nombre del use case
   - One-liner de descripción
   - Flow description (como los otros 10 use cases)
   - ¿Qué payment type? (free, x402, oracle_read)

## Constraints
- 8 días — b1nary es un addon, no reemplaza nada
- El mensaje principal es "Intelligence Protocol on X Layer + Conviction Bounties"
- b1nary está en Base, no en X Layer — puede ser un issue con jueces
- El Kinetic Terminal tiene espacio para más use cases pero ya son 10
- Video demo de 1-3 min — cada segundo cuenta, no podemos agregar 30s para explicar b1nary

## Formato de Respuesta
- **Veredicto claro**: ¿incluir o no incluir para el hackathon?
- Si incluir: dónde en la narrativa, dónde en la UI, copy del use case
- Si no incluir: por qué, y cuándo sí valdría la pena (post-hackathon?)
- Red flags de comunicación
- Si crees que distrae más de lo que suma, dímelo directamente
