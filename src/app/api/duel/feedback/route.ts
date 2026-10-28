import { NextResponse } from 'next/server';
import { validateFeedback } from '@/lib/duel/feedback';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const feedback = validateFeedback(body);
  if (!feedback) return NextResponse.json({ ok: false }, { status: 400 });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  // 설정이 없으면 피드백만 꺼진다(게임 흐름에는 영향 없음)
  if (!url || !key) return NextResponse.json({ ok: false, reason: 'disabled' }, { status: 503 });

  try {
    // IP·UA는 저장하지 않는다. 본문·키는 로그에 남기지 않는다.
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
    if (!res.ok) return NextResponse.json({ ok: false }, { status: 502 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
