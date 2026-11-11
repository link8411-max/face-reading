# 진지한 전통 부적 + '마지막 한 획' 점안 — 구현 계획

> 구현은 이 문서 한 장과 아래 시안 파일만 보고 한다. 사용자 결정(2026-11-11): "사이트에 넣자" → 범위 승인("응, 진행해").

**목표:** 전통 화풍(trad)을 시안(docs/bujeok/serious)의 진짜 부적 짜임으로 바꾸고, 완성 직전에 사용자가 몸통 획을 직접 긋고 도장을 눌러 찍는 단계를 넣는다. 그은 획은 링크 코드에 실려 어디서 열어도 같은 그림이 나온다.

**시안(반드시 먼저 읽기):**
- `docs/bujeok/serious/art.js` — 붓 획 함수 `brush`, 종이·먹 필터, 획 목록 `STROKES`(합격), 글자 배치, 吉 도장. 이 그림이 정답 그림이다.
- `docs/bujeok/serious/jeoman.html` — 점안 상호작용(긋기 → 도장 → 완성). `tame`, 완성 판정, 도장 누르기·쿵·불꽃·진동.
- `docs/bujeok/serious/compare.png`, 글꼴 확인 그림은 맥 글꼴 대신 아래 글꼴로 그려도 같은 느낌임을 확인했다.

**기술:** Next.js 16 · TS · Tailwind 4 · vitest(`npm test`) · Playwright(`e2e/bujeok.spec.ts`). CLAUDE.md의 부적 규칙을 그대로 지킨다.

## 지켜야 할 것 (전 작업 공통)

- 붉은 바탕 금지(종이는 괴황지 노랑, 금박은 먹색). 효험 단정 문구 금지(`src/lib/bujeok/bannedPhrases.ts` 검사 통과). 이름은 링크 `#` 뒤에만.
- 글꼴은 `src/fonts/LXGWWenKaiTC-Bujeok.woff2`(이미 만들어 둠, 46자, OFL `src/fonts/OFL-LXGWWenKaiTC.txt`, 재생성 `scripts/font-subset-brush.mjs`). Google Fonts 금지. 그림 속 한자에 쓰는 글자를 늘리면 스크립트의 `BRUSH_FIXED`에 넣고 다시 돌린다.
- 제목·버튼에 이모지 없음, font-weight 900 없음. 광고는 카드·버튼 아래.
- 그림은 순수 함수로 결정된다: 같은 spec·이름이면 언제나 같은 SVG(서버 렌더·테스트 가능, `Math.random` 금지, 시드 난수만).
- 귀여운 화풍(cute) 그림은 바꾸지 않는다(도장 숨김 옵션만 추가).
- 사용자에게 보이는 문구는 한국어, 쉬운 말.

## 검토 초점 (테스트로 꼭 묶을 것)

1. 옛 5칸 코드 링크(`trad-pass-wood-0-gold`)·부적함 저장분이 그대로 열린다(기본 획으로).
2. 망가진 6번째 칸(`trad-pass-wood-0-gold-zzz`, cute에 획 칸)은 `parseBujeokCode`가 null → 404/무시, 앱이 죽지 않는다.
3. 화면 밖으로 끌거나 위로 긋거나 짧게 그은 획은 완성으로 치지 않고 다시 긋게 한다.
4. "그냥 완성하기"(키보드·움직임 줄이기 사용자)는 언제나 보이고 눌리며 기본 획으로 완성된다.
5. 잠금화면·선물 PNG에도 붓 글꼴과 사용자 획이 나온다(글꼴 변수가 `<html>`에 있어야 화면 밖 캡처에서도 풀린다).

---

## 작업 1. 붓 획 라이브러리와 획 코드

**만들 파일:** `src/lib/bujeok/brush.ts`, `src/lib/bujeok/stroke.ts`, 테스트 `tests/bujeok/stroke.test.ts`

