# Phase 1: Foundation + AI Content Generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working Next.js app where Craig can log in, manage creator workspaces, generate a week of AI content via Gemini, and review/approve/reject posts in a queue.

**Architecture:** Next.js 15 App Router on Vercel with Supabase (Postgres + Auth + Storage). Google Gemini Flash-Lite for text generation, Gemini Imagen 3 for image generation (async via cron). Workspace context stored in React context + localStorage.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase (JS client v2), Google Generative AI SDK, Tailwind CSS 4, Framer Motion 12, Lucide React

**Spec:** `docs/superpowers/specs/2026-04-03-aventus-studio-design.md`

---

## File Structure

```
aventus-studio/
├── .env.local                          # Local env vars (Supabase, Gemini keys)
├── .gitignore                          # Updated for Next.js + .env
├── next.config.ts                      # Next.js config
├── postcss.config.mjs                  # Tailwind v4 PostCSS
├── package.json                        # Updated deps
├── tsconfig.json                       # Updated for Next.js
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql      # ALL tables + RLS + functions
├── src/
│   ├── app/
│   │   ├── globals.css                 # Tailwind + base styles
│   │   ├── layout.tsx                  # Root layout (html, body, providers)
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx           # Login page (no sidebar)
│   │   ├── (app)/
│   │   │   ├── layout.tsx             # App layout (sidebar + main)
│   │   │   ├── page.tsx               # Redirect to /queue
│   │   │   ├── queue/
│   │   │   │   └── page.tsx           # Post queue
│   │   │   ├── generate/
│   │   │   │   └── page.tsx           # AI generation
│   │   │   └── settings/
│   │   │       └── page.tsx           # Workspace settings
│   │   └── api/
│   │       ├── generate/
│   │       │   └── route.ts           # POST /api/generate
│   │       ├── posts/
│   │       │   ├── route.ts           # GET + POST /api/posts
│   │       │   └── [id]/
│   │       │       ├── route.ts       # PATCH + DELETE /api/posts/:id
│   │       │       └── regenerate/
│   │       │           └── route.ts   # POST /api/posts/:id/regenerate
│   │       ├── workspaces/
│   │       │   ├── route.ts           # GET + POST /api/workspaces
│   │       │   └── [id]/
│   │       │       └── route.ts       # PATCH + DELETE /api/workspaces/:id
│   │       └── cron/
│   │           ├── generate-images/
│   │           │   └── route.ts       # POST /api/cron/generate-images
│   │           └── keepalive/
│   │               └── route.ts       # POST /api/cron/keepalive
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser Supabase client
│   │   │   ├── server.ts              # Server + service role clients
│   │   │   └── middleware.ts          # Auth middleware
│   │   ├── gemini.ts                  # Gemini text + Imagen image client
│   │   ├── api-usage.ts              # Rate limit tracking (uses service client)
│   │   ├── csrf.ts                    # Origin header CSRF check
│   │   └── validation.ts             # Input validation
│   ├── components/
│   │   ├── sidebar.tsx                # Nav + workspace switcher
│   │   ├── post-card.tsx              # Single post card
│   │   ├── post-queue.tsx             # Post list grouped by day
│   │   ├── generate-form.tsx          # Topic input + generate button
│   │   ├── settings-page.tsx          # Workspace CRUD settings UI
│   │   └── workspace-provider.tsx     # Workspace React context
│   ├── hooks/
│   │   ├── use-workspace.ts           # Active workspace hook
│   │   └── use-posts.ts              # Posts fetch/mutate hook
│   └── types/
│       └── database.ts                # TS types matching DB schema
```

---

### Task 1: Initialise Next.js Project

**Files:**
- Delete: `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.css`, `src/index.css`, `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.js`
- Create: `next.config.ts`, `postcss.config.mjs`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/(auth)/login/page.tsx` (placeholder), `src/app/(app)/layout.tsx`, `src/app/(app)/page.tsx`
- Modify: `package.json`, `tsconfig.json`, `.gitignore`

- [ ] **Step 1: Remove Vite and install Next.js**

```bash
cd /c/Users/spare/Documents/aventus-studio
rm -f vite.config.ts index.html src/main.tsx src/App.tsx src/App.css src/index.css tsconfig.app.json tsconfig.node.json eslint.config.js
npm uninstall vite @vitejs/plugin-react @tailwindcss/vite @eslint/js eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals typescript-eslint
npm install next@latest @tailwindcss/postcss postcss
```

- [ ] **Step 2: Create next.config.ts**

```ts
// next.config.ts
import type { NextConfig } from 'next'
const nextConfig: NextConfig = {}
export default nextConfig
```

- [ ] **Step 3: Create postcss.config.mjs**

```js
// postcss.config.mjs
export default { plugins: { '@tailwindcss/postcss': {} } }
```

- [ ] **Step 4: Update tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "incremental": true,
    "paths": { "@/*": ["./src/*"] },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Update package.json scripts**

```json
{ "scripts": { "dev": "next dev", "build": "next build", "start": "next start", "lint": "next lint" } }
```

- [ ] **Step 6: Update .gitignore**

Add: `.next`, `.env.local`, `.superpowers/`

- [ ] **Step 7: Create src/app/globals.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..700&display=swap');
@import "tailwindcss";

* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
body { font-family: 'Inter', system-ui, sans-serif; background: #FFFFFF; color: #111827; }

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 100px; }

@keyframes spin { to { transform: rotate(360deg); } }
.animate-spin { animation: spin 1s linear infinite; }
```

- [ ] **Step 8: Create root layout (providers only, no sidebar)**

```tsx
// src/app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Aventus Studio', description: 'Creator content management' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 9: Create app layout (sidebar + main)**

```tsx
// src/app/(app)/layout.tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar added in Task 4 */}
      <main style={{ flex: 1, overflow: 'auto', background: '#F9FAFB' }}>{children}</main>
    </div>
  )
}
```

- [ ] **Step 10: Create redirect page and placeholder login**

```tsx
// src/app/(app)/page.tsx
import { redirect } from 'next/navigation'
export default function Home() { redirect('/queue') }
```

```tsx
// src/app/(auth)/login/page.tsx
export default function LoginPage() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Login (coming in Task 2)</div>
}
```

- [ ] **Step 11: Create placeholder queue page so redirect works**

```tsx
// src/app/(app)/queue/page.tsx
export default function QueuePage() {
  return <div style={{ padding: 24 }}>Queue (coming in Task 10)</div>
}
```

- [ ] **Step 12: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 13: Commit**

```bash
git init && git add -A && git commit -m "feat: initialise Next.js 15 project, replace Vite"
```

---

### Task 2: Supabase Client + Auth + Login

**Files:**
- Create: `.env.local`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/lib/csrf.ts`, `src/middleware.ts`
- Modify: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Install Supabase**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Create .env.local**

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENCRYPTION_KEY=generate-with-openssl-rand-hex-32
CRON_SECRET=generate-with-openssl-rand-hex-32
GEMINI_API_KEY=your-gemini-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 3: Create browser client**

