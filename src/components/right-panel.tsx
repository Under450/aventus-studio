'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

const PLATFORMS = ['Instagram', 'LinkedIn', 'TikTok', 'X'] as const
const CONTENT_OPTIONS = [
  { id: 'copy', label: 'Copy & captions' },
  { id: 'hashtags', label: 'Hashtags' },
  { id: 'images', label: 'Images (FLUX Dev)' },
  { id: 'video', label: 'Video (Seedance)' },
] as const

export function RightPanel() {
  const [mode, setMode] = useState<'daily' | 'week'>('daily')
  const [platforms, setPlatforms] = useState<Record<string, boolean>>({
    Instagram: true,
    LinkedIn: true,
    TikTok: false,
    X: false,
  })
  const [content, setContent] = useState<Record<string, boolean>>({
    copy: true,
    hashtags: true,
    images: false,
    video: false,
  })

  const togglePlatform = (p: string) => setPlatforms((prev) => ({ ...prev, [p]: !prev[p] }))
  const toggleContent = (c: string) => setContent((prev) => ({ ...prev, [c]: !prev[c] }))

  return (
    <aside
      style={{
        width: 280,
        minWidth: 280,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--studio-panel)',
        borderLeft: '1px solid var(--studio-border-light)',
        position: 'sticky',
        top: 0,
        padding: '20px 16px',
        gap: 20,
      }}
    >
      {/* Mode toggle */}
      <div>
        <div style={{
          fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
        }}>
          Scope
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['daily', 'week'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 6,
                border: '1px solid var(--studio-border-light)',
                background: mode === m ? 'var(--studio-ink)' : 'var(--studio-panel)',
                color: mode === m ? '#FFFFFF' : 'var(--studio-ink-3)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--studio-sans)',
              }}
            >
              {m === 'daily' ? 'Daily' : 'Full week'}
            </button>
          ))}
        </div>
      </div>

      {/* Content checkboxes */}
      <div>
        <div style={{
          fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
        }}>
          Content
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CONTENT_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: 'var(--studio-ink-2)', cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={content[opt.id]}
                onChange={() => toggleContent(opt.id)}
                style={{ accentColor: 'var(--studio-ink)', width: 14, height: 14 }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Platform checkboxes */}
      <div>
        <div style={{
          fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
        }}>
          Platforms
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PLATFORMS.map((p) => (
            <label
              key={p}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: 'var(--studio-ink-2)', cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={platforms[p]}
                onChange={() => togglePlatform(p)}
                style={{ accentColor: 'var(--studio-ink)', width: 14, height: 14 }}
              />
              {p}
            </label>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Create posts button */}
      <motion.button
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '12px 0',
          borderRadius: 8,
          border: 'none',
          background: 'var(--studio-accent)',
          color: 'var(--studio-ink)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--studio-sans)',
        }}
        whileHover={{ opacity: 0.9 }}
        whileTap={{ scale: 0.98 }}
      >
        <Sparkles size={15} strokeWidth={2} />
        Create posts
      </motion.button>
    </aside>
  )
}
