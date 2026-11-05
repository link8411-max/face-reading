# 오늘의 운세 엔진(년생 × 일진) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 요일표 운세를 버리고, 내 년주(60갑자)와 오늘 일진(60갑자)의 합·충·형·오행 관계로 매일·년생마다 다른 오늘의 운세를 계산해 /fortune/daily와 홈 띠 고르기에 보여 준다.

**Architecture:** 순수 계산 모듈 `src/lib/dailyEngine/`(관계 판정 + 점수·별점·영역·행운)과 문장 데이터 `src/content/dailyFortuneText.ts`를 분리한다. 화면은 엔진 결과(`DailyFortune`)만 받아 그린다. 날짜는 `kstDate()`로 한국 시간 고정, 일진은 기존 `일주계산`(korean-lunar-calendar)을 쓴다.

**Tech Stack:** Next.js 16 App Router, TypeScript, vitest(`tests/**/*.test.ts`), 기존 `src/lib/saju.ts`·`src/lib/kst.ts`.

**Spec:** `docs/superpowers/specs/2026-11-05-daily-fortune-engine-design.md` (규칙·점수·문장 전부 여기서 온다. 문장은 부록 A·B를 그대로 옮긴다.)

## Global Constraints

- 결정적: 같은 입력·같은 날 → 같은 출력. `Math.random` 금지.
- "오늘"은 항상 `kstDate(now)`(`src/lib/kst.ts`) 기준. 브라우저에서 날짜에 따라 달라지는 내용은 마운트 뒤(`useEffect`)에 계산한다(정적 HTML·CDN 캐시 방지, 기존 ZodiacPicker·MBTI 방식).
- 별점 매핑(두 모드 공통): 점수 ≤ -2.0 → 1, ≤ -1.0 → 2, < 1.0 → 3, < 2.5 → 4, 그 이상 5.
- 설계 분포(테스트 기대값, ±0.5%p): 년생 60×60 = 1점 6.4%, 2점 18.2%, 3점 38.7%, 4점 28.5%, 5점 8.2%. 띠 12×60 = 1점 5.3%, 2점 22.5%, 3점 41.4%, 4점 23.3%, 5점 7.5%.
- 문장은 스펙 부록 A(한마디 42+6)·B(영역 12+7)를 글자 그대로 옮긴다. 새 문장을 짓지 않는다. 말투 "~해요".
- 생년은 화면에만. GA `track()`에 넣지 않고, 공유 링크·카카오 카드 URL·저장 이미지에 연도를 넣지 않는다(년간년지 "경오년"은 허용).
- 제목 요소(h1~h3)·버튼·링크에 이모지 금지(E2E `chrome-emoji.spec.ts`). `●◐○`·`★☆`는 이모지가 아니라 허용.
- 색 이름 고정: 목 초록, 화 빨강, 토 노랑, 금 흰색, 수 파랑. 방향: 목 동, 화 남, 토 중앙(가까운 곳), 금 서, 수 북.
- 디자인 토큰·구성요소는 CLAUDE.md "디자인 시스템" 그대로(카드 `rounded-[22px]`, 포인트 색 `text-accent` 하나).

## Review Focus

1. 입춘 전 생일(`isEarlyYear`)이 년주를 전년으로 바꾸는지 — Task 3 전수 테스트에 `1990, isEarlyYear=true` → 기사년 뱀띠 확인.
2. 자정 전후(KST 00:00 = UTC 15:00) 경계에서 일진이 바뀌는지 — Task 3 날짜 테스트.
3. 띠 모드 입력에 잘못된 띠 문자열이 오면 throw가 아니라 명확한 Error 메시지 — Task 3 테스트.
4. `?year=` 쿼리로 열린 뒤 공유했을 때 URL·카카오 카드에 연도가 없는지 — Task 4 소스 테스트.
5. 홈 ZodiacPicker가 서버 HTML에 날짜 의존 내용을 넣지 않는지(hydration) — Task 5 소스 테스트.

---

### Task 1: 관계 판정 모듈

**Files:**
- Create: `src/lib/dailyEngine/relations.ts`
- Test: `tests/dailyEngine/relations.test.ts`

