# Aventus Studio — Design Spec

## Overview

Aventus Studio is a social media content management platform for Aventus Digital Media Ltd, a UK-based OnlyFans creator management agency. The primary user (Craig) manages multiple creators' social accounts from a single dashboard. The system uses AI to generate content, auto-publishes on schedule, pulls engagement analytics, and generates comment replies for approval.

## Problem

Managing multiple creators' social presence across Instagram, TikTok, and YouTube is manual and time-consuming. Content ideation, creation, scheduling, publishing, and engagement are all separate tasks done across separate tools. Aventus needs a single command centre that automates as much as possible while keeping the human in the loop for quality control.

## Solution

A Next.js full-stack application that:

1. Generates a week of platform-specific posts from a niche/topic using Google Gemini
2. Queues posts for human review and approval
3. Auto-publishes approved posts on schedule
4. Pulls engagement analytics from each platform
5. Monitors comments and generates AI replies for approval

## Users

- **Primary**: Craig (agency owner) — manages all creator accounts
- **Future**: Individual creators with read-only dashboards (out of scope for v1)

## Architecture

### Stack

| Layer | Technology | Free Tier Limit |
|---|---|---|
| Frontend + API | Next.js 15 (App Router) | Vercel Hobby — unlimited |
| Database | Supabase Postgres | 500 MB |
| Auth | Supabase Auth | 50,000 MAU |
| File Storage | Supabase Storage | 1 GB |
| AI (text) | Google Gemini Flash-Lite API | 1,000 req/day |
| AI (images) | Google Gemini Imagen | 500 req/day |
| AI (video) | Pika (manual, out of scope for v1) | ~30-50/month |
| Scheduling | cron-job.org → Vercel API routes | Unlimited |
| Instagram | Instagram Graph API | 200 calls/hr |
| TikTok | TikTok Content Posting API | 15 posts/day |
| YouTube | YouTube Data API v3 | 6 uploads/day |

### Deployment

- **App**: Vercel (free hobby tier)
- **Database + Auth + Storage**: Supabase (free tier)
- **Cron**: cron-job.org (free) calling Vercel API routes with a shared secret
- **Domain**: Custom domain via Vercel (optional)

### Constraints

- Vercel serverless functions have a 10-second timeout on the free tier. Content generation is split into two phases: text generation (synchronous, within 10s) and image generation (async, processed by a cron job). See Content Generation Flow for details.
- Supabase free tier pauses projects after 1 week of inactivity. A keep-alive cron ping every few days mitigates this.
- TikTok Content Posting API requires a formal audit for public posting. Until the audit passes, TikTok posts will be prepared but need manual publishing.
- cron-job.org is a free external service with no SLA. Every cron-triggered action also has a manual trigger button in the UI as a fallback.

## Data Model

### workspaces

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | FK → auth.users |
| name | text | Creator name |
| niche | text | e.g. "fitness", "creator economy" |
| avatar_url | text | Nullable |
| creator_voice | text | Tone/style prompt for Gemini |
| ig_account_id | text | Instagram Business Account ID |
| ig_access_token | text | Encrypted via pgcrypto pgp_sym_encrypt. Key stored as ENCRYPTION_KEY env var in Vercel. |
| ig_token_expires_at | timestamptz | Token expiry for refresh scheduling |
| tiktok_open_id | text | TikTok user open ID |
| tiktok_access_token | text | Encrypted (same method) |
| tiktok_token_expires_at | timestamptz | TikTok tokens expire in 24 hours |
| yt_channel_id | text | YouTube channel ID |
| yt_refresh_token | text | Encrypted (same method). Google client library handles refresh inline. |
| deleted_at | timestamptz | Nullable. Set on soft delete. RLS excludes rows where deleted_at IS NOT NULL. |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now(), updated on every edit |

### generation_batches

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| workspace_id | uuid | FK → workspaces |
| topic | text | The niche/topic used to generate |
| status | text | 'generating_text' \| 'generating_images' \| 'completed' \| 'partial' \| 'failed' |
| total_posts | integer | Number of posts requested |
| posts_created | integer | Number of text posts created so far |
| images_completed | integer | Number of images generated so far |
| error_message | text | Nullable — reason for failure |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now(), updated on status change |

