-- Mechanics: accept, decline, start, and complete jobs.
-- Clients: cancel active requests only.

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
