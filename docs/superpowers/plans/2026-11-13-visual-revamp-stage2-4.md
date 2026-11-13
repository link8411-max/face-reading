# 화면 개편 2~4단계(메뉴·홈·캐릭터·움직임) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 시안(https://claude.ai/artifact/3ZAHMjwtZHe1Kgss1HZ66F)처럼 하단 탭을 홈·전체·오늘 3칸으로 줄이고, 홈을 짧게 다시 짜고, 캐릭터 여섯을 테스트 얼굴·결과 카드·분석 화면·미리보기 이미지·사이트 아이콘에 넣고, 진입·누름·탭·결과 공개 움직임을 넣는다.

**Architecture:** 캐릭터 데이터는 `src/content/cast.ts` 한 곳, 메뉴 데이터는 기존 `src/content/navigation.ts`에 `tags`·`daily`를 더해 홈·전체·오늘·푸터가 모두 여기서 나온다. 움직임은 CSS만 쓰고(`globals.css`), 결과 캡처 때는 문서에 `no-motion`을 붙여 완성 상태를 찍는다.

**Tech Stack:** Next.js 16 App Router, Tailwind 4, `@vercel/og`, `sharp`, vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-13-visual-revamp-design.md` (5절 2·3·4단계, 5.6, 5.7). 1단계 계획 `docs/superpowers/plans/2026-11-13-visual-revamp-stage1.md`는 끝났다.

## Global Constraints

- 브랜치 `visual-revamp-1`(이 워크트리)에서 이어서 한다. push·머지 금지(사용자 확인 뒤).
- 주소는 하나도 바꾸지 않는다. 새 주소는 `/all`, `/today`뿐이다. 허브 3곳(`/face-tests`, `/unse`, `/mbti`)은 주소·소개 글·`CategoryList`를 그대로 둔다.
- 각 페이지 `<title>`·설명·구조화 데이터는 바꾸지 않는다. 홈 `h1`은 계속 "운명을 읽다"와 "관상"을 담는다(`e2e/design.spec.ts`).
- 서버 HTML에 모든 카드·링크가 있어야 한다. 칩 거르기는 클라이언트에서 `hidden`으로만 한다. `loading.tsx` 금지(테스트로 막혀 있다).
- 캐릭터 그림은 `public/images/cast/<key>.webp`(640px), `<key>-face.webp`(240px 얼굴), `<key>-og.png`(512px, 미리보기 이미지용)이 이미 있다(커밋 전). 키: `haetae`, `saja`, `gumiho`, `mudang`, `tiger`, `dokkaebi`.
- 이름·색(배경): 해태 Haetae `#E7A93A`, 저승사자 Jeoseung Saja `#1E2752`, 구미호 Gumiho `#E8704A`, 무당 Mudang `#C8372D`, 백호 Baekho `#A7B4C6`, 도깨비 Dokkaebi `#1F6B55`.
- 움직임은 한 번 재생하고 멈춘다(무한 반복 금지, 분석 중 화면만 예외). `prefers-reduced-motion`이면 모두 끈다. 처음부터 완전히 투명하게 시작하지 않는다(최소 opacity .3).
- 결과 캡처(`lib/capture.ts`)는 움직임이 끝난 모습이어야 한다.
- 부적(`/bujeok`)·일기토(`/samguk/duel`) 화면 안쪽은 손대지 않는다. 삼국지 결과는 장수 초상화가 주인공이라 캐릭터를 넣지 않는다.
- 이모지·가짜 숫자·가짜 진행률(시간으로 채우는 % 막대) 금지.
- 커밋 메시지 한국어, 끝 줄 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. 작업마다 `npm test` 통과. E2E는 Task 3·6 끝에.
- 기존 E2E 실패 3개는 이번과 무관하다: `buttons.spec.ts` /exam/meme(Supabase), `gift-nudge.spec.ts:20`·`home.spec.ts:83`(라디오 이름 "선물 보내기" vs 화면 "선물하기"). home.spec.ts를 고칠 때 83행은 화면 문구 "선물하기"에 맞춰 같이 고친다.

## Review Focus

