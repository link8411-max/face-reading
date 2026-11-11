// 다른 화면(사주 풀이 등)에서 부적으로 생년월일을 넘길 때 쓴다. photoHandoff.ts와 같은 방식:
// 화면 이동 동안 메모리에만 들고 있고 받는 쪽이 꺼내면 바로 지운다. 브라우저 저장소에는 넣지 않는다(생년월일 비저장 약속).
import type { BirthInput } from './compose'

let held: BirthInput | null = null

export function handOffBirth(b: BirthInput): void {
  held = { ...b }
}

export function takeHandedBirth(): BirthInput | null {
  const b = held
  held = null
  return b
}
