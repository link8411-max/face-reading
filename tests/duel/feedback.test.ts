import { describe, it, expect, vi, afterEach } from 'vitest';
import { validateFeedback } from '@/lib/duel/feedback';
import { POST } from '@/app/api/duel/feedback/route';

const ok = { rating: 4, note: '재밌어요', wave: 5, starter: 'guanyu', cleared: false, device: 'mobile' };

describe('validateFeedback', () => {
  it('정상 본문 통과', () => {
    expect(validateFeedback(ok)).toEqual(ok);
  });
  it('rating 범위 밖·비정수는 null', () => {
    expect(validateFeedback({ ...ok, rating: 6 })).toBeNull();
    expect(validateFeedback({ ...ok, rating: 0 })).toBeNull();
    expect(validateFeedback({ ...ok, rating: 2.5 })).toBeNull();
  });
  it('note 201자는 200자로 잘리고 trim, 생략하면 빈 문자열', () => {
    expect(validateFeedback({ ...ok, note: 'a'.repeat(201) })?.note).toHaveLength(200);
    expect(validateFeedback({ ...ok, note: '  hi  ' })?.note).toBe('hi');
    const { note: _n, ...rest } = ok;
    void _n;
    expect(validateFeedback(rest)?.note).toBe('');
  });
  it('wave 범위 검사', () => {
    expect(validateFeedback({ ...ok, wave: 0 })).toBeNull();
    expect(validateFeedback({ ...ok, wave: 19 })).toBeNull();
    expect(validateFeedback({ ...ok, wave: 18 })).not.toBeNull();
  });
  it('알 수 없는 starter는 null', () => {
    expect(validateFeedback({ ...ok, starter: 'caocao' })).toBeNull();
    expect(validateFeedback({ ...ok, starter: 'mob' })).toBeNull();
  });
  it('device 잘못되면 null, cleared 비불리언이면 null', () => {
    expect(validateFeedback({ ...ok, device: 'tv' })).toBeNull();
    expect(validateFeedback({ ...ok, cleared: 'true' })).toBeNull();
  });
  it('추가 키는 버려진다', () => {
    const r = validateFeedback({ ...ok, ip: '1.2.3.4' });
    expect(r).toEqual(ok);
    expect(r && 'ip' in r).toBe(false);
  });
  it('객체가 아니면 null', () => {
    expect(validateFeedback(null)).toBeNull();
    expect(validateFeedback('x')).toBeNull();
  });
});

const req = (body: string) => new Request('http://localhost/api/duel/feedback', { method: 'POST', body });

describe('POST /api/duel/feedback', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('깨진 JSON은 400', async () => {
    expect((await POST(req('{'))).status).toBe(400);
  });
  it('검증 실패는 400', async () => {
    expect((await POST(req('{}'))).status).toBe(400);
  });
  it('env 없으면 503 disabled', async () => {
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_KEY', '');
    const res = await POST(req(JSON.stringify(ok)));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, reason: 'disabled' });
  });
  it('업스트림 201이면 201, 500이면 502, throw도 502', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'k');
    const f = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', f);
    const res = await POST(req(JSON.stringify(ok)));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    expect(f.mock.calls[0][0]).toBe('https://x.supabase.co/rest/v1/duel_feedback');
    f.mockResolvedValue(new Response(null, { status: 500 }));
    expect((await POST(req(JSON.stringify(ok)))).status).toBe(502);
    f.mockRejectedValue(new Error('boom'));
    expect((await POST(req(JSON.stringify(ok)))).status).toBe(502);
  });
});
