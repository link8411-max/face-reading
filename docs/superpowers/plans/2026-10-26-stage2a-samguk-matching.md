# 2a단계: 삼국지 닮은꼴 매칭 엔진 + Gemini 제거 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 삼국지 닮은꼴을 Gemini 없이 브라우저 안에서 MediaPipe 랜드마크 → 연속 특징 → 장수 프로필 가중 거리 매칭으로 바꾸고, 시뮬레이션으로 쏠림을 보정한다. Gemini를 쓰는 `/face`는 `/face2`로 통합하고 Gemini 의존성을 없앤다.

**Architecture:** 순수 함수 계층(특징 추출 → z 점수화 → 매칭 → 설명 생성)과 브라우저 계층(MediaPipe 로더, 페이지)을 분리한다. 순수 계층은 vitest로 TDD하고, 쏠림 보정은 시드 고정 시뮬레이션으로 장수별 편향값(bias)을 구해 JSON으로 커밋한 뒤 분포 테스트로 고정한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, vitest, `@mediapipe/tasks-vision`(FaceLandmarker, 478점), tsx(스크립트 실행)

**Spec:** `docs/superpowers/specs/2026-10-26-unse-ai-revival-design.md` (2단계)

## Global Constraints

- 사진은 서버로 보내지 않는다. 모든 얼굴 분석은 브라우저 안에서 한다.
- 매칭은 결정적이다. 같은 특징 입력이면 같은 결과가 나온다(난수 금지, 시뮬레이션은 시드 고정).
- 특징은 연속 비율이고, 얼굴 크기·위치·기울기(roll)에 불변이다. 랜드마크로 실제 측정 가능한 것만 쓴다(귀, 눈썹 굵기 금지).
- 성별은 사용자가 선택한다("남"/"여"). 후보는 `samgukCharacters`의 같은 gender만 쓴다.
- 쏠림 기준(스펙): 모든 장수가 나온다. 어떤 장수도 성별 내 균등 비율의 3배를 넘지 않는다.
- 결과 화면이 쓰는 `AnalysisResult` 형태(`name, matchReason, similarity, faceAnalysis{눈,코,입,얼굴형,인상}, character`)를 유지한다.
- 장수 프로필은 인물 서사(`samgukDB`의 `appearance`, CLAUDE.md 시그니처 디테일)와 맞아야 한다. 예: 관우 봉황의 눈(길고 올라간 눈), 장비 고리눈(둥글고 큰 눈)과 제비 턱, 사마의 길고 가는 눈과 여윈 얼굴.
- 작업 브랜치는 `stage2a-samguk`이고, 배포는 사용자 승인 후에만 한다.

## Review Focus

1. **정면이 아닌 사진** (고개를 많이 돌림): 엉뚱한 장수 대신 "정면 사진을 올려 주세요" 안내를 보여야 한다. Task 1의 `checkFrontal` 테스트가 다룬다.
2. **얼굴이 없거나 여러 명인 사진**: 오류 안내를 보여야 하고 멈추면 안 된다. 여러 명이면 가장 큰 얼굴 1개를 쓴다. Task 6에서 `numFaces: 1`로 설정하고, 얼굴 0개일 때의 분기를 수동 검증한다.
3. **극단값 특징** (아주 긴 얼굴 등): z 점수를 ±3으로 자르고, similarity가 범위(62~97)를 벗어나지 않아야 한다. Task 2와 Task 4의 테스트가 다룬다.
4. **MediaPipe 로드 실패** (네트워크, 구형 브라우저): 무한 로딩 대신 오류 안내를 보여야 한다. Task 6에서 처리하고 수동 확인한다.
5. **이전 `/face` 링크와 북마크**: 308로 `/face2`에 도착해야 한다. Task 7의 리디렉션 테스트가 다룬다.

---

### Task 1: 랜드마크 → 연속 특징 추출

**Files:**
- Create: `src/lib/face/landmarkFeatures.ts`
- Test: `tests/face/landmarkFeatures.test.ts`

**Interfaces:**
- Produces:

