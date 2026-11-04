# 삼국지 장수 월드컵 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 열전 데이터로 읽을거리를 붙인 주제별 16강 장수 월드컵(최강 무장·최고 책사·삼국지 여인·전체 무작위)과 실제 집계 비율·우승 순위·공유 착지를 만든다.

**Architecture:** 판 구성·진행·비율 문구는 순수 함수(`src/lib/cup/`)로 두고 테스트한다. 서버 페이지가 출전 후보의 카드 최소 필드와 "만난 장면"을 미리 만들어 클라이언트 `CupGame`에 넘긴다(열전 본문을 번들에 넣지 않음). 저장은 기존 `people_votes` 테이블·서명 쿠키·첫날 IP 해시를 그대로 쓰고, 쿠키 경로(`/api/people`) 안에 새 API `/api/people/cup`을 둔다.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind 4, Supabase PostgREST(fetch), vitest, Playwright, @vercel/og(엣지).

**Spec:** `docs/superpowers/specs/2026-11-04-samguk-worldcup-design.md`

## Global Constraints

- 디자인: 4b 뉴트럴 토큰(`bg-paper` `bg-card` `bg-card-2` `border-line` `text-ink` `text-muted` `text-accent`), 카드 `rounded-[22px]`~`rounded-[30px]`, 버튼 pill, 주 버튼 `h-[52px] bg-ink text-paper`. 이모지 금지, 아이콘은 `src/components/icons.tsx`의 `Icon`만. 누르는 곳은 44px 이상. 375px에서 가로 스크롤 없음.
- 가짜 숫자 금지: 비율·순위·판 수는 실제 집계만. 집계가 없거나 못 읽으면 숫자를 숨긴다.
- 기록에 없는 문장 금지: 카드 문구는 열전의 `summary` 첫 문장과 `funFacts`, "만난 장면"은 열전 `relations.note`와 그 `source`만 쓴다. 새 문장을 쓰지 않는다.
- 출전자는 초상화가 있는 인물만(`samgukCharacters`, 즉 `PENDING_PORTRAIT_IDS` 제외).
- 판 키: `warrior` `strategist` `women` `random`. 판 이름: `최강 무장` `최고 책사` `삼국지 여인` `전체 무작위`.
- 판 구성: 최강 무장 = `stats.무력` 상위 16(동점 `stats.통솔`), 최고 책사 = `stats.지력` 상위 16(동점 `stats.정치`, `huatuo` 제외), 삼국지 여인 = `gender '여'` 전원에서 16명 이상이면 무작위 16, 8~15명이면 무작위 8, 전체 무작위 = 전원에서 무작위 16. 동점이 남으면 id 오름차순.
- 능력치 기준을 설명할 때는 "코에이 스타일 무력 기준"/"코에이 스타일 지력 기준"이라고 쓰고 "역사적 강함"처럼 쓰지 않는다.
- 비율 문구(내 표 제외, 판과 무관하게 두 사람 쌍 기준): 다른 사람 0명 `이 대결을 처음 골랐어요`, 1~9명 `지금까지 N명이 이 대결을 골랐어요`, 10명 이상 `다른 사람들은 N%가 ○○를 골랐어요`(○○ 뒤 을/를은 받침으로), 실패 `지금은 다른 사람 선택을 불러오지 못했어요`.
- 질문 문구 `둘 중 누가 더 끌리나요?`, 진행 표시 `<판 이름> <N강> · <i>/<경기 수>`(예 `최강 무장 16강 · 3/8`), "만난 장면" 머리 `이 둘이 만난 장면:`, 카드 읽을거리 머리 `알고 보면:`.
- 끝 화면: `나의 최애 장수`, 결승까지 이긴 상대 이름 줄, 버튼 `공유하기` `<이름> 열전 보기` `다른 판 하기`, 판별 우승 순위 상위 5(집계 있을 때만) + `전체 순위 보기`.
- 공유: 링크 `/samguk/cup/r/<판>/<우승 id>`, 미리보기 문구 `나의 최애 장수는 <이름>. 너는?`, 착지 noindex·사이트맵 제외·canonical `/samguk/cup`, 버튼 `나도 해보기`.
- 저장: `kind 'cup_match'` target `pairKey(a,b)` option 고른 id / `kind 'cup_win'` target 판 키 option 우승 id. 월드컵 API 속도 제한은 열전 투표와 따로 IP당 10분 200회.
- GA: `TestName`에 `'cup'`. `cup_start(result_id=<판>)`, `cup_end(result_id=<판>_<우승 id>)`, 공유 `share_click(test_name='cup')`. 값은 24자 이하(지금 최장 `strategist_huangyueying` 23자, 판 키+후보 id 전 조합을 테스트로 확인).
- 페이지 제목 48자 이하. `/samguk/cup` 제목 `삼국지 장수 월드컵 | 최강 무장·책사·여인 16강 – 운명을 읽다`.
- 사이트맵에는 `/samguk/cup`과 `/samguk/cup/ranking`만 추가(`LAST_MODIFIED` 날짜 함께).
- 메인 저장소 루트와 main 브랜치 금지(워크트리에서 작업), push 금지, `git add`는 파일 이름으로, 커밋 트레일러 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Supabase SQL은 문서에만 쓰고 실행하지 않는다(배포 전 사용자 승인 뒤 컨트롤러가 실행).

