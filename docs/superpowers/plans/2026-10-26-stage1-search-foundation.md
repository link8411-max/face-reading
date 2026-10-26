# 1단계: 검색 기반 다지기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 테스트 페이지마다 서버 HTML에 의미 있는 본문(소개, 보는 법, 특징, FAQ, 다른 테스트 링크)을 넣어 구글·네이버 색인과 애드센스 재심사가 가능한 상태로 만든다.

**Architecture:**
- 클라이언트 페이지(`"use client"`)는 건드리지 않는다. 각 라우트의 서버 `layout.tsx`가 `{children}` 아래에 서버 컴포넌트 `<PageGuide route=... />`를 렌더한다.
- 본문 텍스트는 데이터 파일 하나(`src/content/pageGuides.ts`)에 둔다. 페이지별 FAQPage JSON-LD도 여기서 생성한다.
- 사이트맵은 고정 날짜를 쓴다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4, vitest(신규)

**Spec:** `docs/superpowers/specs/2026-10-26-unse-ai-revival-design.md` (1단계)

## Global Constraints

- 사용자 사진은 서버로 보내지 않는다. 이번 단계는 클라이언트 테스트 로직을 수정하지 않는다.
- 결과 직전 광고나 결과 버튼처럼 보이는 요소를 넣지 않는다.
- 디자인은 CLAUDE.md의 민화 팔레트를 쓴다: 배경 `#F5E6D3/#E8D4C4`, 빨강 `#C41E3A`, 텍스트 `#5C4033`, 카드 `bg-white/60 rounded-3xl border-2 border-[#C41E3A]/30`.
- 날짜별·조합별 얇은 페이지를 만들지 않는다. 이번 단계는 새 URL을 추가하지 않는다.
- `/face`는 2단계에서 통합한다. 이번엔 sitemap과 페이지를 그대로 둔다.
- 배포(main push = Vercel 프로덕션)는 사용자 승인 후에만 한다. 작업은 `stage1-seo` 브랜치에서 한다.

## Review Focus

1. **결과 이미지 저장:** 가이드 섹션이 `useScreenshot` 캡처 범위에 섞이면 안 된다. 섹션 루트에 `no-screenshot` 클래스를 단다(루트 footer와 같은 방식). Task 2 테스트가 이를 확인한다.
2. **FAQ 구조화 데이터 중복:** 루트 layout의 사이트 공통 FAQPage가 모든 페이지에 붙어 있다. 페이지별 FAQPage와 겹치면 구조화 데이터 오류가 난다. 루트 FAQ는 홈으로 옮긴다(Task 4).
3. **JSON-LD 이스케이프:** FAQ 답변에 따옴표나 `</script>` 같은 문자가 들어가도 깨지지 않아야 한다. `<`를 `<`로 치환한다(Task 2 테스트).
4. **모바일 레이아웃:** 테스트 위젯 아래에 붙는 섹션이 가로 스크롤을 만들지 않아야 한다. `max-w-lg mx-auto px-4`로 위젯 폭에 맞춘다. Task 5에서 375px로 확인한다.
5. **빌드:** 서버 layout이 클라이언트 전용 모듈(face-api 등)을 import하지 않아야 한다. `PageGuide`와 `pageGuides.ts`는 순수 데이터와 마크업만 둔다. Task 5의 `npm run build`로 확인한다.

---

### Task 1: 테스트 환경 + 사이트맵 고정 날짜

**Files:**
- Modify: `package.json` (devDependencies에 `vitest` 추가, scripts에 `"test": "vitest run"`)
- Create: `vitest.config.ts` (environment `node`, `@` → `src` alias, `esbuild: { jsx: 'automatic' }`, `test.globals: true`). layout과 컴포넌트 TSX를 테스트에서 import하려면 필요하다.
- Modify: `src/app/sitemap.ts`
- Test: `tests/sitemap.test.ts`

**Interfaces:**
- Produces: `src/app/sitemap.ts`가 `export const SITEMAP_ROUTES: readonly string[]`과 `export const LAST_MODIFIED: Record<string, string>`(ISO 날짜)를 내보낸다. Task 2 테스트가 `SITEMAP_ROUTES`를 쓴다.

