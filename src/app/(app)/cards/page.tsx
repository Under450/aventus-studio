'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { CardGenerator } from '@/components/card-generator'

function CardsContent() {
  const searchParams = useSearchParams()
  const caption = searchParams.get('caption') || undefined
  const hashtags = searchParams.get('hashtags') || undefined
  const date = searchParams.get('date') || undefined

  return (
    <CardGenerator
      initialCaption={caption}
      initialHashtags={hashtags}
      initialDate={date}
    />
  )
}

export default function Cards() {
  return (
    <Suspense>
      <CardsContent />
    </Suspense>
  )
}
