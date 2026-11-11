'use client'
// 링크 해시(#to=…&from=…)에서 이름을 읽는다. 해시는 서버·GA로 가지 않으므로 서버 렌더에는 이름이 없고(빈 값),
// 마운트 뒤에 location.hash를 읽어 채운다. cleanName을 못 넘는 이름은 버린다.
import { useMemo, useSyncExternalStore } from 'react'
import { parseNameHash } from '@/lib/bujeok/link'

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useNameHash(): { to: string | null; from: string | null } {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '')
  return useMemo(() => parseNameHash(hash), [hash])
}
