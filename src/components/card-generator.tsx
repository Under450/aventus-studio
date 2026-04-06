'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ImageIcon, Sparkles, Type, Search, Download, Loader2, RefreshCw,
  Eye, EyeOff, Check, Copy, Upload, FileText, CalendarCheck,
} from 'lucide-react'
import { useWorkspace } from '@/hooks/use-workspace'
import { createClient } from '@/lib/supabase/client'
import type { CreatorProfile, CardMode, CardFormat, PlatformCopy } from '@/types/creator'

interface UnsplashPhoto {
  id: string
  url: string
  thumb: string
  alt: string
  photographer: string
}

interface CardGeneratorProps {
  initialCaption?: string
  initialHashtags?: string
  initialDate?: string
}

interface GeneratedCard {
  format: CardFormat
  blobUrl: string
  generating: boolean
}

const MODE_OPTIONS: { mode: CardMode; label: string; icon: typeof ImageIcon; desc: string }[] = [
  { mode: 'unsplash', label: 'Stock Photo', icon: ImageIcon, desc: 'Unsplash search' },
  { mode: 'flux', label: 'AI Image', icon: Sparkles, desc: 'FLUX Dev' },
  { mode: 'upload', label: 'Upload Image', icon: Upload, desc: 'Your own photo' },
  { mode: 'text-only', label: 'Text Only', icon: Type, desc: 'Branded bg' },
  { mode: 'text-post', label: 'Text Post', icon: FileText, desc: 'Copy + hashtags' },
]

const PLATFORM_OPTIONS: { format: CardFormat; label: string; size: string; color: { bg: string; text: string } }[] = [
  { format: 'instagram', label: 'Instagram', size: '1080 × 1350', color: { bg: '#FCE7F3', text: '#9D174D' } },
  { format: 'tiktok', label: 'TikTok', size: '1080 × 1920', color: { bg: '#ECFDF5', text: '#065F46' } },
  { format: 'x', label: 'X / Twitter', size: '1080 × 1080', color: { bg: '#EFF6FF', text: '#1D4ED8' } },
  { format: 'linkedin', label: 'LinkedIn', size: '1200 × 627', color: { bg: '#EFF6FF', text: '#1E40AF' } },
  { format: 'reddit', label: 'Reddit', size: '1080 × 1080', color: { bg: '#FFF7ED', text: '#C2410C' } },
]