## Review Focus

1. 카드를 빠르게 두 번 누르거나 고른 뒤 반대쪽을 누름 → 한 대결에 선택·저장은 처음 한 번만. Task 4 단위·E2E에서 고정.
2. 앞 대결의 느린 응답이 다음 대결 화면에 도착 → 그 대결 번호의 응답만 반영, 다음 대결 비율 칸을 덮어쓰지 않음. Task 4 테스트로 고정.
3. 저장 실패(429·503·네트워크) 중에도 15번을 끝까지 진행할 수 있고 끝 화면이 나온다. 환경 변수 없는 E2E가 그대로 증명(Task 7).
4. `?with=`에 없는 id·후보 밖 id·여러 값 → 조용히 무시하고 보통 대진. Task 1 단위 테스트.
5. 공유 착지·OG에 잘못된 판 키나 그 판 후보 밖 id → 착지는 `/samguk/cup`으로 리디렉션, OG는 400. Task 5 테스트.

---

### Task 1: 판 구성과 카드 데이터

**Files:**
- Create: `src/lib/cup/boards.ts` (클라이언트 안전: `samgukDB`만 import)
- Create: `src/lib/cup/cards.ts` (서버 전용: 열전 import)
- Test: `tests/cupBoards.test.ts`

**Interfaces:**
- Consumes: `samgukCharacters`(`@/lib/samgukDB`, 초상화 있는 인물), `PEOPLE`(`@/content/samgukPeople`), `relationsOf(id)`(`@/lib/people/relations`), `firstSentence(summary)`(`@/lib/people/hubCards`), `portraitSrc(id)`(`@/lib/people/portrait`), `pairKey(a,b)`(`@/lib/people/keys`), `Rng`/`createRng(seed)`(`@/lib/duel/rng`).
- Produces:
  - `type BoardKey = 'warrior' | 'strategist' | 'women' | 'random'`, `BOARD_KEYS: BoardKey[]`(이 순서), `isBoardKey(x: unknown): x is BoardKey`
  - `BOARDS: Record<BoardKey, { title: string; blurb: string; basis: string | null }>` — title은 Global Constraints의 판 이름, basis는 warrior `코에이 스타일 무력 기준`, strategist `코에이 스타일 지력 기준`, 나머지 null. blurb는 판 고르기 카드 한 줄(예 `무력 상위 16명`, `지력 상위 16명`, `초상화가 있는 여성 인물`, `초상화 있는 장수 중 무작위 16명`).
  - `boardPool(board: BoardKey): string[]` — 그 판의 전체 후보 id(warrior·strategist는 정렬된 16명, women·random은 해당 전원).
  - `bracketSize(poolSize: number): 16 | 8 | null` — 16 이상 16, 8~15는 8, 그 밖 null.
  - `drawEntrants(board: BoardKey, rand: Rng, withId?: string | null): string[]` — 길이 `bracketSize(pool.length)`, 중복 없음, 후보 안의 id만, `withId`가 후보에 있으면 반드시 포함, 결과 순서는 섞임.
  - `interface CupCard { id: string; name: string; faction: '위' | '촉' | '오' | '기타'; portrait: string; line: string; facts: string[] }`
  - `interface MeetNote { note: string; source: Source }`
  - `cupCards(ids: string[]): CupCard[]` — line은 `firstSentence(summary)`, facts는 `funFacts` 전부.
  - `meetNotes(ids: string[]): Record<string, MeetNote>` — 키 `pairKey(a,b)`, ids 안의 두 사람이 `relationsOf`로 이어진 쌍만, 같은 쌍은 사전순 앞 id 쪽 관계를 우선.

- [ ] **Step 1: 실패하는 테스트 작성** (`tests/cupBoards.test.ts`)

