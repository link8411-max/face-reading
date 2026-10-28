// 피드백 API 보호: 본문 크기, IP별 속도 제한, 같은 판 중복 제출 방지.
// 상태는 서버 인스턴스 메모리에만 둔다(서버리스면 인스턴스별). IP는 저장·로그하지 않고 DB로도 보내지 않는다.

/** 본문 최대 바이트 */
export const MAX_BODY_BYTES = 2048;
/** 속도 제한: 10분에 5회 */
export const RATE_WINDOW_MS = 10 * 60 * 1000;
export const RATE_MAX = 5;
const MAX_TRACKED = 5000;

const hits = new Map<string, number[]>();
const runIds = new Set<string>();

// 테스트 전용: 속도 제한·runId 기록을 비운다
export function __resetFeedbackLimits(): void {
  hits.clear();
  runIds.clear();
}

/** 요청 헤더에서 클라이언트 IP: x-forwarded-for 첫 값, 없으면 x-real-ip */
export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return xff || headers.get('x-real-ip')?.trim() || 'unknown';
}

/** 요청 1건을 센다. 한도를 넘으면 false */
export function allowRequest(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > MAX_TRACKED) {
    // 오래된 항목 정리: 창을 벗어난 IP부터 지우고, 그래도 넘치면 가장 오래된 것부터
    for (const [k, v] of hits) if (now - v[v.length - 1] >= RATE_WINDOW_MS) hits.delete(k);
    for (const k of hits.keys()) {
      if (hits.size <= MAX_TRACKED) break;
      hits.delete(k);
    }
  }
  return true;
}

/** 선택 항목 runId 검증: 없으면 null(통과), 영문·숫자 32자 이하만 허용, 그 외는 'invalid' */
export function parseRunId(body: unknown): string | null | 'invalid' {
  if (typeof body !== 'object' || body === null) return null;
  const v = (body as Record<string, unknown>).runId;
  if (v === undefined) return null;
  return typeof v === 'string' && /^[A-Za-z0-9]{1,32}$/.test(v) ? v : 'invalid';
}

/** runId 선점. 이미 있으면 false(중복) */
export function claimRunId(id: string): boolean {
  if (runIds.has(id)) return false;
  if (runIds.size >= MAX_TRACKED) runIds.delete(runIds.values().next().value as string);
  runIds.add(id);
  return true;
}

/** 업스트림 실패 시 재시도할 수 있게 선점을 되돌린다 */
export function releaseRunId(id: string): void {
  runIds.delete(id);
}

/** 본문을 읽되 MAX_BODY_BYTES를 넘으면 null(413). Content-Length가 있으면 먼저 거른다 */
export async function readLimitedBody(request: Request): Promise<string | null> {
  const len = request.headers.get('content-length');
  if (len !== null && Number(len) > MAX_BODY_BYTES) return null;
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    all.set(c, off);
    off += c.byteLength;
  }
  return new TextDecoder().decode(all);
}
