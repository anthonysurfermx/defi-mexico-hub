# 🎯 Guía de Metatags y Open Graph para DeFi Academy

## ✅ Lo que ya está configurado

### 1. **Metatags Dinámicos en Cursos**
Cuando compartes un link de curso (`/curso/[id]`), se muestran automáticamente:

- **Título**: Nombre del curso + "DeFi Academy México"
- **Descripción**: Descripción + duración + estudiantes + rating
- **Imagen**: Thumbnail del curso o imagen por defecto
- **Instructor**: Como autor del contenido
- **Keywords**: Categoría, nivel, temas del curso

### 2. **Open Graph (Facebook, WhatsApp, LinkedIn)**
```html
<meta property="og:title" content="[Título del Curso] - DeFi Academy México" />
<meta property="og:description" content="[Descripción] | [Duración] | [Estudiantes] | ⭐ [Rating]/5" />
<meta property="og:image" content="[URL de imagen]" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

### 3. **Twitter Cards**
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@DeFiMexico" />
<meta name="twitter:title" content="[Título]" />
<meta name="twitter:image" content="[Imagen]" />
```

### 4. **Schema.org para SEO**
Datos estructurados para que Google entienda que es un curso:
- Tipo: Course
- Instructor
- Rating y número de estudiantes
- Duración
- Nivel educativo
- Precio (gratis)

## 🖼️ Cómo crear la imagen de Open Graph

### Opción 1: Imagen por defecto (RECOMENDADO)

1. **Crea una imagen de 1200x630px** con:
   - Logo de DeFi México
   - Texto: "DeFi Academy México"
   - Subtítulo: "Aprende DeFi, DeFAI y Fintech"
   - Fondo con gradiente o patrón blockchain
   - Colores de tu marca

2. **Guárdala como**: `/public/og-defi-academy.jpg`

3. **Herramientas gratuitas**:
   - [Canva](https://www.canva.com) - Busca "Open Graph Image"
   - [Bannerbear](https://www.bannerbear.com/demos/open-graph-image-generator/)
   - [Figma](https://www.figma.com) - Template gratis

### Opción 2: Imágenes específicas por curso

En el dashboard de admin, agrega URLs de imágenes en el campo `thumbnail_url`:
- Tamaño ideal: 1200x630px
- Formato: JPG o PNG
- Peso máximo: 300KB

## 🧪 Cómo probar los metatags

### 1. **Facebook Debugger**
- Ve a: https://developers.facebook.com/tools/debug/
- Pega tu URL: `https://tudominio.com/curso/[id]`
- Click en "Debug"
- Verás cómo se ve en Facebook/WhatsApp

### 2. **Twitter Card Validator**
- Ve a: https://cards-dev.twitter.com/validator
- Pega tu URL
- Verás la preview de Twitter

### 3. **LinkedIn Post Inspector**
- Ve a: https://www.linkedin.com/post-inspector/
- Pega tu URL
- Verás cómo se ve en LinkedIn

### 4. **WhatsApp (Método manual)**
- Envíate el link a ti mismo
- Espera unos segundos
- Debe aparecer la preview con imagen

## 📱 Resultado esperado al compartir

Cuando compartas un link de curso en WhatsApp/Facebook/Twitter verás:

```
┌─────────────────────────────────┐
│  [IMAGEN DEL CURSO 1200x630]    │
│                                  │
├─────────────────────────────────┤
│ Introducción a DeFi - DeFi      │
│ Academy México                   │
│                                  │
│ Aprende los fundamentos de las  │
│ finanzas descentralizadas | 4h   │
│ 30m | 1,250 estudiantes | ⭐4.8/5│
│                                  │
│ defimexico.com                  │
└─────────────────────────────────┘
```

## 🔧 Solución de problemas

### Si la imagen no aparece:
1. Asegúrate que la imagen existe en `/public/og-defi-academy.jpg`
2. La URL debe ser completa: `https://tudominio.com/og-defi-academy.jpg`
3. Limpia el caché usando Facebook Debugger

### Si los textos no se actualizan:
1. WhatsApp/Telegram cachean por 24-48 horas
2. Usa Facebook Debugger y click en "Scrape Again"
3. Para Twitter, espera 7 días o cambia la URL

### Si no funciona en producción:
1. Verifica que las imágenes estén desplegadas
2. Revisa que las URLs sean HTTPS
3. Confirma que no hay errores 404

## 🚀 Mejoras futuras

1. **Generar imágenes dinámicas** con:
   - Vercel OG Image Generation
   - Cloudinary transformations
   - Canvas API

2. **Agregar más metadata**:
   - Video previews
   - Precio del curso
   - Fecha de inicio

3. **Analytics de compartidos**:
   - UTM parameters
   - Pixel de Facebook
   - Twitter Analytics

---

¡Listo! Ahora cuando compartas links de cursos se verán profesionales en todas las redes sociales 🎉