```ts
import { BOARD_KEYS, boardPool, bracketSize, drawEntrants, isBoardKey } from '@/lib/cup/boards'
import { cupCards, meetNotes } from '@/lib/cup/cards'
import { createRng } from '@/lib/duel/rng'
import { samgukCharacters } from '@/lib/samgukDB'
import { pairKey } from '@/lib/people/keys'

const portrait = new Set(samgukCharacters.map((c) => c.id))

test('판 키', () => {
  expect(BOARD_KEYS).toEqual(['warrior', 'strategist', 'women', 'random'])
  expect(isBoardKey('warrior')).toBe(true)
  expect(isBoardKey('__proto__')).toBe(false)
})
test('최강 무장: 무력 상위 16, 2026-11-04 명단', () => {
  expect(boardPool('warrior')).toEqual(['lvbu', 'zhangfei', 'guanyu', 'machao', 'dianwei', 'zhaoyun', 'xuchu', 'pangde', 'ganning', 'taishici', 'sunce', 'zhangliao', 'yanliang', 'huangzhong', 'wenchou', 'sunjian'])
})
test('최고 책사: 지력 상위 16, 화타 제외', () => {
  const p = boardPool('strategist')
  expect(p).toHaveLength(16)
  expect(p).not.toContain('huatuo')
  expect(p.slice(0, 3)).toEqual(['zhugeliang', 'simayi', 'pangtong'])
})
test('모든 판 후보는 초상화 있는 인물', () => {
  for (const b of BOARD_KEYS) for (const id of boardPool(b)) expect(portrait.has(id), `${b}:${id}`).toBe(true)
})
test('대진 크기', () => {
  expect(bracketSize(16)).toBe(16); expect(bracketSize(31)).toBe(16)
  expect(bracketSize(15)).toBe(8); expect(bracketSize(8)).toBe(8); expect(bracketSize(7)).toBeNull()
})
test('여인 판: 지금 15명이라 8명, 중복 없음, 후보 안', () => {
  const e = drawEntrants('women', createRng(1))
  expect(e).toHaveLength(8)
  expect(new Set(e).size).toBe(8)
  for (const id of e) expect(boardPool('women')).toContain(id)
})
test('with: 후보면 반드시 포함, 후보 밖·없는 id는 무시', () => {
  for (let s = 0; s < 20; s++) expect(drawEntrants('random', createRng(s), 'guanyu')).toContain('guanyu')
  expect(drawEntrants('warrior', createRng(3), 'zhugeliang')).toHaveLength(16)
  expect(drawEntrants('random', createRng(3), 'nope')).toHaveLength(16)
})
test('같은 시드는 같은 대진, 다른 시드는 다른 순서', () => {
  expect(drawEntrants('warrior', createRng(7))).toEqual(drawEntrants('warrior', createRng(7)))
  expect(drawEntrants('warrior', createRng(7))).not.toEqual(drawEntrants('warrior', createRng(8)))
})
test('카드: 첫 문장과 funFacts, 초상화 경로', () => {
  const [c] = cupCards(['guanyu'])
  expect(c.name).toBe('관우')
  expect(c.line.length).toBeGreaterThan(10)
  expect(c.facts.length).toBeGreaterThanOrEqual(2)
  expect(c.portrait).toMatch(/^\/images\/samguk\//)
})
test('만난 장면: 관계로 이어진 쌍만', () => {
  const m = meetNotes(['liubei', 'guanyu', 'diaochan'])
  expect(m[pairKey('liubei', 'guanyu')]?.note.length).toBeGreaterThan(5)
  expect(m[pairKey('guanyu', 'diaochan')]).toBeUndefined()
})
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run tests/cupBoards.test.ts` / Expected: FAIL (모듈 없음)
- [ ] **Step 3: `boards.ts`, `cards.ts` 구현** — 섞기는 Fisher–Yates에 `rand()`. women·random 표본은 섞은 뒤 앞에서 자르고, `withId`가 빠졌으면 마지막 자리를 그것으로 바꾼 뒤 다시 섞는다. `meetNotes`는 `relationsOf(id)` 중 `otherId`가 ids에 있는 것만. 최강 무장 명단이 테스트와 다르면 테스트의 기대값이 아니라 정렬 규칙(무력 desc → 통솔 desc → id asc)을 먼저 의심하고, 규칙대로 나온 명단이 스펙 표와 다르면 보고서에 적는다.
- [ ] **Step 4: 통과 확인** — `npx vitest run tests/cupBoards.test.ts` PASS
- [ ] **Step 5: 커밋** — `git add src/lib/cup/boards.ts src/lib/cup/cards.ts tests/cupBoards.test.ts && git commit -m "feat(cup): 판 구성과 카드 데이터"`

### Task 2: 진행 상태와 비율 문구

**Files:**
- Create: `src/lib/cup/game.ts` (순수, 클라이언트 안전: `josa`만 import)
- Test: `tests/cupGame.test.ts`

**Interfaces:**
- Consumes: `josa`(`@/lib/josa`).
- Produces:
  - `interface CupState { round: string[]; winners: string[]; match: number; beaten: Record<string, string[]>; champion: string | null }` — `match`는 이번 라운드 안의 0부터 번호.
  - `startCup(entrants: string[]): CupState` (길이 16 또는 8이 아니면 throw)
  - `currentMatch(s: CupState): [string, string] | null` (끝나면 null)
  - `pick(s: CupState, winnerId: string): CupState` — 새 객체, 현재 대결 밖 id면 throw. 라운드의 마지막 대결이면 `winners`가 다음 `round`가 되고, 한 명 남으면 `champion`.
  - `roundLabel(size: number): string` — 16 `16강`, 8 `8강`, 4 `4강`, 2 `결승`.
  - `progressLabel(s: CupState, boardTitle: string): string` — `${boardTitle} ${roundLabel(round.length)} · ${match+1}/${round.length/2}`, 결승은 `${boardTitle} 결승`.
  - `matchNumber(s: CupState): number` — 판 전체에서 몇 번째 대결인지(1부터). 늦은 응답 걸러내기에 쓴다.
  - `championPath(s: CupState): string[]` — 우승자가 이긴 상대, 첫 라운드부터.
  - `type Others = Record<string, number> | null | 'error'`
  - `ratioMessage(others: Others, pickedId: string, pickedName: string): string` — null이면 빈 문자열(불러오는 중), 나머지는 Global Constraints의 비율 문구. 퍼센트는 반올림.

- [ ] **Step 1: 실패하는 테스트**

