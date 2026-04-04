'use client'

import { useEffect, useState, useCallback } from 'react'
import { MonthCalendar } from '@/components/month-calendar'
import { useWorkspace } from '@/hooks/use-workspace'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/types/database'

export default function HomePage() {
  const { active } = useWorkspace()
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    if (!active) { setPosts([]); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('workspace_id', active.id)
      .is('deleted_at', null)
    setPosts((data as Post[] | null) ?? [])
  }, [active])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleSelectDay = (date: string) => {
    setSelectedDate(date)
    // Day editor panel will be built next
  }

  const handleSelectWeek = (weekNumber: number, year: number, startDate: string) => {
    // Weekly generation wizard will be built next
    console.log('Open weekly generation for W' + weekNumber, year, startDate)
  }

  return (
    <MonthCalendar
      posts={posts}
      onSelectDay={handleSelectDay}
      onSelectWeek={handleSelectWeek}
      selectedDate={selectedDate}
    />
  )
}
