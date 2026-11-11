'use client'
// 부적함을 읽는 훅. 서버 렌더·첫 화면은 undefined(아직 모름), 마운트 뒤에는 목록, 저장소를 못 쓰면 null.
import { useMemo, useSyncExternalStore } from 'react'
import { parseBox, readBoxRaw, subscribeBox, type BoxItem } from '@/lib/bujeok/box'

const NOT_READ = '\u0000server'

export function useBox(): BoxItem[] | null | undefined {
  const raw = useSyncExternalStore(subscribeBox, () => readBoxRaw(), () => NOT_READ)
  return useMemo(() => (raw === NOT_READ ? undefined : parseBox(raw)), [raw])
}