```ts
export interface Landmark { x: number; y: number; z?: number }
export const FEATURE_KEYS = [
  'eyeAspect','eyeTilt','eyeWidth','eyeSpacing','browGap','browTilt',
  'noseLength','noseWidth','mouthWidth','lipFullness','mouthCornerLift',
  'faceAspect','jawWidth','chinLength','midfaceRatio',
] as const
export type FeatureKey = typeof FEATURE_KEYS[number]
export type FeatureVector = Record<FeatureKey, number>
export function extractFeatures(lm: Landmark[]): FeatureVector
export function checkFrontal(lm: Landmark[]): { ok: boolean; yawRatio: number }
```

- 사용하는 MediaPipe 인덱스: 눈꼬리 바깥 33/263, 안쪽 133/362, 눈 위아래 159·145 / 386·374, 눈썹 105/334(중앙)·70/300(바깥)·107/336(안쪽), 미간 168, 코끝 1, 콧볼 129/358, 입꼬리 61/291, 윗입술 0·13, 아랫입술 14·17, 이마 위 10, 턱끝 152, 얼굴 가장자리 234/454, 턱각 172/397.
- 정규화 규칙: 두 눈 중심을 잇는 선이 수평이 되도록 회전(roll)한다. 길이는 눈 중심 간 거리(IOD) 또는 얼굴 높이(10→152)로 나눈다. 각도는 도 단위이고, 눈꼬리·눈썹·입꼬리는 바깥/위쪽이 양수다.
- `checkFrontal`: 코끝(1)의 좌우 얼굴 가장자리(234, 454) 사이 위치 비율로 yaw를 근사한다. `yawRatio`는 0.5에서 벗어난 정도이고, `ok`는 `yawRatio <= 0.12`일 때 참이다.

- [ ] **Step 1: 실패하는 테스트 작성** — 테스트 헬퍼 `makeFace(opts)`가 478개 랜드마크 배열을 만든다(위 인덱스만 의미 있는 좌표, 나머지 0).
  - `test('크기·이동·회전(roll)에 불변')`: 같은 얼굴을 ×2.5 확대, (+120,+40) 이동, 15° 회전해도 모든 특징 차이가 1e-6 이하
  - `test('눈꼬리를 올리면 eyeTilt 증가')`, `test('입꼬리를 올리면 mouthCornerLift 증가')`, `test('얼굴을 세로로 늘리면 faceAspect 증가')`
  - `test('checkFrontal: 정면 ok, 코끝이 한쪽으로 30% 치우치면 ok=false')`
  - `test('FEATURE_KEYS 15개 모두 유한한 숫자')`
- [ ] **Step 2: 실패 확인** — `npm test` → FAIL (모듈 없음)
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인** — `npm test` → PASS
- [ ] **Step 5: 커밋** — `git checkout -b stage2a-samguk` (첫 커밋 전), `feat: 랜드마크 연속 특징 추출`

### Task 2: 모집단 통계와 z 점수

**Files:**
- Create: `src/lib/face/featureStats.ts`
- Test: `tests/face/featureStats.test.ts`

**Interfaces:**
- Consumes: Task 1 `FeatureVector`, `FEATURE_KEYS`
- Produces:

```ts
export const FEATURE_STATS: Record<FeatureKey, { mean: number; std: number }>
export type ZVector = Record<FeatureKey, number>
export function toZ(f: FeatureVector): ZVector   // (x-mean)/std, [-3, 3]로 자름
```

- `FEATURE_STATS` 초기값은 Task 1의 `makeFace` 기본 얼굴 특징값을 mean으로, 경험적 std(각 특징 범위의 약 1/6)로 둔다. 근사값이라는 점을 주석으로 남긴다.
- 실사진으로 확인되면 `FEATURE_STATS`를 갱신한다. 실사진 확인은 Task 8이다.

- [ ] **Step 1: 테스트**
  - `test('기본 얼굴의 z는 모두 0 근처(|z|<0.05)')`
  - `test('극단값은 ±3으로 잘린다')`
  - `test('std는 모두 양수')`
- [ ] **Step 2: 실패 확인** → **Step 3: 구현** → **Step 4: 통과 확인** → **Step 5: 커밋** `feat: 특징 모집단 통계와 z 점수`

### Task 3: 장수 52명 얼굴 프로필

**Files:**
- Create: `src/lib/samguk/profiles.ts`
- Test: `tests/samguk/profiles.test.ts`

**Interfaces:**
- Consumes: `FeatureKey`, `samgukCharacters`
- Produces:

