import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { validateFeedback, makeRunId } from '@/lib/duel/feedback';
import { __resetFeedbackLimits } from '@/lib/duel/feedbackGuard';
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
    expect(validateFeedback({ ...ok, wave: 37 })).toBeNull();
    expect(validateFeedback({ ...ok, wave: 36 })).not.toBeNull();
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

describe('makeRunId', () => {
  it('같은 입력은 같은 id, 다르면 다른 id, 영문·숫자 32자 이하', () => {
    expect(makeRunId(123, 'guanyu', 9)).toBe(makeRunId(123, 'guanyu', 9));
    expect(makeRunId(123, 'guanyu', 9)).not.toBe(makeRunId(124, 'guanyu', 9));
    expect(makeRunId(123, 'guanyu', 9)).toMatch(/^[A-Za-z0-9]{1,32}$/);
  });
});

const req = (body: string, headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/duel/feedback', { method: 'POST', body, headers });

describe('POST /api/duel/feedback', () => {
  beforeEach(() => __resetFeedbackLimits());
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

  describe('보호 장치', () => {
    const stubUpstream = () => {
      vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
      vi.stubEnv('SUPABASE_SERVICE_KEY', 'k');
      const f = vi.fn().mockImplementation(async () => new Response(null, { status: 201 }));
      vi.stubGlobal('fetch', f);
      return f;
    };

    it('Content-Length가 2KB 넘으면 413', async () => {
      const f = stubUpstream();
      const big = JSON.stringify({ ...ok, note: 'a'.repeat(3000) });
      const res = await POST(req(big, { 'content-length': String(big.length) }));
      expect(res.status).toBe(413);
      expect(f).not.toHaveBeenCalled();
    });
    it('Content-Length 헤더가 없어도 읽다가 2KB에서 끊고 413', async () => {
      const f = stubUpstream();
      const big = JSON.stringify({ ...ok, note: 'a'.repeat(3000) });
      expect((await POST(req(big))).status).toBe(413);
      expect(f).not.toHaveBeenCalled();
    });
    it('같은 IP 6번째 요청은 429, 다른 IP는 영향 없음', async () => {
      stubUpstream();
      const h = { 'x-forwarded-for': '1.1.1.1, 9.9.9.9' };
      for (let i = 0; i < 5; i++) expect((await POST(req(JSON.stringify(ok), h))).status).toBe(201);
      expect((await POST(req(JSON.stringify(ok), h))).status).toBe(429);
      expect((await POST(req(JSON.stringify(ok), { 'x-forwarded-for': '2.2.2.2' }))).status).toBe(201);
    });
    it('x-forwarded-for가 없으면 x-real-ip로 제한한다', async () => {
      stubUpstream();
      const h = { 'x-real-ip': '3.3.3.3' };
      for (let i = 0; i < 5; i++) await POST(req(JSON.stringify(ok), h));
      expect((await POST(req(JSON.stringify(ok), h))).status).toBe(429);
    });
    it('같은 runId는 한 번만 insert, 두 번째는 409', async () => {
      const f = stubUpstream();
      const body = JSON.stringify({ ...ok, runId: 'abc123' });
      expect((await POST(req(body))).status).toBe(201);
      expect((await POST(req(body))).status).toBe(409);
      expect(f).toHaveBeenCalledTimes(1);
    });
    it('잘못된 runId(특수문자·33자)는 400, upstream으로 runId를 보내지 않는다', async () => {
      const f = stubUpstream();
      expect((await POST(req(JSON.stringify({ ...ok, runId: 'a-b' })))).status).toBe(400);
      expect((await POST(req(JSON.stringify({ ...ok, runId: 'a'.repeat(33) })))).status).toBe(400);
      expect((await POST(req(JSON.stringify({ ...ok, runId: 'okId1' })))).status).toBe(201);
      expect(JSON.parse(f.mock.calls[0][1].body)).toEqual(ok);
    });
    it('업스트림 실패한 runId는 재시도 가능', async () => {
      const f = stubUpstream();
      f.mockResolvedValueOnce(new Response(null, { status: 500 }));
      const body = JSON.stringify({ ...ok, runId: 'retry1' });
      expect((await POST(req(body))).status).toBe(502);
      expect((await POST(req(body))).status).toBe(201);
    });
  });
});
