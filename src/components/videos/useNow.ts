'use client'

import { useSyncExternalStore } from 'react'

const never = () => () => {}
const clock: { at: number | null } = { at: null }

/** 서버·하이드레이션은 null, 마운트 뒤에는 한 번만 잰 Date.now(). */
export function useNow(): Date | null {
  const ms = useSyncExternalStore(never, () => (clock.at ??= Date.now()), () => null)
  return ms === null ? null : new Date(ms)
}
