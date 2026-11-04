# 월드컵 쿠팡 배너 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 장수 월드컵 판 고르기(`/samguk/cup`)와 끝 화면(`CupResult`)에 기존 쿠팡 다이나믹 배너(`CoupangBanner`)를 넣어, 쇼츠 → 월드컵으로 들어온 방문자도 쿠팡 배너를 보게 한다.

**Architecture:** 새 컴포넌트 없이 `src/components/CoupangBanner.tsx`를 그대로 두 곳에 붙인다. 위치는 기존 결과 페이지 관례(공유·저장 버튼 바로 아래, 다음 읽을거리 위)를 따른다. subId로 쿠팡 리포트와 GA에서 위치를 구분한다.

**Tech Stack:** Next.js 16 App Router, React, vitest(+testing-library), Playwright

**Spec:** 별도 설계 문서 없음 — 2026-11-04 대화에서 사용자가 "월드컵 판 고르기·끝 화면에 쿠팡 다이나믹 배너" 요청. 배너 동작 규칙은 `CLAUDE.md` "시즌 추천 (쿠팡 파트너스)" 절과 `CoupangBanner.tsx` 주석이 기준.

## Global Constraints

- 배너 컴포넌트·위젯 id(1043563)·추적 코드·대가성 문구는 바꾸지 않는다. 새 쿠팡 컴포넌트를 만들지 않는다.
- subId: 판 고르기 `cup-hub`, 끝 화면 `cup-${board}` (`cup-warrior`·`cup-strategist`·`cup-women`·`cup-random`). GA slot은 `gaSlot`이 하이픈을 밑줄로 바꾼 값(`cup_hub`, `cup_strategist` …).
- 게임 진행 중(대결 화면)과 공유 착지(`/samguk/cup/r/...`)·순위 페이지에는 넣지 않는다.
- 클라이언트 월드컵 컴포넌트는 열전 본문·서버 카드 모듈을 가져오지 않는다(`tests/cupGame.test.tsx` 마지막 테스트). `CoupangBanner`는 `@/content/coupangSeasons`만 가져와 괜찮다.
- 가짜 숫자 금지 등 월드컵 표시 규칙은 그대로.
- `git add`는 파일 이름으로. 커밋 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. 메인 저장소의 추적 안 된 파일(`docs/videos/`, `public/images/samguk/새장수/`, `scripts/*portrait*`, `scripts/.run-faces.tmp.mjs`)은 건드리지 않는다.

## Review Focus

1. 375px 폭: 배너 iframe(가로 400)이 판 고르기에서 가로 스크롤을 만들면 안 된다(`max-w-full`) → Task 1 E2E에 검사 추가.
2. 대결 중에는 배너가 없어야 한다(끝 화면에만) → Task 1 단위 테스트.
3. 끝 화면 순서: 버튼 묶음(공유하기·열전 보기·다른 판 하기) → 배너 → 우승 순위. 배너가 버튼 위로 오면 공유 클릭이 줄어든다 → Task 1 단위 테스트.
4. GA slot 값이 개인정보 필터를 통과해야 한다(`cup_strategist` 14자, 영문·밑줄) → Task 1 `gaSlot` 테스트.
5. 번들: `CupResult`가 `CoupangBanner`를 가져와도 열전 본문이 클라이언트 번들에 들어가지 않는다 → 기존 테스트가 잡는다(실행만 확인).

---

### Task 1: 판 고르기·끝 화면에 배너

**Files:**
- Modify: `src/app/samguk/cup/page.tsx` (board `<ul>` 바로 아래, "전체 순위 보기"·"삼국지 인물열전" 버튼 묶음 위)
- Modify: `src/components/cup/CupResult.tsx` (버튼 묶음 `div.mt-5.space-y-3` 바로 아래, `top5` 섹션 위)
- Modify: `CLAUDE.md` (월드컵 절 표시 규칙에 한 줄)
- Test: `tests/coupang.test.ts`, `tests/cupGame.test.tsx`, `tests/cupPages.test.tsx`, `e2e/cup.spec.ts`

**Interfaces:**
- Consumes: `CoupangBanner({ subId: string; tone?: 'light' | 'dark' })` 기본 내보내기, `gaSlot(subId)` — `src/components/CoupangBanner.tsx`. `CupResult`의 기존 `board: BoardKey` prop.
- Produces: 없음(화면만).

- [ ] **Step 1: 실패하는 단위 테스트 쓰기**

`tests/coupang.test.ts`의 페이지 목록 `test.each`에 `['src/app/samguk/cup/page.tsx', 'cup-hub']`를 추가한다(그 테스트는 `<CoupangBanner subId="cup-hub"` 문자열을 찾는다). `gaSlot` 테스트에 한 줄:

```ts
expect(gaSlot('cup-strategist')).toBe('cup_strategist')
```

`tests/cupPages.test.tsx`의 `'판 고르기: 판 카드 4개와 실제 판 수만 적는다'`에 순서 검사를 더한다:

