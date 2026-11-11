// 부적 첫 화면의 처음 소원: 수능 철(한국 시간 11/1~11/20)에는 합격, 그 밖에는 재물. 순수 함수.
import { kstDate } from '@/lib/kst'
import type { Wish } from './keys'

export function seasonDefaultWish(now: Date): Wish {
  const md = kstDate(now).slice(5) // MM-DD
  return md >= '11-01' && md <= '11-20' ? 'pass' : 'money'
}