```ts
export interface CharacterProfile {
  z: Partial<Record<FeatureKey, number>>   // 이 인물의 대표 특징 (z 단위, -2.5~2.5)
  weight: Partial<Record<FeatureKey, number>>  // 0.5~2, 생략 시 1
}
export const characterProfiles: Record<string /* character id */, CharacterProfile>
```

- **Claude가 52명 전원을 직접 작성한다.**
  - `appearance`와 인물 서사를 근거로, 인물마다 대표 특징 4~7개를 z값으로 정한다.
  - 대표 특징에는 weight 1.5~2를 준다.
  - 각 인물 위에 근거를 한 줄 주석으로 단다. 예: `// 관우: 봉황의 눈(길고 올라감), 긴 얼굴, 위엄`
  - 프로필에 없는 특징은 0(평균)으로 간주하고 weight 0.5로 약하게 비교한다.

- [ ] **Step 1: 테스트**
  - `test('모든 samgukCharacters id에 프로필이 있다')`
  - `test('각 프로필은 특징 4~7개, z는 [-2.5, 2.5], weight는 [0.5, 2]')`
  - `test('성별마다 프로필이 서로 너무 같지 않다')`: 같은 성별 두 인물의 z 벡터(누락 0) 유클리드 거리가 모두 0.8 이상
  - `test('FEATURE_KEYS마다 양수·음수 값을 쓰는 인물이 각각 1명 이상')`
- [ ] **Step 2: 실패 확인** → **Step 3: 작성** → **Step 4: 통과 확인** → **Step 5: 커밋** `feat: 삼국지 인물 얼굴 프로필 52명`

### Task 4: 매칭 + 설명 생성

**Files:**
- Create: `src/lib/samguk/matcher.ts`
- Test: `tests/samguk/matcher.test.ts`

**Interfaces:**
- Consumes: `ZVector`, `characterProfiles`, `samgukCharacters`
- Produces:

```ts
export type Gender = '남' | '여'
export interface MatchResult {
  name: string
  matchReason: string
  similarity: number                    // 정수 62~97
  faceAnalysis: { 눈: string; 코: string; 입: string; 얼굴형: string; 인상: string }
  character: SamgukCharacter
}
export function distance(z: ZVector, p: CharacterProfile): number   // 가중 유클리드, 누락 특징은 target 0·weight 0.5
export function matchCharacter(z: ZVector, gender: Gender, bias?: Record<string, number>): MatchResult
```

- `matchCharacter`: 해당 성별 후보 중 `distance + (bias[id] ?? 0)`이 최소인 인물을 고른다. 동점이면 id 사전순.
- `similarity = clamp(round(97 - 9 * distance), 62, 97)`
- `matchReason`: 그 인물의 weight 상위 특징 중 사용자 z와 부호가 같은 2~3개를 골라 문장으로 만든다. 특징별 한국어 템플릿을 쓴다(예: eyeTilt+ "눈꼬리가 위로 올라간", faceAspect+ "얼굴이 긴"). 형식: `"{특징1}·{특징2} 인상이 {이름}과 닮았어요. {appearance 첫 구절}을 떠올리게 해요."`
- `faceAnalysis`: 사용자 z를 그룹별로 짧은 문장으로 만든다(눈: eyeAspect/eyeTilt/eyeWidth, 코: noseLength/noseWidth, 입: mouthWidth/lipFullness/mouthCornerLift, 얼굴형: faceAspect/jawWidth/chinLength, 인상: 가장 두드러진 |z| 특징 요약). 한자 없이 쓴다.

- [ ] **Step 1: 테스트**
  - `test('인물 프로필과 같은 z를 넣으면 그 인물이 나온다')`: 52명 각각 자기 자신이 1위(bias 없이)
  - `test('같은 입력이면 같은 결과(결정성)')`
  - `test('성별 필터: 여 선택 시 여성 인물만')`
  - `test('similarity는 정수이고 62~97')`: 극단 z(±3 전부) 포함
  - `test('matchReason에 인물 이름이 들어가고 비어 있지 않다')`, `test('faceAnalysis 다섯 항목 모두 비어 있지 않다')`
  - `test('bias가 크면 해당 인물이 덜 뽑힌다')`
- [ ] **Step 2~4** → **Step 5: 커밋** `feat: 삼국지 가중 거리 매칭과 설명 생성`

