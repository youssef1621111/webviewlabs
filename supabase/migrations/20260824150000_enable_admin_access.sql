-- Enable select, update, delete for admin management
grant select, update, delete on table public.contact_submissions to anon, authenticated;

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
