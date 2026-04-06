'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, X, Check, Loader2 } from 'lucide-react'
import { useWorkspace } from '@/hooks/use-workspace'
import type { CreatorProfile } from '@/types/creator'

const PLATFORM_OPTIONS = ['Instagram', 'TikTok', 'X', 'Reddit'] as const

export function NewCreatorPage() {
  const { workspaces, active, reload } = useWorkspace()

  // Form state
  const [workspaceId, setWorkspaceId] = useState('')
  const [creatorName, setCreatorName] = useState('')
  const [ofHandle, setOfHandle] = useState('')
  const [contentType, setContentType] = useState('')
  const [brandVoice, setBrandVoice] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [platforms, setPlatforms] = useState<Record<string, boolean>>({
    Instagram: false,
    TikTok: false,
    X: false,
    Reddit: false,
  })
  const [primaryColor, setPrimaryColor] = useState('#0f0f0d')
  const [secondaryColor, setSecondaryColor] = useState('#faf8f5')
  const [logoUrl, setLogoUrl] = useState('')
  const [moodBoardUrls, setMoodBoardUrls] = useState<string[]>([])

  // UI state
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingMood, setUploadingMood] = useState(false)

  // Load existing profile when workspace changes
  useEffect(() => {
    if (!active) return
    setWorkspaceId(active.id)
    setCreatorName(active.name)
    loadProfile(active.id)
  }, [active])

  async function loadProfile(wsId: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/creator-profiles?workspace_id=${wsId}`)
      const data: CreatorProfile | null = await res.json()
      if (data) {
        setOfHandle(data.onlyfans_handle || '')
        setContentType(data.content_type || '')
        setBrandVoice(data.brand_voice || '')
        setTargetAudience(data.target_audience || '')
        setPrimaryColor(data.brand_primary_color || '#0f0f0d')
        setSecondaryColor(data.brand_secondary_color || '#faf8f5')
        setLogoUrl(data.logo_url || '')
        setMoodBoardUrls(data.mood_board_urls || [])
        const plats: Record<string, boolean> = {
          Instagram: false, TikTok: false, X: false, Reddit: false,
        }
        for (const p of data.platforms) {
          if (p in plats) plats[p] = true
        }
        setPlatforms(plats)
      } else {
        // Reset form for new profile
        setOfHandle('')
        setContentType('')
        setBrandVoice('')
        setTargetAudience('')
        setPrimaryColor('#0f0f0d')
        setSecondaryColor('#faf8f5')
        setLogoUrl('')
        setMoodBoardUrls([])
        setPlatforms({ Instagram: false, TikTok: false, X: false, Reddit: false })
      }
    } catch {
      // Profile doesn't exist yet
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(file: File, type: 'logo' | 'mood_board') {
    if (type === 'logo') setUploadingLogo(true)
    else setUploadingMood(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('workspace_id', workspaceId)
      formData.append('type', type)

      const res = await fetch('/api/creator-profiles/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()

      if (type === 'logo') {
        setLogoUrl(url)
      } else {
        if (moodBoardUrls.length < 5) {
          setMoodBoardUrls(prev => [...prev, url])
        }
      }
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      if (type === 'logo') setUploadingLogo(false)
      else setUploadingMood(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceId || saving) return
    setSaving(true)
    setSaved(false)

    try {
      // Update workspace name if changed
      if (creatorName.trim() && active && creatorName.trim() !== active.name) {
        await fetch(`/api/workspaces/${workspaceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: creatorName.trim() }),
        })
      }

      // Save creator profile
      const selectedPlatforms = Object.entries(platforms)
        .filter(([, v]) => v)
        .map(([k]) => k)

      await fetch('/api/creator-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          onlyfans_handle: ofHandle.trim(),
          content_type: contentType.trim(),
          brand_voice: brandVoice.trim(),
          target_audience: targetAudience.trim(),
          platforms: selectedPlatforms,
          brand_primary_color: primaryColor,
          brand_secondary_color: secondaryColor,
          logo_url: logoUrl,
          mood_board_urls: moodBoardUrls,
        }),
      })

      await reload()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const togglePlatform = (p: string) => {
    setPlatforms(prev => ({ ...prev, [p]: !prev[p] }))
  }

  const removeMoodImage = (idx: number) => {
    setMoodBoardUrls(prev => prev.filter((_, i) => i !== idx))
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: 13,
    fontFamily: 'var(--studio-sans)',
    border: '1px solid var(--studio-border-light)',
    borderRadius: 8,
    outline: 'none',
    color: 'var(--studio-ink)',
    background: 'var(--studio-bg)',
    transition: 'border-color 0.15s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--studio-ink-3)',
    marginBottom: 6,
    fontFamily: 'var(--studio-sans)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  }

  const sectionStyle: React.CSSProperties = {
    background: 'var(--studio-panel)',
    border: '1px solid var(--studio-border-light)',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  }

  if (!active && workspaces.length === 0) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--studio-ink-3)' }}>
          Create a company/creator first in the sidebar to get started.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px 64px' }}
    >
      <h1 style={{
        fontSize: 24, fontWeight: 400, color: 'var(--studio-ink)',
        letterSpacing: '-0.02em', marginBottom: 8,
      }}>
        Creator Profile
      </h1>
      <p style={{ fontSize: 13, color: 'var(--studio-ink-3)', marginBottom: 28 }}>
        Set up branding for <strong style={{ color: 'var(--studio-ink)' }}>{active?.name}</strong> — used for card generation.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--studio-ink-3)' }} />
        </div>
      ) : (
        <form onSubmit={handleSave}>
          {/* Basic info */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--studio-ink)', marginBottom: 16 }}>
              Basic Info
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Creator Name *</label>
                <input
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="Creator name"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>OnlyFans Handle</label>
                <input
                  type="text"
                  value={ofHandle}
                  onChange={(e) => setOfHandle(e.target.value)}
                  placeholder="@handle"
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Niche / Content Type</label>
              <input
                type="text"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                placeholder="e.g. Fitness, Lifestyle, Gaming"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Voice & audience */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--studio-ink)', marginBottom: 16 }}>
              Voice & Audience
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Brand Voice / Tone</label>
              <textarea
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                placeholder="e.g. Playful and confident, uses slang, never formal"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Target Audience</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Men 18-35 interested in fitness"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Platforms */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--studio-ink)', marginBottom: 16 }}>
              Platforms
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {PLATFORM_OPTIONS.map((p) => (
                <label
                  key={p}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${platforms[p] ? 'var(--studio-ink)' : 'var(--studio-border-light)'}`,
                    background: platforms[p] ? 'var(--studio-ink)' : 'var(--studio-panel)',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={platforms[p]}
                    onChange={() => togglePlatform(p)}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: 16, height: 16, borderRadius: 4,
                    border: `1.5px solid ${platforms[p] ? '#FFFFFF' : 'var(--studio-ink-4)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: platforms[p] ? 'transparent' : 'transparent',
                  }}>
                    {platforms[p] && <Check size={11} strokeWidth={3} color="#FFFFFF" />}
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 500,
                    color: platforms[p] ? '#FFFFFF' : 'var(--studio-ink-2)',
                  }}>
                    {p}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Brand colours */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--studio-ink)', marginBottom: 16 }}>
              Brand Colours
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Primary Colour</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{
                      width: 44, height: 44, border: '1px solid var(--studio-border-light)',
                      borderRadius: 8, cursor: 'pointer', padding: 2,
                    }}
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', fontSize: 12 }}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Secondary Colour</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    style={{
                      width: 44, height: 44, border: '1px solid var(--studio-border-light)',
                      borderRadius: 8, cursor: 'pointer', padding: 2,
                    }}
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', fontSize: 12 }}
                  />
                </div>
              </div>
            </div>
            {/* Preview swatch */}
            <div style={{
              marginTop: 12, display: 'flex', gap: 8, alignItems: 'center',
            }}>
              <div style={{
                width: 80, height: 40, borderRadius: 6,
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                border: '1px solid var(--studio-border-light)',
              }} />
              <span style={{ fontSize: 11, color: 'var(--studio-ink-3)' }}>Gradient preview</span>
            </div>
          </div>

          {/* Logo upload */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--studio-ink)', marginBottom: 16 }}>
              Logo
            </div>
            {logoUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src={logoUrl}
                  alt="Logo"
                  style={{
                    width: 64, height: 64, borderRadius: 8, objectFit: 'contain',
                    border: '1px solid var(--studio-border-light)', background: 'var(--studio-bg)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '6px 12px', fontSize: 12, fontWeight: 500,
                    background: 'none', border: '1px solid var(--studio-border-light)',
                    borderRadius: 6, cursor: 'pointer', color: 'var(--studio-ink-3)',
                    fontFamily: 'var(--studio-sans)',
                  }}
                >
                  <X size={12} /> Remove
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: 24, borderRadius: 8,
                  border: '2px dashed var(--studio-border-light)', cursor: 'pointer',
                  color: 'var(--studio-ink-3)', fontSize: 13,
                  transition: 'border-color 0.15s',
                }}
              >
                {uploadingLogo ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Upload size={20} />
                )}
                <span>{uploadingLogo ? 'Uploading...' : 'Click to upload logo'}</span>
                <span style={{ fontSize: 11, color: 'var(--studio-ink-4)' }}>PNG, JPG, SVG — max 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleUpload(f, 'logo')
                  }}
                />
              </label>
            )}
          </div>

          {/* Mood board */}
          <div style={sectionStyle}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--studio-ink)' }}>
                Mood Board
              </div>
              <span style={{ fontSize: 11, color: 'var(--studio-ink-4)' }}>
                {moodBoardUrls.length}/5 images
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {moodBoardUrls.map((url, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden' }}>
                  <img
                    src={url}
                    alt={`Mood ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeMoodImage(i)}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      width: 22, height: 22, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.6)', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={12} color="#FFFFFF" />
                  </button>
                </div>
              ))}
              {moodBoardUrls.length < 5 && (
                <label
                  style={{
                    aspectRatio: '1', borderRadius: 8,
                    border: '2px dashed var(--studio-border-light)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 4, cursor: 'pointer', color: 'var(--studio-ink-4)',
                    fontSize: 11, transition: 'border-color 0.15s',
                  }}
                >
                  {uploadingMood ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  <span>Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleUpload(f, 'mood_board')
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Save button */}
          <motion.button
            type="submit"
            disabled={saving || !creatorName.trim()}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 10, border: 'none',
              background: saved ? '#15803D' : saving ? 'var(--studio-border-light)' : 'var(--studio-ink)',
              color: saving ? 'var(--studio-ink-4)' : '#FFFFFF',
              fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--studio-sans)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s',
            }}
            whileHover={!saving ? { opacity: 0.9 } : undefined}
            whileTap={!saving ? { scale: 0.98 } : undefined}
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check size={15} />
                Saved
              </>
            ) : (
              'Save Creator Profile'
            )}
          </motion.button>
        </form>
      )}
    </motion.div>
  )
}
