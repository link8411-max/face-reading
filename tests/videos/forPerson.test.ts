import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fromApi } from '@/lib/videos/parse'
import { videosForPerson, sanggwando, relatedFaces } from '@/lib/videos/forPerson'

const api = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'api-videos.json'), 'utf8')) as unknown[]
const v = fromApi(api)
const ORDER = ['혈연', '의형제', '군신', '동료', '라이벌', '원수']

describe('videosForPerson', () => {
  it('하후돈의 own은 1편', () => {
    expect(videosForPerson(v, 'xiaohoudun').own.map((x) => x.id)).toEqual(['R-lrShfZU7s'])
  })
  it('조조의 own은 최신순 2편', () => {
    expect(videosForPerson(v, 'caocao').own.map((x) => x.id)).toEqual(['R-lrShfZU7s', 'NejqojdriBg'])
  })
  it('people[0]이 본인인 영상이 먼저 온다', () => {
    const mk = (id: string, t: string, people: string[]) => ({ ...v[0], id, publishedAt: t, people })
    const list = [mk('aaaaaaaaaaa', '2026-11-04T00:00:00Z', ['liubei', 'guanyu']), mk('bbbbbbbbbbb', '2026-11-01T00:00:00Z', ['guanyu'])]
    expect(videosForPerson(list, 'guanyu').own.map((x) => x.id)).toEqual(['bbbbbbbbbbb', 'aaaaaaaaaaa'])
  })
  it('하후돈의 related에는 조조 영상과 관우·유비 영상이 있고 own은 없다', () => {
    const r = videosForPerson(v, 'xiaohoudun').related
    const ids = r.map((x) => x.video.id)
    expect(ids).toContain('NejqojdriBg')
    expect(ids).toContain('2U3ZFgCdnzU')
    expect(ids).not.toContain('R-lrShfZU7s')
    expect(r.find((x) => x.video.id === 'NejqojdriBg')?.personId).toBe('caocao')
    expect(['guanyu', 'liubei']).toContain(r.find((x) => x.video.id === '2U3ZFgCdnzU')?.personId)
    expect(r[0].label).toBeTruthy()
    expect(r[0].personName).toBeTruthy()
  })
  it('related는 같은 영상을 두 번 넣지 않고 6편까지', () => {
    const r = videosForPerson(v, 'xiaohoudun').related.map((x) => x.video.id)
    expect(new Set(r).size).toBe(r.length)
    expect(r.length).toBeLessThanOrEqual(6)
  })
  it('빈 목록', () => {
    expect(videosForPerson([], 'xiaohoudun')).toEqual({ own: [], related: [] })
  })
})

describe('sanggwando', () => {
  const g = sanggwando('xiaohoudun', v)
  const tiles = g.flatMap((x) => x.tiles)
  it('묶음 순서가 정해진 순서의 부분 순서이고 빈 묶음이 없다', () => {
    const keys = g.map((x) => x.key)
    expect(keys).toEqual(ORDER.filter((k) => keys.includes(k as never)))
    expect(keys).toEqual(['혈연', '군신', '라이벌', '원수'])
    expect(g.every((x) => x.tiles.length > 0)).toBe(true)
  })
  it('영상 있는 칸·없는 칸', () => {
    expect(tiles.find((t) => t.id === 'caocao')?.hasVideo).toBe(true)
    expect(tiles.find((t) => t.id === 'xiahouyuan')?.hasVideo).toBe(false)
  })
  it('열전 없는 조성 칸은 portrait·href가 null', () => {
    const t = tiles.find((x) => x.name === '조성')!
    expect(t.id).toBeNull()
    expect(t.portrait).toBeNull()
    expect(t.href).toBeNull()
    expect(t.hasVideo).toBe(false)
  })
  it('열전 있는 칸은 href와 portrait가 있다', () => {
    const t = tiles.find((x) => x.id === 'caocao')!
    expect(t.href).toBe('/samguk/people/caocao')
    expect(t.portrait).toBeTruthy()
    expect(t.label).toBe('군신')
  })
  it('초상화 대기 인물 칸은 portrait가 null이고 링크는 열전대로', () => {
    // guanyu의 관계 guanyinping(초상화 대기, 열전 있음)
    const t = sanggwando('guanyu', v).flatMap((x) => x.tiles).find((x) => x.id === 'guanyinping')!
    expect(t.portrait).toBeNull()
    expect(t.href).toBe('/samguk/people/guanyinping')
  })
})

describe('relatedFaces', () => {
  it('portrait와 href가 모두 있는 칸만 5명 이하', () => {
    const f = relatedFaces('xiaohoudun')
    expect(f.length).toBeGreaterThan(0)
    expect(f.length).toBeLessThanOrEqual(5)
    expect(f.every((t) => t.portrait && t.href)).toBe(true)
    expect(relatedFaces('xiaohoudun', 2)).toHaveLength(2)
  })
  it('초상화 대기 인물은 건너뛴다', () => {
    expect(relatedFaces('guanyu', 50).some((t) => t.id === 'guanyinping')).toBe(false)
  })
})