- `brush.ts`: art.js의 `rng(seed)`, `brush(pts, w, {seed,start,end}) => string(path d)`, `circlePts`, `box`를 TS로 그대로 옮긴다. `export type Pt = [number, number]`.
- `stroke.ts` (좌표는 시안과 같은 240×508 종이 좌표):
  - `DEFAULT_SPINE: Pt[]` = 시안 STROKES[12]의 점.
  - `SPINE_W = 8 * 1.75`, 굵기 프로필 `{ start: 0.6, end: 0.12 }`, 시드 99(jeoman.html과 같게).
  - `tame(p: Pt): Pt` — jeoman.html의 것 그대로(y<432 구간에서 x를 120 쪽으로 당김).
  - `isComplete(pts: Pt[]): boolean` — 점 6개 이상, 첫 점 y ≤ 280, 마지막 점 y ≥ 405, 모든 점이 종이 안(0..240, 0..508).
  - `resample(pts: Pt[], n = 12): Pt[]` — 호 길이 기준 등간격.
  - `encodeStroke(pts: Pt[]): string` — resample 12점 → 점마다 x칸·y칸 한 글자씩(36진수 `0-9a-z`). x칸 = round((x−84)/2) (0..35로 자름), y칸 = round((y−250)/6) (0..35로 자름). 결과 `'s' + 24글자` (25자).
  - `decodeStroke(s: string): Pt[] | null` — `/^s[0-9a-z]{24}$/` 아니면 null. 칸 → 좌표 역변환.
- 테스트: 인코딩 길이 25·정규식 일치, 왕복 오차 x≤1, y≤3; 잘못된 문자열 null; `isComplete`가 짧은 획·위로 그은 획·화면 밖 점에서 false, DEFAULT_SPINE에서 true; `brush`가 같은 입력에 같은 문자열.

## 작업 2. 링크 코드에 획 싣기

**고칠 파일:** `src/lib/bujeok/keys.ts`(BujeokSpec에 `stroke?: string` — encodeStroke 결과), `src/lib/bujeok/link.ts`, 테스트 `tests/bujeok/link.test.ts`

- `bujeokCode(spec)`: `style === 'trad' && spec.stroke`이면 끝에 `-${spec.stroke}`를 붙인다. 아니면 지금 그대로 5칸.
- `parseBujeokCode`: 5칸 또는 6칸. 6칸은 style이 trad이고 `decodeStroke`가 통과할 때만, `stroke`에 담는다. 그 밖은 null.
- `bujeokOgUrl`은 그대로(획을 싣지 않는다).
- 테스트: 5칸 왕복, 6칸 왕복, cute+6칸 null, 망가진 6칸 null, 7칸 null. 부적함(box.ts)이 6칸 코드도 저장·복원하는지 box.test에 한 줄.

## 작업 3. 새 전통 그림 (trad.tsx 다시 쓰기)

**고칠 파일:** `src/components/bujeok/parts/trad.tsx`, `src/components/bujeok/parts/types.ts`, `src/lib/bujeok/palette.ts`, `src/app/layout.tsx`, `src/app/globals.css`(토큰), 새 `src/lib/bujeok/talisman.ts`, 테스트 `tests/bujeok/svg.test.tsx`(+ 새 `tests/bujeok/talisman.test.ts`)

- 글꼴: `src/app/layout.tsx`에 `localFont({ variable: '--font-bujeok-brush', src: [{ path: '../fonts/LXGWWenKaiTC-Bujeok.woff2', weight: '500' }], display: 'swap', preload: false })`를 더하고 `<html>`(다른 글꼴 변수와 같은 자리)에 변수 클래스를 붙인다. 그림 속 font-family: `var(--font-bujeok-brush), "Kaiti TC", serif`.
- 좌표: 그림 전체를 `<g transform="translate(30 6)">` 안에 시안 좌표(240×508) 그대로 그린다. `CARD_BOX.trad`(30,6,240,508)는 그대로.
- `talisman.ts`: `talismanStrokes(spec): { pts: Pt[]; w: number; start: number; end: number }[]` — 몸통(spine)을 뺀 부문 획 목록. 짜임:
  - 위(모든 소원 공통): 雨 갓 + 네 점, 三台 네모 셋 (시안 0~7).
  - 가운데(기운 el이 정함, y 150~250, 끝이 (120,250) 근처로 와서 몸통과 이어짐): fire = 시안의 우레 지그재그; wood = 가지처럼 아래로 벌어지는 ㅅ 셋; earth = 위아래로 쌓은 네모 둘(田 느낌); metal = 마름모 안 마름모; water = 물결 가로획 셋. 획 굵기·눌림은 시안 획과 비슷하게.
  - 아래 상징(소원 wish가 정함, y 258~350, x 76~164, 가운데 x=120으로 몸통이 지나감): pass = 시안의 고리+빗장 둘. 나머지는 지금 trad.tsx의 SYMBOL 뜻을 붓 획으로 크게: money 네모난 엽전(네모 안 네모)+빗장, health 겹고리 둘(위작은·아래큰), love 나란히 엮인 고리 둘, guard 문(門) 모양, allgood 작은 고리 넷, career 오르는 계단, business 쌓인 동전 타원 셋, family 지붕+점 둘, samjae 방패, wish 연등.
  - 맨 아래(공통): 鬼 갈고리 둘, 삐침 셋 (시안 13~17).
  - 변형 variant: `partsFor(spec)`의 border 0 = 시안 두 줄 테두리, 1 = 굵은 한 줄 + 네 귀 작은 네모; head 0 = 日·月 글자, 1 = 해(작은 동그라미 획)·달(초승달 획). 시드는 획 번호 + variant*31.
