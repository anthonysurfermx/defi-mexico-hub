# Migración de Base de Datos - DeFi Mexico Hub

## ✅ Estado Actual

- ✅ Tabla `profiles` ya existe
- ⏳ Necesitamos verificar y crear las demás tablas

---

## 📋 Paso 1: Verificar Estructura Actual

Ejecuta esto en SQL Editor para ver qué tablas ya tienes:

```sql
-- Ver todas las tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Ver estructura de profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;
```

---

## 📋 Paso 2: Crear ENUMs (si no existen)

Ejecuta estos uno por uno. Si alguno ya existe, sigue con el siguiente:

```sql
-- Enum para roles (puede que ya exista)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'editor', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para estados de propuesta
DO $$ BEGIN
  CREATE TYPE proposal_status AS ENUM ('pending', 'approved', 'rejected', 'draft');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para tipos de contenido
DO $$ BEGIN
  CREATE TYPE content_type AS ENUM ('startup', 'event', 'community', 'referent', 'blog', 'course');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para categorías de referentes
DO $$ BEGIN
  CREATE TYPE referent_category AS ENUM (
    'programadores',
    'abogados',
    'financieros',
    'diseñadores',
    'marketers',
    'otros'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
```

---

## 📋 Paso 3: Actualizar Profiles (si es necesario)

Si tu tabla `profiles` no tiene todos los campos, añádelos:

```sql
-- Agregar campos faltantes a profiles (ignora errores si ya existen)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS twitter_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
```

---

## 📋 Paso 4: Crear Tabla de Propuestas

```sql
-- Tabla de propuestas (verificar si existe primero)
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_type content_type NOT NULL,
  status proposal_status DEFAULT 'pending' NOT NULL,
  proposed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content_data JSONB NOT NULL,
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_content_data CHECK (jsonb_typeof(content_data) = 'object')
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_content_type ON proposals(content_type);
CREATE INDEX IF NOT EXISTS idx_proposals_proposed_by ON proposals(proposed_by);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at DESC);
```

---

## 📋 Paso 5: Crear Tablas de Contenido

### 5.1 Startups

```sql
CREATE TABLE IF NOT EXISTS public.startups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  country TEXT DEFAULT 'Mexico',
  city TEXT,
  website_url TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  funding_stage TEXT,
  total_funding DECIMAL(15,2),
  employee_count INTEGER,
  founded_year INTEGER,
  meta_title TEXT,
  meta_description TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_startups_slug ON startups(slug);
CREATE INDEX IF NOT EXISTS idx_startups_category ON startups(category);
CREATE INDEX IF NOT EXISTS idx_startups_is_featured ON startups(is_featured);
CREATE INDEX IF NOT EXISTS idx_startups_is_active ON startups(is_active);
```

### 5.2 Events

```sql
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  cover_image_url TEXT,
  event_type TEXT,
  format TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  timezone TEXT DEFAULT 'America/Mexico_City',
  location TEXT,
  venue_name TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Mexico',
  registration_url TEXT,
  website_url TEXT,
  streaming_url TEXT,
  organizer_name TEXT,
  organizer_logo_url TEXT,
  sponsors TEXT[] DEFAULT '{}',
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  price_info TEXT,
  tags TEXT[] DEFAULT '{}',
  topics TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
```

### 5.3 Communities

```sql
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  community_type TEXT,
  focus_area TEXT,
  main_url TEXT,
  telegram_url TEXT,
  discord_url TEXT,
  twitter_url TEXT,
  github_url TEXT,
  member_count INTEGER,
  is_verified BOOLEAN DEFAULT false,
  city TEXT,
  country TEXT DEFAULT 'Mexico',
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communities_slug ON communities(slug);
CREATE INDEX IF NOT EXISTS idx_communities_type ON communities(community_type);
CREATE INDEX IF NOT EXISTS idx_communities_is_featured ON communities(is_featured);
```

### 5.4 Referents

```sql
CREATE TABLE IF NOT EXISTS public.referents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  avatar_url TEXT,
  category referent_category NOT NULL,
  twitter_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  company TEXT,
  position TEXT,
  location TEXT,
  expertise_areas TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referents_slug ON referents(slug);
CREATE INDEX IF NOT EXISTS idx_referents_category ON referents(category);
CREATE INDEX IF NOT EXISTS idx_referents_is_active ON referents(is_active);
```

### 5.5 Courses

```sql
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  cover_image_url TEXT,
  syllabus JSONB,
  learning_outcomes TEXT[] DEFAULT '{}',
  prerequisites TEXT[] DEFAULT '{}',
  instructor_id UUID REFERENCES profiles(id),
  instructor_name TEXT,
  difficulty_level TEXT,
  duration_hours INTEGER,
  language TEXT DEFAULT 'es',
  is_free BOOLEAN DEFAULT true,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'MXN',
  enrollment_url TEXT,
  course_url TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  enrolled_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  status proposal_status DEFAULT 'draft',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_is_featured ON courses(is_featured);
```

---

## 📋 Paso 6: Tablas de Soporte

### 6.1 Notificaciones

