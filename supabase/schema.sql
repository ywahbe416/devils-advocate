create extension if not exists pgcrypto;

create table if not exists public.debates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  intensity text not null default 'intense',
  messages jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.debates enable row level security;

create policy "Public read debates"
on public.debates
for select
to anon
using (true);

create policy "Service role manages debates"
on public.debates
for all
to service_role
using (true)
with check (true);