```ts
import { championPath, currentMatch, matchNumber, pick, progressLabel, ratioMessage, startCup } from '@/lib/cup/game'

const ids = Array.from({ length: 16 }, (_, i) => `p${i}`)
const playLeft = (s: ReturnType<typeof startCup>) => { while (currentMatch(s)) s = pick(s, currentMatch(s)![0]); return s }

test('16강은 15번 고르면 끝난다', () => {
  let s = startCup(ids); let n = 0
  while (currentMatch(s)) { s = pick(s, currentMatch(s)![0]); n++ }
  expect(n).toBe(15); expect(s.champion).toBe('p0')
})
test('진행 표시', () => {
  let s = startCup(ids)
  expect(progressLabel(s, '최강 무장')).toBe('최강 무장 16강 · 1/8')
  s = pick(s, 'p0'); s = pick(s, 'p2')
  expect(progressLabel(s, '최강 무장')).toBe('최강 무장 16강 · 3/8')
  expect(matchNumber(s)).toBe(3)
})
test('8강 판', () => {
  const s = startCup(ids.slice(0, 8))
  expect(progressLabel(s, '삼국지 여인')).toBe('삼국지 여인 8강 · 1/4')
  expect(playLeft(s).champion).toBe('p0')
})
test('결승 표시와 우승 경로', () => {
  let s = startCup(ids.slice(0, 8))
  for (let i = 0; i < 6; i++) s = pick(s, currentMatch(s)![0])
  expect(progressLabel(s, '삼국지 여인')).toBe('삼국지 여인 결승')
  s = pick(s, currentMatch(s)![0])
  expect(championPath(s)).toEqual(['p1', 'p2', 'p4'])
})
test('현재 대결 밖 선택은 거부, 원래 상태는 그대로', () => {
  const s = startCup(ids)
  expect(() => pick(s, 'p5')).toThrow()
  expect(currentMatch(s)).toEqual(['p0', 'p1'])
})
test('비율 문구', () => {
  expect(ratioMessage(null, 'guanyu', '관우')).toBe('')
  expect(ratioMessage('error', 'guanyu', '관우')).toBe('지금은 다른 사람 선택을 불러오지 못했어요')
  expect(ratioMessage({}, 'guanyu', '관우')).toBe('이 대결을 처음 골랐어요')
  expect(ratioMessage({ guanyu: 2, lvbu: 1 }, 'guanyu', '관우')).toBe('지금까지 3명이 이 대결을 골랐어요')
  expect(ratioMessage({ guanyu: 7, lvbu: 3 }, 'guanyu', '관우')).toBe('다른 사람들은 70%가 관우를 골랐어요')
  expect(ratioMessage({ lvbu: 9, guanyu: 2 }, 'lvbu', '여포')).toBe('다른 사람들은 82%가 여포를 골랐어요')
  expect(ratioMessage({ guanyu: 0, lvbu: 10 }, 'guanyu', '관우')).toBe('다른 사람들은 0%가 관우를 골랐어요')
})
```

- [ ] **Step 2: 실패 확인** — `npx vitest run tests/cupGame.test.ts` FAIL
- [ ] **Step 3: `game.ts` 구현**
- [ ] **Step 4: 통과 확인** — PASS
- [ ] **Step 5: 커밋** — `feat(cup): 진행 상태와 비율 문구`

### Task 3: 저장 — 투표자 공통화, 월드컵 API, 집계 SQL

**Files:**
- Create: `src/lib/people/voter.ts` (쿠키·출처·투표자 해시 공통)
- Modify: `src/app/api/people/vote/route.ts` (공통 함수로 바꾸기만, 동작 동일)
- Modify: `src/lib/people/votes.ts` (`VoteKind`에 `'cup_match' | 'cup_win'`)
- Modify: `src/lib/people/store.ts` (월드컵 읽기 함수)
- Create: `src/lib/cup/votes.ts`, `src/app/api/people/cup/route.ts`
- Modify: `docs/people-votes.sql` (월드컵 함수 절 추가), Create: `docs/cup-votes.sql` (이번에 실행할 함수만, 위 절과 같은 내용)
- Test: `tests/cupVotes.test.ts`; 기존 `tests/peopleVotes.test.ts`는 고치지 않고 그대로 통과해야 한다.

