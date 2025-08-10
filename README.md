🚀 DeFi México Hub

<div align="center">
  <img src="public/logo.png" alt="DeFi México Hub" width="200"/>
  
  [![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-2.0-3ecf8e?logo=supabase)](https://supabase.com/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

## 📋 Descripción

**DeFi México Hub** es una plataforma centralizada para el ecosistema de finanzas descentralizadas en México. Conecta startups, desarrolladores, inversores y entusiastas en un solo lugar, promoviendo la innovación y colaboración en el espacio DeFi mexicano.

## ✨ Características Principales

### 🏢 Para Startups
- Directorio completo de proyectos DeFi mexicanos
- Perfiles detallados con métricas clave (TVL, usuarios activos)
- Sistema de categorización y búsqueda avanzada
- Panel de administración para gestionar información

### 📰 Blog & Contenido
- Artículos educativos sobre DeFi
- Noticias del ecosistema
- Tutoriales y guías técnicas
- Sistema de categorías y tags

### 📅 Eventos
- Calendario de eventos DeFi en México
- Información de meetups, workshops y conferencias
- Gestión de asistentes y registro
- Filtros por fecha y tipo de evento

### 👥 Comunidad
- Directorio de comunidades DeFi
- Enlaces a grupos de Telegram, Discord
- Estadísticas de participación
- Recursos compartidos

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** React 18.3 + TypeScript 5.5
- **Estilos:** Tailwind CSS 3.4
- **Componentes:** Shadcn/ui
- **Animaciones:** Framer Motion
- **Routing:** React Router v6
- **Build Tool:** Vite 5.4

### Backend & Base de Datos
- **BaaS:** Supabase
- **Base de Datos:** PostgreSQL
- **Autenticación:** Supabase Auth (próximamente)
- **Storage:** Supabase Storage (próximamente)

### Herramientas de Desarrollo
- **Linter:** ESLint
- **Formatter:** Prettier
- **Git Hooks:** Husky (próximamente)
- **Testing:** Vitest (próximamente)

## 🚀 Instalación y Configuración

### Prerequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta en [Supabase](https://supabase.com)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tuusuario/defi-mexico-hub.git
cd defi-mexico-hub
2. Instalar dependencias
bashnpm install
# o
yarn install
3. Configurar variables de entorno
Crea un archivo .env.local en la raíz del proyecto:
envVITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
4. Configurar la base de datos
Ejecuta las siguientes queries en tu proyecto de Supabase:
<details>
<summary>📊 Schema de Base de Datos (click para expandir)</summary>
sql-- Tabla de Startups
CREATE TABLE IF NOT EXISTS startups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    founded_year INTEGER,
    categories TEXT[],
    status VARCHAR(50) DEFAULT 'active',
    featured BOOLEAN DEFAULT false,
    tvl DECIMAL(20, 2),
    active_users INTEGER,
    twitter_url TEXT,
    github_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT,
    author VARCHAR(255),
    category VARCHAR(100),
    tags TEXT[],
    image_url TEXT,
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Eventos
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    date DATE,
    time TIME,
    location VARCHAR(255),
    location_url TEXT,
    image_url TEXT,
    registration_url TEXT,
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    speakers TEXT[],
    tags TEXT[],
    status VARCHAR(50) DEFAULT 'upcoming',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX idx_startups_featured ON startups(featured);
CREATE INDEX idx_startups_categories ON startups USING GIN(categories);
CREATE INDEX idx_blog_posts_published ON blog_posts(published, published_at DESC);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN(tags);
CREATE INDEX idx_events_status ON events(status, date);
CREATE INDEX idx_events_tags ON events USING GIN(tags);
</details>
5. Ejecutar en desarrollo
bashnpm run dev
# La aplicación estará disponible en http://localhost:8080
📁 Estructura del Proyecto
defi-mexico-hub/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── admin/       # Componentes del panel admin
│   │   ├── layout/      # Layout components (Navbar, Footer)
│   │   └── ui/          # Componentes de Shadcn/ui
│   ├── pages/           # Páginas de la aplicación
│   │   ├── admin/       # Páginas del panel de administración
│   │   └── ...          # Páginas públicas
│   ├── services/        # Servicios y lógica de negocio
│   ├── lib/            # Utilidades y configuraciones
│   ├── types/          # Definiciones de TypeScript
│   └── App.tsx         # Componente principal y rutas
├── public/             # Archivos estáticos
├── .env.local          # Variables de entorno (no commitear)
└── package.json        # Dependencias y scripts
🎯 Milestone 1.0 - Funcionalidades Completadas
✅ Sistema Base

 Configuración inicial del proyecto
 Integración con Supabase
 Sistema de rutas con React Router
 Layout responsivo con Tailwind CSS
 Componentes base con Shadcn/ui

✅ Módulo de Startups

 CRUD completo de startups
 Vista pública con filtros y búsqueda
 Sistema de categorías
 Métricas (TVL, usuarios activos)
 Enlaces a redes sociales

✅ Módulo de Blog

 CRUD completo de posts
 Editor con soporte Markdown
 Sistema de categorías y tags
 Estados: publicado/borrador
 Búsqueda y paginación

✅ Módulo de Eventos

 CRUD completo de eventos
 Calendario de eventos
 Gestión de asistentes
 Estados: próximo/pasado/cancelado
 Información de ubicación

✅ Panel de Administración

 Dashboard con estadísticas
 Gestión de startups
 Gestión de blog posts
 Gestión de eventos
 Interfaz intuitiva y responsiva

🔄 Próximos Pasos (Milestone 2.0)
🔐 Autenticación y Usuarios

 Login con email/password
 OAuth (Google, GitHub)
 Roles y permisos
 Perfiles de usuario

📊 Analytics y Métricas

 Dashboard con gráficas
 Tracking de visitas
 Métricas de engagement
 Reportes exportables

🎨 Mejoras de UX

 Modo oscuro/claro
 PWA support
 Notificaciones push
 Búsqueda global

🧪 Testing y QA

 Tests unitarios con Vitest
 Tests E2E con Playwright
 CI/CD con GitHub Actions
 Monitoring con Sentry

📜 Scripts Disponibles
bash# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Build
npm run build        # Compila para producción
npm run preview      # Vista previa del build

# Linting
npm run lint         # Ejecuta ESLint

# Type checking
npm run type-check   # Verifica tipos de TypeScript
🤝 Contribuir
¡Las contribuciones son bienvenidas! Por favor:

Fork el proyecto
Crea una rama para tu feature (git checkout -b feature/AmazingFeature)
Commit tus cambios (git commit -m 'Add: Amazing Feature')
Push a la rama (git push origin feature/AmazingFeature)
Abre un Pull Request

📄 Licencia
Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.
👥 Equipo

Tu Nombre - Desarrollo Full Stack - @tuusuario

🙏 Agradecimientos

Anthropic version Max Claude - Asistencia en desarrollo
ChatGPT5
Lovable versión pro
Shadcn/ui - Componentes UI
Supabase - Backend as a Service
Comunidad DeFi México - Apoyo y feedback

📞 Contacto
Telegram: t.me/defimexico


<div align="center">
  Hecho con ❤️ para el ecosistema DeFi mexicano
</div>
```