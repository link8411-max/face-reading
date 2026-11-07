# 관상 테스트 2판 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** /face2를 face-api 6유형 점수 분류기에서 MediaPipe 기반 "얼굴형 5 × 센 자리 3 = 15유형 + 자리 5곳" 관상으로 바꾸고, 결과 공개 모션과 성별 미리 고르기를 붙인다.

**Architecture:** 삼국지·동물상이 쓰는 `analyzePhoto`(MediaPipe 478점 → 성별 z) 파이프라인에 관상 전용 특징 추출기·z 통계·분류기를 **별도 모듈로** 얹는다(기존 FEATURE_KEYS·프로필은 건드리지 않음). 분포는 동물상과 같은 bias 보정 + 시뮬레이션 테스트로 고정한다. 문구는 `src/content/guansang.ts` 한 파일에 두고 금지어·규칙 테스트로 막는다. face-api는 성별 추정(tiny detector + age_gender)만 남긴다.

**Tech Stack:** Next.js 16 App Router, TypeScript, @mediapipe/tasks-vision, @vladmandic/face-api(성별 추정만), vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-07-face-reading-v2-design.md`

## Global Constraints
- 사진은 브라우저 밖으로 나가지 않는다. 사진·얼굴 수치·성별 추정값은 GA·공유 링크·서버로 보내지 않는다(`track()` 허용 키만, result_id는 유형 키).
- 모든 결과는 결정적이다. `Math.random()` 금지(시드 난수 `mulberry32`만, 시뮬레이션 전용).
- 문장 규칙(스펙 "문장 규칙"): 해요체, 이모지 금지, 금지어 목록 `못생·추·비호감·팔자·박복·고집불통·사납·드세·음흉·천박·허약·단명·요절·인색·쪼잔·바람기·색기·이혼·과부·불임·흉상·악상·살기·거만·오만·노안·늙어`, 평가어 `작다·짧다·좁다·낮다·부족·모자라·평범·밋밋·평균보다` 금지, 건강·수명·자녀·결혼 예언 금지, "~로 풀어요" 해석 어조.
- 라벨: `두드러진 자리 / 고른 자리 / 가꿀수록 자라는 자리`. 두드러진 ≥1, 가꿀수록 ≤2, 가꿀수록 줄에는 가꾸는 방법 한 문장.
- 디자인 토큰만(bg-paper·bg-card·bg-card-2·border-line·text-ink·text-muted·text-accent), 카드 `rounded-[22px]`/`[30px]`, 주 버튼 `h-[52px] bg-ink text-paper rounded-full`. 한글은 KS X 1001 2350자 서브셋(밖이면 `node scripts/font-subset.mjs`).
- 유형 키: `<shape>-<zone>`, shape ∈ `wood|fire|earth|metal|water`, zone ∈ `up|mid|down` (예 `earth-mid`, 24자 이하).
- 커밋은 태스크마다. 다른 세션의 미커밋 파일(docs/videos, scripts/shorts 등)은 건드리지 않고 `git add`에 포함하지 않는다.

## Review Focus
1. 앞머리로 이마가 가려진 사진: 상정 비율이 범위 밖이면 `foreheadUncertain=true`, zone은 mid/down 중에서만, 화면에 추정 안내. (Task 3 테스트)
2. 고개를 살짝 돌린 사진: `checkFrontal` 통과 범위 안에서 광대폭·턱폭 비대칭이 생겨도 얼굴형이 뒤집히지 않도록 좌우 평균 사용. (Task 1 테스트: 좌우 ±5% 비대칭에 같은 결과)
3. 라벨 보장 규칙의 경계: 5자리 z가 전부 −1이거나 전부 +1일 때도 두드러진 ≥1·가꿀수록 ≤2. (Task 3 테스트)
4. 옛 공유 링크 `/face2/r/wealth` 등 6개가 시작 화면으로 떨어지지 않고 새 유형으로 착지. (Task 6 테스트)
5. 성별 추정 실패·느림: 모델 로드 실패·1.5초 초과·확신 0.6 미만이면 빈 칸이고 분석 버튼 문구가 "성별을 먼저 골라 주세요". (Task 5 테스트)

---

### Task 1: 관상 전용 특징 추출

**Files:**
- Create: `src/lib/face/guansangFeatures.ts`
- Test: `tests/guansang/features.test.ts`
- Test helper: `tests/guansang/fakeLandmarks.ts`

**Interfaces:**
- Consumes: `Landmark` from `@/lib/face/landmarkFeatures` (478점, x·y 정규화 좌표).
- Produces:
  ```ts
  export const GUANSANG_KEYS = ['cheekWidth','jawCheekRatio','jawAngle','chinTaper','foreheadWidth','zoneUp','zoneMid','zoneDown','browInnerGap','browLength','eyeCornerToEdge'] as const
  export type GuansangKey = typeof GUANSANG_KEYS[number]
  export type GuansangFeatureVector = Record<GuansangKey, number>
  export function extractGuansangFeatures(lm: Landmark[]): GuansangFeatureVector
  export const ZONE_UP_RANGE = { min: 0.22, max: 0.45 } // 초기값. Task 2에서 실측으로 갱신
  ```
  정의(모두 `aligned(lm)` 회전 정렬 좌표, 좌우는 평균): `cheekWidth`=|116↔345|/faceW(234↔454) · `jawCheekRatio`=|172↔397|/|116↔345| · `jawAngle`=각(172-152-397, 도) · `chinTaper`=|148↔377|/|172↔397| · `foreheadWidth`=|54↔284|/faceW · `zoneUp`=(10→눈썹중앙(105,334 평균)) / faceH(10↔152), `zoneMid`=(눈썹중앙→1)/faceH, `zoneDown`=(1→152)/faceH (셋의 합 = 1) · `browInnerGap`=|107↔336|/iod(133↔362) · `browLength`=평균(|70↔107|,|300↔336|)/iod · `eyeCornerToEdge`=평균(|33↔234|,|263↔454|)/faceW.

- [ ] **Step 1: 테스트 헬퍼** `tests/guansang/fakeLandmarks.ts`: `fakeLandmarks(overrides?: Partial<Record<number, {x:number;y:number}>>): Landmark[]` — 478개를 기본 템플릿(정면 얼굴을 흉내 낸 좌표: 사용 인덱스 10,152,234,454,116,345,172,397,148,377,54,284,105,334,1,107,336,70,300,133,362,33,263,168,129,358,61,291,0,13,14,17,159,145,386,374 에 그럴듯한 값, 나머지는 (0.5,0.5))로 만들고 overrides로 덮어쓴다.
- [ ] **Step 2: 실패하는 테스트** `tests/guansang/features.test.ts`:
  - `zoneUp+zoneMid+zoneDown`이 1±1e-9.
  - 전체 좌표를 2배 확대·(0.1,0.2) 이동·5° 회전해도 모든 특징이 1e-6 안에서 같다.
  - 172·397의 x를 바깥으로 벌리면 `jawCheekRatio`와 `jawAngle`이 커진다.
  - 148·377을 안쪽으로 모으면 `chinTaper`가 작아진다.
  - 왼쪽 광대(116)만 3% 바깥으로 옮겨도 `cheekWidth` 변화가 1.5% 이내(좌우 평균).
- [ ] **Step 3: 실패 확인** `npx vitest run tests/guansang/features.test.ts` → 모듈 없음으로 FAIL.
- [ ] **Step 4: 구현** `extractGuansangFeatures`. `aligned`는 `landmarkFeatures.ts`에서 `export`로 바꿔 재사용(기존 동작 불변).
- [ ] **Step 5: 통과 확인** 같은 명령 → PASS. `npx vitest run tests/face` 도 PASS.
- [ ] **Step 6: Commit** `feat(guansang): 관상 전용 얼굴 특징 11개 추출`

### Task 2: 성별 통계·샘플링·실측 스크립트

**Files:**
- Create: `src/lib/face/guansangStats.ts`, `scripts/measure-guansang-stats.mjs`
- Modify: `src/app/dev/face-lab/FaceLab.tsx:41` (행에 `guansang: extractGuansangFeatures(lm)` 추가)
- Test: `tests/guansang/stats.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const GUANSANG_STATS_BY_GENDER: Record<Gender, Record<GuansangKey, { mean: number; std: number }>> // 초기값은 추정치, 주석에 "추정" 표기
  export type GuansangZ = Record<GuansangKey, number>
  export function toZGuansang(f: GuansangFeatureVector, gender: Gender): GuansangZ // featureStats.toZ와 같은 STD_INFLATION·Z_LIMIT
  export function sampleGuansang(rng: () => number, gender: Gender): GuansangFeatureVector // zone 셋은 Dirichlet 대신 각각 정규로 뽑은 뒤 합 1로 정규화
  ```
- [ ] **Step 1: 실패하는 테스트**: 두 성별 모두 11개 키에 mean·std(>0) 있음; `toZGuansang`이 평균 입력에 0, 범위 ±Z_LIMIT 클램프; `sampleGuansang` 1,000개의 zone 합이 1, 각 특징 평균이 stats.mean ± 0.1·std.
- [ ] **Step 2: 실패 확인** → FAIL.
- [ ] **Step 3: 구현** (초기 추정치: cheekWidth 0.95/0.03, jawCheekRatio 0.78/0.06, jawAngle 110/8, chinTaper 0.55/0.07, foreheadWidth 0.80/0.05, zoneUp 0.33/0.04, zoneMid 0.33/0.03, zoneDown 0.34/0.03, browInnerGap 0.42/0.06, browLength 0.95/0.08, eyeCornerToEdge 0.12/0.02; 남은 jawCheekRatio +0.03, jawAngle −4, chinTaper +0.04).
- [ ] **Step 4: 통과 확인** → PASS.
- [ ] **Step 5: FaceLab에 guansang 열 추가, 스크립트** `scripts/measure-guansang-stats.mjs`는 `measure-face-stats.mjs`를 복사해 `r.guansang`을 읽고 `GUANSANG_STATS_BY_GENDER` 형태로 출력. 머리말에 실행법 2줄.
- [ ] **Step 6: 실측** `npx next dev -p 3311` 띄우고 `node scripts/measure-guansang-stats.mjs` → 출력을 `guansangStats.ts`에 붙여 넣고 "추정" 주석을 "2026-11-xx 실측 여 N·남 N"으로. `ZONE_UP_RANGE`를 실측 zoneUp의 min·max에 20% 여유를 둔 값으로 갱신. dev 서버 종료.
- [ ] **Step 7: 통과 확인** `npx vitest run tests/guansang` → PASS. **Commit** `feat(guansang): 성별 통계·샘플링·실측 스크립트`

### Task 0 (Task 4가 먼저 만든다): 공용 키 파일
`src/lib/face/guansangKeys.ts` — SHAPE_KEYS·ShapeKey·ZONE_KEYS·ZoneKey·GuansangTypeKey·GUANSANG_TYPE_KEYS(15개, shape 순 × zone 순)·PALACE_KEYS·PalaceKey·PalaceLabel('strong'|'even'|'grow')·`isGuansangTypeKey(s: string): s is GuansangTypeKey`. 값만 있고 로직 없음. Task 3·4·6이 모두 여기서 import한다.

### Task 3: 분류기·자리 판독·보정·분포 테스트

**Files:**
- Create: `src/lib/face/guansang.ts`, `src/lib/face/palaces.ts`, `src/lib/face/guansangSimulate.ts`, `src/lib/face/guansangCalibration.json`, `scripts/calibrate-guansang.ts`
- Test: `tests/guansang/classify.test.ts`, `tests/guansang/palaces.test.ts`, `tests/guansang/distribution.test.ts`

**Interfaces:**
- Consumes: `ZVector`(기존 15특징 z, `toZ`), `GuansangZ`(Task 2), `GuansangFeatureVector`(zone 원값).
- Produces:
  ```ts
  // 키·타입은 guansangKeys.ts(Task 0)에서 import
  export interface GuansangInput { z: ZVector; g: GuansangZ; zones: { up: number; mid: number; down: number } }
  export interface GuansangResult { type: GuansangTypeKey; shape: ShapeKey; zone: ZoneKey; balanced: boolean; foreheadUncertain: boolean; palaces: PalaceResult[] }
  export interface Calibration { seed: number; n: number; shapeBias: Record<ShapeKey, number>; zoneBias: Record<ZoneKey, number> }
  export function classifyGuansang(input: GuansangInput, cal?: Calibration): GuansangResult
  // palaces.ts
  export interface PalaceResult { key: PalaceKey; label: PalaceLabel; z: number }
  export function readPalaces(z: ZVector, g: GuansangZ): PalaceResult[] // 항상 5개, 순서 고정 money·work·love·people·base
  // guansangSimulate.ts
  export function simulateGuansang(n: number, gender: Gender, cal: Calibration, seed: number): Record<string, number> // 15키별 횟수
  ```
  규칙: 얼굴형은 5개 프로토타입 z(`shapeProfiles`, 가중 유클리드 거리 + shapeBias, 거리 계산은 자체 구현): wood `{faceAspect:+1.0, cheekWidth:-0.6, jawCheekRatio:-0.3}` · fire `{foreheadWidth:+0.8, jawCheekRatio:-0.9, chinTaper:-0.8}` · earth `{faceAspect:-0.8, jawCheekRatio:+0.6, jawAngle:+0.5, cheekWidth:+0.5}` · metal `{jawAngle:-1.0, jawCheekRatio:+0.7, cheekWidth:+0.4, chinTaper:+0.3}` · water `{faceAspect:-0.6, jawAngle:+0.8, chinTaper:+0.6, jawCheekRatio:+0.2}` (weight 기본 1, 명시 특징 1.5). 센 자리는 zone 비율 z에 zoneBias를 더해 최대값; `balanced` = 세 구간 z의 max−min ≤ 0.6 (원비율은 상정 0.16·중정 0.38·하정 0.45처럼 애초에 다르므로 z로 본다); `foreheadUncertain` = zoneUp 원값이 `ZONE_UP_RANGE` 밖 → up 제외. 자리 z: money=평균(noseWidth, noseLength) · work=zoneUp z(foreheadUncertain이면 0) · love=평균(eyeTilt, eyeCornerToEdge) · people=평균(browLength, browTilt) · base=평균(jawWidth, −(jawAngle z)) ; 라벨 z≥0.5 strong, ≤−0.5 grow, 사이 even; 보정: strong 0개면 z 최대 1개 strong, grow 3개 이상이면 z 낮은 2개만 grow.

- [ ] **Step 1: 실패하는 테스트** `classify.test.ts`: (a) 각 프로토타입 z를 그대로 넣으면 그 shape; (b) zone z가 up +1.5/mid 0/down 0이면 up, mid +1.2이면 mid (zones 원값은 실측 평균 근처로); (c) zoneUp 0.15(범위 밖)→`foreheadUncertain` true이고 zone≠'up'; (d) 세 구간 z가 (0.1, −0.1, 0.2)이면 balanced true, (1.2, −0.3, 0)이면 false; (e) 같은 입력 두 번 → 같은 결과. `palaces.test.ts`: 전부 −1 → strong 정확히 1·grow 2; 전부 +1 → strong 5·grow 0; 순서 고정. `distribution.test.ts`: 동물상 테스트를 복사해 남·여 × 시드 2개에서 15키 전부 ≥1, 각 키 ≤ 균등 3배, shape 5개·zone 3개도 같은 기준.
- [ ] **Step 2: 실패 확인** → FAIL.
- [ ] **Step 3: 구현** `palaces.ts` → `guansang.ts` → `guansangSimulate.ts`(샘플: `sampleFeatures`+`sampleGuansang` 같은 rng, `toZ`+`toZGuansang`).
- [ ] **Step 4: 보정** `scripts/calibrate-guansang.ts`(calibrate-animal 복사, shapeBias·zoneBias 두 벌을 번갈아 갱신, 목표 0.7~1.4배) 실행 → `guansangCalibration.json` 생성(`{seed, n, shapeBias, zoneBias}`).
- [ ] **Step 5: 통과 확인** `npx vitest run tests/guansang` → PASS. 15키 비율을 커밋 메시지에 적는다.
- [ ] **Step 6: Commit** `feat(guansang): 15유형 분류기·자리 판독·분포 보정`

### Task 4: 문구 데이터와 문장 규칙 테스트

**Files:**
- Create: `src/content/guansang.ts`
- Test: `tests/guansang/copy.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface GuansangTypeCopy { key: GuansangTypeKey; nickname: string; oneLiner: string; caution: { situation: string; action: string }; partner: GuansangTypeKey; partnerLine: string }
  export const GUANSANG_TYPES: Record<GuansangTypeKey, GuansangTypeCopy>
  export const SHAPE_COPY: Record<ShapeKey, { easy: string; traditional: string; evidence: string }> // easy: 길쭉하고 곧은 얼굴 / 이마가 넓고 턱이 갸름한 얼굴 / 둥글고 넉넉한 얼굴 / 각지고 또렷한 얼굴 / 둥글고 부드러운 얼굴, traditional: 목형…수형
  export const ZONE_COPY: Record<ZoneKey, { easy: string; traditional: string; evidence: string }> // easy: 이마가 센 얼굴 / 코·광대가 센 얼굴 / 턱이 센 얼굴
  export const PALACE_COPY: Record<PalaceKey, { easy: string; part: string; traditional: string; lines: Record<PalaceLabel, string>; grow: string }> // easy: 돈 자리·일 자리·사랑 자리·곁 사람 자리·받쳐 주는 자리, part: 코·이마·눈꼬리 옆·눈썹·턱, traditional: 재백궁·관록궁·부처궁·형제궁·노복궁, grow: 가꾸는 방법 한 문장
  export const LABEL_COPY: Record<PalaceLabel, string> // 두드러진 자리·고른 자리·가꿀수록 자라는 자리
  export const BALANCED_CHIP = '고르게 짜인 얼굴'
  export const FOREHEAD_NOTE = '앞머리로 이마가 가려져 이마 자리는 추정이에요'
  export const DISCLAIMER = '관상은 오랜 전통의 해석 놀이이고 과학적 진단이 아니에요. 사진의 윤곽과 비율을 전통 틀에 맞춰 재미로 풀어본 결과예요.'
  export const SCHOOL_NOTE = '유파마다 얼굴형 분류가 조금씩 달라요'
  export function evidenceText(shape: ShapeKey, zone: ZoneKey): string // SHAPE_COPY.evidence + ' ' + ZONE_COPY.evidence
  export const LEGACY_FACE_KEYS: Record<string, GuansangTypeKey> = { wealth:'earth-mid', blessing:'water-mid', leader:'metal-mid', noble:'metal-up', scholar:'wood-up', artist:'fire-up' }
  ```
  별명 15개는 스펙 표 그대로. partner는 스펙 규칙(나를 생해 주는 얼굴형 + up↔down, mid→up).
- [ ] **Step 1: 실패하는 테스트**: 15키 전부 있음·별명 끝이 "상"·중복 없음; 모든 문자열에 금지어·평가어·이모지 없음(Global Constraints 목록을 테스트 상수로); `caution.situation`에 "~하기 쉬운" 또는 "~하기 쉬워요" 포함, `caution.action` 1문장; 각 PALACE `lines.grow`+`grow`가 비어 있지 않음; partner 표가 규칙과 일치(상생 함수로 계산해 비교); 모순 단어 쌍(넉넉↔간결, 또렷↔부드러)이 `evidenceText` 15조합 안에 같이 나오지 않음; oneLiner 20~60자.
- [ ] **Step 2: 실패 확인** → FAIL.
- [ ] **Step 3: 문구 작성** — 스펙 "문장 규칙"과 검수 5문항을 지켜 15유형·5자리×3라벨·가꾸는 방법 5·근거 조각 8·조심할 점 15·partnerLine 15. 심리 에이전트 샘플(곳간이 든든한 상 등)의 톤을 따른다.
- [ ] **Step 4: 통과 확인** `npx vitest run tests/guansang/copy.test.ts` → PASS. 폰트 서브셋 테스트가 걸리면 `node scripts/font-subset.mjs`.
- [ ] **Step 5: Commit** `feat(guansang): 15유형·자리 문구와 문장 규칙 테스트`

### Task 5: 성별 미리 고르기(기억값 → face-api 추정)

**Files:**
- Create: `src/lib/face/genderGuess.ts`, `src/hooks/useGenderGuess.ts`
- Copy: `node_modules/@vladmandic/face-api/model/{tiny_face_detector_model-weights_manifest.json,tiny_face_detector_model.bin,age_gender_model-weights_manifest.json,age_gender_model.bin}` → `public/models/`
- Test: `tests/guansang/genderGuess.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const GUESS_MIN_PROB = 0.6; export const GUESS_TIMEOUT_MS = 1500
  export function pickGender(p: { gender: 'male' | 'female'; probability: number } | null): Gender | null // probability < GUESS_MIN_PROB → null
  export async function guessGender(img: HTMLImageElement, deps?: { detect: () => Promise<...>; now?: () => number }): Promise<Gender | null> // 타임아웃·예외 → null, 모델은 처음 한 번만 로드
  export function useGenderGuess(image: string | null, current: Gender | null, setGender: (g: Gender) => void): void // current가 null일 때만, 사진이 바뀔 때 한 번
  ```
- [ ] **Step 1: 실패하는 테스트** `pickGender` 경계(0.59→null, 0.6→값, male→'남'); `guessGender`가 detect 거부·1,600ms 지연 시 null, 성공 시 값; `useGenderGuess`가 current가 있으면 detect를 호출하지 않음(모의 deps).
- [ ] **Step 2: 실패 확인** → FAIL.
- [ ] **Step 3: 구현** (face-api `nets.tinyFaceDetector`+`nets.ageGenderNet`, `/models` 경로, 동적 import). 가중치 4개 복사.
- [ ] **Step 4: 통과 확인** → PASS. **Commit** `feat(face2): 성별 미리 고르기(기억값·기기 내 추정)`

### Task 6: /face2 화면·공유·유형 카드 교체

**Files:**
- Create: `src/components/face/GuansangResultView.tsx`
- Modify: `src/lib/face/analyzePhoto.ts`(`analyzePhotoDetailed` 추가), `src/app/face2/page.tsx`(전면 교체), `src/lib/shareLinks.ts:17-25`, `src/content/pageGuides.ts`(관상 sections 1번째를 15유형으로), `src/app/face2/layout.tsx`(description에 6유형 이름이 있으면 교체), `src/app/sitemap.ts`(`/face2` lastmod)
- Test: `tests/guansang/result.test.tsx`, `tests/shareLinks.test.ts`(기존에 추가), `tests/pageGuides.test.ts`(face2 섹션 15개로 수정)

**Interfaces:**
- Consumes: Task 3 `classifyGuansang`·`readPalaces`, Task 4 copy, Task 5 hook, `ResultCard`(chips·reasons), `ResultActions`, `NextTests`, `useResultShare`, `useRememberedGender`.
- Produces:
  ```ts
  // analyzePhoto.ts
  export type PhotoDetailed = { ok: true; z: ZVector; g: GuansangZ; zones: {up:number;mid:number;down:number}; landmarks: Landmark[] } | PhotoFailure
  export async function analyzePhotoDetailed(dataUrl: string, gender: Gender): Promise<PhotoDetailed>
  // shareLinks.ts
  export const FACE_TYPES: Record<string, string> // 15키 → 별명 (GUANSANG_TYPES에서 생성)
  // parseShared('face', key): LEGACY_FACE_KEYS[key]가 있으면 그 키로 처리(결과 key도 새 키), phrase `나는 ${별명}이래. 너 관상도 봐줄까?`
  // GuansangResultView.tsx (타입 GuansangResult와 이름이 겹치지 않게)
  export default function GuansangResultView(props: { result: GuansangResult; captureRef: Ref<HTMLElement> }): JSX.Element
  ```
  화면 순서: ResultCard(eyebrow 'AI 관상', title 별명, summary oneLiner, chips [shape.easy, zone.easy, balanced? BALANCED_CHIP], reasons 자리 5개 `{label: `${LABEL} · ${easy}(${part})`, text: line (+ grow)}`) → 작은 글씨 `${traditional} · ${SCHOOL_NOTE}` → "왜 이 상인가요" evidenceText (+ FOREHEAD_NOTE) → ResultActions → 조심할 점(`no-screenshot`) → 잘 맞는 상 → DISCLAIMER → CoupangBanner(기존 slot) → NextTests. TestStart `needsGender` 기본값(묻는다), `useRememberedGender` + `useGenderGuess`. GA: `result_view{test_name:'face', result_id:type}`, `photo_fail` 이유 그대로.
- [ ] **Step 1: 실패하는 테스트** `result.test.tsx`: renderToStaticMarkup으로 별명·칩 2개·자리 5줄·DISCLAIMER 포함, 조심할 점 블록에 `no-screenshot`, foreheadUncertain이면 FOREHEAD_NOTE, balanced면 칩 3개. `shareLinks.test.ts`: 15키 전부 parseShared OK, `wealth`→name '곳간이 든든한 상'·key 'earth-mid', 모르는 키 null. `pageGuides.test.ts`: face2 첫 섹션 items 15, title 집합 = 15 별명.
- [ ] **Step 2: 실패 확인** → FAIL.
- [ ] **Step 3: 구현** 순서: analyzePhotoDetailed → shareLinks → GuansangResultView → page.tsx → pageGuides(섹션 heading '관상 결과 유형 15가지', body는 oneLiner) → layout description → sitemap.
- [ ] **Step 4: 통과 확인** `npm test` 전체 PASS, `npm run build` 성공.
- [ ] **Step 5: 화면 확인** `npx next dev -p 3311` + Playwright 390×844: `/face2` 시작 화면(성별 칸 보임), `public/dev-faces/person1.jpg` 업로드 → 결과 전체 스크린샷 저장. 종료.
- [ ] **Step 6: Commit** `feat(face2): 관상 2판 결과 화면·공유 키 15개·유형 카드`

### Task 7: 결과 공개 모션

**Files:**
- Create: `src/components/face/RevealMotion.tsx`, `src/lib/face/revealTimeline.ts`
- Modify: `src/app/face2/page.tsx`(결과 준비 뒤 RevealMotion → 끝나면 GuansangResultView)
- Test: `tests/guansang/reveal.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  // revealTimeline.ts (순수)
  export const REVEAL_STEPS = ['dots','zones','palaces','card'] as const; export type RevealStep = ...
  export function revealPlan(opts: { reducedMotion: boolean; hasLandmarks: boolean }): RevealStep[] // reducedMotion 또는 !hasLandmarks → ['card']
  export const STEP_MS: Record<RevealStep, number> // dots 800, zones 1200, palaces 2000(5×400), card 600
  // RevealMotion.tsx
  export default function RevealMotion(props: { imageUrl: string; landmarks: Landmark[] | null; zones: {up:number;mid:number;down:number}; dominant: ZoneKey; palaces: PalaceResult[]; onDone: () => void }): JSX.Element
  ```
  canvas 1장에 사진 + 점(1.5px, text-accent 색) + 삼정 경계선 2개, 오른쪽 막대 3개(DOM), 자리 라벨 5개(DOM, 위치는 랜드마크 중심: money=1, work=10과 눈썹 중앙의 중간, love=263, people=105·334 중간, base=152). 우상단 "건너뛰기" 버튼 → 즉시 onDone. `matchMedia('(prefers-reduced-motion: reduce)')`.
- [ ] **Step 1: 실패하는 테스트** `revealPlan` 분기 3개; RevealMotion이 "건너뛰기" 버튼을 렌더하고 클릭 시 onDone 호출(jsdom, canvas는 모의); landmarks null이면 바로 onDone.
- [ ] **Step 2: 실패 확인** → FAIL.
- [ ] **Step 3: 구현** (`requestAnimationFrame` 타임라인, 사진은 메모리 data URL 그대로, 저장소 금지).
- [ ] **Step 4: 통과 확인** `npm test` PASS. 화면: dev 서버에서 사진 업로드 → 모션 중 3장 스크린샷(점·선·카드). 하단 탭바와 겹치지 않는지 확인.
- [ ] **Step 5: Commit** `feat(face2): 결과 공개 모션(기준점·삼정·자리·카드)`

### Task 8: 옛 코드 정리·문서·배포

**Files:**
- Delete: `src/lib/faceAnalyzer.ts`, `src/lib/faceDetection.ts`, `src/lib/face/faceApiMetrics.ts`, `src/lib/face/faceApiThresholds.json`, `src/lib/faceReadingDB.ts`, `tests/face/faceApiMetrics.test.ts`, `scripts/measure-faceapi-thresholds.mjs`, `public/models/face_landmark_68_model*`, `public/models/ssd_mobilenetv1_model*`
- Modify: `src/app/dev/face-lab/FaceLab.tsx:47`(face-api 호출 제거), `tests/animal/matcher.test.ts`(faceAnalyzer 참조 제거), `CLAUDE.md`(얼굴인식 줄·페이지 표·"자주 수정하는 파일"의 관상 줄·프로젝트 구조), `e2e/*.spec.ts` 중 관상 결과 문구를 기대하는 곳
- [ ] **Step 1: 참조 확인** `grep -rn "faceAnalyzer\|faceDetection\|faceReadingDB\|faceApiMetrics" src tests e2e scripts` → 위 목록 외 없음.
- [ ] **Step 2: 삭제·수정** 후 `npx tsc --noEmit`, `npm test` PASS.
- [ ] **Step 3: E2E** `npm run test:e2e` 전체 PASS(관상 흐름·공유·이모지·결과 링크). 실패하면 기대값이 옛 6유형인 곳만 고친다.
- [ ] **Step 4: 문서** CLAUDE.md에 "관상 2판" 절(파이프라인·15키·보정 재실행 `npx tsx --tsconfig tsconfig.json scripts/calibrate-guansang.ts`·실측 스크립트·금지어 테스트 위치).
- [ ] **Step 5: Commit** `chore(face2): face-api 68점 관상 코드·모델 제거, 문서 갱신` → 컨트롤러가 push·배포 확인·`node scripts/indexnow.mjs /face2`.
