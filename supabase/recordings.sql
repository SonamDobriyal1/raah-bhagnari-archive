-- Apply after schema.sql. Private bucket: no anonymous reads or writes.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('archive-recordings','archive-recordings',false,3000000,array['audio/webm','audio/mp4','audio/ogg','audio/wav','audio/x-wav','audio/mpeg'])
on conflict (id) do update set public=false,file_size_limit=3000000,allowed_mime_types=excluded.allowed_mime_types;
alter table public.contributions add column if not exists speaker_credit text;
alter table public.contributions add column if not exists pronunciation_variant text;
alter table public.contributions add column if not exists recorded_on date;
alter table public.contributions add column if not exists recording_consent boolean;
alter table public.contributions add column if not exists storage_bucket text;
alter table public.contributions add column if not exists storage_path text;
alter table public.contributions add column if not exists audio_mime text;
alter table public.contributions add column if not exists audio_bytes integer check (audio_bytes>0 and audio_bytes<=3000000);
-- No anon/authenticated storage policies are added. Service-side upload only.
-- Curators use the Supabase dashboard; approval does not automatically publish files.
