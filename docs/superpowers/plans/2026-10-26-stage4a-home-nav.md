# 4a단계: 메인 화면 + 메뉴(하단 탭) + 공통 디자인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 시안 A(시즌 히어로형)에 C의 "띠 바로 고르기"를 더한 새 메인, 모든 페이지 공통 하단 탭바, 묶음별 허브 페이지, 민화 현대화 디자인 토큰을 만든다.

**Architecture:**
- 메뉴·묶음은 데이터 한 곳(`src/content/navigation.ts`)에서 정의하고, 홈·허브·하단 탭·푸터가 모두 이것을 쓴다.
- 시즌 히어로는 설정 파일(`src/content/season.ts`)로 교체할 수 있게 한다.
- 홈은 서버 페이지로 바꾸고, 상호작용 부분(띠 고르기, 묶음 탭)만 클라이언트 컴포넌트로 둔다.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, next/font(Noto Sans KR, Noto Serif KR), vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-10-26-unse-ai-revival-design.md` (4단계 확정안)
**시안:** scratchpad `home-mockups.html` 시안 A + C

## Global Constraints

- 색 토큰: 한지 `#FBF6EE`/`#F3E9DA`, 먹 `#3E2C23`, 보조 `#8A7466`, 주홍 `#C8323E`, 금 `#C9A227`, 남 `#24426B`, 선 `#E6D7C3`
- 메뉴: 홈 `/`, 얼굴 `/face-tests`, 운세 `/unse`, MBTI `/mbti`. `/face`는 기존 리디렉션(→`/face2`)이 있어 쓰지 않는다.
- `/mbti`는 MBTI 5단계 전까지 "곧 열려요" 페이지다. robots noindex를 걸고 사이트맵에서 뺀다.
- 참여자 수·인기 순위 같은 숫자는 넣지 않는다(실제 집계 전).
- 하단 탭바는 결과 이미지 캡처에 들어가지 않아야 한다(no-screenshot, 캡처 ref 밖). 화면 아래 내용이 탭바에 가리지 않게 본문 하단 여백을 둔다.
- 기존 E2E(버튼·네비게이션·입력)를 모두 통과해야 한다. 홈 구조가 바뀌는 부분은 테스트 선택자를 갱신한다.
- 배포는 사용자 승인 후에만 한다.

## Review Focus

1. **탭바가 가리는 내용**: 결과 화면의 저장·공유 버튼과 쿠팡 배너가 하단 탭바에 가리면 안 된다(Task 2 E2E: 마지막 버튼 클릭 가능).
2. **현재 탭 강조**: `/fortune/2027/sheep`, `/fortune/daily`는 "운세", `/samguk`은 "얼굴"로 강조돼야 한다(Task 2 단위 테스트).
3. **띠 바로 고르기 날짜**: 서버 렌더와 클라이언트 날짜(요일)가 다르면 hydration 오류가 난다. 요일 계산은 클라이언트에서만 한다(Task 4).
4. **글꼴 교체 후 레이아웃 깨짐**: 긴 한글 제목이 줄바꿈되며 넘치지 않아야 한다(375px 스크린샷 확인, Task 5).
5. **기존 링크 보존**: 홈에서 모든 테스트(관상·동물상·삼국지·신년운세·띠별·오늘의 운세)에 2번 탭 이내로 도달해야 한다(Task 4 E2E).

---

### Task 1: 디자인 토큰 + 한글 글꼴
**Files:** Modify `src/app/globals.css`(`@theme` 토큰), `src/app/layout.tsx`(next/font Noto Sans KR·Noto Serif KR, body 배경·글자색 토큰) · Test `tests/design.test.ts`
- [ ] 테스트: layout이 `Noto_Sans_KR`를 쓰고 Geist 변수를 쓰지 않는다. globals.css에 토큰 7개가 정의돼 있다.
- [ ] RED → 구현 → GREEN → 커밋 `feat(design): 민화 현대화 색 토큰과 한글 글꼴`

### Task 2: 메뉴 데이터 + 하단 탭바 + 헤더
**Files:**
- Create: `src/content/navigation.ts`
  - `TABS = [{ key:'home', label:'홈', href:'/', icon:'🏠' }, { key:'face', label:'얼굴', href:'/face-tests', icon:'👤' }, { key:'unse', label:'운세', href:'/unse', icon:'☯' }, { key:'mbti', label:'MBTI', href:'/mbti', icon:'🧩' }]`
  - `CATEGORIES`(묶음별 항목: 제목·설명·href·썸네일·칩)
  - `tabForPath(pathname): TabKey`
