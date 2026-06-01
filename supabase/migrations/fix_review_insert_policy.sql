-- Fix review insert RLS (ambiguous request_id blocked new reviews) + RPC submit helper.

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