**Interfaces:**
- Consumes: `천간오행`, `지지오행`, `천간`, `지지`(`@/lib/saju`).
- Produces:
  ```ts
  export type 천간관계 = '합' | '충' | '인성' | '비겁' | '재성' | '식상' | '관살'
  export type 지지관계 = '육합' | '삼합' | '무관' | '복음' | '형' | '충'
  export type 오행관계 = '인성' | '비겁' | '재성' | '식상' | '관살'
  export const 천간관계목록: readonly 천간관계[]   // 위 순서
  export const 지지관계목록: readonly 지지관계[]   // 위 순서
  export const 육십갑자: readonly { 천간: string; 지지: string }[]   // 갑자…계해 60개
  export function 오행관계판정(내오행: string, 상대오행: string): { 관계: 오행관계; 점수: number }
  export function 천간관계판정(내천간: string, 일간: string): { 관계: 천간관계; 점수: number }
  export function 지지관계판정(내지지: string, 일지: string): { 관계: 지지관계; 점수: number }
  ```
  점수는 스펙 표 그대로: 합 +1.5, 충 -1.5, 인성 +1.0, 비겁 +0.5, 재성 +0.5, 식상 0, 관살 -1.0 / 육합 +2.0, 삼합 +1.5, 무관 0, 복음 -0.5, 형 -1.5, 충 -2.0. 오행관계판정은 "상대오행이 내오행을 생함 → 인성, 같음 → 비겁, 내가 상대를 극함 → 재성, 내가 상대를 생함 → 식상, 상대가 나를 극함 → 관살".

- [ ] **Step 1: Write the failing test** `tests/dailyEngine/relations.test.ts`

```ts
import { 천간관계판정, 지지관계판정, 오행관계판정, 육십갑자 } from '@/lib/dailyEngine/relations'

test('천간: 합·충·오행 다섯 가지', () => {
  expect(천간관계판정('갑', '기')).toEqual({ 관계: '합', 점수: 1.5 })
  expect(천간관계판정('기', '갑').관계).toBe('합')
  expect(천간관계판정('갑', '경')).toEqual({ 관계: '충', 점수: -1.5 })
  expect(천간관계판정('갑', '임')).toEqual({ 관계: '인성', 점수: 1.0 })   // 수생목
  expect(천간관계판정('갑', '을')).toEqual({ 관계: '비겁', 점수: 0.5 })
  expect(천간관계판정('갑', '무')).toEqual({ 관계: '재성', 점수: 0.5 })   // 목극토
  expect(천간관계판정('갑', '병')).toEqual({ 관계: '식상', 점수: 0 })     // 목생화
  expect(천간관계판정('갑', '신')).toEqual({ 관계: '관살', 점수: -1.0 })  // 금극목
})

test('지지: 6종과 겹침 우선순위', () => {
  expect(지지관계판정('오', '미')).toEqual({ 관계: '육합', 점수: 2.0 })
  expect(지지관계판정('오', '인')).toEqual({ 관계: '삼합', 점수: 1.5 })
  expect(지지관계판정('오', '진')).toEqual({ 관계: '무관', 점수: 0 })
  expect(지지관계판정('자', '자')).toEqual({ 관계: '복음', 점수: -0.5 })
  expect(지지관계판정('자', '묘')).toEqual({ 관계: '형', 점수: -1.5 })
  expect(지지관계판정('자', '오')).toEqual({ 관계: '충', 점수: -2.0 })
  // 겹침: 사신은 형이면서 육합 → 형, 인신·축미는 충이면서 형 → 충, 진진은 자형이면서 복음 → 형
  expect(지지관계판정('사', '신').관계).toBe('형')
  expect(지지관계판정('인', '신').관계).toBe('충')
  expect(지지관계판정('축', '미').관계).toBe('충')
  expect(지지관계판정('진', '진').관계).toBe('형')
  expect(지지관계판정('오', '오').관계).toBe('형')
})

test('지지 관계 개수(12×12): 육합 10, 삼합 24, 형 14, 충 12, 복음 8, 무관 76', () => {
  const 지 = [...'자축인묘진사오미신유술해']
  const n: Record<string, number> = {}
  for (const a of 지) for (const b of 지) { const r = 지지관계판정(a, b).관계; n[r] = (n[r] ?? 0) + 1 }
  expect(n).toEqual({ 육합: 10, 삼합: 24, 형: 14, 충: 12, 복음: 8, 무관: 76 })
})

test('오행 관계·60갑자', () => {
  expect(오행관계판정('목', '수').관계).toBe('인성')
  expect(오행관계판정('목', '금').관계).toBe('관살')
  expect(육십갑자).toHaveLength(60)
  expect(육십갑자[0]).toEqual({ 천간: '갑', 지지: '자' })
  expect(육십갑자[59]).toEqual({ 천간: '계', 지지: '해' })
  expect(new Set(육십갑자.map((g) => g.천간 + g.지지)).size).toBe(60)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/dailyEngine/relations.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: Implement `src/lib/dailyEngine/relations.ts`**

표는 파일 안에 둔다(스펙: saju.ts에 넣지 않는다). 천간 합 `갑기·을경·병신·정임·무계`, 천간 충 `갑경·을신·병임·정계`, 육합 `자축·인해·묘술·진유·사신·오미`, 삼합 `인오술·신자진·사유축·해묘미`, 지지 충 `자오·축미·인신·묘유·진술·사해`, 형 `인사신 서로·축술미 서로·자묘`, 자형 `진·오·유·해`. 우선순위 충 > 형 > 육합 > 삼합 > 복음 > 무관. 생 순환 목→화→토→금→수→목, 극 순환 목→토→수→화→금→목.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/dailyEngine/relations.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/dailyEngine/relations.ts tests/dailyEngine/relations.test.ts
git commit -m "feat(daily): 천간·지지·오행 관계 판정 모듈"
```

