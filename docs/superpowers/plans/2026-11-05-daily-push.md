# 아침 운세 웹 푸시 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** /fortune/daily 결과 화면에서 한 번 구독하면 매일 08:30 KST에 자기 년주의 오늘 운세가 웹 푸시로 오고, 누르면 결과 화면이 바로 뜬다.

**Architecture:** 구독은 브라우저 `PushManager` + VAPID → `/api/push/subscribe` → Supabase `push_subscriptions`(endpoint·키·년주만). 발송은 Supabase pg_cron이 `/api/push/send`를 호출하면 서버가 년주별로 `dailyFortune({kind:'년주'})`를 계산해 `web-push`로 보낸다. 서비스워커가 알림을 띄우고 클릭 시 `/fortune/daily?gz=경오`를 연다. 발송 로직은 sender를 주입받는 순수 함수로 두어 테스트한다.

**Tech Stack:** Next.js 16 App Router(Node 런타임), `web-push@3.6.7`, Supabase PostgREST(service key, 기존 `people/store.ts` 방식), pg_cron + pg_net, sharp(이미 설치됨), vitest.

**Spec:** `docs/superpowers/specs/2026-11-05-daily-push-design.md` (문구·상태표·SQL·정책의 출처. 구현자는 스펙 문장을 그대로 쓴다.)

## Global Constraints

- 서버에 생년·IP·UA를 저장하지 않는다. 로그에 endpoint·키를 출력하지 않는다(개수만).
- "오늘"은 `kstDate(now)`. 같은 endpoint에 같은 날 두 번 보내지 않는다(`last_sent_on`).
- `/api/push/send`: `Authorization: Bearer ${PUSH_CRON_SECRET}` 아니면 401. `runtime = 'nodejs'`, `maxDuration = 60`, 45초 지나면 멈춤. 한 번에 최대 1,000건, `created_at` 오름차순, 동시 20.
- 발송 결과: 성공 → `last_sent_on = today, fail_count = 0`; 404·410 → 삭제; 그 외 실패 → `fail_count + 1`, 5 이상이면 삭제. TTL 14400초, urgency `normal`.
- 알림: 제목 `{띠이모지} {년주}년 {띠}띠 오늘 운세 {★별점☆}`, 본문 `{한마디}\n행운 시간 {행운.시간}`, `tag: 'daily-fortune'`, `renotify: true`, url `/fortune/daily?gz={년주}&utm_source=push&utm_medium=web_push&utm_campaign=daily`(gz는 encodeURIComponent).
- endpoint 허용 호스트: `fcm.googleapis.com`, `*.push.services.mozilla.com`, `web.push.apple.com`, `*.notify.windows.com`, `*.push.samsungosp.com`. https만, 2048자 이내. ganji는 `육십갑자` 60개 중 하나.
- 버튼 상태 판정 순서: 카카오톡 인앱 → iOS 미설치 → 지원 안 함(PushManager/serviceWorker/공개키 없음) → 차단됨 → 미구독 → 구독 중. 문구는 스펙 표 그대로.
- 알림 권한은 버튼을 누를 때만 요청한다.
- 제목(h1~h3)·버튼·링크에 이모지 금지(알림 제목은 예외). `no-screenshot`으로 캡처 제외. 디자인 토큰은 CLAUDE.md.
- 환경변수: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `PUSH_CRON_SECRET`, 기존 `SUPABASE_URL`·`SUPABASE_SERVICE_KEY`. 없으면 구독 버튼은 숨기고 API는 503.
- 실제 Supabase에 SQL을 실행하거나 환경변수를 넣는 일은 구현 Task에 없다(컨트롤러가 사용자 승인 뒤 한다).

## Review Focus

1. 같은 날 두 번 호출(08:30·08:45)해도 두 번째는 0건 — Task 2 테스트.
2. 한 endpoint의 년주를 바꿔 다시 구독하면 `last_sent_on`이 유지되고 년주만 바뀜 — Task 3 테스트(upsert 본문에 `last_sent_on` 없음).
3. `?gz=`에 잘못된 글자(`gz=가나`, `gz=경`)가 오면 조용히 무시하고 입력 화면 — Task 1 테스트.
4. 푸시 데이터가 깨져도 알림은 반드시 뜸(기본 알림) — Task 5 소스 테스트.
5. KST 자정 직전(23:59)에 발송이 돌면 어제 날짜로 기록되지 않음(`kstDate(now)` 사용) — Task 2 테스트.

