import { isMbti, type MbtiType } from '@/lib/mbti/compat'

// 오늘의 MBTI 운세에서 고른 내 MBTI를 이 기기에만 기억한다 (서버·GA로 보내지 않음). genderMemory와 같은 방식
const KEY = 'unse-mbti'
type Store = Pick<Storage, 'getItem' | 'setItem'>
const local = (): Store | undefined => {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export function loadMbti(store: Store | undefined = local()): MbtiType | null {
  try {
    const v = store?.getItem(KEY) ?? ''
    return isMbti(v) ? v : null
  } catch {
    return null
  }
}

export function saveMbti(t: MbtiType, store: Store | undefined = local()): void {
  try {
    store?.setItem(KEY, t)
  } catch {
    // 기억하지 못해도 운세는 그대로 본다
  }
}
