'use client'

import { useState } from 'react'
import { useWorkspace } from '@/hooks/use-workspace'
import { Pencil, Trash2, X, Check } from 'lucide-react'

export function SettingsPage() {
  const { workspaces, reload } = useWorkspace()
  const [name, setName] = useState('')
  const [niche, setNiche] = useState('')
  const [creatorVoice, setCreatorVoice] = useState('')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editNiche, setEditNiche] = useState('')
  const [editVoice, setEditVoice] = useState('')
  const [saving, setSaving] = useState(false)

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

  function startEdit(ws: { id: string; name: string; niche: string; creator_voice: string }) {
    setEditingId(ws.id)
    setEditName(ws.name)
    setEditNiche(ws.niche || '')
    setEditVoice(ws.creator_voice || '')
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          niche: editNiche.trim(),
          creator_voice: editVoice.trim(),
        }),
      })
      if (res.ok) {
        setEditingId(null)
        await reload()
      }
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: 13,
    fontFamily: 'var(--studio-sans)',
    border: '1px solid var(--studio-border-light)',
    borderRadius: 6,
    outline: 'none',
    color: 'var(--studio-ink)',
    background: 'var(--studio-panel)',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--studio-ink-3)',
    marginBottom: 4,
    fontFamily: 'var(--studio-sans)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--studio-panel)',
    border: '1px solid var(--studio-border-light)',
    borderRadius: 10,
    padding: 20,
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 400, color: 'var(--studio-ink)', letterSpacing: '-0.02em', marginBottom: 24 }}>
        Create New Company/Creator
      </h1>

      {/* New Company/Creator Form */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 500, color: 'var(--studio-ink)', marginBottom: 16, fontFamily: 'var(--studio-sans)' }}>
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
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--studio-sans)',
              background: creating ? 'var(--studio-border-light)' : 'var(--studio-ink)',
              color: creating ? 'var(--studio-ink-4)' : '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              cursor: creating ? 'not-allowed' : 'pointer',
            }}
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>

      {/* Companies / Creators List */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 500, color: 'var(--studio-ink)', marginBottom: 12, fontFamily: 'var(--studio-sans)' }}>
          Companies / Creators
        </h2>
        {workspaces.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--studio-ink-3)' }}>No companies or creators yet.</p>
        )}
        {workspaces.map((ws) => {
          const isEditing = editingId === ws.id

          if (isEditing) {
            return (
              <div key={ws.id} style={{ ...cardStyle, marginBottom: 8 }}>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Name *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Niche</label>
                  <input
                    type="text"
                    value={editNiche}
                    onChange={(e) => setEditNiche(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Creator Voice</label>
                  <input
                    type="text"
                    value={editVoice}
                    onChange={(e) => setEditVoice(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleSaveEdit(ws.id)}
                    disabled={saving || !editName.trim()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '6px 14px', fontSize: 12, fontWeight: 600,
                      fontFamily: 'var(--studio-sans)',
                      background: saving ? 'var(--studio-border-light)' : 'var(--studio-ink)',
                      color: '#FFFFFF', border: 'none', borderRadius: 6,
                      cursor: saving ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Check size={12} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '6px 14px', fontSize: 12, fontWeight: 500,
                      fontFamily: 'var(--studio-sans)',
                      background: 'none', color: 'var(--studio-ink-3)',
                      border: '1px solid var(--studio-border-light)', borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <X size={12} />
                    Cancel
                  </button>
                </div>
              </div>
            )
          }

          return (
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
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--studio-ink)' }}>
                  {ws.name}
                </div>
                {ws.niche && (
                  <div style={{ fontSize: 12, color: 'var(--studio-ink-3)', marginTop: 2 }}>
                    {ws.niche}
                  </div>
                )}
                {ws.creator_voice && (
                  <div style={{ fontSize: 11, color: 'var(--studio-ink-4)', marginTop: 2 }}>
                    Voice: {ws.creator_voice}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => startEdit(ws)}
                  title="Edit"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 6, color: 'var(--studio-ink-3)',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(ws.id, ws.name)}
                  disabled={deletingId === ws.id}
                  title="Delete"
                  style={{
                    background: 'none', border: 'none',
                    cursor: deletingId === ws.id ? 'not-allowed' : 'pointer',
                    padding: 6,
                    color: deletingId === ws.id ? 'var(--studio-border-light)' : '#991B1B',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
