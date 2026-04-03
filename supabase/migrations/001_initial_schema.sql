-- ============================================================
-- Aventus Studio — Initial Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New Query)
-- ============================================================

-- Extensions
create extension if not exists pgcrypto;

-- ============================================================
-- 1. WORKSPACES
-- ============================================================
create table public.workspaces (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  niche            text not null default '',
  avatar_url       text,
  creator_voice    text not null default '',
  ig_account_id    text,
  ig_access_token  text,
  ig_token_expires_at timestamptz,
  tiktok_open_id       text,
  tiktok_access_token  text,
  tiktok_token_expires_at timestamptz,
  yt_channel_id    text,
  yt_refresh_token text,
  deleted_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.workspaces enable row level security;

create policy "workspaces_select" on public.workspaces
  for select using (user_id = auth.uid() and deleted_at is null);

create policy "workspaces_insert" on public.workspaces
  for insert with check (user_id = auth.uid() and deleted_at is null);

create policy "workspaces_update" on public.workspaces
  for update using (user_id = auth.uid() and deleted_at is null);

create policy "workspaces_delete" on public.workspaces
  for delete using (user_id = auth.uid() and deleted_at is null);

-- ============================================================
-- 2. GENERATION BATCHES
-- ============================================================
create table public.generation_batches (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces(id) on delete cascade,
  topic            text not null,
  status           text not null default 'generating_text'
    check (status in ('generating_text','generating_images','completed','partial','failed')),
  total_posts      int not null default 0,
  posts_created    int not null default 0,
  images_completed int not null default 0,
  error_message    text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.generation_batches enable row level security;

create policy "generation_batches_select" on public.generation_batches
  for select using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid() and deleted_at is null)
  );

create policy "generation_batches_insert" on public.generation_batches
  for insert with check (
    workspace_id in (select id from public.workspaces where user_id = auth.uid() and deleted_at is null)
  );

create policy "generation_batches_update" on public.generation_batches
  for update using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid() and deleted_at is null)
  );

create policy "generation_batches_delete" on public.generation_batches
  for delete using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid() and deleted_at is null)
  );

-- ============================================================
-- 3. POSTS
-- ============================================================
create table public.posts (
  id                 uuid primary key default gen_random_uuid(),
  workspace_id       uuid not null references public.workspaces(id) on delete cascade,
  platform           text not null check (platform in ('instagram','tiktok','youtube')),
  caption            text not null default '',
  hashtags           text[] not null default '{}',
  media_type         text not null check (media_type in ('image','video','carousel')),
  status             text not null default 'draft'
    check (status in ('draft','approved','scheduled','publishing','published','failed')),
  scheduled_at       timestamptz,
  published_at       timestamptz,
  platform_post_id   text,
  ai_generated       boolean not null default false,
  ai_prompt          text,
  generation_batch_id uuid references public.generation_batches(id) on delete set null,
  retry_count        int not null default 0,
  last_error         text,
  deleted_at         timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "posts_select" on public.posts
  for select using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid() and deleted_at is null)
    and deleted_at is null
  );

create policy "posts_insert" on public.posts
  for insert with check (
    workspace_id in (select id from public.workspaces where user_id = auth.uid() and deleted_at is null)
    and deleted_at is null
  );

create policy "posts_update" on public.posts
  for update using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid() and deleted_at is null)
    and deleted_at is null
  );

create policy "posts_delete" on public.posts
  for delete using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid() and deleted_at is null)
    and deleted_at is null
  );

-- Indexes
create index idx_posts_workspace_status on public.posts (workspace_id, status)
  where deleted_at is null;

create index idx_posts_scheduled on public.posts (scheduled_at)
  where status = 'scheduled' and deleted_at is null;

