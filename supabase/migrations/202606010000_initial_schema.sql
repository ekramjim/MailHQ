-- contacts
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  institution text,
  category text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.contacts enable row level security;

create policy "contacts: owner select" on public.contacts
  for select using (auth.uid() = user_id);
create policy "contacts: owner insert" on public.contacts
  for insert with check (auth.uid() = user_id);
create policy "contacts: owner update" on public.contacts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "contacts: owner delete" on public.contacts
  for delete using (auth.uid() = user_id);

-- attachments
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_size bigint,
  mime_type text,
  created_at timestamptz not null default now()
);

alter table public.attachments enable row level security;

create policy "attachments: owner select" on public.attachments
  for select using (auth.uid() = user_id);
create policy "attachments: owner insert" on public.attachments
  for insert with check (auth.uid() = user_id);
create policy "attachments: owner delete" on public.attachments
  for delete using (auth.uid() = user_id);

-- campaigns
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  subject text not null,
  body text not null,
  ai_generated boolean not null default false,
  attachment_id uuid references public.attachments(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sent')),
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.campaigns enable row level security;

create policy "campaigns: owner select" on public.campaigns
  for select using (auth.uid() = user_id);
create policy "campaigns: owner insert" on public.campaigns
  for insert with check (auth.uid() = user_id);
create policy "campaigns: owner update" on public.campaigns
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "campaigns: owner delete" on public.campaigns
  for delete using (auth.uid() = user_id);

-- sends (no direct user_id — ownership flows through campaigns)
create table if not exists public.sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  outcome text check (outcome in ('interested', 'meeting_booked', 'not_interested', 'no_response')),
  replied_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.sends enable row level security;

create policy "sends: owner select" on public.sends
  for select using (
    campaign_id in (select id from public.campaigns where user_id = auth.uid())
  );
create policy "sends: owner insert" on public.sends
  for insert with check (
    campaign_id in (select id from public.campaigns where user_id = auth.uid())
  );
create policy "sends: owner update" on public.sends
  for update using (
    campaign_id in (select id from public.campaigns where user_id = auth.uid())
  );
create policy "sends: owner delete" on public.sends
  for delete using (
    campaign_id in (select id from public.campaigns where user_id = auth.uid())
  );