```sql
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  related_type content_type,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
```

### 6.2 Activity Log

```sql
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type content_type,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_type ON activity_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
```

---

## 📋 Paso 7: Triggers y Funciones

### 7.1 Función para updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 7.2 Aplicar Triggers

```sql
-- Solo crear si no existen
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_startups_updated_at ON startups;
CREATE TRIGGER update_startups_updated_at BEFORE UPDATE ON startups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_communities_updated_at ON communities;
CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_referents_updated_at ON referents;
CREATE TRIGGER update_referents_updated_at BEFORE UPDATE ON referents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 7.3 Notificaciones Automáticas

```sql
CREATE OR REPLACE FUNCTION notify_proposal_decision()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, title, message, type, related_type, related_id)
    VALUES (
      NEW.proposed_by,
      CASE
        WHEN NEW.status = 'approved' THEN 'Propuesta Aprobada'
        ELSE 'Propuesta Rechazada'
      END,
      CASE
        WHEN NEW.status = 'approved' THEN 'Tu propuesta ha sido aprobada y publicada'
        ELSE 'Tu propuesta ha sido rechazada. ' || COALESCE(NEW.review_notes, '')
      END,
      'proposal_' || NEW.status,
      NEW.content_type,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_on_proposal_decision ON proposals;
CREATE TRIGGER notify_on_proposal_decision AFTER UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION notify_proposal_decision();
```

---

## 📋 Paso 8: Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE referents ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Policies para Profiles
DROP POLICY IF EXISTS "Usuarios pueden ver todos los perfiles" ON profiles;
CREATE POLICY "Usuarios pueden ver todos los perfiles"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON profiles;
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies para Proposals
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias propuestas" ON proposals;
CREATE POLICY "Usuarios pueden ver sus propias propuestas"
  ON proposals FOR SELECT
  USING (proposed_by = auth.uid());

DROP POLICY IF EXISTS "Admins y editores pueden ver todas las propuestas" ON proposals;
CREATE POLICY "Admins y editores pueden ver todas las propuestas"
  ON proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear propuestas" ON proposals;
CREATE POLICY "Usuarios autenticados pueden crear propuestas"
  ON proposals FOR INSERT
  WITH CHECK (auth.uid() = proposed_by);

DROP POLICY IF EXISTS "Solo admins pueden aprobar/rechazar propuestas" ON proposals;
CREATE POLICY "Solo admins pueden aprobar/rechazar propuestas"
  ON proposals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies para contenido público
DROP POLICY IF EXISTS "Todos pueden ver startups activas" ON startups;
CREATE POLICY "Todos pueden ver startups activas"
  ON startups FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Todos pueden ver eventos activos" ON events;
CREATE POLICY "Todos pueden ver eventos activos"
  ON events FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Todos pueden ver comunidades activas" ON communities;
CREATE POLICY "Todos pueden ver comunidades activas"
  ON communities FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Todos pueden ver referentes activos" ON referents;
CREATE POLICY "Todos pueden ver referentes activos"
  ON referents FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Todos pueden ver cursos activos" ON courses;
CREATE POLICY "Todos pueden ver cursos activos"
  ON courses FOR SELECT
  USING (is_active = true AND status = 'approved');

-- Admins acceso total
DROP POLICY IF EXISTS "Admins tienen acceso total a startups" ON startups;
CREATE POLICY "Admins tienen acceso total a startups"
  ON startups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies para Notificaciones
DROP POLICY IF EXISTS "Usuarios solo ven sus propias notificaciones" ON notifications;
CREATE POLICY "Usuarios solo ven sus propias notificaciones"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Sistema puede crear notificaciones" ON notifications;
CREATE POLICY "Sistema puede crear notificaciones"
  ON notifications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios pueden marcar sus notificaciones como leídas" ON notifications;
CREATE POLICY "Usuarios pueden marcar sus notificaciones como leídas"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Policies para Activity Log
DROP POLICY IF EXISTS "Solo admins pueden ver el log de actividad" ON activity_log;
CREATE POLICY "Solo admins pueden ver el log de actividad"
  ON activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## ✅ Verificación Final

```sql
-- Ver todas las tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Contar registros en cada tabla
SELECT
  'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'proposals', COUNT(*) FROM proposals
UNION ALL
SELECT 'startups', COUNT(*) FROM startups
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'communities', COUNT(*) FROM communities
UNION ALL
SELECT 'referents', COUNT(*) FROM referents
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'activity_log', COUNT(*) FROM activity_log;
```

---

## 🎯 Orden de Ejecución Recomendado

1. ✅ Paso 1: Verificar estructura actual
2. ✅ Paso 2: Crear ENUMs
3. ✅ Paso 3: Actualizar Profiles
4. ✅ Paso 4: Crear Proposals
5. ✅ Paso 5: Crear tablas de contenido (5.1 → 5.5)
6. ✅ Paso 6: Crear tablas de soporte
7. ✅ Paso 7: Crear triggers y funciones
8. ✅ Paso 8: Configurar RLS
9. ✅ Verificación Final
