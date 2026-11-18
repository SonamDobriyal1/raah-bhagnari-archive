-- Catalogue of public source material, separate from private community contributions.
create schema if not exists archive_catalogue;
revoke all on schema archive_catalogue from public, anon, authenticated;
grant usage on schema archive_catalogue to service_role;
create table if not exists archive_catalogue.food_words (
 id text primary key,
 headword text not null,
 devanagari text not null,
 english_meaning text not null,
 source_record jsonb not null
);
create table if not exists archive_catalogue.recipes (
 id text primary key,
 name text not null,
 cook_credit text not null,
 pdf_pages integer[] not null check (cardinality(pdf_pages)>0),
 source_url text not null,
 source_record jsonb not null,
 updated_at timestamptz not null default now()
);
create table if not exists archive_catalogue.recipe_words (
 recipe_id text references archive_catalogue.recipes(id) on delete cascade,
 word_id text references archive_catalogue.food_words(id) on delete cascade,
 match_note text not null,
 primary key(recipe_id,word_id)
);
alter table archive_catalogue.food_words enable row level security;
alter table archive_catalogue.recipes enable row level security;
alter table archive_catalogue.recipe_words enable row level security;
revoke all on all tables in schema archive_catalogue from public, anon, authenticated;
grant select, insert, update, delete on all tables in schema archive_catalogue to service_role;
comment on schema archive_catalogue is 'Preserved-source recipe catalogue. The public website uses a local versioned snapshot so reading does not depend on database availability. No community contact or private media records belong here.';
