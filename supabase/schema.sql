-- Run in the appointed archive owner's Supabase project.
-- All contributions remain private. No browser key may read or write this table.
create table if not exists public.contributions (
  reference text primary key,
  created_at timestamptz not null default now(),
  type text not null check (type in ('memory','word','translation','recipe','photograph','voice')),
  title text not null check (char_length(title) between 1 and 200),
  message text not null check (char_length(message) between 1 and 12000),
  source text not null default '',
  name text not null default '',
  contact text not null default '',
  record text not null default '',
  credit text not null,
  access text not null,
  consent boolean not null check (consent = true),
  consent_version text not null,
  status text not null default 'pending' check (status in ('pending','in_review','approved','declined','withdrawn')),
  curator_notes text,
  reviewed_at timestamptz
);
alter table public.contributions enable row level security;
revoke all on public.contributions from anon, authenticated;
grant select, insert, update, delete on public.contributions to service_role;
comment on table public.contributions is 'Private review queue. Approval is not automatic publication. Honour access and credit preferences before creating a public record.';
