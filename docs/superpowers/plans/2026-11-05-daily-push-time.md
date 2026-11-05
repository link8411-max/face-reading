# 알림 시각 선택 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 구독자가 30분 단위(05:00~23:30)로 알림 시각을 고르고, 30분마다 도는 cron이 그 시각에 맞는 기기에만 보낸다.

**Architecture:** 저장 열 `send_at` 하나와 구독 본문 `sendAt`을 더하고, `runDailySend`가 현재 KST 시각으로 한 시간 창 `(from, to]`를 계산해 `listPending`에 넘긴다. 클라이언트는 `<select>`로 고른 값을 구독 본문·IndexedDB에 넣는다. 한국어 시각 표기는 순수 함수 하나.

**Tech Stack:** 기존 `daily-push` 브랜치 코드 위에 추가. vitest.

**Spec:** `docs/superpowers/specs/2026-11-05-daily-push-design.md` 마지막 절 "추가: 알림 시각 선택" (규칙·문구의 출처).

## Global Constraints

- 허용 시각: `SEND_SLOTS` = '05:00','05:30',…,'23:30' (38개). 기본 '08:30'. 그 밖은 400.
- 발송 창: `to = kstHHMM(now)`, `from = to − 60분`(00:00 아래면 '00:00'); 조건 `send_at > from and send_at <= to` + `last_sent_on is null or < today`. 하루 1회·실패 집계 규칙 변경 없음.
- cron은 하나 `*/30 * * * *`. SQL 문서의 세 스케줄과 CLAUDE.md의 08:30/08:45/09:00 설명을 모두 바꾼다.
- 시각 표기 규칙과 모든 문구는 스펙 절 그대로.
- 생년 저장·로그 금지 규칙 그대로. `sendAt`은 로그에 남겨도 되지만 endpoint와 함께 남기지 않는다.

## Review Focus

1. 00:00~00:59 회차: `from`이 '00:00'으로 잘려 어제 23:30 슬롯이 오늘 다시 가지 않는다 — Task 1 테스트.
2. 08:30 구독자: 08:30 회차에 발송, 09:00 회차(보정)에 미발송분만, 09:30 회차엔 제외 — Task 1 테스트.
3. 구독 중 시각만 바꾸면 `last_sent_on` 유지(오늘 이미 받았으면 오늘 또 안 옴) — Task 1 store 테스트(본문에 last_sent_on 없음은 기존 테스트).
4. 잘못된 `sendAt`('08:15', '24:00', 숫자)은 400 — Task 1 route 테스트.
5. 성공 문구의 오늘/내일 판정이 KST 기준 — Task 2 테스트.

---

### Task 1: 서버 — 슬롯 검증·저장·발송 창·SQL·cron

**Files:**
- Modify: `src/lib/push/validate.ts` (`SEND_SLOTS`, `isSendAt`, `SubscribeBody.sendAt`, `parseSubscribeBody` 기본값 '08:30')
- Modify: `src/lib/push/store.ts` (`SubRow.send_at`, `upsertSubscription` 본문에 `send_at`, `listPending(cfg, today, limit, window: { from: string; to: string })`)
- Modify: `src/lib/push/send.ts` (`runDailySend`가 `kstHHMM(now())`로 창 계산, `slotWindow(hhmm)` export)
- Modify: `src/app/api/push/subscribe/route.ts` (sendAt 전달), `docs/push-subscriptions.sql`
- Test: `tests/push/validate.test.ts`, `tests/push/send.test.ts`, `tests/push/routes.test.ts` (추가)

