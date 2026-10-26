import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fortuneDB, generateFortune } from '@/lib/fortuneDB'
import { FORTUNE_YEAR } from '@/lib/fortuneYear'
import { 띠동물 } from '@/lib/saju'

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p] })
}

test('운세 연도는 2027 정미년(붉은 양)', () => {
  expect(FORTUNE_YEAR).toMatchObject({ year: 2027, 간지: '정미', 한자: '丁未', 띠: '양' })
})

test('12띠 올해 운세 데이터가 모두 있고 충분히 길다', () => {
  for (const 띠 of 띠동물) {
    const d = fortuneDB.띠별올해[띠 as keyof typeof fortuneDB.띠별올해]
    expect(d, 띠).toBeDefined()
    expect(d.summary.length, 띠).toBeGreaterThanOrEqual(80)
    expect(d.summary, 띠).toContain('2027')
    for (const k of ['상반기', '하반기', '최고의달', '주의할달', 'keyword'] as const) expect(d[k], `${띠}.${k}`).toBeTruthy()
  }
})

const input = { 띠: '양', 일간오행: '금', 강한오행: '토', 약한오행: '수', 사주: { 년주: '경오', 월주: '신사', 일주: '경진' }, 음양: '양' }

test('운세 결과에 2026·병오가 없고 같은 입력이면 같은 결과', () => {
  const a = generateFortune(input), b = generateFortune(input)
  expect(a).toEqual(b)
  const text = JSON.stringify(a)
  expect(text).not.toMatch(/2026|병오/)
})

test('신년운세 화면·메타·홈·소개에 2026·병오가 남아 있지 않다', () => {
  const files = [...walk('src/app/fortune'), 'src/app/layout.tsx', 'src/app/page.tsx', 'src/app/about/page.tsx', 'src/lib/fortuneDB.ts', 'src/lib/saju.ts', 'src/content/pageGuides.ts']
  for (const f of files) {
    const t = readFileSync(f, 'utf8').replace(/'20\d\d-\d\d-\d\d'/g, '').replace(/© 2026/g, '')
    expect(t, f).not.toMatch(/2026|병오/)
  }
})
