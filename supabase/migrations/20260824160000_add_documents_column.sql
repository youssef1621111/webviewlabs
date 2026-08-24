-- Add documents JSONB column and deal_value for client contracts, proposals & invoices
alter table public.contact_submissions add column if not exists documents jsonb default '{}'::jsonb;
alter table public.contact_submissions add column if not exists deal_value text default '';
