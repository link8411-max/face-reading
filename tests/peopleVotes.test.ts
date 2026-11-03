import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getPerson, PEOPLE_IDS } from '@/content/samgukPeople'
import { pairKey, validateVote, statsOwner, voterHash, kstDay, voteGuard } from '@/lib/people/votes'
import { readStats, readCheerRanking, storeConfig } from '@/lib/people/store'
import { POST } from '@/app/api/people/vote/route'
import { GET } from '@/app/api/people/stats/route'

const p = getPerson('guanyu')!
const other = getPerson('caocao')!
const notRival = ['lvbu', 'zhangfei', 'liubei'].find((id) => id !== p.rivalId)!
const sceneKey = p.sceneOptions[0].key
const verdict = p.verdictOptions[0]
const UUID = '11111111-2222-4333-8444-555555555555'
const IP = '203.0.113.77'

describe('pairKey', () => {
  it('정렬해서 잇는다', () => {
    expect(pairKey('guanyu', 'caocao')).toBe('caocao__guanyu')
    expect(pairKey('caocao', 'guanyu')).toBe('caocao__guanyu')
    expect(pairKey('guanyu', p.rivalId)).toBe(pairKey(p.rivalId, 'guanyu'))
  })
})

describe('validateVote', () => {
  const cheer = { kind: 'cheer', target: 'guanyu', option: 'cheer' }
  it('cheer 정상·잘못된 인물·잘못된 option', () => {
    expect(validateVote(cheer)).toEqual(cheer)
    expect(validateVote({ ...cheer, target: 'nobody' })).toBeNull()
    expect(validateVote({ ...cheer, option: 'x' })).toBeNull()
  })
  it('duel: 라이벌 쌍만, option은 두 id 중 하나', () => {
    const target = pairKey('guanyu', p.rivalId)
    expect(validateVote({ kind: 'duel', target, option: 'guanyu' })).not.toBeNull()
    expect(validateVote({ kind: 'duel', target, option: p.rivalId })).not.toBeNull()
    expect(validateVote({ kind: 'duel', target, option: notRival })).toBeNull()
    expect(validateVote({ kind: 'duel', target: pairKey('guanyu', notRival), option: 'guanyu' })).toBeNull()
    expect(validateVote({ kind: 'duel', target: `${p.rivalId}__guanyu`, option: 'guanyu' })).toEqual(
      target === `${p.rivalId}__guanyu` ? { kind: 'duel', target, option: 'guanyu' } : null,
    )
  })
  it('scene: 그 인물의 key만', () => {
    expect(validateVote({ kind: 'scene', target: 'guanyu', option: sceneKey })).not.toBeNull()
    const foreign = other.sceneOptions.find((o) => !p.sceneOptions.some((q) => q.key === o.key))!
    expect(validateVote({ kind: 'scene', target: 'guanyu', option: foreign.key })).toBeNull()
  })
  it('verdict: 그 인물 선택지 안만', () => {
    expect(validateVote({ kind: 'verdict', target: 'guanyu', option: verdict })).not.toBeNull()
    const outside = (['loyal', 'righteous', 'brave', 'strategist', 'ambitious', 'tragic', 'overrated', 'underrated'] as const).find(
      (v) => !p.verdictOptions.includes(v),
    )!
    expect(validateVote({ kind: 'verdict', target: 'guanyu', option: outside })).toBeNull()
  })
  it('객체가 아니면 null', () => {
    for (const b of ['x', null, [], 1, undefined, [cheer]]) expect(validateVote(b)).toBeNull()
  })
})

