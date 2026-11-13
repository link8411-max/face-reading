# 화면 개편 1단계(색·글꼴)와 속도 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사이트 전체의 색을 시안 B(블루·라임)로, 글꼴을 Pretendard로 바꾸고, 삼국지 초상화·페이지 이동·사진 테스트 준비를 빠르게 한다.

**Architecture:** 색은 `globals.css`의 `@theme` 토큰 값만 바꿔 화면 전체가 따라오게 한다(토큰 이름은 그대로). 글꼴은 Pretendard 가변 글꼴 한 파일을 기존 방식(`scripts/font-subset.mjs` → `src/fonts` → `next/font/local`)으로 싣고, `--font-sans`·`--font-serif`를 둘 다 그것으로 가리킨다. 속도는 초상화 작은 판(webp)을 미리 만들어 작은 자리에서 쓰고, 루트 `loading.tsx`를 둔다.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS 4(`@theme`), `next/font/local`, `subset-font`, `sharp`, vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-13-visual-revamp-design.md` (5절 1단계, 5.6, 5.7)

## Global Constraints

- 작업은 워크트리 브랜치 `visual-revamp-1`에서 한다. main에 머지·push는 사용자 확인 뒤에만(push하면 Vercel이 바로 배포한다).
- 토큰 값(정확히 이 값): paper `#F7F8FC`, card `#FFFFFF`, card-2 `#EEF1FA`, line `#E1E6F5`, ink `#1A1B25`, muted `#5E6070`, accent `#2D55FF`, 새 토큰 lime `#C6F24E`. blush `#E9BCA8`는 그대로.
- 바꾸지 않는 토큰: `navy-game`, `gold-game`, `bujeok-*`, `cloth`, `cloth-2`.
- 글꼴은 자체 호스팅만(`next/font/local`). `next/font/google` 금지. 굵기 900(`font-black`) 금지.
- Pretendard 원본: npm `pretendard@1.3.9`의 `dist/web/variable/woff2/PretendardVariable.woff2`, 라이선스 `dist/LICENSE.txt`(SIL OFL 1.1). 원본은 커밋하지 않는다.
- 전통 부적 그림의 바탕체(Gowun Batang)는 남긴다(`src/components/bujeok/parts/trad.tsx`가 `--font-gowun-batang`을 쓴다). 미리 받지 않게(`preload: false`)만 바꾼다.
- 주소, 페이지 제목·설명, `h1`, `PageGuide` 본문, FAQ, 구조화 데이터는 바꾸지 않는다.
- 이모지를 제목·버튼·메뉴에 넣지 않는다. 가짜 숫자를 넣지 않는다.
- 커밋 메시지는 한국어, 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- 각 작업 끝에 `npm test`가 통과해야 한다. E2E는 Task 3과 Task 6 끝에 `npm run test:e2e`.

## Review Focus

1. **전통 부적 글씨**: 바탕체가 그대로 나와야 한다(고딕으로 바뀌면 부적이 망가진다) → Task 1의 테스트가 `GowunBatang` 파일과 `preload: false`를 확인한다.
2. **좁은 화면 넘침**: Pretendard는 기존 글꼴과 글자 폭이 달라 320px 하단 탭 5칸(`e2e/tabbar.spec.ts`)과 360px 미만 시즌 카드 두 줄(`e2e/season.spec.ts`)이 깨질 수 있다 → Task 3 끝 E2E 전체 실행.
3. **저장 이미지 색**: 결과 저장·공유 이미지의 바탕이 새 색으로 나와야 한다(옛 베이지가 남으면 섞여 보인다) → Task 2에서 `src/lib/saveImage.ts`와 결과 카드의 하드코딩 색을 바꾸고, Task 3에서 결과 한 장을 실제로 저장해 본다.
4. **포인트색 작은 글씨**: `text-accent`가 114곳에서 카드 위 작은 글씨로 쓰인다. 새 파랑이 `card-2` 위에서도 4.5 대비를 넘어야 한다 → Task 2 대비 테스트.
5. **2350 밖 글자**: 새 문구에 2350자 밖 한글이 있으면 글꼴이 빠진다 → Task 1에서 subset 스크립트를 돌린 뒤 `src`에 나오는 모든 글자가 포함됐는지 스크립트 출력으로 확인.

