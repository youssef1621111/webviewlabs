create table if not exists public.contact_submissions (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 32),
  email text check (email is null or char_length(email) between 5 and 254),
  company text not null check (char_length(company) between 2 and 160),
  brief text not null check (char_length(brief) between 2 and 4000),
  budget text not null default 'Not sure yet' check (char_length(budget) between 2 and 80),
  source text not null default 'webviewlabs-site' check (char_length(source) between 1 and 80),
  status text default 'pending',
  documents jsonb default '{}'::jsonb,
  deal_value text default '',
  email_status text default 'pending',
  phone_status text default 'pending',
  notification_payload jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.contact_submissions enable row level security;

grant all on table public.contact_submissions to anon, authenticated, service_role;
grant usage, select on sequence public.contact_submissions_id_seq to anon, authenticated, service_role;

drop policy if exists "Public can submit a project brief" on public.contact_submissions;
create policy "Public can submit a project brief"
  on public.contact_submissions
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow select on contact_submissions" on public.contact_submissions;
create policy "Allow select on contact_submissions"
  on public.contact_submissions
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow update on contact_submissions" on public.contact_submissions;
create policy "Allow update on contact_submissions"
  on public.contact_submissions
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Allow delete on contact_submissions" on public.contact_submissions;
create policy "Allow delete on contact_submissions"
  on public.contact_submissions
  for delete
  to anon, authenticated
  using (true);