describe('statsOwner (대결 투표 뒤 집계의 주인)', () => {
  // 서로를 라이벌로 둔 등록 인물 쌍을 데이터에서 찾는다
  const mutual = PEOPLE_IDS.flatMap((a) => {
    const b = getPerson(a)!.rivalId
    return getPerson(b)?.rivalId === a && a < b ? [[a, b]] : []
  })
  it('등록 데이터에 서로 라이벌인 쌍이 있다', () => {
    expect(mutual.length).toBeGreaterThan(0)
  })
  it('대결은 page 필수: 쌍의 어느 쪽 페이지든 그 페이지 인물이 주인', () => {
    for (const [a, b] of mutual) {
      const vote = { kind: 'duel' as const, target: pairKey(a, b), option: a }
      expect(statsOwner(vote, a)).toBe(a)
      expect(statsOwner(vote, b)).toBe(b)
      expect(statsOwner(vote, undefined)).toBeNull()
      expect(statsOwner(vote, 7)).toBeNull()
      expect(statsOwner(vote, 'nobody')).toBeNull()
      expect(statsOwner(vote, 'constructor')).toBeNull()
    }
  })
  it('page가 그 쌍의 라이벌 관계가 아니면 null', () => {
    const vote = { kind: 'duel' as const, target: pairKey('guanyu', p.rivalId), option: 'guanyu' }
    expect(statsOwner(vote, notRival)).toBeNull()
  })
  it('다른 종류는 page를 무시하고 target', () => {
    expect(statsOwner({ kind: 'cheer', target: 'guanyu', option: 'cheer' }, 'caocao')).toBe('guanyu')
    expect(statsOwner({ kind: 'scene', target: 'guanyu', option: sceneKey }, undefined)).toBe('guanyu')
    expect(statsOwner({ kind: 'verdict', target: 'guanyu', option: verdict }, 42)).toBe('guanyu')
  })
})

describe('상속 키 id는 인물이 아니다', () => {
  const junk = ['constructor', '__proto__', 'toString', 'hasOwnProperty']
  it('getPerson', () => {
    for (const id of junk) expect(getPerson(id)).toBeUndefined()
  })
  it.each(junk)('validateVote 네 종류 모두 null (%s)', (id) => {
    expect(validateVote({ kind: 'cheer', target: id, option: 'cheer' })).toBeNull()
    expect(validateVote({ kind: 'scene', target: id, option: sceneKey })).toBeNull()
    expect(validateVote({ kind: 'verdict', target: id, option: verdict })).toBeNull()
    expect(validateVote({ kind: 'duel', target: pairKey(id, 'guanyu'), option: 'guanyu' })).toBeNull()
    expect(validateVote({ kind: 'duel', target: pairKey(id, id), option: id })).toBeNull()
  })
})

describe('voterHash / kstDay', () => {
  it('같은 입력 같은 값, 날짜가 다르면 다른 값, 64자 hex, 원본 미포함', async () => {
    const a = await voterHash('s', '2026-11-03', UUID, IP)
    expect(a).toBe(await voterHash('s', '2026-11-03', UUID, IP))
    expect(a).not.toBe(await voterHash('s', '2026-11-04', UUID, IP))
    expect(a).not.toBe(await voterHash('t', '2026-11-03', UUID, IP))
    expect(a).toMatch(/^[0-9a-f]{64}$/)
    expect(a).not.toContain(IP)
    expect(a).not.toContain(UUID)
  })
  it('한국 날짜', () => {
    expect(kstDay(new Date('2026-11-03T15:30:00Z'))).toBe('2026-11-04')
    expect(kstDay(new Date('2026-11-03T14:30:00Z'))).toBe('2026-11-03')
  })
})

const req = (body: string, headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/people/vote', {
    method: 'POST',
    body,
    headers: { 'x-forwarded-for': IP, 'content-type': 'application/json', ...headers },
  })
const cheerBody = JSON.stringify({ kind: 'cheer', target: 'guanyu', option: 'cheer' })

const stubUpstream = (insertRows: unknown[] = [{ id: 1 }], statsRows: unknown[] = []) => {
  vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co/')
  vi.stubEnv('SUPABASE_SERVICE_KEY', 'k')
  const f = vi.fn().mockImplementation(async (url: string) =>
    String(url).includes('/rpc/')
      ? Response.json(statsRows)
      : Response.json(insertRows, { status: 201 }),
  )
  vi.stubGlobal('fetch', f)
  return f
}

