export interface CreatorProfile {
  id: string
  workspace_id: string
  onlyfans_handle: string
  content_type: string
  brand_voice: string
  target_audience: string
  platforms: string[]
  brand_primary_color: string
  brand_secondary_color: string
  logo_url: string
  mood_board_urls: string[]
  created_at: string
  updated_at: string
}

export type CardMode = 'unsplash' | 'flux' | 'text-only' | 'upload' | 'text-post'

export type CardFormat = 'instagram' | 'tiktok' | 'x' | 'linkedin' | 'reddit'

export interface CardData {
  mode: CardMode
  format: CardFormat
  backgroundUrl: string | null
  logoUrl: string
  primaryColor: string
  secondaryColor: string
  headline: string
  subtext: string
  creatorName: string
}

export interface PlatformCopy {
  instagram: { caption: string; hashtags: string }
  tiktok: { caption: string; hashtags: string }
  x: { caption: string; hashtags: string }
  linkedin: { caption: string; hashtags: string }
  reddit: { caption: string; hashtags: string }
}
