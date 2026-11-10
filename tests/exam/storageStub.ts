// Node 25의 실험적 전역 localStorage가 jsdom과 부딪쳐 쓸 수 없으므로, 시험은 메모리 저장소로 바꿔 끼운다.
export class MemStorage {
  private map = new Map<string, string>()
  getItem(k: string) { return this.map.has(k) ? (this.map.get(k) as string) : null }
  setItem(k: string, v: string) { this.map.set(k, String(v)) }
  removeItem(k: string) { this.map.delete(k) }
  clear() { this.map.clear() }
}

const desc = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')

/** 메모리 저장소를 끼우고 그 객체를 돌려준다. */
export function installStorage(): MemStorage {
  const s = new MemStorage()
  Object.defineProperty(globalThis, 'localStorage', { value: s, configurable: true, writable: true })
  return s
}

/** 저장소에 닿기만 해도 던지게 한다(사파리 개인정보 보호 모드 흉내). */
export function breakStorageAccess() {
  Object.defineProperty(globalThis, 'localStorage', { get() { throw new Error('denied') }, configurable: true })
}

export function restoreStorage() {
  if (desc) Object.defineProperty(globalThis, 'localStorage', desc)
  else delete (globalThis as { localStorage?: unknown }).localStorage
}
