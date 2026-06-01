-- MechanicFinder: run this in Supabase → SQL Editor → Run
-- https://supabase.com/dashboard/project/_/sql

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'client' check (role in ('client', 'mechanic', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_status_idx on public.profiles (status);

-- Mechanic workshop profiles
create table if not exists public.mechanic_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  workshop_name text not null,
  description text,
  location text not null,
  address text,
  phone text,
  specialties text[] not null default '{}',
  is_available boolean not null default true,
  rating numeric(3, 2) not null default 0,
  total_reviews integer not null default 0,
  latitude double precision,
  longitude double precision,
  years_experience integer not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Service requests (client → mechanic)
create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  mechanic_id uuid not null references public.mechanic_profiles (id) on delete cascade,
  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')
  ),
  service_type text,
  description text,
  location text,
  latitude double precision,
  longitude double precision,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chat messages per request
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text,
  message_type text not null default 'text' check (
    message_type in ('text', 'image', 'location', 'audio')
  ),
  image_url text,
  audio_url text,
  location_data jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Reviews (client rates mechanic after completed service)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  mechanic_id uuid not null references public.mechanic_profiles (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  request_id uuid not null references public.service_requests (id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (request_id) -- one review per completed service request, not per client
);

-- Recalculate mechanic average rating when a review is submitted
create or replace function public.update_mechanic_rating_on_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.mechanic_profiles mp
  set
    rating = coalesce(
      (
        select round(avg(r.rating)::numeric, 2)
        from public.reviews r
        where r.mechanic_id = new.mechanic_id
      ),
      0
    ),
    total_reviews = (
      select count(*)::integer
      from public.reviews r
      where r.mechanic_id = new.mechanic_id
    ),
    updated_at = now()
  where mp.id = new.mechanic_id;

  return new;
end;
$$;

drop trigger if exists reviews_update_mechanic_rating on public.reviews;
create trigger reviews_update_mechanic_rating
  after insert on public.reviews
  for each row
  execute function public.update_mechanic_rating_on_review();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists mechanic_profiles_updated_at on public.mechanic_profiles;
create trigger mechanic_profiles_updated_at
  before update on public.mechanic_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists service_requests_updated_at on public.service_requests;
create trigger service_requests_updated_at
  before update on public.service_requests
  for each row execute function public.set_updated_at();

-- Create profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), ''),
    case
      when new.raw_user_meta_data->>'role' in ('client', 'mechanic')
      then new.raw_user_meta_data->>'role'
      else 'client'
    end
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    role = excluded.role,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for existing auth users (safe to re-run)
insert into public.profiles (id, email, full_name, phone, role)
select
  u.id,
  u.email,
  nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', '')), ''),
  nullif(trim(coalesce(u.raw_user_meta_data->>'phone', '')), ''),
  case
    when u.raw_user_meta_data->>'role' in ('client', 'mechanic')
    then u.raw_user_meta_data->>'role'
    else 'client'
  end
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.mechanic_profiles enable row level security;
alter table public.service_requests enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

-- Profiles policies
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Admin helper + policies (used by the /admin dashboard)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "mechanic_profiles_update_admin" on public.mechanic_profiles;
create policy "mechanic_profiles_update_admin"
  on public.mechanic_profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "mechanic_profiles_delete_admin" on public.mechanic_profiles;
create policy "mechanic_profiles_delete_admin"
  on public.mechanic_profiles for delete
  to authenticated
  using (public.is_admin());

-- Mechanic profiles policies
drop policy if exists "mechanic_profiles_select_authenticated" on public.mechanic_profiles;
create policy "mechanic_profiles_select_authenticated"
  on public.mechanic_profiles for select
  to authenticated
  using (true);

drop policy if exists "mechanic_profiles_insert_own" on public.mechanic_profiles;
create policy "mechanic_profiles_insert_own"
  on public.mechanic_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "mechanic_profiles_update_own" on public.mechanic_profiles;
create policy "mechanic_profiles_update_own"
  on public.mechanic_profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service requests policies
drop policy if exists "service_requests_select_participants" on public.service_requests;
create policy "service_requests_select_participants"
  on public.service_requests for select
  to authenticated
  using (
    client_id = auth.uid()
    or mechanic_id in (
      select mp.id from public.mechanic_profiles mp where mp.user_id = auth.uid()
    )
  );

drop policy if exists "service_requests_insert_client" on public.service_requests;
create policy "service_requests_insert_client"
  on public.service_requests for insert
  to authenticated
  with check (client_id = auth.uid());

drop policy if exists "service_requests_update_participants" on public.service_requests;

