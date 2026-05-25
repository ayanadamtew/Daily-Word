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


-- =========================================================================
-- PRIVATE GROUPS FEATURE ADDITIONS
-- =========================================================================

-- Groups table
create table if not exists groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  church text,
  invite_code varchar(6) unique not null,
  created_by uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Group memberships (Junction table)
create table if not exists group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()),
  unique(group_id, user_id)
);

-- Group entry reactions (Prayer hands reaction 🙏)
create table if not exists group_reactions (
  id uuid default uuid_generate_v4() primary key,
  entry_id uuid references entries(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(entry_id, user_id)
);

-- Helper function to break recursion in group membership checks
create or replace function public.is_group_member(group_id_param uuid, user_id_param uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.group_members
    where group_id = group_id_param and user_id = user_id_param
  );
end;
$$ language plpgsql security definer;

-- Enable Row Level Security (RLS)
alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_reactions enable row level security;

-- Groups Policies
create policy "Users can view groups they are part of"
  on groups for select
  using (
    auth.uid() = created_by or
    public.is_group_member(id, auth.uid())
  );

create policy "Any authenticated user can create groups"
  on groups for insert
  with check (auth.uid() = created_by);

create policy "Only admin can update group details"
  on groups for update
  using (auth.uid() = created_by);

create policy "Only admin can close group"
  on groups for delete
  using (auth.uid() = created_by);

-- Group Members Policies
create policy "Users can view members of their groups"
  on group_members for select
  using (
    public.is_group_member(group_id, auth.uid())
  );

create policy "Users can join a group"
  on group_members for insert
  with check (auth.uid() = user_id);

create policy "Users can leave a group, or admin can remove a member"
  on group_members for delete
  using (
    auth.uid() = user_id or
    exists (
      select 1 from groups
      where id = group_members.group_id and created_by = auth.uid()
    )
  );

-- Group Reactions Policies
create policy "Group reactions viewable by group members"
  on group_reactions for select
  using (
    exists (
      select 1 from public.group_members gm
      join entries e on e.id = group_reactions.entry_id
      where public.is_group_member(gm.group_id, auth.uid())
      and gm.user_id = e.user_id
    )
  );

create policy "Users can insert reactions if in the same group as entry creator"
  on group_reactions for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from entries e
      join group_members gm_creator on gm_creator.user_id = e.user_id
      join group_members gm_me on gm_me.group_id = gm_creator.group_id
      where e.id = entry_id and gm_me.user_id = auth.uid()
    )
  );

create policy "Users can delete own reactions"
  on group_reactions for delete
  using (auth.uid() = user_id);

-- Group Privacy Select Policy on Entries
-- Allow select if own entry OR if the user is in a shared group with the entry owner,
-- and the entry is logged AFTER the other user's join date.
create policy "Users can view entries of their group members after joining date"
  on entries for select
  using (
    auth.uid() = user_id or
    exists (
      select 1 from group_members gm_me
      join group_members gm_other on gm_me.group_id = gm_other.group_id
      where gm_me.user_id = auth.uid()
      and gm_other.user_id = entries.user_id
      and entries.date >= gm_other.joined_at::date
    )
  );

