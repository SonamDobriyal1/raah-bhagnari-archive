-- Private intake for gallery and camera photographs. Run after schema.sql and recordings.sql.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('archive-photos','archive-photos',false,3000000,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=3000000,allowed_mime_types=excluded.allowed_mime_types;
alter table public.contributions add column if not exists photographer_credit text;
alter table public.contributions add column if not exists photograph_location text;
alter table public.contributions add column if not exists photographed_on date;
alter table public.contributions add column if not exists photo_consent boolean;
alter table public.contributions add column if not exists photo_mime text;
alter table public.contributions add column if not exists photo_bytes integer check (photo_bytes>0 and photo_bytes<=3000000);
