-- Seed initial data for DeFi México Hub
-- Migration: 009_seed_initial_data.sql

-- Insert initial platform statistics
INSERT INTO platform_stats (
  total_communities, 
  active_communities, 
  total_members,
  total_events,
  upcoming_events,
  total_startups,
  featured_startups,
  total_blog_posts,
  published_posts,
  draft_posts
) VALUES (6, 6, 1475, 0, 0, 0, 0, 0, 0, 0)
ON CONFLICT (id) DO UPDATE SET
  total_communities = EXCLUDED.total_communities,
  active_communities = EXCLUDED.active_communities,
  total_members = EXCLUDED.total_members;

-- Insert sample contact form for testing (remove in production)
INSERT INTO contact_forms (
  name, 
  email, 
  subject, 
  message, 
  priority, 
  source,
  status
) VALUES 
(
  'Juan Pérez',
  'juan.perez@example.com',
  'Colaboración con DeFi México',
  'Hola, soy founder de una startup DeFi y me gustaría explorar oportunidades de colaboración con la comunidad. Tenemos un protocolo de lending que podría ser interesante para la comunidad mexicana.',
  'high',
  'website',
  'pending'
),
(
  'María González',
  'maria.gonzalez@example.com',
  'Consulta sobre evento',
  '¿Cuándo será el próximo meetup en CDMX? Me interesa mucho participar y conocer más sobre DeFi.',
  'medium',
  'social',
  'pending'
)
ON CONFLICT (email, subject) DO NOTHING;

-- Insert sample newsletter subscribers
INSERT INTO newsletter_subscribers (
  email, 
  name, 
  interests, 
  source,
  status,
  engagement_score
) VALUES 
(
  'crypto.enthusiast@example.com',
  'Ana Rivera',
  ARRAY['defi', 'trading', 'nft'],
  'website',
  'active',
  85
),
(
  'blockchain.dev@example.com',
  'Carlos Mendoza',
  ARRAY['development', 'web3', 'smart-contracts'],
  'event',
  'active',
  92
),
(
  'startup.founder@example.com',
  'Sofia Martinez',
  ARRAY['startups', 'funding', 'entrepreneurship'],
  'referral',
  'active',
  78
)
ON CONFLICT (email) DO NOTHING;

-- Insert sample startup application for testing
INSERT INTO startup_applications (
  startup_name,
  founder_name,
  founder_email,
  description,
  problem_statement,
  solution,
  target_market,
  business_model,
  traction,
  funding_stage,
  funding_amount_sought,
  team_size,
  location,
  industry,
  competitive_advantage,
  status
) VALUES (
  'DeFintech MX',
  'Roberto Silva',
  'roberto@defintech.mx',
  'Plataforma DeFi que conecta el sistema bancario tradicional mexicano con protocolos de finanzas descentralizadas, permitiendo a usuarios mexicanos acceder a mejores rendimientos sin la complejidad técnica típica de DeFi.',
  'Los usuarios mexicanos enfrentan barreras significativas para acceder a DeFi: complejidad técnica, falta de soporte en español, complicaciones con rampas de entrada/salida, y desconfianza hacia plataformas no reguladas.',
  'Una plataforma que actúa como puente entre bancos mexicanos y protocolos DeFi, ofreciendo una interfaz familiar similar a la banca online, soporte completo en español, cumplimiento regulatorio, y integración directa con cuentas bancarias mexicanas.',
  'Usuarios bancarizados en México de 25-45 años con ahorros de $50,000 MXN o más, buscando mejores rendimientos que los ofrecidos por bancos tradicionales (típicamente 2-5% anual).',
  'Freemium con comisiones por transacciones (0.5%) y servicios premium para usuarios institucionales. Ingresos adicionales por staking y yield farming automatizado.',
  'MVP funcionando con 150 usuarios beta, $500,000 MXN en TVL, alianza firmada con fintech mexicana establecida, y cartas de intención de 3 bancos regionales.',
  'seed',
  500000.00,
  8,
  'Ciudad de México',
  'Fintech',
  'Único player enfocado específicamente en el mercado mexicano con cumplimiento regulatorio desde el día 1 y partnerships bancarios establecidos.',
  'submitted'
)
ON CONFLICT (founder_email, startup_name) DO NOTHING;

-- Log the seed operation
SELECT log_event(
  'database_seeded',
  json_build_object(
    'migration', '009_seed_initial_data',
    'tables_seeded', ARRAY['platform_stats', 'contact_forms', 'newsletter_subscribers', 'startup_applications'],
    'environment', 'development'
  ),
  'info',
  'Initial seed data inserted for development environment'
);

-- Update platform stats after seeding
SELECT update_platform_stats();

-- Add helpful comments
COMMENT ON COLUMN startup_applications.startup_name IS 'Example: DeFintech MX - realistic Mexican DeFi startup';
COMMENT ON COLUMN contact_forms.message IS 'Sample messages show realistic use cases for the platform';
COMMENT ON COLUMN newsletter_subscribers.interests IS 'Interest arrays help test segmentation features';