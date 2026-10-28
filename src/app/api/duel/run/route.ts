import { NextResponse } from 'next/server';
import { validateRunLog } from '@/lib/duel/runLog';
import { runGuard, clientIp, readLimitedBody } from '@/lib/duel/feedbackGuard';

export async function POST(request: Request) {
  // IP는 속도 제한 판단에만 쓰고 저장·로그·전송하지 않는다
  const ip = clientIp(request.headers);
  if (!runGuard.allowRequest(ip)) return NextResponse.json({ ok: false }, { status: 429 });

  const text = await readLimitedBody(request);
  if (text === null) return NextResponse.json({ ok: false }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const log = validateRunLog(body);
  if (!log) return NextResponse.json({ ok: false }, { status: 400 });

  // 설정이 없으면 기록만 꺼진다(게임 흐름에는 영향 없음). 꺼진 상태의 요청은 한도에서 돌려준다.
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    runGuard.refundRequest(ip);
    return NextResponse.json({ ok: false, reason: 'disabled' }, { status: 503 });
  }

  // 같은 판(runId)은 이 인스턴스 안에서 한 번만 받는다
  if (!runGuard.claimRunId(log.runId)) return NextResponse.json({ ok: false }, { status: 409 });

  // DB 열 이름으로 바꿔 보낸다. runId·IP·UA는 저장하지 않는다. 본문·키는 로그에 남기지 않는다.
  const row = {
    version: log.version,
    starter: log.starter,
    reached_wave: log.reachedWave,
    cleared: log.cleared,
    last_enemy: log.lastEnemy,
    turns: log.turns,
    duration_bucket: log.durationBucket,
    rewards: log.rewards,
    recruits: log.recruits,
    device: log.device,
    resumed: log.resumed,
  };
  try {
    const res = await fetch(`${url}/rest/v1/duel_runs`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      runGuard.releaseRunId(log.runId);
      return NextResponse.json({ ok: false }, { status: 502 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    runGuard.releaseRunId(log.runId);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