- [ ] **Step 1: 의존성 설치** — `npm ci && npm i -D vitest`
- [ ] **Step 2: 실패하는 테스트 작성** (`tests/sitemap.test.ts`)

```ts
import sitemap, { SITEMAP_ROUTES, LAST_MODIFIED } from '@/app/sitemap'

test('모든 라우트가 고정된 lastModified를 가진다', () => {
  for (const r of SITEMAP_ROUTES) expect(LAST_MODIFIED[r]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
})
test('sitemap 항목은 new Date()가 아니라 LAST_MODIFIED 값을 쓴다', () => {
  const entries = sitemap()
  expect(entries).toHaveLength(SITEMAP_ROUTES.length)
  for (const e of entries) {
    const route = e.url.replace('https://unse-ai.com', '')
    expect(e.lastModified).toBe(LAST_MODIFIED[route])
  }
})
```

- [ ] **Step 3: 실패 확인** — `npm test` → FAIL (`SITEMAP_ROUTES` 없음)
- [ ] **Step 4: 구현**
  - 기존 7개 라우트를 `SITEMAP_ROUTES`로 뺀다.
  - `LAST_MODIFIED` 초기값은 모두 `'2026-01-15'`(git 마지막 변경일)이다.
  - 이번 단계에서 본문이 바뀌는 라우트(`''`, `/face2`, `/animal`, `/samguk`, `/fortune`, `/fortune/daily`)는 Task 5에서 배포일로 갱신한다.
  - 기존 `as any`를 `MetadataRoute.Sitemap[number]['changeFrequency']`로 바꾼다.
- [ ] **Step 5: 통과 확인** — `npm test` → PASS
- [ ] **Step 6: 커밋** — `git checkout -b stage1-seo && git add -A package.json package-lock.json vitest.config.ts src/app/sitemap.ts tests && git commit -m "chore: vitest 도입, 사이트맵 고정 lastModified"`

### Task 2: PageGuide 데이터 모델 + 서버 컴포넌트 (/face2에 먼저 적용)

**Files:**
- Create: `src/content/pageGuides.ts`
- Create: `src/components/PageGuide.tsx`
- Modify: `src/app/face2/layout.tsx` (`{children}` 아래에 `<PageGuide route="/face2" />`)
- Test: `tests/pageGuides.test.ts`, `tests/PageGuide.test.tsx`

**Interfaces:**
- Produces:

