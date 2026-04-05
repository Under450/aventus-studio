'use client'

import { MessageSquare } from 'lucide-react'

export default function RepliesPage() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', padding: '32px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: 'var(--studio-sidebar)', border: '1px solid var(--studio-border-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <MessageSquare size={24} color="var(--studio-ink-3)" />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 400, color: 'var(--studio-ink)', letterSpacing: '-0.02em', marginBottom: 8 }}>
        Replies
      </h1>
      <p style={{ fontSize: 14, color: 'var(--studio-ink-3)', maxWidth: 360, lineHeight: 1.6 }}>
        Monitor and respond to comments across all your platforms. Coming soon.
      </p>
    </div>
  )
}