1. **캡처에 중간 프레임**: 결과가 나오자마자 공유 이미지를 미리 만드는 화면(`useScreenshot(result)`)이 움직임 도중을 찍을 수 있다 → Task 4에서 `no-motion` 테스트.
2. **검색으로 바로 들어온 사람**: 테스트 시작·결과 화면에서 다른 테스트로 가는 길이 탭바뿐이면 안 된다 → Task 3의 "다른 테스트 둘러보기".
3. **좁은 화면**: 320px에서 탭 3칸, 홈 2열 카드, 칩 줄이 넘치지 않아야 한다 → Task 2·3 E2E.
4. **홈 길이**: 사용자가 "메인 스크롤이 너무 길다"고 했다. 390px에서 홈 본문(푸터 제외) 높이 2,600px 이하 → Task 3 E2E로 잰다.
5. **카카오톡·검색 미리보기**: 캐릭터를 넣은 OG 이미지가 1200×630에서 글자를 가리지 않고, 그림을 못 받으면 그림 없이라도 나와야 한다 → Task 5.

---

### Task 1: 캐릭터 데이터

**Files:**
- Create: `src/content/cast.ts`
- Test: `tests/cast.test.ts`
- Add (커밋): `public/images/cast/*`

**Interfaces:**
- Produces:
  - `type CastKey = 'haetae' | 'saja' | 'gumiho' | 'mudang' | 'tiger' | 'dokkaebi'`
  - `CAST: Record<CastKey, { name: string; en: string; bg: string; role: string; img: string; face: string; og: string }>` (role은 "관상을 맡아요" 같은 한 줄, 영어판은 뒤 단계)
  - `castForHref(href: string): CastKey | null` — `/face2`→haetae, `/animal`→tiger, `/face-match`→gumiho, `/saju`·`/fortune`(하위 전부)·`/unse`→saja, `/bujeok`→mudang, `/exam`(하위)·`/samguk/cup`·`/samguk/duel`→dokkaebi, `/mbti`(하위)→gumiho, `/face-tests`→haetae. 그 밖(삼국지 닮은꼴·열전 등)은 null.

- [x] **Step 1: 실패하는 테스트**

```ts
import { existsSync } from 'node:fs'
import { CAST, castForHref } from '@/content/cast'

test('캐릭터 여섯 모두 그림 세 벌이 있다', () => {
  for (const c of Object.values(CAST)) for (const p of [c.img, c.face, c.og]) expect(existsSync(`public${p}`), p).toBe(true)
})
test('테스트 주소에 맞는 캐릭터', () => {
  expect(castForHref('/face2')).toBe('haetae')
  expect(castForHref('/fortune/daily')).toBe('saja')
  expect(castForHref('/bujeok?mode=gift')).toBe('mudang')
  expect(castForHref('/exam/meme')).toBe('dokkaebi')
  expect(castForHref('/samguk')).toBeNull()
})
```

- [x] **Step 2: 실패 확인** — `npx vitest run tests/cast.test.ts` → FAIL(모듈 없음)
- [x] **Step 3: `src/content/cast.ts` 작성** (값은 Global Constraints. 경로는 `/images/cast/<key>.webp` 형식. 쿼리·해시는 떼고 비교)
- [x] **Step 4: 통과 확인** — `npm test` → PASS
- [x] **Step 5: 커밋** — `git add src/content/cast.ts tests/cast.test.ts public/images/cast && git commit -m "캐릭터 여섯 데이터와 그림(해태·저승사자·구미호·무당·백호·도깨비)"`

---

### Task 2: 메뉴 3탭과 전체·오늘 페이지

**Files:**
- Modify: `src/content/navigation.ts` (TABS, TabKey, CategoryItem에 `tags`·`daily`, tabForPath, 각 항목 thumb)
- Modify: `src/components/BottomTabBar.tsx` (3칸, 미끄러지는 표시 막대)
- Create: `src/app/all/page.tsx`, `src/app/all/AllTests.tsx`(클라이언트: 검색창 거르기), `src/app/today/page.tsx`
- Modify: `src/app/sitemap.ts` (`/all`, `/today` 추가, `LAST_MODIFIED` 갱신)
- Test: `tests/navigation.test.ts`(새로), `e2e/tabbar.spec.ts`, `tests/hubs.test.ts`(필요한 만큼)