---

### Task 1: 엔진 년주 모드 + `/fortune/daily?gz=`

**Files:**
- Modify: `src/lib/dailyEngine/index.ts` (`DailyInput`, `dailyFortune`)
- Modify: `src/app/fortune/daily/page.tsx:55-66` (쿼리 읽기)
- Modify: `src/components/fortune/DailyFortuneCard.tsx` (birthYearLabel이 null이면 no-screenshot 줄 생략 — 이미 그렇게 돼 있으면 변경 없음)
- Test: `tests/dailyEngine/engine.test.ts`(추가), `tests/dailyEngine/dailyPage.test.tsx`(추가)

**Interfaces:**
- Produces: `DailyInput`에 `{ kind: '년주'; 천간: string; 지지: string }` 추가. `dailyFortune({ kind: '년주', 천간: '경', 지지: '오' }, D)` → `나 = { 띠: '말', 띠이모지: '🐎', 지지: '오', 천간: '경', 년주표기: '경오' }`, 나머지는 년생 1990과 동일. 모르는 글자 → `throw new Error('모르는 년주: ' + 천간 + 지지)`.
- Page: `gz`(2글자, 천간+지지)가 있으면 바로 `dailyFortune({kind:'년주',…})` 결과를 보이고 `birthYearLabel = null`; `year`와 둘 다 있으면 `year` 우선; 읽은 뒤 `gz`도 `year`/`early`와 함께 지운다(utm 유지). 자정 넘김 갱신(`live` ref)은 년주 입력도 다시 계산할 수 있게 ref에 `input: DailyInput`을 보관한다.

- [ ] **Step 1: 실패하는 테스트** — `tests/dailyEngine/engine.test.ts`에 추가

```ts
test('년주 모드: 경오 = 1990년생과 같은 결과, 생년 없음', () => {
  const a = dailyFortune({ kind: '년주', 천간: '경', 지지: '오' }, D)
  const b = dailyFortune({ kind: '년생', year: 1990, isEarlyYear: false }, D)
  expect(a).toEqual(b)
  expect(a.나).toEqual({ 띠: '말', 띠이모지: '🐎', 지지: '오', 천간: '경', 년주표기: '경오' })
  expect(() => dailyFortune({ kind: '년주', 천간: '가', 지지: '오' }, D)).toThrow('모르는 년주')
  expect(() => dailyFortune({ kind: '년주', 천간: '경', 지지: '나' }, D)).toThrow('모르는 년주')
})
```

`tests/dailyEngine/dailyPage.test.tsx`에 추가:

```ts
test('페이지: gz 쿼리로 년주 모드, 잘못된 gz는 무시, gz도 주소에서 지운다', () => {
  const src = readFileSync('src/app/fortune/daily/page.tsx', 'utf8')
  expect(src).toContain('q.get("gz")')
  expect(src).toContain('q.delete("gz")')
  expect(src).toContain("kind: '년주'")
  expect(src).toMatch(/length === 2|\/\^\[가-힣\]\{2\}\$\//)
})
```

- [ ] **Step 2: 실패 확인** — `npx vitest run tests/dailyEngine` → FAIL
- [ ] **Step 3: 구현** — 엔진: 년주 분기에서 `천간`·`지지` 배열 인덱스로 검증, `띠동물[i]`·`띠이모지[i]`로 채움. 페이지: 쿼리 처리 효과에서 `gz`를 먼저 읽어 2글자이고 엔진이 throw하지 않으면 결과 세팅(try/catch로 무시), `year`가 있으면 그쪽 우선. GA는 `result_view`만(`fortune_submit`은 사용자가 입력했을 때만, 내 판단: 푸시 착지는 제출이 아니다). 착지 시 `utm_source=push`면 `track('shared_landing', { test_name: 'daily', result_id: 'push' })`.
- [ ] **Step 4: 통과 확인** — `npx vitest run tests/dailyEngine && npx tsc --noEmit -p .`
- [ ] **Step 5: Commit** — `feat(daily): 년주 모드와 ?gz= 착지(푸시 클릭용)`