---

### Task 1: Pretendard 글꼴로 바꾸기

**Files:**
- Modify: `scripts/font-subset.mjs` (JOBS, 머리말)
- Create: `src/fonts/PretendardVariable.woff2`, `src/fonts/OFL-Pretendard.txt`
- Delete: `src/fonts/NotoSansKR-Regular.woff2`, `src/fonts/NotoSansKR-Bold.woff2`, `src/fonts/OFL-NotoSansCJK.txt`
- Modify: `src/app/layout.tsx:13-30,155` (글꼴 선언과 body 클래스)
- Modify: `src/app/globals.css` (`@theme inline`의 `--font-sans`, `--font-serif`)
- Modify: `src/game/duel/BootScene.ts:68`, `src/lib/bujeok/wallpaper.ts:90,95`, `src/components/bujeok/parts/cute.tsx:11` (`--font-noto-sans-kr` → `--font-pretendard`)
- Test: `tests/design.test.tsx`, `tests/stage4a-review.test.ts`, `e2e/design.spec.ts`
- Modify: `CLAUDE.md` "디자인 시스템" 글꼴 줄

**Interfaces:**
- Produces: CSS 변수 `--font-pretendard`(layout의 `localFont` variable). `--font-sans`와 `--font-serif`가 모두 이것을 가리킨다. `--font-gowun-batang`은 부적 전용으로 남는다.

- [x] **Step 1: 테스트를 새 글꼴 기준으로 고친다**

`tests/design.test.tsx` 첫 두 테스트를 이렇게 바꾼다.

```ts
test('글꼴: 본문·제목 Pretendard 가변 글꼴, 부적용 Gowun Batang — 자체 호스팅(next/font/local)', () => {
  const layout = readFileSync('src/app/layout.tsx', 'utf8')
  expect(layout).toContain('next/font/local')
  expect(layout).not.toContain('next/font/google')
  expect(layout).toContain('PretendardVariable.woff2')
  expect(layout).toContain('GowunBatang-Regular.woff2') // 전통 부적 글씨
  expect(layout).toContain('Silkscreen-Regular.woff2')
  expect(layout).not.toContain('NotoSansKR')
  expect(layout).not.toContain('Geist')
})

test('자체 호스팅 글꼴 파일과 OFL 라이선스가 src/fonts에 있다', () => {
  for (const f of ['PretendardVariable', 'GowunBatang-Regular', 'GowunBatang-Bold', 'Silkscreen-Regular']) {
    expect(existsSync(`src/fonts/${f}.woff2`), f).toBe(true)
  }
  for (const f of ['OFL-Pretendard', 'OFL-GowunBatang', 'OFL-Silkscreen']) expect(existsSync(`src/fonts/${f}.txt`), f).toBe(true)
  expect(existsSync('src/fonts/NotoSansKR-Regular.woff2')).toBe(false)
})

test('본문·제목 글꼴 변수는 둘 다 Pretendard', () => {
  expect(css).toMatch(/--font-sans:\s*var\(--font-pretendard\)/)
  expect(css).toMatch(/--font-serif:\s*var\(--font-pretendard\)/)
})
```

`tests/stage4a-review.test.ts` 첫 테스트를 이렇게 바꾼다.

```ts
test('글꼴은 쓰는 굵기만: Pretendard 가변(400~800) 한 파일, Gowun Batang 400·700(미리 받지 않음), 부적 붓 글꼴 500 하나', () => {
  const layout = readFileSync('src/app/layout.tsx', 'utf8')
  expect(layout).toMatch(/PretendardVariable\.woff2", weight: "400 800"/)
  expect(layout).toMatch(/GowunBatang-Regular\.woff2", weight: "400"/)
  expect(layout).toMatch(/GowunBatang-Bold\.woff2", weight: "700"/)
  expect(layout).toMatch(/LXGWWenKaiTC-Bujeok\.woff2", weight: "500"/)
  const gowun = layout.slice(layout.indexOf('GowunBatang-Regular'), layout.indexOf('GowunBatang-Regular') + 400)
  expect(gowun).toMatch(/preload: false/)
})
```

