# 4b단계: 뉴트럴 디자인 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change the whole site to the neutral oatmeal + terracotta design from the 4-board canvas, without changing any URL. Rebuild the home, test start screens, and result cards (including "스토리에 올리기"), plus the samguk retro game card.

**Architecture:**
- Redefine the color and font tokens and replace hardcoded old hex classes with tokens.
- Emoji are replaced with one shared set of SVG icons in `src/components/icons.tsx`.
- Test start and result screens are built from shared components: `GenderPills`, `PhotoPicker`, `PrivacyNote`, `ResultCard`, `ResultActions`.
- Each test page fills them in with its own data.
- Capture still uses the existing `useScreenshot`. The story image is a 9:16 frame wrapping the result card.

**Tech Stack:** Next.js 16, Tailwind 4 `@theme`, next/font (Gowun Batang, Noto Sans KR, Silkscreen), modern-screenshot, vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-10-26-unse-ai-revival-design.md` (4b단계 확정안: 뉴트럴 디자인 개편). Design canvas: `https://claude.ai/artifact/Psoi9fmSypmynmFNE2vBhR` (`project/*.dc.html`; a local copy is in the session scratchpad `artifact-files/`)

## Global Constraints

- Colors (tokens in `globals.css` `@theme`):
  - `paper` #FBF6F1
  - `card` #ECE5D9
  - `card-2` #F1EBE2
  - `line` #E6DED2
  - `ink` #2E2A27
  - `muted` #6B6259
  - `accent` #A4553A
  - `blush` #E9BCA8 (only for the cheek flush in face illustrations)
  - `navy-game` #23263A, `gold-game` #E8B547 (only for the samguk card)
- Fonts:
  - Headings: Gowun Batang 400/700 (`font-serif`)
  - Body: Noto Sans KR (`font-sans`)
  - Pixel text in the samguk card: Silkscreen (`font-pixel`)
- Shape:
  - Cards are `rounded-[22px]`~`rounded-[30px]`
  - Buttons are pills (`rounded-full`), with the primary button at least 52px tall and others at least 48px
  - Touch targets are at least 44px
- Emoji: none in UI chrome (tabs, menus, cards, buttons, hero). Use icons from `icons.tsx` with `stroke-width` 1.5–1.6 and `aria-hidden`.
- No URL changes. Keep the existing sitemap, canonical URLs, and PageGuide.
- No fake numbers (participant counts, rankings).
- Do not put example copy or scores from the designs (복숭아상, 92점, etc.) into the product. Results come from actual calculations.
- Features not built yet (friend face 궁합, 우리 팀 삼국지 = stage 8): do not show their buttons or cards. No dead buttons. Stage 8 adds them.
- Verify at 375px. Keep the existing navigation rule (`useBackOrHome`) and `no-screenshot`.

## Review Focus