**Interfaces:**
- Consumes: `voterHash`, `signPvCookie`, `verifyPvCookie`, `pvUuidFor`, `kstDay`, `pairKey`(`@/lib/people/votes`), `clientIp`, `readLimitedBody`, `createGuard`(`@/lib/duel/feedbackGuard`), `storeConfig`, `insertVote`(`@/lib/people/store`), `boardPool`, `isBoardKey`, `BoardKey`(Task 1).
- Produces:
  - `voter.ts`: `PV_COOKIE = 'pv'`, `readPvCookie(request: Request): string | null`, `sameSite(request: Request): boolean`, `resolveVoter(request: Request, secret: string, ip: string, now: Date): Promise<{ day: string; voterHash: string; setCookie: string | null }>` — 지금 `vote/route.ts` 안의 쿠키 검증·`new` 규칙·발급과 똑같이. `setCookie`는 `Set-Cookie` 헤더 값 전체(속성 포함) 또는 null.
  - `cup/votes.ts`: `type CupVote = { type: 'match'; board: BoardKey; a: string; b: string; pick: string } | { type: 'win'; board: BoardKey; id: string }`, `validateCupVote(body: unknown): CupVote | null`(판 키 유효, 모든 id가 `boardPool(board)` 안, a≠b, pick∈{a,b}), `cupRow(v: CupVote): { kind: 'cup_match' | 'cup_win'; target: string; option: string }`, `cupGuard = createGuard(200)`.
  - `store.ts`: `readCupPair(cfg, pair: string): Promise<Record<string, number>>`(RPC `cup_pair_stats`), `readCupSummary(cfg): Promise<{ plays: Record<BoardKey, number>; wins: Record<BoardKey, { id: string; n: number }[]>; matchWins: { id: string; n: number }[] }>`(RPC `cup_win_counts`, `cup_match_wins`; wins는 판마다 많은 순·동점 id 오름차순, plays는 판마다 wins 합).
  - API `POST /api/people/cup`: 415/403/429/413/400/503(꺼짐, 한도 환불)/502는 열전 투표와 같은 규칙. match 응답 `{ ok: true, counted: true, others: Record<string, number> | null }` — others는 저장 뒤 쌍 집계에서 내 선택 1표를 뺀 값(0 아래로 내려가지 않음), 읽기 실패면 null. win 응답 `{ ok: true }`. 새 쿠키는 어느 응답에든 실어 보낸다.
  - SQL 함수(모두 `language sql stable`, public·anon·authenticated에서 execute 회수, service_role에 부여):
    - `cup_pair_stats(p_pair text) returns table(option text, n bigint)` — `kind='cup_match' and target=p_pair` group by option
    - `cup_win_counts() returns table(target text, option text, n bigint)` — `kind='cup_win'` group by target, option
    - `cup_match_wins() returns table(option text, n bigint)` — `kind='cup_match'` group by option order by n desc, option asc limit 50
    - 인덱스 `create index if not exists people_votes_kind_target_idx on people_votes (kind, target);`

- [ ] **Step 1: 실패하는 테스트** (`tests/cupVotes.test.ts`, 기존 `tests/peopleVotes.test.ts`의 fetch 모킹·요청 생성 방식을 그대로 따른다)
  - `validateCupVote`: 정상 match·win 통과 / 판 키 `__proto__`·`x` 거부 / warrior 판에 `zhugeliang` 거부 / a===b 거부 / pick이 둘 밖이면 거부 / 배열·null 거부
  - `cupRow({type:'match',board:'warrior',a:'lvbu',b:'guanyu',pick:'lvbu'})` → `{ kind:'cup_match', target:'guanyu__lvbu', option:'lvbu' }`; win → `{ kind:'cup_win', target:'warrior', option:<id> }`
  - API: 환경 변수 없으면 503이고 그 요청은 한도에서 빠진다 / Origin이 다른 사이트면 403 / text/plain이면 415
  - API match: 모킹한 insert 성공 + `cup_pair_stats`가 `[{option:'lvbu',n:4},{option:'guanyu',n:1}]`이고 내가 lvbu를 골랐으면 `others` = `{ lvbu: 3, guanyu: 1 }`
  - API match: 집계 읽기 실패면 200에 `others: null`
  - API: 쿠키 없는 요청은 `Set-Cookie: pv=...; Path=/api/people`를 받고, 같은 IP 두 번째 요청도 같은 값(열전과 같은 발급 규칙)
  - 속도 제한: 같은 IP 201번째 요청 429, 열전 `voteGuard`와 한도를 나누지 않는다(월드컵 200번 뒤에도 열전 투표는 통과)
- [ ] **Step 2: 실패 확인** — `npx vitest run tests/cupVotes.test.ts` FAIL
- [ ] **Step 3: `voter.ts`로 공통화하고 `vote/route.ts`가 그것을 쓰게 바꾼다** — `npx vitest run tests/peopleVotes.test.ts`가 고치지 않은 채로 PASS여야 한다.
- [ ] **Step 4: `cup/votes.ts`, store 함수, `/api/people/cup` 구현, SQL 문서 추가**
- [ ] **Step 5: 통과 확인** — `npx vitest run tests/cupVotes.test.ts tests/peopleVotes.test.ts tests/peopleWidgets.test.tsx` PASS, `npx tsc --noEmit` 0
- [ ] **Step 6: 커밋** — `feat(cup): 월드컵 투표 API와 집계 함수, 투표자 판별 공통화`

### Task 4: 대결 화면과 끝 화면 (`/samguk/cup/[board]`)

**Files:**
- Create: `src/app/samguk/cup/[board]/page.tsx` (서버: `generateStaticParams` 4개, `dynamicParams = false`, 후보 카드·만난 장면을 props로)
- Create: `src/components/cup/CupGame.tsx` (클라이언트), `src/components/cup/CupCardButton.tsx`, `src/components/cup/CupResult.tsx`
- Modify: `src/lib/analytics.ts` (`TestName`에 `'cup'`, 이벤트 `cup_start: { result_id: string }`, `cup_end: { result_id: string }`)
- Test: `tests/cupGame.test.tsx`(컴포넌트), 번들 검사 추가

