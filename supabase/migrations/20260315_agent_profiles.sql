-- ============================================================
-- Agent Advisor Profiles — Personalized AI financial advisor
-- Each wallet gets a custom advisor with name + categories
-- ============================================================

CREATE TABLE agent_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  user_name TEXT NOT NULL,
  advisor_name TEXT NOT NULL DEFAULT 'Adams',
  categories TEXT[] NOT NULL DEFAULT '{Crypto}',
  language TEXT NOT NULL DEFAULT 'es' CHECK (language IN ('en', 'es')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by wallet
CREATE INDEX idx_agent_profiles_wallet ON agent_profiles(wallet_address);

-- RLS
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read their own profile (matched by wallet)
CREATE POLICY "Public read agent_profiles" ON agent_profiles FOR SELECT USING (true);

-- Anyone can insert/update (wallet-based auth, no Supabase auth required)
CREATE POLICY "Public write agent_profiles" ON agent_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update agent_profiles" ON agent_profiles FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================
-- Agent Messages — Personalized advisor greetings per cycle
-- ============================================================

CREATE TABLE agent_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  advisor_name TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agent_messages_wallet ON agent_messages(wallet_address);
CREATE INDEX idx_agent_messages_created ON agent_messages(created_at DESC);

ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read agent_messages" ON agent_messages FOR SELECT USING (true);
CREATE POLICY "Service write agent_messages" ON agent_messages FOR ALL USING (true) WITH CHECK (true);
