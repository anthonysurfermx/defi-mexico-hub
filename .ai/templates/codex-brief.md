# Brief para Codex — Backend Architect / Devil's Advocate

> **Instrucciones**: Copia este template, llena los campos, y pégalo en Codex (ChatGPT con modelo o1/o3 o Codex directamente). Guarda la respuesta en `.ai/responses/` con el mismo nombre pero sufijo `_response`.

---

## Contexto del Producto
**Producto**: [nombre — qué hace en 1 oración]
**Stack**: [tecnologías principales]
**Chain/Red**: [si aplica — e.g., X Layer, Base, Ethereum]

## Problema Específico
[Describe el problema técnico en 3-5 oraciones. No digas "revisa este archivo". Da contexto de negocio: por qué importa, qué pasa si se hace mal.]

## Archivos Relevantes
```
- src/[path/to/file1] — [qué hace este archivo, 1 línea]
- src/[path/to/file2] — [qué hace este archivo, 1 línea]
```

[Pega aquí el contenido relevante de cada archivo, no el archivo completo — solo las funciones/secciones que importan]

## Preguntas Específicas

1. [Pregunta técnica concreta con trade-off — e.g., "¿Deberíamos usar writeContract directo o pasar por un relayer? Trade-off: gas vs. confiabilidad"]
2. [Pregunta sobre seguridad o edge cases]
3. [Pregunta sobre escalabilidad o mantenimiento]

## Constraints
- [Limitaciones técnicas que Codex debe saber — e.g., "X Layer no soporta EIP-4337"]
- [Decisiones ya tomadas que no se pueden cambiar]
- [Patrones existentes que debe respetar]

## Lo que espero de ti
No me des una respuesta genérica. Necesito:
- Decisiones concretas con justificación
- Si encuentras problemas que no pregunté, repórtalos con prioridad (P0/P1/P2)
- Si hay algo que está mal en la arquitectura actual, dilo directamente