```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

- [ ] **Step 4: Create server + service role clients**

```ts
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )
}

// Service role client — bypasses RLS. For cron jobs and admin operations only.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
```

- [ ] **Step 5: Create auth middleware**

```ts
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

- [ ] **Step 6: Create CSRF helper**

```ts
// src/lib/csrf.ts
import { NextRequest } from 'next/server'

export function validateOrigin(request: NextRequest | Request): boolean {
  const origin = request.headers.get('origin')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!origin || !appUrl) return true // Allow in development when origin is missing
  return origin === appUrl || origin === new URL(appUrl).origin
}
```

- [ ] **Step 7: Create Next.js middleware**

```ts
// src/middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/cron).*)'],
}
```

- [ ] **Step 8: Build login page**

```tsx
// src/app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/queue'); router.refresh() }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F9FAFB' }}>
      <form onSubmit={handleLogin} style={{ width: 360, background: '#FFFFFF', borderRadius: 12, padding: 32, border: '0.5px solid #E5E7EB' }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Aventus Studio</div>
        <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>Sign in to your account</div>
        {error && <div style={{ fontSize: 13, color: '#991B1B', background: '#FEF2F2', padding: '8px 12px', borderRadius: 6, marginBottom: 16 }}>{error}</div>}
        <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '0.5px solid #E5E7EB', fontSize: 13, marginBottom: 16, outline: 'none', fontFamily: 'Inter, system-ui, sans-serif' }} />
        <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '0.5px solid #E5E7EB', fontSize: 13, marginBottom: 24, outline: 'none', fontFamily: 'Inter, system-ui, sans-serif' }} />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: '#111827', color: '#FFFFFF', fontSize: 13, fontWeight: 500, cursor: loading ? 'wait' : 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 9: Verify build + commit**

```bash
npm run build && git add -A && git commit -m "feat: add Supabase auth, CSRF helper, login page"
```

---

### Task 3: Database Schema + Types

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`, `src/types/database.ts`

All tables from the spec are created here (including `comments` and `analytics_snapshots` for later phases), plus the `increment_api_usage` RPC function, and correct RLS policies.

- [ ] **Step 1: Write migration SQL**

```sql
-- supabase/migrations/001_initial_schema.sql
create extension if not exists pgcrypto;

-- workspaces
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  niche text not null default '',
  avatar_url text,
  creator_voice text not null default '',
  ig_account_id text, ig_access_token text, ig_token_expires_at timestamptz,
  tiktok_open_id text, tiktok_access_token text, tiktok_token_expires_at timestamptz,
  yt_channel_id text, yt_refresh_token text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table workspaces enable row level security;
create policy "Users manage own workspaces" on workspaces
  for all using (user_id = auth.uid() and deleted_at is null);

-- generation_batches
create table generation_batches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  topic text not null,
  status text not null default 'generating_text',
  total_posts int not null default 0,
  posts_created int not null default 0,
  images_completed int not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table generation_batches enable row level security;
create policy "Users manage own batches" on generation_batches
  for all using (workspace_id in (select id from workspaces where user_id = auth.uid() and deleted_at is null));

-- posts
create table posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  platform text not null check (platform in ('instagram','tiktok','youtube')),
  caption text not null default '',
  hashtags text[] not null default '{}',
  media_type text not null default 'image' check (media_type in ('image','video','carousel')),
  status text not null default 'draft' check (status in ('draft','approved','scheduled','publishing','published','failed')),
  scheduled_at timestamptz, published_at timestamptz, platform_post_id text,
  ai_generated boolean not null default false, ai_prompt text,
  generation_batch_id uuid references generation_batches(id) on delete set null,
  retry_count int not null default 0, last_error text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table posts enable row level security;
create policy "Users manage own posts" on posts
  for all using (workspace_id in (select id from workspaces where user_id = auth.uid() and deleted_at is null) and deleted_at is null);
create index idx_posts_workspace_status on posts(workspace_id, status) where deleted_at is null;
create index idx_posts_scheduled on posts(scheduled_at) where status = 'scheduled' and deleted_at is null;

-- post_media
create table post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  media_url text, media_type text not null default 'image' check (media_type in ('image','video')),
  position int not null default 0,
  ai_image_prompt text,
  image_status text not null default 'pending' check (image_status in ('pending','generating','completed','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table post_media enable row level security;
create policy "Users manage own post_media" on post_media
  for all using (post_id in (select id from posts where workspace_id in (select id from workspaces where user_id = auth.uid() and deleted_at is null) and deleted_at is null));
create index idx_post_media_pending on post_media(image_status) where image_status = 'pending';

-- comments (Phase 5 but schema created now)
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  platform text not null check (platform in ('instagram','youtube')),
  platform_comment_id text not null,
  author_name text not null default '', author_avatar_url text,
  text text not null default '',
  ai_reply text, reply_status text not null default 'pending' check (reply_status in ('pending','approved','sent','dismissed')),
  replied_at timestamptz, fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform_comment_id, platform)
);
alter table comments enable row level security;
create policy "Users manage own comments" on comments
  for all using (workspace_id in (select id from workspaces where user_id = auth.uid() and deleted_at is null));

-- analytics_snapshots (Phase 4 but schema created now)
create table analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  platform text not null,
  likes int default 0, comments_count int default 0, views int default 0,
  shares int default 0, saves int default 0, reach int default 0, impressions int default 0,
  fetched_at timestamptz not null default now()
);
alter table analytics_snapshots enable row level security;
create policy "Users view own analytics" on analytics_snapshots
  for select using (workspace_id in (select id from workspaces where user_id = auth.uid() and deleted_at is null));
create index idx_analytics_workspace_date on analytics_snapshots(workspace_id, fetched_at);
create index idx_analytics_post_date on analytics_snapshots(post_id, fetched_at);

-- api_usage (service role only — no user-facing RLS)
create table api_usage (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  workspace_id uuid references workspaces(id) on delete cascade,
  date date not null default current_date,
  request_count int not null default 0,
  daily_limit int not null,
  unique (service, workspace_id, date)
);
alter table api_usage enable row level security;
-- No user-facing RLS. All api_usage access goes through service role client.

-- Atomic increment function (prevents race conditions)
create or replace function increment_api_usage(
  p_service text, p_workspace_id uuid, p_date date, p_limit int
) returns jsonb as $$
declare
  v_count int;
begin
  insert into api_usage (service, workspace_id, date, request_count, daily_limit)
  values (p_service, p_workspace_id, p_date, 1, p_limit)
  on conflict (service, workspace_id, date)
  do update set request_count = api_usage.request_count + 1
  returning request_count into v_count;

  return jsonb_build_object('allowed', v_count <= p_limit, 'remaining', greatest(p_limit - v_count, 0));
end;
$$ language plpgsql security definer;

-- updated_at trigger
create or replace function update_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger workspaces_updated_at before update on workspaces for each row execute function update_updated_at();
create trigger generation_batches_updated_at before update on generation_batches for each row execute function update_updated_at();
create trigger posts_updated_at before update on posts for each row execute function update_updated_at();
create trigger post_media_updated_at before update on post_media for each row execute function update_updated_at();
create trigger comments_updated_at before update on comments for each row execute function update_updated_at();
```

