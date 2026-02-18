-- Scan counter: tracks total wallet scans for social proof
create table if not exists public.scan_counter (
  id text primary key,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Seed initial row
insert into public.scan_counter (id, count) values ('total_scans', 0)
on conflict (id) do nothing;

-- Public read, only RPC can increment
alter table public.scan_counter enable row level security;

create policy "Anyone can read scan counter"
  on public.scan_counter for select
  using (true);

-- RPC to atomically increment scan count
create or replace function public.increment_scan_count()
returns void
language sql
security definer
as $$
  update public.scan_counter
  set count = count + 1, updated_at = now()
  where id = 'total_scans';
$$;

-- Pro waitlist: captures emails for paid tier
create table if not exists public.pro_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.pro_waitlist enable row level security;

-- Anyone can insert (no auth required for waitlist signup)
create policy "Anyone can join waitlist"
  on public.pro_waitlist for insert
  with check (true);

-- Only service role can read (admin)
create policy "Service role can read waitlist"
  on public.pro_waitlist for select
  using (false);
