# 📋 Guía de Implementación: Importación JSON Masiva

## ✅ Archivos Creados

1. **`src/components/admin/ImportJSONButton.tsx`** - Componente reutilizable
2. **`src/constants/importPrompts.ts`** - Prompts para cada sección

## 🔧 Pasos para Implementar en Cada Sección

### 1. AdminAdvocates (Referentes) ✅

Ya está implementado manualmente. Ahora necesitamos cambiarlo para usar el componente reutilizable.

**Cambios necesarios:**

```tsx
// En la parte superior del archivo, agregar imports:
import { useAuth } from '@/hooks/useAuth';
import ImportJSONButton from '@/components/admin/ImportJSONButton';
import { IMPORT_PROMPTS } from '@/constants/importPrompts';

// Eliminar estos estados (ya están en el componente):
- const [importDialogOpen, setImportDialogOpen] = useState(false);
- const [importLoading, setImportLoading] = useState(false);
- const [importResults, setImportResults] = useState...

// Agregar al inicio del componente:
const { getRoles } = useAuth();
const userRoles = getRoles?.() || [];
const isAdmin = userRoles.includes('admin');

// Crear función de importación:
const handleImportAdvocates = async (file: File) => {
  const text = await file.text();
  const data = JSON.parse(text);

  if (!Array.isArray(data)) {
    throw new Error("El JSON debe ser un array de referentes");
  }

  let successCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const advocate of data) {
    try {
      if (!advocate.name) {
        throw new Error("Falta el campo 'name'");
      }

      const slug = advocatesService.generateSlug(advocate.name);

      // Auto-obtener avatar
      let avatar_url = advocate.avatar_url || "";
      if (!avatar_url) {
        if (advocate.github_url) {
          const username = advocate.github_url.split('github.com/')[1]?.split('/')[0];
          if (username) {
            avatar_url = `https://github.com/${username}.png?size=200`;
          }
        } else if (advocate.twitter_url) {
          let username = advocate.twitter_url.split('twitter.com/')[1]?.split('/')[0];
          if (!username) {
            username = advocate.twitter_url.split('x.com/')[1]?.split('/')[0];
          }
          if (username) {
            avatar_url = `https://unavatar.io/twitter/${username}`;
          }
        }
      }

      await advocatesService.createAdvocate({
        name: advocate.name,
        slug,
        email: advocate.email || null,
        bio: advocate.bio || null,
        location: advocate.location || null,
        expertise: advocate.expertise || null,
        track: advocate.track || "other",
        avatar_url: avatar_url || null,
        twitter_url: advocate.twitter_url || null,
        linkedin_url: advocate.linkedin_url || null,
        github_url: advocate.github_url || null,
        website: advocate.website || null,
        specializations: advocate.specializations || [],
        achievements: advocate.achievements || [],
        is_featured: advocate.is_featured || false,
        is_active: advocate.is_active !== false,
      });

      successCount++;
    } catch (error: any) {
      failedCount++;
      errors.push(`${advocate.name || "Unknown"}: ${error.message}`);
    }
  }

  await loadAdvocates(); // Recargar lista
  return { success: successCount, failed: failedCount, errors };
};

// Reemplazar el botón actual por:
<div className="flex gap-2">
  {isAdmin && (
    <ImportJSONButton
      onImport={handleImportAdvocates}
      promptSuggestion={IMPORT_PROMPTS.advocates}
      entityName="Referentes"
    />
  )}
  <Button onClick={openCreateDialog}>
    <Plus className="w-4 h-4 mr-2" />
    Nuevo Referente
  </Button>
</div>
```

---

### 2. AdminStartups (Startups)

**Archivo:** `src/pages/admin/AdminStartups.tsx`

**Imports a agregar:**
```tsx
import { useAuth } from '@/hooks/useAuth';
import ImportJSONButton from '@/components/admin/ImportJSONButton';
import { IMPORT_PROMPTS } from '@/constants/importPrompts';
```

**Función de importación:**
```tsx
const { getRoles } = useAuth();
const userRoles = getRoles?.() || [];
const isAdmin = userRoles.includes('admin');

const handleImportStartups = async (file: File) => {
  const text = await file.text();
  const data = JSON.parse(text);

  if (!Array.isArray(data)) {
    throw new Error("El JSON debe ser un array de startups");
  }

  let successCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const startup of data) {
    try {
      if (!startup.name) {
        throw new Error("Falta el campo 'name'");
      }

      const slug = startup.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      // Usar el service de startups (ajusta según tu implementación)
      await startupsService.createStartup({
        name: startup.name,
        slug,
        tagline: startup.tagline || null,
        description: startup.description || null,
        category: startup.category || "other",
        stage: startup.stage || "idea",
        fundingStage: startup.fundingStage || null,
        location: startup.location || null,
        founded_year: startup.founded_year || null,
        team_size: startup.team_size || null,
        website: startup.website || null,
        twitter_url: startup.twitter_url || null,
        github_url: startup.github_url || null,
        linkedin_url: startup.linkedin_url || null,
        logo_url: startup.logo_url || null,
        tags: startup.tags || [],
        is_hiring: startup.is_hiring || false,
        is_featured: startup.is_featured || false,
        status: startup.status || "active",
      });

      successCount++;
    } catch (error: any) {
      failedCount++;
      errors.push(`${startup.name || "Unknown"}: ${error.message}`);
    }
  }

  await loadStartups(); // Recargar lista
  return { success: successCount, failed: failedCount, errors };
};
```

**En el header, agregar:**
```tsx
{isAdmin && (
  <ImportJSONButton
    onImport={handleImportStartups}
    promptSuggestion={IMPORT_PROMPTS.startups}
    entityName="Startups"
  />
)}
```

---

### 3. AdminCommunities (Comunidades)

**Archivo:** `src/pages/admin/AdminCommunities.tsx`

**Imports a agregar:**
```tsx
import { useAuth } from '@/hooks/useAuth';
import ImportJSONButton from '@/components/admin/ImportJSONButton';
import { IMPORT_PROMPTS } from '@/constants/importPrompts';
```

**Función de importación:**
```tsx
const { getRoles } = useAuth();
const userRoles = getRoles?.() || [];
const isAdmin = userRoles.includes('admin');

