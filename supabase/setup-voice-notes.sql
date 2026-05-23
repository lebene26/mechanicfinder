-- Voice notes setup — run ALL of this in Supabase → SQL Editor → Run
-- Fixes: "Bucket not found" and enables long recordings (up to 5 min / 50 MB)

-- ── Step 1: messages table ──────────────────────────────────────────
alter table public.messages
  drop constraint if exists messages_message_type_check;

alter table public.messages
  add column if not exists audio_url text;

alter table public.messages
  add constraint messages_message_type_check
  check (message_type in ('text', 'image', 'location', 'audio'));

-- ── Step 2: create storage bucket ─────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-media',
  'chat-media',
  true,
  52428800,
  array[
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/mp4',
    'audio/ogg',
    'audio/ogg;codecs=opus',
    'audio/mpeg'
  ]
)
on conflict (id) do update
set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = excluded.allowed_mime_types;

-- ── Step 3: storage policies ────────────────────────────────────────
drop policy if exists "chat media upload" on storage.objects;
create policy "chat media upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'chat-media');

drop policy if exists "chat media read authenticated" on storage.objects;
create policy "chat media read authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'chat-media');

drop policy if exists "chat media public read" on storage.objects;
create policy "chat media public read"
  on storage.objects for select
  to public
  using (bucket_id = 'chat-media');

-- ── Verify (should return 1 row) ─────────────────────────────────────
select id, name, public, file_size_limit
from storage.buckets
where id = 'chat-media';