**Interfaces:**
```ts
// validate.ts
export const SEND_SLOTS: readonly string[]            // 38개
export function isSendAt(s: unknown): s is string
export interface SubscribeBody { endpoint: string; keys: { p256dh: string; auth: string }; ganji: string; sendAt: string }
// store.ts
export interface SubRow { endpoint: string; p256dh: string; auth: string; ganji: string; send_at: string }
export async function listPending(cfg, today: string, limit: number, window: { from: string; to: string }): Promise<SubRow[]>
//   GET …&or=(last_sent_on.is.null,last_sent_on.lt.<today>)&send_at=gt.<from>&send_at=lte.<to>&order=created_at.asc&limit=N
// send.ts
export function kstHHMM(now: Date): string           // 'HH:MM' Asia/Seoul
export function slotWindow(hhmm: string): { from: string; to: string }   // to=hhmm, from=hhmm-60분(최소 '00:00')
```
`runDailySend`의 `RunDeps.store.listPending`은 새 시그니처. 결과 객체에 `window: { from, to }`를 추가해 응답·로그에 보이게 한다(`push_send_log`에는 `slot_to text` 열 추가).

- [ ] **Step 1: 실패하는 테스트**
```ts
// validate.test.ts 추가
test('sendAt 30분 슬롯', () => {
  expect(SEND_SLOTS).toHaveLength(38); expect(SEND_SLOTS[0]).toBe('05:00'); expect(SEND_SLOTS[37]).toBe('23:30')
  for (const s of ['05:00', '08:30', '23:30']) expect(isSendAt(s)).toBe(true)
  for (const s of ['04:30', '08:15', '24:00', '8:30', 830, undefined]) expect(isSendAt(s)).toBe(false)
  expect(parseSubscribeBody({ endpoint: 'https://web.push.apple.com/a', keys: { p256dh: 'k', auth: 'a' }, ganji: '경오' })?.sendAt).toBe('08:30')
  expect(parseSubscribeBody({ endpoint: 'https://web.push.apple.com/a', keys: { p256dh: 'k', auth: 'a' }, ganji: '경오', sendAt: '21:00' })?.sendAt).toBe('21:00')
  expect(parseSubscribeBody({ endpoint: 'https://web.push.apple.com/a', keys: { p256dh: 'k', auth: 'a' }, ganji: '경오', sendAt: '08:15' })).toBeNull()
})
// send.test.ts 추가 (가짜 store의 listPending이 window를 적용하도록 수정: rows에 send_at 필드)
test('kstHHMM·slotWindow', () => {
  expect(kstHHMM(new Date('2026-11-04T23:30:00Z'))).toBe('08:30')
  expect(slotWindow('08:30')).toEqual({ from: '07:30', to: '08:30' })
  expect(slotWindow('00:30')).toEqual({ from: '00:00', to: '00:30' })
  expect(slotWindow('00:00')).toEqual({ from: '00:00', to: '00:00' })
})
test('슬롯 창: 08:30 구독자는 08:30·09:00 회차에만, 09:30엔 제외; 자정 회차는 어제 23:30을 안 줍는다', async () => {
  // rows: a(08:30), b(09:00), c(23:30, last_sent_on 어제)
  // 08:30 회차 → a만 발송; 09:00 회차 → b 발송(a는 이미 보냄); 09:30 회차 → 0건
  // 00:00 회차(다음 날) → c는 from '00:00' 아래라 제외 → 0건
})
// routes.test.ts 추가: sendAt '08:15' → 400, 생략 → upsert 본문 send_at '08:30'
```
- [ ] **Step 2: 실패 확인** `npx vitest run tests/push`
- [ ] **Step 3: 구현** — SQL: `send_at text not null default '08:30' check (send_at ~ '^([01][0-9]|2[0-3]):(00|30)$' and send_at >= '05:00')`, 색인 `(send_at, last_sent_on)`, 기존 표용 `alter table … add column if not exists send_at …`; `push_send_log`에 `slot_to text` 추가; cron 블록을 `daily-push-every-30m` 하나(`*/30 * * * *`)로 교체하고 세 개 `unschedule` 안내.
- [ ] **Step 4: 통과 확인** `npx vitest run tests/push && npx tsc --noEmit -p .`
- [ ] **Step 5: Commit** `feat(push): 알림 시각 슬롯(30분)과 발송 창, cron 30분마다`

---

### Task 2: 클라이언트 — 시각 고르기·문구·IndexedDB·SW

