# 🔐 Configuración de Supabase OAuth (Google)

## 📋 URLs de Configuración

### 🛠️ Desarrollo (Local)
```
Site URL: http://localhost:8080
Redirect URLs:
- http://localhost:8080
- http://localhost:8080/auth/callback
```

### 🚀 Producción
```
Site URL: https://defi-mexico-hub.vercel.app
Redirect URLs:
- https://defi-mexico-hub.vercel.app
- https://defi-mexico-hub.vercel.app/auth/callback
```

## ⚙️ Pasos de Configuración en Supabase

### 1. Dashboard de Supabase
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: `egpixaunlnzauztbrnuz`
3. Ve a **Authentication** → **URL Configuration**

### 2. Configurar URLs
#### Site URL
```
Desarrollo: http://localhost:8080
Producción: https://defi-mexico-hub.vercel.app
```

#### Redirect URLs (una por línea)
```
http://localhost:8080
http://localhost:8080/auth/callback
https://defi-mexico-hub.vercel.app
https://defi-mexico-hub.vercel.app/auth/callback
```

### 3. Configurar Google OAuth
1. Ve a **Authentication** → **Providers** → **Google**
2. Habilita Google como provider
3. Configura tu Google OAuth Client ID y Secret

## 🔧 Variables de Entorno

### Desarrollo (.env.local)
```env
VITE_SITE_URL=http://localhost:8080
VITE_SUPABASE_URL=https://egpixaunlnzauztbrnuz.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### Producción (Vercel)
```env
VITE_SITE_URL=https://defi-mexico-hub.vercel.app
VITE_SUPABASE_URL=https://egpixaunlnzauztbrnuz.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## 🧪 Testing

### Desarrollo
1. Inicia el servidor: `npm run dev`
2. Ve a: `http://localhost:8080/login`
3. Haz clic en "Google"
4. Deberías ser redirigido de vuelta a `http://localhost:8080` después del login

### Producción
1. Deploy tu aplicación a Vercel
2. Ve a: `https://defi-mexico-hub.vercel.app/login`
3. Haz clic en "Google"
4. Deberías ser redirigido de vuelta a la homepage después del login

## ✅ Verificación

### Casos de Éxito
- ✅ Login con Google funciona
- ✅ Usuario queda autenticado
- ✅ Redirección correcta después del login
- ✅ Tokens se procesan automáticamente
- ✅ URL se limpia de tokens sensibles

### Solución de Problemas
- ❌ Si el login no funciona, verifica las URLs en Supabase
- ❌ Si no te redirige, verifica `VITE_SITE_URL`
- ❌ Si ves errores de CORS, verifica que las URLs estén exactamente como se especifica
- ❌ Si el puerto es diferente, actualiza `VITE_SITE_URL`

## 🔄 Flujo de Autenticación

1. Usuario hace clic en "Google"
2. Se abre ventana de Google OAuth
3. Usuario se autentica con Google
4. Google redirige a `VITE_SITE_URL` con tokens en hash
5. `useAuth` detecta automáticamente los tokens
6. Tokens se procesan y establecen la sesión
7. URL se limpia de tokens sensibles
8. Usuario queda autenticado en la aplicación

## 🛡️ Seguridad

- Los tokens OAuth solo son válidos temporalmente
- Los tokens sensibles se eliminan de la URL después del procesamiento
- La redirección está limitada a dominios configurados en Supabase
- Las variables de entorno mantienen la configuración segura