**Interfaces:**
- Consumes: Task 1 `BOARDS`, `boardPool`, `drawEntrants`, `cupCards`, `meetNotes`, `CupCard`, `MeetNote`; Task 2 전부; `pairKey`(`@/lib/people/keys`); `josa`; `useResultShare`(`@/hooks/useResultShare`); Task 5의 `cupShareUrl`, `cupOgImageUrl`(이 태스크에서는 Task 5 전이라 `src/lib/cup/share.ts`를 이 태스크에서 먼저 만든다: `cupSharePath(board, id) => '/samguk/cup/r/<board>/<id>'`, `cupShareUrl(board,id)` = SITE+경로+`?utm_source=share&utm_medium=friend_link&utm_campaign=cup`, `cupOgImageUrl(board,id)` = `${SITE}/api/og/result?kind=cup&board=<board>&key=<id>`, `cupPhrase(name) => '나의 최애 장수는 <name>. 너는?'`).
- Produces: `CupGame` props `{ board: BoardKey; title: string; cards: CupCard[]; notes: Record<string, MeetNote>; top5: { id: string; name: string; n: number }[] }` — top5는 서버가 ISR(`revalidate = 3600`)로 읽은 그 판 우승 순위(못 읽으면 빈 배열). 무작위 판은 우승 순위를 매기지 않으므로 늘 빈 배열. 이 페이지가 `readCupSummary`를 부르므로 Task 3 store 함수를 쓴다.

화면 동작(스펙 "한 대결 화면"·"끝 화면" 그대로):
- 마운트 때 `drawEntrants(board, Math.random, withId)`로 대진, `withId`는 `useSearchParams().get('with')`(Suspense로 감싼다). 서버 HTML에는 대진 없이 판 이름과 `불러오는 중` 자리만(하이드레이션 차이 방지). `track('cup_start', { result_id: board })`.
- 두 카드 2열: 초상화, 이름, `line`, `알고 보면:` + 그 대결에서 `facts` 중 무작위 하나(대결이 바뀌면 다시 고름, 같은 대결 안에서는 고정).
- `notes[pairKey(a,b)]`가 있으면 `이 둘이 만난 장면:` + note + 출처 칩(`연의`/`정사`/`배송지 주`, 열전 관계 칩과 같은 모양). 없으면 이 줄 없음.
- 카드를 누르면 그 대결은 잠기고(두 번째 누름 무시) 고른 쪽 강조, 비율 칸, `다음 대결` 버튼(바로 누를 수 있음, h-[52px]). POST `/api/people/cup` `{type:'match',board,a,b,pick}`를 보내고, 응답은 보낼 때의 `matchNumber`와 지금이 같을 때만 비율 칸에 반영(`others`→문구, 실패·null·비정상 상태 코드→`'error'`).
- 마지막 대결 뒤 `win` POST(결과 무시), `track('cup_end', { result_id: \`${board}_${champion}\` })`, `CupResult` 표시.
- `CupResult`: `나의 최애 장수` 큰 초상화·이름·`line`·판 이름, 결승까지의 길(`championPath` 이름을 `→` 없이 `·`로), `공유하기`(`useResultShare({ testName:'cup', title, text: cupPhrase(name), url: cupShareUrl(board, id), imageUrl: cupOgImageUrl(board, id) })`), `<이름> 열전 보기`(`/samguk/people/<id>`), `다른 판 하기`(`/samguk/cup`), top5가 있으면 목록 + `전체 순위 보기`(`/samguk/cup/ranking`).

- [ ] **Step 1: 실패하는 테스트** (`tests/cupGame.test.tsx`, @testing-library/react, fetch 모킹)
  - 4장 카드 fixture로 8강이 아닌 경우를 피하려면 8장 fixture를 쓴다. 첫 화면에 `둘 중 누가 더 끌리나요?`와 진행 `테스트 판 8강 · 1/4`.
  - 왼쪽 카드를 두 번 빠르게 누르면 fetch가 1번만 불린다.
  - 만난 장면이 있는 쌍에서만 `이 둘이 만난 장면:`이 보인다.
  - 첫 대결 응답을 지연시키고 `다음 대결`을 눌러 두 번째 대결로 간 뒤 첫 응답이 도착해도, 두 번째 대결의 비율 칸은 비어 있다.
  - fetch가 503이면 `지금은 다른 사람 선택을 불러오지 못했어요`가 보이고 `다음 대결`로 계속 진행된다.
  - 7번 고르면 `나의 최애 장수`, `<이름> 열전 보기` 링크 href `/samguk/people/<id>`, `다른 판 하기` href `/samguk/cup`.
  - top5가 빈 배열이면 순위 목록과 `전체 순위 보기`가 없다.
- [ ] **Step 2: 번들 검사 추가** — 허브의 번들 테스트(`tests/peopleHub.test.tsx`의 import 검사)와 같은 방식으로 `src/components/cup/*.tsx`가 `@/content/samgukPeople`·`@/lib/cup/cards`를 import하지 않음을 확인.
- [ ] **Step 3: 실패 확인** → **Step 4: 구현** → **Step 5: 통과 확인** (`npx vitest run tests/cupGame.test.tsx tests/cupBoards.test.ts tests/cupGame.test.ts`, tsc)
- [ ] **Step 6: GA 값 길이 테스트** — `tests/cupBoards.test.ts`에 모든 판 키 × `boardPool` id 조합의 `${board}_${id}`가 `isSafeValue`를 통과하는지 추가.
- [ ] **Step 7: 커밋** — `feat(cup): 대결 화면·끝 화면과 GA`

