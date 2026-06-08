create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.ai_usage enable row level security;

create policy "ai_usage: owner select" on public.ai_usage
  for select using (auth.uid() = user_id);
create policy "ai_usage: owner insert" on public.ai_usage
  for insert with check (auth.uid() = user_id);