### posts

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| workspace_id | uuid | FK → workspaces |
| platform | text | 'instagram' \| 'tiktok' \| 'youtube' |
| caption | text | Post caption |
| hashtags | text[] | Array of hashtags |
| media_type | text | 'image' \| 'video' \| 'carousel' |
| status | text | 'draft' \| 'approved' \| 'scheduled' \| 'publishing' \| 'published' \| 'failed' |
| scheduled_at | timestamptz | When to publish. Setting this on an 'approved' post transitions it to 'scheduled'. |
| published_at | timestamptz | When actually published |
| platform_post_id | text | ID returned by platform after publish |
| ai_generated | boolean | Whether AI created this post |
| ai_prompt | text | The prompt used to generate |
| generation_batch_id | uuid | FK → generation_batches. Nullable for manual posts. |
| retry_count | integer | Default 0. Max 3 retries for failed publishes. |
| last_error | text | Nullable — last publish error message |
| deleted_at | timestamptz | Nullable. Set on soft delete. RLS excludes rows where deleted_at IS NOT NULL. |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now(), updated on every edit |

### post_media

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| post_id | uuid | FK → posts |
| media_url | text | Supabase Storage URL |
| media_type | text | 'image' \| 'video' |
| position | integer | Order in carousel (0-indexed). Single images use position 0. |
| ai_image_prompt | text | Nullable — the prompt used to generate this image |
| image_status | text | 'pending' \| 'generating' \| 'completed' \| 'failed' |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now(), updated on status change |

### comments

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| post_id | uuid | FK → posts |
| workspace_id | uuid | FK → workspaces |
| platform | text | 'instagram' \| 'youtube'. TikTok excluded — their API does not support comment retrieval or replies. |
| platform_comment_id | text | Unique constraint: (platform_comment_id, platform) for deduplication |
| author_name | text | Commenter's display name |
| author_avatar_url | text | Nullable |
| text | text | Comment content |
| ai_reply | text | Gemini-generated reply |
| reply_status | text | 'pending' \| 'approved' \| 'sent' \| 'dismissed' |
| replied_at | timestamptz | When reply was sent |
| fetched_at | timestamptz | When comment was pulled |
| updated_at | timestamptz | Default now(), updated on reply_status change |

### analytics_snapshots

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| post_id | uuid | FK → posts |
| workspace_id | uuid | FK → workspaces |
| platform | text | Platform name |
| likes | integer | |
| comments_count | integer | |
| views | integer | |
| shares | integer | |
| saves | integer | |
| reach | integer | |
| impressions | integer | |
| fetched_at | timestamptz | Snapshot timestamp |

Indexes: composite index on (workspace_id, fetched_at) for dashboard queries. Composite index on (post_id, fetched_at) for per-post history.

### api_usage

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| service | text | 'gemini_text' \| 'gemini_imagen' \| 'instagram' \| 'tiktok' \| 'youtube' |
| workspace_id | uuid | Nullable. FK → workspaces. Null for non-workspace calls (e.g. global Gemini). |
| date | date | The day this count applies to |
| request_count | integer | Incremented per request |
| daily_limit | integer | The known limit for this service |

Unique constraint on (service, workspace_id, date). Checked before every external API call. When request_count >= daily_limit * 0.9, a warning is shown in the UI. When at limit, requests are blocked with a clear error message.

## API Routes

### Content Generation

- `POST /api/generate` — Takes workspace_id + optional topic override. Phase 1 (synchronous, <10s): sends workspace niche + creator_voice to Gemini Flash-Lite. Gemini generates topic ideas based on the niche (not real-time trends — Gemini suggests content ideas from its training knowledge, not a live trends feed). Returns 21 post outlines (7 days × 3 platforms). Saves posts as drafts with image_status = 'pending' on their post_media rows. Creates a generation_batch record with status = 'generating_images'. Returns the batch ID to the client.
- `POST /api/cron/generate-images` — Called every 5 minutes. Finds post_media rows where image_status = 'pending'. Generates images via Gemini Imagen (max 10 per invocation to stay within 10s timeout). Uploads to Supabase Storage. Updates image_status to 'completed' or 'failed'. Updates generation_batch counters. When all images in a batch are done, sets batch status to 'completed' (or 'partial' if some failed).
- `POST /api/generate/reply` — Takes a comment ID, generates a contextual reply matching the creator's voice.