- [ ] **Step 2: Run SQL in Supabase Dashboard → SQL Editor**

- [ ] **Step 3: Create TypeScript types**

```ts
// src/types/database.ts
export type Platform = 'instagram' | 'tiktok' | 'youtube'
export type PostStatus = 'draft' | 'approved' | 'scheduled' | 'publishing' | 'published' | 'failed'
export type MediaType = 'image' | 'video' | 'carousel'
export type ImageStatus = 'pending' | 'generating' | 'completed' | 'failed'
export type BatchStatus = 'generating_text' | 'generating_images' | 'completed' | 'partial' | 'failed'

export interface Workspace {
  id: string; user_id: string; name: string; niche: string
  avatar_url: string | null; creator_voice: string
  ig_account_id: string | null; tiktok_open_id: string | null; yt_channel_id: string | null
  deleted_at: string | null; created_at: string; updated_at: string
}

export interface GenerationBatch {
  id: string; workspace_id: string; topic: string; status: BatchStatus
  total_posts: number; posts_created: number; images_completed: number
  error_message: string | null; created_at: string; updated_at: string
}

export interface Post {
  id: string; workspace_id: string; platform: Platform
  caption: string; hashtags: string[]; media_type: MediaType; status: PostStatus
  scheduled_at: string | null; published_at: string | null; platform_post_id: string | null
  ai_generated: boolean; ai_prompt: string | null; generation_batch_id: string | null
  retry_count: number; last_error: string | null
  deleted_at: string | null; created_at: string; updated_at: string
}

export interface PostMedia {
  id: string; post_id: string; media_url: string | null
  media_type: 'image' | 'video'; position: number
  ai_image_prompt: string | null; image_status: ImageStatus
  created_at: string; updated_at: string
}

export interface PostWithMedia extends Post { post_media: PostMedia[] }
```

- [ ] **Step 4: Verify build + commit**

```bash
npm run build && git add -A && git commit -m "feat: add full database schema, RPC function, and TS types"
```

---

### Task 4: Workspace Provider + Sidebar

**Files:**
- Create: `src/components/workspace-provider.tsx`, `src/hooks/use-workspace.ts`, `src/components/sidebar.tsx`
- Modify: `src/app/layout.tsx`, `src/app/(app)/layout.tsx`

- [ ] **Step 1: Create workspace provider**

```tsx
// src/components/workspace-provider.tsx
'use client'
import { createContext, useState, useEffect, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Workspace } from '@/types/database'

export interface WorkspaceContextValue {
  workspaces: Workspace[]; active: Workspace | null
  setActive: (ws: Workspace) => void; reload: () => Promise<void>; loading: boolean
}

export const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaces: [], active: null, setActive: () => {}, reload: async () => {}, loading: true,
})

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [active, setActiveState] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('workspaces').select('*').is('deleted_at', null).order('created_at')
    const list = (data ?? []) as Workspace[]
    setWorkspaces(list)
    const savedId = localStorage.getItem('aventus_active_workspace')
    const saved = list.find((w) => w.id === savedId)
    setActiveState(saved ?? list[0] ?? null)
    setLoading(false)
  }

  function setActive(ws: Workspace) { setActiveState(ws); localStorage.setItem('aventus_active_workspace', ws.id) }
  useEffect(() => { load() }, [])

  return <WorkspaceContext.Provider value={{ workspaces, active, setActive, reload: load, loading }}>{children}</WorkspaceContext.Provider>
}
```

- [ ] **Step 2: Create hook**

```ts
// src/hooks/use-workspace.ts
'use client'
import { useContext } from 'react'
import { WorkspaceContext, type WorkspaceContextValue } from '@/components/workspace-provider'
export function useWorkspace(): WorkspaceContextValue { return useContext(WorkspaceContext) }
```

- [ ] **Step 3: Create sidebar** (same design as current mockup — white bg, 240px, Inter, Framer Motion stagger, Link-based nav, workspace switcher)

```tsx
// src/components/sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutList, Calendar, BarChart3, FolderOpen, Settings, Plus, Sparkles } from 'lucide-react'
import { useWorkspace } from '@/hooks/use-workspace'

const navItems = [
  { label: 'Queue', href: '/queue', icon: LayoutList },
  { label: 'Generate', href: '/generate', icon: Sparkles },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Replies', href: '/replies', icon: FolderOpen },
  { label: 'Settings', href: '/settings', icon: Settings },
]

const fade = (i: number) => ({ initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.03, duration: 0.2 } })

export function Sidebar() {
  const pathname = usePathname()
  const { workspaces, active, setActive } = useWorkspace()

  return (
    <aside style={{ width: 240, minWidth: 240, height: '100%', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRight: '0.5px solid #E5E7EB' }}>
      <motion.div style={{ padding: '24px 20px 12px' }} {...fade(0)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>A</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', lineHeight: 1 }}>Aventus</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Creator Studio</div>
          </div>
        </div>
      </motion.div>

      <div style={{ padding: '8px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '0 8px', marginBottom: 4 }}>Workspace</div>
        {workspaces.map((ws) => (
          <motion.div key={ws.id} onClick={() => setActive(ws)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: ws.id === active?.id ? 500 : 400, color: '#111827', background: ws.id === active?.id ? '#F3F4F6' : 'transparent' }}
            whileHover={{ background: ws.id === active?.id ? '#F3F4F6' : '#F9FAFB' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: ws.id === active?.id ? '#111827' : '#D1D5DB' }} />
            {ws.name}
          </motion.div>
        ))}
        {workspaces.length === 0 && <div style={{ fontSize: 12, color: '#9CA3AF', padding: '4px 8px' }}>No workspaces yet</div>}
      </div>

      <nav style={{ padding: '8px 12px', flex: 1 }}>
        {navItems.map((item, i) => {
          const Icon = item.icon; const isActive = pathname.startsWith(item.href)
          return (
            <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
              <motion.div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 500 : 400, color: isActive ? '#111827' : '#6B7280', background: isActive ? '#F3F4F6' : 'transparent', marginBottom: 2 }}
                whileHover={{ background: isActive ? '#F3F4F6' : '#F9FAFB' }} {...fade(i + 1)}>
                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />{item.label}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '0 12px 16px' }}>
        <Link href="/generate" style={{ textDecoration: 'none' }}>
          <motion.button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 8, border: 'none', background: '#111827', color: '#FFFFFF', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            whileHover={{ background: '#1F2937' }} whileTap={{ scale: 0.98 }}>
            <Plus size={15} strokeWidth={2} />Generate Week
          </motion.button>
        </Link>
      </div>
    </aside>
  )
}
```

