// ============================================================
// Aventus Studio — Database Types
// These mirror the Supabase schema in 001_initial_schema.sql
// ============================================================

export type Platform = 'instagram' | 'tiktok' | 'youtube'
export type PostStatus = 'draft' | 'approved' | 'scheduled' | 'publishing' | 'published' | 'failed'
export type MediaType = 'image' | 'video' | 'carousel'
export type ImageStatus = 'pending' | 'generating' | 'completed' | 'failed'
export type BatchStatus = 'generating_text' | 'generating_images' | 'completed' | 'partial' | 'failed'
export type ReplyStatus = 'pending' | 'approved' | 'sent' | 'dismissed'
export type CommentPlatform = 'instagram' | 'youtube'

// ----------------------------------------------------------
// Row types
// ----------------------------------------------------------

export interface Workspace {
  id: string
  user_id: string
  name: string
  niche: string
  avatar_url: string | null
  creator_voice: string
  ig_account_id: string | null
  ig_access_token: string | null
  ig_token_expires_at: string | null
  tiktok_open_id: string | null
  tiktok_access_token: string | null
  tiktok_token_expires_at: string | null
  yt_channel_id: string | null
  yt_refresh_token: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface GenerationBatch {
  id: string
  workspace_id: string
  topic: string
  status: BatchStatus
  total_posts: number
  posts_created: number
  images_completed: number
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  workspace_id: string
  platform: Platform
  caption: string
  hashtags: string[]
  media_type: MediaType
  status: PostStatus
  scheduled_at: string | null
  published_at: string | null
  platform_post_id: string | null
  ai_generated: boolean
  ai_prompt: string | null
  generation_batch_id: string | null
  retry_count: number
  last_error: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface PostMedia {
  id: string
  post_id: string
  media_url: string | null
  media_type: 'image' | 'video'
  position: number
  ai_image_prompt: string | null
  image_status: ImageStatus
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  post_id: string
  workspace_id: string
  platform: CommentPlatform
  platform_comment_id: string
  author_name: string
  author_avatar_url: string | null
  text: string
  ai_reply: string | null
  reply_status: ReplyStatus
  replied_at: string | null
  fetched_at: string
  updated_at: string
}

export interface AnalyticsSnapshot {
  id: string
  post_id: string
  workspace_id: string
  platform: Platform
  likes: number
  comments_count: number
  views: number
  shares: number
  saves: number
  reach: number
  impressions: number
  fetched_at: string
}

export interface ApiUsage {
  id: string
  service: string
  workspace_id: string | null
  date: string
  request_count: number
  daily_limit: number
}

// ----------------------------------------------------------
// Composite types
// ----------------------------------------------------------

export interface PostWithMedia extends Post {
  post_media: PostMedia[]
}

// ----------------------------------------------------------
// RPC return types
// ----------------------------------------------------------

export interface IncrementApiUsageResult {
  allowed: boolean
  remaining: number
}