### Posts

- `GET /api/posts?workspace_id=X&status=Y&cursor=Z&limit=N` — List posts with filters. Cursor-based pagination. Default limit 50.
- `POST /api/posts` — Create a post manually. Accepts media upload. Status defaults to 'draft'. If scheduled_at is provided with status 'approved', transitions to 'scheduled'.
- `PATCH /api/posts/:id` — Edit caption, hashtags, schedule time, or change status. Setting status to 'approved' with a scheduled_at value transitions to 'scheduled'. Cannot edit 'published' posts.
- `DELETE /api/posts/:id` — Soft delete. Cannot delete 'published' posts.
- `POST /api/posts/:id/regenerate` — Regenerate caption/image for a specific post via Gemini.

### Scheduling + Publishing

- `POST /api/cron/publish` — Called by cron every 15 minutes. Finds posts where status = 'scheduled' and scheduled_at <= now(). Sets status to 'publishing'. Publishes each to its platform. Updates status to 'published' or 'failed'. On failure, increments retry_count and stores last_error. Posts with retry_count >= 3 remain 'failed' and are not retried. Protected by shared secret: `Authorization: Bearer <CRON_SECRET>` header, validated with constant-time comparison.
- `POST /api/cron/keepalive` — Called daily. Runs a simple SELECT 1 against Supabase.
- `POST /api/cron/refresh-tokens` — Called every 12 hours. Checks all workspaces for tokens expiring within 24 hours. Refreshes Instagram long-lived tokens (60-day expiry, refresh when <7 days remain). Refreshes TikTok tokens (24-hour expiry, refresh when <6 hours remain). YouTube uses Google client library inline refresh — no cron needed.

### Comments + Replies

- `POST /api/cron/comments` — Called every 30 minutes. Polls Instagram Graph API and YouTube Data API for new comments on published posts. Deduplicates via unique constraint on (platform_comment_id, platform) — INSERT ON CONFLICT DO NOTHING. Generates AI reply via Gemini for each new comment. Sets reply_status = 'pending'.
- `GET /api/comments?workspace_id=X&reply_status=pending&cursor=Z&limit=N` — List comments needing reply approval. Cursor-based pagination.
- `PATCH /api/comments/:id/reply` — Approve reply (with optional edited text) or dismiss. Approving sets reply_status = 'approved'.
- `POST /api/cron/send-replies` — Called every 15 minutes. Sends approved replies to platforms via their comment reply APIs. Updates reply_status to 'sent'.

### Analytics

- `POST /api/cron/analytics` — Called every 6 hours. Pulls engagement metrics for published posts. Processes max 20 posts per platform per invocation to stay within rate limits. Prioritises recently published posts. Stores snapshot in analytics_snapshots.
- `GET /api/analytics?workspace_id=X&from=DATE&to=DATE` — Returns aggregated analytics for dashboard with date range filtering.

### Auth + Workspaces

- Auth handled by Supabase Auth (email/password for v1). CSRF protection via SameSite=Lax cookies + checking Origin header on mutations.
- `GET /api/workspaces` — List user's workspaces
- `POST /api/workspaces` — Create workspace
- `PATCH /api/workspaces/:id` — Update workspace settings
- `DELETE /api/workspaces/:id` — Soft delete workspace. Revokes all platform tokens. Cancels all scheduled posts.
- `POST /api/workspaces/:id/connect/:platform` — OAuth flow for connecting a social platform
- `DELETE /api/workspaces/:id/connect/:platform` — Disconnect platform. Revokes token, clears credentials.

### Rate Limit Budget (Instagram — 200 calls/hr)

