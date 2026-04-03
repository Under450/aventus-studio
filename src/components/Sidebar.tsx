import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutList,
  Calendar,
  BarChart3,
  FolderOpen,
  Settings,
  Plus,
  Sparkles,
  ChevronDown,
} from 'lucide-react'

const navItems = [
  { label: 'Queue', icon: LayoutList },
  { label: 'Calendar', icon: Calendar },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Content', icon: FolderOpen },
  { label: 'AI Studio', icon: Sparkles },
  { label: 'Settings', icon: Settings },
]

const fade = (i: number) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.03, duration: 0.2 },
})

export function Sidebar() {
  const [active, setActive] = useState('Queue')

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        borderRight: '1px solid #F3F4F6',
      }}
    >
      {/* Brand */}
      <motion.div
        style={{ padding: '24px 20px 20px' }}
        {...fade(0)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#111827',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 600,
              color: '#FFFFFF',
            }}
          >
            A
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', lineHeight: 1 }}>
              Aventus
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Creator Studio</div>
          </div>
          <ChevronDown size={14} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
        </div>
      </motion.div>

      {/* Nav */}
      <nav style={{ padding: '0 12px', flex: 1 }}>
        {navItems.map((item, i) => {
          const Icon = item.icon
          const isActive = item.label === active
          return (
            <motion.div
              key={item.label}
              onClick={() => setActive(item.label)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? '#111827' : '#6B7280',
                background: isActive ? '#F3F4F6' : 'transparent',
                marginBottom: 2,
              }}
              whileHover={{ background: isActive ? '#F3F4F6' : '#F9FAFB' }}
              {...fade(i + 1)}
            >
              <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
              {item.label}
            </motion.div>
          )
        })}
      </nav>

      {/* Platforms */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 12 }}>
          Connected
        </div>
        {[
          { name: 'Instagram', handle: '@aventus', color: '#E4405F' },
          { name: 'TikTok', handle: '@aventus', color: '#111827' },
          { name: 'YouTube', handle: 'Aventus', color: '#FF0000' },
        ].map((p) => (
          <div
            key={p.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 0',
              fontSize: 13,
              color: '#374151',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#22C55E',
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: 400 }}>{p.name}</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>{p.handle}</span>
          </div>
        ))}
      </div>

      {/* New Post */}
      <div style={{ padding: '0 12px 16px' }}>
        <motion.button
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '10px 0',
            borderRadius: 8,
            border: 'none',
            background: '#111827',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
          whileHover={{ background: '#1F2937' }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={15} strokeWidth={2} />
          New Post
        </motion.button>
      </div>
    </aside>
  )
}