- Create: `src/components/BottomTabBar.tsx`(client, usePathname, `aria-current="page"`, no-screenshot, fixed bottom, safe-area 여백), `src/components/SiteHeader.tsx`(로고)
- Modify: `src/app/layout.tsx`(탭바 렌더, `main`에 `pb-20`, 푸터 링크를 CATEGORIES에서 생성)
- Test: `tests/navigation.test.ts`, `e2e/tabbar.spec.ts`
- [ ] 테스트(단위)
  - `tabForPath`: `/`→home, `/face2`·`/animal`·`/samguk`·`/face-tests`→face, `/fortune`·`/fortune/daily`·`/fortune/2027/sheep`·`/unse`→unse, `/mbti`→mbti, `/about`→home
  - CATEGORIES의 모든 href가 실제 라우트다(사이트맵 또는 `/mbti`)
- [ ] 테스트(E2E)
  - 모든 페이지에 탭바가 있고 현재 탭에 `aria-current="page"`가 붙는다
  - 탭 4개를 눌러 이동할 수 있다
  - 결과 화면의 마지막 버튼과 쿠팡 배너가 탭바에 가리지 않는다(요소 하단 < 탭바 상단, 스크롤 끝에서)
- [ ] RED → 구현 → GREEN → 커밋

### Task 3: 묶음 허브 페이지 `/face-tests`, `/unse`, `/mbti`
**Files:** Create `src/app/face-tests/page.tsx`, `src/app/unse/page.tsx`, `src/app/mbti/page.tsx`, `src/components/CategoryList.tsx`(서버, 썸네일 카드 목록) · Modify `src/app/sitemap.ts`(`/face-tests`, `/unse` 추가) · Test `tests/hubs.test.ts`, `e2e/hubs.spec.ts`
- 각 허브: 제목, 짧은 소개(검색용 2~3문장), 항목 카드, 메타·canonical
- `/mbti`: "곧 열려요" 소개와 다른 테스트 링크, `robots: { index: false }`
- [ ] 테스트: 허브 3개 200, 각 항목 링크 이동, `/mbti`에 noindex 메타, 사이트맵에 `/face-tests`·`/unse` 있고 `/mbti` 없음
- [ ] RED → 구현 → GREEN → 커밋

### Task 4: 새 메인 (시즌 히어로 + 띠 바로 고르기 + 묶음 탭)
**Files:**
- Create: `src/content/season.ts`(`{ chip:'2027 정미년', title:'붉은 양의 해,\n내 운세는?', sub:'생년월일로 보는 무료 사주 신년운세', cta:{label:'지금 확인하기', href:'/fortune'}, emoji:'🐑' }`)
- Create: `src/components/home/SeasonHero.tsx`(서버), `src/components/home/ZodiacPicker.tsx`(client: 12띠 그리드 → 오늘의 운세 카드 인라인 + "오늘의 운세 자세히"(`/fortune/daily`)·"2027 {띠}띠 운세"(`/fortune/2027/{slug}`) 링크, 요일은 마운트 후 계산), `src/components/home/CategoryTabs.tsx`(client: 얼굴/운세·사주/MBTI 탭, CATEGORIES 사용)
- Modify: `src/app/page.tsx`
  - 서버 컴포넌트로 바꾼다. 기존 FAQ JSON-LD와 FAQ는 유지하고 문구는 새 구조에 맞춘다.
  - 순서: 히어로 → 띠 고르기 → 묶음 탭 → 2027 띠별 가로 목록 → 쿠팡 배너(subId=home) → FAQ
- Test: `tests/home.test.ts`(season 설정 사용, 홈에 숫자 집계 문구 없음), `e2e/home.spec.ts`
- [ ] 테스트(E2E)
  - 히어로 CTA가 `/fortune`으로 간다
  - 양띠를 누르면 오늘의 운세(별점·한마디)가 메인에 나타나고, 두 링크가 맞는 주소다
  - 묶음 탭 전환 시 항목이 바뀐다
  - 홈에서 6개 테스트 모두 2번 탭 이내로 도달한다
  - hydration 오류 없음
- [ ] 기존 E2E 선택자(`main a[href=...]`) 갱신
- [ ] RED → 구현 → GREEN → 커밋

### Task 5: 마감 정리 + 시각 확인
- [ ] 테스트 페이지 5곳의 옛 헤더 장식과 겹치는 부분 정리(탭바와 "돌아가기" 버튼 공존 확인)
- [ ] 375px·412px 스크린샷으로 홈·허브·결과 화면 확인, 사용자에게 보여주기
- [ ] `npm test && npm run test:e2e`, 최종 리뷰어 검토, CLAUDE.md 갱신
- [ ] 사용자에게 보고하고 배포 승인 받기