---

### Task 2: 발송 모듈 + SQL 문서

**Files:**
- Create: `src/lib/push/text.ts`, `src/lib/push/validate.ts`, `src/lib/push/store.ts`, `src/lib/push/send.ts`, `docs/push-subscriptions.sql`
- Modify: `package.json` (`web-push` 의존성, `@types/web-push` devDependency)
- Test: `tests/push/text.test.ts`, `tests/push/validate.test.ts`, `tests/push/send.test.ts`

**Interfaces:**
```ts
// text.ts
export interface PushPayload { title: string; body: string; url: string; tag: 'daily-fortune' }
export function buildPayload(f: DailyFortune): PushPayload   // 규칙은 Global Constraints
// validate.ts
export const ALLOWED_PUSH_HOSTS: readonly string[]            // 스펙 5종(와일드카드는 suffix 비교)
export function isAllowedEndpoint(endpoint: string): boolean  // https, ≤2048, 호스트 허용
export function isGanji(s: unknown): s is string              // 육십갑자 60개
export interface SubscribeBody { endpoint: string; keys: { p256dh: string; auth: string }; ganji: string }
export function parseSubscribeBody(body: unknown): SubscribeBody | null  // 키는 비어 있지 않은 문자열 ≤ 512자
// store.ts  (people/store.ts와 같은 PostgREST 방식, 5초 타임아웃, storeConfig() 재사용)
export interface SubRow { endpoint: string; p256dh: string; auth: string; ganji: string }
export function upsertSubscription(cfg: StoreConfig, row: SubRow): Promise<void>   // on_conflict=endpoint, merge-duplicates, 본문에 last_sent_on 없음
export function deleteSubscription(cfg: StoreConfig, endpoint: string): Promise<void>
export function listPending(cfg: StoreConfig, today: string, limit: number): Promise<SubRow[]>  // or=(last_sent_on.is.null,last_sent_on.lt.today) order=created_at.asc
export function markSent(cfg: StoreConfig, endpoints: string[], today: string): Promise<void>
export function bumpFail(cfg: StoreConfig, endpoint: string): Promise<void>      // rpc push_bump_fail(p_endpoint) → 5 이상이면 삭제 (SQL 함수)
export function logRun(cfg: StoreConfig, row: { day: string; sent: number; failed: number; removed: number; ms: number }): Promise<void>
// send.ts
export type SendResult = 'ok' | 'gone' | 'error'
export type Sender = (sub: SubRow, payload: PushPayload) => Promise<SendResult>   // web-push 래퍼. 404·410 → 'gone'
export function webPushSender(keys: { publicKey: string; privateKey: string; subject: string }): Sender
export interface RunDeps { store: Pick<typeof import('./store'), 'listPending'|'markSent'|'bumpFail'|'deleteSubscription'|'logRun'>; cfg: StoreConfig; sender: Sender; now: () => Date; budgetMs?: number /* 45000 */; concurrency?: number /* 20 */; limit?: number /* 1000 */ }
export async function runDailySend(deps: RunDeps): Promise<{ day: string; sent: number; failed: number; removed: number; remaining: number }>
```
`runDailySend`: `day = kstDate(now())`, `listPending(day, limit)`, 년주별 payload 캐시(`dailyFortune({kind:'년주'}, now())`), 동시 20으로 보내며 budget 초과 시 중단, 결과 반영, `remaining = 읽은 수 - 처리한 수`, `logRun`.

- [ ] **Step 1: 실패하는 테스트**

