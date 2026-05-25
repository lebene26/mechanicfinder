-- Run in Supabase SQL Editor to add image uploads to service requests.

-- 1. Add image_url column to service_requests
alter table public.service_requests
  add column if not exists image_url text;

-- 2. Allow image mime types in the chat-media bucket (reused for request photos)
update storage.buckets
set allowed_mime_types = array[
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/mpeg',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]
where id = 'chat-media';