- [ ] **Step 4: Update layouts**

Root layout wraps in WorkspaceProvider:
```tsx
// src/app/layout.tsx — update body to:
<body><WorkspaceProvider>{children}</WorkspaceProvider></body>
```

App layout adds sidebar:
```tsx
// src/app/(app)/layout.tsx — update to:
import { Sidebar } from '@/components/sidebar'
// ... add <Sidebar /> before <main>
```

- [ ] **Step 5: Verify build + commit**

```bash
npm run build && git add -A && git commit -m "feat: add workspace provider, sidebar, route layouts"
```

---

### Task 5: Workspace API + Settings Page

**Files:**
- Create: `src/app/api/workspaces/route.ts`, `src/app/api/workspaces/[id]/route.ts`, `src/components/settings-page.tsx`, `src/app/(app)/settings/page.tsx`

- [ ] **Step 1: Create workspace API routes**

```ts
// src/app/api/workspaces/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/csrf'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data, error } = await supabase.from('workspaces')
    .select('id, name, niche, avatar_url, creator_voice, created_at, updated_at')
    .is('deleted_at', null).order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  if (!validateOrigin(request)) return NextResponse.json({ error: 'CSRF' }, { status: 403 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const name = (body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const { data, error } = await supabase.from('workspaces')
    .insert({ user_id: user.id, name, niche: body.niche ?? '', creator_voice: body.creator_voice ?? '' })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

```ts
// src/app/api/workspaces/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/csrf'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!validateOrigin(request)) return NextResponse.json({ error: 'CSRF' }, { status: 403 })
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.niche !== undefined) updates.niche = body.niche
  if (body.creator_voice !== undefined) updates.creator_voice = body.creator_voice
  if (!Object.keys(updates).length) return NextResponse.json({ error: 'No fields' }, { status: 400 })

  const { data, error } = await supabase.from('workspaces').update(updates).eq('id', id).is('deleted_at', null).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!validateOrigin(request)) return NextResponse.json({ error: 'CSRF' }, { status: 403 })
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Use service client so RLS doesn't block the cascading post updates
  const admin = createServiceClient()

  // Verify ownership first via authenticated client
  const { data: ws } = await supabase.from('workspaces').select('id').eq('id', id).is('deleted_at', null).single()
  if (!ws) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Cancel scheduled posts BEFORE soft-deleting workspace (RLS depends on workspace not being deleted)
  await admin.from('posts').update({ status: 'draft', scheduled_at: null }).eq('workspace_id', id).eq('status', 'scheduled')
  await admin.from('workspaces').update({ deleted_at: new Date().toISOString() }).eq('id', id)

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create settings page**

```tsx
// src/components/settings-page.tsx
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import { useWorkspace } from '@/hooks/use-workspace'

export function SettingsPage() {
  const { workspaces, active, setActive, reload } = useWorkspace()
  const [name, setName] = useState('')
  const [niche, setNiche] = useState('')
  const [voice, setVoice] = useState('')
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    const res = await fetch('/api/workspaces', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), niche, creator_voice: voice }),
    })
    if (res.ok) {
      setName(''); setNiche(''); setVoice('')
      await reload()
    }
    setCreating(false)
  }

  async function saveWorkspace() {
    if (!active) return
    setSaving(true)
    await fetch(`/api/workspaces/${active.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: active.name, niche: active.niche, creator_voice: active.creator_voice }),
    })
    await reload()
    setSaving(false)
  }

  async function deleteWorkspace(id: string) {
    if (!confirm('Delete this workspace? Scheduled posts will be cancelled.')) return
    await fetch(`/api/workspaces/${id}`, { method: 'DELETE' })
    await reload()
  }

  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '0.5px solid #E5E7EB', fontSize: 13, outline: 'none', fontFamily: 'Inter, system-ui, sans-serif', marginBottom: 12 }
  const labelStyle = { fontSize: 13, fontWeight: 500 as const, color: '#374151', display: 'block' as const, marginBottom: 4 }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 24 }}>Settings</h1>

      {/* Create workspace */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>New Workspace</div>
        <form onSubmit={createWorkspace}>
          <label style={labelStyle}>Creator name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah J" required style={inputStyle} />
          <label style={labelStyle}>Niche</label>
          <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. fitness, beauty, creator economy" style={inputStyle} />
          <label style={labelStyle}>Creator voice</label>
          <input value={voice} onChange={(e) => setVoice(e.target.value)} placeholder="e.g. Energetic, motivational, uses emojis" style={inputStyle} />
          <motion.button type="submit" disabled={creating}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: 'none', background: '#111827', color: '#FFFFFF', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            whileHover={{ background: '#1F2937' }} whileTap={{ scale: 0.98 }}>
            <Plus size={14} />{creating ? 'Creating...' : 'Create Workspace'}
          </motion.button>
        </form>
      </div>

      {/* Existing workspaces */}
      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 12 }}>Workspaces</div>
      {workspaces.map((ws) => (
        <div key={ws.id} style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{ws.name}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{ws.niche || 'No niche set'}</div>
          </div>
          <motion.button onClick={() => deleteWorkspace(ws.id)} title="Delete"
            style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            whileTap={{ scale: 0.9 }}>
            <Trash2 size={14} color="#991B1B" />
          </motion.button>
        </div>
      ))}
    </div>
  )
}
```

```tsx
// src/app/(app)/settings/page.tsx
import { SettingsPage } from '@/components/settings-page'
export default function Settings() { return <SettingsPage /> }
```

- [ ] **Step 3: Verify build + commit**

```bash
npm run build && git add -A && git commit -m "feat: add workspace CRUD API, settings page with create/delete"
```

---

### Task 6: Gemini Client + Validation + API Usage

**Files:**
- Create: `src/lib/gemini.ts`, `src/lib/validation.ts`, `src/lib/api-usage.ts`

- [ ] **Step 1: Install Gemini SDK**

```bash
npm install @google/generative-ai
```

- [ ] **Step 2: Create Gemini client (text + Imagen 3)**

```ts
// src/lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generatePostOutlines(niche: string, creatorVoice: string, topic?: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

  const prompt = `You are a social media content strategist. Generate 7 days of social media posts for a creator in the "${niche}" niche.${topic ? ` Focus on: "${topic}".` : ''}
${creatorVoice ? `Creator voice: ${creatorVoice}` : ''}

For each day (1-7), create 3 posts — one for Instagram, TikTok, YouTube.

Return ONLY valid JSON: {"posts":[{"day":1,"platform":"instagram","caption":"...","hashtags":["#tag"],"suggested_time":"09:00","image_prompt":"detailed visual description for AI image generation"}]}

Rules: 21 posts total, captions under 2200 chars, max 30 hashtags with # prefix, times in 24hr, spread throughout day.`

  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(text).posts as Array<{
    day: number; platform: string; caption: string; hashtags: string[]; suggested_time: string; image_prompt: string
  }>
}

