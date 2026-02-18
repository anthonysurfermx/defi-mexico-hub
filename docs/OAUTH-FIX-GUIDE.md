# Guía de Solución: OAuth Login y Dashboard Admin

## 🔍 Problema Identificado

El dashboard admin no se visualiza correctamente después del login con OAuth, pero funciona con login directo por email/password.

## 🎯 Causa Raíz

1. **Falta de perfil en la base de datos**: Cuando usuarios se registran vía OAuth (Google, GitHub, etc.), no se crea automáticamente un registro en la tabla `profiles`.
2. **Sin perfil, sin rol**: El sistema de autenticación ahora busca el rol del usuario en `profiles.role`, pero si no existe el perfil, no puede determinar si es admin/editor.
3. **Resultado**: Usuario autenticado pero sin acceso al dashboard admin.

## ✅ Soluciones Implementadas

### 1. Eliminación de Hardcoded Emails

**Archivo modificado**: `src/hooks/useAuth.tsx`

Se eliminaron las listas hardcodeadas de emails en:
- Función `initializeAuth` (OAuth flow)
- Event handler `SIGNED_IN` (todas las autenticaciones)

**Antes** (líneas 160-166, 245-254):
```typescript
const adminUsers: Record<string, string> = {
  'YOUR_ADMIN_EMAIL': 'admin',
  'guillermos22@gmail.com': 'editor',
  'fabiancepeda102@gmail.com': 'editor',
};
```

**Después** (líneas 162-174):
```typescript
// Cargar perfil desde la base de datos
const { data: profileData, error: profileError } = await supabase
  .from('profiles')
  .select('id, email, role, is_active')
  .eq('id', currentUser.id)
  .single();
```

### 2. Carga de Perfil en OAuth Flow

El flujo OAuth ahora:
1. Procesa los tokens de autenticación
2. **Carga el perfil desde `profiles` table**
3. Usa `profileData.role` para determinar redirección
4. Redirige a `/admin` si es admin/editor
5. Redirige a `/user` si es usuario regular

### 3. Trigger Automático de Creación de Perfil

**Archivo creado**: `docs/create-profile-trigger.sql`

Este script SQL debe ejecutarse en Supabase para:
- Crear función `handle_new_user()` que inserta perfil automáticamente
- Crear trigger `on_auth_user_created` en `auth.users`
- Crear perfiles para usuarios existentes que no tienen uno

## 📋 Pasos para Completar la Solución

### Paso 1: Ejecutar el Trigger SQL en Supabase

1. Ir a Supabase Dashboard → SQL Editor
2. Abrir el archivo `docs/create-profile-trigger.sql`
3. Copiar y ejecutar todo el contenido
4. Verificar que muestra usuarios creados:
   ```sql
   SELECT
     COUNT(*) as total_users,
     COUNT(p.id) as users_with_profile,
     COUNT(*) - COUNT(p.id) as users_without_profile
   FROM auth.users au
   LEFT JOIN public.profiles p ON p.id = au.id;
   ```

   **Resultado esperado**: `users_without_profile = 0`

### Paso 2: Asignar Roles a Usuarios Existentes

Si hay usuarios que necesitan ser admin o editor:

```sql
-- Actualizar rol de un usuario específico
UPDATE profiles
SET role = 'admin'  -- o 'editor'
WHERE email = 'YOUR_ADMIN_EMAIL';

-- Verificar
SELECT email, role, is_active
FROM profiles
WHERE role IN ('admin', 'editor')
ORDER BY email;
```

### Paso 3: Verificar la Seguridad RLS

Asegurarse de que las políticas RLS permiten a los usuarios leer su propio perfil:

```sql
-- Política para que usuarios lean su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Política para que admins vean todos los perfiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Paso 4: Probar el Flujo Completo

1. **Login con email/password** (ya funciona):
   - Login → Perfil cargado → Redirige a /admin si es admin/editor

2. **Login con OAuth** (ahora debería funcionar):
   - OAuth callback → Perfil cargado → Redirige a /admin si es admin/editor

3. **Registro nuevo con OAuth**:
   - OAuth signup → Trigger crea perfil con role='user' → Redirige a /user

### Paso 5: Monitorear Logs del Navegador

Abrir DevTools Console y buscar estos mensajes:

**OAuth exitoso**:
```
🔐 OAuth tokens detected in URL, processing...
✅ OAuth tokens processed successfully
📧 OAuth User email: usuario@ejemplo.com
🔍 Loading profile from database for OAuth user: <uuid>
✅ Profile loaded: { email: 'usuario@ejemplo.com', role: 'admin' }
🎯 OAuth: Redirecting admin to admin panel
```

**OAuth con error**:
```
❌ Error loading profile after OAuth: <error>
```

## 🔧 Debugging

Si el problema persiste, verificar:

### 1. ¿Se creó el perfil?
```sql
SELECT *
FROM profiles
WHERE email = '<email_del_usuario>';
```

### 2. ¿El trigger está activo?
```sql
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

### 3. ¿Las políticas RLS permiten lectura?
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';
```

### 4. Revisar logs en tiempo real
En la consola del navegador durante OAuth login, buscar:
- "Loading profile from database"
- "Profile loaded" o "Error loading profile"
- El objeto `profileData` con `role`

## 📊 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     FLUJO DE AUTENTICACIÓN                  │
└─────────────────────────────────────────────────────────────┘

1. Usuario inicia login (Email/Password o OAuth)
   │
   ├─> Email/Password
   │   ├─> signIn() en auth.service
   │   ├─> Supabase valida credenciales
   │   └─> Event SIGNED_IN dispara
   │
   └─> OAuth (Google/GitHub)
       ├─> Redirect a proveedor OAuth
       ├─> Callback con tokens
       ├─> exchangeCodeForSession()
       └─> Event SIGNED_IN dispara

2. Event Handler (onAuthStateChange)
   │
   ├─> Detecta evento SIGNED_IN
   ├─> Carga perfil desde profiles table:
   │   SELECT * FROM profiles WHERE id = user.id
   │
   ├─> setProfile(profileData)
   ├─> getRoles() usa profile.role
   │
   └─> Redirección según rol:
       ├─> admin/editor → /admin
       └─> user → /user

3. ProtectedRoute verifica acceso
   │
   ├─> Usa getRoles() para obtener roles
   ├─> Compara con requireAnyRole
   │
   └─> Autoriza o redirige a /unauthorized
```

## ✨ Mejoras Adicionales Realizadas

1. **Mejor logging**: Console logs más descriptivos para debugging
2. **Manejo de errores**: Try-catch en carga de perfil
3. **Timing optimizado**: Reducido timeout de 1000ms a 500ms
4. **Código más limpio**: Eliminada duplicación de lógica de roles

## 🎯 Checklist Final

- [x] Código de `useAuth.tsx` actualizado (sin hardcoded emails)
- [x] SQL trigger creado en `docs/create-profile-trigger.sql`
- [ ] **PENDIENTE**: Ejecutar trigger SQL en Supabase
- [ ] **PENDIENTE**: Asignar roles admin/editor a usuarios específicos
- [ ] **PENDIENTE**: Verificar políticas RLS en profiles
- [ ] **PENDIENTE**: Probar login con OAuth
- [ ] **PENDIENTE**: Verificar que dashboard carga correctamente

## 📞 Soporte

Si el problema persiste después de seguir estos pasos:
1. Revisar logs del navegador
2. Ejecutar queries de debugging en SQL Editor
3. Verificar que el trigger se ejecutó correctamente
4. Confirmar que los usuarios tienen perfiles con roles asignados
