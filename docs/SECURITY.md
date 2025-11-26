# 🔐 Guía de Seguridad - DeFi Mexico Hub

## 📋 Resumen de Seguridad

Este documento describe las medidas de seguridad implementadas en el sistema de propuestas y gestión de contenido.

---

## 🛡️ Vulnerabilidades Encontradas y Corregidas

### ❌ Problemas Detectados

1. **Falta de validación de email_verified**
   - Los usuarios no verificados podían crear propuestas
   - **Solucionado**: Policy `verified_users_create_proposals`

2. **Políticas RLS demasiado permisivas**
   - Usuarios podían actualizar propuestas aprobadas
   - **Solucionado**: Policy `users_update_own_pending_proposals`

3. **Sin validación de content_data**
   - Datos malformados podían insertarse en proposals
   - **Solucionado**: Trigger `validate_proposal_content_trigger`

4. **Escalación de privilegios posible**
   - Usuarios podían intentar cambiar su propio rol
   - **Solucionado**: Trigger `prevent_role_self_escalation_trigger`

5. **Sin auditoría de acciones administrativas**
   - No había log de aprobaciones/rechazos
   - **Solucionado**: Trigger `log_proposal_decision_trigger`

6. **Notificaciones insertables por usuarios**
   - Usuarios podían crear notificaciones falsas
   - **Solucionado**: Policy solo para `service_role`

---

## ✅ Medidas de Seguridad Implementadas

### 1. Row Level Security (RLS)

**Todas las tablas sensibles tienen RLS habilitado:**

```sql
-- Verificar RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

#### Políticas por Tabla

**PROPOSALS**
- ✅ Usuarios solo ven sus propias propuestas
- ✅ Admins/editores ven todas
- ✅ Solo usuarios verificados pueden crear
- ✅ Solo admins pueden aprobar/rechazar
- ✅ Usuarios solo editan propuestas pendientes

**STARTUPS/EVENTS/COMMUNITIES/REFERENTS**
- ✅ Público ve solo contenido activo
- ✅ Admins tienen acceso total
- ✅ Editores pueden ver todo (read-only en producción)

**PROFILES**
- ✅ Público ve perfiles activos
- ✅ Usuarios solo editan su propio perfil
- ✅ Usuarios NO pueden cambiar su propio rol
- ✅ Solo admins gestionan roles

**NOTIFICATIONS**
- ✅ Usuarios solo ven sus notificaciones
- ✅ Solo pueden marcarlas como leídas
- ✅ Solo el sistema puede crear notificaciones

**ACTIVITY_LOG**
- ✅ Solo admins pueden ver el log
- ✅ Solo el sistema puede insertar

### 2. Validación de Datos

**Trigger de Validación en Proposals:**

```sql
CREATE TRIGGER validate_proposal_content_trigger
  BEFORE INSERT OR UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION validate_proposal_content();
```

**Valida:**
- content_data es un objeto JSON válido
- Campos requeridos según content_type:
  - **startup**: name, description
  - **event**: title, start_date
  - **community**: name, description
  - **referent**: name, category
  - **course**: title, description

### 3. Prevención de Escalación de Privilegios

**Trigger en Profiles:**

```sql
CREATE TRIGGER prevent_role_self_escalation_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_self_escalation();
```

**Previene:**
- Usuarios cambien su propio rol
- Usuarios inactivos accedan al sistema
- Modificación de campos críticos sin permisos

### 4. Auditoría y Logging

**Activity Log automático:**

```sql
CREATE TRIGGER log_proposal_decision_trigger
  AFTER UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION log_proposal_decision();
