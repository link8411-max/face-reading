'use client'
// 잠금화면용 저장(앞면 정지 이미지). 완성 화면과 선물 착지가 함께 쓴다.
import { useState } from 'react'
import { saveImage } from '@/lib/saveImage'
import { track } from '@/lib/analytics'
import { renderWallpaper } from '@/lib/bujeok/wallpaper'
import type { BujeokSpec } from '@/lib/bujeok/keys'

export function useWallpaperSave(spec: BujeokSpec, getSvg: () => SVGSVGElement | null) {
  const [saving, setSaving] = useState(false)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)
  const save = async () => {
    const svg = getSvg()
    if (!svg || saving) return
    setSaving(true)
    setSaveNotice(null)
    try {
      const blob = await renderWallpaper(svg, spec.style, spec.finish)
      saveImage(blob, 'bujeok.png')
      track('share_click', { test_name: 'bujeok', method: 'save_image' })
    } catch {
      setSaveNotice('이미지를 만들다 문제가 생겼어요. 잠시 뒤에 다시 해 주세요.')
    } finally {
      setSaving(false)
    }
  }
  return { saving, saveNotice, save }
}
