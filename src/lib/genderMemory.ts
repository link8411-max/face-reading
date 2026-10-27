import type { Gender } from '@/components/test/GenderPills'

// 사진 테스트에서 고른 내 성별을 이 기기에만 기억해 다음 테스트에서 미리 고른다 (서버·GA로 보내지 않음).
// 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서는 기억 없이 동작한다.
const KEY = 'unse-gender'
type Store = Pick<Storage, 'getItem' | 'setItem'>
const local = (): Store | undefined => {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export function loadGender(store: Store | undefined = local()): Gender | null {
  try {
    const v = store?.getItem(KEY)
    return v === '여' || v === '남' ? v : null
  } catch {
    return null
  }
}

export function saveGender(g: Gender, store: Store | undefined = local()): void {
  try {
    store?.setItem(KEY, g)
  } catch {
    // 기억하지 못해도 테스트는 그대로 된다
  }
}