| Operation | Frequency | Est. calls/workspace |
|---|---|---|
| Publish | Every 15 min | 1-2 per run |
| Comments poll | Every 30 min | 2-5 per run |
| Analytics | Every 6 hrs | 10-20 per run |
| **Total/hr** | | **~15-25/workspace** |

At 200 calls/hr, this supports ~8 active workspaces safely. Beyond that, operations will be spread across cron intervals.

## Pages

| Route | Description |
|---|---|
| `/login` | Supabase Auth login |
| `/` | Redirects to `/queue` |
| `/queue` | Post queue — review, approve, edit, reject posts |
| `/calendar` | Calendar view of scheduled/published posts |
| `/generate` | AI content generation — enter topic, generate week of posts |
| `/analytics` | Engagement dashboard — charts, per-post metrics |
| `/replies` | Comment reply approval queue |
| `/settings` | Workspace settings, platform connections, creator voice config |

Active workspace is stored in React context + localStorage. Workspace selector in the sidebar switches context. All API calls include workspace_id as a query/body parameter. RLS policies on Supabase enforce that users can only access workspaces they own.

## UI Design

Type B Product UI per CJ Design System:

- **Layout**: 240px sidebar + fluid main content + optional right panel
- **Colours**: White surfaces, #F9FAFB canvas, functional platform colours (Instagram #FCE7F3/#9D174D, TikTok #ECFDF5/#065F46, YouTube #FEF2F2/#991B1B), status colours (green scheduled, amber draft, blue published, red failed)
- **Typography**: Inter throughout, no serif. 600 headings, 500 labels, 400 body.
- **Borders**: 0.5px solid #E5E7EB
- **Animation**: Framer Motion, subtle and fast (0.2s durations, stagger 0.04s)
- **Spacing**: 24px page margins, 16px card gaps, 12px element spacing

## Content Generation Flow (Detail)

1. User selects workspace and navigates to /generate
2. User enters a topic or uses the workspace's default niche
3. `POST /api/generate` sends niche + creator_voice to Gemini Flash-Lite
4. Gemini returns 21 post outlines (7 days × 3 platforms): caption, hashtags, suggested publish time, image description prompt
5. Posts saved as drafts. post_media rows created with image_status = 'pending'.
6. generation_batch record created with status = 'generating_images'
7. Client redirects to /queue showing the new drafts. Posts without images show a "generating..." placeholder.
8. `POST /api/cron/generate-images` runs every 5 minutes, picks up pending images, generates via Imagen, uploads to Supabase Storage
9. As images complete, they appear on the post cards in the queue (client polls or uses Supabase realtime subscription)
10. If Imagen fails for a post, image_status = 'failed'. User can retry individually or the post can be approved without an image.
11. If daily Imagen quota (500) is hit, remaining images stay 'pending' until the next day. UI shows a clear message.
12. User reviews posts: approve, edit caption/hashtags/time, reject, or regenerate
13. Approving a post with a scheduled_at time transitions it to 'scheduled'

### Content moderation

All AI-generated content (captions, replies) passes through Gemini's built-in safety filters. Additionally, the review/approve flow ensures no content goes live without human review.

### Input validation

