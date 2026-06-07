create table if not exists public.user_sending_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  resend_api_key_encrypted text not null,
  resend_from_name text not null default 'MailHQ',
  resend_from_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_sending_settings enable row level security;

create policy "Users can read their own sending settings"
  on public.user_sending_settings
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sending settings"
  on public.user_sending_settings
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sending settings"
  on public.user_sending_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own sending settings"
  on public.user_sending_settings
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_user_sending_settings_updated_at on public.user_sending_settings;
create trigger set_user_sending_settings_updated_at
  before update on public.user_sending_settings
  for each row
  execute function public.set_updated_at();
