// 띠 궁합(전통 규칙): 육합(짝을 이루는 띠 하나) + 삼합(같은 무리 두 띠). 띠별 2027 글의 "잘 맞는 띠" 문장과 같은 규칙이다(tests/zodiacMatch.test.ts가 글에 그 띠 이름이 다 나오는지 확인).
import { ZODIAC_SLUGS, type ZodiacSlug } from '@/content/fortune2027Zodiac'

const BRANCH = '자축인묘진사오미신유술해' // ZODIAC_SLUGS와 같은 순서(쥐·소·호랑이…)
const YUKHAP = ['자축', '인해', '묘술', '진유', '사신', '오미']
const SAMHAP = ['인오술', '신자진', '사유축', '해묘미']

export interface ZodiacMatch { slug: ZodiacSlug; kind: '육합' | '삼합'; pair: string }

export function zodiacMatches(slug: ZodiacSlug): ZodiacMatch[] {
  const b = BRANCH[ZODIAC_SLUGS.indexOf(slug)]
  const toSlug = (ch: string) => ZODIAC_SLUGS[BRANCH.indexOf(ch)]
  const yuk = YUKHAP.find((p) => p.includes(b))!
  const sam = SAMHAP.find((g) => g.includes(b))!
  const yukOther = [...yuk].find((c) => c !== b)!
  return [
    { slug: toSlug(yukOther), kind: '육합', pair: `${yuk}합` },
    ...[...sam].filter((c) => c !== b).map((c) => ({ slug: toSlug(c), kind: '삼합' as const, pair: `${sam} 삼합` })),
  ]
}
