import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import DailyFortuneCard from '@/components/fortune/DailyFortuneCard'
import { dailyFortune } from '@/lib/dailyEngine'
import { LAST_MODIFIED } from '@/app/sitemap'

const D = new Date('2026-11-05T03:00:00+09:00')

test('결과 카드: 년주·일진·별점·근거·영역·행운이 있고 제목에 이모지가 없다', () => {
  const html = renderToStaticMarkup(<DailyFortuneCard fortune={dailyFortune({ kind: '년생', year: 1990, isEarlyYear: false }, D)} birthYearLabel="1990년생" />)
  expect(html).toContain('11월 5일 목요일 · 계미일')
  expect(html).toContain('경오년 말띠')
  expect(html).not.toContain('1990년생 경오년')
  expect(html.replace(/<[^>]*no-screenshot[^>]*>[^<]*1990년생[^<]*</g, '<')).not.toContain('1990년생')
  expect(html).toContain('★★★★☆')
  expect(html).toContain('말이 예쁘게 나가는 날이에요')
  expect(html).toContain('오미합')
  for (const s of ['재물', '연애', '일', '건강', '오후 1~3시(미시)', '노랑']) expect(html).toContain(s)
  const headings = html.match(/<h[1-3][^>]*>.*?<\/h[1-3]>/g) ?? []
  expect(headings.some((h) => /\p{Extended_Pictographic}/u.test(h))).toBe(false)
  expect(html).toMatch(/no-screenshot[^>]*>[^<]*1990년생/)
})

test('페이지: 요일표를 쓰지 않고, 쿼리 연도는 지우며, 공유 URL·GA에 연도가 없다', () => {
  const src = readFileSync('src/app/(ko)/fortune/daily/page.tsx', 'utf8')
  expect(src).not.toContain('일간운세')
  expect(src).toContain('@/lib/dailyEngine')
  expect(src).toContain('history.replaceState')
  expect(src).toContain('q.delete("year")')
  expect(src).toContain('q.delete("early")')
  expect(src).not.toContain('replaceState(null, "", location.pathname)')
  expect(src).toMatch(/cur\.result\.날짜 !== now/)
  expect(src).toMatch(/useEffect\([^]*kstDate\(new Date\(\)\)/)
  const share = src.slice(src.indexOf('getShareOptions'), src.indexOf('const yearCheck'))
  expect(share).not.toMatch(/birthYear|year=/)
  expect(src).not.toMatch(/track\([^)]*birthYear/)
  expect(LAST_MODIFIED['/fortune/daily']).toBe('2026-11-05')
})

test('페이지: gz 쿼리로 년주 모드, 잘못된 gz는 무시, gz도 주소에서 지운다', () => {
  const src = readFileSync('src/app/(ko)/fortune/daily/page.tsx', 'utf8')
  expect(src).toContain('q.get("gz")')
  expect(src).toContain('q.delete("gz")')
  expect(src).toContain("kind: '년주'")
  expect(src).toContain('isGanji(')
})
