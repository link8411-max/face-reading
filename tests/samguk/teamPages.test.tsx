import { renderToStaticMarkup } from 'react-dom/server'
import TeamCard from '@/components/samguk/TeamCard'
import { buildTeam } from '@/lib/samguk/team'
import { samgukCharacters } from '@/lib/samgukDB'
import { metadata as teamMeta } from '@/app/samguk/(match)/team/page'
import { generateMetadata as teamShareMeta } from '@/app/samguk/(match)/team/r/[ids]/page'
import { SITEMAP_ROUTES } from '@/app/sitemap'

const c = (id: string) => samgukCharacters.find((x) => x.id === id)!

test('팀 카드: 팀의 기운, 팀원별 장수·역할·별칭, 회사생활 STATUS, 워터마크', () => {
  const t = buildTeam([{ character: c('liubei'), nickname: '김대리' }, { character: c('zhugeliang') }, { character: c('guanyu') }])
  const html = renderToStaticMarkup(<TeamCard team={t} />)
  for (const w of [t.spirit, '유비', '제갈량', '관우', '군주', '책사', '김대리', '칼퇴력', 'UNSE-AI.COM']) expect(html, w).toContain(w)
})

test('팀 페이지는 검색 노출·사이트맵, 공유 링크는 검색 제외', async () => {
  expect(teamMeta.alternates?.canonical).toBe('https://unse-ai.com/samguk/team')
  expect(SITEMAP_ROUTES as readonly string[]).toContain('/samguk/team')
  const m = await teamShareMeta({ params: Promise.resolve({ ids: 'liubei-zhugeliang-guanyu' }) })
  expect(m.openGraph?.title).toMatch(/^우리 팀은 .+! 너희 팀은 삼국지 속 누구야\?$/)
  expect(m.robots).toEqual({ index: false, follow: true })
  expect(JSON.stringify(m.openGraph?.images)).toContain('/api/og/result?kind=team&ids=liubei-zhugeliang-guanyu')
  expect((await teamShareMeta({ params: Promise.resolve({ ids: 'liubei' }) })).openGraph).toBeUndefined()
})