---

### Task 2: 문장 데이터

**Files:**
- Create: `src/content/dailyFortuneText.ts`
- Test: `tests/dailyEngine/text.test.ts`

**Interfaces:**
- Consumes: Task 1의 타입 `천간관계`, `지지관계`, `오행관계`, `천간관계목록`, `지지관계목록`.
- Produces:
  ```ts
  export type 영역 = '재물' | '연애' | '일' | '건강'
  export type 상태 = '좋음' | '보통' | '조심'
  export const 영역목록: readonly 영역[]            // 재물, 연애, 일, 건강
  export const 한마디: Record<천간관계, Record<지지관계, string>>      // 부록 A 42문장
  export const 띠한마디: Record<지지관계, string>                       // 부록 A 띠 모드 6문장
  export const 영역문장: Record<영역, Record<상태, string>>             // 부록 B 기본 12
  export const 영역보강: Record<천간관계, { 영역: 영역; 방향: 1 | -1; 문장: string }>  // 부록 B 보강 7 (재성→재물 +1, 식상→연애 +1, 인성→건강 +1, 관살→일 -1, 비겁→재물 -1, 합→연애 +1, 충→일 -1)
  export const 천간근거: Record<천간관계, (a: { 내천간: string; 내오행: string; 일간: string; 일간오행: string }) => string>
  export const 지지근거: Record<지지관계, (a: { 내지지: string; 띠: string; 일지: string }) => string>
  export const 오행근거: Record<오행관계, (a: { 띠: string; 띠오행: string; 일간: string; 일간오행: string }) => string>
  ```
  근거 문장 틀은 스펙 "근거 한 줄" 절 그대로. 괄호 안 이름은 실제 글자로 채운다(예: 천간 합 → `서로 합해요(갑기합)`, 지지 충 → `정면으로 맞서요(자오충)`, 삼합 → `같은 편이에요(인오술 삼합)`, 생 → `오늘이 당신을 도와요(수생목)`, 극 → `당신이 오늘을 거둬요(목극토)`). 형의 괄호는 해당 형 이름(`인사신 형`, `축술미 형`, `자묘 형`, 자형은 `진진 자형`).

- [ ] **Step 1: Write the failing test** `tests/dailyEngine/text.test.ts`