describe('POST /api/people/vote', () => {
  beforeEach(() => voteGuard.reset())
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('env 없으면 503 disabled, fetch 0회', async () => {
    vi.stubEnv('SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_SERVICE_KEY', '')
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    const res = await POST(req(cheerBody))
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ ok: false, reason: 'disabled' })
    expect(f).not.toHaveBeenCalled()
  })

  it('깨진 JSON·검증 실패는 400, 2048바이트 초과는 413 (fetch 0회)', async () => {
    const f = stubUpstream()
    expect((await POST(req('{'))).status).toBe(400)
    expect((await POST(req('{}'))).status).toBe(400)
    expect((await POST(req('[]'))).status).toBe(400)
    expect((await POST(req(JSON.stringify({ kind: 'cheer', target: 'guanyu', option: 'cheer', pad: 'x'.repeat(3000) })))).status).toBe(413)
    expect(f).not.toHaveBeenCalled()
  })

  it('cheer: 처음은 counted true, 같은 날 두 번째(빈 배열)는 false', async () => {
    stubUpstream([{ id: 1 }])
    const first = await POST(req(cheerBody))
    expect(first.status).toBe(200)
    expect((await first.json()).counted).toBe(true)
    stubUpstream([])
    const second = await POST(req(cheerBody))
    const json = await second.json()
    expect(json.counted).toBe(false)
    expect(json.ok).toBe(true)
  })

  it('cheer는 ignore-duplicates, 나머지는 merge-duplicates로 upsert', async () => {
    const f = stubUpstream()
    await POST(req(cheerBody))
    const [url, init] = f.mock.calls[0]
    expect(url).toBe('https://x.supabase.co/rest/v1/people_votes?on_conflict=kind,target,voter_hash,day')
    expect(init.headers.Prefer).toBe('resolution=ignore-duplicates,return=representation')
    await POST(req(JSON.stringify({ kind: 'verdict', target: 'guanyu', option: verdict })))
    const verdictCall = f.mock.calls.find((c) => c[1].body?.includes('"verdict"') && String(c[0]).includes('people_votes'))!
    expect(verdictCall[1].headers.Prefer).toBe('resolution=merge-duplicates,return=representation')
  })

  it('Set-Cookie pv는 쿠키가 없을 때만, 속성은 지정대로', async () => {
    stubUpstream()
    const first = await POST(req(cheerBody))
    const cookie = first.headers.get('set-cookie')!
    expect(cookie).toMatch(/^pv=[0-9a-f-]{36}; HttpOnly; SameSite=Lax; Path=\/api\/people; Max-Age=31536000; Secure$/)
    const second = await POST(req(cheerBody, { cookie: `a=1; pv=${UUID}` }))
    expect(second.status).toBe(200)
    expect(second.headers.get('set-cookie')).toBeNull()
    // 형식이 틀린 쿠키는 없는 것으로 보고 새로 발급
    const third = await POST(req(cheerBody, { cookie: 'pv=bogus' }))
    expect(third.headers.get('set-cookie')).toMatch(/^pv=/)
  })

  it('Supabase로 보낸 본문에 IP·쿠키 값이 없고 voter_hash는 64자 hex', async () => {
    const f = stubUpstream()
    await POST(req(cheerBody, { cookie: `pv=${UUID}` }))
    for (const [, init] of f.mock.calls) {
      const body = String(init.body)
      expect(body).not.toContain(IP)
      expect(body).not.toContain(UUID)
      expect(JSON.stringify(init.headers)).not.toContain(UUID)
    }
    const sent = JSON.parse(f.mock.calls[0][1].body)
    expect(sent.voter_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(sent.day).toBe(kstDay(new Date()))
    expect(Object.keys(sent).sort()).toEqual(['day', 'kind', 'option', 'target', 'voter_hash'])
  })

  it('같은 쿠키·IP면 같은 해시, 쿠키가 다르면 다른 해시', async () => {
    const f = stubUpstream()
    await POST(req(cheerBody, { cookie: `pv=${UUID}` }))
    await POST(req(cheerBody, { cookie: `pv=${UUID}` }))
    await POST(req(cheerBody, { cookie: `pv=${UUID.replace('1111', '9999')}` }))
    const h = f.mock.calls.filter((c) => String(c[0]).includes('people_votes')).map((c) => JSON.parse(c[1].body).voter_hash)
    expect(h[0]).toBe(h[1])
    expect(h[0]).not.toBe(h[2])
  })

  it('응답에 집계가 담긴다 (cheer 합, 대결은 라이벌 쌍만 전달)', async () => {
    const f = stubUpstream([{ id: 1 }], [
      { kind: 'cheer', option: 'cheer', n: 7 },
      { kind: 'verdict', option: verdict, n: 3 },
    ])
    const json = await (await POST(req(cheerBody))).json()
    expect(json.stats).toEqual({ cheer: 7, duel: {}, scene: {}, verdict: { [verdict]: 3 } })
    const rpcCall = f.mock.calls.find((c) => String(c[0]).includes('/rpc/people_stats'))!
    expect(JSON.parse(rpcCall[1].body)).toEqual({ p_id: 'guanyu', p_pair: pairKey('guanyu', p.rivalId) })
  })

  it('대결 투표: page 인물의 집계를 읽는다 (서로 라이벌인 쌍은 양쪽 페이지가 각자 자기 집계)', async () => {
    const [a, b] = ['guanyu', p.rivalId]
    expect(getPerson(b)?.rivalId).toBe(a) // 관우 <-> 조조
    const target = pairKey(a, b)
    for (const page of [a, b]) {
      const f = stubUpstream([{ id: 1 }], [{ kind: 'cheer', option: 'cheer', n: 5 }])
      voteGuard.reset()
      const res = await POST(req(JSON.stringify({ kind: 'duel', target, option: a, page })))
      expect(res.status).toBe(200)
      const rpcCall = f.mock.calls.find((c) => String(c[0]).includes('/rpc/people_stats'))!
      const sent = JSON.parse(rpcCall[1].body)
      expect(sent.p_id).toBe(page)
      expect(sent.p_pair).toBe(target)
      // 저장 본문에 page는 들어가지 않는다
      const row = JSON.parse(f.mock.calls.find((c) => String(c[0]).includes('people_votes'))![1].body)
      expect(Object.keys(row).sort()).toEqual(['day', 'kind', 'option', 'target', 'voter_hash'])
    }
  })

  it('대결 투표: page가 없거나 틀리면 400, 저장·집계 fetch 0회', async () => {
    const f = stubUpstream()
    const target = pairKey('guanyu', p.rivalId)
    for (const extra of [{}, { page: 'nobody' }, { page: notRival }, { page: 7 }, { page: null }]) {
      const res = await POST(req(JSON.stringify({ kind: 'duel', target, option: 'guanyu', ...extra })))
      expect(res.status).toBe(400)
    }
    expect(f).not.toHaveBeenCalled()
  })

  it('다른 종류는 page를 무시하고 target 집계', async () => {
    const f = stubUpstream()
    const res = await POST(req(JSON.stringify({ kind: 'cheer', target: 'guanyu', option: 'cheer', page: 'bogus' })))
    expect(res.status).toBe(200)
    const rpcCall = f.mock.calls.find((c) => String(c[0]).includes('/rpc/people_stats'))!
    expect(JSON.parse(rpcCall[1].body).p_id).toBe('guanyu')
  })

  it('집계 읽기만 실패하면 200 stats:null, 쿠키도 붙는다', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'k')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) =>
        String(url).includes('/rpc/') ? new Response('no', { status: 500 }) : Response.json([{ id: 1 }], { status: 201 }),
      ),
    )
    const res = await POST(req(cheerBody))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, counted: true, stats: null })
    expect(res.headers.get('set-cookie')).toMatch(/^pv=/)
  })

  it('저장 실패 502에도 새 쿠키가 붙는다', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'k')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('no', { status: 500 })))
    const res = await POST(req(cheerBody))
    expect(res.status).toBe(502)
    expect(res.headers.get('set-cookie')).toMatch(/^pv=/)
  })

  it('PEOPLE_VOTE_SECRET가 빈 문자열이면 서비스 키로 대신한다', async () => {
    stubUpstream()
    vi.stubEnv('PEOPLE_VOTE_SECRET', '')
    const f = vi.mocked(fetch)
    const res = await POST(req(cheerBody, { cookie: `pv=${UUID}` }))
    expect(res.status).toBe(200)
    const sent = JSON.parse(String(f.mock.calls[0][1]!.body))
    expect(sent.voter_hash).toBe(await voterHash('k', kstDay(new Date()), UUID, IP))
  })

  it('Content-Type이 application/json이 아니면 415, 크로스 사이트 Origin은 403 (fetch 0회)', async () => {
    const f = stubUpstream()
    expect((await POST(req(cheerBody, { 'content-type': 'text/plain' }))).status).toBe(415)
    expect((await POST(req(cheerBody, { 'content-type': 'application/x-www-form-urlencoded' }))).status).toBe(415)
    const noType = new Request('http://localhost/api/people/vote', { method: 'POST', body: cheerBody, headers: { 'x-forwarded-for': IP } })
    expect((await POST(noType)).status).toBe(415)
    expect((await POST(req(cheerBody, { origin: 'https://evil.example' }))).status).toBe(403)
    expect((await POST(req(cheerBody, { origin: 'null' }))).status).toBe(403)
    expect((await POST(req(cheerBody, { origin: 'https://unse-ai.com.evil.example' }))).status).toBe(403)
    expect(f).not.toHaveBeenCalled()
  })

  it('같은 사이트 Origin과 charset이 붙은 JSON은 통과', async () => {
    const f = stubUpstream()
    for (const origin of ['https://unse-ai.com', 'https://www.unse-ai.com', 'http://localhost:3200', 'http://localhost']) {
      expect((await POST(req(cheerBody, { origin, 'content-type': 'application/json; charset=utf-8' }))).status).toBe(200)
    }
    expect((await POST(req(cheerBody, { origin: 'https://preview.vercel.app', host: 'preview.vercel.app' }))).status).toBe(200)
    expect(f).toHaveBeenCalled()
  })

  it('쿠키가 없으면 해시는 고정값 new|ip, 그래도 새 쿠키는 내려 준다', async () => {
    const f = stubUpstream()
    const a = await POST(req(cheerBody))
    const b = await POST(req(cheerBody))
    expect(a.headers.get('set-cookie')).toMatch(/^pv=[0-9a-f-]{36};/)
    expect(a.headers.get('set-cookie')).not.toBe(b.headers.get('set-cookie'))
    const h = f.mock.calls.filter((c) => String(c[0]).includes('people_votes')).map((c) => JSON.parse(c[1].body).voter_hash)
    expect(h[0]).toBe(h[1])
    expect(h[0]).toBe(await voterHash('k', kstDay(new Date()), 'new', IP))
  })

  it('Supabase 실패는 502, 속도 제한은 429', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'k')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('no', { status: 500 })))
    expect((await POST(req(cheerBody))).status).toBe(502)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')))
    expect((await POST(req(cheerBody))).status).toBe(502)
    voteGuard.reset()
    stubUpstream()
    let last = 200
    for (let i = 0; i < 61; i++) last = (await POST(req(cheerBody))).status
    expect(last).toBe(429)
  })
})

