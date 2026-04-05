'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'

interface WeekModalProps {
  weekNumber: number
  year: number
  startDate: string
  onClose: () => void
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export function WeekModal({ weekNumber, year, onClose }: WeekModalProps) {
  const [theme, setTheme] = useState('')
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({
    Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false, Sun: false,
  })

  const toggleDay = (d: string) =>
    setSelectedDays((prev) => ({ ...prev, [d]: !prev[d] }))

  const selectedCount = Object.values(selectedDays).filter(Boolean).length

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(15,15,13,0.35)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 51,
          width: 480,
          background: 'var(--studio-panel)',
          border: '1px solid var(--studio-border-light)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--studio-border-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{
              fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2,
            }}>
              Weekly generation
            </p>
            <h2 style={{ fontSize: 20, fontWeight: 400, color: 'var(--studio-ink)', letterSpacing: '-0.02em' }}>
              W{weekNumber} · {year}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: '1px solid var(--studio-border-light)',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--studio-ink-3)',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          {/* Theme */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              display: 'block', marginBottom: 8,
            }}>
              Weekly theme
            </label>
            <textarea
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Summer fitness tips, new product launch prep..."
              style={{
                width: '100%', minHeight: 80, padding: '10px 12px',
                borderRadius: 8, border: '1px solid var(--studio-border-light)',
                background: 'var(--studio-bg)', color: 'var(--studio-ink)',
                fontSize: 13, fontFamily: 'var(--studio-sans)',
                resize: 'vertical', outline: 'none',
              }}
            />
          </div>

          {/* Day selection */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              display: 'block', marginBottom: 8,
            }}>
              Days to include
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              {DAYS.map((d) => {
                const active = selectedDays[d]
                return (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 6,
                      border: active ? '1.5px solid var(--studio-ink)' : '1px solid var(--studio-border-light)',
                      background: active ? 'var(--studio-ink)' : 'var(--studio-panel)',
                      color: active ? '#FFFFFF' : 'var(--studio-ink-3)',
                      fontSize: 11, fontWeight: 500, cursor: 'pointer',
                      fontFamily: 'var(--studio-sans)',
                    }}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: 11, color: 'var(--studio-ink-4)', marginTop: 6 }}>
              {selectedCount} day{selectedCount !== 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Generate button */}
          <motion.button
            disabled={!theme.trim() || selectedCount === 0}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 8,
              border: 'none',
              background: !theme.trim() || selectedCount === 0 ? 'var(--studio-border-light)' : 'var(--studio-accent)',
              color: !theme.trim() || selectedCount === 0 ? 'var(--studio-ink-4)' : '#FFFFFF',
              fontSize: 13, fontWeight: 600,
              cursor: !theme.trim() || selectedCount === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--studio-sans)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            whileHover={theme.trim() && selectedCount > 0 ? { opacity: 0.9 } : {}}
            whileTap={theme.trim() && selectedCount > 0 ? { scale: 0.98 } : {}}
          >
            <Sparkles size={15} strokeWidth={2} />
            Generate {selectedCount} day{selectedCount !== 1 ? 's' : ''}
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}
