// 0a67370..b06ec44 리뷰 반영 (2026-10-27)
import { readFileSync } from 'node:fs'
import { isSafeValue, isProdHost } from '@/lib/analytics'
import { ZODIAC_SLUGS } from '@/content/fortune2027Zodiac'
import { ogQueryOk, OG_CACHE_CONTROL } from '@/lib/ogQuery'
import { captureFilter } from '@/lib/capture'

test('시즌 카드 slot은 GA 값 필터를 통과한다 (띠별: zodiac_rat 형식)', () => {
  const files = ['src/app/page.tsx', 'src/app/fortune/daily/page.tsx', 'src/components/Zodiac2027Article.tsx', 'src/app/fortune/FortuneClient.tsx']
  const slots: string[] = []
  for (const f of files) {
    for (const m of readFileSync(f, 'utf8').matchAll(/<SeasonPicks slot=(?:"([^"]+)"|\{`([^`]+)`\})/g)) {
      if (m[1]) slots.push(m[1])
      else for (const slug of ZODIAC_SLUGS) slots.push(m[2].replace('${slug}', slug))
    }
  }
  expect(slots.length).toBeGreaterThanOrEqual(3 + ZODIAC_SLUGS.length)
  for (const s of slots) expect(isSafeValue(s), s).toBe(true)
})

test('GA는 운영 주소(unse-ai.com)에서만 보낸다: 미리보기 배포·로컬은 제외', () => {
  expect(isProdHost('unse-ai.com')).toBe(true)
  expect(isProdHost('www.unse-ai.com')).toBe(true)
  for (const h of ['localhost', '127.0.0.1', '[::1]', 'face-reading-git-x.vercel.app', 'unse-ai.com.evil.io', 'notunse-ai.com']) expect(isProdHost(h), h).toBe(false)
  const layout = readFileSync('src/app/layout.tsx', 'utf8')
  expect(layout).not.toContain('localhost|127')
  expect(layout).toContain('PROD_HOST_SOURCE')
})

test('미리보기 이미지: 알 수 없는 매개변수·점수 형식은 거부, 오래 캐시', () => {
  const q = (s: string) => ogQueryOk(new URLSearchParams(s))
  expect(q('kind=animal&key=cat&s=87')).toBe(true)
  expect(q('kind=face&key=jaemul')).toBe(true)
  expect(q('kind=mbti&a=INFP&b=ENTJ')).toBe(true)
  expect(q('kind=face-match&a=cat&b=dog&rel=lover')).toBe(true)
  expect(q('kind=invite&key=cat&rel=friend')).toBe(true)
  expect(q('kind=team&ids=liubei-caocao')).toBe(true)
  expect(q('kind=animal&key=cat&s=87&zz=1')).toBe(false)
  expect(q('kind=animal&key=cat&s=87&s=88')).toBe(false)
  for (const s of ['0x57', '87.0', '1e2', '087', ' 87', '100', '5']) expect(q(`kind=animal&key=cat&s=${encodeURIComponent(s)}`), s).toBe(false)
  expect(q('kind=team&ids=liubei-caocao&key=cat')).toBe(false)
  expect(OG_CACHE_CONTROL).toMatch(/s-maxage=\d{6,}/)
  const route = readFileSync('src/app/api/og/result/route.tsx', 'utf8')
  expect(route).toContain('ogQueryOk(')
  expect(route).toContain('OG_CACHE_CONTROL')
  expect(route).toMatch(/AbortSignal\.timeout\(/)
})

test('결과 이미지 캡처는 no-screenshot 요소(생년월일 등)와 iframe을 뺀다', () => {
  const el = (nodeName: string, cls: string[] = []) => ({ nodeName, classList: { contains: (c: string) => cls.includes(c) } }) as unknown as Node
  expect(captureFilter(el('DIV'))).toBe(true)
  expect(captureFilter(el('IFRAME'))).toBe(false)
  expect(captureFilter(el('P', ['no-screenshot']))).toBe(false)
  expect(captureFilter({ nodeName: '#text' } as Node)).toBe(true)
  const fortune = readFileSync('src/app/fortune/FortuneClient.tsx', 'utf8')
  expect(fortune).toMatch(/className="[^"]*no-screenshot[^"]*">\s*\{birthDate\.year\}년/)
})