const handleImportCommunities = async (file: File) => {
  const text = await file.text();
  const data = JSON.parse(text);

  if (!Array.isArray(data)) {
    throw new Error("El JSON debe ser un array de comunidades");
  }

  let successCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const community of data) {
    try {
      if (!community.name) {
        throw new Error("Falta el campo 'name'");
      }

      const slug = community.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      await communitiesService.createCommunity({
        name: community.name,
        slug,
        description: community.description || null,
        type: community.type || "other",
        location: community.location || null,
        member_count: community.member_count || 0,
        founded_year: community.founded_year || null,
        website: community.website || null,
        twitter_url: community.twitter_url || null,
        discord_url: community.discord_url || null,
        telegram_url: community.telegram_url || null,
        linkedin_url: community.linkedin_url || null,
        logo_url: community.logo_url || null,
        tags: community.tags || [],
        meeting_frequency: community.meeting_frequency || null,
        is_active: community.is_active !== false,
        is_verified: community.is_verified || false,
        is_featured: community.is_featured || false,
      });

      successCount++;
    } catch (error: any) {
      failedCount++;
      errors.push(`${community.name || "Unknown"}: ${error.message}`);
    }
  }

  await loadCommunities(); // Recargar lista
  return { success: successCount, failed: failedCount, errors };
};
```

**En el header, agregar:**
```tsx
{isAdmin && (
  <ImportJSONButton
    onImport={handleImportCommunities}
    promptSuggestion={IMPORT_PROMPTS.communities}
    entityName="Comunidades"
  />
)}
```

---

### 4. AdminEvents (Eventos)

**Archivo:** `src/pages/admin/AdminEvents.tsx`

**Imports a agregar:**
```tsx
import { useAuth } from '@/hooks/useAuth';
import ImportJSONButton from '@/components/admin/ImportJSONButton';
import { IMPORT_PROMPTS } from '@/constants/importPrompts';
```

**Función de importación:**
```tsx
const { getRoles } = useAuth();
const userRoles = getRoles?.() || [];
const isAdmin = userRoles.includes('admin');

const handleImportEvents = async (file: File) => {
  const text = await file.text();
  const data = JSON.parse(text);

  if (!Array.isArray(data)) {
    throw new Error("El JSON debe ser un array de eventos");
  }

  let successCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const event of data) {
    try {
      if (!event.title) {
        throw new Error("Falta el campo 'title'");
      }

      const slug = event.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      await eventsService.createEvent({
        title: event.title,
        slug,
        description: event.description || null,
        type: event.type || "other",
        format: event.format || "presential",
        date: event.date,
        end_date: event.end_date || null,
        time: event.time || null,
        location: event.location || null,
        address: event.address || null,
        organizer: event.organizer || null,
        website: event.website || null,
        registration_url: event.registration_url || null,
        twitter_url: event.twitter_url || null,
        image_url: event.image_url || null,
        price: event.price || 0,
        currency: event.currency || "MXN",
        capacity: event.capacity || null,
        tags: event.tags || [],
        is_featured: event.is_featured || false,
        status: event.status || "upcoming",
      });

      successCount++;
    } catch (error: any) {
      failedCount++;
      errors.push(`${event.title || "Unknown"}: ${error.message}`);
    }
  }

  await loadEvents(); // Recargar lista
  return { success: successCount, failed: failedCount, errors };
};
```

**En el header, agregar:**
```tsx
{isAdmin && (
  <ImportJSONButton
    onImport={handleImportEvents}
    promptSuggestion={IMPORT_PROMPTS.events}
    entityName="Eventos"
  />
)}
```

---

## 🎯 Funcionalidades del Componente

1. ✅ **Botón de importación JSON** - Solo visible para admins
2. ✅ **Botón de sugerencia de prompt** (💡 icono de bombilla)
3. ✅ **Modal con prompt completo** - Incluye formato y campos
4. ✅ **Copiar prompt al portapapeles** - Un clic
5. ✅ **Validación de JSON** - Verifica estructura
6. ✅ **Resultados detallados** - Muestra éxitos y errores
7. ✅ **Loading states** - Feedback visual

## 🔐 Seguridad

- Solo usuarios con rol `admin` pueden ver el botón de importación
- Se valida cada registro antes de insertar
- Los errores se capturan y reportan individualmente
- No se detiene todo el proceso si falla uno

## 📝 Uso

1. User admin hace clic en 💡 (bombilla)
2. Copia el prompt
3. Lo pega en ChatGPT/GPT-5
4. GPT genera el JSON
5. User hace clic en "Importar JSON"
6. Selecciona el archivo `.json`
7. ¡Listo! Se importan todos los registros

## ✨ Ventajas

- 🚀 **Rápido**: Importa 50+ registros en segundos
- 🎯 **Preciso**: Auto-genera slugs y obtiene avatares
- 🔒 **Seguro**: Solo admins pueden importar
- 📊 **Informativo**: Muestra resultados detallados
- ♻️ **Reutilizable**: Un componente para todas las secciones
