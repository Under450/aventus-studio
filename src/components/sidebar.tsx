'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Calendar,
  BarChart3,
  MessageSquare,
  UserPlus,
  CreditCard,
  Plus,
} from 'lucide-react'
import { useWorkspace } from '@/hooks/use-workspace'

const navItems = [
  { label: 'Calendar', href: '/', icon: Calendar },
  { label: 'Cards', href: '/cards', icon: CreditCard },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Replies', href: '/replies', icon: MessageSquare },
  { label: 'New Creator', href: '/new-creator', icon: UserPlus },
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
        background: 'var(--studio-sidebar)',
        borderRight: '1px solid var(--studio-border-light)',
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
              background: 'var(--studio-ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 600,
              color: '#FFFFFF',
            }}
          >
            CJ
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--studio-ink)',
                lineHeight: 1,
              }}
            >
              CJ Client Socials
            </div>
          </div>
        </div>
      </motion.div>

      {/* New Post button */}
      <div style={{ padding: '0 12px 12px' }}>
        <Link href="/cards" style={{ textDecoration: 'none' }}>
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
              background: 'var(--studio-accent)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            whileHover={{ opacity: 0.9 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={15} strokeWidth={2} />
            New Post
          </motion.button>
        </Link>
      </div>

      {/* Client switcher */}
      {workspaces.length > 0 && (
        <motion.div
          style={{ padding: '0 12px 8px' }}
          {...fade(1)}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--studio-ink-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '0 8px 8px',
            }}
          >
            CLIENTS
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
                  color: isWsActive ? 'var(--studio-ink)' : 'var(--studio-ink-3)',
                  background: isWsActive ? 'var(--studio-panel)' : 'transparent',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isWsActive ? '#22C55E' : 'var(--studio-border-light)',
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
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)
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
                  color: isActive ? '#FFFFFF' : 'var(--studio-ink-2)',
                  background: isActive ? 'var(--studio-ink)' : 'transparent',
                  marginBottom: 2,
                }}
                whileHover={{ background: isActive ? 'var(--studio-ink)' : 'var(--studio-border-light)' }}
                {...fade(i + 2)}
              >
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2 : 1.5}
                  color={isActive ? '#FFFFFF' : 'var(--studio-ink-3)'}
                />
                {item.label}
              </motion.div>
            </Link>
          )
        })}
      </nav>

    </aside>
  )
}