- 글자: 勅令(120,84, 54, letter-spacing −4) · 왼쪽 세로줄 = `WISH_TEXT[wish].hanja`(x 42, y 190+i×38, 28; 5자면 간격 34, 크기 26) · 오른쪽 세로줄 急急如律令(x 199, y 180+i×31, 21).
- 도장: 가운데 아래 吉 백문 도장(시안 그대로). 이름이 있으면(`stampChars(name)`, 이름 없으면 그리지 않음) 오른쪽 아래(대략 x 180~214, y 430~490)에 작은 붉은 이름 도장(지금 trad.tsx의 이름 도장 배치 방식, 글꼴 Gowun Batang).
- KitProps에 `hideSpine?: boolean`, `hideSeal?: boolean`, `spine?: Pt[]`(그리는 도중 미리보기용) 추가. 몸통은 `spine ?? decodeStroke(spec.stroke) ?? DEFAULT_SPINE`을 `brush(…SPINE_W…)`로. hideSeal이면 吉 도장과 이름 도장을 둘 다 숨긴다. cute.tsx는 hideSeal만 받아 도장(태그)을 숨긴다.
- 마감: paper = 시안 paper(잉크 `#B92B1B` multiply, 괴황지 그라데이션, 얼룩·섬유·그을림), gold·holo = 시안 gold(foil 그라데이션, 먹색 종이). holo의 무지갯빛은 지금처럼 카드 겹침 층. 필터·그라데이션 id는 `bujeok-ink-${finish}` 식으로 마감별(한 화면 여러 장 대비). 새 색은 PAL/FOIL에 상수로 넣고, palette.ts 머리 주석대로 globals.css 토큰 짝이 필요하면 맞춘다.
- lite(부적함 작은 격자): 필터·섬유 끄고 획·글자·도장만.
- 섬유는 `rng(42)` 고정 시드(시안 그대로), 개수 paper 160 / gold 60, lite면 0.
- 지금 trad.tsx의 `data-part` 속성은 남길 수 있는 만큼 남긴다(border, head, body, symbol, phrase, stamp). `data-a` 그리기 애니메이션을 쓰는 곳이 없으면 넣지 않는다(grep으로 확인).
- 테스트: 11 소원 × 3 마감 × 4 변형이 renderToStaticMarkup으로 던지지 않음; 勅令·소원 hanja·急急如律令이 나옴; 같은 spec 두 번 = 같은 문자열; hideSpine/hideSeal이 각 부분을 뺌; stroke가 다르면 몸통 path가 다름; 소원마다 상징 획이 서로 다름(11개 서로 다른 path 집합); 붉은 바탕 없음(종이 rect fill이 붉은 계열 아님).

## 작업 4. 점안 화면 BujeokRite

**만들 파일:** `src/components/bujeok/BujeokRite.tsx`, CSS는 globals.css의 `.bj-` 옆에 `.bj-rite-*`, 테스트 `tests/bujeok/rite.test.tsx`

