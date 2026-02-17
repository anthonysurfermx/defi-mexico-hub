-- Followed wallets: users can save Polymarket wallets to track
create table if not exists public.followed_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null,
  label text,
  created_at timestamptz not null default now(),
  unique(user_id, wallet_address)
);

-- RLS: users can only access their own followed wallets
alter table public.followed_wallets enable row level security;

create policy "Users can read own followed wallets"
  on public.followed_wallets for select
  using (auth.uid() = user_id);

create policy "Users can insert own followed wallets"
  on public.followed_wallets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own followed wallets"
  on public.followed_wallets for update
  using (auth.uid() = user_id);

create policy "Users can delete own followed wallets"
  on public.followed_wallets for delete
  using (auth.uid() = user_id);

-- Index for fast lookups
create index if not exists idx_followed_wallets_user_id on public.followed_wallets(user_id);