```ts
expect(html).toContain('subId=cup-hub')
const lastBoard = html.indexOf('href="/samguk/cup/random"')
const banner = html.indexOf('추천 상품')
const ranking = html.indexOf('href="/samguk/cup/ranking"')
expect(lastBoard).toBeLessThan(banner)
expect(banner).toBeLessThan(ranking)
```

(`random`은 `BOARD_KEYS`의 마지막 키다.)

`tests/cupGame.test.tsx`:
- `'첫 화면: 질문과 진행 표시'`에 `expect(screen.queryByText('추천 상품')).toBeNull()` 추가(대결 중에는 배너 없음).
- `'top5가 있으면 순위와 전체 순위 보기가 있다'`에 추가:

```ts
const banner = document.querySelector('iframe[title="쿠팡 추천 상품"]')
expect(banner?.getAttribute('src')).toContain('subId=cup-warrior')
const other = screen.getByRole('link', { name: '다른 판 하기' })
const top5 = screen.getByTestId('cup-top5')
const label = screen.getByText('추천 상품')
expect(other.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
expect(label.compareDocumentPosition(top5) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/coupang.test.ts tests/cupGame.test.tsx tests/cupPages.test.tsx`
Expected: 새로 넣은 검사만 FAIL(`cup-hub` 없음, `추천 상품` 없음).

- [ ] **Step 3: 배너 넣기**

- `src/app/samguk/cup/page.tsx`: `import CoupangBanner from "@/components/CoupangBanner";` 후 `</ul>` 다음 줄에 `<CoupangBanner subId="cup-hub" />`. (서버 페이지에 클라이언트 컴포넌트를 넣는 것은 열전 페이지와 같은 방식.)
- `src/components/cup/CupResult.tsx`: `import CoupangBanner from '@/components/CoupangBanner'` 후 버튼 묶음 `</div>` 다음, `{top5.length > 0 && …}` 앞에 `<CoupangBanner subId={`cup-${board}`} />`.
- `CLAUDE.md` 월드컵 절에 한 줄: "쿠팡 다이나믹 배너: 판 고르기(`cup-hub`, 판 목록 아래)·끝 화면(`cup-<판>`, 버튼 아래·우승 순위 위). 대결 중·공유 착지·순위 페이지에는 없다."

- [ ] **Step 4: 단위 테스트 통과 확인**

Run: `npx vitest run tests/coupang.test.ts tests/cupGame.test.tsx tests/cupPages.test.tsx`
Expected: PASS (번들 검사 `클라이언트 월드컵 컴포넌트는 열전 본문·서버 카드 모듈을 번들에 넣지 않는다` 포함)

Run: `npm test`
Expected: 전체 PASS

- [ ] **Step 5: E2E 검사 추가**

`e2e/cup.spec.ts`:
- `'판 고르기: …'` 테스트에서 board 카드 확인 뒤(클릭 전) 추가:

```ts
await expect(page.getByText('추천 상품', { exact: true })).toBeVisible()
```

- `'최강 무장 한 판: …'` 끝 화면 확인 뒤 추가:

```ts
const other = await page.getByRole('link', { name: '다른 판 하기' }).boundingBox()
const coupang = await page.getByText('추천 상품', { exact: true }).boundingBox()
expect(other!.y).toBeLessThan(coupang!.y)
```

- `'375px: …'` 테스트 맨 앞에 판 고르기 가로 스크롤 검사:

```ts
await page.goto('/samguk/cup')
await expect(page.getByText('추천 상품', { exact: true })).toBeVisible()
expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
```

(그다음 기존 `page.goto('/samguk/cup/warrior')`부터 그대로.)

- [ ] **Step 6: E2E 통과 확인**

Run: `npx playwright test e2e/cup.spec.ts e2e/people.spec.ts`
Expected: 전부 PASS. 쿠팡 iframe은 외부 도메인이라 E2E에서 비어 있을 수 있고, 5초 뒤 대체 링크로 바뀌어도 "추천 상품" 글자는 남으므로 검사는 그대로 통과해야 한다. `trackErrors`가 쿠팡 쪽 콘솔 오류를 잡아 실패하면, 열전 E2E(`e2e/people.spec.ts`)가 같은 배너로 어떻게 통과하는지 보고 같은 방식으로 맞춘다(검사를 지우지 않는다).

- [ ] **Step 7: 커밋**

```bash
git add src/app/samguk/cup/page.tsx src/components/cup/CupResult.tsx CLAUDE.md tests/coupang.test.ts tests/cupGame.test.tsx tests/cupPages.test.tsx e2e/cup.spec.ts docs/superpowers/plans/2026-11-04-cup-coupang-banner.md
git commit -m "feat(cup): 판 고르기·끝 화면에 쿠팡 다이나믹 배너

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## 배포 후 확인 (컨트롤러, push는 사용자 승인 뒤)

- `https://unse-ai.com/samguk/cup` HTML에 `subId=cup-hub` iframe이 있는지 `curl`로 확인.
- 하루 뒤 GA4 `coupang_banner_view`에서 slot `cup_hub`·`cup_<판>`이 잡히는지, 쿠팡 파트너스 리포트 subId에 `cup-`가 보이는지 확인.