-- ============================================================
-- 4. POST MEDIA
-- ============================================================
create table public.post_media (
  id              uuid primary key default gen_random_uuid(),
  post_id         uuid not null references public.posts(id) on delete cascade,
  media_url       text,
  media_type      text not null check (media_type in ('image','video')),
  position        int not null default 0,
  ai_image_prompt text,
  image_status    text not null default 'pending'
    check (image_status in ('pending','generating','completed','failed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.post_media enable row level security;

create policy "post_media_select" on public.post_media
  for select using (
    post_id in (
      select p.id from public.posts p
      join public.workspaces w on w.id = p.workspace_id
      where w.user_id = auth.uid() and w.deleted_at is null and p.deleted_at is null
    )
  );

create policy "post_media_insert" on public.post_media
  for insert with check (
    post_id in (
      select p.id from public.posts p
      join public.workspaces w on w.id = p.workspace_id
      where w.user_id = auth.uid() and w.deleted_at is null and p.deleted_at is null
    )
  );

create policy "post_media_update" on public.post_media
  for update using (
    post_id in (
      select p.id from public.posts p
      join public.workspaces w on w.id = p.workspace_id
      where w.user_id = auth.uid() and w.deleted_at is null and p.deleted_at is null
    )
  );

create policy "post_media_delete" on public.post_media
  for delete using (
    post_id in (
      select p.id from public.posts p
      join public.workspaces w on w.id = p.workspace_id
      where w.user_id = auth.uid() and w.deleted_at is null and p.deleted_at is null
    )
  );

-- Index for pending image generation queue
create index idx_post_media_pending on public.post_media (image_status)
  where image_status = 'pending';

-- ============================================================
-- 5. COMMENTS
-- ============================================================
create table public.comments (
  id                   uuid primary key default gen_random_uuid(),
  post_id              uuid not null references public.posts(id) on delete cascade,
  workspace_id         uuid not null references public.workspaces(id) on delete cascade,
  platform             text not null check (platform in ('instagram','youtube')),
  platform_comment_id  text not null,
  author_name          text not null default '',
  author_avatar_url    text,
  text                 text not null default '',
  ai_reply             text,
  reply_status         text not null default 'pending'
    check (reply_status in ('pending','approved','sent','dismissed')),
  replied_at           timestamptz,
  fetched_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.comments enable row level security;

-- Unique constraint on platform comment
alter table public.comments
  add constraint comments_platform_comment_unique unique (platform_comment_id, platform);

create policy "comments_select" on public.comments
  for select using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid() and deleted_at is null)
  );

create policy "comments_insert" on public.comments
  for insert with check (
    workspace_id in (select id from public.workspaces where user_id = auth.uid() and deleted_at is null)
  );

create policy "comments_update" on public.comments
  for update using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid() and deleted_at is null)
  );

create policy "comments_delete" on public.comments
  for delete using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid() and deleted_at is null)
  );

-- ============================================================
-- 6. ANALYTICS SNAPSHOTS
-- ============================================================
create table public.analytics_snapshots (
  id              uuid primary key default gen_random_uuid(),
  post_id         uuid not null references public.posts(id) on delete cascade,
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  platform        text not null check (platform in ('instagram','tiktok','youtube')),
  likes           int not null default 0,
  comments_count  int not null default 0,
  views           int not null default 0,
  shares          int not null default 0,
  saves           int not null default 0,
  reach           int not null default 0,
  impressions     int not null default 0,
  fetched_at      timestamptz not null default now()
);

alter table public.analytics_snapshots enable row level security;

create policy "analytics_snapshots_select" on public.analytics_snapshots
  for select using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid() and deleted_at is null)
  );

-- Indexes
create index idx_analytics_workspace_fetched on public.analytics_snapshots (workspace_id, fetched_at);
create index idx_analytics_post_fetched on public.analytics_snapshots (post_id, fetched_at);

-- ============================================================
-- 7. API USAGE
-- ============================================================
create table public.api_usage (
  id             uuid primary key default gen_random_uuid(),
  service        text not null,
  workspace_id   uuid references public.workspaces(id) on delete cascade,
  date           date not null default current_date,
  request_count  int not null default 0,
  daily_limit    int not null default 100
);

alter table public.api_usage enable row level security;
-- No RLS policies — accessed only via service role client

-- Unique constraint
alter table public.api_usage
  add constraint api_usage_service_workspace_date_unique unique (service, workspace_id, date);

-- ============================================================
-- RPC: increment_api_usage
-- Atomic upsert — returns { allowed: bool, remaining: int }
-- ============================================================
create or replace function public.increment_api_usage(
  p_service text,
  p_workspace_id uuid default null,
  p_daily_limit int default 100
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row public.api_usage%rowtype;
begin
  insert into public.api_usage (service, workspace_id, date, request_count, daily_limit)
  values (p_service, p_workspace_id, current_date, 1, p_daily_limit)
  on conflict (service, workspace_id, date)
  do update set request_count = public.api_usage.request_count + 1
  returning * into v_row;

  return jsonb_build_object(
    'allowed', v_row.request_count <= v_row.daily_limit,
    'remaining', greatest(v_row.daily_limit - v_row.request_count, 0)
  );
end;
$$;

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.update_updated_at();

create trigger trg_generation_batches_updated_at
  before update on public.generation_batches
  for each row execute function public.update_updated_at();

create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute function public.update_updated_at();

create trigger trg_post_media_updated_at
  before update on public.post_media
  for each row execute function public.update_updated_at();

create trigger trg_comments_updated_at
  before update on public.comments
  for each row execute function public.update_updated_at();