export async function generateImageBuffer(prompt: string): Promise<Buffer | null> {
  // Use Imagen 3 via the Gemini API
  const model = genAI.getGenerativeModel({ model: 'imagen-3.0-generate-002' })
  try {
    const result = await model.generateImages({
      prompt,
      config: { numberOfImages: 1, outputMimeType: 'image/png' },
    })
    const image = result.images?.[0]
    if (image?.imageBytes) return Buffer.from(image.imageBytes, 'base64')
    return null
  } catch {
    return null
  }
}

export async function regenerateCaption(platform: string, currentCaption: string, niche: string, creatorVoice: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })
  const prompt = `Rewrite this ${platform} caption for a "${niche}" creator.${creatorVoice ? ` Voice: ${creatorVoice}` : ''}
Current: "${currentCaption}"
Return ONLY JSON: {"caption":"...","hashtags":["#tag"]}`
  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(text) as { caption: string; hashtags: string[] }
}
```

Note: `generateImages` is the correct Imagen 3 method in the `@google/generative-ai` SDK. If the SDK version doesn't support it yet, fall back to a REST call to `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages`.

- [ ] **Step 3: Create validation + api-usage**

```ts
// src/lib/validation.ts
export function validateTopic(t: string) { return t.replace(/<[^>]*>/g, '').trim().slice(0, 200) }
export function validateCaption(c: string) { return c.slice(0, 2200) }
export function validateHashtags(tags: string[]) {
  return tags.map((t) => t.startsWith('#') ? t : `#${t}`).filter((t) => /^#\w+$/.test(t)).slice(0, 30)
}
```

```ts
// src/lib/api-usage.ts
import { createServiceClient } from '@/lib/supabase/server'

type Service = 'gemini_text' | 'gemini_imagen' | 'instagram' | 'tiktok' | 'youtube'
const LIMITS: Record<Service, number> = { gemini_text: 1000, gemini_imagen: 500, instagram: 200, tiktok: 15, youtube: 10000 }

export async function checkAndIncrement(service: Service, workspaceId?: string): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createServiceClient() // Always use service client (bypasses RLS)
  const today = new Date().toISOString().split('T')[0]
  const limit = LIMITS[service]

  const { data, error } = await supabase.rpc('increment_api_usage', {
    p_service: service, p_workspace_id: workspaceId ?? null, p_date: today, p_limit: limit,
  })

  if (error) return { allowed: true, remaining: limit } // Fail open on tracking errors
  return { allowed: data.allowed, remaining: data.remaining }
}
```

- [ ] **Step 4: Verify build + commit**

```bash
npm run build && git add -A && git commit -m "feat: add Gemini client (Imagen 3), validation, API usage tracking"
```

---

### Task 7: Generate + Posts API Routes

**Files:**
- Create: `src/app/api/generate/route.ts`, `src/app/api/posts/route.ts`, `src/app/api/posts/[id]/route.ts`, `src/app/api/posts/[id]/regenerate/route.ts`

- [ ] **Step 1: Create POST /api/generate**

Uses batch inserts instead of 42 individual DB calls.

```ts
// src/app/api/generate/route.ts
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generatePostOutlines } from '@/lib/gemini'
import { validateTopic, validateCaption, validateHashtags } from '@/lib/validation'
import { checkAndIncrement } from '@/lib/api-usage'
import { validateOrigin } from '@/lib/csrf'