`e2e/design.spec.ts` 첫 테스트의 글꼴 줄을 `expect(s.font).toMatch(/pretendard/i)`로 바꾼다(색 두 줄은 Task 2에서 바꾼다).

- [x] **Step 2: 실패 확인**

Run: `npx vitest run tests/design.test.tsx tests/stage4a-review.test.ts`
Expected: 새로 쓴 글꼴 테스트 3개가 FAIL(`PretendardVariable.woff2` 없음).

- [x] **Step 3: 원본을 받고 subset 스크립트를 고친다**

원본은 레포 밖 빈 폴더에 받는다(받은 파일은 실행하지 않는다).

```bash
mkdir -p /tmp/pretendard-src && cd /tmp/pretendard-src && npm pack pretendard@1.3.9 && tar xzf pretendard-1.3.9.tgz
cp package/dist/web/variable/woff2/PretendardVariable.woff2 /tmp/pretendard-src/
cp package/dist/LICENSE.txt <레포>/src/fonts/OFL-Pretendard.txt
```

`scripts/font-subset.mjs`:
- JOBS에서 NotoSans 두 줄을 지우고 `['PretendardVariable.woff2', 'PretendardVariable.woff2', korean]`를 넣는다. GowunBatang·Silkscreen 줄은 남긴다.
- 원본 폴더에 없는 입력 파일은 건너뛰고 "없어서 건너뜀: <파일>"을 찍는다(GowunBatang·Silkscreen 원본이 없어도 Pretendard만 다시 만들 수 있게).
- 머리말의 원본 목록에서 Noto Sans KR 줄을 Pretendard 줄(`npm pretendard@1.3.9 dist/web/variable/woff2/PretendardVariable.woff2`)로 바꾼다.

Run: `node scripts/font-subset.mjs /tmp/pretendard-src`
Expected: `PretendardVariable.woff2 ... → PretendardVariable.woff2 약 430KB`가 찍히고 나머지는 "건너뜀". 결과 파일이 `src/fonts/PretendardVariable.woff2`에 생긴다.

- [x] **Step 4: layout과 CSS를 바꾼다**

`src/app/layout.tsx`:
- `notoSans` 선언을 지우고 `const pretendard = localFont({ variable: "--font-pretendard", src: [{ path: "../fonts/PretendardVariable.woff2", weight: "400 800", style: "normal" }], display: "swap" })`.
- `gowunBatang`에 `preload: false`를 더하고 주석을 "전통 부적 그림 글씨 전용"으로 고친다.
- body className의 `${notoSans.variable}`를 `${pretendard.variable}`로.
- 파일 위 주석의 글꼴 설명을 새 구성에 맞게 고친다.

`src/app/globals.css` `@theme inline`: `--font-sans: var(--font-pretendard); --font-serif: var(--font-pretendard);`

`BootScene.ts:68`, `wallpaper.ts:90,95`, `cute.tsx:11`의 `--font-noto-sans-kr`를 `--font-pretendard`로 바꾼다. `trad.tsx`의 `--font-gowun-batang`은 그대로 둔다.

그 뒤 `NotoSansKR-*.woff2`, `OFL-NotoSansCJK.txt`를 지운다.

- [x] **Step 5: 통과 확인**

Run: `npx vitest run tests/design.test.tsx tests/stage4a-review.test.ts && npm test`
Expected: 모두 PASS. `grep -rn "font-noto-sans-kr\|NotoSansKR" src`가 아무것도 내지 않는다.

- [x] **Step 6: CLAUDE.md 갱신과 커밋**

