# 🎓 Configuración de Supabase para DeFi Academy

Este documento explica cómo configurar la base de datos de cursos en Supabase para el proyecto DeFi Mexico Hub.

## 📋 Resumen

Ya tienes implementado:
- ✅ `CourseCard.tsx` - Cards de cursos con diseño atractivo
- ✅ `AdminAcademia.tsx` - Dashboard completo para administrar cursos
- ✅ `courses.service.ts` - Servicio para conectar con Supabase

Solo necesitas configurar la tabla en Supabase.

## 🚀 Instrucciones de Configuración

### 1. Ejecutar el Script SQL

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **SQL Editor**
3. Copia y pega el contenido del archivo `supabase_courses_setup.sql`
4. Ejecuta el script

### 2. Verificar la Configuración

El script incluye:
- ✅ Tabla `courses` con todos los campos necesarios
- ✅ Índices para optimizar consultas
- ✅ Triggers para actualizar `updated_at` automáticamente
- ✅ Políticas RLS (Row Level Security)
- ✅ 10 cursos de ejemplo con datos reales

### 3. Configurar Políticas de Seguridad (Opcional)

Si quieres que solo admins puedan gestionar cursos:

1. Ve a **Authentication > Users** 
2. Edita un usuario admin
3. En **User Metadata**, agrega:
```json
{
  "role": "admin"
}
```

## 📊 Datos de Ejemplo Incluidos

El script incluye 10 cursos de ejemplo:

| Curso | Categoría | Nivel | Instructor | Estudiantes | Rating |
|-------|-----------|-------|------------|-------------|--------|
| Introducción a DeFi | defi | Principiante | Carlos Mendoza | 1,250 | 4.8★ |
| DeFAI: IA y Blockchain | defai | Avanzado | Ana Rodriguez | 890 | 4.9★ |
| Trading DeFi Avanzado | trading | Avanzado | Miguel Torres | 756 | 4.7★ |
| Fintech y Blockchain | fintech | Intermedio | Laura González | 1,100 | 4.6★ |
| Smart Contracts con Solidity | defi | Intermedio | Roberto Silva | 650 | 4.8★ |
| NFTs y Metaverso | defi | Principiante | Sofia Martinez | 980 | 4.5★ |
| Análisis Técnico Crypto | trading | Intermedio | Diego Ramirez | 1,350 | 4.7★ |
| Seguridad en DeFi | defi | Intermedio | Patricia López | 720 | 4.9★ |
| DAO y Gobernanza | defi | Avanzado | Fernando Castro | 540 | 4.6★ |
| Regulación Crypto Global | fintech | Principiante | Andrés Morales | 430 | 4.4★ |

## 🎯 Funcionalidades Disponibles

### Para Usuarios Públicos:
- Ver cursos publicados
- Filtrar por categoría, nivel, búsqueda
- Ver cursos destacados
- Acceder a cursos en Circle.so

### Para Administradores:
- Crear nuevos cursos
- Editar cursos existentes
- Cambiar estado (borrador/publicado/archivado)
- Marcar cursos como destacados
- Eliminar cursos
- Ver estadísticas completas

## 🔧 Estructura de la Tabla

```sql
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration TEXT NOT NULL,
    level TEXT CHECK (level IN ('Principiante', 'Intermedio', 'Avanzado')),
    category TEXT CHECK (category IN ('defi', 'defai', 'fintech', 'trading')),
    instructor TEXT NOT NULL,
    students INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 4.0,
    topics TEXT[] DEFAULT '{}',
    circle_url TEXT NOT NULL,
    thumbnail_url TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'archived')),
    featured BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    enrollments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🛡️ Seguridad (RLS)

- **Lectura pública**: Solo cursos con `status = 'published'`
- **Administración**: Solo usuarios con `role = 'admin'` en metadata

## 🔗 URLs de Ejemplo

Los cursos incluyen URLs de ejemplo que puedes reemplazar con tus cursos reales en Circle.so:
- `https://circle.so/introduccion-defi`
- `https://circle.so/defai-course`
- `https://circle.so/trading-defi-avanzado`
- etc.

## 📱 Resultado Final

Una vez configurado, tendrás:

1. **Página pública** (`/defi-academy`) con:
   - Hero section con estadísticas
   - Cursos destacados
   - Filtros por categoría/nivel/búsqueda
   - Cards atractivas para cada curso

2. **Dashboard admin** (`/admin/academia`) con:
   - Tabla de todos los cursos
   - Filtros y búsqueda
   - Crear/editar/eliminar cursos
   - Cambiar estados y destacados
   - Estadísticas en tiempo real

## 🎨 Personalización

Para personalizar:
- Cambia las imágenes de Unsplash por las tuyas
- Modifica los datos de ejemplo
- Ajusta los colores en `CourseCard.tsx`
- Personaliza las categorías según tu oferta

---

¡Listo! Tu DeFi Academy estará funcionando con datos reales desde Supabase. 🚀