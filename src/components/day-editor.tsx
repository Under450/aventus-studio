'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, Hash, Check, Sparkles, Loader2, RefreshCw, ImageIcon, Upload, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/types/database'

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', short: 'IG' },
  { id: 'linkedin', label: 'LinkedIn', short: 'LI' },
  { id: 'tiktok', label: 'TikTok', short: 'TK' },
  { id: 'x', label: 'X', short: 'X' },
] as const

const PLATFORM_COLOURS: Record<string, { bg: string; text: string }> = {
  instagram: { bg: '#FCE7F3', text: '#9D174D' },
  tiktok: { bg: '#ECFDF5', text: '#065F46' },
  youtube: { bg: '#FEF2F2', text: '#991B1B' },
  linkedin: { bg: '#EFF6FF', text: '#1E40AF' },
  x: { bg: '#EFF6FF', text: '#1D4ED8' },
}

interface DayEditorProps {
  date: string
  posts: Post[]
  workspaceId: string | null
  onBack: () => void
  onPostCreated: () => void
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

export function DayEditor({ date, posts, workspaceId, onBack, onPostCreated }: DayEditorProps) {
  const [brief, setBrief] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, boolean>>({
    instagram: true,
    linkedin: true,
    tiktok: false,
    x: false,
  })
  const [scheduledTime, setScheduledTime] = useState('09:00')

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [generatedCaption, setGeneratedCaption] = useState('')
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([])
  const [generateError, setGenerateError] = useState('')
  const [imagePrompt, setImagePrompt] = useState('')

  // Image state
  const [imageUrl, setImageUrl] = useState('')
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState('')
  const [imageProvider, setImageProvider] = useState('')

  const togglePlatform = (id: string) =>
    setSelectedPlatforms((prev) => ({ ...prev, [id]: !prev[id] }))

  const activePlatforms = Object.entries(selectedPlatforms)
    .filter(([, v]) => v)
    .map(([k]) => k)

  const handleGenerate = async () => {
    if (!brief.trim() || !workspaceId || activePlatforms.length === 0) return

    setGenerating(true)
    setGenerateError('')
    setGeneratedCaption('')
    setGeneratedHashtags([])

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          topic: brief.trim(),
          platform: activePlatforms[0],
          tone: '',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setGenerateError(data.error || 'Generation failed')
        return
      }

      setGeneratedCaption(data.caption || '')
      setGeneratedHashtags(data.hashtags || [])
      setImagePrompt(data.image_prompt || '')
      setImageUrl('')
      setImageProvider('')
      onPostCreated()
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateImage = async (quality: 'free' | 'premium') => {
    if (!imagePrompt) return
    setImageLoading(true)
    setImageError('')

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          platform: activePlatforms[0] || 'instagram',
          quality,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setImageError(data.error || 'Image generation failed')
        return
      }
      if (data.base64) {
        setImageUrl(`data:image/png;base64,${data.base64}`)
      } else if (data.url) {
        setImageUrl(data.url)
      }
      setImageProvider(data.provider || quality)
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setImageLoading(false)
    }
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageLoading(true)
    setImageError('')

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() || 'png'
      const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(path, file, { contentType: file.type, upsert: true })

