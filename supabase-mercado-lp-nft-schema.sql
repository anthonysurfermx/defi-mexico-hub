-- ===================================================================
-- MERCADO LP NFT CLAIMS - Database Schema
-- NFT claiming system for game completion
-- ===================================================================

-- Create nft_claims table
CREATE TABLE IF NOT EXISTS public.mercado_lp_nft_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- NFT Details
  nft_type VARCHAR(50) DEFAULT 'mercado_lp_maestro', -- Tipo de NFT
  token_id VARCHAR(255), -- ID del token NFT después de mint
  contract_address VARCHAR(255), -- Dirección del contrato NFT
  chain VARCHAR(50) DEFAULT 'base', -- Blockchain (base, optimism, etc)

  -- Claim Status
  claim_status VARCHAR(20) DEFAULT 'pending', -- pending, minting, completed, failed
  claimed_at TIMESTAMPTZ,
  minted_at TIMESTAMPTZ,

  -- Player Stats at Claim Time (snapshot)
  player_level INTEGER NOT NULL,
  player_xp INTEGER NOT NULL,
  total_swaps INTEGER DEFAULT 0,
  total_lp_provided DECIMAL(18, 2) DEFAULT 0,
  tokens_created INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Metadata adicional del NFT
  tx_hash VARCHAR(255), -- Hash de la transacción de mint
  error_message TEXT, -- Si falla el mint

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one NFT claim per user per type
  UNIQUE(user_id, nft_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nft_claims_user_id ON public.mercado_lp_nft_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_claims_status ON public.mercado_lp_nft_claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_nft_claims_created_at ON public.mercado_lp_nft_claims(created_at DESC);

-- RLS (Row Level Security) Policies
ALTER TABLE public.mercado_lp_nft_claims ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own NFT claims
CREATE POLICY "Users can view own NFT claims"
  ON public.mercado_lp_nft_claims
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own NFT claims
CREATE POLICY "Users can create own NFT claims"
  ON public.mercado_lp_nft_claims
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own NFT claims
CREATE POLICY "Users can update own NFT claims"
  ON public.mercado_lp_nft_claims
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all NFT claims
CREATE POLICY "Admins can view all NFT claims"
  ON public.mercado_lp_nft_claims
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_nft_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
DROP TRIGGER IF EXISTS trigger_update_nft_claims_updated_at ON public.mercado_lp_nft_claims;
CREATE TRIGGER trigger_update_nft_claims_updated_at
  BEFORE UPDATE ON public.mercado_lp_nft_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.update_nft_claims_updated_at();

-- Function to check if user can claim NFT
CREATE OR REPLACE FUNCTION public.can_claim_mercado_lp_nft(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_player_level INTEGER;
  v_player_xp INTEGER;
  v_already_claimed BOOLEAN;
BEGIN
  -- Get player level and XP
  SELECT level, xp INTO v_player_level, v_player_xp
  FROM public.game_progress
  WHERE user_id = p_user_id;

  -- Check if already claimed
  SELECT EXISTS(
    SELECT 1 FROM public.mercado_lp_nft_claims
    WHERE user_id = p_user_id
    AND nft_type = 'mercado_lp_maestro'
    AND claim_status IN ('completed', 'minting', 'pending')
  ) INTO v_already_claimed;

  -- Return true if level >= 4, XP >= 1000, and not already claimed
  RETURN (v_player_level >= 4 AND v_player_xp >= 1000 AND NOT v_already_claimed);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create NFT claim
CREATE OR REPLACE FUNCTION public.create_nft_claim(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_claim_id UUID;
  v_player_level INTEGER;
  v_player_xp INTEGER;
  v_total_swaps INTEGER;
  v_total_lp DECIMAL(18, 2);
  v_tokens_created INTEGER;
BEGIN
  -- Check if user can claim
  IF NOT public.can_claim_mercado_lp_nft(p_user_id) THEN
    RAISE EXCEPTION 'User does not meet requirements to claim NFT';
  END IF;

  -- Get player stats
  SELECT
    level,
    xp,
    swap_count,
    (stats->>'totalLPProvided')::DECIMAL,
    (stats->>'tokensCreated')::INTEGER
  INTO
    v_player_level,
    v_player_xp,
    v_total_swaps,
    v_total_lp,
    v_tokens_created
  FROM public.game_progress
  WHERE user_id = p_user_id;

  -- Create NFT claim
  INSERT INTO public.mercado_lp_nft_claims (
    user_id,
    nft_type,
    player_level,
    player_xp,
    total_swaps,
    total_lp_provided,
    tokens_created,
    claim_status,
    claimed_at,
    metadata
  ) VALUES (
    p_user_id,
    'mercado_lp_maestro',
    v_player_level,
    v_player_xp,
    v_total_swaps,
    COALESCE(v_total_lp, 0),
    COALESCE(v_tokens_created, 0),
    'pending',
    NOW(),
    jsonb_build_object(
      'name', 'Mercado LP Maestro',
      'description', 'Completó todos los niveles del juego educativo Mercado LP',
      'image', 'ipfs://...',
      'attributes', jsonb_build_array(
        jsonb_build_object('trait_type', 'Nivel', 'value', v_player_level),
        jsonb_build_object('trait_type', 'XP Total', 'value', v_player_xp),
        jsonb_build_object('trait_type', 'Swaps Completados', 'value', v_total_swaps),
        jsonb_build_object('trait_type', 'Tokens Creados', 'value', COALESCE(v_tokens_created, 0))
      )
    )
  )
  RETURNING id INTO v_claim_id;

  RETURN v_claim_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View para ver todos los NFTs reclamados
CREATE OR REPLACE VIEW public.mercado_lp_nft_claims_view AS
SELECT
  nc.id,
  nc.user_id,
  p.username,
  p.full_name,
  nc.nft_type,
  nc.token_id,
  nc.contract_address,
  nc.chain,
  nc.claim_status,
  nc.player_level,
  nc.player_xp,
  nc.claimed_at,
  nc.minted_at,
  nc.created_at
FROM public.mercado_lp_nft_claims nc
LEFT JOIN public.profiles p ON nc.user_id = p.id
ORDER BY nc.created_at DESC;

-- Grant permissions
GRANT SELECT ON public.mercado_lp_nft_claims_view TO authenticated;
GRANT ALL ON public.mercado_lp_nft_claims TO authenticated;

-- ===================================================================
-- COMMENTS
-- ===================================================================

COMMENT ON TABLE public.mercado_lp_nft_claims IS 'NFT claims for Mercado LP game completion';
COMMENT ON COLUMN public.mercado_lp_nft_claims.nft_type IS 'Type of NFT (mercado_lp_maestro, etc)';
COMMENT ON COLUMN public.mercado_lp_nft_claims.claim_status IS 'Status: pending, minting, completed, failed';
COMMENT ON COLUMN public.mercado_lp_nft_claims.metadata IS 'NFT metadata in OpenSea format';
COMMENT ON FUNCTION public.can_claim_mercado_lp_nft IS 'Check if user meets requirements to claim NFT';
COMMENT ON FUNCTION public.create_nft_claim IS 'Create a new NFT claim for user';
