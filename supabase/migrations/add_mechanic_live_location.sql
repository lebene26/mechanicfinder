-- Live mechanic location while en route to a service request
create table if not exists public.mechanic_live_locations (
  request_id uuid primary key references public.service_requests (id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision,
  heading double precision,
  updated_at timestamptz not null default now()
);

create index if not exists mechanic_live_locations_updated_at_idx
  on public.mechanic_live_locations (updated_at desc);

alter table public.mechanic_live_locations enable row level security;

drop policy if exists "mechanic_live_locations_select_participants" on public.mechanic_live_locations;
create policy "mechanic_live_locations_select_participants"
  on public.mechanic_live_locations for select
  to authenticated
  using (
    request_id in (
      select sr.id
      from public.service_requests sr
      where sr.client_id = auth.uid()
         or sr.mechanic_id in (
           select mp.id from public.mechanic_profiles mp where mp.user_id = auth.uid()
         )
    )
  );

drop policy if exists "mechanic_live_locations_insert_mechanic" on public.mechanic_live_locations;
create policy "mechanic_live_locations_insert_mechanic"
  on public.mechanic_live_locations for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.service_requests sr
      join public.mechanic_profiles mp on mp.id = sr.mechanic_id
      where sr.id = request_id
        and mp.user_id = auth.uid()
        and sr.status in ('accepted', 'in_progress')
    )
  );

drop policy if exists "mechanic_live_locations_update_mechanic" on public.mechanic_live_locations;
create policy "mechanic_live_locations_update_mechanic"
  on public.mechanic_live_locations for update
  to authenticated
  using (
    exists (
      select 1
      from public.service_requests sr
      join public.mechanic_profiles mp on mp.id = sr.mechanic_id
      where sr.id = request_id
        and mp.user_id = auth.uid()
        and sr.status in ('accepted', 'in_progress')
    )
  )
  with check (
    exists (
      select 1
      from public.service_requests sr
      join public.mechanic_profiles mp on mp.id = sr.mechanic_id
      where sr.id = request_id
        and mp.user_id = auth.uid()
        and sr.status in ('accepted', 'in_progress')
    )
  );

drop policy if exists "mechanic_live_locations_delete_mechanic" on public.mechanic_live_locations;
create policy "mechanic_live_locations_delete_mechanic"
  on public.mechanic_live_locations for delete
  to authenticated
  using (
    exists (
      select 1
      from public.service_requests sr
      join public.mechanic_profiles mp on mp.id = sr.mechanic_id
      where sr.id = request_id
        and mp.user_id = auth.uid()
    )
  );

do $$
begin
  alter publication supabase_realtime add table public.mechanic_live_locations;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.service_requests;
exception
  when duplicate_object then null;
end $$;
