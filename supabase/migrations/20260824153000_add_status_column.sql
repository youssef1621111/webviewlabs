-- Add status column to track client lead progress (pending, contacted, in_progress, done, archived)
alter table public.contact_submissions add column if not exists status text default 'pending';
update public.contact_submissions set status = 'pending' where status is null;