```ts
import { 한마디, 띠한마디, 영역문장, 영역보강, 천간근거, 지지근거, 오행근거, 영역목록 } from '@/content/dailyFortuneText'
import { 천간관계목록, 지지관계목록 } from '@/lib/dailyEngine/relations'

const ok = (s: string) => typeof s === 'string' && s.trim().length >= 8 && !s.includes('undefined')

test('한마디 42 + 띠 6, 전부 채워져 있고 해요체', () => {
  for (const a of 천간관계목록) for (const b of 지지관계목록) {
    expect(ok(한마디[a][b]), `${a}×${b}`).toBe(true)
    expect(한마디[a][b]).toMatch(/요\.$|요!$/)
  }
  for (const b of 지지관계목록) expect(ok(띠한마디[b])).toBe(true)
  expect(한마디.합.충).toBe('뜻은 맞는데 일은 꼬이는 날이에요. 약속은 오후로 미뤄요.')
  expect(한마디.인성.육합).toBe('누군가 손 내미는 날이에요. 받으세요.')
})

test('영역 문장 12 + 보강 7, 보강의 영역·방향은 스펙과 같다', () => {
  for (const 영 of 영역목록) for (const 상 of ['좋음', '보통', '조심'] as const) expect(ok(영역문장[영][상])).toBe(true)
  expect(영역보강.재성).toMatchObject({ 영역: '재물', 방향: 1 })
  expect(영역보강.식상).toMatchObject({ 영역: '연애', 방향: 1 })
  expect(영역보강.인성).toMatchObject({ 영역: '건강', 방향: 1 })
  expect(영역보강.관살).toMatchObject({ 영역: '일', 방향: -1 })
  expect(영역보강.비겁).toMatchObject({ 영역: '재물', 방향: -1 })
  expect(영역보강.합).toMatchObject({ 영역: '연애', 방향: 1 })
  expect(영역보강.충).toMatchObject({ 영역: '일', 방향: -1 })
})

test('근거 문장 틀에 글자가 들어간다', () => {
  expect(천간근거.합({ 내천간: '갑', 내오행: '목', 일간: '기', 일간오행: '토' })).toBe('당신의 갑(목)과 오늘의 기(토)은 서로 합해요(갑기합)')
  expect(지지근거.충({ 내지지: '자', 띠: '쥐', 일지: '오' })).toBe('자(쥐)와 오는 정면으로 맞서요(자오충)')
  expect(오행근거.인성({ 띠: '말', 띠오행: '화', 일간: '갑', 일간오행: '목' })).toContain('목생화')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/dailyEngine/text.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: Implement `src/content/dailyFortuneText.ts`** — 스펙 부록 A·B의 문장을 글자 그대로 옮긴다. 근거 함수의 조사(과/와, 은/는)는 받침 규칙을 쓰지 말고 틀 그대로 "과", "은", "와"를 쓴다(테스트 기대값과 같게).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/dailyEngine/text.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/content/dailyFortuneText.ts tests/dailyEngine/text.test.ts
git commit -m "feat(daily): 오늘의 운세 문장 데이터(한마디 48·영역 19·근거 틀)"
```

---

### Task 3: 엔진

**Files:**
- Create: `src/lib/dailyEngine/index.ts`
- Test: `tests/dailyEngine/engine.test.ts`

**Interfaces:**
- Consumes: Task 1 전부, Task 2 전부, `년주계산`·`일주계산`·`지지오행`·`천간오행`·`띠동물`·`띠이모지`·`지지`(`@/lib/saju`), `kstDate`(`@/lib/kst`).
- Produces:
  ```ts
  export type DailyInput = { kind: '년생'; year: number; isEarlyYear: boolean } | { kind: '띠'; 띠: string }
  export interface DailyFortune {
    날짜: string                               // 'YYYY-MM-DD' (KST)
    일진: { 천간: string; 지지: string; 표기: string }   // 표기 '계미일'
    나: { 띠: string; 띠이모지: string; 지지: string; 천간: string | null; 년주표기: string | null }  // 년주표기 '경오'
    별점: 1 | 2 | 3 | 4 | 5
    점수: number
    관계: { 천간: 천간관계 | null; 지지: 지지관계; 오행: 오행관계 | null }
    한마디: string
    근거: string                               // 천간(또는 오행) 문장 + ', ' + 지지 문장 + '.'
    영역: Record<영역, { 상태: 상태; 문장: string }>
    행운: { 색: string; 색오행: string; 시간: string; 방향: string }   // 시간 예 '오후 1~3시(미시)'
  }
  export function dailyFortune(input: DailyInput, now?: Date): DailyFortune
  export const 별점계산: (점수: number) => 1 | 2 | 3 | 4 | 5
  ```
  규칙(스펙 "계산 규칙"):
  - 년생: `년주계산(year, isEarlyYear ? 1 : 3, 1)`. 띠: `띠동물` 인덱스로 지지를 찾고 천간은 null. 모르는 띠면 `throw new Error('모르는 띠: …')`.
  - 오늘: `kstDate(now)` → `일주계산(y, m, d)`.
  - 점수 = (년생: 천간 점수 / 띠: 오행관계판정(지지오행[내지지], 천간오행[일간]) 점수) + 지지 점수.
  - 영역: 지지 관계로 기본 상태(육합·삼합 → 좋음, 무관·복음 → 보통, 형·충 → 조심), 그 뒤 `영역보강[천간관계 또는 오행관계]`로 해당 영역을 한 단계 올리거나 내린다(좋음↔보통↔조심 사이에서만). 보강이 적용된 영역의 문장은 `기본 + ' ' + 보강문장`(이미 끝 단계라 상태가 안 바뀌어도 문장은 붙인다).
  - 행운색: 별점 ≥ 4 → 일지 오행. 아니면 내 지지 오행 A와 일지 오행 B가 극 관계(어느 방향이든) → 통관 오행(A생X, X생B 또는 B생X, X생A가 되는 X); 같은 오행 → 그 오행을 생하는 오행; 생 관계 → 일지 오행.
  - 행운시간: 내 지지의 육합 상대(자↔축, 인↔해, 묘↔술, 진↔유, 사↔신, 오↔미)의 시간대. 표기 `자 '밤 11시~새벽 1시(자시)'`, 축 `'새벽 1~3시(축시)'`, 인 `'새벽 3~5시(인시)'`, 묘 `'아침 5~7시(묘시)'`, 진 `'아침 7~9시(진시)'`, 사 `'오전 9~11시(사시)'`, 오 `'낮 11시~1시(오시)'`, 미 `'오후 1~3시(미시)'`, 신 `'오후 3~5시(신시)'`, 유 `'저녁 5~7시(유시)'`, 술 `'저녁 7~9시(술시)'`, 해 `'밤 9~11시(해시)'`.
  - 근거: 년생 `천간근거 + ', ' + 지지근거 + '.'`, 띠 `오행근거 + ', ' + 지지근거 + '.'`.
  - 한마디: 년생 `한마디[천간관계][지지관계]`, 띠 `띠한마디[지지관계]`.

