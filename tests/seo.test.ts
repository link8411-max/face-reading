import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { SITEMAP_ROUTES } from '@/app/sitemap'

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

test('없는 기능(토정비결)을 홍보하지 않는다', () => {
  for (const f of walk('src/app')) {
    const t = readFileSync(f, 'utf8')
    expect(t, f).not.toContain('토정비결')
    // '음력 생년월일로'는 3단계에서 음력→양력 변환을 구현해 사실이 되었으므로 더 막지 않는다
  }
})

test('사이트맵에 소개·개인정보처리방침이 있다', () => {
  expect(SITEMAP_ROUTES as readonly string[]).toEqual(expect.arrayContaining(['/about', '/privacy']))
})

test('구조화 데이터 기능 목록에 실제 테스트가 모두 있다', () => {
  const layout = readFileSync('src/app/layout.tsx', 'utf8')
  const featureList = layout.slice(layout.indexOf('"featureList"'), layout.indexOf(']', layout.indexOf('"featureList"')))
  for (const name of ['관상', '동물상', '삼국지 닮은꼴', '신년운세', '오늘의 운세']) expect(featureList, name).toContain(name)
})
