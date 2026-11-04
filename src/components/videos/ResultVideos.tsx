'use client'

import { useEffect, useState } from 'react'
import ResultVideoBlock from './ResultVideoBlock'
import type { SgTile } from '@/lib/videos/forPerson'
import type { Video } from '@/lib/videos/types'

type Data = { video: Video | null; faces: SgTile[] }

/** 닮은꼴 결과용. 받기 전·실패 시에는 아무것도 그리지 않는다. */
export default function ResultVideos({ id, name }: { id: string; name: string }) {
  const [data, setData] = useState<Data | null>(null)
  useEffect(() => {
    const ac = new AbortController()
    fetch(`/api/samguk/videos/${encodeURIComponent(id)}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && Array.isArray(d.faces)) setData(d as Data) })
      .catch(() => {})
    return () => ac.abort()
  }, [id])
  if (!data) return null
  return <ResultVideoBlock name={name} personId={id} video={data.video} faces={data.faces} />
}