`tests/push/text.test.ts`:
```ts
import { buildPayload } from '@/lib/push/text'
import { dailyFortune } from '@/lib/dailyEngine'
import { 육십갑자 } from '@/lib/dailyEngine/relations'
const D = new Date('2026-11-05T03:00:00+09:00')
test('제목·본문·url 형식', () => {
  const p = buildPayload(dailyFortune({ kind: '년주', 천간: '경', 지지: '오' }, D))
  expect(p.title).toBe('🐎 경오년 말띠 오늘 운세 ★★★★☆')
  expect(p.body).toBe('말이 예쁘게 나가는 날이에요. 고백도, 제안도 오늘이에요.\n행운 시간 오후 1~3시(미시)')
  expect(p.url).toBe('/fortune/daily?gz=%EA%B2%BD%EC%98%A4&utm_source=push&utm_medium=web_push&utm_campaign=daily')
  expect(p.tag).toBe('daily-fortune')
})
test('60갑자 전수: 빈 값·undefined 없음, 제목 60자 이내', () => {
  for (const g of 육십갑자) { const p = buildPayload(dailyFortune({ kind: '년주', ...g }, D)); expect(JSON.stringify(p)).not.toContain('undefined'); expect(p.title.length).toBeLessThanOrEqual(60); expect(p.body.length).toBeGreaterThan(10) }
})
```
`tests/push/validate.test.ts`:
```ts
import { isAllowedEndpoint, isGanji, parseSubscribeBody } from '@/lib/push/validate'
test('허용 호스트', () => {
  for (const u of ['https://fcm.googleapis.com/fcm/send/abc', 'https://updates.push.services.mozilla.com/wpush/v2/x', 'https://web.push.apple.com/QW', 'https://db5p.notify.windows.com/w/?token=1', 'https://kr-sea.push.samsungosp.com/x']) expect(isAllowedEndpoint(u)).toBe(true)
  for (const u of ['http://fcm.googleapis.com/x', 'https://evil.example/x', 'https://fcm.googleapis.com.evil.example/x', 'https://' + 'a'.repeat(2100)]) expect(isAllowedEndpoint(u)).toBe(false)
})
test('ganji·본문', () => {
  expect(isGanji('경오')).toBe(true); expect(isGanji('갑축')).toBe(false); expect(isGanji(12)).toBe(false)
  expect(parseSubscribeBody({ endpoint: 'https://web.push.apple.com/a', keys: { p256dh: 'k', auth: 'a' }, ganji: '경오' })).toEqual({ endpoint: 'https://web.push.apple.com/a', keys: { p256dh: 'k', auth: 'a' }, ganji: '경오' })
  expect(parseSubscribeBody({ endpoint: 'https://web.push.apple.com/a', keys: { p256dh: '', auth: 'a' }, ganji: '경오' })).toBeNull()
  expect(parseSubscribeBody({ endpoint: 'https://evil.example/a', keys: { p256dh: 'k', auth: 'a' }, ganji: '경오' })).toBeNull()
})
```
`tests/push/send.test.ts` (가짜 store·sender):
```ts
import { runDailySend, type Sender } from '@/lib/push/send'
function fakeStore(rows: { endpoint: string; ganji: string; last_sent_on?: string | null; fail_count?: number }[]) {
  const db = rows.map((r) => ({ p256dh: 'p', auth: 'a', last_sent_on: null, fail_count: 0, ...r }))
  return { db, store: {
    listPending: async (_c: unknown, today: string, limit: number) => db.filter((r) => !r.last_sent_on || r.last_sent_on < today).slice(0, limit).map(({ endpoint, p256dh, auth, ganji }) => ({ endpoint, p256dh, auth, ganji })),
    markSent: async (_c: unknown, eps: string[], today: string) => { for (const r of db) if (eps.includes(r.endpoint)) { r.last_sent_on = today; r.fail_count = 0 } },
    bumpFail: async (_c: unknown, ep: string) => { const r = db.find((x) => x.endpoint === ep); if (!r) return; r.fail_count++; if (r.fail_count >= 5) db.splice(db.indexOf(r), 1) },
    deleteSubscription: async (_c: unknown, ep: string) => { const i = db.findIndex((x) => x.endpoint === ep); if (i >= 0) db.splice(i, 1) },
    logRun: async () => {},
  } }
}
const cfg = { url: 'x', key: 'y' }
const at = (iso: string) => () => new Date(iso)
test('하루 1회: 같은 날 두 번째 호출은 0건', async () => {
  const f = fakeStore([{ endpoint: 'e1', ganji: '경오' }, { endpoint: 'e2', ganji: '갑자' }])
  const sent: string[] = []; const sender: Sender = async (s) => { sent.push(s.endpoint); return 'ok' }
  const r1 = await runDailySend({ store: f.store, cfg, sender, now: at('2026-11-04T23:30:00Z') })
  expect(r1).toMatchObject({ day: '2026-11-05', sent: 2, failed: 0, removed: 0, remaining: 0 })
  const r2 = await runDailySend({ store: f.store, cfg, sender, now: at('2026-11-04T23:45:00Z') })
  expect(r2.sent).toBe(0); expect(sent).toEqual(['e1', 'e2'])
})
test('410은 삭제, 오류 5번이면 삭제', async () => {
  const f = fakeStore([{ endpoint: 'gone', ganji: '경오' }, { endpoint: 'bad', ganji: '경오', fail_count: 4 }, { endpoint: 'ok', ganji: '경오' }])
  const sender: Sender = async (s) => (s.endpoint === 'gone' ? 'gone' : s.endpoint === 'bad' ? 'error' : 'ok')
  const r = await runDailySend({ store: f.store, cfg, sender, now: at('2026-11-04T23:30:00Z') })
  expect(r).toMatchObject({ sent: 1, failed: 1, removed: 1 })
  expect(f.db.map((x) => x.endpoint)).toEqual(['ok'])   // gone 삭제, bad는 5회째라 삭제
})
test('KST 자정 직전은 그날, 직후는 다음 날', async () => {
  const f = fakeStore([{ endpoint: 'e', ganji: '경오' }])
  const sender: Sender = async () => 'ok'
  expect((await runDailySend({ store: f.store, cfg, sender, now: at('2026-11-05T14:59:00Z') })).day).toBe('2026-11-05')
  expect((await runDailySend({ store: f.store, cfg, sender, now: at('2026-11-05T15:00:00Z') })).day).toBe('2026-11-06')
})
test('시간 예산이 끝나면 멈추고 remaining을 돌려준다', async () => {
  const f = fakeStore(Array.from({ length: 50 }, (_, i) => ({ endpoint: 'e' + i, ganji: '경오' })))
  let t = 0; const sender: Sender = async () => { t += 10; return 'ok' }
  const r = await runDailySend({ store: f.store, cfg, sender, now: () => new Date(Date.UTC(2026, 10, 4, 23, 30, 0) + t), budgetMs: 100, concurrency: 1 })
  expect(r.sent).toBeGreaterThan(0); expect(r.sent).toBeLessThan(50); expect(r.remaining).toBe(50 - r.sent)
})
```
- [ ] **Step 2: 실패 확인** — `npx vitest run tests/push`
- [ ] **Step 3: 구현** — `npm i web-push@3.6.7 && npm i -D @types/web-push`. `webPushSender`는 `webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 14400, urgency: 'normal' })`, `statusCode` 404·410 → 'gone', 그 외 throw → 'error'. `docs/push-subscriptions.sql`은 스펙의 SQL(표 2개, RLS, `push_bump_fail(p_endpoint text)` 함수: fail_count+1, 5 이상이면 delete, pg_cron·pg_net·Vault 설정 블록은 주석으로 포함).
- [ ] **Step 4: 통과 확인** — `npx vitest run tests/push && npx tsc --noEmit -p .`
- [ ] **Step 5: Commit** — `feat(push): 발송 모듈(payload·검증·저장소·runDailySend)과 SQL 문서`

