# 🔗 Guía de Configuración: Cursor + Supabase MCP

Esta guía te ayudará a conectar Cursor y/o Claude Code con Supabase utilizando el Model Context Protocol (MCP).

## 🤔 ¿Cuál es la Diferencia?

### Cursor (Chat Integrado)
- **Qué es**: IDE completo con chat de IA integrado directamente en el editor
- **Configuración**: Se hace desde la interfaz gráfica de Cursor (Settings → Features → MCP)
- **Uso**: El chat de Cursor puede usar MCP directamente para consultar tu base de datos
- **Ventaja**: Todo está integrado en un solo lugar, interfaz visual

### Claude Code / Claude Desktop
- **Qué es**: Extensión o aplicación separada de Claude AI
- **Configuración**: Se hace editando archivos de configuración JSON manualmente
- **Uso**: Claude puede usar MCP desde su propia interfaz
- **Ventaja**: Puede funcionar independientemente del IDE

### ¿Son lo Mismo?
**Sí y No**:
- ✅ **Sí**: Ambos usan el mismo protocolo MCP y el mismo servidor de Supabase (`@supabase/mcp-server-supabase`)
- ✅ **Sí**: Ambos requieren el mismo token de acceso y Project Reference ID
- ❌ **No**: La configuración se hace de forma diferente (interfaz vs archivo JSON)
- ❌ **No**: Son herramientas separadas, configurar una no configura la otra

**Recomendación**: Si solo usas Cursor, configura solo Cursor. Si usas ambos, necesitas configurarlos por separado.

## 📋 Requisitos Previos

- Cursor instalado y actualizado (y/o Claude Code/Desktop)
- Cuenta de Supabase activa
- Acceso a tu proyecto de Supabase: `egpixaunlnzauztbrnuz`

## 🚀 Pasos de Configuración

### Opción 1: Configuración desde la Interfaz de Cursor (Recomendado)

#### Paso 1: Crear un Token de Acceso Personal (PAT) en Supabase

1. **Accede a tu cuenta de Supabase**:
   - Ve a [https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
   - O navega a: **Account Settings** → **Access Tokens**

2. **Genera un nuevo token**:
   - Haz clic en **"Generate New Token"** o **"Generar Nuevo Token"**
   - Asigna un nombre descriptivo: `Cursor MCP Server`
   - **⚠️ IMPORTANTE**: Copia el token inmediatamente, ya que no podrás verlo nuevamente
   - Guarda el token en un lugar seguro

3. **Obtén el Project Reference ID**:
   - Ve a tu proyecto: `egpixaunlnzauztbrnuz`
   - El Project Reference es la parte de la URL antes de `.supabase.co`
   - En tu caso: `egpixaunlnzauztbrnuz`

#### Paso 2: Configurar el Servidor MCP en Cursor

1. **Abre la configuración de MCP en Cursor**:
   - Abre Cursor
   - Ve a `Cursor` → `Settings` (o `Preferencias` en macOS)
   - Navega a `Features` → `MCP` (Model Context Protocol)

2. **Añade un nuevo servidor MCP**:
   - Haz clic en el botón **"+ Add New MCP Server"** o **"+ Añadir nuevo servidor MCP"**

3. **Configura el servidor Supabase**:
   - **Nombre**: `Supabase` (o cualquier nombre descriptivo)
   - **Tipo de Transporte**: `stdio` (Standard Input/Output)
   - **Comando**: 
     ```bash
     npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=egpixaunlnzauztbrnuz
     ```
     - Reemplaza `egpixaunlnzauztbrnuz` con tu Project Reference ID
     - El flag `--read-only` garantiza que solo se puedan hacer consultas (recomendado)

4. **Configura las Variables de Entorno**:
   - En la sección de **Environment Variables** o **Variables de Entorno**, añade:
     - **Nombre**: `SUPABASE_ACCESS_TOKEN`
     - **Valor**: Pega aquí el Token de Acceso Personal que generaste en el Paso 1

5. **Verifica la conexión**:
   - Guarda la configuración
   - El servidor debería aparecer en tu lista de servidores MCP
   - Haz clic en el botón de actualizar para confirmar que las herramientas están disponibles
   - Deberías ver herramientas como: `list_tables`, `query_table`, `get_table_schema`, etc.

### Opción 2: Configuración Manual (Archivo de Configuración)

Si prefieres configurar manualmente, puedes editar el archivo de configuración de Cursor:

**Ubicación del archivo de configuración en macOS**:
```
~/Library/Application Support/Cursor/User/globalStorage/mcp.json
```

O en la configuración de usuario:
```
~/.cursor/mcp.json
```

**Nota**: Si el archivo no existe, créalo. Puedes usar el archivo de ejemplo `mcp-config.example.json` en la raíz del proyecto como referencia.

**Ejemplo de configuración**:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=egpixaunlnzauztbrnuz"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "tu_personal_access_token_aqui"
      }
    }
  }
}
```

**Nota**: 
- Reemplaza `egpixaunlnzauztbrnuz` con tu Project Reference ID
- Reemplaza `tu_personal_access_token_aqui` con el token que generaste en Supabase
- El flag `--read-only` es opcional pero recomendado para desarrollo

---

## 🎯 Configuración para Claude Code / Claude Desktop

Si también quieres usar Claude Code o Claude Desktop con Supabase MCP, sigue estos pasos:

### Paso 1: Localizar el Archivo de Configuración

**Ubicación del archivo de configuración en macOS**:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

O si usas Claude Code como extensión:
```
~/.claude/mcp.json
```

**Nota**: Si el archivo no existe, créalo.

### Paso 2: Configurar el Servidor MCP de Supabase

Edita el archivo de configuración y añade la siguiente configuración:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=egpixaunlnzauztbrnuz"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "tu_personal_access_token_aqui"
      }
    }
  }
}
```

