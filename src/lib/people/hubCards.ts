// 열전 허브 카드에 필요한 최소 필드만 서버에서 뽑는다(클라이언트 번들에 열전 본문 전체가 들어가지 않게).
import { PEOPLE, PEOPLE_IDS } from '@/content/samgukPeople'
import { characterById } from './characters'
import { portraitSrc } from './portrait'
import { pickFact, type HubCard } from './hubFilter'

// 응원 순위를 서버에서 읽지 않는 정적 허브라서, 대표 인물을 고정 순서로 먼저 보인다.
export const POPULAR_IDS = ['caocao', 'liubei', 'guanyu', 'zhugeliang', 'lvbu', 'zhaoyun', 'zhangfei', 'sunquan', 'zhouyu', 'simayi', 'diaochan', 'machao']

// 요약의 첫 문장. 따옴표 안에서 끊기지 않게 하고, 따옴표 한 줄뿐이면 다음 문장까지 잇는다.
export function firstSentence(summary: string): string {
  const text = summary.replace(/\s+/g, ' ').trim()
  const parts = text.split(/(?<=[.!?]["”']?)\s+/)
  let out = parts[0] ?? ''
  const quoteOnly = /^["“].*["”]$/.test(out)
  if (quoteOnly && parts[1]) out = `${out} ${parts[1]}`
  return out
}

export function hubCards(): HubCard[] {
  const make = (id: string): HubCard => {
    const c = characterById(id)
    const p = PEOPLE[id]
    const line = firstSentence(p.summary)
    return {
      id,
      name: c?.name ?? id,
      style: p.style,
      faction: c?.faction ?? '기타',
      portrait: portraitSrc(id),
      line,
      fact: pickFact(line, p.funFacts), // 첫 문장과 가장 덜 겹치는 알고 보면 한 줄
    }
  }
  const popular = POPULAR_IDS.filter((id) => id in PEOPLE)
  const rest = PEOPLE_IDS.filter((id) => !popular.includes(id))
  return [...popular, ...rest].map(make)
}
