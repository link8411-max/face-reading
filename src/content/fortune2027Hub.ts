// /fortune/2027 허브 본문 조각 — 화면과 구조화 데이터(FAQPage)가 함께 쓴다.
// 삼재 설명에 지난해·올해 간지가 들어가므로 src/app/fortune 밖(여기)에 둔다(연도 문구 점검 테스트 때문).
import { SAMJAE_2027, zodiac2027, type ZodiacSlug } from '@/content/fortune2027Zodiac'
import { FORTUNE_YEAR } from '@/lib/fortuneYear'

// 삼재띠 슬러그: SAMJAE_2027에서만 뽑는다(정의된 순서: 돼지·토끼·양)
export function samjaeSlugs(): ZodiacSlug[] {
  return Object.keys(SAMJAE_2027) as ZodiacSlug[]
}

export function samjaeNames(): string[] {
  return samjaeSlugs().map((s) => `${zodiac2027[s].띠}띠`)
}

// 삼재 문단: 첫 문장은 띠 이름 자리에 링크를 넣을 수 있게 앞·뒤로 나눈다.
export const SAMJAE_LEAD = `${FORTUNE_YEAR.year} ${FORTUNE_YEAR.간지}년에 삼재인 띠는 `
export const SAMJAE_LEAD_END = '(해묘미)예요.'
export const SAMJAE_TAIL = `2025 을사년 들삼재, 2026 병오년 눌삼재를 지나 ${FORTUNE_YEAR.year} ${FORTUNE_YEAR.간지}년 날삼재로 올해가 삼재의 마지막 해예요. 나머지 아홉 띠는 삼재가 아니에요. 2028 무신년부터는 원숭이띠·쥐띠·용띠(신자진)의 들삼재가 시작돼요.`

export function samjaeParagraph(): string {
  return `${SAMJAE_LEAD}${samjaeNames().join('·')}${SAMJAE_LEAD_END} ${SAMJAE_TAIL}`
}

export const SAMJAE_NOTE = '삼재는 전통 풍습이라 오락과 참고용으로만 읽어 주세요.'

export function hubFaqs(): { q: string; a: string }[] {
  return [
    {
      q: `${FORTUNE_YEAR.year}년은 무슨 띠의 해인가요?`,
      a: `${FORTUNE_YEAR.year}년은 ${FORTUNE_YEAR.띠}띠의 해예요. 간지로는 ${FORTUNE_YEAR.간지}년(${FORTUNE_YEAR.한자})이고, 정(丁)이 불의 기운이라 붉은색, 미(未)가 양이라 '붉은 양의 해'라고 불러요.`,
    },
    {
      q: `${FORTUNE_YEAR.year}년 삼재띠는 어떤 띠인가요?`,
      a: samjaeParagraph(),
    },
    {
      q: '띠는 1월 1일에 바뀌나요?',
      a: '아니요, 사주에서는 입춘(2월 4일 무렵)에 띠가 바뀌어요. 그래서 1월 1일부터 2월 3일 사이에 태어났다면 전년도 띠로 봐요.',
    },
  ]
}