**Interfaces:**
- Consumes: Task 1 `castForHref`, `CAST`.
- Produces:
  - `TabKey = 'home' | 'all' | 'today'`, `TABS`: 홈 `/`(icon home), 전체 `/all`(icon은 icons.tsx에 `grid` 추가: 2×2 둥근 사각형, 선 굵기 1.6), 오늘 `/today`(icon `sun` 또는 새 `calendar`).
  - `type Tag = 'face' | 'fortune' | 'match' | 'play'`, `CategoryItem.tags: Tag[]`, `CategoryItem.daily?: true`.
  - `ALL_ITEMS: CategoryItem[]` — CATEGORIES의 항목을 순서대로 펼친 것(중복 href 없음).
  - `tabForPath(path)`: `/`→home, `/today`→today, 그 밖 전부→all.

규칙:
- tags: 관상·동물상·삼국지 닮은꼴·우리 팀 → face, 사주·신년운세·띠별·오늘의 운세·오늘의 MBTI 운세·부적 → fortune, 얼굴 궁합·MBTI 궁합·MBTI 유형 → match, 월드컵·열전·영상·일기토·밈 능력고사 → play(밈 능력고사가 CATEGORIES에 없으면 `FOOTER_EXTRA` 항목을 ALL_ITEMS 끝에 더한다). daily: 오늘의 운세, 오늘의 MBTI 운세, 밈 능력고사.
- thumb: `image`가 없는 항목은 `image: CAST[castForHref(href)].face`, `bg`는 그 캐릭터 bg. 삼국지 항목은 초상화 그대로.
- `/all`: h1 "전체 테스트", 설명 한 줄, 검색창(글자를 치면 제목·설명으로 거름, 서버 HTML에는 전체 목록), 그 아래 `CategoryList`와 같은 카드 모양 목록. metadata(title "전체 테스트 모음 – 운명을 읽다", description, canonical `/all`).
- `/today`: h1 "오늘", 저승사자 얼굴과 한 줄 "오늘 바뀌는 것들이에요", daily 항목 카드, 그 아래 홈에서 옮긴 `ZodiacPicker`(띠 바로 고르기)와 `SeasonPicks slot="today"`. metadata·canonical `/today`.
- BottomTabBar: `grid-cols-3`, 활성 탭 위에 3px 막대(`bg-accent`)가 `left: calc(index * 33.333%)`로 `transition: left .36s cubic-bezier(.3,1.4,.5,1)` 미끄러진다. 활성 아이콘은 `tab-pop` 키프레임(0.6배→1배, 0.4초) 한 번.

- [x] **Step 1: 테스트를 먼저 고친다/쓴다**

`tests/navigation.test.ts`:
```ts
import { TABS, ALL_ITEMS, tabForPath } from '@/content/navigation'
test('하단 탭은 홈·전체·오늘 셋', () => { expect(TABS.map((t) => t.href)).toEqual(['/', '/all', '/today']) })
test('경로별 현재 탭', () => {
  expect(tabForPath('/')).toBe('home'); expect(tabForPath('/today')).toBe('today')
  expect(tabForPath('/face2')).toBe('all'); expect(tabForPath('/bujeok/r/x')).toBe('all')
})
test('모든 항목에 태그가 있고 주소가 겹치지 않는다', () => {
  for (const i of ALL_ITEMS) expect(i.tags.length, i.href).toBeGreaterThan(0)
  expect(new Set(ALL_ITEMS.map((i) => i.href)).size).toBe(ALL_ITEMS.length)
})
test('매일 바뀌는 항목은 셋', () => { expect(ALL_ITEMS.filter((i) => i.daily).map((i) => i.href).sort()).toEqual(['/exam/meme', '/fortune/daily', '/fortune/mbti']) })
```
`e2e/tabbar.spec.ts`: 5칸을 3칸으로(라벨 홈·전체·오늘), 경로별 현재 탭 표를 새 규칙으로, 320px 한 줄 테스트는 `toHaveLength(3)`. 기존 "탭을 눌러 묶음 페이지로 이동"은 "전체 탭 → /all"로.

