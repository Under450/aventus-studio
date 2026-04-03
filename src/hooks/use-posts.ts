'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PostWithMedia, PostStatus } from '@/types/database'

export function usePosts(workspaceId: string | undefined, statusFilter?: PostStatus) {
  const [posts, setPosts] = useState<PostWithMedia[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    if (!workspaceId) {
      setPosts([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({ workspace_id: workspaceId })
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/posts?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch posts')

      const data = await res.json()
      setPosts(data.posts ?? data ?? [])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId, statusFilter])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const updatePost = useCallback(
    async (id: string, updates: Partial<PostWithMedia>) => {
      await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      await fetchPosts()
    },
    [fetchPosts],
  )

  const deletePost = useCallback(
    async (id: string) => {
      await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      await fetchPosts()
    },
    [fetchPosts],
  )

  const regeneratePost = useCallback(
    async (id: string) => {
      await fetch(`/api/posts/${id}/regenerate`, { method: 'POST' })
      await fetchPosts()
    },
    [fetchPosts],
  )

  return { posts, loading, reload: fetchPosts, updatePost, deletePost, regeneratePost }
}
