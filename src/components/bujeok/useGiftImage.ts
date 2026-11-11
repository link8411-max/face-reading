'use client'
// 선물 그림 미리 만들기. 선물 완성 화면이 뜨면 PNG를 만들어 두고, 어떤 브라우저든 이어서 카카오 서버에 올려 둔다
// (카카오 카드는 모든 브라우저에서 쓴다. 누르는 순간에 올리지 않는다). 카카오는 최대 3초만 기다린 뒤 기존 미리보기 이미지를 쓴다.
// 그림 저장 버튼은 이 PNG를 쓴다(공유창에는 더 이상 파일을 싣지 않는다 — 링크가 빠지는 앱이 있어서).
import { useEffect, useRef } from 'react'
import { renderGiftImage, GIFT_IMAGE, GIFT_IMAGE_NAME } from '@/lib/bujeok/giftImage'
import { GIFT_PREP_DELAY_MS, pickKakaoImage, type KakaoImage } from '@/lib/bujeok/giftShare'
import { uploadKakaoImage } from '@/lib/kakao'
import type { BujeokSpec } from '@/lib/bujeok/keys'

export function useGiftImage(spec: BujeokSpec, getSvg: () => SVGSVGElement | null, enabled: boolean, to: string | null = null) {
  const filePromise = useRef<Promise<File | null>>(Promise.resolve(null))
  const upload = useRef<Promise<KakaoImage | null> | null>(null)
  const svgGetter = useRef(getSvg)
  useEffect(() => {
    svgGetter.current = getSvg
  })

  useEffect(() => {
    filePromise.current = Promise.resolve(null)
    upload.current = null
    if (!enabled) return
    let alive = true
    const timer = { id: 0 as unknown as ReturnType<typeof setTimeout> }
    const made = new Promise<File | null>((resolve) => {
      timer.id = setTimeout(async () => {
        try {
          const svg = svgGetter.current()
          if (!svg) return resolve(null)
          const blob = await renderGiftImage(svg, spec.style, spec.finish, spec.wish, to)
          resolve(alive ? new File([blob], GIFT_IMAGE_NAME, { type: 'image/png' }) : null)
        } catch {
          resolve(null)
        }
      }, GIFT_PREP_DELAY_MS)
    })
    filePromise.current = made
    upload.current = made.then((f) => (f ? uploadKakaoImage(f, { width: GIFT_IMAGE.w, height: GIFT_IMAGE.h }) : null))
    return () => {
      alive = false
      clearTimeout(timer.id)
    }
  }, [spec, enabled, to])

  return {
    /** 선물 PNG(만드는 중이면 끝나길 기다린다, 실패하면 null) */
    getFile: () => filePromise.current,
    /** 카카오 카드 이미지: 올라간 그림, 실패·3초 초과면 fallback */
    getKakaoImage: (fallback: KakaoImage) => pickKakaoImage(upload.current, fallback),
  }
}