export async function POST(request: Request) {
  if (!validateOrigin(request)) return NextResponse.json({ error: 'CSRF' }, { status: 403 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const workspaceId = body.workspace_id
  if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

  // Fetch workspace (select only needed columns, not tokens)
  const { data: workspace } = await supabase.from('workspaces')
    .select('id, niche, creator_voice').eq('id', workspaceId).is('deleted_at', null).single()
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const topic = body.topic ? validateTopic(body.topic) : ''
  const niche = workspace.niche || topic || 'general content'

  const usage = await checkAndIncrement('gemini_text')
  if (!usage.allowed) return NextResponse.json({ error: 'Gemini daily limit reached. Try again tomorrow.' }, { status: 429 })

  const admin = createServiceClient()

  // Create batch
  const { data: batch } = await admin.from('generation_batches')
    .insert({ workspace_id: workspaceId, topic: topic || niche, status: 'generating_text', total_posts: 21 })
    .select().single()
  if (!batch) return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 })

  try {
    const outlines = await generatePostOutlines(niche, workspace.creator_voice, topic || undefined)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 1)

    // Batch insert posts
    const postRows = outlines.map((o) => {
      const d = new Date(startDate); d.setDate(d.getDate() + (o.day - 1))
      const [h, m] = o.suggested_time.split(':').map(Number); d.setHours(h, m, 0, 0)
      return {
        workspace_id: workspaceId, platform: o.platform, caption: validateCaption(o.caption),
        hashtags: validateHashtags(o.hashtags), media_type: 'image', status: 'draft',
        scheduled_at: d.toISOString(), ai_generated: true,
        ai_prompt: `${niche}: ${o.caption.slice(0, 100)}`, generation_batch_id: batch.id,
      }
    })

    const { data: posts } = await admin.from('posts').insert(postRows).select('id')
    if (!posts) throw new Error('Failed to insert posts')

    // Batch insert post_media
    const mediaRows = posts.map((p: any, i: number) => ({
      post_id: p.id, media_type: 'image', position: 0,
      ai_image_prompt: outlines[i]?.image_prompt ?? '', image_status: 'pending',
    }))
    await admin.from('post_media').insert(mediaRows)

    await admin.from('generation_batches').update({ status: 'generating_images', posts_created: posts.length }).eq('id', batch.id)

    return NextResponse.json({ batch_id: batch.id, posts_created: posts.length })
  } catch (err) {
    await admin.from('generation_batches')
      .update({ status: 'failed', error_message: err instanceof Error ? err.message : 'Unknown error' })
      .eq('id', batch.id)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create posts list + create routes**

```ts
// src/app/api/posts/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/csrf'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const p = request.nextUrl.searchParams
  const workspaceId = p.get('workspace_id')
  if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

  let query = supabase.from('posts').select('*, post_media(*)')
    .eq('workspace_id', workspaceId).is('deleted_at', null)
    .order('scheduled_at', { ascending: true, nullsFirst: false })
  const status = p.get('status'); if (status) query = query.eq('status', status)
  const limit = Math.min(Number(p.get('limit') ?? 50), 100)
  query = query.limit(limit)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  if (!validateOrigin(request)) return NextResponse.json({ error: 'CSRF' }, { status: 403 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  if (!body.workspace_id || !body.platform) return NextResponse.json({ error: 'workspace_id and platform required' }, { status: 400 })

  const { data, error } = await supabase.from('posts')
    .insert({ workspace_id: body.workspace_id, platform: body.platform, caption: body.caption ?? '', hashtags: body.hashtags ?? [], media_type: body.media_type ?? 'image', status: 'draft', scheduled_at: body.scheduled_at ?? null, ai_generated: false })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 3: Create PATCH + DELETE posts**

```ts
// src/app/api/posts/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateCaption, validateHashtags } from '@/lib/validation'
import { validateOrigin } from '@/lib/csrf'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!validateOrigin(request)) return NextResponse.json({ error: 'CSRF' }, { status: 403 })
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: existing } = await supabase.from('posts').select('status, scheduled_at').eq('id', id).is('deleted_at', null).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.status === 'published') return NextResponse.json({ error: 'Cannot edit published posts' }, { status: 400 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if (body.caption !== undefined) updates.caption = validateCaption(body.caption)
  if (body.hashtags !== undefined) updates.hashtags = validateHashtags(body.hashtags)
  if (body.scheduled_at !== undefined) updates.scheduled_at = body.scheduled_at
  if (body.status !== undefined) updates.status = body.status

  // Auto-transition: approved + has scheduled_at → scheduled
  const finalScheduledAt = updates.scheduled_at ?? existing.scheduled_at
  if (updates.status === 'approved' && finalScheduledAt) updates.status = 'scheduled'

  const { data, error } = await supabase.from('posts').update(updates).eq('id', id).select('*, post_media(*)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!validateOrigin(request)) return NextResponse.json({ error: 'CSRF' }, { status: 403 })
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: existing } = await supabase.from('posts').select('status').eq('id', id).is('deleted_at', null).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.status === 'published') return NextResponse.json({ error: 'Cannot delete published posts' }, { status: 400 })

  await supabase.from('posts').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Create regenerate route**

```ts
// src/app/api/posts/[id]/regenerate/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { regenerateCaption } from '@/lib/gemini'
import { checkAndIncrement } from '@/lib/api-usage'
import { validateOrigin } from '@/lib/csrf'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!validateOrigin(request)) return NextResponse.json({ error: 'CSRF' }, { status: 403 })
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: post } = await supabase.from('posts')
    .select('platform, caption, workspace_id').eq('id', id).is('deleted_at', null).single()
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: ws } = await supabase.from('workspaces')
    .select('niche, creator_voice').eq('id', post.workspace_id).single()
  if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const usage = await checkAndIncrement('gemini_text')
  if (!usage.allowed) return NextResponse.json({ error: 'Gemini daily limit reached' }, { status: 429 })

  const result = await regenerateCaption(post.platform, post.caption, ws.niche, ws.creator_voice)
  const { data, error } = await supabase.from('posts').update({ caption: result.caption, hashtags: result.hashtags }).eq('id', id).select('*, post_media(*)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 5: Verify build + commit**

```bash
npm run build && git add -A && git commit -m "feat: add generate, posts CRUD, and regenerate API routes"
```

---

### Task 8: Image Generation Cron

**Files:**
- Create: `src/app/api/cron/generate-images/route.ts`, `src/app/api/cron/keepalive/route.ts`

- [ ] **Step 1: Create shared cron auth helper**

```ts
// Add to src/lib/supabase/server.ts
import { timingSafeEqual } from 'crypto'

export function validateCronSecret(request: Request): boolean {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return false
  const token = auth.slice(7)
  const secret = process.env.CRON_SECRET!
  if (token.length !== secret.length) return false
  return timingSafeEqual(Buffer.from(token), Buffer.from(secret))
}
```

- [ ] **Step 2: Create image generation cron**

Processes images in parallel (max 5 concurrent) to stay within 10s timeout. Checks gemini_imagen rate limit.

```ts
// src/app/api/cron/generate-images/route.ts
import { NextResponse } from 'next/server'
import { createServiceClient, validateCronSecret } from '@/lib/supabase/server'
import { generateImageBuffer } from '@/lib/gemini'
import { checkAndIncrement } from '@/lib/api-usage'

export async function POST(request: Request) {
  if (!validateCronSecret(request)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = createServiceClient()

  // Find pending images (max 5 — parallel processing within 10s timeout)
  const { data: pending } = await supabase.from('post_media')
    .select('id, post_id, ai_image_prompt').eq('image_status', 'pending').limit(5)
  if (!pending?.length) return NextResponse.json({ processed: 0 })

  // Mark all as generating
  await supabase.from('post_media').update({ image_status: 'generating' }).in('id', pending.map((p) => p.id))

  // Process in parallel
  const results = await Promise.allSettled(pending.map(async (media) => {
    // Check rate limit
    const usage = await checkAndIncrement('gemini_imagen')
    if (!usage.allowed) { await supabase.from('post_media').update({ image_status: 'pending' }).eq('id', media.id); return 'skipped' }

    if (!media.ai_image_prompt) { await supabase.from('post_media').update({ image_status: 'failed' }).eq('id', media.id); return 'failed' }

    const buf = await generateImageBuffer(media.ai_image_prompt)
    if (!buf) { await supabase.from('post_media').update({ image_status: 'failed' }).eq('id', media.id); return 'failed' }

    const filename = `posts/${media.post_id}/${media.id}.png`
    const { error } = await supabase.storage.from('media').upload(filename, buf, { contentType: 'image/png', upsert: true })
    if (error) { await supabase.from('post_media').update({ image_status: 'failed' }).eq('id', media.id); return 'failed' }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(filename)
    await supabase.from('post_media').update({ image_status: 'completed', media_url: urlData.publicUrl }).eq('id', media.id)
    return 'completed'
  }))

  const completed = results.filter((r) => r.status === 'fulfilled' && r.value === 'completed').length
  const failed = results.filter((r) => r.status === 'fulfilled' && r.value === 'failed').length

  // Update batch statuses
  const batchIds = new Set<string>()
  for (const media of pending) {
    const { data: post } = await supabase.from('posts').select('generation_batch_id').eq('id', media.post_id).single()
    if (post?.generation_batch_id) batchIds.add(post.generation_batch_id)
  }

  for (const batchId of batchIds) {
    const { data: batchPosts } = await supabase.from('posts').select('id').eq('generation_batch_id', batchId)
    if (!batchPosts) continue
    const postIds = batchPosts.map((p: any) => p.id)
    const { data: allMedia } = await supabase.from('post_media').select('image_status').in('post_id', postIds)
    if (!allMedia) continue

    const stillPending = allMedia.filter((m: any) => m.image_status === 'pending' || m.image_status === 'generating').length
    const doneCount = allMedia.filter((m: any) => m.image_status === 'completed').length
    const failCount = allMedia.filter((m: any) => m.image_status === 'failed').length

    if (stillPending === 0) {
      await supabase.from('generation_batches').update({ status: failCount > 0 ? 'partial' : 'completed', images_completed: doneCount }).eq('id', batchId)
    } else {
      await supabase.from('generation_batches').update({ images_completed: doneCount }).eq('id', batchId)
    }
  }

  return NextResponse.json({ processed: pending.length, completed, failed })
}
```

- [ ] **Step 3: Create keepalive cron**

```ts
// src/app/api/cron/keepalive/route.ts
import { NextResponse } from 'next/server'
import { createServiceClient, validateCronSecret } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (!validateCronSecret(request)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const supabase = createServiceClient()
  await supabase.from('workspaces').select('id').limit(1)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Create Supabase Storage bucket**

In Supabase Dashboard → Storage → create bucket `media`, set to **public**.

- [ ] **Step 5: Verify build + commit**

```bash
npm run build && git add -A && git commit -m "feat: add image generation cron (parallel) and keepalive"
```

---

### Task 9: Generate Page UI

**Files:**
- Create: `src/components/generate-form.tsx`, `src/app/(app)/generate/page.tsx`

- [ ] **Step 1: Create generate form**

```tsx
// src/components/generate-form.tsx
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'
import { useWorkspace } from '@/hooks/use-workspace'
import { useRouter } from 'next/navigation'

export function GenerateForm() {
  const { active } = useWorkspace()
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!active) return
    setLoading(true); setError('')
    const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspace_id: active.id, topic: topic || undefined }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Generation failed'); setLoading(false); return }
    router.push('/queue')
  }

  if (!active) return <div style={{ padding: 40, color: '#9CA3AF', fontSize: 14 }}>Create a workspace first in <a href="/settings" style={{ color: '#111827' }}>Settings</a>.</div>

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Generate Content</div>
      <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 32 }}>AI will create 7 days of posts for <strong style={{ color: '#374151' }}>{active.name}</strong> across Instagram, TikTok, and YouTube.</div>
      {error && <div style={{ fontSize: 13, color: '#991B1B', background: '#FEF2F2', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      <form onSubmit={handleGenerate}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Topic <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional — defaults to "{active.niche || 'general'}")</span></label>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. fitness trends, creator economy" maxLength={200} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '0.5px solid #E5E7EB', fontSize: 14, outline: 'none', fontFamily: 'Inter, system-ui, sans-serif', marginBottom: 24 }} />
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 24, lineHeight: 1.6 }}>~21 posts generated. Images appear in the queue as they complete.</div>
        <motion.button type="submit" disabled={loading} style={{ width: '100%', padding: '12px 0', borderRadius: 8, border: 'none', background: '#111827', color: '#FFFFFF', fontSize: 14, fontWeight: 500, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Inter, system-ui, sans-serif' }} whileHover={loading ? {} : { background: '#1F2937' }} whileTap={loading ? {} : { scale: 0.98 }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? 'Generating...' : 'Generate Week'}
        </motion.button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Create page**

```tsx
// src/app/(app)/generate/page.tsx
import { GenerateForm } from '@/components/generate-form'
export default function GeneratePage() { return <GenerateForm /> }
```

- [ ] **Step 3: Verify build + commit**

```bash
npm run build && git add -A && git commit -m "feat: add generate page UI"
```

---

### Task 10: Queue Page UI

**Files:**
- Create: `src/hooks/use-posts.ts`, `src/components/post-card.tsx`, `src/components/post-queue.tsx`
- Modify: `src/app/(app)/queue/page.tsx`

- [ ] **Step 1: Create usePosts hook**

```ts
// src/hooks/use-posts.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import type { PostWithMedia, PostStatus } from '@/types/database'

export function usePosts(workspaceId: string | undefined, statusFilter?: PostStatus) {
  const [posts, setPosts] = useState<PostWithMedia[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    const params = new URLSearchParams({ workspace_id: workspaceId })
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/posts?${params}`)
    const data = await res.json()
    setPosts(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [workspaceId, statusFilter])

  useEffect(() => { load() }, [load])

  async function updatePost(id: string, updates: Record<string, unknown>) {
    const res = await fetch(`/api/posts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
    if (res.ok) await load(); return res.ok
  }
  async function deletePost(id: string) { const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' }); if (res.ok) await load(); return res.ok }
  async function regeneratePost(id: string) { const res = await fetch(`/api/posts/${id}/regenerate`, { method: 'POST' }); if (res.ok) await load(); return res.ok }

  return { posts, loading, reload: load, updatePost, deletePost, regeneratePost }
}
```

- [ ] **Step 2: Create post card**

```tsx
// src/components/post-card.tsx
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Pencil, Check, X, RefreshCw, Trash2, Loader2 } from 'lucide-react'
import type { PostWithMedia } from '@/types/database'

const pBadge = { instagram: { bg: '#FDF2F8', color: '#9D174D' }, tiktok: { bg: '#ECFDF5', color: '#065F46' }, youtube: { bg: '#FEF2F2', color: '#991B1B' } } as const
const sBadge = { draft: { bg: '#F3F4F6', color: '#6B7280', Icon: Pencil }, approved: { bg: '#EFF6FF', color: '#1D4ED8', Icon: Check }, scheduled: { bg: '#F0FDF4', color: '#15803D', Icon: Clock }, publishing: { bg: '#FFFBEB', color: '#B45309', Icon: Loader2 }, published: { bg: '#F0FDF4', color: '#15803D', Icon: Check }, failed: { bg: '#FEF2F2', color: '#991B1B', Icon: X } } as const

interface Props { post: PostWithMedia; onApprove: () => void; onReject: () => void; onRegenerate: () => void; onDelete: () => void }

export function PostCard({ post, onApprove, onReject, onRegenerate, onDelete }: Props) {
  const [hover, setHover] = useState(false)
  const p = pBadge[post.platform]; const s = sBadge[post.status]; const SIcon = s.Icon
  const media = post.post_media?.[0]
  const time = post.scheduled_at ? new Date(post.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--'
  const date = post.scheduled_at ? new Date(post.scheduled_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : ''

  return (
    <motion.div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#FFFFFF', border: '0.5px solid #E5E7EB', borderRadius: 12, padding: '16px 20px', cursor: 'pointer' }}
      whileHover={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)', y: -1 }}>
      <div style={{ width: 48, height: 48, borderRadius: 8, background: media?.media_url ? undefined : '#F3F4F6', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {media?.media_url ? <img src={media.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
         : media?.image_status === 'pending' || media?.image_status === 'generating' ? <Loader2 size={16} color="#9CA3AF" className="animate-spin" />
         : <Pencil size={14} color="#D1D5DB" />}
      </div>
      <div style={{ width: 56, flexShrink: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{time}</div>
        <div style={{ fontSize: 10, color: '#9CA3AF' }}>{date}</div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color: p.color, background: p.bg, padding: '4px 10px', borderRadius: 6, flexShrink: 0 }}>{post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}</span>
      <span style={{ flex: 1, fontSize: 14, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, minWidth: 0 }}>{post.caption}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: s.color, background: s.bg, padding: '4px 10px', borderRadius: 100, flexShrink: 0 }}><SIcon size={12} strokeWidth={2} />{post.status.charAt(0).toUpperCase() + post.status.slice(1)}</span>
      {hover && post.status === 'draft' && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <motion.button onClick={onApprove} title="Approve" style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#F0FDF4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} whileTap={{ scale: 0.9 }}><Check size={14} color="#15803D" /></motion.button>
          <motion.button onClick={onRegenerate} title="Regenerate" style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#EFF6FF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} whileTap={{ scale: 0.9 }}><RefreshCw size={14} color="#1D4ED8" /></motion.button>
          <motion.button onClick={onDelete} title="Delete" style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} whileTap={{ scale: 0.9 }}><Trash2 size={14} color="#991B1B" /></motion.button>
        </div>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 3: Create post queue + update page**

```tsx
// src/components/post-queue.tsx
'use client'
import { useWorkspace } from '@/hooks/use-workspace'
import { usePosts } from '@/hooks/use-posts'
import { PostCard } from '@/components/post-card'

export function PostQueue() {
  const { active } = useWorkspace()
  const { posts, loading, updatePost, deletePost, regeneratePost } = usePosts(active?.id)

  if (!active) return <div style={{ padding: 24, color: '#9CA3AF', fontSize: 14 }}>Select a workspace.</div>
  if (loading) return <div style={{ padding: 24, color: '#9CA3AF', fontSize: 14 }}>Loading...</div>

  const grouped = new Map<string, typeof posts>()
  for (const post of posts) {
    const key = post.scheduled_at ? new Date(post.scheduled_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }) : 'Unscheduled'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(post)
  }

  return (
    <div>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', borderBottom: '0.5px solid #E5E7EB', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>Queue</h1>
        <span style={{ fontSize: 13, color: '#9CA3AF' }}>{posts.length} posts</span>
      </div>
      <div style={{ padding: '24px 24px 48px' }}>
        {posts.length === 0 ? <div style={{ textAlign: 'center', padding: '64px 0', color: '#9CA3AF', fontSize: 14 }}>No posts yet. <a href="/generate" style={{ color: '#111827' }}>Generate your first week</a>.</div> : (
          [...grouped.entries()].map(([day, dayPosts]) => (
            <div key={day} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{day}</span>
                <div style={{ flex: 1, height: 1, background: '#F3F4F6', marginLeft: 8 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dayPosts.map((post) => <PostCard key={post.id} post={post} onApprove={() => updatePost(post.id, { status: 'approved' })} onReject={() => deletePost(post.id)} onRegenerate={() => regeneratePost(post.id)} onDelete={() => deletePost(post.id)} />)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

```tsx
// src/app/(app)/queue/page.tsx
import { PostQueue } from '@/components/post-queue'
export default function QueuePage() { return <PostQueue /> }
```

- [ ] **Step 4: Verify build + commit**

```bash
npm run build && git add -A && git commit -m "feat: add queue page with post cards and approve/reject/regenerate"
```

---

### Task 11: End-to-End Smoke Test

- [ ] **Step 1: Set up Supabase** — create project, run migration SQL, create `media` storage bucket (public), create a user in Authentication → Users, copy keys to `.env.local`

- [ ] **Step 2: Set up Gemini** — get API key from aistudio.google.com, add to `.env.local`

- [ ] **Step 3: Generate secrets** — `openssl rand -hex 32` for CRON_SECRET and ENCRYPTION_KEY

- [ ] **Step 4: Run `npm run dev`, go to http://localhost:3000** — should redirect to /login

- [ ] **Step 5: Log in** — sign in with your Supabase user

- [ ] **Step 6: Create workspace** — go to /settings, enter name/niche/voice, click Create

- [ ] **Step 7: Generate content** — go to /generate, enter a topic, click Generate Week — should redirect to /queue with ~21 draft posts

- [ ] **Step 8: Test approve/reject** — hover over posts, click approve/delete/regenerate

- [ ] **Step 9: Test image cron** — `curl -X POST http://localhost:3000/api/cron/generate-images -H "Authorization: Bearer YOUR_CRON_SECRET"` — images should start appearing

- [ ] **Step 10: Final commit**

```bash
git add -A && git commit -m "feat: Phase 1 complete — foundation + AI content generation"
```
