import { NextResponse } from 'next/server'
import { characterById } from '@/lib/people/characters'
import { getChannelVideos } from '@/lib/videos/fetch'
import { relatedFaces, videosForPerson } from '@/lib/videos/forPerson'

export const revalidate = 3600

const CACHE = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!characterById(id)) return NextResponse.json({ video: null, faces: [] }, { status: 404, headers: CACHE })
  const videos = await getChannelVideos()
  const video = videosForPerson(videos, id).own[0] ?? null
  return NextResponse.json({ video, faces: relatedFaces(id) }, { headers: CACHE })
}