### Task 5: 판 고르기·순위·공유 착지·미리보기 이미지

**Files:**
- Create: `src/app/samguk/cup/page.tsx`(판 고르기, `revalidate = 3600`), `src/app/samguk/cup/ranking/page.tsx`(`revalidate = 3600`), `src/app/samguk/cup/r/[board]/[id]/page.tsx`(공유 착지)
- Modify: `src/lib/cup/share.ts`(Task 4에서 만든 파일에 `parseCupShare(board: string, id: string): { board: BoardKey; id: string; name: string; image: string; phrase: string } | null` 추가 — 엣지 안전, `samgukDB`·`boards.ts`만 import)
- Modify: `src/lib/ogQuery.ts`(`cup: ['board', 'key']`), `src/app/api/og/result/route.tsx`(`kind === 'cup'` 분기: big=이름, score=판 이름, phrase=`cupPhrase`, label=`삼국지 장수 월드컵`, 초상화 로드)
- Test: `tests/cupPages.test.tsx`, 기존 OG 테스트 파일에 cup 사례 추가

**Interfaces:**
- Consumes: Task 1·3·4.
- Produces: 페이지 4종, `parseCupShare`.

화면:
- `/samguk/cup`: 라벨 `삼국지 장수 월드컵`, 제목(font-serif) `누가 나의 최애 장수일까요?`, 소개 한 줄 `16명 중 한 명을 고를 때마다 짧은 이야기를 읽어요`. 판 카드 4개(판 이름, blurb, basis가 있으면 작은 글씨, 대표 초상화 하나: 판 후보 첫 id), `plays[board] > 0`이면 `지금까지 N판`. 아래 `전체 순위 보기`, `삼국지 인물열전` 링크. 메타 제목은 Global Constraints 값, 설명 `최강 무장·최고 책사·삼국지 여인·전체 무작위 16강. 장수마다 열전에서 뽑은 짧은 이야기를 읽고 골라 보세요.`, canonical `https://unse-ai.com/samguk/cup`.
- `/samguk/cup/ranking`: 제목 `삼국지 장수 월드컵 순위 | 판별 우승 – 운명을 읽다`(48자 이하 확인). 판별(무작위 판 제외) 우승 순위 상위 10, `많이 이긴 장수` 상위 10(`matchWins`). 집계가 없으면 `아직 우승 기록을 모으는 중이에요`와 판 고르기 링크. 이름은 열전 링크.
- `/samguk/cup/r/[board]/[id]`: `parseCupShare`가 null이면 `redirect('/samguk/cup')`. 메타는 일기토 공유 착지(`src/app/samguk/duel/r/[key]/page.tsx`)와 같은 구성(title `<phrase> | 운명을 읽다`, noindex follow, canonical `/samguk/cup`, og 이미지 `cupOgImageUrl`). 본문: `친구의 최애 장수` 카드(초상화·이름·판 이름), 버튼 `나도 해보기`(`/samguk/cup/<board>`), `<이름> 열전 보기`. `SharedLandingTracker test="cup" resultId={board}`.

- [ ] **Step 1: 실패하는 테스트**
  - `parseCupShare('warrior','lvbu')` → name `여포`, phrase `나의 최애 장수는 여포. 너는?`; `parseCupShare('warrior','zhugeliang')` null; `parseCupShare('x','lvbu')` null; `parseCupShare('random','__proto__')` null; 초상화 대기 인물 id는 null.
  - `ogQueryOk`: `kind=cup&board=warrior&key=lvbu` true, `kind=cup&board=warrior&key=lvbu&s=90` false.
  - OG 라우트: `kind=cup&board=warrior&key=zhugeliang` 400.
  - 페이지 제목 길이 ≤ 48(`/samguk/cup`, `/samguk/cup/ranking`).
  - 판 고르기: 집계를 못 읽으면 `지금까지` 문구가 없다(store 모킹).
- [ ] **Step 2: 실패 확인** → **Step 3: 구현** → **Step 4: 통과 확인** (`npx vitest run tests/cupPages.test.tsx` + OG 테스트 파일, tsc)
- [ ] **Step 5: 커밋** — `feat(cup): 판 고르기·순위·공유 착지·미리보기 이미지`

### Task 6: 연결과 문서