CLAUDE.md "디자인 시스템"의 글꼴 줄을 "제목·본문 Pretendard 가변(400~800, `font-serif`·`font-sans` 모두), 전통 부적 글씨만 Gowun Batang(미리 받지 않음), 삼국지 카드 Silkscreen"으로 고친다.

```bash
git add -A scripts/font-subset.mjs src/fonts src/app/layout.tsx src/app/globals.css src/game/duel/BootScene.ts src/lib/bujeok/wallpaper.ts src/components/bujeok/parts/cute.tsx tests/design.test.tsx tests/stage4a-review.test.ts e2e/design.spec.ts CLAUDE.md
git commit -m "디자인 1단계: 글꼴을 Pretendard 가변 글꼴로(부적 바탕체는 유지)"
```

---

### Task 2: 색 토큰과 하드코딩 색 바꾸기

**Files:**
- Modify: `src/app/globals.css` (`@theme` 색 값, `--color-lime` 추가)
- Modify: `src/app/layout.tsx:119` (`theme-color`), `src/app/manifest.ts:10-11`
- Modify: `src/app/api/og/route.tsx`, `src/app/api/og/result/route.tsx:96-111` (부적 분기 127행 아래는 그대로)
- Modify: 옛 색을 직접 쓴 파일 — `src/components/icons.tsx`, `src/components/result/ResultCard.tsx`, `src/components/mbti/MbtiDailyCard.tsx`, `src/components/home/SeasonCard.tsx`, `src/components/home/PlayTogether.tsx`, `src/components/face/RevealMotion.tsx`, `src/components/people/ThreeKingdomsMap.tsx`, `src/lib/saveImage.ts`, `src/content/navigation.ts`, `src/app/samguk/(match)/page.tsx`, `src/app/mbti/page.tsx`
- Test: `tests/design.test.tsx`, `e2e/design.spec.ts`

**Interfaces:**
- Consumes: Task 1 없음(독립).
- Produces: Tailwind 클래스 `bg-lime`·`text-lime`(새 토큰). 다른 토큰 이름은 그대로.

- [x] **Step 1: 테스트를 새 값으로 고친다**

`tests/design.test.tsx`:
- `TOKENS`의 뉴트럴 값을 Global Constraints의 값으로 바꾸고 `['lime', '#C6F24E']`를 더한다. 게임·부적 토큰 줄은 그대로.
- 대비 `test.each`에 `['accent', 'card-2']`, `['muted', 'card-2']`를 더한다(4.5 이상).
- 새 테스트 둘:

```ts
test('주 버튼 흰 글씨가 포인트색 위에서 대비 4.5 이상', () => {
  expect(contrast('#FFFFFF', hex('accent'))).toBeGreaterThanOrEqual(4.5)
})

test('옛 베이지·테라코타 색이 src에 남아 있지 않다(부적·게임 전용 색 제외)', () => {
  const { execSync } = require('node:child_process')
  // 일기토 게임 팔레트(src/game)는 화면 개편 범위 밖이라 뺀다(palette.ts·config.ts가 #6B6259를 쓴다)
  const hits = execSync("grep -rniE '#(FBF6F1|ECE5D9|F1EBE2|E6DED2|2E2A27|6B6259|9A4F35|A4553A)' src --exclude-dir=game || true", { encoding: 'utf8' }).trim()
  expect(hits).toBe('')
})
```

`e2e/design.spec.ts` 첫 테스트: 바탕 `rgb(247, 248, 252)`, 글자 `rgb(26, 27, 37)`. 테스트 이름의 "Noto Sans KR"·"뉴트럴"을 "Pretendard"·"새 색"으로.

- [x] **Step 2: 실패 확인**

Run: `npx vitest run tests/design.test.tsx`
Expected: `뉴트럴 색 토큰`과 `옛 베이지·테라코타 색` 테스트가 FAIL.

- [x] **Step 3: 토큰과 하드코딩 색을 바꾼다**

`globals.css` `@theme`의 값을 Global Constraints대로 바꾸고 `--color-lime: #C6F24E;`를 더한다. 파일 맨 위 주석을 "시안 B(블루·라임, 2026-11-13)"로 고친다.