---

### Task 3: API 라우트

**Files:**
- Create: `src/app/api/push/subscribe/route.ts` (POST·DELETE), `src/app/api/push/send/route.ts` (POST)
- Create: `src/lib/push/guard.ts` (`export const pushGuard = createGuard(30)`)
- Test: `tests/push/routes.test.ts`

**Interfaces:**
- Consumes: Task 2 전부, `sameSite`(`@/lib/people/voter`), `clientIp`·`readLimitedBody`·`createGuard`(`@/lib/duel/feedbackGuard`), `storeConfig`(`@/lib/people/store`).
- subscribe POST: content-type JSON 아니면 415, `sameSite` 아니면 403, guard 429, 본문 ≤ 2048바이트(413), `parseSubscribeBody` null → 400, `storeConfig()` 없음 → 503, 성공 `{ ok: true }`. DELETE: `{ endpoint }`만 읽고 `deleteSubscription`, 없는 endpoint도 `{ ok: true }`. 로그 없음.
- send POST: `export const runtime = 'nodejs'; export const maxDuration = 60;` 헤더 `Authorization` ≠ `Bearer ${process.env.PUSH_CRON_SECRET}`(비밀 미설정 포함) → 401. VAPID 키·storeConfig 없음 → 503. `runDailySend` 결과를 JSON으로. `console.log`는 개수만.