1. **Watermark and URL in captures:** the saved and story images must include "운명을 읽다 · unse-ai.com", and the tab bar and ads must be excluded (Task 5 E2E).
2. **Story sharing where Web Share is unavailable:** on desktop or in KakaoTalk's in-app browser, without `navigator.canShare({files})`, the image is saved and a notice appears. The button must never do nothing (Task 5 E2E).
3. **Gender not selected:** on screens where gender is required, the upload or analyze button must stay disabled until a gender is chosen. If it stays clickable, the user gets a result with the wrong baseline (Task 4 E2E).
4. **Old colors left behind:** no old palette hex values (#F5E6D3, #C41E3A, #E8D4C4, #5C4033, #FFD700, #D4AF37) remain in `src` (Task 7 unit test).
5. **Contrast:** text in the muted color (#6B6259) on #ECE5D9 must have a contrast ratio of at least 4.5 (Task 1 unit test).

---

### Task 1: Tokens, fonts, icon set
**Files:**
- Modify: `src/app/globals.css` (replace the `@theme` tokens and remove the old `:root` 민화 variables)
- Modify: `src/app/layout.tsx` (Noto_Serif_KR → Gowun_Batang; add Silkscreen with `variable: --font-silkscreen` and preload false; body `bg-paper text-ink`)
- Create: `src/components/icons.tsx`
- Test: `tests/design.test.ts` (replace)

**Interfaces:** Produces
```ts
export type IconName = 'home'|'face'|'moon'|'rings'|'cat'|'fan'|'heart'|'shield'|'back'|'spark'|'story'|'download'|'refresh'|'chevron'
export function Icon(props: { name: IconName; size?: number; className?: string }): JSX.Element  // stroke=currentColor, strokeWidth 1.6, aria-hidden
export function SmileFace(props: { size?: number }): JSX.Element  // design's smiling face (cheek flush in blush)
```
Tokens: `bg-paper bg-card bg-card-2 border-line text-ink text-muted text-accent bg-accent text-blush bg-navy-game text-gold-game font-serif font-pixel`

- [ ] Tests:
  - The layout uses `Gowun_Batang` and `Noto_Sans_KR`, and does not use `Noto_Serif_KR` or `Geist`
  - `globals.css` contains each of the tokens above with its exact hex value
  - The contrast ratio is ≥4.5 for: muted on card, ink on card, paper on ink, and accent on paper. Put a contrast helper in the test.
  - `renderToStaticMarkup(<Icon name=…/>)` for every `IconName` includes `aria-hidden` and `stroke-width="1.6"`
- [ ] RED → implement → GREEN
  - Keep the old token names (`vermilion`, `gold`, `navy`, `paper-2`) for now as aliases with the new values (vermilion→accent, gold→accent, navy→ink, paper-2→card-2) so existing pages don't break. Task 7 removes the aliases.
- [ ] Commit

### Task 2: Bottom tab bar and menu data
**Files:**
- Modify:
  - `src/content/navigation.ts`: `TABS[].icon: IconName`
  - The mbti tab label is "궁합"
  - Replace emoji thumbnails in `CATEGORIES[].items[].thumb` with `icon: IconName` + `bg` (the 4 card colors from the design: #F1EBE2, #F3EBDD, #E8EEE6, #E6E8DF)
  - Keep image thumbnails (samguk portraits)
- Modify: `src/components/BottomTabBar.tsx`, `src/components/CategoryList.tsx`, `src/components/home/CategoryTabs.tsx`
  - Match the design's nav: white background, top line, current tab in accent
- Tests: `tests/navigation.test.ts`, `e2e/tabbar.spec.ts` (update the label to "궁합")

- [ ] Tests:
  - TABS labels are `['홈','얼굴','운세','궁합']` and hrefs are unchanged
  - `navigation.ts` has no emoji (`/\p{Extended_Pictographic}/u`)
  - The rendered BottomTabBar has no emoji, and the current tab has `aria-current="page"`
- [ ] RED → implement → GREEN → commit

### Task 3: Home (Main board)
**Files:**
- Modify: `src/app/page.tsx`
- Create:
  - `src/components/home/FaceHero.tsx` (replaces SeasonHero)
  - `src/components/home/PlayTogether.tsx`
  - `src/components/home/SeasonCard.tsx`
- Modify: `src/components/home/ZodiacPicker.tsx` (text chips; keep the existing behavior of showing today's fortune on click)
- Modify: `src/content/season.ts` (season data now feeds the SeasonCard)
- Tests: `tests/home.test.ts`, `e2e/home.spec.ts`

Order:
1. Header: "운명을 읽다" serif + moon icon
2. FaceHero:
   - Small text: today's date "M월 D일 · 오늘의 얼굴 운". The client calculates it in KST.
   - h1: "내 얼굴에는 어떤 기운이 담겨 있을까?" Keep the existing h1 keywords (unit test). If needed, put the keyword sentence in the small subtext.
   - Button "내 얼굴 보러 가기" → `/face2`, with "사진은 저장되지 않아요" below
3. "친구랑 같이 해봐요", 2-column cards (4):
   - 관상 → `/face2`
   - 동물상 → `/animal`
   - 삼국지 → `/samguk`, titled "나는 삼국지 속 누구?"
   - MBTI 궁합 → `/mbti/match`, "우리 둘 궁합은 몇 점?"
   - Stage 8 changes the 4th card to friend face 궁합.
4. "오늘, 내 띠는?" chips plus a "2027 신년운세" link
5. SeasonCard: 2027 신년운세 (moved from the old hero, sage background #E6E8DF)
6. Category tabs (keep the existing CategoryTabs, restyled)
7. Coupang banner, FAQ

- [ ] Tests:
  - The home h1 contains the existing required keywords (reuse the existing test)
  - It has links to each of `/face2 /animal /samguk /mbti/match /fortune/2027`
  - It has no emoji
  - It has no "곧 열려요"
  - It has 12 zodiac chips
  - In DOM order, the Coupang banner comes after the PlayTogether section (E2E)
- [ ] RED → implement → GREEN → 375px screenshot → commit

### Task 4: Test start screen (TestStart board): 관상·동물상·삼국지
**Files:**
- Create:
  - `src/components/test/GenderPills.tsx`: `{ value: 'female'|'male'|null; onChange }`, a role=radiogroup with 2 pills labeled "여자" and "남자"
  - `src/components/test/PhotoPicker.tsx`: large dashed upload area, SmileFace, "사진 고르기", and helper text. It wraps the existing file input.
  - `src/components/test/PrivacyNote.tsx`: shield icon + "사진은 내 폰 안에서만 보고 바로 지워요. 어디에도 올라가지 않아요."
- Modify: input screens of `src/app/face2/page.tsx`, `src/app/animal/page.tsx`, `src/app/samguk/page.tsx`
  - Header: back icon (`useBackOrHome`) and the page name
  - Serif h1
  - GenderPills
  - PhotoPicker
  - Tip chips
  - PrivacyNote right above the button
- Gender:
  - Samguk already has its own gender selection; replace it with GenderPills.
  - 관상 and 동물상 now require a gender as well. Store the chosen value in each page's state; 2b will feed it into the analysis.
- Tests: `e2e/inputs.spec.ts`, `e2e/flows.spec.ts`, `e2e/buttons.spec.ts`

- [ ] Tests (E2E, each of the 3 pages):
  - Before a gender is chosen, the photo picker/analyze button is disabled (or the file input is inert)
  - After choosing, it is enabled
  - The PrivacyNote text is visible on screen
  - Gender pills have `role=radio` and `aria-checked`
  - Existing flows (samguk real-face, etc.) pass after adding the gender selection step
- [ ] RED → implement → GREEN → commit

### Task 5: Result card and story sharing (ResultCard board): 관상·동물상
**Files:**
- Create: `src/components/result/ResultCard.tsx`
  ```ts
  { eyebrow: string; title: string; art: ReactNode; bars: { label: string; value: number }[] /* 3 */; reasons: { label: string; text: string }[] /* 2 */; testName: string }
  ```
  The capture area includes a footer watermark: "운명을 읽다" serif + "unse-ai.com".
- Create: `src/components/result/ResultActions.tsx`
  - Primary: "스토리에 올리기"
  - Secondary: "이미지 저장" and "다시 하기"
  - No friend-궁합 button until stage 8
- Create: `src/hooks/useStoryShare.ts`
  - Inside a 1080×1920 (9:16) frame (paper background, centered card, logo at the bottom), the `ResultCard` DOM is captured with modern-screenshot.
  - It calls `navigator.share({files:[png]})`.
  - If `canShare({files})` is unsupported or fails, it downloads the image and shows the notice "이미지를 저장했어요. 인스타그램 스토리에서 불러와 올려 주세요".
  - If the user cancels (AbortError), nothing happens.
- Modify: result screens of `face2` and `animal`
  - Order: ResultCard → ResultActions → Coupang → the existing detailed reading in a `details` "풀이 자세히 보기"
  - Data mapping:
    - 관상: eyebrow is the face type, title is the one-line summary, bars are the top 3 of the existing 5 area fortunes, reasons are the 2 features with the largest scores
    - 동물상: eyebrow is "{동물}상 · 닮음 N%", bars are 3 existing traits, reasons are 2 existing appearance features
  - Use only existing analysis data; no new copy is generated.
  - Replace emoji (animal emoji, etc.) with text.
- Tests: `tests/result/ResultCard.test.tsx`, `e2e/share.spec.ts`

- [ ] Tests:
  - ResultCard rendering includes the title, 3 bars, 2 reasons, and `unse-ai.com`
  - `useStoryShare` (E2E, `navigator.share`/`canShare` stubbed via addInitScript):
    - Supported: share is called once with 1 file of type `image/png`
    - Unsupported: a download happens and the notice text is visible
    - AbortError: no notice
  - In the 관상 and 동물상 flows the result shows the summary card first, and the detailed reading sits inside `details`
- [ ] RED → implement → GREEN → commit

### Task 6: Samguk retro game card (SamgukCard board)
**Files:**
- Create: `src/components/samguk/SamgukGameCard.tsx`
  - Navy #23263A card, double border (paper/navy)
  - Silkscreen "PLAYER 1" plus faction (e.g. "SHU · 蜀")
  - Portrait `public/images/samguk/{name}.jpg` with `image-rendering: pixelated` and a gold border
  - Nickname, name, Hanja name, and "닮음 N%"
  - Gold-background chip "현대 직업 · {modernJob}"
  - "▶ 회사생활 STATUS": funStats in the fixed order 칼퇴력, 술자리생존, 워라밸, 재테크, 꼰대력, as 10-cell bars plus the number
  - modernComment in quotes
  - "UNSE-AI.COM · 운명을 읽다" watermark
- Create: `src/lib/samguk/guardian.ts`
  ```ts
  export function guardianFor(name: string): { character: SamgukCharacter; score: number; line: string }
  ```
  - Rule:
    - Candidates are characters of the same faction other than the user's. If there are fewer than 2, use all characters.
    - Pick the one with the highest 무력+통솔, breaking ties by name.
    - score: 80–98, determined by how well the two characters' funStats complement each other.
    - line: built from the guardian's `traits[0]` plus a template about the guardian's highest funStat.
  - Deterministic.
- Modify: result screen of `src/app/samguk/page.tsx`
  - Order: GameCard → "나를 지켜줄 장수" card (oatmeal) → ResultActions (story/save/retry) → "코에이 능력치 보기" `details` (the existing five stats, modern stats, and text)
  - The page header says "나는 삼국지 속 누구?"
  - The navigation.ts card title is also "나는 삼국지 속 누구?"; the URL stays the same
- Tests: `tests/samguk/guardian.test.ts`, `e2e/flows.spec.ts` (samguk)

- [ ] Tests:
  - guardianFor works for all characters, never returns the character itself, gives a score of 80–98, is deterministic, and its line has no negative words
  - The game card rendering includes all 5 funStats labels, modernJob, modernComment, and `UNSE-AI.COM`
  - The Silkscreen font variable is applied
- [ ] RED → implement → GREEN → commit

### Task 7: Clean up the remaining pages, remove aliases
**Files:**
- Modify:
  - `fortune/FortuneClient.tsx`, `fortune/daily/page.tsx`, `fortune/2027/page.tsx`, `Zodiac2027Article.tsx`
  - `about`, `privacy`
  - `PageGuide.tsx`, `BirthDateFields.tsx`, `CoupangBanner.tsx`
  - `face-tests`, `unse`, all `mbti` pages
  - `api/og/route.tsx`, `manifest.ts`
- Replace hardcoded old hex classes with tokens. Fortune pages get the same card/pill/serif pattern as the result card.
  - For fortune result screens, only move the share/save buttons right below the summary (no big structural rework).
- Remove emoji from UI chrome (buttons, headings, links). Zodiac animals become text chips.
- Remove the Task 1 aliases (`vermilion gold navy paper-2`)
- Tests: `tests/design.test.ts`

- [ ] Tests:
  - Under `src/**/*.{ts,tsx,css}`, old palette hex values (#F5E6D3 #C41E3A #E8D4C4 #5C4033 #FFD700 #D4AF37 #C8323E) appear 0 times
  - No alias tokens remain
  - No emoji in the page `.tsx` files' buttons and headings: in the rendered HTML of the major server pages (`/unse`, `/face-tests`, `/fortune/2027`, `/mbti`), there is no Extended_Pictographic in `h1,h2,button,a`
- [ ] RED → implement → GREEN → commit

### Task 8: Verification and docs
- [ ] `npm test && npm run test:e2e` all pass
- [ ] Take 375px screenshots of:
  - Home
  - The 관상 start screen
  - The 관상/동물상/삼국지 results (samguk uses `public/dev-faces/person1.jpg`)
  - /fortune result, /mbti/match, /fortune/2027/sheep
  - Compare them against the designs and fix differences in color/spacing/order
- [ ] CLAUDE.md:
  - Replace the design system section with the new tokens, icons, and shared test/result components
  - Remove the 민화 palette description
- [ ] Final reviewer (opus), fix pass → report to the user, merge, ask for push approval
