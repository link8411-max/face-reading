import { zodiacMatches } from '@/lib/zodiacMatch'
import { zodiac2027, ZODIAC_SLUGS } from '@/content/fortune2027Zodiac'

test('쥐띠: 소띠(자축합) + 원숭이띠·용띠(신자진 삼합)', () => {
  expect(zodiacMatches('rat')).toEqual([
    { slug: 'ox', kind: '육합', pair: '자축합' },
    { slug: 'monkey', kind: '삼합', pair: '신자진 삼합' },
    { slug: 'dragon', kind: '삼합', pair: '신자진 삼합' },
  ])
})

test.each(ZODIAC_SLUGS)('%s: 계산한 잘 맞는 띠 셋이 그 띠 글의 궁합 문장에 모두 나온다(그림과 글이 어긋나지 않게)', (slug) => {
  const m = zodiacMatches(slug)
  expect(m).toHaveLength(3)
  expect(new Set(m.map((x) => x.slug)).size).toBe(3)
  for (const x of m) {
    expect(x.slug).not.toBe(slug)
    expect(zodiac2027[slug].궁합, `${slug} → ${x.slug}`).toContain(`${zodiac2027[x.slug].띠}띠`)
  }
})
