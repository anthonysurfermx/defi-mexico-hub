# Brief para Gemini — UX Designer / User Advocate

> **Instrucciones**: Copia este template, llena los campos, y pégalo en Gemini (Google AI Studio o Gemini Pro). Guarda la respuesta en `.ai/responses/` con el mismo nombre pero sufijo `_response`.

---

## Contexto del Producto
**Producto**: [nombre — qué hace en 1 oración]
**Usuarios**: [quién lo usa, nivel técnico, contexto de uso]
**Plataforma**: [web app, Telegram bot, mobile, etc.]
**Design system**: [si hay uno — e.g., "terminal aesthetic dark mode", "shadcn/ui based"]

## Problema de UX Actual
[Describe qué hace el usuario hoy y por qué la experiencia es mala. Sé específico: "después de conectar la wallet, el usuario ve una pantalla blanca" > "la UX no es buena".]

## Flujo Actual (si existe)
```
Paso 1: [qué hace el usuario]
Paso 2: [qué pasa]
Paso 3: [dónde se rompe]
```

## Lo que necesito que diseñes

1. [Entregable específico — e.g., "Los estados del flujo de pago: loading, conectando, post-connect, pagando, éxito, error"]
2. [Segundo entregable — e.g., "Copy para cada estado (qué lee el usuario en cada momento)"]
3. [Tercer entregable — e.g., "Decisiones de UX: ¿deeplink o link normal para volver a Telegram?"]

## Constraints de Diseño
- [Limitaciones de la plataforma — e.g., "Es un webview dentro de Telegram, no hay barra de navegación"]
- [Requisitos técnicos que afectan UX — e.g., "El pago requiere 2 transacciones: approve + transfer"]
- [Decisiones de diseño ya tomadas — e.g., "Usamos estética de terminal con fondo negro"]

## Formato de Respuesta
Diseña cada estado como ASCII art con dimensiones de terminal, o descríbelo con estructura clara. Incluye:
- Layout de cada estado
- Copy exacto (qué texto ve el usuario)
- Transiciones entre estados
- Edge cases (¿qué pasa si la wallet se desconecta a mitad del pago?)