describe('GET /api/people/stats', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })
  const get = (q: string) => GET(new Request(`http://localhost/api/people/stats${q}`))

  it('id 없음·없는 인물 400, env 없음 503', async () => {
    expect((await get('')).status).toBe(400)
    expect((await get('?id=nobody')).status).toBe(400)
    for (const id of ['constructor', '__proto__', 'toString']) expect((await get(`?id=${id}`)).status).toBe(400)
    vi.stubEnv('SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_SERVICE_KEY', '')
    expect((await get('?id=guanyu')).status).toBe(503)
  })
  it('집계와 캐시 헤더, 실패는 502', async () => {
    const pair = pairKey('guanyu', p.rivalId)
    stubUpstream([], [
      { kind: 'cheer', option: 'cheer', n: 2 },
      { kind: 'duel', option: 'guanyu', n: 4 },
      { kind: 'scene', option: sceneKey, n: 1 },
    ])
    const res = await get('?id=guanyu')
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('public, s-maxage=30, stale-while-revalidate=300')
    expect(await res.json()).toEqual({ cheer: 2, duel: { guanyu: 4 }, scene: { [sceneKey]: 1 }, verdict: {} })
    expect(pair).toBeTruthy()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('no', { status: 500 })))
    expect((await get('?id=guanyu')).status).toBe(502)
  })
})

