-- Adds an "admin" role + per-user "status" (active / suspended)
-- and the RLS policies / helpers required by the admin dashboard.
--
-- Run in Supabase → SQL Editor → Run.

-- 1. Allow 'admin' as a valid profile role -------------------------------------
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('client', 'mechanic', 'admin'));

-- 2. Account status (used by the admin to suspend users) ----------------------
alter table public.profiles
  add column if not exists status text not null default 'active'
  check (status in ('active', 'suspended'));

create index if not exists profiles_status_idx on public.profiles (status);
create index if not exists profiles_role_idx on public.profiles (role);

-- 3. Helper: is the current auth user an admin? --------------------------------
-- SECURITY DEFINER so it bypasses the profiles RLS when checking the caller's
-- own role (used inside other RLS policies on the same table).
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

-- 4. Admin RLS policies --------------------------------------------------------
-- Admin can read / update / delete every profile.
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

-- Admin can manage every mechanic_profiles row (useful when removing a mechanic)
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

-- 5. Promote your first administrator -----------------------------------------
-- Replace the email below with the address you used to sign up, then run:
--
--   update public.profiles
--      set role = 'admin'
--    where email = 'your-email@example.com';
--
-- Afterwards, log out and log back in — middleware will route you to /admin.
