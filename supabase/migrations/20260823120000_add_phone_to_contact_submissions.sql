alter table public.contact_submissions
  add column if not exists phone text;

alter table public.contact_submissions
  alter column email drop not null;

alter table public.contact_submissions
  drop constraint if exists contact_submissions_email_check;

alter table public.contact_submissions
  add constraint contact_submissions_email_check
  check (email is null or char_length(email) between 5 and 254);

alter table public.contact_submissions
  drop constraint if exists contact_submissions_phone_check;

alter table public.contact_submissions
  add constraint contact_submissions_phone_check
  check (phone is null or char_length(phone) between 7 and 32);

do $$
begin
  if not exists (
    select 1 from public.contact_submissions where phone is null
  ) then
    alter table public.contact_submissions alter column phone set not null;
  end if;
end $$;
