-- Add view_count column (no-op if already exists)
alter table public.gallery_items
  add column if not exists view_count int not null default 0;

-- RPC function to atomically increment view count
create or replace function public.increment_view_count(item_id bigint)
returns void
language sql
security definer
as $$
  update public.gallery_items
  set view_count = view_count + 1
  where id = item_id;
$$;
