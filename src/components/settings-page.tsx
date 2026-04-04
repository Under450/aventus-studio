'use client'

import { useState } from 'react'
import { useWorkspace } from '@/hooks/use-workspace'

export function SettingsPage() {
  const { workspaces, reload } = useWorkspace()
  const [name, setName] = useState('')
  const [niche, setNiche] = useState('')
  const [creatorVoice, setCreatorVoice] = useState('')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || creating) return
    setCreating(true)
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          niche: niche.trim() || undefined,
          creator_voice: creatorVoice.trim() || undefined,
        }),
      })
      if (res.ok) {
        setName('')
        setNiche('')
        setCreatorVoice('')
        await reload()
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string, wsName: string) {
    if (!confirm(`Delete "${wsName}"? Scheduled posts will be reverted to drafts.`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/workspaces/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await reload()
      }
    } finally {
      setDeletingId(null)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    border: '0.5px solid #E5E7EB',
    borderRadius: 6,
    outline: 'none',
    color: '#111827',
    background: '#FFFFFF',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  }

  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    border: '0.5px solid #E5E7EB',
    borderRadius: 12,
    padding: 20,
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 24 }}>
        Settings
      </h1>

      {/* New Workspace Form */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 500, color: '#111827', marginBottom: 16 }}>
          New Company/Creator
        </h2>
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Brand"
              required
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Niche</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. Fitness, Tech, Food"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Creator Voice</label>
            <input
              type="text"
              value={creatorVoice}
              onChange={(e) => setCreatorVoice(e.target.value)}
              placeholder="e.g. Casual and witty"
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            disabled={creating || !name.trim()}
            style={{
              padding: '8px 20px',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              background: creating ? '#9CA3AF' : '#111827',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              cursor: creating ? 'not-allowed' : 'pointer',
            }}
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>

      {/* Workspaces List */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 500, color: '#111827', marginBottom: 12 }}>
          Companies / Creators
        </h2>
        {workspaces.length === 0 && (
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>No companies or creators yet.</p>
        )}
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            style={{
              ...cardStyle,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                {ws.name}
              </div>
              {ws.niche && (
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  {ws.niche}
                </div>
              )}
            </div>
            <button
              onClick={() => handleDelete(ws.id, ws.name)}
              disabled={deletingId === ws.id}
              title="Delete company/creator"
              style={{
                background: 'none',
                border: 'none',
                cursor: deletingId === ws.id ? 'not-allowed' : 'pointer',
                padding: 6,
                color: deletingId === ws.id ? '#D1D5DB' : '#991B1B',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