### Task 5: 분포 시뮬레이션 + 보정

**Files:**
- Create: `src/lib/samguk/simulate.ts` (시드 난수 `mulberry32`, `sampleZ(rng)`, `simulate(n, gender, bias, seed) → Record<id, count>`)
- Create: `scripts/calibrate-samguk.ts` (`npx tsx scripts/calibrate-samguk.ts` → `src/lib/samguk/calibration.json` 기록)
- Create: `src/lib/samguk/calibration.json` (`{ "seed": 20261026, "n": 10000, "bias": { id: number } }`)
- Modify: `package.json` devDependencies `tsx`
- Test: `tests/samguk/distribution.test.ts`

**Interfaces:**
- Consumes: `matchCharacter`, `characterProfiles`
- Produces: `calibration.json`의 `bias`. Task 6이 import해서 `matchCharacter(z, gender, calibration.bias)`로 쓴다.

- `sampleZ`: 특징마다 독립 N(0,1)을 뽑고 ±3으로 자른다(Box-Muller). 특징 간 상관은 무시하며, 근사라는 점을 주석으로 남긴다.
- 보정 알고리즘: 성별별로 반복한다(최대 200회).

```
target = n / 후보수
rate_c = count_c / target
bias_c += 0.15 * ln(max(rate_c, 0.05))   // 많이 뽑히면 bias↑(멀어짐), 안 뽑히면 bias↓
종료: 모든 c에서 count_c ≥ 1 이고 rate_c ≤ 3, 그리고 max rate ≤ 2 이면 조기 종료
```

- [ ] **Step 1: 테스트** (`distribution.test.ts`, n=10000, seed 고정, `calibration.json`의 bias 사용)
  - `test.each(['남','여'])('%s: 모든 인물이 1회 이상 나온다')`
  - `test.each(['남','여'])('%s: 어떤 인물도 균등의 3배를 넘지 않는다')`
  - `test('bias 없이 돌리면 쏠림이 있음을 기록')`: 보정 전 max rate를 `console.info`로 남긴다(실패 조건 아님, 보정 효과 근거)
- [ ] **Step 2: 실패 확인** (calibration.json 없음)
- [ ] **Step 3: simulate.ts와 보정 스크립트 구현, 스크립트 실행**
  - 보정 후에도 기준을 못 맞추면 bias로 덮지 말고 Task 3 프로필을 고친다(겹치는 인물을 떼어 놓기). 고친 내용은 ledger에 남긴다.
- [ ] **Step 4: 통과 확인** — `npm test`
- [ ] **Step 5: 커밋** `feat: 삼국지 분포 시뮬레이션과 쏠림 보정`

### Task 6: 브라우저 파이프라인 + 삼국지 페이지 연결

**Files:**
- Create: `src/lib/face/mediapipe.ts`
- Create: `public/models/face_landmarker.task` (공식 배포 URL `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`에서 받는다. 약 3.6MB)
- Modify: `src/app/samguk/page.tsx` (fetch `/api/samguk` 대신 브라우저 파이프라인, 성별 선택 UI)
- Delete: `src/app/api/samguk/route.ts`
- Modify: `src/content/pageGuides.ts` (`/samguk` 문구: 브라우저 안에서만 분석, Gemini 언급 제거)
- Modify: `tests/pageGuides.test.ts` (`/samguk` Gemini 테스트를 "브라우저 안에서만" 테스트로 교체)
- Modify: `package.json` (`@mediapipe/tasks-vision` 추가)

**Interfaces:**
- Consumes: `extractFeatures`, `checkFrontal`, `toZ`, `matchCharacter`, `calibration.json`
- Produces:

```ts
// src/lib/face/mediapipe.ts ("use client" 전용 모듈, 서버 import 금지)
export async function detectLandmarks(img: HTMLImageElement): Promise<Landmark[] | null>  // 얼굴 없으면 null
```

- FaceLandmarker 설정: `runningMode: 'IMAGE'`, `numFaces: 1`. 모델은 `/models/face_landmarker.task`, wasm은 `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@<설치 버전>/wasm`이다. 버전은 package.json 값과 일치시키고, 모듈 싱글턴으로 한 번만 로드한다.
- 페이지 흐름: 성별 선택(필수, 기본값 없음) → 사진 업로드 → `detectLandmarks` → null이면 "얼굴을 찾지 못했어요" → `checkFrontal` 실패면 "정면 사진을 올려 주세요" → `matchCharacter` → 기존 결과 UI. 로드 실패 시 "분석 도구를 불러오지 못했어요. 새로고침해 주세요."