```ts
// src/content/pageGuides.ts
export type GuideRoute = '/face2' | '/animal' | '/samguk' | '/fortune' | '/fortune/daily'
export interface PageGuideData {
  heading: string              // 섹션 H2
  intro: string[]              // 문단들
  howTo: string[]              // 이용 순서
  highlights: { title: string; body: string }[]  // 결과에서 보는 것
  faqs: { q: string; a: string }[]
  related: GuideRoute[]        // 다른 테스트 추천
}
export const TEST_LINKS: Record<GuideRoute, { label: string; emoji: string }>
export const pageGuides: Partial<Record<GuideRoute, PageGuideData>>  // Task 3에서 전부 채움
export function faqJsonLd(route: GuideRoute): string  // 이스케이프된 JSON 문자열
// src/components/PageGuide.tsx (서버 컴포넌트, "use client" 없음)
export default function PageGuide({ route }: { route: GuideRoute }): JSX.Element | null
```

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/pageGuides.test.ts`:
- `test('/face2 가이드 분량')`: `intro.join('').length >= 400`, `howTo.length >= 3`, `highlights.length >= 3`, `faqs.length >= 4`
- `test('related는 자기 자신이 아니고 sitemap에 있는 라우트')`: `related`의 각 원소가 `route`와 다르고 `SITEMAP_ROUTES`에 포함
- `test('faqJsonLd는 < 를 이스케이프한다')`: 테스트 안에서 `pageGuides['/face2']!.faqs.push({ q: 'x', a: '</script><b>' })` 후 `faqJsonLd('/face2')`에 `'</script>'`가 없고, `JSON.parse` 결과의 `@type`이 `'FAQPage'`이며, mainEntity 길이가 faqs 길이와 같다(테스트 후 pop으로 원복).

`tests/PageGuide.test.tsx` (`react-dom/server`의 `renderToStaticMarkup`):
- `test('본문과 FAQ JSON-LD를 렌더한다')`: 결과 HTML에 `heading`, 첫 FAQ 질문, `application/ld+json`, `no-screenshot`이 들어 있다. `TEST_LINKS[related[0]].label`이 링크 텍스트로, `href="${related[0]}"`이 들어 있다.
- `test('데이터 없는 라우트는 null')`: 가이드가 없는 라우트를 넘기면 빈 문자열을 렌더한다.

- [ ] **Step 2: 실패 확인** — `npm test` → FAIL (모듈 없음)
- [ ] **Step 3: 구현**
  - `faqJsonLd`는 `JSON.stringify(...).replace(/</g, '\\u003c')`를 쓴다.
  - `PageGuide` 섹션 구성: `<section className="no-screenshot ...">` 안에 `max-w-lg mx-auto px-4 py-10`, 카드 스타일은 Global Constraints를 따른다. H2(heading) → intro 문단 → "이렇게 해요" 순서 목록 → highlights 카드 → FAQ(`<details>`) → "다른 테스트도 해보세요" `next/link` 목록 → FAQ JSON-LD script.
  - **`/face2` 본문 작성:** Claude가 직접 쓴다. 주력 키워드("AI 관상 테스트", "무료 관상")를 자연스럽게 넣고, 사진이 브라우저 안에서만 처리된다는 점을 명시한다. 초년·중년·말년운과 이목구비별 의미는 `faceReadingDB.ts`의 실제 항목과 맞춘다.
- [ ] **Step 4: 통과 확인** — `npm test` → PASS
- [ ] **Step 5: 커밋** — `git commit -am "feat: 서버 렌더 PageGuide 섹션, /face2 본문"` (새 파일은 `git add` 먼저)

### Task 3: 나머지 4개 페이지 본문 + 연결

**Files:**
- Modify: `src/content/pageGuides.ts` (`/animal`, `/samguk`, `/fortune`, `/fortune/daily` 추가. 타입을 `Record<GuideRoute, PageGuideData>`로 좁힌다)
- Modify: `src/app/animal/layout.tsx`, `src/app/samguk/layout.tsx`, `src/app/fortune/layout.tsx`, `src/app/fortune/daily/layout.tsx`
- Test: `tests/pageGuides.test.ts`

**Interfaces:**
- Consumes: Task 2의 `PageGuideData`, `PageGuide`

- [ ] **Step 1: 테스트 확장** — Task 2의 분량·related 테스트를 `test.each(Object.keys(pageGuides))`로 바꾸고, `test('모든 GuideRoute에 가이드가 있다')`를 추가한다(5개).
- [ ] **Step 2: 실패 확인** — `npm test` → FAIL (4개 누락)
- [ ] **Step 3: 본문 작성** (Claude가 직접, 실제 데이터 기준)
  - `/animal`: `animalTypeDB`의 8종 이름과 특징을 highlights에 반영한다. 하드코딩 대신 import해서 목록을 만든다.
  - `/samguk`: 위·촉·오 세력, 등장 인물 수(`samgukCharacters.length`), 코에이 능력치·현대 능력치 설명을 넣는다. Gemini 언급은 하지 않는다(2단계에서 제거).
  - `/fortune`: 사주팔자, 천간·지지, 오행 개념을 설명한다. 태어난 시간을 모를 때 어떻게 되는지도 넣는다. 연도 표기는 "신년운세"로 일반화하고 특정 연도를 넣지 않는다(3단계에서 2027 갱신).
  - `/fortune/daily`: 띠 12개 목록, 행운 시간·색 설명, 매일 갱신된다는 점을 넣는다.
- [ ] **Step 4: 4개 layout에 `<PageGuide route=... />` 연결**
- [ ] **Step 5: 통과 확인** — `npm test` → PASS
- [ ] **Step 6: 커밋** — `git commit -am "feat: 동물상·삼국지·운세 페이지 본문"`

### Task 4: 키워드 이전, FAQ 구조화 데이터 정리, 잔재 정리

**Files:**
- Modify: `src/app/face2/layout.tsx` (title, description, OG)
- Modify: `src/app/face2/page.tsx:140` (H1)
- Modify: `src/app/layout.tsx:70-142` (루트 `faqJsonLd` 제거)
- Modify: `src/app/page.tsx` (루트에서 옮긴 FAQ JSON-LD를 홈에 렌더)
- Modify: `src/app/samguk/page.tsx:689`
- Modify: `CLAUDE.md` (sitemap 위치와 PageGuide 사용법)
- Test: `tests/metadata.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성** (`tests/metadata.test.ts`)
  - `import { metadata } from '@/app/face2/layout'` → `String(metadata.title)`이 `'AI 관상 테스트'`와 `'무료'`를 포함한다.
  - `fs.readFileSync('src/app/layout.tsx')`에 `"FAQPage"`가 없다.
  - `src/app/samguk/page.tsx`에 `"Samguk Persona"`가 없다.