const CARD_ASPECT: Record<CardFormat, number> = {
  instagram: 1080 / 1350,
  tiktok: 1080 / 1920,
  x: 1,
  linkedin: 1200 / 627,
  reddit: 1,
}

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function CardGenerator({ initialCaption, initialHashtags, initialDate }: CardGeneratorProps) {
  const { active } = useWorkspace()

  // Profile
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  // Schedule
  const [scheduledDate, setScheduledDate] = useState(initialDate || todayStr())
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [takenTimes, setTakenTimes] = useState<string[]>([])
  const [timeWarning, setTimeWarning] = useState('')

  // Card config
  const [mode, setMode] = useState<CardMode>('text-only')
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)
  const [showLogo, setShowLogo] = useState(true)
  const [selectedFormats, setSelectedFormats] = useState<Record<CardFormat, boolean>>({
    instagram: false,
    tiktok: false,
    x: false,
    linkedin: false,
    reddit: false,
  })

  // Preview tab — tracks which platform's aspect ratio to show
  const [previewFormat, setPreviewFormat] = useState<CardFormat>('instagram')

  // Unsplash
  const [searchQuery, setSearchQuery] = useState('')
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([])
  const [searchingPhotos, setSearchingPhotos] = useState(false)

  // FLUX
  const [fluxPrompt, setFluxPrompt] = useState('')
  const [generatingFlux, setGeneratingFlux] = useState(false)
  const [fluxError, setFluxError] = useState('')

  // Copy
  const [headline, setHeadline] = useState('')
  const [subtext, setSubtext] = useState('')
  const [copyTopic, setCopyTopic] = useState('')
  const [generatingCopy, setGeneratingCopy] = useState(false)

  // Platform-adapted copy
  const [platformCopy, setPlatformCopy] = useState<PlatformCopy | null>(null)
  const [adaptingCopy, setAdaptingCopy] = useState(false)
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null)

  // Generated cards
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([])
  const [generating, setGenerating] = useState(false)

  // Approve state
  const [approved, setApproved] = useState(false)

  // Pre-fill from calendar
  useEffect(() => {
    if (initialCaption) {
      const sentences = initialCaption.split(/[.!?]+/).filter(s => s.trim())
      if (sentences.length > 0) {
        const words = sentences[0].trim().split(/\s+/)
        setHeadline(words.slice(0, 8).join(' '))
        if (sentences.length > 1) {
          setSubtext(sentences.slice(1, 3).join('. ').trim())
        } else if (words.length > 8) {
          setSubtext(words.slice(8).join(' '))
        }
      }
      setCopyTopic(initialCaption.slice(0, 100))
    }
  }, [initialCaption])

  // Load creator profile
  useEffect(() => {
    if (!active) return
    setLoadingProfile(true)
    fetch(`/api/creator-profiles?workspace_id=${active.id}`)
      .then(r => r.json())
      .then((data: CreatorProfile | null) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setLoadingProfile(false))
  }, [active])

  // Fetch taken times for selected date — smart default time
  useEffect(() => {
    if (!active || !scheduledDate) return
    const supabase = createClient()
    supabase
      .from('posts')
      .select('scheduled_at')
      .eq('workspace_id', active.id)
      .is('deleted_at', null)
      .like('scheduled_at', `${scheduledDate}%`)
      .then(({ data }) => {
        const times = (data || [])
          .map((p: { scheduled_at: string | null }) => p.scheduled_at ? p.scheduled_at.slice(11, 16) : '')
          .filter(Boolean)
        setTakenTimes(times)

        // Smart default: pick next available clean hour
        const preferred = ['09:00', '12:00', '15:00', '18:00', '20:00', '10:00', '11:00', '13:00', '14:00', '16:00', '17:00', '19:00', '21:00', '08:00', '07:00']
        const available = preferred.find(t => !times.includes(t))
        setScheduledTime(available || '09:00')
        setTimeWarning('')
      })
  }, [active, scheduledDate])

  // Check for duplicate time when user changes time
  useEffect(() => {
    if (takenTimes.includes(scheduledTime)) {
      setTimeWarning(`Another post is already scheduled at ${scheduledTime} on this day. Pick a different time.`)
    } else {
      setTimeWarning('')
    }
  }, [scheduledTime, takenTimes])

  const adaptCopyForPlatforms = useCallback(async (caption: string, hashtags: string) => {
    if (!caption.trim() || adaptingCopy) return
    setAdaptingCopy(true)
    try {
      const res = await fetch('/api/cards/adapt-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          hashtags,
          creator_name: active?.name || '',
          niche: profile?.content_type || active?.niche || '',
          brand_voice: profile?.brand_voice || active?.creator_voice || '',
          platforms: Object.entries(selectedFormats)
            .filter(([, v]) => v)
            .map(([k]) => k),
        }),
      })
      if (res.ok) setPlatformCopy(await res.json())
    } catch (err) { console.error(err) }
    finally { setAdaptingCopy(false) }
  }, [active, profile, selectedFormats, adaptingCopy])

  useEffect(() => {
    if (initialCaption && active && !platformCopy && !adaptingCopy) {
      adaptCopyForPlatforms(initialCaption, initialHashtags || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCaption, active])

  async function searchUnsplash() {
    if (!searchQuery.trim() || searchingPhotos) return
    setSearchingPhotos(true)
    try {
      const res = await fetch(`/api/cards/unsplash?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) setPhotos(await res.json())
    } catch (err) { console.error(err) }
    finally { setSearchingPhotos(false) }
  }

  async function generateFluxImage() {
    if (!fluxPrompt.trim() || generatingFlux) return
    setGeneratingFlux(true)
    setFluxError('')
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fluxPrompt, platform: 'instagram', quality: 'premium' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFluxError(data.error || 'Image generation failed')
        return
      }
      if (data.url) {
        setBackgroundUrl(data.url)
      } else if (data.base64) {
        setBackgroundUrl(`data:image/png;base64,${data.base64}`)
      } else {
        setFluxError('No image returned from the API')
      }
    } catch (err) {
      setFluxError(err instanceof Error ? err.message : 'Network error — check your connection')
    } finally {
      setGeneratingFlux(false)
    }
  }

  async function generateCopy() {
    if (!copyTopic.trim() || generatingCopy) return
    setGeneratingCopy(true)
    try {
      const res = await fetch('/api/cards/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_name: active?.name || '',
          niche: profile?.content_type || active?.niche || '',
          brand_voice: profile?.brand_voice || active?.creator_voice || '',
          target_audience: profile?.target_audience || '',
          topic: copyTopic,
        }),
      })
      if (res.ok) {
        const data: { headline: string; subtext: string } = await res.json()
        setHeadline(data.headline)
        setSubtext(data.subtext)
      }
    } catch (err) { console.error(err) }
    finally { setGeneratingCopy(false) }
  }

  async function handleAdaptCopy() {
    adaptCopyForPlatforms(headline + '. ' + subtext, '')
  }

  async function generateAllCards() {
    const activeFormats = Object.entries(selectedFormats)
      .filter(([, v]) => v)
      .map(([k]) => k as CardFormat)

    if (activeFormats.length === 0 || !headline.trim()) return

    for (const card of generatedCards) {
      if (card.blobUrl) URL.revokeObjectURL(card.blobUrl)
    }

    setGenerating(true)
    setApproved(false)
    setGeneratedCards(activeFormats.map(f => ({ format: f, blobUrl: '', generating: true })))

    const isTextPost = mode === 'text-post'
    const basePayload = {
      backgroundUrl: (mode === 'text-only' || isTextPost) ? null : backgroundUrl,
      backgroundMode: isTextPost ? 'text-only' : mode,
      logoUrl: profile?.logo_url || '',
      showLogo: isTextPost ? false : showLogo,
      primaryColor: profile?.brand_primary_color || '#0D1117',
      secondaryColor: profile?.brand_secondary_color || '#FF4D2E',
      headline: isTextPost ? headline : headline,
      subtext: isTextPost
        ? (platformCopy
            ? Object.entries(platformCopy)
                .filter(([k]) => selectedFormats[k as CardFormat])
                .map(([, v]) => (v as { caption: string; hashtags: string }).hashtags)
                .filter(Boolean)[0] || subtext
            : subtext)
        : subtext,
      creatorName: active?.name || '',
    }

    await Promise.all(
      activeFormats.map(async (fmt) => {
        // For text-post, include hashtags in the subtext for that platform
        const payload = { ...basePayload, format: fmt }
        if (isTextPost && platformCopy) {
          const pc = platformCopy[fmt as keyof PlatformCopy]
          if (pc) {
            payload.headline = headline
            payload.subtext = pc.hashtags ? `${subtext}\n\n${pc.hashtags}` : subtext
          }
        }
        try {
          const res = await fetch('/api/cards/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!res.ok) throw new Error('Failed')
          const blob = await res.blob()
          const blobUrl = URL.createObjectURL(blob)
          setGeneratedCards(prev =>
            prev.map(c => c.format === fmt ? { ...c, blobUrl, generating: false } : c)
          )
        } catch {
          setGeneratedCards(prev =>
            prev.map(c => c.format === fmt ? { ...c, generating: false } : c)
          )
        }
      })
    )

    setGenerating(false)
  }

  async function approveToCalendar() {
    if (!active || approved) return

    const activeFormats = Object.entries(selectedFormats)
      .filter(([, v]) => v)
      .map(([k]) => k)

    const scheduledAt = `${scheduledDate}T${scheduledTime}:00`

    for (const platform of activeFormats) {
      const pc = platformCopy?.[platform as keyof PlatformCopy]
      const caption = pc?.caption || `${headline}. ${subtext}`
      const hashtagStr = pc?.hashtags || ''
      const hashtags = hashtagStr.split(/\s+/).filter((h: string) => h.startsWith('#'))

      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: active.id,
          platform,
          caption,
          hashtags,
          media_type: 'image',
          status: 'approved',
          scheduled_at: scheduledAt,
          ai_generated: true,
        }),
      })
    }

    setApproved(true)
  }

  function downloadCard(blobUrl: string, format: CardFormat) {
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `card-${format}-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function copyToClipboard(text: string, platform: string) {
    navigator.clipboard.writeText(text)
    setCopiedPlatform(platform)
    setTimeout(() => setCopiedPlatform(null), 1500)
  }

  const toggleFormat = (f: CardFormat) => {
    setSelectedFormats(prev => {
      const next = { ...prev, [f]: !prev[f] }
      // If we just selected this format and nothing was previewing, set it as preview
      if (next[f]) setPreviewFormat(f)
      // If we deselected the current preview format, switch to first selected
      if (!next[f] && previewFormat === f) {
        const firstSelected = (Object.entries(next) as [CardFormat, boolean][]).find(([, v]) => v)?.[0]
        if (firstSelected) setPreviewFormat(firstSelected)
      }
      return next
    })
  }

  const activeFormatCount = Object.values(selectedFormats).filter(Boolean).length
  const primaryColor = profile?.brand_primary_color || '#0D1117'
  const secondaryColor = profile?.brand_secondary_color || '#FF4D2E'
  const logoUrl = profile?.logo_url || ''
  const isTextPost = mode === 'text-post'

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', fontSize: 13,
    fontFamily: 'var(--studio-sans)', border: '1px solid var(--studio-border-light)',
    borderRadius: 8, outline: 'none', color: 'var(--studio-ink)', background: 'var(--studio-bg)',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)',
    marginBottom: 6, fontFamily: 'var(--studio-sans)', letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  }
  const sectionStyle: React.CSSProperties = {
    background: 'var(--studio-panel)', border: '1px solid var(--studio-border-light)',
    borderRadius: 12, padding: 20, marginBottom: 16,
  }

  if (!active) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--studio-ink-3)' }}>Select a client to create posts.</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
      style={{ padding: '32px 24px 64px' }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 400, color: 'var(--studio-ink)', letterSpacing: '-0.02em', marginBottom: 8 }}>
        New Post
      </h1>
      <p style={{ fontSize: 13, color: 'var(--studio-ink-3)', marginBottom: 28 }}>
        Create content for <strong style={{ color: 'var(--studio-ink)' }}>{active.name}</strong>
        {initialCaption && <span style={{ color: '#15803D' }}> — pre-filled from calendar</span>}
        {!profile && !loadingProfile && <span style={{ color: '#B45309' }}> — set up a creator profile for full branding</span>}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
        {/* Left: Controls */}
        <div>
          {/* Schedule date */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--studio-ink)' }}>Schedule</div>
              {takenTimes.length > 0 && (
                <span style={{ fontSize: 11, color: 'var(--studio-ink-3)' }}>
                  {takenTimes.length} post{takenTimes.length !== 1 ? 's' : ''} on this day
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Date</label>
                <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
                  style={inputStyle} />
              </div>
              <div style={{ width: 120 }}>
                <label style={labelStyle}>Time</label>
                <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)}
                  style={{
                    ...inputStyle,
                    borderColor: timeWarning ? '#DC2626' : undefined,
                  }} />
              </div>
            </div>
            {timeWarning && (
              <p style={{ fontSize: 12, color: '#DC2626', marginTop: 8 }}>
                {timeWarning}
              </p>
            )}
            {takenTimes.length > 0 && !timeWarning && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {takenTimes.sort().map((t) => (
                  <span key={t} style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 4,
                    background: '#F3F4F6', color: '#374151',
                  }}>
                    {t}
                  </span>
                ))}
                <span style={{ fontSize: 10, color: 'var(--studio-ink-4)', alignSelf: 'center' }}>taken</span>
              </div>
            )}
          </div>

          {/* Content type */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--studio-ink)', marginBottom: 12 }}>Content Type</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {MODE_OPTIONS.map(({ mode: m, label, icon: Icon, desc }) => (
                <button key={m} type="button"
                  onClick={() => { setMode(m); if (m !== 'upload') setBackgroundUrl(null); setPhotos([]) }}
                  style={{
                    padding: '12px 6px', borderRadius: 10, cursor: 'pointer',
                    border: `1.5px solid ${mode === m ? 'var(--studio-ink)' : 'var(--studio-border-light)'}`,
                    background: mode === m ? 'var(--studio-ink)' : 'var(--studio-panel)',
                    color: mode === m ? '#FFFFFF' : 'var(--studio-ink-2)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    fontFamily: 'var(--studio-sans)', transition: 'all 0.15s',
                  }}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  <span style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode-specific controls */}
          {mode === 'unsplash' && (
            <div style={sectionStyle}>
              <label style={labelStyle}>Search Unsplash</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUnsplash()}
                  placeholder="e.g. fitness, sunset, coffee" style={{ ...inputStyle, flex: 1 }} />
                <button type="button" onClick={searchUnsplash} disabled={searchingPhotos}
                  style={{
                    padding: '0 16px', borderRadius: 8, border: 'none', background: 'var(--studio-ink)',
                    color: '#FFFFFF', cursor: searchingPhotos ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600, fontFamily: 'var(--studio-sans)',
                  }}
                >
                  {searchingPhotos ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                </button>
              </div>
              {photos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12, maxHeight: 280, overflowY: 'auto' }}>
                  {photos.map((p) => (
                    <div key={p.id} onClick={() => setBackgroundUrl(p.url)}
                      style={{
                        height: 100, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', position: 'relative',
                        border: backgroundUrl === p.url ? '3px solid var(--studio-ink)' : '1px solid var(--studio-border-light)',
                      }}
                    >
                      <img src={p.thumb} alt={p.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2px 4px', fontSize: 8, color: '#FFF', background: 'rgba(0,0,0,0.5)' }}>
                        {p.photographer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === 'flux' && (
            <div style={sectionStyle}>
              <label style={labelStyle}>AI Image Prompt</label>
              <textarea value={fluxPrompt} onChange={(e) => setFluxPrompt(e.target.value)}
                placeholder="Describe the background image you want..." rows={3}
                style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }} />
              <button type="button" onClick={generateFluxImage} disabled={generatingFlux || !fluxPrompt.trim()}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: generatingFlux ? 'var(--studio-border-light)' : 'var(--studio-ink)',
                  color: generatingFlux ? 'var(--studio-ink-4)' : '#FFFFFF',
                  fontSize: 13, fontWeight: 600, cursor: generatingFlux ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--studio-sans)', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {generatingFlux ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><Sparkles size={14} /> Generate Image</>}
              </button>
              {fluxError && (
                <div style={{
                  marginTop: 10, padding: '10px 12px', borderRadius: 8,
                  background: '#FEF2F2', border: '1px solid #FECACA',
                  fontSize: 12, color: '#991B1B', lineHeight: 1.5,
                }}>
                  {fluxError}
                </div>
              )}
            </div>
          )}

          {mode === 'upload' && (
            <div style={sectionStyle}>
              <label style={labelStyle}>Upload Background Image</label>
              {backgroundUrl ? (
                <div>
                  <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--studio-border-light)', marginBottom: 8 }}>
                    <img src={backgroundUrl} alt="Uploaded background"
                      style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                  </div>
                  <button type="button" onClick={() => setBackgroundUrl(null)}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: '1px solid var(--studio-border-light)',
                      background: 'var(--studio-panel)', color: 'var(--studio-ink-3)',
                      fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--studio-sans)',
                    }}
                  >
                    Remove and upload a different image
                  </button>
                </div>
              ) : (
                <label
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--studio-ink)' }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--studio-border-light)' }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.style.borderColor = 'var(--studio-border-light)'
                    const file = e.dataTransfer.files[0]
                    if (file && file.type.startsWith('image/')) fileToDataUri(file).then(setBackgroundUrl)
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 8, padding: '32px 20px', borderRadius: 10,
                    border: '2px dashed var(--studio-border-light)', cursor: 'pointer',
                    color: 'var(--studio-ink-3)', transition: 'border-color 0.15s',
                  }}
                >
                  <Upload size={24} strokeWidth={1.5} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Drag and drop an image here</span>
                  <span style={{ fontSize: 11, color: 'var(--studio-ink-4)' }}>or click to browse — PNG, JPG, WebP</span>
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) fileToDataUri(file).then(setBackgroundUrl)
                    }}
                  />
                </label>
              )}
            </div>
          )}

          {/* Branding — hide for text-post (uses brand colours automatically) */}
          {!isTextPost && (
            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--studio-ink)' }}>Branding</div>
                {profile && <span style={{ fontSize: 11, color: '#15803D' }}>Loaded from profile</span>}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 8, border: '1px solid var(--studio-border-light)', marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'contain' }} />
                  ) : (
                    <div style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--studio-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--studio-ink-4)' }}>?</div>
                  )}
                  <span style={{ fontSize: 13, color: 'var(--studio-ink-2)' }}>{logoUrl ? 'Show logo on card' : 'No logo uploaded'}</span>
                </div>
                {logoUrl && (
                  <button type="button" onClick={() => setShowLogo(prev => !prev)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                      border: `1px solid ${showLogo ? 'var(--studio-ink)' : 'var(--studio-border-light)'}`,
                      background: showLogo ? 'var(--studio-ink)' : 'var(--studio-panel)',
                      color: showLogo ? '#FFFFFF' : 'var(--studio-ink-3)', fontSize: 11, fontWeight: 500, fontFamily: 'var(--studio-sans)',
                    }}
                  >
                    {showLogo ? <Eye size={12} /> : <EyeOff size={12} />}
                    {showLogo ? 'On' : 'Off'}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: primaryColor, border: '1px solid var(--studio-border-light)' }} />
                  <span style={{ fontSize: 11, color: 'var(--studio-ink-3)', fontFamily: 'monospace' }}>{primaryColor}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: secondaryColor, border: '1px solid var(--studio-border-light)' }} />
                  <span style={{ fontSize: 11, color: 'var(--studio-ink-3)', fontFamily: 'monospace' }}>{secondaryColor}</span>
                </div>
              </div>
            </div>
          )}

          {/* Copy */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--studio-ink)' }}>
                {isTextPost ? 'Post Copy' : 'Card Copy'}
              </div>
              {initialCaption && <span style={{ fontSize: 11, color: '#15803D' }}>Pre-filled</span>}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Generate with AI</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={copyTopic} onChange={(e) => setCopyTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && generateCopy()}
                  placeholder="Topic: e.g. new workout program" style={{ ...inputStyle, flex: 1 }} />
                <button type="button" onClick={generateCopy} disabled={generatingCopy || !copyTopic.trim()}
                  style={{
                    padding: '0 14px', borderRadius: 8, border: 'none',
                    background: generatingCopy ? 'var(--studio-border-light)' : 'var(--studio-ink)',
                    color: '#FFFFFF', cursor: generatingCopy ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', fontFamily: 'var(--studio-sans)',
                  }}
                >
                  {generatingCopy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Headline</label>
              <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Bold headline text" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{isTextPost ? 'Body text' : 'Subtext'}</label>
              <textarea value={subtext} onChange={(e) => setSubtext(e.target.value)}
                placeholder={isTextPost ? 'Full post copy — this will appear on the card with hashtags' : 'Supporting message'}
                rows={isTextPost ? 4 : 1}
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>

          {/* Platforms */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--studio-ink)' }}>Platforms</div>
              <span style={{ fontSize: 11, color: 'var(--studio-ink-4)' }}>{activeFormatCount} selected</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {PLATFORM_OPTIONS.map(({ format: f, label, size, color }) => {
                const isActive = selectedFormats[f]
                return (
                  <button key={f} type="button" onClick={() => toggleFormat(f)}
                    style={{
                      padding: '12px', borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${isActive ? color.text : 'var(--studio-border-light)'}`,
                      background: isActive ? color.bg : 'var(--studio-panel)',
                      color: isActive ? color.text : 'var(--studio-ink-3)',
                      display: 'flex', alignItems: 'center', gap: 10,
                      fontFamily: 'var(--studio-sans)', transition: 'all 0.15s', textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      border: `1.5px solid ${isActive ? color.text : 'var(--studio-ink-4)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isActive ? color.text : 'transparent',
                    }}>
                      {isActive && <Check size={11} strokeWidth={3} color="#FFFFFF" />}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1 }}>{size}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Platform captions */}
          {(platformCopy || adaptingCopy) && (
            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--studio-ink)' }}>Platform Captions</div>
                {!adaptingCopy && (
                  <button type="button" onClick={handleAdaptCopy}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--studio-sans)' }}
                  >
                    <RefreshCw size={11} /> Regenerate
                  </button>
                )}
              </div>
              {adaptingCopy ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Loader2 size={16} className="animate-spin" style={{ color: 'var(--studio-ink-3)' }} />
                  <p style={{ fontSize: 12, color: 'var(--studio-ink-3)', marginTop: 8 }}>Adapting copy for each platform...</p>
                </div>
              ) : platformCopy && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {PLATFORM_OPTIONS.filter(p => selectedFormats[p.format]).map(({ format: f, label, color }) => {
                    const copy = platformCopy[f as keyof PlatformCopy]
                    if (!copy) return null
                    const fullText = copy.hashtags ? `${copy.caption}\n\n${copy.hashtags}` : copy.caption
                    return (
                      <div key={f} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${color.bg}`, background: color.bg + '40' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: color.text }}>{label}</span>
                          <button type="button" onClick={() => copyToClipboard(fullText, f)}
                            style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: copiedPlatform === f ? '#15803D' : 'var(--studio-ink-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--studio-sans)' }}
                          >
                            {copiedPlatform === f ? <Check size={10} /> : <Copy size={10} />}
                            {copiedPlatform === f ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--studio-ink-2)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{copy.caption}</p>
                        {copy.hashtags && <p style={{ fontSize: 11, color: 'var(--studio-ink-3)', marginTop: 4 }}>{copy.hashtags}</p>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {!platformCopy && !adaptingCopy && headline && activeFormatCount > 0 && (
            <div style={sectionStyle}>
              <button type="button" onClick={handleAdaptCopy} disabled={adaptingCopy}
                style={{
                  width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--studio-border-light)',
                  background: 'var(--studio-panel)', color: 'var(--studio-ink)', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'var(--studio-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Sparkles size={14} /> Generate Platform Captions
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <motion.button type="button" onClick={generateAllCards}
              disabled={generating || !headline.trim() || activeFormatCount === 0}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 10, border: 'none',
                background: generating || !headline.trim() || activeFormatCount === 0 ? 'var(--studio-border-light)' : 'var(--studio-ink)',
                color: generating || !headline.trim() || activeFormatCount === 0 ? 'var(--studio-ink-4)' : '#FFFFFF',
                fontSize: 14, fontWeight: 600,
                cursor: generating || !headline.trim() || activeFormatCount === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--studio-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              whileHover={!generating && headline.trim() && activeFormatCount > 0 ? { opacity: 0.9 } : undefined}
              whileTap={!generating && headline.trim() && activeFormatCount > 0 ? { scale: 0.98 } : undefined}
            >
              {generating
                ? <><Loader2 size={15} className="animate-spin" /> Generating {activeFormatCount} card{activeFormatCount !== 1 ? 's' : ''}...</>
                : <><Sparkles size={15} /> Generate {activeFormatCount} Card{activeFormatCount !== 1 ? 's' : ''}</>}
            </motion.button>

            {/* Approve to calendar */}
            {generatedCards.length > 0 && generatedCards.some(c => c.blobUrl) && (
              <motion.button type="button" onClick={approveToCalendar}
                disabled={approved || !!timeWarning}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 10,
                  border: approved ? 'none' : timeWarning ? 'none' : '1.5px solid var(--studio-ink)',
                  background: approved ? '#15803D' : timeWarning ? 'var(--studio-border-light)' : 'var(--studio-panel)',
                  color: approved ? '#FFFFFF' : timeWarning ? 'var(--studio-ink-4)' : 'var(--studio-ink)',
                  fontSize: 14, fontWeight: 600,
                  cursor: approved ? 'default' : 'pointer',
                  fontFamily: 'var(--studio-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                whileHover={!approved ? { background: 'var(--studio-ink)', color: '#FFFFFF' } : undefined}
                whileTap={!approved ? { scale: 0.98 } : undefined}
              >
                {approved
                  ? <><Check size={15} /> Approved — saved to calendar</>
                  : <><CalendarCheck size={15} /> Approve &amp; Save to Calendar</>}
              </motion.button>
            )}
          </div>
        </div>

        {/* Right: Live preview + Generated cards */}
        <div style={{ position: 'sticky', top: 24 }}>
          {generatedCards.length === 0 && (() => {
            const activePlats = PLATFORM_OPTIONS.filter(p => selectedFormats[p.format])
            const currentPreview = activePlats.find(p => p.format === previewFormat) || activePlats[0]
            const previewAspect = currentPreview ? CARD_ASPECT[currentPreview.format] : CARD_ASPECT.instagram
            const previewLabel = currentPreview ? currentPreview.size : '1080 × 1350'
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Live Preview
                  </div>
                </div>
                {/* Platform tabs for preview */}
                {activePlats.length > 1 && (
                  <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                    {activePlats.map(({ format: f, label, color }) => (
                      <button key={f} type="button" onClick={() => setPreviewFormat(f)}
                        style={{
                          padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                          border: `1px solid ${previewFormat === f ? color.text : 'var(--studio-border-light)'}`,
                          background: previewFormat === f ? color.bg : 'var(--studio-panel)',
                          color: previewFormat === f ? color.text : 'var(--studio-ink-3)',
                          fontSize: 10, fontWeight: 600, fontFamily: 'var(--studio-sans)',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                <CardPreview
                  mode={isTextPost ? 'text-only' : mode} backgroundUrl={backgroundUrl}
                  showLogo={isTextPost ? false : showLogo} logoUrl={logoUrl}
                  primaryColor={primaryColor} secondaryColor={secondaryColor}
                  headline={headline} subtext={subtext} creatorName={active?.name || 'Creator'}
                  aspectRatio={previewAspect}
                />
                <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, color: 'var(--studio-ink-4)' }}>
                  {previewLabel} preview
                </div>
              </>
            )
          })()}

          {generatedCards.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {generatedCards.map((card) => {
                const platform = PLATFORM_OPTIONS.find(p => p.format === card.format)
                if (!platform) return null
                return (
                  <div key={card.format}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                        background: platform.color.bg, color: platform.color.text,
                      }}>
                        {platform.label}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--studio-ink-4)' }}>{platform.size}</span>
                    </div>

                    {card.generating ? (
                      <div style={{
                        width: '100%', aspectRatio: String(CARD_ASPECT[card.format]),
                        borderRadius: 12, border: '1px solid var(--studio-border-light)',
                        background: 'var(--studio-panel)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}>
                        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--studio-ink-3)' }} />
                        <span style={{ fontSize: 12, color: 'var(--studio-ink-3)' }}>Generating...</span>
                      </div>
                    ) : card.blobUrl ? (
                      <div>
                        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--studio-border-light)' }}>
                          <img src={card.blobUrl} alt={`${platform.label} card`} style={{ width: '100%', display: 'block' }} />
                        </div>
                        <motion.button type="button" onClick={() => downloadCard(card.blobUrl, card.format)}
                          style={{
                            width: '100%', marginTop: 8, padding: '10px 0', borderRadius: 8,
                            border: '1px solid var(--studio-border-light)',
                            background: 'var(--studio-panel)', color: 'var(--studio-ink)',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--studio-sans)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}
                          whileHover={{ background: 'var(--studio-ink)', color: '#FFFFFF' }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Download size={13} /> Download PNG
                        </motion.button>
                      </div>
                    ) : (
                      <div style={{
                        width: '100%', aspectRatio: String(CARD_ASPECT[card.format]),
                        borderRadius: 12, border: '1px solid var(--studio-border-light)',
                        background: 'var(--studio-panel)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: 12, color: '#DC2626' }}>Failed to generate</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function CardPreview({ mode, backgroundUrl, showLogo, logoUrl, primaryColor, secondaryColor, headline, subtext, creatorName, aspectRatio }: {
  mode: CardMode; backgroundUrl: string | null; showLogo: boolean; logoUrl: string
  primaryColor: string; secondaryColor: string; headline: string; subtext: string; creatorName: string; aspectRatio: number
}) {
  return (
    <div style={{
      width: '100%', aspectRatio: String(aspectRatio), borderRadius: 12, overflow: 'hidden',
      position: 'relative', border: '1px solid var(--studio-border-light)',
      background: mode === 'text-only'
        ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
        : backgroundUrl ? undefined : primaryColor,
    }}>
      {mode !== 'text-only' && backgroundUrl && (
        <img src={backgroundUrl} alt="Background"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {mode !== 'text-only' && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,17,23,0.92) 0%, rgba(13,17,23,0.6) 35%, rgba(13,17,23,0.15) 60%, rgba(13,17,23,0.05) 100%)' }} />
      )}
      {showLogo && logoUrl && (
        <img src={logoUrl} alt="Logo"
          style={{ position: 'absolute', top: '5%', left: '5%', width: '12%', height: '12%', objectFit: 'contain', zIndex: 2 }} />
      )}
      {/* Text overlay — only show if there's actual copy typed, or if mode needs a placeholder */}
      {(headline || subtext || (!backgroundUrl && mode === 'text-only')) ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '7%', zIndex: 2 }}>
          {headline ? (
            <div style={{
              fontSize: 'clamp(16px, 4vw, 24px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginBottom: 6,
              textShadow: mode !== 'text-only' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}>{headline}</div>
          ) : !backgroundUrl ? (
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginBottom: 6 }}>Your headline here...</div>
          ) : null}
          {subtext && (
            <div style={{
              fontSize: 'clamp(10px, 2vw, 13px)', fontWeight: 400, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, marginBottom: 12,
              textShadow: mode !== 'text-only' ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              fontFamily: "'Inter', system-ui, sans-serif", whiteSpace: 'pre-wrap',
            }}>{subtext}</div>
          )}
          {(headline || subtext) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 10, borderTop: `2px solid ${secondaryColor}` }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: secondaryColor }} />
              <div style={{ fontSize: 9, fontWeight: 600, color: secondaryColor, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Inter', system-ui, sans-serif" }}>
                {creatorName}
              </div>
            </div>
          )}
        </div>
      ) : null}
      {/* Empty state hint — only when no background and no text */}
      {mode !== 'text-only' && !backgroundUrl && !headline && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--studio-ink-4)', fontSize: 13 }}>
          {mode === 'unsplash' ? 'Search for a photo' : mode === 'upload' ? 'Upload an image' : 'Generate an AI image'}
        </div>
      )}
    </div>
  )
}
