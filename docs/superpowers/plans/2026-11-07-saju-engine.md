# 사주 엔진·내 사주 풀이 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `manseryeok` 만세력을 감싼 결정적 사주 엔진(네 기둥·십신·오행·대운·세운)을 만들고, 새 페이지 `/saju`(내 사주 풀이)와 기존 `/fortune`(신년운세)가 같은 엔진을 쓰게 한다. 결과마다 근거와 계산 기준이 보인다.

**Architecture:** `src/lib/saju/engine.ts` 하나만 `manseryeok@2.0.0`(정확한 버전 고정)을 import하고 우리 한글 도메인 타입으로 변환한다(서버 전용, API 라우트에서 호출). 문구는 `src/content/saju.ts`에 두고 관상 2판과 같은 금지어·근거 테스트로 막는다. 기존 `saju.ts`의 `년주계산`·`월주계산`·`일주계산`은 시그니처를 유지하되(선택 인자 `hour=12`) 내부를 엔진으로 바꿔 일진 엔진이 그대로 돈다.

**Tech Stack:** Next.js 16 App Router, TypeScript, `manseryeok@2.0.0`(MIT), vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-07-saju-engine-design.md`

## Global Constraints
- 생년월일·시간·성별·사주 글자는 GA·공유 링크·공유 이미지·로그에 넣지 않는다. 캡처는 생년월일 줄 `no-screenshot`. 공유 착지는 일간 10키만.
- 결정적: 같은 입력 → 같은 출력. `Date.now()`는 API 라우트에서 `asOfYear`(KST 올해)를 채울 때만.
- 문장 규칙(관상 2판과 동일): 해요체, 이모지 금지, 금지어(`못생·추하·추해·비호감·팔자·박복·고집불통·사납·드세·음흉·천박·허약·단명·요절·인색·쪼잔·바람기·색기·이혼·과부·불임·흉상·악상·살기·거만·오만·노안·늙어`) + 사주 금지(`백호·괴강·고란·원진·귀문·공망·양인·천라지망·관살혼잡·상관견관·재다신약·칠살·흉운·액운·재앙·신약·신강·용신`), 평가어(`부족·모자라·평범·밋밋·평균보다`), 예언어(`수명·사망·죽·질병·암·이혼·불임·결혼운`), 해석 어조("~로 풀어요/봐요"), 조심할 점 1개 + 행동 1개.
- 디자인 토큰만(bg-paper·bg-card·bg-card-2·border-line·text-ink·text-muted·text-accent), 카드 `rounded-[22px]`, 주 버튼 `h-[52px] bg-ink text-paper rounded-full`. 한글 2350자 서브셋.
- 계산 기준 고정: `dayBoundary: 'midnight'`, `trueSolarTime: { longitude: 135, applyEquationOfTime: false, applyHistoricalDst: true }`(경도 보정 0, 서머타임·표준시 변경만 반영). 시간 모름 → 정오(12:00)로 계산하되 시주는 `null`.
- 커밋은 태스크마다 컨트롤러가 한다. 다른 세션의 미커밋 파일(docs/videos, scripts/shorts, .claude/skills)은 건드리지 않는다.

## Review Focus
1. 절입 당일 시간 모름: 2027-02-04 시간 모름 → 표는 정오 기준(정미·임인)이고 `basis.boundaryWarning.kind==='jeolip'`에 `at '10:46'`, `alt '병오년·신축월'`. (Task 1 테스트)
2. 밤 11~12시 칸: 1990-05-15 "밤 11~12시" → 일주 경진(그 날짜), 시주 자시(병자), `boundaryWarning.kind==='midnight'`. (Task 1)
3. 서머타임: 1988-07-01 00:30 → 일주 병진(서머타임 반영, 반영 안 하면 정사). (Task 1)
4. 음력 윤달·범위 밖: 음력 1990-4-21 = 양력 1990-5-15 사주; 1800 이전 또는 미래 날짜는 `{ ok:false, reason:'range' }`로 돌려주고 화면은 안내만. (Task 1·3)
5. 세운 관계 등급: 일지 축 → 충(강), 오 → 합(강), 묘·해 → 반합(약), 술 → 파(약), 자 → 해(약), 미 → 같은 글자, 나머지 없음. (Task 1)

---

### Task 0 (Task 2가 먼저 만든다): 공용 키 파일
`src/lib/saju/keys.ts` — 값·타입만. `STEMS = ['갑','을','병','정','무','기','경','신','임','계'] as const`, `BRANCHES = ['자','축','인','묘','진','사','오','미','신','유','술','해'] as const`, `ELEMENTS = ['목','화','토','금','수'] as const`, `TEN_GODS = ['비견','겁재','식신','상관','편재','정재','편관','정관','편인','정인'] as const`, `STEM_KEY: Record<Stem,'gap'|'eul'|'byeong'|'jeong'|'mu'|'gi'|'gyeong'|'sin'|'im'|'gye'>`(공유 키), `HOUR_SLOTS`(13칸: `{ key:'ja1', label:'밤 11~12시', hour:23, minute:30 }, { key:'ja2', label:'밤 12~1시', hour:0, minute:30 }, chuk 02:00 → … hae 22:00`; 각 칸 대표 시각은 구간 가운데, 자1·자2만 30분), `type HourSlotKey`, `type RelationKind = '합'|'충'|'형'|'파'|'해'|'반합'|'같음'|'없음'`, `type RelationStrength = 'strong'|'weak'|'none'`.

### Task 1: 엔진·골든 테스트·기존 saju.ts 연결

**Files:**
- Create: `src/lib/saju/engine.ts`, `src/lib/saju/relations.ts`
- Modify: `package.json`(`manseryeok` **정확히** `2.0.0`, `npm i -E manseryeok@2.0.0`), `src/lib/saju.ts:72-100`(년주·월주·일주 내부 교체, 선택 인자 `hour = 12`), `tests/saju.test.ts`(2027-02-04 단언 → `hour 12 → 정미`, `hour 5 → 병오`)
- Test: `tests/saju/engine.test.ts`, `tests/saju/relations.test.ts`

**Interfaces:**
- Consumes: Task 0 keys(없으면 자기 태스크에서 먼저 만든다 — Task 2와 동시에 돌 때는 **Task 1이 keys.ts를 만들고 Task 2는 그걸 쓴다**: 컨트롤러가 순서를 보장).
- Produces:
  ```ts
  export interface SajuInput { year: number; month: number; day: number; hourSlot: HourSlotKey | null; isLunar: boolean; isLeapMonth: boolean; gender: '남' | '여' | null; asOfYear: number }
  export interface PillarOut { stem: Stem; branch: Branch; hanja: string; korean: string; stemElement: Element; branchElement: Element; stemYinYang: '양'|'음' }
  export interface SajuResult {
    ok: true
    pillars: { year: PillarOut; month: PillarOut; day: PillarOut; hour: PillarOut | null }
    dayMaster: { stem: Stem; element: Element; yinYang: '양'|'음'; key: string }
    elements: Record<Element, number> // 천간 + 지지 정기, 시주 없으면 6글자
    tenGods: { counts: Record<TenGod, number>; byPillar: { year: {stem:TenGod; branch:TenGod}; month: {...}; day: { branch: TenGod }; hour: {stem:TenGod; branch:TenGod} | null }; top: TenGod[] /* 상위 2, 동률은 TEN_GODS 순 */ }
    daeun: { startAge: number; countingAge: number; forward: boolean; korean: string; hanja: string; isCurrent: boolean }[] // gender 없으면 []
    seun: { year: number; korean: string; hanja: string; stemTenGod: TenGod; dayBranchRelation: { kind: RelationKind; strength: RelationStrength } }
    basis: { dayBoundary: 'midnight'; dstApplied: boolean; trueSolarTime: false; hourKnown: boolean; boundaryWarning: null | { kind: 'jeolip' | 'midnight'; at: string; alt: string } }
    solar: { year: number; month: number; day: number } // 음력 입력이면 변환된 양력
  }
  export type SajuFailure = { ok: false; reason: 'range' | 'invalid' }
  export function computeSaju(input: SajuInput): SajuResult | SajuFailure
  // relations.ts
  export function branchRelationToMi(dayBranch: Branch): { kind: RelationKind; strength: RelationStrength } // 2027 세운(未) 전용 표, Review Focus 5
  export function stemTenGod(dayMaster: Stem, target: Stem): TenGod // 라이브러리 getTenGod 래핑
  ```
  구현 메모: `calculateFourPillars({ year, month, day, hour, minute, isLunar, isLeapMonth, dayBoundary:'midnight', trueSolarTime:{longitude:135, applyEquationOfTime:false, applyHistoricalDst:true}, gender: 'male'|'female'|undefined })`. 시간 모름은 `hour 12, minute 0`로 넣고 `pillars.hour = null`, `tenGods.byPillar.hour = null`, elements는 6글자. `dstApplied`는 `year`가 1948~1951·1955~1960·1987~1988이면 true(라이브러리 내부 판단과 별개로 표시용). `boundaryWarning`: 시간 모름이고 그날 12절 중 하나의 절입이 있으면(`getSolarTermsOfYear` 중 홀수 index=절 확인) `{kind:'jeolip', at:'HH:MM'(KST), alt: 정오 전·후 중 다른 쪽 결과의 '○○년·○○월' 또는 '○○월'}`; `hourSlot`이 `ja1`이면 `{kind:'midnight', at:'23:00', alt:'다음 날짜로 보는 유파도 있어요'}`. `countingAge = startAge + 1`. `isCurrent`: `asOfYear − solar.year ∈ [startAge, startAge+10)`. 세운: `korean/hanja`는 `(asOfYear−4)%60` 간지(FORTUNE_YEAR와 같아야 함, 테스트), `stemTenGod(dayMaster, 세운 천간)`. 범위: 양력 1900~올해, 음력 1900~2100 밖이면 `range`; 라이브러리 `RangeError`도 `range`로.

- [ ] **Step 1: 설치** `npm i -E manseryeok@2.0.0` → package.json에 `"manseryeok": "2.0.0"`.
- [ ] **Step 2: 실패하는 테스트** `tests/saju/engine.test.ts`: 1990-05-15 미시(`mi`), 남 → 경오·신사·경진·계미, hanja '庚午'…, dayMaster 경(금, 양), daeun[0] `{startAge:7, countingAge:8, forward:true, korean:'임오'}`, 여 → startAge 3, forward false, korean '경진'; elements 합 8; tenGods.counts 합 7(일간 제외); 시간 모름 → hour null, elements 합 6, counts 합 5; 2027-02-03 12:00 → 병오·신축, 2027-02-04 05:00(인시 `in`) → 병오, 2027-02-04 12:00(오시 `o`) → 정미·임인; 2027-02-04 시간 모름 → 정미 + boundaryWarning jeolip at '10:46'; 1988-07-01 `ja2`(00:30) → 일주 병진; 1990-05-15 `ja1` → 일주 경진 + midnight 경고; 음력 1990-4-21 → 양력 5-15 사주와 동일, `solar` 1990-5-15; 1850 → `range`; 같은 입력 두 번 deep-equal; seun 2027 → '정미'·'丁未', 일간 갑이면 stemTenGod '상관', 일간 경이면 '정관'. `tests/saju/relations.test.ts`: Review Focus 5 전부.
- [ ] **Step 3: 실패 확인** → FAIL.
- [ ] **Step 4: 구현** keys.ts(이미 있으면 재사용) → relations.ts → engine.ts.
- [ ] **Step 5: saju.ts 연결**: `년주계산(y,m,d,hour=12)`·`월주계산(y,m,d,hour=12)`·`일주계산` 내부를 엔진(`computeSaju` 또는 라이브러리 직접)으로 바꾸되 반환 모양 유지. `tests/saju.test.ts` 갱신. `npx vitest run tests/saju tests/dailyEngine tests/fortune*` PASS(일진 분포 테스트가 깨지면 **원인을 보고**하고 멈춘다 — 년주가 정오 기준으로 바뀌어 입춘 당일 1건 정도 달라질 수 있음).
- [ ] **Step 6: 통과 확인** `npm test` 전체 PASS, `npx tsc --noEmit`.

### Task 2: 문구 데이터·문장 규칙 테스트

**Files:**
- Create: `src/content/saju.ts`
- Test: `tests/saju/copy.test.ts`

**Interfaces:**
- Consumes: Task 0 keys.
- Produces:
  ```ts
  export const DAY_MASTER_COPY: Record<Stem, { title: string /* "나는 큰 나무예요" 식 비유, '~예요' */; line: string /* 한 줄 뜻 */ }>
  export const TEN_GOD_COPY: Record<TenGod, { easy: string; meaning: string; many: string; none: string }> // 쉬운 이름: 비견 나란히·겁재 승부욕·식신 즐기는 재주·상관 톡톡 표현·편재 넓은 활동·정재 꼼꼼한 살림·편관 도전 압력·정관 반듯한 틀·편인 특별한 배움·정인 든든한 배움
  export const ELEMENT_COPY: Record<Element, { easy: string; strong: string; weak: string }> // 새싹·불꽃·대지·칼날·물결
  export const RELATION_COPY: Record<RelationKind, string> // 합 "서로 끌어당겨 어우러져요" …, 같음 "같은 글자라 익숙한 흐름이에요", 없음 "특별한 합·충 없이 담담한 해예요"
  export const DAEUN_TEMPLATE: (p: { countingAge: number; korean: string; tenGodEasy: string }) => string
  export const SEUN_TEMPLATE: (p: { dayMasterTitle: string; tenGodEasy: string; relationLine: string }) => string
  export function cautionFor(elements: Record<Element, number>, total: number): { situation: string; action: string; basis: string } // 가장 많은 오행(≥ total/2 반올림)이 있으면 그 오행의 situation, 없으면 0개 오행 중 ELEMENTS 순 첫 번째, 둘 다 없으면 균형형 문구. basis 예 "불꽃(화)이 넷이라"
  export const BASIS_COPY: { jeolgi: string; dayBoundary: string; dst: string; trueSolar: string; hourUnknown: string; boundaryJeolip: (at: string, alt: string) => string; boundaryMidnight: string }
  export const SOURCE_LINE = '절기·음력은 한국천문연구원 역법 데이터를 담은 만세력 라이브러리 기준이에요. 해석은 유파에 따라 다를 수 있어요.'
  export const DISCLAIMER = '사주는 오랜 전통의 해석 놀이이고 과학적 진단이 아니에요. 재미로 읽고, 중요한 결정의 근거로 삼지 말아 주세요.'
  export function evidenceTail(tenGod: TenGod, count: number): string // "정재가 둘이라" 형식(하나·둘·셋·넷…)
  ```
- [ ] **Step 1: 실패하는 테스트**: 10 일간·10 십신·5 오행·8 관계 전부 있음; 모든 문자열 금지어·평가어·예언어·이모지 없음(Global Constraints 목록을 상수로); TEN_GOD_COPY.many/none 모두 긍정형(금지어 외에 `안 돼요|못해요|나빠요` 없음); `cautionFor` — 화 4/8 → basis '불꽃(화)이 넷이라', situation에 "하기 쉬운" 포함, action 1문장; 균형(모두 1~2) → 균형형; 토 0 → 토 none 문구; `evidenceTail('정재',2)==='정재가 둘이라'`; DAEUN/SEUN 템플릿 출력에 "참고" 또는 "몫" 같은 비결정 표현 1회 포함(숙명론 방지).
- [ ] **Step 2: 실패 확인** → FAIL. **Step 3: 작성**(심리 가이드 톤). **Step 4: PASS**, 2350자 확인.

### Task 3: /saju 페이지·API·공유 착지

**Files:**
- Create: `src/app/saju/page.tsx`(서버, 메타데이터·JSON-LD·PageGuide), `src/app/saju/SajuClient.tsx`("use client": 입력 폼 → `/api/saju` → 결과), `src/app/api/saju/route.ts`, `src/components/saju/{SajuTable,ElementBars,TenGodSummary,DaeunTimeline,SeunCard,BasisDetails,SajuResultView}.tsx`, `src/app/saju/r/[key]/page.tsx`(일간 10키 공유 착지, noindex, canonical /saju)
- Modify: `src/lib/shareLinks.ts`(`ShareKind`에 `'saju'`, `TEST_PATH.saju='/saju'`, `TEST_NAME.saju='내 사주 풀이'`, `parseShared('saju', key)`: key ∈ STEM_KEY 값, name = DAY_MASTER_COPY[stem].title, phrase `나는 ${title.replace(/예요$/,'')}래. 너는?`), `src/lib/ogQuery.ts`(saju: ['key']), `src/app/api/og/result/route.tsx`(kind 'saju' 허용), `src/content/navigation.ts`(운세 묶음 "생년월일로 보는 운세"에 `{ title:'내 사주 풀이', desc:'네 기둥·십신·대운을 쉬운 말로', href:'/saju', chip:'시주 지원' }`), `src/app/sitemap.ts`(`/saju`, lastmod 2026-11-07), `src/content/pageGuides.ts`(`GuideRoute`에 '/saju' + 가이드: summary·intro·highlights·faqs 4개·related), `src/lib/analytics.ts`(`TestName`에 'saju'), CLAUDE.md test_name 줄
- Test: `tests/saju/view.test.tsx`, `tests/saju/api.test.ts`, `tests/shareLinks.test.ts`·`tests/pageGuides.test.ts`(추가)

**Interfaces:**
- Consumes: Task 1 `computeSaju`, Task 2 copy, `BirthDateFields`(`value/onChange/error`), `validateBirthDate`(fortuneService 쪽 함수를 재사용), `useRememberedGender`, `useScreenshot`, `useResultShare`, `CoupangBanner`, `PageGuide`.
- Produces: `POST /api/saju` body `{ year, month, day, hourSlot: HourSlotKey|null, isLunar, isLeapMonth, gender: '남'|'여' }` → `SajuResult | SajuFailure`(400), `asOfYear`는 서버가 KST 올해. `SajuResultView({ result, captureRef, actions, after })`.
  화면 순서(스펙 결과 구조): 상단 안내(시간 모름이면 BASIS_COPY.hourUnknown) → SajuTable(4열 또는 3열+"모름", 한자 크게·한글 작게, `no-screenshot` 생년월일 줄은 표 위에) → "나는 ○○예요" 카드(DAY_MASTER_COPY) → ElementBars(5 막대, count/total) → TenGodSummary(top 2: easy 굵게 + 전통 이름 작게 + evidenceTail + many 문장; count 0인 십신 중 ELEMENTS 영향 없이 **표시 안 함**) → DaeunTimeline(가로 스크롤 8칸, isCurrent 강조, "만 N세부터(세는 나이 M세)", gender 없으면 숨김) → SeunCard(SEUN_TEMPLATE + RELATION_COPY) → 조심할 점 하나(`cautionFor`, basis 꼬리, `no-screenshot`) → actions(공유하기·이미지 저장·다시하기) → BasisDetails(`<details>` "어떻게 계산했나요": jeolgi·dayBoundary·dst(해당 연도만)·trueSolar·boundaryWarning) → SOURCE_LINE·DISCLAIMER → after(CoupangBanner subId 'saju', 관련 링크 /fortune·/fortune/daily).
  GA: `fortune_submit{test_name:'saju'}`, `result_view{test_name:'saju', result_id: dayMaster.key}`, `share_click`. 입력 폼: 양력/음력 토글·윤달·BirthDateFields·시간 select 13칸+모름·성별 radio(기억값 미리 선택, `saveGender`).
- [ ] **Step 1: 실패하는 테스트**: view — renderToStaticMarkup으로 1990-05-15 미 남 결과에 '庚午'·'계미'·'나는'·십신 top 2의 easy·'만 7세부터'·'정미'·'어떻게 계산했나요'·SOURCE_LINE 포함, 조심할 점 블록 `no-screenshot`, 시간 모름 결과에 '모름' 열과 hourUnknown 문구, jeolip 경고 문구; api — 잘못된 날짜 400, 정상 200 + `daeun` 길이 8, gender 없으면 400; shareLinks — 10키 전부 OK·모르는 키 null; pageGuides — '/saju' 가이드 존재·faqs ≥ 4.
- [ ] **Step 2: FAIL 확인 → Step 3: 구현 → Step 4: `npm test`·`npm run build` PASS.**
- [ ] **Step 5: 화면 확인** dev 3311, Playwright 390×844: 입력 → 결과 전체 스크린샷 `scratchpad/saju-result.png`, 시간 모름 결과 `saju-unknown.png`. 가로 스크롤 없음.

### Task 4: /fortune 신년운세 교체·문구 정합

**Files:**
- Modify: `src/lib/fortuneService.ts`(`FortuneRequest`에 `hourSlot: HourSlotKey|null`(기존 `hour` 문자열 대체), `computeSaju`로 사주 계산 → `사주정보`에 네 기둥(한자·한글)·`오행분포`(엔진 8/6글자)·`세운`·`basis` 추가, `강한오행·약한오행`을 엔진 집계로), `src/app/api/fortune/route.ts`(hourSlot 전달), `src/app/fortune/FortuneClient.tsx`(시간 select 13칸, 사주 표를 `SajuTable` 재사용, 오행 막대 `ElementBars` 재사용, "2027 정미년과 나" 절(`SeunCard`)을 총운 위에, `BasisDetails`를 행운 요소 아래), `src/content/pageGuides.ts` '/fortune'(intro 2문단·highlights·faq 1·3번: "네 기둥(시간을 알면)·절기 시각 기준·시간을 알면 시주까지"로), `tests/pageGuides.test.ts:44-52`(역단언을 새 사실로: `toContain('절기')`, `toContain('시주')`, `not.toContain('여섯 글자')`, `not.toContain('하루 정도')`), `tests/fortuneService.test.ts`(hourSlot·세운 기대값), CLAUDE.md "신년운세 (연도별 갱신)" 절(사주 계산 줄 교체), `src/app/sitemap.ts`('/fortune' lastmod)
- Test: 위 테스트 갱신 + `tests/saju/fortuneIntegration.test.ts`(computeFortune 결과의 네 기둥이 computeSaju와 같음, 시간 모름이면 시주 null, 강한오행이 엔진 집계의 최댓값)
- [ ] **Step 1: 실패하는 테스트 → Step 2: 구현 → Step 3: `npm test`·`npm run build` PASS.**
- [ ] **Step 4: E2E** `npx playwright test e2e/share.spec.ts e2e/flows.spec.ts e2e/chrome-emoji.spec.ts e2e/hubs.spec.ts e2e/navigation.spec.ts`(신년운세 흐름·공유·새 /saju 링크) PASS. 기대값이 옛 구조인 곳만 수정.
- [ ] **Step 5: 화면 확인** `/fortune` 결과 390×844 스크린샷 `scratchpad/fortune-v2.png`.

### Task 5 (컨트롤러): 배포
- 전체 `npm test`·E2E, 커밋·푸시, 운영 확인(`/saju` 200, `/api/saju` 정상, `/fortune` 표), `node scripts/indexnow.mjs /saju /fortune`, 사용자에게 실사례 대조 요청.