drop policy if exists "service_requests_mechanic_accept" on public.service_requests;
create policy "service_requests_mechanic_accept"
  on public.service_requests for update
  to authenticated
  using (
    status = 'pending'
    and mechanic_id in (
      select mp.id from public.mechanic_profiles mp where mp.user_id = auth.uid()
    )
  )
  with check (
    status = 'accepted'
    and mechanic_id in (
      select mp.id from public.mechanic_profiles mp where mp.user_id = auth.uid()
    )
  );

drop policy if exists "service_requests_mechanic_decline" on public.service_requests;
create policy "service_requests_mechanic_decline"
  on public.service_requests for update
  to authenticated
  using (
    status = 'pending'
    and mechanic_id in (
      select mp.id from public.mechanic_profiles mp where mp.user_id = auth.uid()
    )
  )
  with check (
    status = 'cancelled'
    and mechanic_id in (
      select mp.id from public.mechanic_profiles mp where mp.user_id = auth.uid()
    )
  );

drop policy if exists "service_requests_mechanic_start" on public.service_requests;
create policy "service_requests_mechanic_start"
  on public.service_requests for update
  to authenticated
  using (
    status = 'accepted'
    and mechanic_id in (
      select mp.id from public.mechanic_profiles mp where mp.user_id = auth.uid()
    )
  )
  with check (
    status = 'in_progress'
    and mechanic_id in (
      select mp.id from public.mechanic_profiles mp where mp.user_id = auth.uid()
    )
  );

drop policy if exists "service_requests_mechanic_complete" on public.service_requests;
create policy "service_requests_mechanic_complete"
  on public.service_requests for update
  to authenticated
  using (
    status = 'in_progress'
    and mechanic_id in (
      select mp.id from public.mechanic_profiles mp where mp.user_id = auth.uid()
    )
  )
  with check (
    status = 'completed'
    and mechanic_id in (
      select mp.id from public.mechanic_profiles mp where mp.user_id = auth.uid()
    )
  );

drop policy if exists "service_requests_client_cancel" on public.service_requests;
create policy "service_requests_client_cancel"
  on public.service_requests for update
  to authenticated
  using (
    client_id = auth.uid()
    and status in ('pending', 'accepted', 'in_progress')
  )
  with check (
    client_id = auth.uid()
    and status = 'cancelled'
  );

-- Messages policies
drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
  on public.messages for select
  to authenticated
  using (
    request_id in (
      select sr.id from public.service_requests sr
      where sr.client_id = auth.uid()
         or sr.mechanic_id in (
           select mp.id from public.mechanic_profiles mp where mp.user_id = auth.uid()
         )
    ) 
  );

drop policy if exists "messages_insert_participants" on public.messages;
create policy "messages_insert_participants"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and request_id in (
      select sr.id from public.service_requests sr
      where sr.client_id = auth.uid()
         or sr.mechanic_id in (
           select mp.id from public.mechanic_profiles mp where mp.user_id = auth.uid()
         )
    )
  );

-- Reviews policies (basic)
drop policy if exists "reviews_select_authenticated" on public.reviews;
create policy "reviews_select_authenticated"
  on public.reviews for select
  to authenticated
  using (true);

drop policy if exists "reviews_insert_client" on public.reviews;
create policy "reviews_insert_client"
  on public.reviews for insert
  to authenticated
  with check (
    client_id = auth.uid()
    and exists (
      select 1
      from public.service_requests sr
      where sr.id = reviews.request_id
        and sr.client_id = auth.uid()
        and sr.mechanic_id = reviews.mechanic_id
        and sr.status = 'completed'
    )
  );

create or replace function public.submit_service_review(
  p_request_id uuid,
  p_rating integer,
  p_comment text default null
)
returns public.reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.service_requests;
  v_review public.reviews;
begin
  if p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5';
  end if;

  select * into v_request
  from public.service_requests
  where id = p_request_id;

  if not found then
    raise exception 'Service request not found';
  end if;

  if v_request.client_id is distinct from auth.uid() then
    raise exception 'Only the client can review this service';
  end if;

  if v_request.status is distinct from 'completed' then
    raise exception 'You can review after the mechanic marks the job complete';
  end if;

  insert into public.reviews (
    mechanic_id,
    client_id,
    request_id,
    rating,
    comment
  )
  values (
    v_request.mechanic_id,
    auth.uid(),
    p_request_id,
    p_rating,
    nullif(trim(p_comment), '')
  )
  returning * into v_review;

  return v_review;
exception
  when unique_violation then
    raise exception 'You already reviewed this service';
end;
$$;

revoke all on function public.submit_service_review(uuid, integer, text) from public;
grant execute on function public.submit_service_review(uuid, integer, text) to authenticated;

-- Chat media storage (voice notes + request photos — 50 MB per file)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-media',
  'chat-media',
  true,
  52428800,
  array[
    'audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg', 'audio/ogg;codecs=opus', 'audio/mpeg',
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

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

-- Realtime for live chat (skip if this line errors on re-run)
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;