- [ ] **Step 2: 실패 확인** — `npm test` → FAIL
- [ ] **Step 3: 구현**
  - face2 title: `"무료 AI 관상 테스트 | 얼굴로 보는 관상 분석 - 운명을 읽다"`, H1: `"AI 관상 테스트"`. description과 OG title도 같은 키워드로 맞춘다.
  - 루트 FAQ JSON-LD는 홈(`src/app/page.tsx`)에서만 렌더한다.
  - 삼국지 footer 문구: `© 2026 운명을 읽다 · 삼국지 닮은꼴`
  - CLAUDE.md:
    - 프로젝트 구조와 "자주 수정하는 파일"의 `public/sitemap.xml`을 `src/app/sitemap.ts`(LAST_MODIFIED 갱신)로 고친다.
    - "SEO 구성"에 PageGuide 사용법을 한 단락 추가한다: 새 페이지는 `pageGuides.ts`에 본문을 넣고 layout에 `<PageGuide>`를 단다.
- [ ] **Step 4: 통과 확인** — `npm test` → PASS
- [ ] **Step 5: 커밋** — `git commit -am "fix: 관상 키워드 이전, FAQ 구조화 데이터 홈 전용, 삼국지 footer"`

### Task 5: 빌드·렌더 검증 + 배포 준비

**Files:**
- Modify: `src/app/sitemap.ts` (`LAST_MODIFIED`의 변경 라우트 6개를 배포일로)

- [ ] **Step 1: 린트·빌드** — `npm run lint && npm run build` → 에러 없음
- [ ] **Step 2: 서버 HTML 확인**
  - `npm start`를 백그라운드로 띄운다.
  - 5개 라우트에 대해 `curl -s localhost:3000<route> | grep -c 'FAQPage'` → 1
  - heading 텍스트가 HTML에 있는지 확인한다.
  - 홈만 루트 FAQ가 1개 있는지 확인한다.
- [ ] **Step 3: 모바일 확인** — 브라우저 375px 폭에서 `/face2`와 `/samguk`을 열어 가로 스크롤이 없고 섹션이 위젯 아래에 있는지 본다. 동물상에서 결과 이미지 저장을 한 번 해서 가이드가 캡처에 안 들어가는지 확인한다(샘플 사진 필요).
- [ ] **Step 4: lastModified 갱신 후 커밋** — `git commit -am "chore: 사이트맵 lastModified 갱신"`
- [ ] **Step 5: 사용자에게 보고하고 배포 승인 요청** — 승인 시 `main`에 병합하고 push한다(Vercel 자동 배포).
- [ ] **Step 6: 배포 후 (Claude가 Aside로, 사용자 승인 하에)**
  - 서치 콘솔 사이트맵 재제출, 5개 URL 색인 요청
  - 네이버 서치어드바이저 사이트맵 제출
  - 애드센스 재활성화 신청. 전화 인증 코드와 약관 동의는 사용자가 한다.
  - Vercel 도메인 www 리디렉션을 308로 변경