- [ ] **Step 1: Write the failing test** `tests/dailyEngine/engine.test.ts`

```ts
import { dailyFortune, 별점계산 } from '@/lib/dailyEngine'
import { 육십갑자 } from '@/lib/dailyEngine/relations'
import { 띠동물 } from '@/lib/saju'

const D = new Date('2026-11-05T03:00:00+09:00')   // 계미일

test('년생 모드: 1990 경오년 말띠, 오늘 계미일', () => {
  const f = dailyFortune({ kind: '년생', year: 1990, isEarlyYear: false }, D)
  expect(f.날짜).toBe('2026-11-05')
  expect(f.일진).toEqual({ 천간: '계', 지지: '미', 표기: '계미일' })
  expect(f.나).toMatchObject({ 띠: '말', 지지: '오', 천간: '경', 년주표기: '경오' })
  expect(f.관계).toEqual({ 천간: '식상', 지지: '육합', 오행: null })   // 금생수(내가 베풂), 오미합
  expect(f.점수).toBe(2.0); expect(f.별점).toBe(4)
  expect(f.한마디).toBe('말이 예쁘게 나가는 날이에요. 고백도, 제안도 오늘이에요.')
  expect(f.근거).toBe('당신의 경(금)과 오늘의 계(수)은 당신이 오늘에게 베풀어요(금생수), 오(말)와 미는 서로 끌어당겨요(오미합).')
  expect(f.영역.연애).toEqual({ 상태: '좋음', 문장: '마음이 잘 통해요. 먼저 말 거는 쪽이 이겨요.' })
  expect(f.영역.건강).toEqual({ 상태: '좋음', 문장: '몸이 가벼워요.' })
  expect(f.행운).toEqual({ 색: '노랑', 색오행: '토', 시간: '오후 1~3시(미시)', 방향: '중앙(가까운 곳)' })
})

test('입춘 전 체크는 전년 년주', () => {
  expect(dailyFortune({ kind: '년생', year: 1990, isEarlyYear: true }, D).나).toMatchObject({ 띠: '뱀', 년주표기: '기사' })
})

test('띠 모드: 천간 없이 오행 관계로 보완', () => {
  const f = dailyFortune({ kind: '띠', 띠: '말' }, D)
  expect(f.나.천간).toBeNull()
  expect(f.관계).toEqual({ 천간: null, 지지: '육합', 오행: '관살' })   // 계(수)가 화를 극함
  expect(f.점수).toBe(1.0); expect(f.별점).toBe(4)
  expect(f.근거).toContain('수극화')
  expect(() => dailyFortune({ kind: '띠', 띠: '고래' }, D)).toThrow('모르는 띠')
})

test('결정성과 KST 자정 경계', () => {
  const a = dailyFortune({ kind: '년생', year: 1985, isEarlyYear: false }, D)
  expect(dailyFortune({ kind: '년생', year: 1985, isEarlyYear: false }, D)).toEqual(a)
  const before = dailyFortune({ kind: '띠', 띠: '쥐' }, new Date('2026-11-05T14:59:00Z'))
  const after = dailyFortune({ kind: '띠', 띠: '쥐' }, new Date('2026-11-05T15:00:00Z'))
  expect(before.날짜).toBe('2026-11-05'); expect(after.날짜).toBe('2026-11-06')
  expect(after.일진.표기).toBe('갑신일')
})

test('별점 경계', () => {
  expect([-2.5, -2.0, -1.5, -1.0, -0.5, 0.9, 1.0, 2.4, 2.5].map(별점계산)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5])
})

const pct = (n: Record<number, number>, total: number) => Object.fromEntries(Object.entries(n).map(([k, v]) => [k, Math.round((v / total) * 1000) / 10]))
const close = (a: Record<string, number>, b: Record<string, number>) => { for (const k of Object.keys(b)) expect(Math.abs((a[k] ?? 0) - b[k]), k).toBeLessThanOrEqual(0.5) }

test('년생 60×60 전수: 빈 문구 없음, 분포는 설계값', () => {
  // 일진 60개를 얻기 위해 2026-11-05부터 60일을 돈다
  const n: Record<number, number> = {}
  for (let i = 0; i < 60; i++) {
    const day = new Date(D.getTime() + i * 86400000)
    for (const g of 육십갑자) {
      // 년주가 g인 양력 연도: 1984년이 갑자. 1984 + index
      const year = 1984 + 육십갑자.indexOf(g)
      const f = dailyFortune({ kind: '년생', year, isEarlyYear: false }, day)
      expect(f.나.년주표기).toBe(g.천간 + g.지지)
      const text = JSON.stringify(f)
      expect(text).not.toContain('undefined'); expect(text).not.toContain('""')
      n[f.별점] = (n[f.별점] ?? 0) + 1
    }
  }
  close(pct(n, 3600), { 1: 6.4, 2: 18.2, 3: 38.7, 4: 28.5, 5: 8.2 })
})

test('띠 12×60 전수: 빈 문구 없음, 분포는 설계값', () => {
  const n: Record<number, number> = {}
  for (let i = 0; i < 60; i++) {
    const day = new Date(D.getTime() + i * 86400000)
    for (const 띠 of 띠동물) {
      const f = dailyFortune({ kind: '띠', 띠 }, day)
      expect(JSON.stringify(f)).not.toContain('undefined')
      n[f.별점] = (n[f.별점] ?? 0) + 1
    }
  }
  close(pct(n, 720), { 1: 5.3, 2: 22.5, 3: 41.4, 4: 23.3, 5: 7.5 })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/dailyEngine/engine.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: Implement `src/lib/dailyEngine/index.ts`** — 위 Interfaces의 규칙대로. 분포가 설계값과 다르면 규칙을 바꾸지 말고 구현 오류를 찾는다(스펙).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/dailyEngine`
