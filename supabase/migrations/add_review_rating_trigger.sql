-- Run in Supabase SQL Editor: rating trigger + stricter review insert policy.

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
