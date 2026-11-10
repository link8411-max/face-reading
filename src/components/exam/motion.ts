'use client'

import { useSyncExternalStore } from 'react'
import type { Question } from '@/lib/exam/types'

const REDUCED = '(prefers-reduced-motion: reduce)'

/** 움직임 줄이기 설정 여부. 켜져 있으면 모든 연출을 건너뛰고 바로 최종 상태를 보여 준다. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (on) => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const mq = window.matchMedia(REDUCED)
      mq.addEventListener?.('change', on)
      return () => mq.removeEventListener?.('change', on)
    },
    () => typeof window.matchMedia === 'function' && window.matchMedia(REDUCED).matches,
    () => false,
  )
}

export const BUBBLE_MS = 250 // 대화 말풍선 간격
const STAGGER_MS = 55 // 보기 간격
const OPTION_FROM_MS = 80
const ANIM_MS = 150

/** 대화 문제: 마지막 말풍선이 뜨는 시각 */
const bubbleBase = (q: Question) => (q.skit && q.skit.form !== 'card' ? (q.skit.lines.length - 1) * BUBBLE_MS : 0)

export const optionDelay = (q: Question, i: number) => bubbleBase(q) + OPTION_FROM_MS + i * STAGGER_MS

/** 문제 등장 연출이 끝나는 때. 타이머는 이 뒤부터 센다. */
export const enterMs = (q: Question) => optionDelay(q, q.options.length - 1) + ANIM_MS
