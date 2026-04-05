'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWorkspace } from '@/hooks/use-workspace'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/types/database'
import { BarChart3, FileText, Clock, CheckCircle } from 'lucide-react'

const PLATFORM_COLOURS: Record<string, { bg: string; text: string }> = {
  instagram: { bg: '#FCE7F3', text: '#9D174D' },
  tiktok: { bg: '#ECFDF5', text: '#065F46' },
  youtube: { bg: '#FEF2F2', text: '#991B1B' },
  linkedin: { bg: '#EFF6FF', text: '#1E40AF' },
  x: { bg: '#EFF6FF', text: '#1D4ED8' },
}

export default function AnalyticsPage() {
  const { active } = useWorkspace()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    if (!active) { setPosts([]); setLoading(false); return }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('workspace_id', active.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    setPosts((data as Post[] | null) ?? [])
    setLoading(false)
  }, [active])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  // Stats
  const now = new Date()
  const thisMonth = posts.filter((p) => {
    const d = new Date(p.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const byPlatform: Record<string, number> = {}
  const byStatus: Record<string, number> = {}
  for (const p of posts) {
    byPlatform[p.platform] = (byPlatform[p.platform] || 0) + 1
    byStatus[p.status] = (byStatus[p.status] || 0) + 1
  }

  const recentPosts = posts.slice(0, 5)

  const cardStyle: React.CSSProperties = {
    background: 'var(--studio-panel)',
    border: '1px solid var(--studio-border-light)',
    borderRadius: 10,
    padding: 20,
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 400, color: 'var(--studio-ink)', letterSpacing: '-0.02em', marginBottom: 24 }}>
        Analytics
      </h1>

      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--studio-ink-3)' }}>Loading...</p>
      ) : !active ? (
        <p style={{ fontSize: 13, color: 'var(--studio-ink-3)' }}>Select a company/creator to view analytics.</p>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <FileText size={14} color="var(--studio-ink-3)" />
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Total posts
                </span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--studio-ink)' }}>{posts.length}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <BarChart3 size={14} color="var(--studio-ink-3)" />
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  This month
                </span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--studio-ink)' }}>{thisMonth.length}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <CheckCircle size={14} color="var(--studio-ink-3)" />
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--studio-ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Published
                </span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--studio-ink)' }}>{byStatus['published'] || 0}</div>
            </div>
          </div>

          {/* By platform */}
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 500, color: 'var(--studio-ink)', marginBottom: 12, fontFamily: 'var(--studio-sans)' }}>
              Posts by platform
            </h2>
            {Object.keys(byPlatform).length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--studio-ink-3)' }}>No posts yet.</p>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(byPlatform).map(([platform, count]) => {
                  const c = PLATFORM_COLOURS[platform] || { bg: '#F3F4F6', text: '#374151' }
                  return (
                    <div
                      key={platform}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 14px', borderRadius: 8,
                        background: c.bg, border: `1px solid ${c.text}20`,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{platform}</span>
                      <span style={{ fontSize: 18, fontWeight: 600, color: c.text }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* By status */}
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 500, color: 'var(--studio-ink)', marginBottom: 12, fontFamily: 'var(--studio-sans)' }}>
              Posts by status
            </h2>
            {Object.keys(byStatus).length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--studio-ink-3)' }}>No posts yet.</p>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(byStatus).map(([status, count]) => (
                  <div
                    key={status}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 14px', borderRadius: 8,
                      background: 'var(--studio-sidebar)', border: '1px solid var(--studio-border-light)',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--studio-ink-2)' }}>{status}</span>
                    <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--studio-ink)' }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent posts */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: 13, fontWeight: 500, color: 'var(--studio-ink)', marginBottom: 12, fontFamily: 'var(--studio-sans)' }}>
              Recent posts
            </h2>
            {recentPosts.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--studio-ink-3)' }}>No posts yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentPosts.map((post) => {
                  const c = PLATFORM_COLOURS[post.platform] || { bg: '#F3F4F6', text: '#374151' }
                  return (
                    <div
                      key={post.id}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '10px 0',
                        borderBottom: '1px solid var(--studio-border-light)',
                      }}
                    >
                      <span style={{
                        fontSize: 10, fontWeight: 500, padding: '2px 6px',
                        borderRadius: 4, background: c.bg, color: c.text, flexShrink: 0,
                      }}>
                        {post.platform}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 13, color: 'var(--studio-ink-2)', lineHeight: 1.4,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {post.caption || 'No caption'}
                        </p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <span style={{ fontSize: 11, color: 'var(--studio-ink-4)' }}>
                            {post.status}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--studio-ink-4)' }}>
                            <Clock size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