describe('store', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })
  it('storeConfig는 끝 슬래시를 떼고, env 없으면 null', () => {
    vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co//')
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'k')
    expect(storeConfig()).toEqual({ url: 'https://x.supabase.co', key: 'k' })
    vi.stubEnv('SUPABASE_URL', '')
    expect(storeConfig()).toBeNull()
  })
  it('readCheerRanking은 target을 id로 바꾼다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => Response.json([{ target: 'guanyu', n: '5' }, { target: 3, n: 1 }])))
    expect(await readCheerRanking({ url: 'https://x', key: 'k' })).toEqual([{ id: 'guanyu', n: 5 }])
    expect(await readStats({ url: 'https://x', key: 'k' }, 'guanyu')).toEqual({ cheer: 0, duel: {}, scene: {}, verdict: {} })
  })
})

describe('SQL 문서', () => {
  const sql = readFileSync(join(__dirname, '../docs/people-votes.sql'), 'utf8')
  it('테이블·유니크·RLS·함수', () => {
    expect(sql).toContain('unique (kind, target, voter_hash, day)')
    expect(sql).toContain('alter table people_votes enable row level security')
    expect(sql).toContain('function people_stats(p_id text, p_pair text)')
    expect(sql).toContain('function people_cheer_ranking()')
    expect(sql).toContain('Supabase SQL Editor에서 한 번 실행')
  })
})