Expected: PASS (3 파일)

- [ ] **Step 5: Commit**

```bash
git add src/lib/dailyEngine/index.ts tests/dailyEngine/engine.test.ts
git commit -m "feat(daily): 년주×일진 오늘의 운세 엔진(별점·영역·행운·근거)"
```

---

### Task 4: /fortune/daily 화면

**Files:**
- Create: `src/components/fortune/DailyFortuneCard.tsx` (캡처 영역 카드, 서버·클라이언트 공용 순수 표시 컴포넌트)
- Modify: `src/app/fortune/daily/page.tsx` (입력·결과 상태·공유, 결과 카드는 위 컴포넌트)
- Modify: `src/app/sitemap.ts:48` — `'/fortune/daily': '2026-11-05'`
- Test: `tests/dailyEngine/dailyPage.test.tsx`

**Interfaces:**
- Consumes: `dailyFortune`, `DailyFortune`(Task 3), `영역목록`(Task 2), 기존 `useScreenshot`, `track`, `validateBirthYear`, `SeasonPicks`, `CoupangBanner`, `TestHeader`, `Icon`, `useBackOrHome`.
- Produces: `export default function DailyFortuneCard({ fortune, birthYearLabel }: { fortune: DailyFortune; birthYearLabel: string | null })` — 스펙 "화면" 순서대로: 날짜 줄(`{M}월 {D}일 {요일} · {일진.표기}`), 제목(h2 텍스트: 년생 `{year}년생 {년주표기}년 {띠}띠`, 띠 모드 `{띠}띠`; 이모지는 제목 안에 넣지 않음), 별점(★☆) + 한마디, 근거(`text-xs text-muted`), 영역 2×2(이름 · `●`좋음/`◐`보통/`○`조심 · 문장), 행운 3칸(색·시간·방향), 띠 특성 블록(기존 `fortuneDB.띠[띠]` 그대로), 워터마크 줄 유지. `birthYearLabel`은 `no-screenshot` 줄에만.