- [x] **Step 2: 실패 확인** — `npx vitest run tests/navigation.test.ts` → FAIL
- [x] **Step 3: 구현** (위 규칙대로. 홈은 이 작업에서 손대지 않는다. 홈에 있던 ZodiacPicker는 Task 3에서 뺀다 — 이 작업에서는 /today에 하나 더 둔다)
- [x] **Step 4: 통과 확인** — `npm test` → PASS
- [x] **Step 5: 커밋** — `"메뉴: 하단 탭을 홈·전체·오늘 셋으로, /all·/today 페이지, 항목 태그와 캐릭터 썸네일"`

---

### Task 3: 짧은 홈과 "다른 테스트 둘러보기"

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/home/HomeGrid.tsx`(클라이언트: 칩 + 카드 2열), `src/components/home/TodayRow.tsx`, `src/components/MoreTests.tsx`
- Modify: `src/components/home/FaceHero.tsx`(해태 그림), `src/components/home/SeasonCard.tsx`(얇은 한 줄 띠로)
- Delete(홈에서 안 쓰면): `src/components/home/PlayTogether.tsx`, `src/components/home/CategoryTabs.tsx`
- Modify: 사진 테스트 시작 화면들(`TestStart`를 쓰는 페이지)과 결과 화면의 `NextSteps` 자리
- Test: `tests/home.test.ts`, `e2e/home.spec.ts`

**Interfaces:**
- Consumes: Task 2 `ALL_ITEMS`, `Tag`, Task 1 `CAST`.
- Produces: `MoreTests({ current: string }): JSX.Element` — 현재 주소를 뺀 ALL_ITEMS 중 앞쪽 4개를 가로로 넘기는 카드 줄 + "전체 보기" 링크(`/all`). `no-screenshot`. 제목 "다른 테스트 둘러보기".

홈 순서(위에서 아래):
1. 머리: `h1`(기존 문구 그대로, 글꼴만 새로), 오른쪽의 눌리지 않는 달 아이콘은 지운다.
2. 칩 줄: 전체·얼굴·운세·궁합·게임(`HomeGrid` 안). 누르면 카드만 거른다(이동 없음, `aria-pressed`).
3. 대표 카드: `FaceHero` — 흰 카드, 왼쪽 글("사진 테스트" 라임 칩, 제목, `시작하기` 주 버튼), 오른쪽에 `CAST.haetae.img`를 142px 둥근 사각형으로. 기존 링크·문구는 유지.
4. 시즌 띠: `SeasonCard`를 높이 64px 안팎 한 줄 띠로(칩 + 제목 + 화살표). 수능 기간 문구·링크는 그대로.
5. 카드 2열: ALL_ITEMS에서 face2·animal·face-match·fortune/daily·bujeok·exam/meme·samguk·saju 8개(칩으로 거르면 그 태그 항목 전부). 카드 = 제목, 한 줄 설명, 오른쪽 아래 캐릭터 얼굴 76px 둥근 사각형(삼국지는 초상화 작은 판). 캐릭터 배경색을 카드 아래쪽 옅은 띠로.
6. 오늘 줄: `TodayRow` — daily 항목 가로 카드 + "오늘 탭에서 보기".
7. `CoupangBanner subId="home"` 하나.
8. FAQ: `<details>` 하나("자주 묻는 질문") 안에 기존 질문 목록. JSON-LD는 그대로.

홈에서 빠지는 것: `ZodiacPicker`(→ /today), `PlayTogether`, `SeasonPicks`(→ /today), `CategoryTabs`(→ 칩 + /all).

"다른 테스트 둘러보기": `TestStart` 아래(시작 화면 맨 아래)와 결과 화면 공유 버튼 묶음 아래(`NextSteps` 자리. `NextSteps`·`NextTests`가 이미 있으면 그 아래에 하나만)에 `<MoreTests current={경로} />`.

- [x] **Step 1: 테스트를 새 홈에 맞춘다**

`tests/home.test.ts`의 "홈 순서", "친구랑 같이 해봐요" 테스트를 바꾼다:
```ts
test('홈 순서: 머리 → 칩·대표 카드·카드 2열(HomeGrid) → 오늘 줄 → 쿠팡 → FAQ', () => {
  const src = readFileSync('src/app/page.tsx', 'utf8')
  const order = ['<h1', '<HomeGrid', '<TodayRow', '<CoupangBanner', 'HOME_FAQS.map'].map((s) => src.indexOf(s))
  expect(order.every((i) => i > 0)).toBe(true)
  expect([...order].sort((a, b) => a - b)).toEqual(order)
  for (const gone of ['ZodiacPicker', 'PlayTogether', 'CategoryTabs', 'SeasonPicks']) expect(src).not.toContain(gone)
})
```
`e2e/home.spec.ts`: 순서 테스트를 위와 같은 순서로, 띠 고르기 테스트는 `/today`로 옮기고, "묶음 탭 전환"은 "칩 '운세'를 누르면 운세 카드만 보인다(다른 카드는 hidden)"로, 새 테스트 둘:
```ts
test('390px 홈 본문 높이 2600px 이하(푸터 제외)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/')
  const h = await page.evaluate(() => document.querySelector('main')!.getBoundingClientRect().height)
  expect(h).toBeLessThanOrEqual(2600)
})
test('검색으로 테스트 시작 화면에 들어와도 다른 테스트로 가는 줄이 있다', async ({ page }) => {
  await page.goto('/animal')
  await expect(page.getByRole('heading', { name: '다른 테스트 둘러보기' })).toBeVisible()
  await expect(page.getByRole('link', { name: '전체 보기' })).toHaveAttribute('href', '/all')
})
```
83행의 라디오 이름은 화면 문구 "선물하기"로 고친다(`e2e/gift-nudge.spec.ts:27`도 같이).

- [x] **Step 2: 실패 확인** — `npx vitest run tests/home.test.ts` → FAIL
- [x] **Step 3: 구현** (위 순서. 카드·칩 모양은 시안을 따른다. 서버 HTML에 8개 카드 + 거를 때 쓸 나머지 카드가 모두 들어가고 처음엔 `hidden`)
- [x] **Step 4: 통과 확인** — `npm test && npm run test:e2e` → 새 테스트 포함 PASS(기존 무관 실패는 `buttons.spec.ts` 하나만 남아야 한다)
- [x] **Step 5: 커밋** — `"홈을 짧게: 칩·대표 카드·캐릭터 카드 2열·오늘 줄, 시작·결과 화면에 다른 테스트 둘러보기"`

---

### Task 4: 분석 중 화면과 결과 공개 움직임

**Files:**
- Create: `src/components/test/AnalyzingOverlay.tsx`
- Modify: `src/app/samguk/(match)/page.tsx:178-196`(인라인 분석 화면을 공용으로), 분석 중 상태가 있는 사진 테스트(`/animal`, `/face-match`, `/samguk/team`; `/face2`는 `RevealMotion`이 맡으므로 그 앞 단계에만)
- Modify: `src/components/result/ResultCard.tsx`(`cast?: CastKey`, 공개 움직임 클래스), 이를 쓰는 결과 화면들(관상·동물상·얼굴 궁합·오늘의 운세·사주·MBTI 운세에 각자 캐릭터 넘기기)
- Modify: `src/lib/capture.ts`(캡처 전후 `no-motion`), `src/app/globals.css`(키프레임)
- Test: `tests/motion.test.tsx`

**Interfaces:**
- Consumes: Task 1 `CAST`, `CastKey`.
- Produces:
  - `AnalyzingOverlay({ cast, photo, steps, step }: { cast: CastKey; photo?: string; steps: string[]; step: number })` — 가운데 사진(없으면 얼굴 선 그림) 위로 오르내리는 살펴보는 줄(무한, 분석 중에만), 오른쪽 아래에서 캐릭터 얼굴이 고개를 갸웃(무한), 아래 단계 문구 `steps[step]`. 진행률 % 막대는 없다. `role="status"` `aria-live="polite"`.
  - ResultCard `cast`가 있으면 `art` 기본값이 `<img src={CAST[cast].img}>`(104px 둥근 사각, 캐릭터 bg), `SmileFace`는 cast도 art도 없을 때만.
  - CSS 클래스: `.reveal-card`(clip-path 원이 0%→125%, .7초), `.reveal-pop`(scale 0→1, 지연은 `--d`), `.rise`(translateY 14px·opacity .3→1, 지연 `--i`×60ms, 처음 6개까지만 지연), `.press`(:active scale .96). 모두 `animation-fill-mode: both`, 한 번만.
  - `.no-motion *, .no-motion *::before, .no-motion *::after { animation: none !important; transition: none !important; }`
  - `lib/capture.ts`: 캡처 함수가 시작할 때 `document.documentElement.classList.add('no-motion')`, 두 프레임 기다린 뒤 캡처, 끝나면(실패해도) 지운다.

- [x] **Step 1: 실패하는 테스트**

```tsx
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import AnalyzingOverlay from '@/components/test/AnalyzingOverlay'
import ResultCard from '@/components/result/ResultCard'