하드코딩 색은 이 표대로 바꾼다(부적·삼국지 게임 전용 색은 손대지 않는다).

| 옛 색 | 새 색 | 뜻 |
|---|---|---|
| `#FBF6F1` | `#F7F8FC` | 바탕 |
| `#ECE5D9`, `#F1EBE2` | `#EEF1FA` | 옅은 면 |
| `#E6DED2` | `#E1E6F5` | 선 |
| `#2E2A27` | `#1A1B25` | 글자 |
| `#6B6259` | `#5E6070` | 보조 글자 |
| `#9A4F35`, `#A4553A` | `#2D55FF` | 포인트 |

`src/content/navigation.ts`의 썸네일 바탕(`thumb.bg`)은 묶음별 색으로 바꾼다: 관상·얼굴 `#E6EDFF`, 사주·운세 `#FFF4CC`, 궁합·MBTI `#E2F5EA`, 부적 `#FFF4CC`, 삼국지·게임 `#ECE8FF`. `theme-color`와 manifest 두 값은 `#F7F8FC`.

OG 두 경로는 바탕 `#F7F8FC`, 카드 `#FFFFFF`(테두리 `3px solid #E1E6F5`), 사이트 이름·점수 `#2D55FF`, 큰 글자 `#1A1B25`, 설명 `#5E6070`. 오른쪽 장식 원 두 개는 `#EEF1FA`와 `#C6F24E`.

- [x] **Step 4: 통과 확인**

Run: `npm test`
Expected: PASS. `grep -rniE '#(FBF6F1|2E2A27|9A4F35)' src --exclude-dir=game`가 아무것도 내지 않는다. `src/game/duel/palette.ts`·`config.ts`의 `#6B6259`는 그대로 둔다.

- [x] **Step 5: 커밋**

```bash
git add -A src tests/design.test.tsx e2e/design.spec.ts
git commit -m "디자인 1단계: 색 토큰을 블루·라임으로, 하드코딩 색과 미리보기 이미지도 맞춤"
```

---

### Task 3: 주 버튼과 카드 테두리, 1단계 확인

**Files:**
- Modify: 주 버튼을 쓰는 컴포넌트들(아래 grep으로 찾는다)
- Modify: `CLAUDE.md` "디자인 시스템" 토큰·모양 줄

**Interfaces:**
- Consumes: Task 2의 `accent` 토큰.
- Produces: 주 버튼 규칙 "`bg-accent text-white`", 선택된 칩·토글은 계속 "`bg-ink text-paper`".

- [x] **Step 1: 주 버튼을 바꾼다**

Run: `grep -rn "bg-ink" src --include='*.tsx' | grep "text-paper"`

규칙:
- 행동 버튼·링크(시작하기, 분석하기, 공유하기, 다음, 제출 등. 대개 `h-[52px]`·`h-12`·`py-3` 이상이고 `rounded-full`)는 `bg-ink text-paper` → `bg-accent text-white`. `border-ink`가 같이 있으면 `border-accent`로.
- 선택 상태를 나타내는 칩·탭·토글(조건식 `selected ? 'bg-ink text-paper' : ...` 안에 있는 것, `aria-pressed`·`aria-checked`·`aria-selected`를 가진 것)은 그대로 둔다.
- `disabled:opacity-*`는 그대로 둔다.

- [x] **Step 2: 흰 카드에 테두리를 준다**

`bg-card`를 쓰는 요소 중 `border`가 없는 것에 `border border-line`을 더한다(새 card가 흰색이라 바탕과 구분이 안 된다). 단, `bg-card` 위에 또 `bg-card`가 겹친 안쪽 요소와 결과 캡처 카드(`ResultCard`, `SamgukGameCard`)는 바깥 테두리 하나만 둔다.

- [x] **Step 3: 전체 확인**

Run: `npm test && npm run test:e2e`
Expected: 모두 PASS. 실패하면 Review Focus 2(넘침)부터 본다. 값을 바꿔 테스트를 맞추지 말고, 넘치는 화면의 글자 크기나 간격을 고친다.

