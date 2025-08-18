# 🔧 Guía de Solución de Problemas - DeFi México Hub

## 🚨 Error: "Database error querying schema" en Login

### ✅ Lista de Verificación Rápida

- [ ] **1. Verificar variables de entorno**
  ```bash
  # Revisar que .env.local existe y tiene:
  VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJ...
  VITE_SITE_URL=http://localhost:8080
  ```

- [ ] **2. Test de conectividad básica**
  ```bash
  # En DevTools Console:
  __authEnv()  // Ver configuración
  __authPing() // Test de conexión
  ```

- [ ] **3. Ejecutar diagnóstico completo**
  ```sql
  -- En Supabase SQL Editor:
  -- Copiar contenido de: supabase/sql/00_check_auth_schema.sql
  ```

- [ ] **4. Revisar resultado del diagnóstico**
  - ✅ "Auth schema appears healthy" → El problema es otro
  - ⚠️ "Auth schema exists but missing tables" → Ejecutar fix script
  - ❌ "Auth schema completely missing" → Ejecutar fix script

### 🛠️ Soluciones por Escenario

#### Escenario A: Schema Missing/Corrupted
```sql
-- Ejecutar en Supabase SQL Editor:
-- Contenido de: supabase/sql/01_fix_auth_schema.sql
```

#### Escenario B: Todo parece normal pero sigue fallando
1. **Contactar a Supabase Support**:
   - Incluir Project ID: `rewyaxuqgkcqzqtsvwuu`
   - Incluir error exacto: "Database error querying schema"
   - Adjuntar resultado del script de diagnóstico

2. **Workaround temporal**:
   - Crear nuevo proyecto Supabase
   - Actualizar credenciales en `.env.local`
   - Ejecutar schema de base de datos

#### Escenario C: Opción Nuclear (⚠️ DESTRUCTIVA)
```sql
-- SOLO como último recurso:
-- Contenido de: supabase/sql/02_reset_auth_completely.sql
-- ⚠️ ESTO ELIMINA TODOS LOS USUARIOS
```

---

## 🌐 Otros Problemas Comunes

### 🚫 Error de CORS
**Síntomas**: Failed to fetch, CORS policy errors

**Soluciones**:
1. Verificar URL de Supabase en `.env.local`
2. Revisar allowlist de dominios en Supabase Dashboard
3. Verificar que `localhost:8080` esté permitido

### 📱 Problemas de Desarrollo Local

**Puerto ocupado**:
```bash
lsof -i :8080
npm run dev -- --port 3000
```

**Cache corrupto**:
```bash
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors**:
```bash
npm run type-check
# Revisar errores en consola
```

### 🔑 Problemas de Autenticación

**Usuario no puede registrarse**:
- Verificar que auth.users table existe
- Revisar configuración de email en Supabase
- Verificar RLS policies

**Sesión no persiste**:
- Verificar localStorage en DevTools
- Revisar configuración de cookies
- Verificar auth.sessions table

---

## 🆘 Contactar Soporte

### Información a Recopilar

1. **Error específico**:
   - Mensaje exacto del error
   - Timestamp cuando ocurrió
   - Pasos para reproducir

2. **Logs relevantes**:
   ```bash
   # DevTools Console (F12)
   # Network tab para ver requests fallidos
   # Resultado de scripts de diagnóstico
   ```

3. **Configuración**:
   - Versión de Node.js: `node --version`
   - Browser y versión
   - Sistema operativo

### Canales de Soporte

- **Supabase**: https://supabase.com/support
- **Discord**: https://discord.supabase.com
- **GitHub Issues**: https://github.com/supabase/supabase/issues

---

## 🧪 Scripts de Diagnóstico

### Browser Console Commands
```javascript
// Información del entorno
__authEnv()

// Test de conectividad
__authPing()

// Test completo de auth
__authTest('email@ejemplo.com', 'password')

// Limpiar sesión
__authClear()
```

### SQL Diagnostic Scripts
1. `supabase/sql/00_check_auth_schema.sql` - Diagnóstico completo
2. `supabase/sql/01_fix_auth_schema.sql` - Reparar schema
3. `supabase/sql/02_reset_auth_completely.sql` - Reset completo (DESTRUCTIVO)

### Debug URL
- Desarrollo: http://localhost:8080/debug-login
- Interfaz visual para testing

---

## 📞 Escalación

Si ninguna solución funciona:

1. **Documentar** el problema completamente
2. **Crear issue** en el repositorio del proyecto
3. **Contactar** al equipo de desarrollo
4. **Considerar** workarounds temporales

**Template de Issue**:
```markdown
## 🐛 Bug Report: Database error querying schema

### Descripción
[Descripción del problema]

### Pasos para Reproducir
1. [Paso 1]
2. [Paso 2]
3. [Error aparece]

### Resultado del Diagnóstico
```sql
[Pegar resultado de 00_check_auth_schema.sql]
```

### Entorno
- Node.js: [versión]
- Browser: [browser y versión]
- OS: [sistema operativo]

### Logs
```
[Logs de DevTools Console]
```
```

Recuerda: La mayoría de problemas de "Database error querying schema" se resuelven con los scripts SQL de reparación. Si no, es probable que necesites contactar a Supabase directamente.