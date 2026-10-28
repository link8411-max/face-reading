import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { POST } from '@/app/api/duel/run/route';
import { runGuard } from '@/lib/duel/feedbackGuard';

const ok = {
  runId: 'abc123',
  version: 'a1b2c3d4',
  starter: 'guanyu',
  reachedWave: 12,
  cleared: false,
  lastEnemy: 'xiaohoudun',
  turns: 80,
  durationBucket: '10-30m',
  rewards: ['sword', 'potion'],
  recruits: ['machao'],
  device: 'mobile',
  resumed: false,
};
const req = (body: string, headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/duel/run', { method: 'POST', body, headers });
const withId = (id: string) => JSON.stringify({ ...ok, runId: id });

const stubUpstream = () => {
  vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co/');
  vi.stubEnv('SUPABASE_SERVICE_KEY', 'k');
  const f = vi.fn().mockImplementation(async () => new Response(null, { status: 201 }));
  vi.stubGlobal('fetch', f);
  return f;
};

describe('POST /api/duel/run', () => {
  beforeEach(() => runGuard.reset());
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('깨진 JSON·검증 실패는 400', async () => {
    expect((await POST(req('{'))).status).toBe(400);
    expect((await POST(req('{}'))).status).toBe(400);
    expect((await POST(req(JSON.stringify({ ...ok, reachedWave: 99 })))).status).toBe(400);
  });
  it('env 없으면 503 disabled', async () => {
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_KEY', '');
    const res = await POST(req(JSON.stringify(ok)));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, reason: 'disabled' });
  });
  it('201이면 duel_runs에 열 이름을 바꿔 insert하고 runId는 보내지 않는다', async () => {
    const f = stubUpstream();
    const res = await POST(req(JSON.stringify({ ...ok, ip: '1.2.3.4' })));
    expect(res.status).toBe(201);
    expect(f.mock.calls[0][0]).toBe('https://x.supabase.co/rest/v1/duel_runs');
    const sent = JSON.parse(f.mock.calls[0][1].body);
    expect(sent).toEqual({
      version: 'a1b2c3d4',
      starter: 'guanyu',
      reached_wave: 12,
      cleared: false,
      last_enemy: 'xiaohoudun',
      turns: 80,
      duration_bucket: '10-30m',
      rewards: ['sword', 'potion'],
      recruits: ['machao'],
      device: 'mobile',
      resumed: false,
    });
  });
  it('업스트림 500·throw는 502이고 같은 runId로 재시도할 수 있다', async () => {
    const f = stubUpstream();
    f.mockResolvedValueOnce(new Response(null, { status: 500 }));
    expect((await POST(req(JSON.stringify(ok)))).status).toBe(502);
    f.mockRejectedValueOnce(new Error('boom'));
    expect((await POST(req(JSON.stringify(ok)))).status).toBe(502);
    expect((await POST(req(JSON.stringify(ok)))).status).toBe(201);
  });
  it('Content-Length가 2KB 넘으면 413, 헤더가 없어도 읽다가 끊는다', async () => {
    const f = stubUpstream();
    const big = JSON.stringify({ ...ok, junk: 'a'.repeat(3000) });
    expect((await POST(req(big, { 'content-length': String(big.length) }))).status).toBe(413);
    expect((await POST(req(big))).status).toBe(413);
    expect(f).not.toHaveBeenCalled();
  });
  it('같은 IP 11번째 요청은 429, 다른 IP는 영향 없음', async () => {
    stubUpstream();
    const h = { 'x-forwarded-for': '1.1.1.1, 9.9.9.9' };
    for (let i = 0; i < 10; i++) expect((await POST(req(withId(`id${i}`), h))).status).toBe(201);
    expect((await POST(req(withId('id10'), h))).status).toBe(429);
    expect((await POST(req(withId('other'), { 'x-forwarded-for': '2.2.2.2' }))).status).toBe(201);
  });
  it('같은 runId는 한 번만 insert, 두 번째는 409', async () => {
    const f = stubUpstream();
    expect((await POST(req(JSON.stringify(ok)))).status).toBe(201);
    expect((await POST(req(JSON.stringify(ok)))).status).toBe(409);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('503 disabled는 한도를 쓰지 않는다', async () => {
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_KEY', '');
    const h = { 'x-forwarded-for': '4.4.4.4' };
    for (let i = 0; i < 12; i++) expect((await POST(req(withId(`d${i}`), h))).status).toBe(503);
  });
});