- [ ] **Step 1: 실패하는 테스트** — `tests/push/routes.test.ts`: 라우트 핸들러를 직접 import해 `new Request(...)`로 호출. `vi.stubEnv`로 env 제어, `globalThis.fetch`를 `vi.fn`으로 바꿔 PostgREST 호출을 가짜로.
```ts
test('subscribe: 415/403/400/503/200', ...)   // 각 조건 하나씩. Origin 헤더는 'https://unse-ai.com'
test('send: 비밀 없거나 틀리면 401, 키 없으면 503', ...)
test('subscribe upsert 본문에 last_sent_on이 없다', ...)   // fetch mock의 body를 검사
```
- [ ] **Step 2: 실패 확인** → **Step 3: 구현** → **Step 4: 통과** (`npx vitest run tests/push && npx tsc --noEmit -p .`)
- [ ] **Step 5: Commit** — `feat(push): 구독·해지·발송 API`

---

### Task 4: 클라이언트 버튼 + 통계 + 개인정보 문구

**Files:**
- Create: `src/lib/push/client.ts`, `src/components/fortune/PushToggle.tsx`
- Modify: `src/components/icons.tsx` (`bell` 아이콘), `src/lib/analytics.ts` (이벤트 3개), `src/app/fortune/daily/page.tsx` (공유 버튼 묶음 아래·SeasonPicks 위에 `<PushToggle fortune={result} />`), `src/app/privacy/page.tsx` (5항 목록에 스펙 문장 추가)
- Test: `tests/push/client.test.ts`, `tests/push/toggle.test.tsx`

**Interfaces:**
```ts
// client.ts
export type PushUiState = 'kakao' | 'ios_install' | 'unsupported' | 'denied' | 'off' | 'on'
export interface PushEnv { ua: string; hasPush: boolean; hasSw: boolean; publicKey: string | null; permission: NotificationPermission; standalone: boolean; maxTouchPoints: number; subscribed: boolean }
export function pushUiState(env: PushEnv): PushUiState     // 스펙 표의 순서 그대로. 순수 함수
export function readPushEnv(subscribed: boolean): PushEnv   // 브라우저에서 읽음(iOS: /iPhone|iPad/ 또는 Macintosh+maxTouchPoints>1; standalone: navigator.standalone===true || matchMedia('(display-mode: standalone)').matches)
export async function getSubscription(): Promise<PushSubscription | null>
export async function subscribe(ganji: string): Promise<'ok' | 'denied' | 'server'>   // requestPermission → pushManager.subscribe(userVisibleOnly, applicationServerKey=urlBase64ToUint8Array(공개키)) → POST; 서버 실패 시 unsubscribe + 'server'; 성공 시 IndexedDB('unmyeong', 'push', key 'ganji')에 ganji 저장
export async function unsubscribe(): Promise<void>          // unsubscribe + DELETE
// analytics.ts 추가
push_subscribe: { test_name: TestName; result_id: string }   // result_id = 년주
push_unsubscribe: { test_name: TestName }
push_blocked: { test_name: TestName; result_id: 'denied' | 'ios_install' | 'server' | 'kakao' }
```
PushToggle: `fortune.나.년주표기`가 null(띠 모드)이면 그리지 않음. 마운트 뒤 `readPushEnv`로 상태 결정(서버 HTML에는 빈 div). 상태별 문구는 스펙 표. 구독 중이고 현재 년주가 저장된 년주와 다르면 버튼 라벨 `이 년주로 바꿔 받기`. 성공 토스트 `알림을 켰어요. 내일 아침 8시 30분에 처음 와요`(role=status). 카카오 상태의 `다른 브라우저로 열기`는 `kakaotalk://web/openExternal?url=`(saveImage.ts 방식).