- props: `{ spec: BujeokSpec; name: string | null; steps: 'draw-seal' | 'draw' | 'seal'; onDone: (stroke: string | null) => void }`. cute는 언제나 'seal'로만 쓴다.
- 화면: 카드 자리(최대 너비 420, 비율 CARD_BOX)에 `BujeokSvg`(crop) — 긋기 단계는 hideSpine+hideSeal, 도장 단계는 hideSeal(그은 획 포함).
- 긋기: jeoman.html처럼 점선 안내 길과 (120,254)에서 깜빡이는 시작점. SVG 좌표는 `getScreenCTM().inverse()`. 누르는 동안 점을 `tame`해 모으고 매 이동마다 `spine` prop으로 미리보기. 놓았을 때 `isComplete`면 encodeStroke → 다음 단계, 아니면 안내 "점선을 따라 아래까지 쭉 그어 주세요"를 띄우고 다시. 긋는 동안만 `touch-action: none`. `setPointerCapture`는 try/catch.
- 도장: 吉 도장 자리에 점선 네모 + "도장을 꾹 눌러 찍어요". 350ms 이상 눌렀다 떼면 찍힘(jeoman.html의 1.5→1.08 눌림, 쿵, 빛, 불꽃, `navigator.vibrate?.(35)`), 짧게 누르면 "조금 더 길게 눌러 주세요". 움직임 줄이기면 불꽃·쿵 없이 바로 찍힘. 찍히고 700ms 뒤 `onDone`.
- 'draw' 단계만이면(선물 보내는 사람) 긋기 성공 즉시 onDone. 'seal'만이면 도장부터.
- 위 문구: 긋기 "마지막 한 획을 그어 부적을 완성해요", 도장 "도장을 꾹 눌러 찍어요", 받는 사람(steps='seal', 획 있는 선물) "보낸 사람이 그은 부적이에요. 도장을 찍어 완성해 주세요". 효험 단정 없음.
- "그냥 완성하기" 버튼(일반 버튼, 언제나 보임, 아래쪽): 남은 단계를 건너뛰고 `onDone(지금까지 그은 획 또는 null)`. 
- 키보드: 도장 자리는 button(Enter/Space로 찍힘). 
- 분석: `track('result_view', …)`는 지금 자리 그대로 두고, 새 이벤트는 만들지 않는다.
- 테스트(jsdom): 그냥 완성하기 → onDone(null); 도장 버튼 키보드 → onDone 호출; 짧게 그은 포인터 이벤트 → 안내 문구, onDone 안 불림(SVG CTM은 목으로).

## 작업 5. 흐름에 끼우기

**고칠 파일:** `BujeokClient.tsx`, `GiftLanding.tsx`, `BujeokDone.tsx`, `BujeokCard.tsx`, globals.css(`.bj-hint`), 테스트 `client.test.tsx`, `gift.test.tsx`, `card.test.tsx`, `e2e/bujeok.spec.ts`

- BujeokClient: Phase `'form' | 'rite' | 'done'`. 만들기 → 'rite'(내 부적 trad 'draw-seal', cute 'seal'; 선물 trad 'draw', cute 'seal'은 건너뛰고 바로 done). onDone(stroke) → `setSpec({...spec, stroke: stroke ?? undefined})` → 'done'(카드 등장 회전). 다시 만들기는 획을 그대로 두고 변형만 바꿔 바로 done. 뒤로(다시하기)는 form.
- 선물 보내는 사람의 완성 카드: trad면 `hideSeal`(카드에 prop 전달) + 카드 아래 한 줄 "도장은 받는 사람이 찍어요". 선물 PNG도 화면 SVG를 찍으므로 도장 없이 나간다(의도).
- GiftLanding(받는 쪽, mine 아님): 지금의 닫힌 화면 + "열어 보기" 대신 제목·보낸 사람 줄 아래에 `BujeokRite steps='seal'`. 끝나면 지금의 열린 화면(카드 enter). mine=1은 그대로 바로 카드.
- BujeokCard: `hideSeal?: boolean`을 받아 BujeokSvg로 넘긴다(BujeokSvg에도 hideSpine/hideSeal/spine 통과 prop).
- "좌우로 밀어 돌려 보세요" 안내: 카드 위에 겹치지 않게 stage 아래, 버튼 줄 위의 흐름 안으로 옮긴다(높이 고정 자리를 비워 두어 사라질 때 화면이 튀지 않게).
- 부적함(BujeokBox) 썸네일은 parse된 spec(획 포함)을 그대로 그린다 — 고칠 것 없는지 확인만.
- e2e: 만들기 뒤 "그냥 완성하기"로 지나가는 길과, 마우스로 위에서 아래로 끌어 긋고 도장을 눌러 찍는 길 둘 다. 주소가 6칸 코드로 바뀌는지, 그 주소를 새로 열면 같은 몸통 path가 나오는지.

## 작업 6. 문서와 마무리 확인

- 설계 문서 `docs/superpowers/specs/2026-11-11-bujeok-design.md`에 `## 17. 진지한 전통 부적과 마지막 한 획 (2026-11-11, 사용자 결정)`을 짧게 더한다(이 계획 요약 + 이 파일 경로).
- 확인: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npx playwright test e2e/bujeok.spec.ts e2e/bujeok-gift-image.spec.ts`(필요하면 먼저 `next build`). 모두 통과해야 끝.
- 커밋은 작업 단위로, 메시지는 한국어 한 줄(레포 관례), 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. 푸시하지 않는다.
