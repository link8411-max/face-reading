import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { boardPool } from '@/lib/cup/boards'
import { cupGuard, cupRow, validateCupVote } from '@/lib/cup/votes'
import { voteGuard, kstDay } from '@/lib/people/votes'
import { readCupPair, readCupSummary } from '@/lib/people/store'
import { POST } from '@/app/api/people/cup/route'
import { POST as VOTE_POST } from '@/app/api/people/vote/route'

const IP = '203.0.113.88'
const match = { type: 'match', board: 'warrior', a: 'lvbu', b: 'guanyu', pick: 'lvbu' }

describe('validateCupVote', () => {
  it('정상 match·win', () => {
    expect(validateCupVote(match)).toEqual(match)
    expect(validateCupVote({ type: 'win', board: 'warrior', id: 'lvbu' })).toEqual({ type: 'win', board: 'warrior', id: 'lvbu' })
  })
  it('잘못된 판 키·판에 없는 인물', () => {
    expect(validateCupVote({ ...match, board: '__proto__' })).toBeNull()
    expect(validateCupVote({ ...match, board: 'x' })).toBeNull()
    expect(boardPool('warrior')).not.toContain('zhugeliang')
    expect(validateCupVote({ ...match, b: 'zhugeliang' })).toBeNull()
    expect(validateCupVote({ type: 'win', board: 'warrior', id: 'zhugeliang' })).toBeNull()
  })
  it('a===b, pick이 둘 밖, 배열·null', () => {
    expect(validateCupVote({ ...match, b: 'lvbu' })).toBeNull()
    expect(validateCupVote({ ...match, pick: 'zhangfei' })).toBeNull()
    expect(validateCupVote({ ...match, pick: 3 })).toBeNull()
    expect(validateCupVote([match])).toBeNull()
    expect(validateCupVote(null)).toBeNull()
    expect(validateCupVote({ ...match, type: 'x' })).toBeNull()
  })
})

describe('cupRow', () => {
  it('match는 쌍 키·고른 id, win은 판 키·우승 id', () => {
    expect(cupRow(match as never)).toEqual({ kind: 'cup_match', target: 'guanyu__lvbu', option: 'lvbu' })
    expect(cupRow({ type: 'win', board: 'warrior', id: 'lvbu' })).toEqual({ kind: 'cup_win', target: 'warrior', option: 'lvbu' })
  })
})

const req = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/people/cup', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'x-forwarded-for': IP, 'content-type': 'application/json', ...headers },
  })

const stubUpstream = (pairRows: unknown = [], opts: { rpcFail?: boolean } = {}) => {
  vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co/')
  vi.stubEnv('SUPABASE_SERVICE_KEY', 'k')
  const f = vi.fn().mockImplementation(async (url: string) => {
    if (String(url).includes('/rpc/')) return opts.rpcFail ? new Response('x', { status: 500 }) : Response.json(pairRows)
    return Response.json([{ id: 1 }], { status: 201 })
  })
  vi.stubGlobal('fetch', f)
  return f
}