      if (uploadError) {
        setImageError(uploadError.message)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('post-media').getPublicUrl(path)
      setImageUrl(publicUrl)
      setImageProvider('upload')
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setImageLoading(false)
    }
  }

  const canGenerate = brief.trim().length > 0 && workspaceId && activePlatforms.length > 0 && !generating

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        padding: '20px 24px', overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <motion.button
          onClick={onBack}
          style={{
            width: 32, height: 32, borderRadius: 6,
            border: '1px solid var(--studio-border-light)', background: 'var(--studio-panel)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--studio-ink-3)',
          }}
          whileHover={{ background: 'var(--studio-sidebar)' }}
        >
          <ArrowLeft size={16} />
        </motion.button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 400, color: 'var(--studio-ink)', letterSpacing: '-0.02em' }}>
            {formatDate(date)}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--studio-ink-3)', marginTop: 2 }}>
            {posts.length} post{posts.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
      </div>

      {/* Existing posts for this day */}
      {posts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
          }}>
            Scheduled posts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {posts.map((post) => {
              const pc = PLATFORM_COLOURS[post.platform] || { bg: '#F3F4F6', text: '#374151' }
              return (
                <div
                  key={post.id}
                  style={{
                    padding: '12px 14px', borderRadius: 8,
                    border: '0.5px solid var(--studio-border-light)',
                    background: 'var(--studio-panel)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 500, padding: '2px 6px',
                      borderRadius: 4, background: pc.bg, color: pc.text,
                    }}>
                      {post.platform}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--studio-ink-4)', marginLeft: 'auto' }}>
                      {post.status}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 13, color: 'var(--studio-ink-2)',
                    lineHeight: 1.5, marginBottom: 6,
                    display: '-webkit-box', WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {post.caption || 'No caption'}
                  </p>
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Hash size={10} color="var(--studio-ink-4)" />
                      <span style={{ fontSize: 11, color: 'var(--studio-ink-4)' }}>
                        {post.hashtags.slice(0, 5).join(' ')}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 1. Brief */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
        }}>
          Brief
        </div>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="What should this post be about?"
          style={{
            width: '100%', minHeight: 100, padding: '10px 12px',
            borderRadius: 8, border: '1px solid var(--studio-border-light)',
            background: 'var(--studio-panel)', color: 'var(--studio-ink)',
            fontSize: 13, fontFamily: 'var(--studio-sans)',
            resize: 'vertical', outline: 'none',
          }}
        />
      </div>

      {/* 2. Generate button */}
      <div style={{ marginBottom: 16 }}>
        <motion.button
          onClick={handleGenerate}
          disabled={!canGenerate}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', padding: '10px 0', borderRadius: 8,
            border: 'none',
            background: canGenerate ? 'var(--studio-ink)' : 'var(--studio-border-light)',
            color: canGenerate ? '#FFFFFF' : 'var(--studio-ink-4)',
            fontSize: 13, fontWeight: 600,
            cursor: canGenerate ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--studio-sans)',
          }}
          whileHover={canGenerate ? { opacity: 0.9 } : {}}
          whileTap={canGenerate ? { scale: 0.98 } : {}}
        >
          {generating ? (
            <>
              <Loader2 size={15} strokeWidth={2} className="animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles size={15} strokeWidth={2} />
              Generate with Gemma
            </>
          )}
        </motion.button>

        {generateError && (
          <p style={{ fontSize: 12, color: '#DC2626', marginTop: 6 }}>
            {generateError}
          </p>
        )}
      </div>

      {/* 3. Generated caption display */}
      {generatedCaption && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            Caption
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)',
                background: 'none', border: 'none', cursor: generating ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--studio-sans)', textTransform: 'none', letterSpacing: 'normal',
                opacity: generating ? 0.5 : 1,
              }}
            >
              <RefreshCw size={11} className={generating ? 'animate-spin' : ''} />
              Regenerate
            </button>
          </div>
          <textarea
            value={generatedCaption}
            onChange={(e) => setGeneratedCaption(e.target.value)}
            style={{
              width: '100%', minHeight: 120, padding: '12px 14px',
              borderRadius: 8, border: '1px solid var(--studio-ink-3)',
              background: 'var(--studio-panel)', color: 'var(--studio-ink)',
              fontSize: 13, fontFamily: 'var(--studio-sans)',
              lineHeight: 1.6, resize: 'vertical', outline: 'none',
            }}
          />
        </div>
      )}

      {/* 4. Generated hashtags (editable) */}
      {generatedHashtags.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Hash size={10} />
            Hashtags
          </div>
          <textarea
            value={generatedHashtags.join(' ')}
            onChange={(e) => setGeneratedHashtags(
              e.target.value.split(/\s+/).filter((t) => t.length > 0)
            )}
            style={{
              width: '100%', minHeight: 60, padding: '10px 12px',
              borderRadius: 8, border: '1px solid var(--studio-border-light)',
              background: 'var(--studio-panel)', color: 'var(--studio-ink-2)',
              fontSize: 12, fontFamily: 'var(--studio-sans)',
              lineHeight: 1.6, resize: 'vertical', outline: 'none',
            }}
          />
        </div>
      )}

      {/* 5. Image */}
      {imagePrompt && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <ImageIcon size={10} />
            Image
          </div>

          {/* Buttons row */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <button
              onClick={() => handleGenerateImage('free')}
              disabled={imageLoading}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '8px 0', borderRadius: 6,
                border: '1px solid var(--studio-border-light)',
                background: 'var(--studio-panel)', color: 'var(--studio-ink-2)',
                fontSize: 12, fontWeight: 500, cursor: imageLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--studio-sans)', opacity: imageLoading ? 0.5 : 1,
              }}
            >
              <Sparkles size={12} />
              Generate (free)
            </button>
            <button
              onClick={() => handleGenerateImage('premium')}
              disabled={imageLoading}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '8px 0', borderRadius: 6,
                border: '1px solid var(--studio-border-light)',
                background: 'var(--studio-ink)', color: '#FFFFFF',
                fontSize: 12, fontWeight: 500, cursor: imageLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--studio-sans)', opacity: imageLoading ? 0.5 : 1,
              }}
            >
              <Zap size={12} />
              Generate (premium)
            </button>
            <label
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '8px 0', borderRadius: 6,
                border: '1px solid var(--studio-border-light)',
                background: 'var(--studio-panel)', color: 'var(--studio-ink-2)',
                fontSize: 12, fontWeight: 500,
                cursor: imageLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--studio-sans)', opacity: imageLoading ? 0.5 : 1,
              }}
            >
              <Upload size={12} />
              Upload
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleUploadImage}
                disabled={imageLoading}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Loading state */}
          {imageLoading && (
            <div style={{
              padding: '24px', borderRadius: 8,
              border: '1px solid var(--studio-border-light)',
              background: 'var(--studio-panel)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              <Loader2 size={20} color="var(--studio-ink-3)" className="animate-spin" />
              <p style={{ fontSize: 12, color: 'var(--studio-ink-3)' }}>
                Generating image{imageProvider === 'premium' || !imageProvider ? ' (~30s for premium)' : ''}…
              </p>
            </div>
          )}

          {/* Error */}
          {imageError && (
            <p style={{ fontSize: 12, color: '#DC2626', marginBottom: 8 }}>
              {imageError}
            </p>
          )}

          {/* Image preview */}
          {imageUrl && !imageLoading && (
            <div style={{
              borderRadius: 8, overflow: 'hidden',
              border: '1px solid var(--studio-border-light)',
              background: 'var(--studio-panel)',
            }}>
              <img
                src={imageUrl}
                alt="Generated post image"
                style={{ width: '100%', display: 'block' }}
              />
              <div style={{
                padding: '8px 12px',
                borderTop: '1px solid var(--studio-border-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 11, color: 'var(--studio-ink-4)' }}>
                  {imageProvider === 'imagen' ? 'Gemini Imagen (free)' :
                   imageProvider === 'flux-dev' ? 'FLUX Dev (premium)' :
                   imageProvider === 'upload' ? 'Uploaded' : imageProvider}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Platforms */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
        }}>
          Platforms
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PLATFORMS.map((p) => {
            const active = selectedPlatforms[p.id]
            const pc = PLATFORM_COLOURS[p.id] || { bg: '#F3F4F6', text: '#374151' }
            return (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                style={{
                  padding: '6px 12px', borderRadius: 6,
                  border: active ? `1.5px solid ${pc.text}` : '1px solid var(--studio-border-light)',
                  background: active ? pc.bg : 'var(--studio-panel)',
                  color: active ? pc.text : 'var(--studio-ink-3)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'var(--studio-sans)',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 6. Time picker */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
        }}>
          Schedule time
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={14} color="var(--studio-ink-3)" />
          <input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: 6,
              border: '1px solid var(--studio-border-light)',
              background: 'var(--studio-panel)', color: 'var(--studio-ink)',
              fontSize: 13, fontFamily: 'var(--studio-sans)', outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* 7. Approve & Schedule */}
      <motion.button
        style={{
          width: '100%', padding: '12px 0', borderRadius: 8,
          border: 'none', background: 'var(--studio-accent)',
          color: '#FFFFFF', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'var(--studio-sans)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
        whileHover={{ opacity: 0.9 }}
        whileTap={{ scale: 0.98 }}
      >
        <Check size={15} strokeWidth={2} />
        Approve &amp; Schedule
      </motion.button>
    </motion.div>
  )
}
