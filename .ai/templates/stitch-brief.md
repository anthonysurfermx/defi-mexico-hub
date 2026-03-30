# Brief para Stitch — Design System via MCP

> **Instrucciones**: Este brief se usa cuando ya tienes el diseño de Gemini y necesitas generar pantallas consistentes con el design system. Úsalo dentro de Claude Code con el MCP de Stitch, o como prompt directo.

---

## Design System
**Estilo**: [e.g., "Terminal hacker aesthetic — dark background, monospace fonts, neon accents"]
**Colores principales**: [e.g., "#00FF66 (primary), #FF6B35 (warning), #0A0A0A (background)"]
**Tipografía**: [e.g., "JetBrains Mono for code, Inter for UI text"]
**Componentes existentes**: [lista de componentes ya implementados que debe respetar]

## Pantalla a Generar
**Nombre**: [e.g., "Payment Success State"]
**Contexto**: [Dónde aparece esta pantalla en el flujo del usuario]

## Diseño Base (de Gemini)
[Pega aquí el output de Gemini — el ASCII art o la descripción de estados]

## Requisitos Específicos
- [Componentes que debe incluir]
- [Interacciones — e.g., "botón pulsante", "animación de entrada"]
- [Datos dinámicos — e.g., "mostrar dirección de wallet truncada"]

## Output Esperado
Genera la pantalla visual con:
- Estructura y layout según el design system
- Tokens de color y tipografía correctos
- Que Claude Code pueda consumir via MCP (get_screen) y traducir a React
