import { NextResponse } from 'next/server';
import { validateFeedback } from '@/lib/duel/feedback';
import { allowRequest, refundRequest, claimRunId, clientIp, parseRunId, readLimitedBody, releaseRunId } from '@/lib/duel/feedbackGuard';

export async function POST(request: Request) {
  // IP는 속도 제한 판단에만 쓰고 저장·로그·전송하지 않는다
  const ip = clientIp(request.headers);
  if (!allowRequest(ip)) return NextResponse.json({ ok: false }, { status: 429 });

  const text = await readLimitedBody(request);
  if (text === null) return NextResponse.json({ ok: false }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const feedback = validateFeedback(body);
  if (!feedback) return NextResponse.json({ ok: false }, { status: 400 });

  const runId = parseRunId(body);
  if (runId === 'invalid') return NextResponse.json({ ok: false }, { status: 400 });

  // 설정이 없으면 피드백만 꺼진다(게임 흐름에는 영향 없음). 꺼진 상태의 요청은 한도에서 돌려준다.
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, ''); // 끝 슬래시 정규화
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    refundRequest(ip);
    return NextResponse.json({ ok: false, reason: 'disabled' }, { status: 503 });
  }

  // 같은 판(runId)은 이 인스턴스 안에서 한 번만 보낸다
  if (runId && !claimRunId(runId)) return NextResponse.json({ ok: false }, { status: 409 });

  try {
    // IP·UA·runId는 저장하지 않는다. 본문·키는 로그에 남기지 않는다.
    const res = await fetch(`${url}/rest/v1/duel_feedback`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(feedback),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      if (runId) releaseRunId(runId);
      return NextResponse.json({ ok: false }, { status: 502 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    if (runId) releaseRunId(runId);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
