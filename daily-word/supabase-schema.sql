-- Daily Word Database Schema
-- Run this in the Supabase SQL editor to create all tables

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  church text,
  avatar_url text,
  is_public boolean default false,
  reminder_time time,
  bible_version text default 'NIV',
  push_subscription text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Journal entries
create table if not exists entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null,
  type text not null check (type in ('read', 'skip')),
  book text,
  chapter text,
  verse text,
  notes text,
  skip_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, date)
);

-- Public monthly recaps
create table if not exists recaps (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  year int not null,
  month int not null,
  read_days int default 0,
  total_days int default 0,
  image_url text,
  likes int default 0,
  is_public boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, year, month)
);

-- Encouragements (likes)
create table if not exists encouragements (
  id uuid default uuid_generate_v4() primary key,
  recap_id uuid references recaps(id) on delete cascade not null,
  from_user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(recap_id, from_user_id)
);

-- Row Level Security Policies

-- Profiles: users can read all public profiles, but only update their own
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can delete own profile"
  on profiles for delete
  using (auth.uid() = id);

-- Entries: users can only CRUD their own entries
alter table entries enable row level security;

create policy "Users can view own entries"
  on entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own entries"
  on entries for delete
  using (auth.uid() = user_id);

-- Recaps: public recaps readable by all, CRUD own
alter table recaps enable row level security;

create policy "Public recaps are viewable"
  on recaps for select
  using (is_public = true or auth.uid() = user_id);

create policy "Users can insert own recaps"
  on recaps for insert
  with check (auth.uid() = user_id);

create policy "Users can update own recaps"
  on recaps for update
  using (auth.uid() = user_id);

create policy "Users can delete own recaps"
  on recaps for delete
  using (auth.uid() = user_id);

-- Encouragements: users can CRUD their own encouragements
alter table encouragements enable row level security;

create policy "Encouragements viewable by all"
  on encouragements for select
  using (true);

create policy "Users can insert own encouragements"
  on encouragements for insert
  with check (auth.uid() = from_user_id);

create policy "Users can delete own encouragements"
  on encouragements for delete
  using (auth.uid() = from_user_id);

-- Helper RPC functions for atomic like counting
create or replace function increment_likes(recap_id_param uuid)
returns void as $$
begin
  update recaps set likes = likes + 1 where id = recap_id_param;
end;
$$ language plpgsql security definer;

create or replace function decrement_likes(recap_id_param uuid)
returns void as $$
begin
  update recaps set likes = greatest(0, likes - 1) where id = recap_id_param;
end;
$$ language plpgsql security definer;

-- Create storage buckets
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('recaps', 'recaps', true) on conflict do nothing;

-- Storage policies
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Recap images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'recaps');

create policy "Users can upload own recap images"
  on storage.objects for insert
  with check (bucket_id = 'recaps' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own recap images"
  on storage.objects for update
  using (bucket_id = 'recaps' and auth.uid()::text = (storage.foldername(name))[1]);