```

**Registra:**
- Aprobaciones/rechazos de propuestas
- Usuario que realizó la acción
- Datos antiguos y nuevos
- Timestamp de la acción

### 5. Notificaciones Seguras

**Solo triggers pueden crear notificaciones:**

- Policy `system_insert_notifications` solo para `service_role`
- Trigger `notify_proposal_decision` crea notificaciones automáticamente
- Usuarios NO pueden insertar manualmente

---

## 🚨 Vulnerabilidades a Monitorear

### 1. Inyección SQL
**Status**: ✅ Protegido
- Supabase usa queries parametrizadas
- Nunca concatenar strings en queries

**Mal:**
```typescript
// ❌ NUNCA HACER ESTO
supabase.from('proposals').select(`* WHERE id = '${id}'`)
```

**Bien:**
```typescript
// ✅ CORRECTO
supabase.from('proposals').select('*').eq('id', id)
```

### 2. XSS (Cross-Site Scripting)
**Status**: ⚠️ Requiere atención en frontend

**En `content_data` JSONB:**
- Sanitizar antes de mostrar en UI
- Usar bibliotecas como DOMPurify

**Ejemplo:**
```typescript
import DOMPurify from 'dompurify';

// Sanitizar antes de renderizar
const safeHTML = DOMPurify.sanitize(proposal.content_data.description);
```

### 3. CSRF (Cross-Site Request Forgery)
**Status**: ✅ Protegido
- Supabase usa tokens JWT
- Headers `Authorization` requeridos

### 4. Rate Limiting
**Status**: ⚠️ Implementar en producción

**Recomendación:**
```typescript
// Implementar rate limiting en Supabase Edge Functions
// O usar middleware en el servidor
const rateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por ventana
});
```

### 5. Datos Sensibles en Logs
**Status**: ⚠️ Revisar

**NO logear:**
- Tokens de autenticación
- Datos personales (emails, teléfonos)
- Contraseñas o credenciales

**Mal:**
```typescript
// ❌ NO HACER
console.log('User data:', { email: user.email, password: password });
```

**Bien:**
```typescript
// ✅ CORRECTO
console.log('User authenticated:', { userId: user.id });
```

---

## 🔧 Configuración Recomendada

### Variables de Entorno

**NUNCA en código:**
```env
# .env (NO commitear)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # Solo backend
```

**En producción:**
- Usar secretos de Vercel/Netlify
- Rotar keys cada 90 días
- Service role key SOLO en backend

### Headers de Seguridad

**Configurar en hosting:**

```nginx
# Content Security Policy
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'

# X-Frame-Options
X-Frame-Options: DENY

# X-Content-Type-Options
X-Content-Type-Options: nosniff

# Strict-Transport-Security
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 📝 Checklist de Seguridad

### Base de Datos
- [x] RLS habilitado en todas las tablas
- [x] Policies restrictivas por defecto
- [x] Validación de datos en triggers
- [x] Logging de acciones administrativas
- [x] Prevención de escalación de privilegios

### Autenticación
- [x] Verificación de email requerida
- [x] Roles y permisos bien definidos
- [x] Tokens JWT seguros (Supabase)
- [ ] MFA/2FA (opcional, a implementar)

### Frontend
- [ ] Sanitización de HTML (DOMPurify)
- [ ] Validación de inputs en formularios
- [ ] Rate limiting en requests
- [ ] Error handling sin exponer info sensible

### Backend
- [x] Validación en base de datos
- [x] Policies RLS estrictas
- [ ] Rate limiting en Edge Functions
- [ ] Monitoreo de actividad sospechosa

---

## 🚀 Aplicar Mejoras de Seguridad

**Ejecuta este script en Supabase:**

```bash
# Archivo: docs/security-improvements.sql
```

Esto aplicará:
1. Políticas RLS mejoradas
2. Triggers de validación
3. Prevención de escalación de privilegios
4. Logging de auditoría
5. Notificaciones seguras

**Verificar después:**

```sql
-- Ver políticas activas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

---

## 📚 Recursos

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

## 🆘 Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:

1. **NO la publiques en issues públicos**
2. Contacta a: `security@defimexico.com`
3. Incluye:
   - Descripción del problema
   - Pasos para reproducir
   - Impacto potencial
   - Sugerencias de mitigación

---

**Última auditoría**: 2025-10-04
**Próxima revisión**: 2025-11-04
**Responsable**: Security Team