describe('응원 순위(rank)가 집계에 실린다', () => {
  const stub = (cheer: number, ranking: unknown | 'fail') => {
    vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'k')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        const u = String(url)
        if (u.includes('people_cheer_ranking')) return ranking === 'fail' ? new Response('no', { status: 500 }) : Response.json(ranking)
        if (u.includes('/rpc/')) return Response.json(cheer > 0 ? [{ kind: 'cheer', option: 'cheer', n: cheer }] : [])
        return Response.json([{ id: 1 }], { status: 201 })
      }),
    )
  }
  beforeEach(() => voteGuard.reset())
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })
  const ranking = [{ target: 'caocao', n: 9 }, { target: 'guanyu', n: 7 }, { target: 'liubei', n: 7 }, { target: 'zhangfei', n: 2 }, { target: 'nobody', n: 99 }]

  it('GET stats: 동점은 같은 순위, 열전 없는 id는 세지 않는다', async () => {
    stub(7, ranking)
    const json = await (await GET(new Request('http://localhost/api/people/stats?id=guanyu'))).json()
    expect(json.cheer).toBe(7)
    expect(json.rank).toBe(2)
    // 9, 7, 7, 2 -> 1위, 2위, 2위, 4위
    stub(2, ranking)
    expect((await (await GET(new Request('http://localhost/api/people/stats?id=zhangfei'))).json()).rank).toBe(4)
  })
  it('응원이 0이면 rank 없음', async () => {
    stub(0, ranking)
    const json = await (await GET(new Request('http://localhost/api/people/stats?id=guanyu'))).json()
    expect(json.cheer).toBe(0)
    expect('rank' in json).toBe(false)
  })
  it('순위를 못 읽어도 집계는 그대로(rank 없음)', async () => {
    stub(7, 'fail')
    const res = await GET(new Request('http://localhost/api/people/stats?id=guanyu'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.cheer).toBe(7)
    expect('rank' in json).toBe(false)
  })
  it('POST vote 응답에도 rank가 실린다', async () => {
    stub(7, ranking)
    const json = await (await POST(req(cheerBody))).json()
    expect(json.counted).toBe(true)
    expect(json.stats.cheer).toBe(7)
    expect(json.stats.rank).toBe(2)
  })
})