- [x] **Step 4: 눈으로 확인**

`npm run dev -- -p 3311`로 띄우고 390px 폭에서 `/`, `/face-tests`, `/animal`, `/face2/r/earth-mid`, `/bujeok`(먹빛 마감 포함), `/samguk/duel`, `/fortune/daily`를 본다. 결과 화면 하나에서 "이미지 저장"을 눌러 저장 이미지의 바탕이 새 색인지 본다. 스크린숏 7장을 `test-results/stage1/`에 남긴다.

- [x] **Step 5: CLAUDE.md와 커밋**

CLAUDE.md "디자인 시스템 (4b 뉴트럴)" 절 제목을 "디자인 시스템 (블루·라임, 2026-11-13)"으로, 토큰 줄을 새 값으로, "주 버튼 `bg-ink text-paper`"를 "주 버튼 `bg-accent text-white`, 선택된 칩은 `bg-ink text-paper`"로, "옛 민화 색…테스트로 막는다" 줄에 "4b 베이지·테라코타 색도 막는다"를 더한다.

```bash
git add -A src CLAUDE.md
git commit -m "디자인 1단계: 주 버튼을 파랑으로, 흰 카드에 테두리"
```

---

### Task 4: 삼국지 초상화 작은 판

**Files:**
- Create: `scripts/make-portrait-thumbs.mjs`
- Create: `public/images/samguk/thumb/*.webp` (스크립트 결과, 커밋)
- Create: `src/lib/portraitThumb.ts`
- Test: `tests/portraitThumb.test.ts`
- Modify: 초상화를 작게(가로 200px 이하) 보여 주는 `<img>`들

**Interfaces:**
- Produces: `portraitThumb(src: string): string` — `/images/samguk/<이름>.jpg`이면 `/images/samguk/thumb/<이름>.webp`를, 그 밖의 경로는 그대로 돌려준다. 이름은 한글 그대로(인코딩된 경로가 와도 처리: `decodeURI` 후 비교, 돌려줄 때는 받은 형태와 같은 인코딩).

- [x] **Step 1: 바뀌기 전 무게를 잰다** (설계 5.7의 "Lighthouse LCP·CLS" 대신, 이 작업이 바꾸는 것인 초상화 전송량을 잰다. Lighthouse는 배포 뒤 PageSpeed Insights로 사용자와 같이 본다)

Playwright로 `npm run build && npm start -- -p 3200`을 띄운 뒤 `/samguk/people`, `/samguk/cup`, `/face-tests`를 열고 응답 중 `/images/samguk/` 파일의 전송 바이트 합을 각각 기록한다(스크립트는 `scripts/`가 아니라 임시 폴더에 둔다). 숫자를 이 작업의 커밋 메시지에 적는다.

- [x] **Step 2: 실패하는 테스트를 쓴다**

```ts
import { existsSync, readdirSync } from 'node:fs'
import { portraitThumb } from '@/lib/portraitThumb'

test('초상화 경로는 작은 판으로 바뀐다', () => {
  expect(portraitThumb('/images/samguk/관우.jpg')).toBe('/images/samguk/thumb/관우.webp')
  expect(portraitThumb(encodeURI('/images/samguk/관우.jpg'))).toBe(encodeURI('/images/samguk/thumb/관우.webp'))
})

test('초상화가 아닌 경로는 그대로', () => {
  expect(portraitThumb('/images/animal/cat.png')).toBe('/images/animal/cat.png')
  expect(portraitThumb('/images/samguk/sprites/a.png')).toBe('/images/samguk/sprites/a.png')
})

test('모든 초상화에 작은 판이 있다', () => {
  const jpgs = readdirSync('public/images/samguk').filter((f) => f.endsWith('.jpg'))
  for (const f of jpgs) expect(existsSync(`public/images/samguk/thumb/${f.replace(/\.jpg$/, '.webp')}`), f).toBe(true)
})
```