describe('POST /api/people/cup', () => {
  beforeEach(() => {
    cupGuard.reset()
    voteGuard.reset()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('env 없으면 503이고 그 요청은 한도에서 빠진다', async () => {
    vi.stubEnv('SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_SERVICE_KEY', '')
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    for (let i = 0; i < 205; i++) expect((await POST(req(match))).status).toBe(503)
    expect(f).not.toHaveBeenCalled()
  })

  it('Origin이 다른 사이트면 403, text/plain이면 415', async () => {
    stubUpstream()
    expect((await POST(req(match, { origin: 'https://evil.example' }))).status).toBe(403)
    expect((await POST(req(match, { 'content-type': 'text/plain' }))).status).toBe(415)
  })

  it('깨진 JSON·검증 실패는 400, 큰 본문은 413', async () => {
    const f = stubUpstream()
    expect((await POST(req('{'))).status).toBe(400)
    expect((await POST(req({ ...match, pick: 'x' }))).status).toBe(400)
    expect((await POST(req('x'.repeat(5000)))).status).toBe(413)
    expect(f).not.toHaveBeenCalled()
  })

  it('match: 쌍 집계에서 내 표 1개를 뺀 others', async () => {
    const f = stubUpstream([{ option: 'lvbu', n: 4 }, { option: 'guanyu', n: 1 }])
    const res = await POST(req(match))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, counted: true, others: { lvbu: 3, guanyu: 1 } })
    const ins = f.mock.calls.find((c) => String(c[0]).includes('people_votes'))!
    const row = JSON.parse(ins[1].body)
    expect(row).toMatchObject({ kind: 'cup_match', target: 'guanyu__lvbu', option: 'lvbu' })
    expect(row.day).toBe(kstDay(new Date()))
    const rpc = f.mock.calls.find((c) => String(c[0]).includes('/rpc/cup_pair_stats'))!
    expect(JSON.parse(rpc[1].body)).toEqual({ p_pair: 'guanyu__lvbu' })
  })

  it('match: 집계가 비어 있어도 0 아래로 내려가지 않는다', async () => {
    stubUpstream([])
    expect((await (await POST(req(match))).json()).others).toEqual({ lvbu: 0 })
  })

  it('match: 집계 읽기 실패면 200에 others null', async () => {
    stubUpstream([], { rpcFail: true })
    const res = await POST(req(match))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, counted: true, others: null })
  })

  it('win: 저장하고 { ok: true }, 집계는 읽지 않는다', async () => {
    const f = stubUpstream()
    const res = await POST(req({ type: 'win', board: 'warrior', id: 'lvbu' }))
    expect(await res.json()).toEqual({ ok: true })
    expect(f.mock.calls.some((c) => String(c[0]).includes('/rpc/'))).toBe(false)
    expect(JSON.parse(f.mock.calls[0][1].body)).toMatchObject({ kind: 'cup_win', target: 'warrior', option: 'lvbu' })
  })

  it('저장 실패는 502', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'k')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('x', { status: 500 })))
    expect((await POST(req(match))).status).toBe(502)
  })

  it('쿠키 없는 요청은 pv 쿠키를 받고 같은 IP는 같은 값', async () => {
    stubUpstream()
    const a = (await POST(req(match))).headers.get('set-cookie')!
    const b = (await POST(req(match))).headers.get('set-cookie')!
    expect(a).toMatch(/^pv=[^;]+; .*Path=\/api\/people;/)
    expect(a).toBe(b)
    // 받은 쿠키를 보내면 다시 발급하지 않는다
    const cookie = a.split(';')[0]
    expect((await POST(req(match, { cookie }))).headers.get('set-cookie')).toBeNull()
  })

  it('속도 제한: 201번째 429, 열전 한도와 나뉜다', async () => {
    stubUpstream()
    for (let i = 0; i < 200; i++) expect((await POST(req(match))).status).toBe(200)
    expect((await POST(req(match))).status).toBe(429)
    const cheer = JSON.stringify({ kind: 'cheer', target: 'guanyu', option: 'cheer' })
    const res = await VOTE_POST(
      new Request('http://localhost/api/people/vote', {
        method: 'POST',
        body: cheer,
        headers: { 'x-forwarded-for': IP, 'content-type': 'application/json' },
      }),
    )
    expect(res.status).toBe(200)
  })
})

describe('store: 월드컵 읽기', () => {
  afterEach(() => vi.unstubAllGlobals())
  const cfg = { url: 'https://x.supabase.co', key: 'k' }
  const stub = (byName: Record<string, unknown>) =>
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => Response.json(byName[String(url).split('/rpc/')[1]] ?? [])),
    )

  it('readCupPair', async () => {
    stub({ cup_pair_stats: [{ option: 'lvbu', n: '4' }, { option: 5, n: 1 }, { option: 'x', n: 'z' }] })
    expect(await readCupPair(cfg, 'guanyu__lvbu')).toEqual({ lvbu: 4 })
  })

  it('readCupSummary: 판별 정렬·합, 모르는 판은 무시', async () => {
    stub({
      cup_win_counts: [
        { target: 'warrior', option: 'zhaoyun', n: 2 },
        { target: 'warrior', option: 'lvbu', n: 5 },
        { target: 'warrior', option: 'guanyu', n: 2 },
        { target: 'women', option: 'diaochan', n: 1 },
        { target: '__proto__', option: 'x', n: 9 },
        { target: 'random', option: 'x', n: 'bad' },
      ],
      cup_match_wins: [{ option: 'guanyu', n: 3 }, { option: 'lvbu', n: 7 }],
    })
    const s = await readCupSummary(cfg)
    expect(s.wins.warrior).toEqual([{ id: 'lvbu', n: 5 }, { id: 'guanyu', n: 2 }, { id: 'zhaoyun', n: 2 }])
    expect(s.plays).toEqual({ warrior: 9, strategist: 0, women: 1, random: 0 })
    expect(s.wins.strategist).toEqual([])
    expect(s.matchWins).toEqual([{ id: 'lvbu', n: 7 }, { id: 'guanyu', n: 3 }])
  })
})
