'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutList,
  Sparkles,
  Calendar,
  BarChart3,
  MessageSquare,
  Settings,
  Plus,
} from 'lucide-react'
import { useWorkspace } from '@/hooks/use-workspace'

const navItems = [
  { label: 'Queue', href: '/queue', icon: LayoutList },
  { label: 'Generate', href: '/generate', icon: Sparkles },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Replies', href: '/replies', icon: MessageSquare },
  { label: 'Settings', href: '/settings', icon: Settings },
]

const fade = (i: number) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.03, duration: 0.2 },
})

export function Sidebar() {
  const pathname = usePathname()
  const { workspaces, active, setActive } = useWorkspace()

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        borderRight: '0.5px solid #E5E7EB',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Brand */}
      <motion.div style={{ padding: '24px 20px 16px' }} {...fade(0)}>
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
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#111827',
                lineHeight: 1,
              }}
            >
              Aventus
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
              Creator Studio
            </div>
          </div>
        </div>
      </motion.div>

      {/* Workspace switcher */}
      {workspaces.length > 0 && (
        <motion.div
          style={{ padding: '0 12px 8px' }}
          {...fade(1)}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '0 8px 8px',
            }}
          >
            Workspaces
          </div>
          {workspaces.map((ws) => {
            const isWsActive = ws.id === active?.id
            return (
              <div
                key={ws.id}
                onClick={() => setActive(ws)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isWsActive ? 500 : 400,
                  color: isWsActive ? '#111827' : '#6B7280',
                  background: isWsActive ? '#F3F4F6' : 'transparent',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isWsActive ? '#22C55E' : '#D1D5DB',
                    flexShrink: 0,
                  }}
                />
                {ws.name}
              </div>
            )
          })}
        </motion.div>
      )}

      {/* Navigation */}
      <nav style={{ padding: '8px 12px', flex: 1 }}>
        {navItems.map((item, i) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.label}
              href={item.href}
              style={{ textDecoration: 'none' }}
            >
              <motion.div
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
                {...fade(i + 2)}
              >
                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                {item.label}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Generate Week button */}
      <div style={{ padding: '0 12px 16px' }}>
        <Link href="/generate" style={{ textDecoration: 'none' }}>
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
            Generate Week
          </motion.button>
        </Link>
      </div>
    </aside>
  )
}
