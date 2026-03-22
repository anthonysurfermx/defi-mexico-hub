# 🔒 Guía: Ejecutar Security Fixes en Supabase

Esta guía te ayudará a ejecutar el script de seguridad `security_fixes.sql` en tu proyecto de Supabase.

## 📋 Opciones para Ejecutar el Script

Tienes **3 opciones** para aplicar estos fixes de seguridad:

### Opción 1: SQL Editor del Dashboard (Recomendado) ⭐

**La forma más fácil y directa:**

1. **Abre el Dashboard de Supabase**:
   - Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto: `egpixaunlnzauztbrnuz`

2. **Abre el SQL Editor**:
   - En el menú lateral, haz clic en **"SQL Editor"**
   - O ve directamente a: [SQL Editor](https://supabase.com/dashboard/project/egpixaunlnzauztbrnuz/sql)

3. **Crea una nueva query**:
   - Haz clic en **"+ New query"** o **"+ Nueva consulta"**

4. **Copia y pega el contenido**:
   - Abre el archivo `supabase/security_fixes.sql`
   - Selecciona todo el contenido (`Cmd+A` en macOS)
   - Copia (`Cmd+C`)
   - Pégalo en el SQL Editor de Supabase

5. **Ejecuta el script**:
   - Haz clic en **"Run"** o **"Ejecutar"** (o presiona `Cmd+Enter`)
   - Espera a que termine la ejecución (puede tomar unos segundos)

6. **Verifica el resultado**:
   - Deberías ver mensajes de éxito como "Success. No rows returned"
   - Si hay errores, se mostrarán en rojo

### Opción 2: Usar la Migración (Si tienes Supabase CLI)

Si tienes la CLI de Supabase configurada:

```bash
# Desde la raíz del proyecto
supabase db push
```

Esto aplicará automáticamente la migración `020_security_fixes.sql`.

### Opción 3: Dividir en Partes (Si hay problemas)

Si el script completo falla, puedes ejecutarlo en partes:

1. **Parte 1**: Habilitar RLS en tablas (líneas 1-293)
2. **Parte 2**: Arreglar vistas (líneas 295-327)
3. **Parte 3**: Arreglar funciones (líneas 329-781)
4. **Parte 4**: Arreglar políticas de jobs/advocates (líneas 783-839)

## ✅ Verificación Después de Ejecutar

Después de ejecutar el script, verifica que todo funcionó correctamente:

### 1. Verificar que RLS está habilitado:

Ejecuta esta query en el SQL Editor:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'fintech_funds', 
  'user_roles', 
  'newsletter_subscribers',
  'analytics_events', 
  'comments', 
  'likes', 
  'follows', 
  'system_config'
);
```

**Resultado esperado**: Todas las tablas deberían tener `rowsecurity = true`

### 2. Verificar que las funciones tienen search_path:

```sql
SELECT proname, prosecdef, proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN (
  'enroll_student_in_course',
  'get_blog_stats',
  'global_search',
  'is_admin_or_role'
);
```

**Resultado esperado**: Las funciones deberían tener `proconfig` con `search_path = ''`

### 3. Verificar que las políticas existen:

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'fintech_funds',
  'user_roles',
  'comments',
  'likes'
)
ORDER BY tablename, policyname;
```

**Resultado esperado**: Deberías ver todas las políticas creadas

## ⚠️ Advertencias Importantes

### ⚠️ Función `exec_sql` es Peligrosa

El script incluye una función `exec_sql` que permite ejecutar SQL arbitrario. **Es muy peligrosa**. 

**Recomendación**:
- Si no la necesitas, elimínala después de ejecutar el script:
  ```sql
  DROP FUNCTION IF EXISTS public.exec_sql(text);
  ```
- Si la necesitas, asegúrate de que solo los admins puedan usarla (ya está protegida en el script)

### ⚠️ Backup Antes de Ejecutar

Aunque el script es seguro (solo añade seguridad, no elimina datos), es buena práctica hacer un backup:

1. Ve a **Database** → **Backups** en el Dashboard
2. Crea un backup manual antes de ejecutar el script

## 🐛 Solución de Problemas

### Error: "policy already exists"

Si ves este error, significa que algunas políticas ya existen. El script usa `DROP POLICY IF EXISTS`, pero si aún así falla:

1. Elimina manualmente las políticas conflictivas
2. O ejecuta el script en partes

### Error: "function already exists"

Similar al anterior, algunas funciones pueden ya existir. El script usa `CREATE OR REPLACE`, así que debería funcionar, pero si hay problemas:

1. Elimina la función manualmente: `DROP FUNCTION IF EXISTS nombre_funcion(...);`
2. Vuelve a ejecutar esa parte del script

### Error: "permission denied"

Si ves errores de permisos:

1. Asegúrate de estar usando una cuenta con permisos de administrador
2. Verifica que estás conectado al proyecto correcto

## 📊 Qué Hace Este Script

Este script aplica los siguientes fixes de seguridad:

1. ✅ **Habilita RLS** en 8 tablas críticas
2. ✅ **Crea políticas de seguridad** apropiadas para cada tabla
3. ✅ **Arregla vulnerabilidades de search_path** en 20 funciones
4. ✅ **Arregla problemas de cascada RLS** en jobs y defi_advocates
5. ✅ **Mejora la seguridad** de la vista game_leaderboard

## 🎯 Próximos Pasos

Después de ejecutar el script:

1. ✅ Verifica que tu aplicación sigue funcionando correctamente
2. ✅ Prueba las funcionalidades principales (login, crear contenido, etc.)
3. ✅ Revisa los logs de Supabase por errores
4. ✅ Considera eliminar la función `exec_sql` si no la necesitas

## 📚 Archivos Relacionados

- **Script completo**: `supabase/security_fixes.sql`
- **Migración**: `supabase/migrations/020_security_fixes.sql`
- **Este archivo**: `EJECUTAR_SECURITY_FIXES.md`

---

**¿Necesitas ayuda?** Si encuentras algún problema, revisa los logs de Supabase o abre un issue en el repositorio.





