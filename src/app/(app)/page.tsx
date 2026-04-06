'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Hash, Plus, Clock } from 'lucide-react'
import { MonthCalendar } from '@/components/month-calendar'
import { useWorkspace } from '@/hooks/use-workspace'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/types/database'

const PLATFORM_COLOURS: Record<string, { bg: string; text: string }> = {
  instagram: { bg: '#FCE7F3', text: '#9D174D' },
  tiktok: { bg: '#ECFDF5', text: '#065F46' },
  youtube: { bg: '#FEF2F2', text: '#991B1B' },
  linkedin: { bg: '#EFF6FF', text: '#1E40AF' },
  x: { bg: '#EFF6FF', text: '#1D4ED8' },
  reddit: { bg: '#FFF7ED', text: '#C2410C' },
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

function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function HomePage() {
  const { active } = useWorkspace()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    if (!active) { setPosts([]); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('workspace_id', active.id)
      .is('deleted_at', null)
    setPosts((data as Post[] | null) ?? [])
  }, [active])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const dayPosts = useMemo(() => {
    if (!selectedDate) return []
    return posts
      .filter((p) => p.scheduled_at?.startsWith(selectedDate))
      .sort((a, b) => (a.scheduled_at || '').localeCompare(b.scheduled_at || ''))
  }, [posts, selectedDate])

  const handleSelectDay = (date: string) => {
    // Check if this day has posts
    const hasPosts = posts.some((p) => p.scheduled_at?.startsWith(date))
    if (hasPosts) {
      setSelectedDate(date)
    } else {
      // Empty day — go straight to New Post
      router.push(`/cards?date=${date}`)
    }
  }

  // Day detail view — shows existing posts + add another
  if (selectedDate) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px 24px', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <motion.button
            onClick={() => setSelectedDate(null)}
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
              {formatDate(selectedDate)}
            </h1>
            <p style={{ fontSize: 12, color: 'var(--studio-ink-3)', marginTop: 2 }}>
              {dayPosts.length} post{dayPosts.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>
        </div>

        {/* Existing posts grouped by time */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {dayPosts.map((post) => {
            const pc = PLATFORM_COLOURS[post.platform] || { bg: '#F3F4F6', text: '#374151' }
            return (
              <div key={post.id} style={{
                padding: '14px 16px', borderRadius: 10,
                border: '0.5px solid var(--studio-border-light)',
                background: 'var(--studio-panel)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px',
                    borderRadius: 4, background: pc.bg, color: pc.text,
                  }}>
                    {post.platform}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 4,
                    background: post.status === 'published' ? '#F0FDF4' : post.status === 'approved' ? '#EFF6FF' : '#F3F4F6',
                    color: post.status === 'published' ? '#15803D' : post.status === 'approved' ? '#1D4ED8' : '#374151',
                  }}>
                    {post.status}
                  </span>
                  {post.scheduled_at && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                      <Clock size={11} color="var(--studio-ink-4)" />
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--studio-ink-2)' }}>
                        {formatTime(post.scheduled_at)}
                      </span>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'var(--studio-ink-2)', lineHeight: 1.6 }}>
                  {post.caption ? (post.caption.length > 120 ? post.caption.slice(0, 120) + '...' : post.caption) : 'No caption'}
                </p>
                {post.hashtags && post.hashtags.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
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

        {/* Add another post */}
        <motion.button
          onClick={() => router.push(`/cards?date=${selectedDate}`)}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 10,
            border: '1.5px solid var(--studio-ink)',
            background: 'var(--studio-panel)', color: 'var(--studio-ink)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--studio-sans)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          whileHover={{ background: 'var(--studio-ink)', color: '#FFFFFF' }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={15} /> Add Another Post
        </motion.button>
      </motion.div>
    )
  }

  return (
    <MonthCalendar
      posts={posts}
      onSelectDay={handleSelectDay}
      onSelectWeek={() => {}}
      selectedDate={null}
    />
  )
}
