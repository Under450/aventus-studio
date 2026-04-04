'use client';

import { useEffect, useState, useRef } from 'react';
import { Image, PenLine, CalendarDays, MessageSquare, ChevronDown, Settings2 } from 'lucide-react';
import type { PanelId } from '../types';
import { useApp } from '../App';

const NAV_ITEMS: { id: PanelId; label: string; icon: typeof Image; hint: string }[] = [
  { id: 'create-image', label: 'Create Image', icon: Image, hint: 'Design & import' },
  { id: 'create-post', label: 'Create Post', icon: PenLine, hint: 'Caption & hashtags' },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays, hint: 'Plan & schedule' },
  { id: 'engagement', label: 'Engagement', icon: MessageSquare, hint: 'Draft replies' },
];

interface SidebarProps {
  activePanel: PanelId;
  onNavigate: (panel: PanelId) => void;
}

export function Sidebar({ activePanel, onNavigate }: SidebarProps) {
  const { accounts, activeAccount, setActiveAccount, openAccountManager } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col"
      style={{
        width: 220,
        backgroundColor: 'var(--studio-sidebar)',
        borderRight: '1px solid var(--studio-sidebar-border)',
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-baseline gap-1.5">
          <span
            style={{
              fontFamily: 'var(--studio-serif)',
              fontSize: '1.35rem',
              fontWeight: 400,
              color: 'var(--studio-ink)',
              letterSpacing: '-0.02em',
            }}
          >
            Studio
          </span>
          <span style={{ fontSize: '13px', color: 'var(--studio-ink-4)', lineHeight: 1 }}>↗</span>
        </div>
      </div>

      {/* Account switcher */}
      <div className="px-3 mb-5" ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(o => !o)}
          style={{
            width: '100%',
            padding: '9px 12px',
            backgroundColor: 'var(--studio-panel)',
            border: '1px solid var(--studio-border)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            textAlign: 'left' as const,
          }}
        >
          {/* Company initial badge */}
          <div style={{
            width: 22, height: 22, borderRadius: 5, flexShrink: 0,
            backgroundColor: 'var(--studio-ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 700, color: '#fff',
          }}>
            {activeAccount ? activeAccount.name.charAt(0).toUpperCase() : '?'}
          </div>
          <span style={{
            flex: 1, fontSize: '12px', fontWeight: 500,
            color: activeAccount ? 'var(--studio-ink)' : 'var(--studio-ink-4)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
          }}>
            {activeAccount?.name ?? 'No company'}
          </span>
          <ChevronDown size={12} color="var(--studio-ink-3)" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 12, right: 12,
            marginTop: 4,
            backgroundColor: 'var(--studio-panel)',
            border: '1px solid var(--studio-border)',
            borderRadius: 9,
            overflow: 'hidden',
            zIndex: 50,
            boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
          }}>
            {accounts.length === 0 && (
              <p style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--studio-ink-4)' }}>
                No company/creator yet
              </p>
            )}
            {accounts.map(account => {
              const isActive = activeAccount?.id === account.id;
              return (
                <button
                  key={account.id}
                  onClick={() => { setActiveAccount(account); setDropdownOpen(false); }}
                  style={{
                    width: '100%', textAlign: 'left' as const,
                    padding: '9px 12px',
                    display: 'flex', alignItems: 'center', gap: 8,
                    backgroundColor: isActive ? 'var(--studio-bg)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--studio-border-light)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 4,
                    backgroundColor: isActive ? 'var(--studio-ink)' : 'var(--studio-border-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', fontWeight: 700,
                    color: isActive ? '#fff' : 'var(--studio-ink-3)',
                    flexShrink: 0,
                  }}>
                    {account.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--studio-ink)' : 'var(--studio-ink-2)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                  }}>
                    {account.name}
                  </span>
                </button>
              );
            })}
            {/* Manage link */}
            <button
              onClick={() => { openAccountManager(); setDropdownOpen(false); }}
              style={{
                width: '100%', textAlign: 'left' as const,
                padding: '9px 12px',
                display: 'flex', alignItems: 'center', gap: 8,
                backgroundColor: 'transparent', border: 'none',
                cursor: 'pointer',
              }}
            >
              <Settings2 size={12} color="var(--studio-ink-3)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--studio-ink-3)', fontWeight: 500 }}>
                Manage companies/creators…
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Section label */}
      <div className="px-6 mb-2">
        <span className="eyebrow">COMPANIES / CREATORS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3">
        {NAV_ITEMS.map(({ id, label, icon: Icon, hint }) => {
          const active = activePanel === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="w-full text-left mb-0.5 rounded-lg"
              style={{
                padding: '10px 12px',
                backgroundColor: active ? 'var(--studio-panel)' : 'transparent',
                border: active ? '1px solid var(--studio-border)' : '1px solid transparent',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 26, height: 26, borderRadius: 6,
                    backgroundColor: active ? 'var(--studio-ink)' : 'transparent',
                    border: active ? 'none' : '1px solid var(--studio-border-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.15s',
                  }}
                >
                  <Icon size={12} color={active ? '#ffffff' : 'var(--studio-ink-3)'} strokeWidth={active ? 2 : 1.5} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: active ? 600 : 400, color: active ? 'var(--studio-ink)' : '#888', lineHeight: 1.2 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '10px', color: active ? 'var(--studio-ink-3)' : 'var(--studio-ink-4)', marginTop: 1 }}>
                    {hint}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </nav>

    </aside>
  );
}
