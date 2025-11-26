# 🔧 Setup Mercado LP Database en Supabase

## Problema Actual

El juego en `https://defimexico.org/academia/juego/mercado-lp` está dando errores porque las tablas de la base de datos **NO se han creado todavía en Supabase**.

**Errores que ves**:
- `Uncaught (in promise) Object` - Error de Supabase
- La página no carga correctamente
- Funciones RPC no existen

## Solución: Ejecutar los Schemas SQL

Necesitas ejecutar 2 archivos SQL en tu dashboard de Supabase:

### Paso 1: Acceder al SQL Editor de Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto: **egpixaunlnzauztbrnuz**
3. En el menú lateral, haz clic en **SQL Editor**

### Paso 2: Ejecutar el Schema de Game Progress

1. En el SQL Editor, haz clic en **"New query"**
2. Abre el archivo: `supabase-mercado-lp-schema.sql`
3. Copia **TODO** el contenido del archivo
4. Pégalo en el SQL Editor
5. Haz clic en **"Run"** (o presiona Ctrl+Enter / Cmd+Enter)

**Este schema crea**:
- ✅ Tabla `game_progress` - Para guardar el progreso del jugador
- ✅ View `game_leaderboard` - Para el leaderboard público
- ✅ Políticas RLS (Row Level Security)
- ✅ Triggers para actualizar timestamps
- ✅ Índices para performance

### Paso 3: Ejecutar el Schema de NFT Claims

1. En el SQL Editor, haz clic en **"New query"** de nuevo
2. Abre el archivo: `supabase-mercado-lp-nft-schema.sql`
3. Copia **TODO** el contenido del archivo
4. Pégalo en el SQL Editor
5. Haz clic en **"Run"**

**Este schema crea**:
- ✅ Tabla `mercado_lp_nft_claims` - Para claims de NFT
- ✅ Función RPC `can_claim_mercado_lp_nft()` - Verificar elegibilidad
- ✅ Función RPC `create_nft_claim()` - Crear claim de NFT
- ✅ View `mercado_lp_nft_claims_view` - Ver todos los claims
- ✅ Políticas RLS
- ✅ Triggers

### Paso 4: Verificar que se crearon correctamente

Después de ejecutar ambos scripts, verifica en Supabase:

#### Verificar Tablas

1. Ve a **Table Editor** en el menú lateral
2. Deberías ver estas nuevas tablas:
   - ✅ `game_progress`
   - ✅ `mercado_lp_nft_claims`

#### Verificar Funciones RPC

1. Ve a **Database** → **Functions** 
2. Deberías ver:
   - ✅ `can_claim_mercado_lp_nft`
   - ✅ `create_nft_claim`
   - ✅ `update_game_progress_updated_at`
   - ✅ `update_nft_claims_updated_at`

#### Verificar Views

1. Ve a **Database** → **Views**
2. Deberías ver:
   - ✅ `game_leaderboard`
   - ✅ `mercado_lp_nft_claims_view`

### Paso 5: Probar en la Web

Una vez ejecutados los schemas:

1. Ve a: https://defimexico.org/academia/juego/mercado-lp
2. Refresca la página (Ctrl+R / Cmd+R)
3. El juego debería cargar sin errores
4. Juega y completa niveles
5. Tu progreso se guardará automáticamente en Supabase

---

## Estructura de las Tablas Creadas

### Tabla: `game_progress`

```sql
Columns:
- id (UUID)
- user_id (UUID) → Referencia a auth.users
- xp (INTEGER)
- level (INTEGER)
- reputation (INTEGER)
- swap_count (INTEGER)
- inventory (JSONB)
- lp_positions (JSONB)
- badges (JSONB)
- stats (JSONB)
- pools (JSONB)
- tokens (JSONB)
- current_level (INTEGER)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Tabla: `mercado_lp_nft_claims`

```sql
Columns:
- id (UUID)
- user_id (UUID) → Referencia a auth.users
- nft_type (VARCHAR)
- token_id (VARCHAR)
- contract_address (VARCHAR)
- chain (VARCHAR)
- claim_status (VARCHAR) → pending, minting, completed, failed
- player_level (INTEGER)
- player_xp (INTEGER)
- total_swaps (INTEGER)
- total_lp_provided (DECIMAL)
- tokens_created (INTEGER)
- metadata (JSONB)
- tx_hash (VARCHAR)
- claimed_at (TIMESTAMPTZ)
- minted_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

---

## Solución de Problemas

### Si ves errores al ejecutar el SQL:

**Error: "relation already exists"**
- Esto es normal si ya ejecutaste el schema antes
- Los scripts usan `CREATE TABLE IF NOT EXISTS`, así que puedes ejecutarlos múltiples veces sin problema

**Error: "permission denied"**
- Asegúrate de estar logueado en Supabase con permisos de admin
- Verifica que estás en el proyecto correcto

**Error: "function does not exist"**
- Ejecuta primero `supabase-mercado-lp-schema.sql`
- Luego ejecuta `supabase-mercado-lp-nft-schema.sql`
- El segundo depende del primero (tabla `game_progress`)

### Si el juego sigue sin funcionar:

1. **Abre la consola del navegador** (F12)
2. Ve a la pestaña **Console**
3. Busca errores de Supabase
4. Copia el error y revisa:
   - ¿La tabla existe en Supabase?
   - ¿Las RLS policies están habilitadas?
   - ¿El usuario tiene acceso?

---

## URLs de Acceso

- **Juego**: https://defimexico.org/academia/juego/mercado-lp
- **Supabase Dashboard**: https://supabase.com/dashboard/project/egpixaunlnzauztbrnuz
- **SQL Editor**: https://supabase.com/dashboard/project/egpixaunlnzauztbrnuz/sql/new

---

## Archivos de Schemas

Los schemas SQL están en:
- `/Users/mrrobot/Documents/GitHub/defi-mexico-hub/supabase-mercado-lp-schema.sql`
- `/Users/mrrobot/Documents/GitHub/defi-mexico-hub/supabase-mercado-lp-nft-schema.sql`

---

**Fecha**: Noviembre 24, 2024  
**Status**: ⚠️ SCHEMAS PENDIENTES DE EJECUTAR EN SUPABASE