- [ ] **Step 1: 테스트 수정** — `tests/pageGuides.test.ts`의 Gemini 테스트를 `test('/samguk 가이드는 브라우저 안에서만 분석함을 밝히고 Gemini를 언급하지 않는다')`로 바꾼다. 추가로 `test('삼국지 페이지는 /api/samguk를 호출하지 않는다')`(소스 문자열 검사), `test('api/samguk 라우트가 없다')`(fs.existsSync)를 둔다.
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: 구현** (모델 파일 받기 포함)
- [ ] **Step 4: 통과 확인** — `npm test && npm run build`
- [ ] **Step 5: 수동 확인** — dev 서버에서 성별 선택 UI, 사진 없이 시작 불가, 오류 안내 문구를 확인한다. 실제 얼굴 매칭은 Task 8에서 한다.
- [ ] **Step 6: 커밋** `feat: 삼국지 닮은꼴을 브라우저 MediaPipe 매칭으로 전환`

### Task 7: /face 통합과 Gemini 완전 제거

**Files:**
- Modify: `next.config.ts` (`redirects()`: `/face` → `/face2`, `permanent: true`(308))
- Delete: `src/app/face/` 전체, `src/app/api/analyze/route.ts`
- Modify: `src/app/sitemap.ts` (`/face` 제거), `src/app/face2/page.tsx`·`src/app/fortune/FortuneClient.tsx:475` (`/face` 링크를 `/face2`로)
- Modify: `src/app/page.tsx` (홈 FAQ JSON-LD와 화면 문구에서 Gemini, "AI 관상 하루 1회" 제거)
- Modify: `src/app/privacy/page.tsx` (모든 얼굴 분석은 브라우저 안에서만 한다는 문구로 정리)
- Modify: `package.json` (`@google/generative-ai` 제거), `CLAUDE.md` (기술 스택, 구조, 페이지 표, AI 관상 흐름, API Keys 섹션 갱신)
- Test: `tests/stage2a-cleanup.test.ts`

- [ ] **Step 1: 테스트**
  - `test('/face는 /face2로 308')`: `(await nextConfig.redirects())`에 `{source:'/face', destination:'/face2', permanent:true}`가 있다
  - `test('sitemap에 /face가 없다')`
  - `test('src 어디에도 generative-ai, GEMINI, href="/face" 가 없다')` (재귀 파일 스캔)
  - `test('package.json에 @google/generative-ai가 없다')`
- [ ] **Step 2: 실패 확인** → **Step 3: 구현** → **Step 4: `npm test && npm run build`**
- [ ] **Step 5: 커밋** `refactor: /face를 /face2로 통합하고 Gemini 제거`

### Task 8: 실사진 확인 + 통계 보정 (사용자 사진 필요)

- **멈춤 지점:** 실사진 확인에는 얼굴 사진이 필요하다.
  - 사용자에게 테스트용 사진 3~5장을 요청한다(본인·지인 동의 사진이나 AI 생성 인물 사진).
  - 외부 사진을 내려받으려면 출처와 파일을 밝히고 승인을 받는다.
  - 사진은 레포에 커밋하지 않는다. `.superpowers/`처럼 git 무시 폴더에 둔다.
- dev 서버의 삼국지 페이지에서 각 사진으로 결과를 확인한다(브라우저 도구).
  - 같은 사진을 두 번 넣으면 같은 결과인지 본다.
  - 정면이 아닌 사진이면 안내가 뜨는지 본다.
  - 콘솔에 추출된 특징값을 찍는 개발용 로그는 `process.env.NODE_ENV !== 'production'`일 때만 남긴다.
- 실사진 특징값이 `FEATURE_STATS` mean에서 크게 벗어나면(|z|>2가 흔하면) mean/std를 조정한다. 그 뒤 Task 5 보정 스크립트를 다시 돌리고 `npm test`가 통과하는지 확인한다.
- 커밋: `fix: 실사진 기준 특징 통계 보정`
