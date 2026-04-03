'use client'

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Workspace } from '@/types/database'

const STORAGE_KEY = 'aventus_active_workspace'

export interface WorkspaceContextValue {
  workspaces: Workspace[]
  active: Workspace | null
  setActive: (ws: Workspace) => void
  reload: () => Promise<void>
  loading: boolean
}

export const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaces: [],
  active: null,
  setActive: () => {},
  reload: async () => {},
  loading: true,
})

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [active, setActiveState] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('workspaces')
      .select('*')
      .is('deleted_at', null)
      .order('created_at')

    const list: Workspace[] = (data as Workspace[] | null) ?? []
    setWorkspaces(list)

    // Restore active from localStorage or default to first
    const storedId =
      typeof window !== 'undefined'
        ? localStorage.getItem(STORAGE_KEY)
        : null
    const restored = list.find((w) => w.id === storedId)
    setActiveState(restored ?? list[0] ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchWorkspaces()
  }, [fetchWorkspaces])

  const setActive = useCallback((ws: Workspace) => {
    setActiveState(ws)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, ws.id)
    }
  }, [])

  return (
    <WorkspaceContext.Provider
      value={{ workspaces, active, setActive, reload: fetchWorkspaces, loading }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
