-- ============================================================
-- Aventus Studio — Creator Profiles + Storage
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New Query)
-- ============================================================

-- ============================================================
-- 1. CREATOR PROFILES TABLE
-- ============================================================
create table public.creator_profiles (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid not null references public.workspaces(id) on delete cascade,
  onlyfans_handle      text not null default '',
  content_type         text not null default '',
  brand_voice          text not null default '',
  target_audience      text not null default '',
  platforms            text[] not null default '{}',
  brand_primary_color  text not null default '#0f0f0d',
  brand_secondary_color text not null default '#faf8f5',
  logo_url             text not null default '',
  mood_board_urls      text[] not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint creator_profiles_workspace_unique unique (workspace_id)
);

alter table public.creator_profiles enable row level security;

create policy "creator_profiles_select" on public.creator_profiles
  for select using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid() and deleted_at is null)
  );

create policy "creator_profiles_insert" on public.creator_profiles
  for insert with check (
    workspace_id in (select id from public.workspaces where user_id = auth.uid() and deleted_at is null)
  );

create policy "creator_profiles_update" on public.creator_profiles
  for update using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid() and deleted_at is null)
  );

create policy "creator_profiles_delete" on public.creator_profiles
  for delete using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid() and deleted_at is null)
  );

-- Auto-update updated_at
create trigger trg_creator_profiles_updated_at
  before update on public.creator_profiles
  for each row execute function public.update_updated_at();

-- ============================================================
-- 2. STORAGE BUCKET for creator assets (logos + mood boards)
-- Run this separately if the above doesn't work in one go
-- ============================================================
insert into storage.buckets (id, name, public)
values ('creator-assets', 'creator-assets', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
create policy "creator_assets_upload" on storage.objects
  for insert with check (
    bucket_id = 'creator-assets'
    and auth.role() = 'authenticated'
  );

create policy "creator_assets_select" on storage.objects
  for select using (
    bucket_id = 'creator-assets'
  );

create policy "creator_assets_delete" on storage.objects
  for delete using (
    bucket_id = 'creator-assets'
    and auth.role() = 'authenticated'
  );
