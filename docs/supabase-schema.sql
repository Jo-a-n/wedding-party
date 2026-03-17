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
