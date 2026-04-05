'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
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

  // Find the Monday on or before the first day
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
}

type DayStatus = 'empty' | 'draft' | 'sent'

function getDayStatus(dayPosts: Post[]): DayStatus {
  if (dayPosts.length === 0) return 'empty'
  if (dayPosts.every((p) => p.status === 'published')) return 'sent'
  return 'draft'
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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px 16px',
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 400, color: 'var(--studio-ink)', letterSpacing: '-0.02em' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h1>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={prevMonth}
            style={{
              width: 32, height: 32, borderRadius: 6,
              border: '1px solid var(--studio-border-light)', background: 'var(--studio-panel)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--studio-ink-3)',
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()) }}
            style={{
              padding: '0 12px', height: 32, borderRadius: 6,
              border: '1px solid var(--studio-border-light)', background: 'var(--studio-panel)',
              fontSize: 12, fontWeight: 500, color: 'var(--studio-ink-3)',
              cursor: 'pointer', fontFamily: 'var(--studio-sans)',
            }}
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            style={{
              width: 32, height: 32, borderRadius: 6,
              border: '1px solid var(--studio-border-light)', background: 'var(--studio-panel)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--studio-ink-3)',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '48px repeat(7, 1fr)',
        padding: '0 24px',
        gap: 0,
      }}>
        <div /> {/* Week number column header */}
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--studio-ink-4)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '0 0 8px 8px',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ flex: 1, padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {weeks.map((week, wi) => (
          <div
            key={wi}
            style={{
              display: 'grid',
              gridTemplateColumns: '48px repeat(7, 1fr)',
              flex: 1,
              gap: 2,
            }}
          >
            {/* Week number */}
            <motion.button
              onClick={() => onSelectWeek(week.weekNumber, viewYear, toDateString(week.days[0]))}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--studio-ink-3)',
                background: 'transparent',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
              whileHover={{ background: 'var(--studio-border-light)' }}
            >
              W{week.weekNumber}
            </motion.button>

            {/* Day cells */}
            {week.days.map((day) => {
              const dateStr = toDateString(day)
              const isCurrentMonth = day.getMonth() === viewMonth
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const dayPosts = postsByDate[dateStr] || []
              const status = getDayStatus(dayPosts)
              const platforms = [...new Set(dayPosts.map((p) => p.platform))]

              return (
                <motion.button
                  key={dateStr}
                  onClick={() => onSelectDay(dateStr)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: 8,
                    borderRadius: 8,
                    border: isSelected
                      ? '1.5px solid var(--studio-ink)'
                      : isToday
                        ? '1.5px solid var(--studio-border-light)'
                        : '0.5px solid var(--studio-border-light)',
                    background: isSelected ? 'var(--studio-panel)' : 'var(--studio-panel)',
                    cursor: 'pointer',
                    opacity: isCurrentMonth ? 1 : 0.35,
                    minHeight: 0,
                    overflow: 'hidden',
                    boxShadow: isSelected ? '0 0 0 1px var(--studio-ink)' : 'none',
                  }}
                  whileHover={{ background: 'var(--studio-sidebar)' }}
                >
                  {/* Day number + status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
                    <span style={{
                      fontSize: 13,
                      fontWeight: isToday ? 600 : 400,
                      color: isToday ? 'var(--studio-ink)' : isCurrentMonth ? 'var(--studio-ink)' : 'var(--studio-ink-4)',
                    }}>
                      {day.getDate()}
                    </span>
                    {isToday && (
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: 'var(--studio-ink)', flexShrink: 0,
                      }} />
                    )}
                    {status === 'draft' && (
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#FBBF24', flexShrink: 0, marginLeft: 'auto',
                      }} />
                    )}
                    {status === 'sent' && (
                      <Check
                        size={12}
                        color="#22C55E"
                        strokeWidth={2.5}
                        style={{ marginLeft: 'auto', flexShrink: 0 }}
                      />
                    )}
                  </div>

                  {/* Platform pills */}
                  {platforms.length > 0 && (
                    <div style={{ display: 'flex', gap: 2, marginTop: 4, flexWrap: 'wrap' }}>
                      {platforms.map((p) => {
                        const c = PLATFORM_COLOURS[p] || { bg: '#F3F4F6', text: '#374151' }
                        return (
                          <span
                            key={p}
                            style={{
                              fontSize: 9,
                              fontWeight: 500,
                              padding: '1px 4px',
                              borderRadius: 4,
                              background: c.bg,
                              color: c.text,
                              lineHeight: '14px',
                            }}
                          >
                            {p.slice(0, 2).toUpperCase()}
                          </span>
                        )
                      })}
                    </div>
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
