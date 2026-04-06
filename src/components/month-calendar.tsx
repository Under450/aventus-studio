'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Post } from '@/types/database'

interface MonthCalendarProps {
  posts: Post[]
  onSelectDay: (date: string) => void
  onSelectWeek: (weekNumber: number, year: number, startDate: string) => void
  selectedDate: string | null
}

function getMonthData(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  const dayOfWeek = startDate.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  startDate.setDate(startDate.getDate() + diff)

  const weeks: { weekNumber: number; days: Date[] }[] = []
  const current = new Date(startDate)
  while (current <= lastDay || weeks.length < 5) {
    const week: Date[] = []
    const weekNum = getISOWeekNumber(current)
    for (let d = 0; d < 7; d++) {
      week.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    weeks.push({ weekNumber: weekNum, days: week })
    if (weeks.length >= 6) break
  }
  return { weeks, month, year }
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const PLATFORM_COLOURS: Record<string, { bg: string; text: string }> = {
  instagram: { bg: '#FCE7F3', text: '#9D174D' },
  tiktok: { bg: '#ECFDF5', text: '#065F46' },
  youtube: { bg: '#FEF2F2', text: '#991B1B' },
  linkedin: { bg: '#EFF6FF', text: '#1E40AF' },
  x: { bg: '#EFF6FF', text: '#1D4ED8' },
  reddit: { bg: '#FFF7ED', text: '#C2410C' },
}

const STATUS_COLOURS: Record<string, string> = {
  approved: '#1D4ED8',
  scheduled: '#1D4ED8',
  published: '#15803D',
  draft: '#B45309',
  failed: '#991B1B',
}

export function MonthCalendar({ posts, onSelectDay, onSelectWeek, selectedDate }: MonthCalendarProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const { weeks } = useMemo(() => getMonthData(viewYear, viewMonth), [viewYear, viewMonth])

  const postsByDate = useMemo(() => {
    const map: Record<string, Post[]> = {}
    for (const post of posts) {
      const date = post.scheduled_at?.slice(0, 10)
      if (date) {
        if (!map[date]) map[date] = []
        map[date].push(post)
      }
    }
    // Sort each day's posts by time
    for (const date in map) {
      map[date].sort((a, b) => (a.scheduled_at || '').localeCompare(b.scheduled_at || ''))
    }
    return map
  }, [posts])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  const todayStr = toDateString(today)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Month header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 400, color: 'var(--studio-ink)', letterSpacing: '-0.02em' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h1>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={prevMonth}
            style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--studio-border-light)', background: 'var(--studio-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--studio-ink-3)' }}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()) }}
            style={{ padding: '0 12px', height: 32, borderRadius: 6, border: '1px solid var(--studio-border-light)', background: 'var(--studio-panel)', fontSize: 12, fontWeight: 500, color: 'var(--studio-ink-3)', cursor: 'pointer', fontFamily: 'var(--studio-sans)' }}>
            Today
          </button>
          <button onClick={nextMonth}
            style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--studio-border-light)', background: 'var(--studio-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--studio-ink-3)' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)', padding: '0 24px', gap: 0 }}>
        <div />
        {DAY_HEADERS.map((d) => (
          <div key={d} style={{ fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0 8px 8px' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ flex: 1, padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)', flex: 1, gap: 2 }}>
            <motion.button
              onClick={() => onSelectWeek(week.weekNumber, viewYear, toDateString(week.days[0]))}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--studio-ink-3)', background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer' }}
              whileHover={{ background: 'var(--studio-border-light)' }}
            >
              W{week.weekNumber}
            </motion.button>

            {week.days.map((day) => {
              const dateStr = toDateString(day)
              const isCurrentMonth = day.getMonth() === viewMonth
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const dayPosts = postsByDate[dateStr] || []

              return (
                <motion.button
                  key={dateStr}
                  onClick={() => onSelectDay(dateStr)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    padding: 6, borderRadius: 8, cursor: 'pointer',
                    border: isSelected ? '1.5px solid var(--studio-ink)'
                      : isToday ? '1.5px solid var(--studio-border-light)'
                      : '0.5px solid var(--studio-border-light)',
                    background: 'var(--studio-panel)',
                    opacity: isCurrentMonth ? 1 : 0.35,
                    minHeight: 0, overflow: 'hidden',
                    boxShadow: isSelected ? '0 0 0 1px var(--studio-ink)' : 'none',
                    gap: 2,
                  }}
                  whileHover={{ background: 'var(--studio-sidebar)' }}
                >
                  {/* Day number */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%', marginBottom: 1 }}>
                    <span style={{
                      fontSize: 12, fontWeight: isToday ? 600 : 400,
                      color: isToday ? 'var(--studio-ink)' : isCurrentMonth ? 'var(--studio-ink)' : 'var(--studio-ink-4)',
                    }}>
                      {day.getDate()}
                    </span>
                    {isToday && (
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--studio-ink)', flexShrink: 0 }} />
                    )}
                    {dayPosts.length > 0 && (
                      <span style={{ fontSize: 9, color: 'var(--studio-ink-4)', marginLeft: 'auto' }}>
                        {dayPosts.length}
                      </span>
                    )}
                  </div>

                  {/* Post blocks — one per scheduled post */}
                  {dayPosts.slice(0, 3).map((post) => {
                    const pc = PLATFORM_COLOURS[post.platform] || { bg: '#F3F4F6', text: '#374151' }
                    const statusColor = STATUS_COLOURS[post.status] || '#374151'
                    return (
                      <div key={post.id} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 3,
                        padding: '1px 4px', borderRadius: 3,
                        background: pc.bg, fontSize: 8, lineHeight: '14px',
                        borderLeft: `2px solid ${statusColor}`,
                      }}>
                        <span style={{ color: pc.text, fontWeight: 600 }}>
                          {post.platform.slice(0, 2).toUpperCase()}
                        </span>
                        {post.scheduled_at && (
                          <span style={{ color: pc.text, opacity: 0.7 }}>
                            {formatTime(post.scheduled_at)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                  {dayPosts.length > 3 && (
                    <span style={{ fontSize: 8, color: 'var(--studio-ink-4)', paddingLeft: 4 }}>
                      +{dayPosts.length - 3} more
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