- [ ] **Step 1: Write the failing test** `tests/dailyEngine/dailyPage.test.tsx`

```ts
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import DailyFortuneCard from '@/components/fortune/DailyFortuneCard'
import { dailyFortune } from '@/lib/dailyEngine'
import { LAST_MODIFIED } from '@/app/sitemap'

const D = new Date('2026-11-05T03:00:00+09:00')

test('결과 카드: 년주·일진·별점·근거·영역·행운이 있고 제목에 이모지가 없다', () => {
  const html = renderToStaticMarkup(<DailyFortuneCard fortune={dailyFortune({ kind: '년생', year: 1990, isEarlyYear: false }, D)} birthYearLabel="1990년생" />)
  expect(html).toContain('11월 5일 목요일 · 계미일')
  expect(html).toContain('1990년생 경오년 말띠')
  expect(html).toContain('★★★★☆')
  expect(html).toContain('말이 예쁘게 나가는 날이에요')
  expect(html).toContain('오미합')
  for (const s of ['재물', '연애', '일', '건강', '오후 1~3시(미시)', '노랑']) expect(html).toContain(s)
  const headings = html.match(/<h[1-3][^>]*>.*?<\/h[1-3]>/g) ?? []
  expect(headings.some((h) => /\p{Extended_Pictographic}/u.test(h))).toBe(false)
  expect(html).toMatch(/no-screenshot[^>]*>[^<]*1990년생/)
})

test('페이지: 요일표를 쓰지 않고, 쿼리 연도는 지우며, 공유 URL·GA에 연도가 없다', () => {
  const src = readFileSync('src/app/fortune/daily/page.tsx', 'utf8')
  expect(src).not.toContain('일간운세')
  expect(src).toContain('@/lib/dailyEngine')
  expect(src).toContain('history.replaceState')
  expect(src).toMatch(/useEffect\([^]*kstDate\(new Date\(\)\)/)
  const share = src.slice(src.indexOf('getShareOptions'), src.indexOf('const yearCheck'))
  expect(share).not.toMatch(/birthYear|year=/)
  expect(src).not.toMatch(/track\([^)]*birthYear/)
  expect(LAST_MODIFIED['/fortune/daily']).toBe('2026-11-05')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/dailyEngine/dailyPage.test.tsx`
Expected: FAIL (컴포넌트 없음)

- [ ] **Step 3: Implement `DailyFortuneCard.tsx`, then rewrite `page.tsx`**