**Files:**
- Create: `src/lib/push/slotLabel.ts` (`formatSlot(hhmm): string`, `nextDeliveryWord(hhmm, now): '오늘' | '내일'`)
- Modify: `src/lib/push/client.ts` (`subscribe(ganji, sendAt)`, IndexedDB `sendAt`, `readStoredSendAt`), `src/components/fortune/PushToggle.tsx` (select + 문구), `public/sw.js` (`pushsubscriptionchange` POST에 `sendAt`), `src/app/privacy/page.tsx` (문장에 "알림 시각")
- Test: `tests/push/slotLabel.test.ts`, `tests/push/toggle.test.tsx`(수정)

**Interfaces:**
```ts
export function formatSlot(hhmm: string): string      // '08:30' → '아침 8시 30분', '12:00' → '낮 12시', '21:30' → '밤 9시 30분', '00:00'은 들어오지 않음
export function nextDeliveryWord(hhmm: string, now: Date): '오늘' | '내일'   // kstHHMM(now) < hhmm ? '오늘' : '내일'
```
PushToggle: `<select aria-label="알림 시각">` 옵션 38개(표시 `formatSlot`), 초기값 저장된 sendAt 또는 '08:30'. `off`: select + 버튼 `매일 {formatSlot}에 오늘 운세 받기`. `on`: select 변경 시 즉시 `subscribe(ganji, 새값)`; 소제목 `{년주}년 {띠}띠 · {formatSlot}로 받고 있어요`; 성공 문구 `알림을 켰어요. {오늘|내일} {formatSlot}에 처음 와요`. 다른 년주면 기존 `이 년주로 바꿔 받기` 유지. select도 `no-screenshot` 안.

- [ ] **Step 1: 실패하는 테스트**
```ts
test('formatSlot', () => {
  expect(formatSlot('05:00')).toBe('아침 5시'); expect(formatSlot('08:30')).toBe('아침 8시 30분'); expect(formatSlot('10:30')).toBe('아침 10시 30분')
  expect(formatSlot('11:00')).toBe('낮 11시'); expect(formatSlot('12:00')).toBe('낮 12시'); expect(formatSlot('13:30')).toBe('낮 1시 30분')
  expect(formatSlot('14:00')).toBe('오후 2시'); expect(formatSlot('17:30')).toBe('오후 5시 30분')
  expect(formatSlot('18:00')).toBe('저녁 6시'); expect(formatSlot('20:30')).toBe('저녁 8시 30분')
  expect(formatSlot('21:00')).toBe('밤 9시'); expect(formatSlot('23:30')).toBe('밤 11시 30분')
})
test('nextDeliveryWord는 KST', () => {
  const now = new Date('2026-11-05T00:00:00Z') // KST 09:00
  expect(nextDeliveryWord('08:30', now)).toBe('내일'); expect(nextDeliveryWord('09:00', now)).toBe('내일'); expect(nextDeliveryWord('09:30', now)).toBe('오늘')
})
// toggle.test.tsx: 소스에 '알림 시각' select, formatSlot 사용, '로 받고 있어요', 'subscribe(ganji, ' 호출, sw.js에 sendAt, privacy에 '알림 시각'
```
- [ ] **Step 2–4**: 실패 확인 → 구현 → `npx vitest run tests/push && npx tsc --noEmit -p . && node --check public/sw.js`
- [ ] **Step 5: Commit** `feat(push): 알림 시각 고르기(30분 단위)와 문구`

---

### Task 3: 문서·전체 검증

- [ ] CLAUDE.md "아침 운세 푸시": 30분 슬롯·`send_at`·발송 창·cron `*/30`·롤백 1개·아침 점검 쿼리(최근 N회차)·`slot_to`; "8시 30분 고정" 표현 제거. Commit `docs(push): 알림 시각 선택 반영`
- [ ] `npm test && npx tsc --noEmit -p . && npm run build`, `npx playwright test e2e/chrome-emoji.spec.ts e2e/flows.spec.ts --reporter=line`