- Topic/niche input: max 200 characters, stripped of HTML
- Captions: max 2,200 characters (Instagram limit)
- Hashtags: max 30 per post (Instagram limit), validated format (#word)

## Comment Reply Flow (Detail)

1. `POST /api/cron/comments` polls Instagram Graph API and YouTube Data API for new comments on published posts
2. New comments deduplicated via unique constraint on (platform_comment_id, platform)
3. For each new comment, Gemini generates a reply using: the comment text, the original post caption, and the creator_voice prompt from the workspace
4. AI reply saved to comments.ai_reply, reply_status set to 'pending'
5. User sees pending replies in /replies page
6. User can: approve (sends as-is), edit then approve, or dismiss
7. `POST /api/cron/send-replies` posts approved replies via platform APIs
8. TikTok comments appear in analytics but replies must be posted manually — TikTok's API does not support programmatic comment replies

## Security

- **Token encryption**: All platform tokens encrypted in Supabase via pgcrypto `pgp_sym_encrypt` / `pgp_sym_decrypt`. Symmetric encryption key stored as `ENCRYPTION_KEY` environment variable in Vercel. Key rotation: generate new key, re-encrypt all tokens, update env var.
- **Cron authentication**: All `/api/cron/*` endpoints require `Authorization: Bearer <CRON_SECRET>` header. Validated using constant-time string comparison (`crypto.timingSafeEqual`). CRON_SECRET stored as Vercel environment variable.
- **Row-level security**: All Supabase tables have RLS policies. Users can only read/write rows where workspace.user_id matches their auth.uid().
- **CSRF protection**: Supabase Auth cookies set with SameSite=Lax. All mutation endpoints (POST/PATCH/DELETE) verify the Origin header matches the app domain.
- **Token refresh**: Dedicated cron job (`/api/cron/refresh-tokens`) runs every 12 hours. Instagram long-lived tokens refreshed when <7 days remain. TikTok tokens refreshed when <6 hours remain. YouTube handled inline by Google client library.
- **No platform credentials exposed to the frontend** — all social API calls go through Next.js server routes.
- **Input validation**: All user inputs (topics, captions, hashtags) validated and sanitised server-side before storage or API calls.

## Build Phases

### Phase 1: Foundation + AI Content Generation

- Next.js app with App Router
- Supabase project setup (auth, database, storage, RLS policies)
- All database tables created with proper constraints and indexes
- Login page
- Workspace CRUD + switching (sidebar selector, React context + localStorage)
- Gemini API integration (text generation)
- Gemini Imagen integration (image generation via cron)
- api_usage tracking table and rate limit checks
- Generate Week flow: niche → post outlines → drafts with pending images
- Image generation cron job
- Queue page: view generated posts, approve/edit/reject
- Post status transitions: draft → approved → scheduled (when scheduled_at set)

### Phase 2: Scheduling + Calendar

- Scheduling engine: publish cron finds due posts, sets to 'publishing'
- Calendar view (month/week) showing all posts
- Drag-and-drop rescheduling on calendar (only 'scheduled' posts can be moved; 'published'/'failed' are read-only on calendar)
- cron-job.org setup calling Vercel API routes
- Keep-alive cron for Supabase
- Manual trigger buttons for all cron operations (fallback for cron-job.org outages)

### Phase 3: Platform Integrations + Auto-Publish

- Instagram Graph API: OAuth connect, post images/carousels/reels
- TikTok Content Posting API: OAuth connect, post videos (audit-dependent)
- YouTube Data API: OAuth connect, upload videos
- Platform connection + disconnection UI in settings
- Token refresh cron job
- Publish cron extended: actually publishes to connected platforms
- Failure handling: retry_count, last_error, max 3 retries
- Media format validation per platform

### Phase 4: Analytics Dashboard

- Instagram insights pull (likes, comments, reach, saves)
- YouTube analytics pull (views, likes, comments, watch time)
- TikTok analytics pull (views, likes, shares — if API allows)
- Analytics snapshots stored per post, capped at 20 posts/platform per cron run
- Dashboard page: per-post performance, cross-platform comparison, follower growth charts, best posting times
- Date range filtering

### Phase 5: Auto-Engagement

- Comment polling cron (Instagram + YouTube only)
- Comment storage with deduplication (unique constraint on platform_comment_id + platform)
- Gemini reply generation using creator_voice
- Reply approval queue UI (/replies page — backed by comments table, filtered by reply_status)
- Reply sending cron via platform APIs
- Reply analytics (response rate, reply count)

## Out of Scope (v1)

- Video generation (Pika integration — manual for now)
- Multi-user access / team roles
- Creator self-service dashboards
- TikTok auto-commenting (API doesn't support it)
- TikTok comment retrieval (API doesn't support it)
- Direct message management
- Content approval workflows with multiple approvers
- White-label / branding customisation
- Mobile app
- Real-time trending topic feeds (Gemini generates topic ideas from training knowledge, not live trends data)
