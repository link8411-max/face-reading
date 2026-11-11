'use client'
// 선물 그림 미리 만들기. 선물 완성 화면이 뜨면 PNG를 만들어 두고(공유창은 누른 직후에 열어야 하므로),
// 카카오톡 인앱이면 이어서 카카오 서버에 올려 둔다(누르는 순간에 올리지 않는다).
// 누른 시점에 아직 준비 안 됐으면 파일 공유는 링크 공유로 떨어지고, 카카오는 최대 3초만 기다린 뒤 기존 미리보기 이미지를 쓴다.
import { useEffect, useRef } from 'react'
import { renderGiftImage, GIFT_IMAGE, GIFT_IMAGE_NAME } from '@/lib/bujeok/giftImage'
import { GIFT_PREP_DELAY_MS, pickKakaoImage, type KakaoImage } from '@/lib/bujeok/giftShare'
import { isKakaoInApp, uploadKakaoImage } from '@/lib/kakao'
import type { BujeokSpec } from '@/lib/bujeok/keys'

export function useGiftImage(spec: BujeokSpec, getSvg: () => SVGSVGElement | null, enabled: boolean) {
  const file = useRef<File | null>(null)
  const upload = useRef<Promise<KakaoImage | null> | null>(null)
  const svgGetter = useRef(getSvg)
  useEffect(() => {
    svgGetter.current = getSvg
  })

  useEffect(() => {
    file.current = null
    upload.current = null
    if (!enabled) return
    let alive = true
    const timer = { id: 0 as unknown as ReturnType<typeof setTimeout> }
    upload.current = new Promise<KakaoImage | null>((resolve) => {
      timer.id = setTimeout(async () => {
        try {
          const svg = svgGetter.current()
          if (!svg) return resolve(null)
          const blob = await renderGiftImage(svg, spec.style, spec.finish)
          if (!alive) return resolve(null)
          const f = new File([blob], GIFT_IMAGE_NAME, { type: 'image/png' })
          file.current = f
          resolve(isKakaoInApp(navigator.userAgent) ? await uploadKakaoImage(f, { width: GIFT_IMAGE.w, height: GIFT_IMAGE.h }) : null)
        } catch {
          resolve(null)
        }
      }, GIFT_PREP_DELAY_MS)
    })
    return () => {
      alive = false
      clearTimeout(timer.id)
    }
  }, [spec, enabled])

  return {
    /** 준비된 PNG(없으면 null → 링크 공유) */
    getFile: () => file.current,
    /** 카카오 카드 이미지: 올라간 그림, 실패·3초 초과면 fallback */
    getKakaoImage: (fallback: KakaoImage) => pickKakaoImage(upload.current, fallback),
  }
}