**Reemplaza**:
- `egpixaunlnzauztbrnuz` con tu Project Reference ID
- `tu_personal_access_token_aqui` con tu token de acceso personal

### Paso 3: Reiniciar Claude

1. Guarda el archivo de configuración
2. Cierra completamente Claude Code/Desktop
3. Vuelve a abrir la aplicación
4. El servidor MCP debería estar disponible

### Paso 4: Verificar la Conexión

En Claude, puedes preguntar:
- "¿Qué tablas hay en mi base de datos de Supabase?"
- "Muéstrame la estructura de la tabla communities"

---

## 🔐 Obtener las Credenciales de Supabase

### Token de Acceso Personal (PAT) - Requerido

1. **Genera un Personal Access Token**:
   - Ve a [https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
   - Haz clic en **"Generate New Token"**
   - Nombre: `Cursor MCP Server`
   - **⚠️ Copia el token inmediatamente** - no podrás verlo de nuevo

### Project Reference ID - Requerido

1. **Obtén tu Project Reference ID**:
   - Ve a tu proyecto en [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto: `egpixaunlnzauztbrnuz`
   - El Project Reference es la parte de la URL antes de `.supabase.co`
   - En tu caso: `egpixaunlnzauztbrnuz`

### Otras Credenciales (Opcional - Solo para referencia)

Si necesitas las credenciales API para otros propósitos:

1. **Ve al Dashboard de Supabase**:
   - [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto: `egpixaunlnzauztbrnuz`

2. **Obtén las credenciales API**:
   - Ve a **Settings** → **API**
   - Copia los siguientes valores (si los necesitas):
     - **Project URL**: `https://egpixaunlnzauztbrnuz.supabase.co`
     - **anon/public key**: Tu clave pública (anon key)
     - **service_role key**: Tu clave de servicio (solo si necesitas permisos de administrador)

## ⚙️ Variables de Entorno

Si usas la configuración manual, el servidor MCP de Supabase requiere:

**Variable de Entorno Requerida**:
- `SUPABASE_ACCESS_TOKEN`: Tu Personal Access Token de Supabase

**Parámetros del Comando**:
- `--project-ref`: Tu Project Reference ID (ej: `egpixaunlnzauztbrnuz`)
- `--read-only`: (Opcional) Modo de solo lectura

**⚠️ IMPORTANTE**: 
- Nunca commitees tokens o credenciales al repositorio
- Añade archivos con credenciales a `.gitignore`
- Usa el modo `--read-only` en desarrollo para proteger tus datos

## 🧪 Verificar la Conexión

Una vez configurado, puedes verificar que MCP está funcionando:

1. **En Cursor**:
   - Abre el panel de MCP (si está disponible en la interfaz)
   - Deberías ver las herramientas de Supabase disponibles

2. **Prueba con un comando**:
   - Pregunta a Cursor: "¿Qué tablas hay en mi base de datos de Supabase?"
   - O: "Muéstrame la estructura de la tabla communities"

## 🛠️ Funcionalidades Disponibles

Una vez configurado, podrás usar Cursor para:

- ✅ Consultar datos de tu base de datos
- ✅ Crear y modificar tablas
- ✅ Ejecutar consultas SQL complejas
- ✅ Gestionar funciones de base de datos
- ✅ Ver y modificar políticas RLS (Row Level Security)
- ✅ Explorar el esquema de la base de datos

## 🔒 Consideraciones de Seguridad

### Modo de Solo Lectura (Recomendado para Desarrollo)

Si solo necesitas consultar datos sin modificarlos:

1. Activa el **modo de solo lectura** en la configuración de MCP
2. Esto ejecutará todas las consultas como un usuario de Postgres con permisos de solo lectura
3. Protege tus datos de modificaciones accidentales

### Entorno de Desarrollo vs Producción

- ✅ **Usa MCP en desarrollo**: Perfecto para explorar y entender tu base de datos
- ⚠️ **Evita MCP en producción**: No conectes MCP directamente a datos de producción sensibles
- 🔐 **Usa Service Role Key con precaución**: Solo si necesitas permisos de administrador

## 📚 Recursos Adicionales

- [Documentación oficial de Supabase MCP](https://supabase.com/mcp)
- [Guía de Model Context Protocol](https://modelcontextprotocol.io)
- [Video tutorial: Cómo instalar Supabase MCP en Cursor](https://www.youtube.com/watch?v=UrUw-ilChJg)

## 🐛 Solución de Problemas

### El servidor MCP no se conecta

1. **Verifica el Token de Acceso Personal**:
   - Asegúrate de que el `SUPABASE_ACCESS_TOKEN` sea correcto
   - Verifica que el token no haya expirado
   - Genera un nuevo token si es necesario

2. **Verifica el Project Reference ID**:
   - Asegúrate de que el `--project-ref` sea correcto
   - Debe ser solo el ID, sin `.supabase.co`

3. **Prueba el comando manualmente**:
   ```bash
   npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=egpixaunlnzauztbrnuz
   ```
   - Esto te ayudará a identificar errores específicos

4. **Verifica que tu proyecto esté activo**:
   - Ve al dashboard de Supabase
   - Asegúrate de que el proyecto no esté pausado

### No puedo ver las herramientas de Supabase

1. Reinicia Cursor después de la configuración
2. Verifica que el servidor MCP esté activo en la configuración
3. Revisa los logs de Cursor para errores

### Error de autenticación

1. **Verifica el Personal Access Token**:
   - Asegúrate de que el token sea válido y no haya expirado
   - Genera un nuevo token en [Account Settings → Access Tokens](https://supabase.com/dashboard/account/tokens)
   - Actualiza el `SUPABASE_ACCESS_TOKEN` en la configuración de Cursor

2. **Verifica los permisos del token**:
   - El token debe tener acceso a tu proyecto
   - Asegúrate de que el token no haya sido revocado

3. **Revisa los logs de Cursor**:
   - Abre la consola de desarrollador en Cursor
   - Busca errores relacionados con MCP o Supabase

## ✅ Checklist de Configuración

### Para Cursor:
- [ ] Cursor está actualizado a la última versión
- [ ] Has generado un Personal Access Token en Supabase
- [ ] Has copiado y guardado el token de forma segura
- [ ] Has identificado tu Project Reference ID (`egpixaunlnzauztbrnuz`)
- [ ] Has configurado el servidor MCP en Cursor con el comando correcto
- [ ] Has añadido la variable de entorno `SUPABASE_ACCESS_TOKEN`
- [ ] Has verificado que la conexión funciona
- [ ] Has probado una consulta simple (ej: "¿Qué tablas hay en mi base de datos?")

### Para Claude Code/Desktop:
- [ ] Claude Code/Desktop está instalado y actualizado
- [ ] Has localizado o creado el archivo de configuración de Claude
- [ ] Has añadido la configuración del servidor MCP de Supabase
- [ ] Has reiniciado Claude después de la configuración
- [ ] Has verificado que la conexión funciona
- [ ] Has probado una consulta simple

## 🎯 Próximos Pasos

Una vez configurado, puedes:

1. Explorar tu esquema de base de datos
2. Hacer consultas complejas usando lenguaje natural
3. Generar código basado en tu estructura de datos
4. Obtener ayuda con migraciones y cambios de esquema

---

**¿Necesitas ayuda?** Revisa la documentación oficial o abre un issue en el repositorio del proyecto.

