-- Curator desk tables. Run once in the Supabase SQL editor.
-- The service role used by the API bypasses these policies.
-- The anon key used by the public website can only read published rows.

create table if not exists public.desk_journeys (
  id text primary key,
  year text not null default '',
  title text not null,
  place text not null default '',
  body text not null,
  source text not null default '',
  credit text not null default '',
  image text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.desk_words (
  id text primary key,
  headword text not null,
  devanagari text not null default '',
  meaning text not null,
  example text not null default '',
  translation text not null default '',
  theme text not null,
  hindi_meaning text,
  hindi_provenance text,
  notes jsonb not null default '[]'::jsonb,
  status text not null default 'verified',
  source text not null default 'community-curator',
  created_at timestamptz not null default now()
);

create table if not exists public.desk_removed_words (
  id text primary key,
  headword text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.desk_recipes (
  id text primary key,
  community boolean not null default true,
  name text not null,
  devanagari text not null default '',
  credit text not null default '',
  description text not null default '',
  ingredients jsonb not null default '[]'::jsonb,
  method jsonb not null default '[]'::jsonb,
  image text not null default '',
  word_ids jsonb not null default '[]'::jsonb,
  status text not null default 'published',
  source text not null default 'Family kitchen',
  created_at timestamptz not null default now()
);

create table if not exists public.desk_journey_requests (
  id text primary key,
  name text not null default '',
  contact text not null default '',
  from_place text not null default '',
  to_place text not null default '',
  years text not null default '',
  story text not null,
  share_name boolean not null default false,
  image_path text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.desk_recipe_submissions (
  id text primary key,
  name text not null,
  devanagari text not null default '',
  credit text not null default '',
  description text not null default '',
  ingredients jsonb not null default '[]'::jsonb,
  method jsonb not null default '[]'::jsonb,
  contact text not null default '',
  image_path text not null default '',
  created_at timestamptz not null default now()
);

alter table public.desk_journeys enable row level security;
alter table public.desk_words enable row level security;
alter table public.desk_removed_words enable row level security;
alter table public.desk_recipes enable row level security;
alter table public.desk_journey_requests enable row level security;
alter table public.desk_recipe_submissions enable row level security;

drop policy if exists "Public can read published journeys" on public.desk_journeys;
create policy "Public can read published journeys" on public.desk_journeys for select to anon, authenticated using (true);
drop policy if exists "Public can read added words" on public.desk_words;
create policy "Public can read added words" on public.desk_words for select to anon, authenticated using (true);
drop policy if exists "Public can read hidden words" on public.desk_removed_words;
create policy "Public can read hidden words" on public.desk_removed_words for select to anon, authenticated using (true);
drop policy if exists "Public can read family recipes" on public.desk_recipes;
create policy "Public can read family recipes" on public.desk_recipes for select to anon, authenticated using (true);

revoke all on table public.desk_journey_requests from anon, authenticated;
revoke all on table public.desk_recipe_submissions from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('archive-desk', 'archive-desk', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('archive-desk-pending', 'archive-desk-pending', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read published desk photographs" on storage.objects;
create policy "Public can read published desk photographs" on storage.objects for select to anon, authenticated using (bucket_id = 'archive-desk');
