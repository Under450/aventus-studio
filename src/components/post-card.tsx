'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  Pencil,
  Check,
  X,
  RefreshCw,
  Trash2,
  Loader2,
} from 'lucide-react'
import type { PostWithMedia, PostStatus, Platform } from '@/types/database'

// --- colour maps ---

const platformColours: Record<Platform, { bg: string; text: string }> = {
  instagram: { bg: '#FCE7F3', text: '#9D174D' },
  tiktok: { bg: '#ECFDF5', text: '#065F46' },
  youtube: { bg: '#FEF2F2', text: '#991B1B' },
}

const statusColours: Record<PostStatus, { bg: string; text: string }> = {
  draft: { bg: '#F3F4F6', text: '#6B7280' },
  approved: { bg: '#EFF6FF', text: '#1D4ED8' },
  scheduled: { bg: '#F0FDF4', text: '#15803D' },
  publishing: { bg: '#FFFBEB', text: '#B45309' },
  published: { bg: '#F0FDF4', text: '#15803D' },
  failed: { bg: '#FEF2F2', text: '#991B1B' },
}

const StatusIcon: Record<PostStatus, typeof Pencil> = {
  draft: Pencil,
  approved: Check,
  scheduled: Clock,
  publishing: Loader2,
  published: Check,
  failed: X,
}

// --- helpers ---

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

// --- component ---

interface PostCardProps {
  post: PostWithMedia
  onApprove: () => void
  onReject: () => void
  onRegenerate: () => void
  onDelete: () => void
}

export function PostCard({ post, onApprove, onReject, onRegenerate, onDelete }: PostCardProps) {
  const [hovered, setHovered] = useState(false)

  const pColour = platformColours[post.platform]
  const sColour = statusColours[post.status]
  const Icon = StatusIcon[post.status]

  const media = post.post_media?.[0]
  const thumbnailUrl = media?.media_url
  const imageGenerating = media?.image_status === 'generating' || media?.image_status === 'pending'

  return (
    <motion.div
      className="relative flex items-start gap-4 rounded-xl bg-white p-4 pr-5"
      style={{ border: '0.5px solid #E5E7EB' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      transition={{ duration: 0.15 }}
    >
      {/* Thumbnail */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F3F4F6]">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : imageGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#9CA3AF]" />
        ) : (
          <Pencil className="h-4 w-4 text-[#9CA3AF]" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {post.scheduled_at && (
            <span className="text-xs text-[#6B7280]">
              {formatTime(post.scheduled_at)} &middot; {formatDate(post.scheduled_at)}
            </span>
          )}

          {/* Platform badge */}
          <span
            className="inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-medium capitalize"
            style={{ backgroundColor: pColour.bg, color: pColour.text }}
          >
            {post.platform}
          </span>
        </div>

        {/* Caption */}
        <p className="mt-1 line-clamp-2 text-sm text-[#111827]">
          {post.caption || 'No caption'}
        </p>
      </div>

      {/* Status badge */}
      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize"
          style={{ backgroundColor: sColour.bg, color: sColour.text }}
        >
          <Icon className={`h-3 w-3 ${post.status === 'publishing' ? 'animate-spin' : ''}`} />
          {post.status}
        </span>
      </div>

      {/* Hover actions — draft posts only */}
      {hovered && post.status === 'draft' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.12 }}
          className="absolute right-3 top-3 flex items-center gap-1"
        >
          <button
            onClick={onApprove}
            title="Approve"
            className="rounded-md p-1.5 text-[#15803D] hover:bg-[#F0FDF4]"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRegenerate}
            title="Regenerate"
            className="rounded-md p-1.5 text-[#1D4ED8] hover:bg-[#EFF6FF]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="rounded-md p-1.5 text-[#991B1B] hover:bg-[#FEF2F2]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
