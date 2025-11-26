# Guía de Implementación - Sistema de Propuestas DeFi Mexico Hub

## 📋 Resumen

Este documento describe la implementación del sistema de propuestas y gestión de contenido para DeFi Mexico Hub.

## 🎯 Objetivos del Sistema

1. **Sistema autogestionable**: Los usuarios pueden proponer contenido
2. **Flujo de aprobación**: Administradores revisan y aprueban propuestas
3. **Sistema de permisos**: Roles (admin, editor, user) con permisos específicos
4. **Trazabilidad**: Registro de actividad y notificaciones

## 📁 Estructura de Archivos Creados

```
src/
├── types/
│   ├── roles.ts                 ✅ Sistema de roles y permisos
│   └── proposals.ts             ✅ Tipos para propuestas y contenido
├── hooks/
│   ├── usePermissions.ts        ✅ Hook para verificar permisos
│   └── useProposals.ts          ✅ Hook para gestionar propuestas
└── docs/
    ├── database-schema.sql      ✅ Esquema completo de la base de datos
    └── IMPLEMENTATION_GUIDE.md  ✅ Esta guía
```

## 🗄️ Base de Datos

### Pasos para Configurar Supabase

1. **Ejecutar el esquema SQL**
   - Ir a Supabase Dashboard → SQL Editor
   - Copiar el contenido de `docs/database-schema.sql`
   - Ejecutar el script completo

2. **Verificar tablas creadas**
   ```sql
   -- Verificar que todas las tablas existen
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

3. **Crear usuario admin inicial**
   ```sql
   -- Primero crear el usuario en Supabase Auth
   -- Luego actualizar el perfil:
   INSERT INTO profiles (id, email, full_name, role, email_verified)
   VALUES (
     'YOUR_USER_ID',  -- ID del usuario de auth.users
     'admin@defimexico.com',
     'Admin DeFi Mexico',
     'admin',
     true
   );
   ```

### Estructura de Tablas Principales

#### `profiles`
- Extiende `auth.users` de Supabase
- Campos: `role`, `bio`, redes sociales, etc.

#### `proposals`
- Sistema genérico para todas las propuestas
- `content_type`: tipo de contenido (startup, event, etc.)
- `content_data`: JSONB flexible con los datos
- `status`: pending, approved, rejected, draft

#### Tablas de Contenido Aprobado
- `startups`: Startups aprobadas
- `events`: Eventos aprobados
- `communities`: Comunidades aprobadas
- `referents`: Referentes aprobados
- `courses`: Cursos de academia
- `blog_posts`: Posts de blog

#### Tablas de Soporte
- `notifications`: Notificaciones a usuarios
- `activity_log`: Registro de auditoría

## 🔐 Sistema de Roles y Permisos

### Roles Definidos

```typescript
enum UserRole {
  ADMIN = 'admin',    // Acceso total
  EDITOR = 'editor',  // Puede editar y proponer
  USER = 'user'       // Solo puede proponer
}
```

### Permisos por Rol

#### Admin
- ✅ Ver dashboard y analytics
- ✅ Crear, editar, publicar y eliminar blog
- ✅ Aprobar/rechazar todas las propuestas
- ✅ Editar/eliminar todo el contenido
- ✅ Gestionar usuarios
- ✅ Gestionar academia

#### Editor
- ✅ Ver dashboard
- ✅ Crear, editar y publicar blog
- ✅ Proponer contenido (startups, eventos, etc.)
- ✅ Editar contenido ya aprobado
- ✅ Gestionar academia
- ❌ NO puede aprobar propuestas
- ❌ NO puede eliminar contenido
- ❌ NO puede gestionar usuarios

#### User
- ✅ Proponer contenido
- ✅ Ver sus propias propuestas
- ✅ Ver configuración personal
- ❌ NO puede editar contenido aprobado
- ❌ NO puede ver dashboard
- ❌ NO puede aprobar propuestas

## 🎣 Hooks Implementados

### `usePermissions()`

Hook para verificar permisos del usuario actual.

**Ejemplo de uso:**

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const {
    isAdmin,
    isEditor,
    hasPermission,
    canApprove,
    canPropose,
    canEdit
  } = usePermissions();

  if (!hasPermission('view_dashboard')) {
    return <AccessDenied />;
  }

  return (
    <div>
      {canApprove('startup') && (
        <ApproveButton />
      )}

      {canEdit('blog') && (
        <EditButton />
      )}
    </div>
  );
}
```

**API del hook:**

```typescript
{
  // Estado
  role: UserRole | null,
  permissions: Permission[],

  // Verificadores de permisos
  hasPermission: (permission: Permission) => boolean,
  hasAnyPermission: (permissions: Permission[]) => boolean,
  hasAllPermissions: (permissions: Permission[]) => boolean,

  // Verificadores de roles
  isAdmin: boolean,
  isEditor: boolean,
  isUser: boolean,

  // Helpers específicos
  canApprove: (contentType) => boolean,
  canPropose: (contentType) => boolean,
  canEdit: (contentType) => boolean,
  canDelete: (contentType) => boolean
}
```