Run: `npx vitest run tests/portraitThumb.test.ts` → Expected: FAIL(모듈 없음).

- [x] **Step 3: 스크립트와 함수를 만든다**

`scripts/make-portrait-thumbs.mjs`: `public/images/samguk/*.jpg`(하위 폴더 제외)를 `sharp`로 256×256 webp(quality 78)로 만들어 `public/images/samguk/thumb/`에 쓴다. 이미 있고 원본보다 새로우면 건너뛴다. 머리말에 "초상화를 바꾸거나 더하면 다시 돌린다"를 적는다.

Run: `node scripts/make-portrait-thumbs.mjs` → 115개 안팎이 생기고 각 15KB 안팎.

`src/lib/portraitThumb.ts`에 위 Interfaces의 함수를 쓴다(정규식 `^/images/samguk/([^/]+)\.jpg$`를 디코드한 경로에 적용).

- [x] **Step 4: 작은 자리에서 쓴다**

초상화를 보여 주는 `<img>` 중 화면 가로 200px 이하로 그리는 곳(목록 카드, 월드컵 카드, 팀 카드, 관계도 얼굴, 홈·허브 썸네일, 영상 옆 얼굴 등)은 `src={portraitThumb(...)}`로 바꾸고 `width`·`height`·`loading="lazy"`·`decoding="async"`를 단다(첫 화면 맨 위 그림 하나는 `loading`을 빼고 `fetchPriority="high"`). 크게 보여 주는 곳(열전 머리 그림, 공유 착지 큰 그림, OG 라우트, 결과 카드 캡처 그림)은 원본을 쓴다.

CLAUDE.md "장수 추가·초상화 교체" 절에 "그림을 넣으면 `node scripts/make-portrait-thumbs.mjs`도 돌린다"를 더한다.

- [x] **Step 5: 통과 확인과 무게 비교**

Run: `npm test` → PASS. Step 1과 같은 방법으로 세 페이지의 초상화 전송 바이트를 다시 잰다. Expected: 각 페이지 절반 이하.

- [x] **Step 6: 커밋**

```bash
git add -A scripts/make-portrait-thumbs.mjs public/images/samguk/thumb src/lib/portraitThumb.ts tests/portraitThumb.test.ts src CLAUDE.md
git commit -m "속도: 삼국지 초상화 작은 판(webp 256px)을 목록·카드에서 사용 (전송량 <전>→<후>)"
```

---

### Task 5: 페이지 이동 중 뼈대 화면

**Files:**
- Create: `src/components/PageSkeleton.tsx`
- Create: `src/app/loading.tsx`
- Create: `src/app/samguk/duel/loading.tsx` (게임 화면은 뼈대 없이 빈 천 배경)
- Test: `tests/pageSkeleton.test.tsx`

**Interfaces:**
- Produces: `PageSkeleton(): JSX.Element` — 제목 줄 하나와 카드 세 개 모양의 회색 덩어리. `role="status"`, `aria-label="불러오는 중"`, 클래스 `no-screenshot`.

- [x] **Step 1: 실패하는 테스트**

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import PageSkeleton from '@/components/PageSkeleton'

test('뼈대 화면은 스크린리더에 "불러오는 중"으로 읽히고 캡처에서 빠진다', () => {
  const html = renderToStaticMarkup(<PageSkeleton />)
  expect(html).toContain('role="status"')
  expect(html).toContain('aria-label="불러오는 중"')
  expect(html).toContain('no-screenshot')
})

