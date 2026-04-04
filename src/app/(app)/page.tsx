'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { MonthCalendar } from '@/components/month-calendar'
import { DayEditor } from '@/components/day-editor'
import { WeekModal } from '@/components/week-modal'
import { useWorkspace } from '@/hooks/use-workspace'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/types/database'

interface WeekSelection {
  weekNumber: number
  year: number
  startDate: string
}

export default function HomePage() {
  const { active } = useWorkspace()
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [weekSelection, setWeekSelection] = useState<WeekSelection | null>(null)

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
  }

  const handleBack = () => {
    setSelectedDate(null)
  }

  const handleSelectWeek = (weekNumber: number, year: number, startDate: string) => {
    setWeekSelection({ weekNumber, year, startDate })
  }

  const handleCloseWeekModal = () => {
    setWeekSelection(null)
  }

  const dayPosts = useMemo(() => {
    if (!selectedDate) return []
    return posts.filter((p) => p.scheduled_at?.startsWith(selectedDate))
  }, [posts, selectedDate])

  // Show day editor if a date is selected, otherwise show calendar
  if (selectedDate) {
    return (
      <DayEditor
        date={selectedDate}
        posts={dayPosts}
        workspaceId={active?.id ?? null}
        onBack={handleBack}
        onPostCreated={fetchPosts}
      />
    )
  }

  return (
    <>
      <MonthCalendar
        posts={posts}
        onSelectDay={handleSelectDay}
        onSelectWeek={handleSelectWeek}
        selectedDate={selectedDate}
      />
      {weekSelection && (
        <WeekModal
          weekNumber={weekSelection.weekNumber}
          year={weekSelection.year}
          startDate={weekSelection.startDate}
          onClose={handleCloseWeekModal}
        />
      )}
    </>
  )
}
