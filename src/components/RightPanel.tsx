import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'

/* ── Calendar ──────────────────────────────────────────────── */

const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const DAYS_WITH_POSTS = new Set([3, 4, 5, 6, 10, 14, 17, 21, 24, 28])
const TODAY = 3

function MiniCalendar() {
  const cells: { day: number; current: boolean }[] = []
  ;[30, 31].forEach((d) => cells.push({ day: d, current: false }))
  for (let d = 1; d <= 30; d++) cells.push({ day: d, current: true })
  ;[1, 2, 3].forEach((d) => cells.push({ day: d, current: false }))

  return (
    <div style={{ padding: '24px 24px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>April 2026</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {[ChevronLeft, ChevronRight].map((Icon, i) => (
            <motion.button
              key={i}
              style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                border: '1px solid #F3F4F6',
                background: '#FFFFFF',
                cursor: 'pointer',
              }}
              whileHover={{ background: '#F9FAFB' }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon size={14} color="#9CA3AF" />
            </motion.button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
        {DOW.map((d) => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 500,
              color: '#9CA3AF',
              padding: '0 0 8px',
            }}
          >
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          const isToday = cell.current && cell.day === TODAY
          const hasPost = cell.current && DAYS_WITH_POSTS.has(cell.day)
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 0',
                cursor: cell.current ? 'pointer' : 'default',
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: isToday ? 600 : 400,
                  background: isToday ? '#111827' : 'transparent',
                  color: isToday ? '#FFFFFF' : cell.current ? '#374151' : '#D1D5DB',
                }}
              >
                {cell.day}
              </span>
              {hasPost && !isToday && (
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#111827', marginTop: 2 }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── AI Caption ────────────────────────────────────────────── */

const TONES = ['Professional', 'Casual', 'Bold', 'Witty', 'Educational']

function AICaptions() {
  const [tone, setTone] = useState('Casual')

  return (
    <div style={{ padding: '20px 24px', borderTop: '1px solid #F3F4F6' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Sparkles size={15} color="#111827" strokeWidth={1.8} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>AI Captions</span>
      </div>

      <textarea
        placeholder="Describe your post..."
        rows={3}
        style={{
          width: '100%',
          resize: 'none',
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          padding: '12px 14px',
          fontSize: 13,
          color: '#374151',
          fontFamily: 'Inter, system-ui, sans-serif',
          outline: 'none',
          background: '#FFFFFF',
        }}
        onFocus={(e) => { e.target.style.borderColor = '#111827' }}
        onBlur={(e) => { e.target.style.borderColor = '#E5E7EB' }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {TONES.map((t) => (
          <motion.button
            key={t}
            onClick={() => setTone(t)}
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: 6,
              border: tone === t ? 'none' : '1px solid #E5E7EB',
              background: tone === t ? '#111827' : '#FFFFFF',
              color: tone === t ? '#FFFFFF' : '#6B7280',
              cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {t}
          </motion.button>
        ))}
      </div>

      <motion.button
        style={{
          width: '100%',
          marginTop: 14,
          padding: '10px 0',
          borderRadius: 8,
          border: 'none',
          background: '#111827',
          color: '#FFFFFF',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
        whileHover={{ background: '#1F2937' }}
        whileTap={{ scale: 0.98 }}
      >
        <Sparkles size={14} strokeWidth={2} />
        Generate
      </motion.button>
    </div>
  )
}

/* ── Upcoming ──────────────────────────────────────────────── */

const upcoming = [
  { time: '09:00', platform: 'Instagram', title: 'Morning routine — 5 habits', bg: '#FDF2F8', color: '#9D174D' },
  { time: '12:30', platform: 'TikTok', title: 'Automated content workflow', bg: '#ECFDF5', color: '#065F46' },
  { time: '17:00', platform: 'YouTube', title: '0 to 100K breakdown', bg: '#FEF2F2', color: '#991B1B' },
]

function Upcoming() {
  return (
    <div style={{ padding: '20px 24px', borderTop: '1px solid #F3F4F6' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Up Next</span>
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>Today</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {upcoming.map((item) => (
          <div
            key={item.time}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #F3F4F6',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#111827',
                fontVariantNumeric: 'tabular-nums',
                width: 40,
                flexShrink: 0,
              }}
            >
              {item.time}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: item.color,
                background: item.bg,
                padding: '3px 8px',
                borderRadius: 4,
                flexShrink: 0,
              }}
            >
              {item.platform}
            </span>
            <span
              style={{
                flex: 1,
                fontSize: 13,
                color: '#6B7280',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap' as const,
                minWidth: 0,
              }}
            >
              {item.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Accounts ──────────────────────────────────────────────── */

function Accounts() {
  return (
    <div style={{ padding: '20px 24px', borderTop: '1px solid #F3F4F6' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 14 }}>Accounts</div>
      {[
        { name: 'Instagram', followers: '24.8K' },
        { name: 'TikTok', followers: '112K' },
        { name: 'YouTube', followers: '8.2K' },
      ].map((a, i, arr) => (
        <div
          key={a.name}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
            <span style={{ fontSize: 13, color: '#374151' }}>{a.name}</span>
          </div>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{a.followers}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Panel ─────────────────────────────────────────────────── */

export function RightPanel() {
  return (
    <aside
      style={{
        width: 320,
        minWidth: 320,
        height: '100%',
        overflowY: 'auto',
        background: '#FFFFFF',
        borderLeft: '1px solid #F3F4F6',
      }}
    >
      <MiniCalendar />
      <AICaptions />
      <Upcoming />
      <Accounts />
    </aside>
  )
}