test('뼈대의 반짝임은 움직임 줄이기 설정에서 꺼진다', () => {
  const css = require('node:fs').readFileSync('src/app/globals.css', 'utf8')
  expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*skeleton-shimmer/)
})
```

Run: `npx vitest run tests/pageSkeleton.test.tsx` → FAIL.

- [x] **Step 2: 만든다**

`PageSkeleton`: `max-w-lg mx-auto px-4 pt-5` 안에 `h-7 w-40 rounded-lg` 한 줄, `h-[200px] rounded-[28px]` 카드 하나, `h-[150px]` 2열 카드 두 개. 색은 `bg-card-2`, 클래스 `skeleton-shimmer`. `globals.css`에 `skeleton-shimmer` 키프레임(밝기 0.6초 왕복)과 `prefers-reduced-motion`에서 끄는 규칙을 더한다.

`src/app/loading.tsx`는 `PageSkeleton`을 그대로 그린다. `src/app/samguk/duel/loading.tsx`는 `bg-cloth` 전체 화면 빈 `div`(뼈대가 게임 위에 번쩍이지 않게).

- [x] **Step 3: 통과 확인과 커밋**

Run: `npm test` → PASS.

```bash
git add src/components/PageSkeleton.tsx src/app/loading.tsx src/app/samguk/duel/loading.tsx src/app/globals.css tests/pageSkeleton.test.tsx
git commit -m "속도: 페이지 이동 중 뼈대 화면(loading.tsx)"
```

---

### Task 6: 사진 테스트 모델 미리 받기, 전체 확인

**Files:**
- Modify: `src/app/face-match/page.tsx`(또는 그 클라이언트 컴포넌트), `src/app/samguk/team/` 클라이언트 컴포넌트
- Test: `tests/modelPrefetch.test.ts`

**Interfaces:**
- Consumes: 이미 있는 `prepareLandmarker()`(`src/lib/face/mediapipe.ts:38`). `/face2`·`/animal`·`/samguk`은 이미 마운트 때 부른다(`src/app/face2/page.tsx:52` 형식).

- [x] **Step 1: 실패하는 테스트**

```ts
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

test('사진을 받는 모든 테스트 시작 화면이 얼굴 인식 모델을 미리 받는다', () => {
  const files = execSync("grep -rl 'analyzePhoto' src/app src/components || true", { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  const pages = ['src/app/face2/page.tsx', 'src/app/animal/page.tsx', 'src/app/samguk/(match)/page.tsx']
  const all = [...pages, ...files.filter((f) => /face-match|samguk\/team/.test(f))]
  expect(all.length).toBeGreaterThanOrEqual(5)
  for (const f of all.filter((f) => /face-match|samguk\/team/.test(f))) {
    // 같은 화면 묶음(페이지나 그 클라이언트 컴포넌트) 어딘가에서 prepareLandmarker를 부른다
    const dir = f.replace(/\/[^/]+$/, '')
    const hit = execSync(`grep -rl 'prepareLandmarker' ${JSON.stringify(dir)} || true`, { encoding: 'utf8' }).trim()
    expect(hit, f).not.toBe('')
  }
})
```

(구현자가 face-match·team의 실제 클라이언트 컴포넌트 위치를 확인한 뒤, 위 테스트의 경로 고르기를 그 위치에 맞게 좁혀도 된다. 단언은 "두 화면 모두 prepareLandmarker를 부른다"로 유지.)

Run: `npx vitest run tests/modelPrefetch.test.ts` → FAIL.

- [x] **Step 2: 미리 받기를 더한다**

face-match와 team의 시작 화면 컴포넌트 마운트 효과에 `/face2`와 같은 한 줄을 넣는다:
`import("@/lib/face/mediapipe").then((m) => m.prepareLandmarker()).catch(() => {});`

- [x] **Step 3: 전체 확인**

Run: `npm test && npm run test:e2e`
Expected: 모두 PASS.

- [x] **Step 4: 커밋하고 사용자에게 보고**

```bash
git add -A src tests/modelPrefetch.test.ts
git commit -m "속도: 얼굴 궁합·우리 팀도 시작 화면에서 얼굴 인식 모델을 미리 받음"
```

브랜치를 push하지 않는다. Task 3 Step 4의 스크린숏, Task 4의 전송량 전후 숫자, 테스트 결과를 사용자에게 보여 주고 main 머지·배포 여부를 묻는다. 배포 뒤에는 `node scripts/indexnow.mjs`를 돌리지 않아도 된다(주소·본문 변화 없음).
