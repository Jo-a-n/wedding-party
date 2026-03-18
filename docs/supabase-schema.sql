-- Wedding Wishes table
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard)

create table public.wishes (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(name) between 1 and 100),
  message    text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

create index wishes_created_at_desc on public.wishes (created_at desc);

-- Row Level Security
alter table public.wishes enable row level security;

-- Anyone can read wishes
create policy "Anyone can read wishes"
  on public.wishes for select
  to anon, authenticated
  using (true);

-- Anyone can insert wishes
create policy "Anyone can insert wishes"
  on public.wishes for insert
  to anon, authenticated
  with check (true);

-- No UPDATE or DELETE policies = implicit deny

-- Enable Realtime for this table
alter publication supabase_realtime add table public.wishes;

-- =============================================================
-- Gallery Items table (photo/video uploads)
-- =============================================================

create table public.gallery_items (
  id          bigint generated always as identity primary key,
  file_path   text not null,
  media_type  text not null check (media_type in ('photo', 'video')),
  thumb_path  text,
  width       int,
  height      int,
  guest_name  text default '' check (char_length(guest_name) <= 100),
  created_at  timestamptz not null default now()
);

create index gallery_items_created_at_desc on public.gallery_items (created_at desc);

alter table public.gallery_items enable row level security;

create policy "Anyone can view gallery"
  on public.gallery_items for select
  to anon, authenticated
  using (true);

create policy "Anyone can add to gallery"
  on public.gallery_items for insert
  to anon, authenticated
  with check (true);

alter publication supabase_realtime add table public.gallery_items;

-- =============================================================
-- Rice tosses table
-- =============================================================

create table public.rice_tosses (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now()
);

create index rice_tosses_created_at_desc on public.rice_tosses (created_at desc);

alter table public.rice_tosses enable row level security;

create policy "Anyone can view rice tosses"
  on public.rice_tosses for select
  to anon, authenticated
  using (true);

create policy "Anyone can add rice tosses"
  on public.rice_tosses for insert
  to anon, authenticated
  with check (true);

alter publication supabase_realtime add table public.rice_tosses;

-- =============================================================
-- Gallery Storage bucket
-- =============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery', 'gallery', true,
  104857600,  -- 100MB (videos)
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
        'video/mp4', 'video/quicktime', 'video/webm']
);

create policy "Public gallery read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'gallery');

create policy "Public gallery upload"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'gallery');

-- No UPDATE or DELETE policies for gallery storage

-- =============================================================
-- BEFORE GOING LIVE: Wipe test data and reset IDs
-- Run this before the wedding to clear development wishes:
--
--   TRUNCATE public.wishes RESTART IDENTITY;
--
-- Or via CLI:
--   npx supabase db query --linked "TRUNCATE public.wishes RESTART IDENTITY;"
-- =============================================================