### `useProposals()`

Hook para gestionar propuestas (crear, aprobar, rechazar).

**Ejemplo de uso:**

```typescript
import { useProposals } from '@/hooks/useProposals';

function ProposalsList() {
  const {
    proposals,
    loading,
    createProposal,
    approveProposal,
    rejectProposal
  } = useProposals({
    status: 'pending',
    contentType: 'startup'
  });

  const handleApprove = async (id: string) => {
    await approveProposal(id, 'Aprobado por calidad');
  };

  return (
    <div>
      {proposals.map(proposal => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          onApprove={() => handleApprove(proposal.id)}
        />
      ))}
    </div>
  );
}
```

**API del hook:**

```typescript
{
  proposals: Proposal[],
  loading: boolean,
  error: Error | null,

  // Métodos
  fetchProposals: () => Promise<void>,
  createProposal: (type, data) => Promise<{ data, error }>,
  approveProposal: (id, notes?) => Promise<{ error }>,
  rejectProposal: (id, notes) => Promise<{ error }>,
  deleteProposal: (id) => Promise<{ error }>,
  getProposal: (id) => Promise<{ data, error }>,
  refetch: () => Promise<void>
}
```

## 🚀 Flujo de Trabajo

### 1. Usuario Propone Contenido

```typescript
// Formulario de propuesta de startup
const { createProposal } = useProposals();

const handleSubmit = async (data: StartupProposalData) => {
  const { error } = await createProposal('startup', data);

  if (!error) {
    toast.success('Propuesta enviada!');
    navigate('/user/proposals');
  }
};
```

### 2. Admin Revisa Propuestas

```typescript
// Panel de administración
const { proposals, approveProposal, rejectProposal } = useProposals({
  status: 'pending'
});

// Aprobar
await approveProposal(proposalId, 'Excelente propuesta');

// Rechazar
await rejectProposal(proposalId, 'Falta información');
```

### 3. Migración Automática

Cuando se aprueba una propuesta:

1. Se actualiza el estado a `approved`
2. Se copia el contenido de `proposals.content_data` a la tabla correspondiente
3. Se crea una notificación para el usuario
4. Se registra en `activity_log`

## 📊 Próximos Pasos

### Fase 1: Componentes de UI ✅ COMPLETADO
- [x] Tipos TypeScript
- [x] Hooks de permisos
- [x] Hooks de propuestas
- [x] Schema SQL

### Fase 2: Admin Panel (Siguiente)
- [ ] Actualizar AdminLayout con nuevo sistema de permisos
- [ ] Crear componente ProposalList
- [ ] Crear componente ProposalCard
- [ ] Crear componente ProposalDetailModal
- [ ] Dashboard de propuestas pendientes

### Fase 3: Formularios de Propuesta
- [ ] Formulario de propuesta de Startup
- [ ] Formulario de propuesta de Evento
- [ ] Formulario de propuesta de Comunidad
- [ ] Formulario de propuesta de Referente
- [ ] Formulario de propuesta de Curso

### Fase 4: Panel de Usuario
- [ ] Vista de "Mis Propuestas"
- [ ] Vista de notificaciones
- [ ] Formularios de propuesta integrados

### Fase 5: Testing y Optimización
- [ ] Testing de permisos
- [ ] Testing de flujo completo
- [ ] Optimización de queries
- [ ] Documentación final

## 🔧 Configuración Requerida

### Variables de Entorno

Asegúrate de tener configuradas en `.env`:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### Actualizar useAuth (IMPORTANTE)

El hook `useAuth` actual debe ser compatible con el nuevo sistema. Ya tiene:
- ✅ `getRoles()` - Retorna array de roles
- ✅ `hasRole()` - Verifica rol específico
- ✅ `isAdmin()` - Verifica si es admin

## 📝 Notas Importantes

1. **Permisos RLS**: Las políticas de Row Level Security están configuradas para proteger los datos según el rol

2. **Notificaciones Automáticas**: El trigger `notify_proposal_decision` crea notificaciones automáticamente

3. **Auditoría**: Todas las acciones importantes se registran en `activity_log`

4. **Tipos Flexibles**: `proposals.content_data` es JSONB, lo que permite flexibilidad en los datos

5. **Migración**: Al aprobar, el contenido se copia automáticamente a la tabla correspondiente

## 🐛 Troubleshooting

### Error: "permission denied for table proposals"
- Verificar que las políticas RLS estén configuradas
- Verificar que el usuario tenga el rol correcto en `profiles`

### Error: "column does not exist"
- Verificar que el schema SQL se haya ejecutado completamente
- Revisar migraciones de Supabase

### Propuestas no se migran al aprobar
- Verificar que `content_data` tenga todos los campos requeridos
- Revisar logs del servidor en Supabase

## 📚 Recursos

- [Documentación de Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Hooks](https://react.dev/reference/react)

---

**Última actualización**: 2025-10-04
**Versión**: 1.0.0
