'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, Sparkles } from 'lucide-react'
import { useWorkspace } from '@/hooks/use-workspace'

export function GenerateForm() {
  const { active, loading: wsLoading } = useWorkspace()
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (wsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!active) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-12 text-center">
        <p className="text-sm text-[#6B7280]">
          No company/creator found.{' '}
          <a href="/settings" className="text-[#1D4ED8] underline">
            Create one in Settings
          </a>{' '}
          to get started.
        </p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!active) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: active.id,
          topic: topic.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed (${res.status})`)
      }

      router.push('/queue')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[560px] px-6 py-12">
      <h1 className="text-xl font-semibold text-[#111827]">Generate</h1>
      <p className="mt-1 text-sm text-[#6B7280]">
        Create a week of content for <span className="font-medium text-[#111827]">{active.name}</span>
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="topic" className="block text-xs font-medium uppercase tracking-[0.06em] text-[#6B7280]">
            Topic (optional)
          </label>
          <input
            id="topic"
            type="text"
            maxLength={200}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. fitness trends, creator economy"
            className="mt-1.5 w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#1D4ED8] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
            style={{ borderWidth: '0.5px' }}
          />
          <p className="mt-1.5 text-xs text-[#9CA3AF]">
            Leave blank to use your default niche: <span className="italic">{active.niche}</span>
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-[#FEF2F2] px-3 py-2 text-sm text-[#991B1B]">
            {error}
          </div>
        )}

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          transition={{ duration: 0.15 }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#111827] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Week
            </>
          )}
        </motion.button>
      </form>
    </div>
  )
}