- [ ] **Step 1: 실패하는 테스트**
`tests/push/client.test.ts`: `pushUiState`를 상태 6개 + 순서(iOS 사파리: hasPush=false·iOS·미설치 → 'ios_install'; 카카오 UA면 모든 것보다 먼저 'kakao'; iPad Macintosh+maxTouchPoints=5 → iOS로 판정) 검사.
`tests/push/toggle.test.tsx`: 소스 테스트 — page.tsx에 `<PushToggle`이 `no-screenshot` 영역 안·`SeasonPicks` 위; PushToggle 소스에 스펙 문구 6개 리터럴 포함; `requestPermission`이 `onClick` 핸들러 안에서만 호출(마운트 효과 안에 없음: 정규식으로 `useEffect` 블록에 `requestPermission` 없음); privacy에 스펙 문장; analytics 타입에 이벤트 3개.
- [ ] **Step 2 → 5**: 실패 확인 → 구현 → `npx vitest run tests/push tests/dailyEngine && npx tsc --noEmit -p .` → Commit `feat(push): 결과 화면 알림 버튼·통계·개인정보 문구`

---

### Task 5: 서비스워커 + 아이콘 + manifest

**Files:**
- Modify: `public/sw.js` (`CACHE_NAME = 'unmyeong-v2'`, push·notificationclick·pushsubscriptionchange)
- Create: `scripts/make-push-icons.mjs` (sharp로 `public/icons/icon-192x192.svg` → `icon-192.png`, `icon-512.png`, `apple-touch-icon-180.png`; 배지 `badge-96.png`는 흰 실루엣·투명 배경), 생성된 PNG 4개 커밋
- Modify: `src/app/manifest.ts` (PNG 192·512 any + 512 maskable을 SVG 앞에), `src/app/layout.tsx:108` (`apple-touch-icon` → `/icons/apple-touch-icon-180.png`)
- Test: `tests/push/sw.test.ts`

- [ ] **Step 1: 실패하는 테스트** — `tests/push/sw.test.ts`(소스·파일 존재): sw.js에 `addEventListener('push'`, `addEventListener('notificationclick'`, `addEventListener('pushsubscriptionchange'`, `renotify: true`, `tag: 'daily-fortune'`, 기본 알림 문구 `오늘의 운세가 도착했어요`, `unmyeong-v2`; `public/icons/{icon-192,icon-512,apple-touch-icon-180,badge-96}.png` 존재하고 PNG 시그니처(`89 50 4E 47`); manifest()의 icons[0]이 PNG 192; layout.tsx에 `apple-touch-icon-180.png`.
- [ ] **Step 2 → 5**: 실패 확인 → 구현(sw: push는 `event.data?.json()` try/catch, 기본 알림; notificationclick은 `clients.matchAll({type:'window', includeUncontrolled:true})`에서 같은 origin 창을 `navigate`+`focus`, 없으면 `openWindow`; pushsubscriptionchange는 `event.oldSubscription?.options?.applicationServerKey`로 재구독 후 IndexedDB의 ganji로 POST) → `node scripts/make-push-icons.mjs` → `npx vitest run tests/push && npx tsc --noEmit -p .` → Commit `feat(push): 서비스워커 알림 처리, PNG 아이콘, manifest`

---

### Task 6: 문서·빌드·E2E

**Files:**
- Modify: `CLAUDE.md` ("## 오늘의 운세 (일진 엔진)" 아래에 "## 아침 운세 푸시" 소절: 구조 한 줄, 파일, 환경변수 4개, SQL 문서·pg_cron 등록 방법, 발송 수동 호출 `curl -X POST -H "Authorization: Bearer $PUSH_CRON_SECRET" https://unse-ai.com/api/push/send`, 하루 1회 규칙, 로그 표 `push_send_log`; PWA 항목에 PNG 아이콘·v2 캐시 추가)

- [ ] **Step 1**: CLAUDE.md 수정, Commit `docs(push): 아침 운세 푸시 운영 문서`
- [ ] **Step 2**: `npm test && npx tsc --noEmit -p . && npm run build` 전부 성공
- [ ] **Step 3**: `npx playwright test e2e/chrome-emoji.spec.ts e2e/flows.spec.ts e2e/season.spec.ts e2e/tabbar.spec.ts e2e/inputs.spec.ts --reporter=line` 통과(환경변수 없이도 버튼이 숨겨져 깨지지 않아야 한다)
- [ ] **Step 4**: 보고에 수동 확인 항목을 적는다: 환경변수 넣기(컨트롤러), SQL 실행(컨트롤러), 안드로이드·아이폰 구독 → `/api/push/send` 수동 호출 → 알림 → 클릭 착지 → 끄기.
