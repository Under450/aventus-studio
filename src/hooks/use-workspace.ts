'use client'

import { useContext } from 'react'
import { WorkspaceContext, type WorkspaceContextValue } from '@/components/workspace-provider'

export function useWorkspace(): WorkspaceContextValue {
  return useContext(WorkspaceContext)
}