const css = readFileSync('src/app/globals.css', 'utf8')
test('분석 중 화면: 단계 문구와 캐릭터, 가짜 진행률 없음', () => {
  const html = renderToStaticMarkup(<AnalyzingOverlay cast="haetae" steps={['얼굴형 살피는 중', '복 자리 찾는 중']} step={1} />)
  expect(html).toContain('복 자리 찾는 중'); expect(html).toContain('/images/cast/haetae-face.webp')
  expect(html).toContain('role="status"'); expect(html).not.toMatch(/width:\s*\d+%/)
})
test('결과 카드는 캐릭터를 받으면 그 그림을 그린다', () => {
  const html = renderToStaticMarkup(<ResultCard eyebrow="나의 관상은" title="곳간이 든든한 상" reasons={[]} cast="haetae" />)
  expect(html).toContain('/images/cast/haetae.webp'); expect(html).toContain('reveal-card')
})
test('캡처 때 움직임을 끄는 규칙과 움직임 줄이기 규칙이 있다', () => {
  expect(css).toMatch(/\.no-motion \*[^{]*\{[^}]*animation:\s*none !important/)
  expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*reveal-card/)
  expect(readFileSync('src/lib/capture.ts', 'utf8')).toMatch(/classList\.add\('no-motion'\)[\s\S]*classList\.remove\('no-motion'\)/)
})
test('무한 반복 움직임은 분석 중 화면 것뿐', () => {
  const infinite = [...css.matchAll(/animation:[^;]*infinite/g)].map((m) => m[0])
  for (const a of infinite) expect(a).toMatch(/scan|peek|skeleton|shake/) // 기존 shake는 부적·방울 효과
})
```
(마지막 테스트의 허용 목록은 globals.css에 원래 있던 무한 움직임 이름을 확인해 맞춘다. 새로 더하는 무한 움직임은 `scan`·`peek` 둘뿐.)

- [x] **Step 2: 실패 확인** — `npx vitest run tests/motion.test.tsx` → FAIL
- [x] **Step 3: 구현** (단계 문구는 페이지에 이미 있는 것을 쓴다. 삼국지의 `loadingMessages`처럼. 없으면 "얼굴형 살피는 중 / 이목구비 비율 재는 중 / 결과 정리하는 중")
- [x] **Step 4: 통과 확인** — `npm test` → PASS
- [x] **Step 5: 커밋** — `"분석 중 화면에 캐릭터, 결과 카드 공개 움직임, 캡처는 움직임을 끄고"`

---

### Task 5: 미리보기 이미지와 사이트 아이콘에 캐릭터

**Files:**
- Modify: `src/app/api/og/route.tsx`, `src/app/api/og/result/route.tsx`(부적 분기 제외)
- Modify: `scripts/make-push-icons.mjs`(해태 얼굴로 아이콘 생성) → `public/icons/*.png` 다시 만들기, `src/app/favicon.ico`
- Test: `tests/ogCast.test.ts`

**Interfaces:**
- Consumes: Task 1 `CAST`, `castForHref`.

규칙:
- `/api/og/result`: kind별 캐릭터 — face→haetae, animal→tiger, mbti·mbti-daily·faceMatch→gumiho(faceMatch kind가 있다면), exam→dokkaebi. samguk·bujeok·cup은 지금 그대로(초상화·부적 그림). 오른쪽 45%에 캐릭터 `-og.png`를 캐릭터 bg 원 위에 400px로, 왼쪽 55%에 기존 글(사이트 이름·큰 글자·점수·한 줄). 그림은 기존 초상화 받기와 같은 방법(`fetch(new URL(..., request.url))`, 1.5초 제한)으로 받고, 못 받으면 그림 없이 지금 배치.
- `/api/og`(일반 페이지): `?cast=` 매개변수를 허용 목록(Task 1 키)으로만 받고, 없으면 해태. 같은 배치.
- 아이콘: 192·512·180(apple-touch)·96(badge)을 `haetae-face`에서 만든다. 192·512·180은 해태 얼굴을 `#2D55FF` 둥근 사각 위에, badge-96은 흰 단색 실루엣(알림용, 기존 규칙 유지). `favicon.ico`는 32·16을 같은 그림으로.
- 레이아웃 `theme-color`는 1단계에서 이미 바뀌었다.

- [x] **Step 1: 실패하는 테스트**

```ts
import { readFileSync } from 'node:fs'
test('결과 미리보기 이미지가 종류별 캐릭터를 쓴다', () => {
  const src = readFileSync('src/app/api/og/result/route.tsx', 'utf8')
  expect(src).toMatch(/haetae-og\.png|CAST\.haetae\.og|castForKind/)
})
test('일반 미리보기의 cast 매개변수는 허용 목록만', async () => {
  const { castParam } = await import('@/lib/ogCast')
  expect(castParam('saja')).toBe('saja'); expect(castParam('../x')).toBe('haetae'); expect(castParam(null)).toBe('haetae')
})
```
(`src/lib/ogCast.ts`에 `castParam(v: string | null): CastKey`와 `castForKind(kind: string): CastKey | null`을 만든다.)

- [x] **Step 2: 실패 확인 → Step 3: 구현 → Step 4: `npm test` PASS**
- [x] **Step 5: 눈으로 확인** — dev 서버에서 `/api/og/result?kind=face&key=earth-mid`, `kind=animal`, `kind=mbti`, `/api/og?title=전체&cast=saja`를 열어 4장을 `test-results/stage2/og-*.png`로 저장하고 글자와 그림이 겹치지 않는지 본다.
- [x] **Step 6: 커밋** — `"미리보기 이미지와 사이트 아이콘에 캐릭터"`

---

### Task 6: 진입·누름 움직임, 마무리 확인

**Files:**
- Modify: `src/app/page.tsx`·`HomeGrid`·`/all`·`/today` 카드에 `.rise`(`style={{'--i': n}}`)와 `.press`
- Modify: `CLAUDE.md`(메뉴·메인 절, 디자인 시스템 절: 3탭, 홈 순서, cast, 움직임 규칙, no-motion)
- Modify: `docs/superpowers/specs/2026-11-13-visual-revamp-design.md` 8절에 "2~4단계 반영" 한 줄

- [ ] **Step 1: 진입·누름 클래스를 단다**(카드·버튼. 처음 6개까지만 지연)
- [ ] **Step 2: 전체 확인** — `npm test && npm run test:e2e` → 기존 무관 실패 `buttons.spec.ts` 하나만 남는다
- [ ] **Step 3: 스크린숏** — 390px에서 `/`(첫 화면과 전체), `/all`, `/today`, `/animal`(시작 화면 맨 아래 포함), `/face2/r/earth-mid`, `/fortune/daily?year=1990` 결과, 분석 중 화면 1장(`/animal`에서 `public/dev-faces`가 없으면 생략하고 이유를 적는다) → `test-results/stage2/`
- [ ] **Step 4: CLAUDE.md·설계 문서 갱신 후 커밋** — `"움직임(진입·누름)과 문서 갱신"`
- [ ] **Step 5: 보고** — 커밋 목록, 테스트 결과, 홈 높이(px), 스크린숏 경로, 계획과 달라진 점. push 금지.