page.tsx에서 정하는 것:
- 상태: `birthYear`, `isEarlyYear`, `result: DailyFortune | null`, `today: Date | null`(마운트 뒤 `useEffect`에서 `kstDate(new Date())`로 날짜 문자열과 함께 세팅, `onDayMaybeChanged`로 갱신).
- 마운트 효과에서 `new URLSearchParams(location.search)`의 `year`(4자리)·`early`(`'1'`)를 읽어 입력을 채우고 `validateBirthYear`가 ok면 바로 `handleSubmit()`. 읽은 직후 `history.replaceState(null, '', location.pathname)`.
- `handleSubmit`: `dailyFortune({ kind: '년생', year, isEarlyYear }, new Date())` → `setResult`. GA는 기존처럼 `fortune_submit`, `result_view(result_id: 띠)`만.
- 공유: `fileName` `오늘의운세_{띠}띠`, `shareTitle` `오늘의 {띠}띠 운세`, `shareText` `{날짜줄} - {한마디}`, 카카오 `text` `오늘 {년주표기}년 {띠}띠 운세는 '{한마디}'래. 너도 봐줄까?`, `url`은 기존 그대로(연도 없음), `imageUrl` subtitle `{날짜줄} {띠}띠 운세`.
- 입력 섹션·버튼 배치·SeasonPicks·CoupangBanner 위치는 지금 그대로 둔다.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/dailyEngine && npx tsc --noEmit -p .`
Expected: PASS, 타입 오류 없음

- [ ] **Step 5: Commit**

```bash
git add src/components/fortune/DailyFortuneCard.tsx src/app/fortune/daily/page.tsx src/app/sitemap.ts tests/dailyEngine/dailyPage.test.tsx
git commit -m "feat(daily): 년생×일진 결과 카드와 쿼리 자동 입력"
```

---

### Task 5: 홈 띠 고르기 + 요일표 삭제

**Files:**
- Modify: `src/components/home/ZodiacPicker.tsx`
- Modify: `src/lib/fortuneDB.ts:2,266` (import와 `일간운세,` 제거)
- Delete: `src/lib/dailyFortune.ts`
- Modify: `tests/stage4a-review.test.ts:22-26` (`'@/lib/dailyFortune'` → `'@/lib/dailyEngine'`)
- Test: `tests/dailyEngine/zodiacPicker.test.ts`

**Interfaces:**
- Consumes: `dailyFortune`(Task 3).
- Produces: 없음(화면만). ZodiacPicker는 마운트 뒤 `useEffect`에서 `now`를 세팅하고, 띠를 고르면 `dailyFortune({ kind: '띠', 띠 }, now)`로 별점·한마디·근거·행운 시간·색을 보여 준다. "오늘의 운세 자세히" 링크는 `/fortune/daily` 그대로, 그 아래 `<p class="text-xs text-muted">년생을 넣으면 더 정확해요</p>`.

- [ ] **Step 1: Write the failing test** `tests/dailyEngine/zodiacPicker.test.ts`

```ts
import { readFileSync, existsSync } from 'node:fs'

test('홈 띠 고르기는 엔진의 띠 모드를 쓰고 날짜는 마운트 뒤 계산', () => {
  const src = readFileSync('src/components/home/ZodiacPicker.tsx', 'utf8')
  expect(src).toContain('@/lib/dailyEngine')
  expect(src).not.toContain('일간운세')
  expect(src).toMatch(/useEffect\(/)
  expect(src).toContain("kind: '띠'")
  expect(src).toContain('년생을 넣으면 더 정확해요')
})

test('요일표 운세는 사라졌다', () => {
  expect(existsSync('src/lib/dailyFortune.ts')).toBe(false)
  expect(readFileSync('src/lib/fortuneDB.ts', 'utf8')).not.toContain('일간운세')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/dailyEngine/zodiacPicker.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement** — ZodiacPicker 수정, `dailyFortune.ts` 삭제(`git rm`), `fortuneDB.ts` 참조 제거, `tests/stage4a-review.test.ts`의 기대 문자열 교체.

- [ ] **Step 4: Run the whole suite and type check**

Run: `npm test && npx tsc --noEmit -p .`
Expected: 전부 PASS

- [ ] **Step 5: Commit**

```bash
git add -A src/components/home/ZodiacPicker.tsx src/lib/fortuneDB.ts src/lib/dailyFortune.ts tests/stage4a-review.test.ts tests/dailyEngine/zodiacPicker.test.ts
git commit -m "feat(home): 띠 고르기를 일진 엔진으로, 요일표 운세 삭제"
```

---

### Task 6: 빌드·E2E 확인

**Files:** 없음(검증만)

- [ ] **Step 1: 프로덕션 빌드**

Run: `npm run build`
Expected: 성공, `/fortune/daily` 정적(○)

- [ ] **Step 2: E2E 중 이모지·운세 관련만**

Run: `npx playwright test e2e/chrome-emoji.spec.ts -g "fortune/daily|^/: "`
Expected: PASS (playwright chromium이 없으면 `npx playwright install chromium` 먼저)

- [ ] **Step 3: 수동 확인 항목을 보고에 적는다** — `/fortune/daily?year=1990` 으로 열면 자동 결과가 뜨고 주소창에서 `year`가 사라지는지, 홈 띠 칩이 동작하는지. 배포는 컨트롤러(사용자 승인 뒤)가 한다.