**Files:**
- Modify: `src/app/sitemap.ts`(`/samguk/cup`, `/samguk/cup/ranking`, `LAST_MODIFIED` 둘 다 오늘 날짜)
- Modify: `src/content/navigation.ts`(얼굴 묶음 `삼국지 인물열전` 바로 다음에 `{ title: '삼국지 장수 월드컵', desc: '이야기를 읽고 고르는 16강', href: '/samguk/cup', thumb: { image: '/images/samguk/관우.jpg' }, chip: '16강' }`)
- Modify: `src/components/people/PeopleBrowser.tsx` 근처 허브 바로가기(지금 `관계도 보기`·`응원 순위` 두 칸) → 세 번째 `장수 월드컵`(→ `/samguk/cup`). 3칸이 375px에 안 맞으면 2+1 배치.
- Modify: `src/app/samguk/people/[id]/page.tsx` — 대결 투표(VotePoll kind duel) 바로 아래 링크 `이 장수로 월드컵 하기`: 그 인물이 warrior·strategist·women 후보면 그 판(`/samguk/cup/<board>?with=<id>`, 여럿이면 이 순서의 첫 판), 아니면 `/samguk/cup/random?with=<id>`. 초상화 대기 인물은 링크 없음.
- Modify: `src/app/samguk/(match)/page.tsx` — 결과의 `내가 닮은 장수 응원하기` 링크 바로 아래에 `닮은 장수로 월드컵 하기`(위와 같은 판 고르기 규칙). 스펙은 'NextTests 옆이나 아래'라고 했고, 열전 링크와 한 묶음으로 두는 것은 계획 작성자 판단.
- Modify: `src/app/privacy/page.tsx` 6항 — 인물열전 응원·투표 설명에 "장수 월드컵 선택과 우승 결과"를 같은 방식(해시만 저장)으로 포함.
- Modify: `CLAUDE.md` — "삼국지 인물열전" 절 아래 `## 삼국지 장수 월드컵 (/samguk/cup)` 절: 라우트 4종, `src/lib/cup/` 파일 역할, 판 구성 규칙, 저장 종류와 API·속도 제한, 비율 문구 규칙, SQL 파일(`docs/cup-votes.sql`, 실행 여부).
- Test: 기존 `tests/sitemap*`, 네비게이션·허브 테스트 갱신, `tests/cupLinks.test.ts`(열전 링크 판 고르기 규칙: `lvbu`→warrior, `zhugeliang`→strategist, `diaochan`→women, `liushan`처럼 어느 고정 판에도 없는 인물→random, 초상화 대기 인물→null). 판 고르기 함수 `cupBoardFor(id: string): BoardKey | null`은 `src/lib/cup/boards.ts`에 추가.

- [ ] **Step 1: `cupBoardFor` 실패 테스트** → **Step 2: 구현** → **Step 3: 연결 수정** → **Step 4: `npm test`, tsc, 바뀐 파일 eslint** → **Step 5: 커밋** `feat(cup): 메뉴·허브·열전·닮은꼴 결과 연결과 문서`

### Task 7: E2E와 전체 검증

**Files:**
- Create: `e2e/cup.spec.ts`
- Modify: `e2e/chrome-emoji.spec.ts`(새 경로 `/samguk/cup`, `/samguk/cup/warrior`, `/samguk/cup/ranking`, `/samguk/cup/r/warrior/lvbu` 추가)

E2E(환경 변수 없는 빌드 그대로):
- 판 고르기: 판 카드 4개, `지금까지` 문구 없음, `최강 무장` 누르면 `/samguk/cup/warrior`.
- 최강 무장 한 판: 매 대결 왼쪽 카드를 누르고 비율 칸에 `지금은 다른 사람 선택을 불러오지 못했어요`가 뜬 것을 확인한 뒤 `다음 대결`, 15번 뒤 `나의 최애 장수`와 `열전 보기` 링크, `dataLayer`에 `cup_start`·`cup_end`.
- 같은 대결에서 카드 두 번 누르기 → `/api/people/cup` 요청 1번(`page.on('request')`로 셈).
- 여인 판: 진행 표시가 `8강 · 1/4`로 시작, 7번 뒤 끝 화면.
- `?with=guanyu`로 무작위 판을 열고 끝까지 가는 동안 관우 카드가 한 번은 보인다.
- 공유 착지: `/samguk/cup/r/warrior/lvbu`에 `나도 해보기`, `meta[name=robots]`에 noindex. `/samguk/cup/r/warrior/zhugeliang`은 `/samguk/cup`으로 이동.
- 375px: `/samguk/cup/warrior` 가로 스크롤 없음, 카드 버튼 높이 44px 이상.
- 열전 `/samguk/people/lvbu`의 `이 장수로 월드컵 하기` href가 `/samguk/cup/warrior?with=lvbu`.

- [ ] **Step 1: E2E 작성** → **Step 2: `npx next build`** → **Step 3: `npm run test:e2e -- e2e/cup.spec.ts e2e/chrome-emoji.spec.ts e2e/people.spec.ts`** PASS → **Step 4: `npm test` 전체, `npx tsc --noEmit`, `npm run test:e2e` 전체** PASS
- [ ] **Step 5: 커밋** — `test(cup): 월드컵 E2E`

## 배포 전 (컨트롤러, 사용자 승인 필요)

1. `docs/cup-votes.sql`을 Supabase 프로젝트 `real-estate`(id `dytfzufccqsakigehjkx`)에 실행하고, anon이 세 함수를 실행할 수 없는지 확인.
2. main 병합·push, 운영에서 한 판 플레이로 저장·비율 확인 뒤 시험 표 삭제(`kind in ('cup_match','cup_win')`만, 그 시각 이후 행만).
3. 구글·네이버에 `/samguk/cup`, `/samguk/cup/ranking` 색인 요청.
