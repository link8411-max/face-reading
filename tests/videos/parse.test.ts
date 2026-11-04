import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  parseIsoDuration, stripHashtags, peopleFromText, applyOverride, fromApi, fromRss,
  isNew, viewsLabel, gaVideoId, isVideoId, thumbUrl,
} from '@/lib/videos/parse'
import { isSafeValue } from '@/lib/analytics'

const dir = join(__dirname, 'fixtures')
const api = JSON.parse(readFileSync(join(dir, 'api-videos.json'), 'utf8')) as unknown[]
const feed = readFileSync(join(dir, 'feed.xml'), 'utf8')
const ORDER = ['2U3ZFgCdnzU', 'R-lrShfZU7s', 'NejqojdriBg']

describe('parseIsoDuration', () => {
  it('초 단위로 바꾼다', () => {
    expect(parseIsoDuration('PT1M3S')).toBe(63)
    expect(parseIsoDuration('PT2M1S')).toBe(121)
    expect(parseIsoDuration('P1D')).toBeNull()
    expect(parseIsoDuration('')).toBeNull()
  })
})

describe('stripHashtags', () => {
  it('끝의 해시태그를 뗀다', () => {
    expect(stripHashtags('하후돈은 정말 눈알을 삼켰을까? #삼국지 #shorts')).toBe('하후돈은 정말 눈알을 삼켰을까?')
  })
  it('비면 원문', () => {
    expect(stripHashtags('#삼국지 #shorts')).toBe('#삼국지 #shorts')
  })
})

describe('peopleFromText', () => {
  it('해시태그 순서대로, 중복 없이 인물 id', () => {
    expect(peopleFromText('… #삼국지 #도원결의 #유비 #관우 #장비 #역사')).toEqual(['liubei', 'guanyu', 'zhangfei'])
    expect(peopleFromText('#조조 #조조')).toEqual(['caocao'])
  })
})

describe('fromApi', () => {
  const vs = fromApi(api)
  it('3편, 최신순', () => {
    expect(vs.map((v) => v.id)).toEqual(ORDER)
  })
  it('R-lrShfZU7s 필드', () => {
    const v = vs.find((x) => x.id === 'R-lrShfZU7s')!
    expect(v.people).toEqual(['xiaohoudun', 'caocao'])
    expect(v.durationSec).toBe(63)
    expect(v.views).toBe(1008)
    expect(v.isShort).toBe(true)
    expect(v.thumbnail).toBe(thumbUrl('R-lrShfZU7s'))
    expect(v.title).toBe('하후돈은 정말 눈알을 삼켰을까?')
  })
  it('적벽 인물', () => {
    const v = vs.find((x) => x.id === 'NejqojdriBg')!
    expect(v.people).toEqual(expect.arrayContaining(['zhugeliang', 'caocao', 'zhouyu']))
  })
  it('깨진 항목은 건너뛴다', () => {
    expect(fromApi([null, 1, {}, { id: 'bad' }])).toEqual([])
  })
})

describe('fromRss', () => {
  const vs = fromRss(feed)
  it('같은 3편, 대체 규칙', () => {
    expect(vs.map((v) => v.id)).toEqual(ORDER)
    for (const v of vs) {
      expect(v.durationSec).toBeNull()
      expect(v.isShort).toBe(true)
      expect(typeof v.views).toBe('number')
    }
    expect(vs[0].people).toEqual(['liubei', 'guanyu', 'zhangfei'])
  })
  it('빈 문자열은 빈 목록', () => {
    expect(fromRss('')).toEqual([])
  })
})

describe('applyOverride', () => {
  const v = fromApi(api)[0]
  it('hide면 null, people 교체', () => {
    expect(applyOverride(v, { hide: true })).toBeNull()
    expect(applyOverride(v, { people: ['caoren'] })!.people).toEqual(['caoren'])
    expect(applyOverride(v)).toBe(v)
  })
})

describe('isNew / viewsLabel', () => {
  const pub = '2026-11-04T09:08:14Z'
  const v = { ...fromApi(api)[1], publishedAt: pub }
  it('24시간 경계', () => {
    expect(isNew(pub, new Date('2026-11-05T09:08:13Z'))).toBe(true)
    expect(isNew(pub, new Date('2026-11-05T09:08:14Z'))).toBe(false)
  })
  it('조회수 라벨', () => {
    expect(viewsLabel(v, new Date('2026-11-05T09:08:13Z'))).toBeNull()
    expect(viewsLabel(v, new Date('2026-11-06T00:00:00Z'))).toBe('조회수 1,008회')
    expect(viewsLabel({ ...v, views: null }, new Date('2026-11-06T00:00:00Z'))).toBeNull()
  })
})

describe('id 도우미', () => {
  it('GA 값과 id 검증', () => {
    expect(gaVideoId('R-lrShfZU7s')).toBe('R_lrShfZU7s')
    expect(isSafeValue(gaVideoId('R-lrShfZU7s'))).toBe(true)
    expect(isVideoId('<script>')).toBe(false)
    expect(isVideoId('R-lrShfZU7s')).toBe(true)
    expect(isVideoId(undefined)).toBe(false)
  })
  it('썸네일 주소', () => {
    expect(thumbUrl('abcdefghijk')).toBe('https://i.ytimg.com/vi/abcdefghijk/oar2.jpg')
  })
})
