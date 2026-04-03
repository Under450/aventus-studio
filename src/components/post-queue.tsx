'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useWorkspace } from '@/hooks/use-workspace'
import { usePosts } from '@/hooks/use-posts'
import { PostCard } from '@/components/post-card'
import type { PostWithMedia } from '@/types/database'

// --- helpers ---

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10)
}

function formatDayHeader(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
}

function groupByDay(posts: PostWithMedia[]): Map<string, PostWithMedia[]> {
  const map = new Map<string, PostWithMedia[]>()
  for (const post of posts) {
    const key = post.scheduled_at ? dayKey(post.scheduled_at) : 'unscheduled'
    const group = map.get(key) ?? []
    group.push(post)
    map.set(key, group)
  }
  return map
}

// --- animation variants ---

const listItem = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

// --- component ---

export function PostQueue() {
  const { active, loading: wsLoading } = useWorkspace()
  const { posts, loading, updatePost, deletePost, regeneratePost } = usePosts(active?.id)

  const grouped = useMemo(() => groupByDay(posts), [posts])
  const sortedKeys = useMemo(
    () =>
      Array.from(grouped.keys()).sort((a, b) => {
        if (a === 'unscheduled') return 1
        if (b === 'unscheduled') return -1
        return a.localeCompare(b)
      }),
    [grouped],
  )

  if (wsLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="px-6 py-6">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 -mx-6 flex items-center justify-between bg-[#F9FAFB] px-6 pb-4">
        <h1 className="text-xl font-semibold text-[#111827]">Queue</h1>
        <span className="text-xs font-medium text-[#6B7280]">
          {posts.length} {posts.length === 1 ? 'post' : 'posts'}
        </span>
      </div>

      {/* Empty state */}
      {posts.length === 0 && (
        <div className="py-24 text-center">
          <p className="text-sm text-[#6B7280]">
            No posts yet.{' '}
            <a href="/generate" className="text-[#1D4ED8] underline">
              Generate your first week.
            </a>
          </p>
        </div>
      )}

      {/* Day groups */}
      <motion.div
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      >
        {sortedKeys.map((key) => {
          const dayPosts = grouped.get(key)!
          return (
            <motion.div key={key} variants={listItem}>
              {/* Day header */}
              <div className="mb-2 flex items-center gap-3">
                <span className="text-sm font-semibold text-[#111827]">
                  {key === 'unscheduled' ? 'Unscheduled' : formatDayHeader(key)}
                </span>
                <div className="h-px flex-1 bg-[#E5E7EB]" />
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {dayPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onApprove={() => updatePost(post.id, { status: 'approved' })}
                    onReject={() => updatePost(post.id, { status: 'draft' })}
                    onRegenerate={() => regeneratePost(post.id)}
                    onDelete={() => deletePost(post.id)}
                  />
                ))}
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
