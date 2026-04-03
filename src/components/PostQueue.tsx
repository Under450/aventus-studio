import { motion } from 'framer-motion'
import { Clock, Pencil, MoreHorizontal } from 'lucide-react'

type Platform = 'Instagram' | 'TikTok' | 'YouTube'
type Status = 'Scheduled' | 'Draft'

interface Post {
  time: string
  platform: Platform
  caption: string
  status: Status
}

const platformBadge: Record<Platform, { bg: string; color: string }> = {
  Instagram: { bg: '#FDF2F8', color: '#9D174D' },
  TikTok:    { bg: '#ECFDF5', color: '#065F46' },
  YouTube:   { bg: '#FEF2F2', color: '#991B1B' },
}

const statusBadge: Record<Status, { bg: string; color: string; icon: typeof Clock }> = {
  Scheduled: { bg: '#F0FDF4', color: '#15803D', icon: Clock },
  Draft:     { bg: '#F3F4F6', color: '#6B7280', icon: Pencil },
}

const days: { label: string; date: string; posts: Post[] }[] = [
  {
    label: 'Today',
    date: 'Thu 3 Apr',
    posts: [
      { time: '09:00', platform: 'Instagram', caption: 'Morning routine that changed everything — 5 habits I swear by', status: 'Scheduled' },
      { time: '12:30', platform: 'TikTok', caption: 'POV: You finally automated your content workflow', status: 'Scheduled' },
      { time: '17:00', platform: 'YouTube', caption: 'How I grew from 0 to 100K followers in 6 months — full breakdown', status: 'Draft' },
    ],
  },
  {
    label: 'Tomorrow',
    date: 'Fri 4 Apr',
    posts: [
      { time: '08:00', platform: 'Instagram', caption: 'The one tool every creator needs in 2026 (not what you think)', status: 'Scheduled' },
      { time: '14:00', platform: 'TikTok', caption: 'Replying to @user — here is my exact posting schedule', status: 'Scheduled' },
    ],
  },
  {
    label: 'Saturday',
    date: 'Sat 5 Apr',
    posts: [
      { time: '10:00', platform: 'YouTube', caption: 'Weekly vlog: Studio setup tour and new gear review', status: 'Draft' },
      { time: '13:00', platform: 'Instagram', caption: 'Carousel: 7 caption formulas that drive engagement every time', status: 'Scheduled' },
      { time: '18:00', platform: 'TikTok', caption: 'This editing trick saves me 3 hours a week', status: 'Scheduled' },
    ],
  },
  {
    label: 'Sunday',
    date: 'Sun 6 Apr',
    posts: [
      { time: '09:30', platform: 'Instagram', caption: 'Behind the scenes of our latest brand collaboration', status: 'Draft' },
      { time: '16:00', platform: 'YouTube', caption: 'Q&A: Answering your top 10 questions about content creation', status: 'Scheduled' },
    ],
  },
]

const card = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.2 },
  }),
}

export function PostQueue() {
  let idx = 0

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#F9FAFB',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #F3F4F6',
          padding: '0 40px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>Queue</h1>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>11 posts this week</span>
        </div>
        <span style={{ fontSize: 13, color: '#9CA3AF' }}>3 Apr 2026</span>
      </div>

      {/* Stats */}
      <div style={{ padding: '32px 40px 0', display: 'flex', gap: 16 }}>
        {[
          { label: 'Scheduled', value: '8', color: '#15803D', bg: '#F0FDF4' },
          { label: 'Drafts', value: '3', color: '#B45309', bg: '#FFFBEB' },
          { label: 'This week', value: '11', color: '#1D4ED8', bg: '#EFF6FF' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              background: '#FFFFFF',
              border: '1px solid #F3F4F6',
              borderRadius: 12,
              padding: '24px 28px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8 }}>
              {s.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 36, fontWeight: 600, color: '#111827', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {s.value}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: s.color,
                  background: s.bg,
                  padding: '2px 8px',
                  borderRadius: 100,
                }}
              >
                posts
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Post list */}
      <div style={{ padding: '32px 40px 48px' }}>
        {days.map((day) => (
          <div key={day.label} style={{ marginBottom: 32 }}>
            {/* Day header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{day.label}</span>
              <span style={{ fontSize: 13, color: '#9CA3AF' }}>{day.date}</span>
              <div style={{ flex: 1, height: 1, background: '#F3F4F6', marginLeft: 8 }} />
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {day.posts.map((post) => {
                const pBadge = platformBadge[post.platform]
                const sBadge = statusBadge[post.status]
                const SIcon = sBadge.icon
                const i = idx++

                return (
                  <motion.div
                    key={`${day.label}-${post.time}-${post.platform}`}
                    custom={i}
                    initial="hidden"
                    animate="show"
                    variants={card}
                    whileHover={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)', y: -1 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      background: '#FFFFFF',
                      border: '1px solid #F3F4F6',
                      borderRadius: 12,
                      padding: '16px 20px',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Time */}
                    <span
                      style={{
                        width: 48,
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#111827',
                        fontVariantNumeric: 'tabular-nums',
                        flexShrink: 0,
                      }}
                    >
                      {post.time}
                    </span>

                    {/* Platform */}
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: pBadge.color,
                        background: pBadge.bg,
                        padding: '4px 10px',
                        borderRadius: 6,
                        flexShrink: 0,
                      }}
                    >
                      {post.platform}
                    </span>

                    {/* Caption */}
                    <span
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: '#374151',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' as const,
                        minWidth: 0,
                      }}
                    >
                      {post.caption}
                    </span>

                    {/* Status */}
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        fontWeight: 500,
                        color: sBadge.color,
                        background: sBadge.bg,
                        padding: '4px 10px',
                        borderRadius: 100,
                        flexShrink: 0,
                      }}
                    >
                      <SIcon size={12} strokeWidth={2} />
                      {post.status}
                    </span>

                    {/* More */}
                    <motion.div
                      style={{ opacity: 0, flexShrink: 0, display: 'flex' }}
                      whileHover={{ opacity: 1 }}
                    >
                      <MoreHorizontal size={16} color="#9CA3AF" />
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
