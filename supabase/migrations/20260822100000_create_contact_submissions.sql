create table if not exists public.contact_submissions (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 32),
  email text check (email is null or char_length(email) between 5 and 254),
  company text not null check (char_length(company) between 2 and 160),
  brief text not null check (char_length(brief) between 10 and 4000),
  budget text not null default 'Not sure yet' check (char_length(budget) between 2 and 80),
  source text not null default 'webviewlabs-site' check (char_length(source) between 1 and 80),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.contact_submissions enable row level security;

revoke all on table public.contact_submissions from anon, authenticated;
grant insert on table public.contact_submissions to anon, authenticated;
grant usage, select on sequence public.contact_submissions_id_seq to anon, authenticated;

drop policy if exists "Public can submit a project brief" on public.contact_submissions;
create policy "Public can submit a project brief"
  on public.contact_submissions
  for insert
  to anon, authenticated
  with check (true);
