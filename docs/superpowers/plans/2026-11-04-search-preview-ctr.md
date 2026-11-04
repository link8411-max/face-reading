# 검색 미리보기 클릭률 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1~2) 네이버에서 노출은 되는데 안 눌리는 MBTI 16유형·인물열전 페이지의 검색 제목과 미리보기(본문 첫 글)를 검색어와 우리만의 정보가 보이게 바꾼다. (3) 쿠팡 배너가 없는 내용 페이지·공유 착지에 배너를 넣는다.

**Architecture:** 새 페이지 없이 기존 페이지의 메타 제목·설명과 본문 첫 부분만 바꾼다. 네이버 모바일은 메타 설명 대신 본문의 첫 제목+문단을 미리보기로 쓴다(2026-11-04 "사교적인 외교관 mbti" 검색에서 우리 결과가 `ESFJ는 이런 사람 ; ESFJ는 사람들과 함께할 때…`로 보임). 그래서 본문 맨 앞에 요약 블록을 두고, 열전은 배너 두 개를 요약 아래로 내린다.

**Tech Stack:** Next.js 16 App Router, vitest, Playwright

**Spec:** 별도 설계 문서 없음 — 2026-11-04 대화의 네이버 서치어드바이저 분석(최근 30일 MBTI 16유형 노출 약 1,400·클릭 약 13, ESFP 334/3, ESFJ 205/1, "사교적인 외교관 mbti" 86/0)과 사용자 요청("미리보기도 고려해서 바꾸는 것도 포함"). 열전 설계 `docs/superpowers/specs/2026-11-03-samguk-yeoljeon-design.md`의 "0. 쿠팡 배너 최상단(사용자 결정 2026-11-03)"을 Task 2가 바꾼다 — 사용자가 이 계획을 승인하면 그 결정을 갱신한 것으로 본다.

## Global Constraints

- 제목 48자 이하, 끝에 ` – 운명을 읽다` 하나, 설명 50~110자, 느낌표 금지 (`tests/seo-snippets.test.tsx` 첫 테스트가 그대로 지킨다).
- 새 사실·숫자를 지어내지 않는다. 요약 블록의 값은 모두 기존 데이터(`mbtiProfiles`, `bestMatches`, 열전 `summary`)에서 계산한다.
- 해요체. 이모지 금지(E2E `chrome-emoji.spec.ts`).
- 연의에만 있는 사건을 열전 `summary`에 쓰면 "연의에서는"처럼 밝힌다(CLAUDE.md 열전 내용 규칙).
- `git add`는 파일 이름으로, 커밋 끝 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. 메인 저장소의 추적 안 된 파일(`docs/videos/` 일부, `public/images/samguk/새장수/`, `scripts/*portrait*`, `scripts/.run-faces.tmp.mjs`)은 건드리지 않는다.

## Review Focus

1. 받침에 따른 조사: MBTI 유형은 모두 J·P로 끝나 `…예요`/`…와`가 맞지만, 장소·직업 이름 뒤에 조사를 붙이면 틀릴 수 있다 → 요약 블록에서 장소·직업 뒤에는 조사를 붙이지 않는다(목록으로만). Task 1 테스트가 16유형 문장에 `이에요`가 없고 `예요`로 끝나는지 본다.
2. 별명이 가장 긴 유형(ENTP "뜨거운 논쟁을 즐기는 변론가", 15자)에서도 새 제목이 48자 이하 → 첫 테스트가 16유형 전부를 돈다.
3. 열전에서 초상화 대기 인물(예: wangyi)도 새 순서로 깨지지 않아야 한다(닮은꼴 배너 문구가 "삼국지 닮은꼴 테스트 하기"로 바뀌는 경우) → Task 2 테스트에 대기 인물 한 명 순서 검사.
4. 열전 E2E의 "쿠팡 배너가 닮은꼴 배너보다 위" 관계는 그대로 유지(두 배너를 함께 옮긴다).
5. 요약 블록의 "오늘의 운세" 링크는 실제 있는 주소 `/fortune/mbti?t=<소문자>`여야 한다 → Task 1 테스트.

---

### Task 1: MBTI 16유형 제목·설명·첫 요약

**Files:**
- Modify: `src/app/mbti/[type]/page.tsx` (`generateMetadata`)
- Modify: `src/components/mbti/MbtiArticle.tsx` (헤더 다음, "이런 사람" 섹션 앞에 새 섹션)
- Test: `tests/seo-snippets.test.tsx`, `tests/mbti/` 중 새 파일 `tests/mbti/lead.test.tsx`

**Interfaces:**
- Consumes: `mbtiProfiles[T]`(`nickname`, `jobs[].title`, `travel.domestic[].place`, `travel.abroad[].place`), `bestMatches(type, 'love'|'friend'|'work', n?)` — 기존.
- Produces: 없음.

- [ ] **Step 1: 실패하는 테스트**

`tests/seo-snippets.test.tsx`의 `'MBTI 16개: …'` 테스트를 새 형식으로 바꾼다(이름도 `'MBTI 16개: 제목은 "별명 유형 특징·궁합 1위 <1위>"로 시작, 설명은 별명으로 시작'`):

```ts
const best = bestMatches(T, 'love', 1)[0]
const nick = mbtiProfiles[T].nickname
expect(title.startsWith(`${nick} ${T} 특징·궁합 1위 ${best}`), `${T}: ${title}`).toBe(true)
expect(desc.startsWith(`${nick} ${T}와 연애로 잘 맞는 유형 1위는 ${best}`), `${T}: ${desc}`).toBe(true)
```

새 `tests/mbti/lead.test.tsx` (`renderToStaticMarkup(<MbtiArticle type={T} />)`, 16유형 `test.each`):

```ts
const html = renderToStaticMarkup(<MbtiArticle type={T} />)
const lead = html.indexOf(`${T} 한눈에 보기`)
expect(lead).toBeGreaterThan(-1)
expect(lead).toBeLessThan(html.indexOf(`${T}는 이런 사람`))
const p = mbtiProfiles[T]
const sentence = `${p.nickname} ${T}의 연애 궁합 1위는 ${bestMatches(T, 'love', 1)[0]}, 친구 궁합 1위는 ${bestMatches(T, 'friend', 1)[0]}, 직장 궁합 1위는 ${bestMatches(T, 'work', 1)[0]}예요.`
expect(html).toContain(sentence)
for (const j of p.jobs.slice(0, 3)) expect(html).toContain(j.title)
expect(html).toContain(p.travel.domestic[0].place)
expect(html).toContain(p.travel.abroad[0].place)
expect(html).toContain(`href="/fortune/mbti?t=${T.toLowerCase()}"`)
```

- [ ] **Step 2: 실패 확인** — `npx vitest run tests/seo-snippets.test.tsx tests/mbti/lead.test.tsx` → 새 검사만 FAIL.

- [ ] **Step 3: 구현**

`generateMetadata`:
- `title = \`${p.nickname} ${T} 특징·궁합 1위 ${best} – 운명을 읽다\`` (기존 48자 넘으면 별명 빼는 분기는 지운다 — 가장 긴 별명에서도 43자).
- `description = \`${p.nickname} ${T}와 연애로 잘 맞는 유형 1위는 ${best}. 친구·직장 궁합과 어울리는 직업, 여행지까지 정리했어요.\``
- `best`는 지금처럼 `bestMatches(T, "love", 1)[0]`, 계산을 `title` 위로 옮긴다. OG 제목·설명은 지금처럼 같은 값.

`MbtiArticle`: `</header>` 바로 다음, `{type}는 이런 사람` 섹션 앞에 같은 `card` 모양 섹션:
- `<h2 className={h2}>{type} 한눈에 보기</h2>`
- `<p className="leading-relaxed">` + Step 1의 `sentence`와 똑같은 문장
- `<ul className="mt-2 space-y-1 text-sm">`: `<li><b>어울리는 직업</b> · {jobs 앞 3개 title을 ", "로}</li>`, `<li><b>잘 맞는 여행지</b> · {domestic[0].place}, {abroad[0].place}</li>` (장소·직업 뒤에 조사 없음)
- `<Link href={\`/fortune/mbti?t=${slug}\`} className="mt-3 inline-block text-sm text-accent underline underline-offset-2">오늘의 {type} 운세 보기</Link>`

- [ ] **Step 4: 통과 확인** — `npx vitest run tests/seo-snippets.test.tsx tests/mbti` → PASS (본문 1,500자 이상 검사 포함), 그다음 `npm test` 전체 PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/app/mbti/[type]/page.tsx src/components/mbti/MbtiArticle.tsx tests/seo-snippets.test.tsx tests/mbti/lead.test.tsx docs/superpowers/plans/2026-11-04-search-preview-ctr.md
git commit -m "feat(mbti): 검색 제목을 별명·궁합 1위로, 본문 첫머리에 한눈에 보기

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: 열전 페이지 — 요약을 배너 위로, 하후돈 요약 출처 표시

**Files:**
- Modify: `src/app/samguk/people/[id]/page.tsx` (블록 순서)
- Modify: `src/content/samgukPeople/xiaohoudun.ts` (`summary` 한 문장)
- Modify: `docs/superpowers/specs/2026-11-03-samguk-yeoljeon-design.md` (52~53행 순서 설명, 66행)
- Test: `tests/peoplePage.test.tsx`

**Interfaces:**
- Consumes: 없음(기존 JSX 블록 이동).
- Produces: 없음.

- [ ] **Step 1: 실패하는 테스트**

`tests/peoplePage.test.tsx`의 `'관우 페이지: 위에서 아래 순서와 details 4개'`에서 `order` 배열을 바꾼다:

```ts
const order = [idx('<h1'), idx('알고 보면 재밌는 이야기'), idx('쿠팡 추천 상품'), idx('나도 관우를 닮았을까'), idx('관우 한눈에 보기'), idx('id="cheer"'), idx('<details'), idx('id="duel-vote"'), idx('id="scene-vote"'), idx('id="verdict-vote"')]
```

새 테스트 `'초상화 대기 인물도 요약 → 쿠팡 → 닮은꼴 배너 순서'`: 같은 `render` 도우미로 `wangyi`를 그려 `idx('<h1') < idx('쿠팡 추천 상품') < idx('삼국지 닮은꼴 테스트 하기')`.

새 테스트 `'하후돈 요약: 박망파 제갈량 화공은 연의라고 밝힌다'`:

```ts
import { PEOPLE } from '@/content/samgukPeople'
const s = PEOPLE.xiaohoudun.summary
expect(s.startsWith('하후돈은 연의에서 ')).toBe(true)
expect(s.indexOf('연의에서')).toBeLessThan(s.indexOf('눈알'))
expect(s.lastIndexOf('연의에서는')).toBeLessThan(s.indexOf('제갈량'))
expect(s.lastIndexOf('연의에서는')).toBeGreaterThan(s.indexOf('눈알'))
```

(`PEOPLE`은 `Record<string, PersonEntry>`다.)

- [ ] **Step 2: 실패 확인** — `npx vitest run tests/peoplePage.test.tsx` → 새·바뀐 검사만 FAIL.

- [ ] **Step 3: 구현**
- `page.tsx`: `{/* 0. 쿠팡 배너 */}`와 `{/* 1. 닮은꼴 배너 */}` 두 블록을 통째로 `{/* 3. 요약·태그 */}` 섹션 바로 다음, `{/* 4. 한눈에 보기 */}` 앞으로 옮긴다. 경로 `nav`는 맨 위로 올라간다(`pt-5` 그대로). 주석 번호를 새 순서로 고친다. 닮은꼴 배너의 `mt-5`는 그대로.
- `xiaohoudun.ts` `summary`를 정확히 이 문장으로 바꾼다: `하후돈은 연의에서 화살에 꿰인 눈알을 삼키고 곧장 적을 창으로 찔러 죽인 장수예요. 조조의 일족으로, 조조가 군사를 일으켰을 때부터 곁을 지켰어요. 연의에서는 박망파에서 제갈량의 불 공격에 걸려 크게 패하기도 해요.` (눈알 삼키기는 연의 이야기이고 정사는 여포와 싸우다 화살에 왼쪽 눈을 다쳤다고만 적는다. 박망 싸움은 정사에서 유비가 진영을 불태우고 물러나는 척해 복병으로 이긴 것이고 제갈량은 아직 유비에게 오기 전이다 — 같은 파일 funFacts 16행도 이렇게 적고 있다.)
- 설계 문서: 0·1번 배너가 "요약·태그(3번) 아래로 옮김 — 2026-11-04, 네이버 미리보기가 본문 첫 글을 쓰므로"로 바뀌었다고 적는다.

- [ ] **Step 4: 통과 확인** — `npx vitest run tests/peoplePage.test.tsx tests/seo-snippets.test.tsx` PASS, `npm test` 전체 PASS, `npx playwright test e2e/people.spec.ts` PASS(쿠팡이 닮은꼴 배너보다 위 — 그대로 통과해야 한다).

- [ ] **Step 5: 커밋**

```bash
git add src/app/samguk/people/[id]/page.tsx src/content/samgukPeople/xiaohoudun.ts docs/superpowers/specs/2026-11-03-samguk-yeoljeon-design.md tests/peoplePage.test.tsx
git commit -m "feat(people): 검색 미리보기에 요약이 나오게 배너를 요약 아래로, 하후돈 요약 연의 표시

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: 쿠팡 배너가 없는 페이지 전부에 배너

사용자 요청(2026-11-04 "쿠팡 배너들 안 보이던데 다 넣어야지"). 배너 컴포넌트·대가성 문구·위젯은 그대로 두고, 아래 13곳에 `CoupangBanner` 한 줄씩 넣는다(같은 모양의 작은 수정이라 한 번에 한다).

**넣지 않는 곳(결정):** 사진 테스트 시작 화면(관상·동물상·닮은꼴·얼굴 궁합·우리 팀 — 결과 화면에 이미 있고, 시작 화면은 사진 올리기에 집중), 월드컵 대결 중, 일기토 게임 화면(이미 있음), `/about`·`/privacy`.

**위치 규칙:** 페이지 본문 컨테이너(`</main>` 또는 가장 바깥 내용 `div`)의 **마지막 자식**으로 넣는다. 공유 착지는 "나도 해보기" 버튼과 그 아래 링크·안내문이 모두 끝난 뒤가 된다. 예외 하나: `MbtiDailyClient`는 결과 화면의 `<ResultActions …/>` 바로 아래(결과가 나왔을 때만).

**Files (subId):**

| 파일 | subId |
|---|---|
| `src/app/mbti/page.tsx` | `mbti-hub` |
| `src/components/mbti/MbtiDailyClient.tsx` | `mbti-daily` |
| `src/app/fortune/2027/page.tsx` | `fortune-2027` |
| `src/app/face-tests/page.tsx` | `face-tests` |
| `src/app/unse/page.tsx` | `unse` |
| `src/app/samguk/cup/ranking/page.tsx` | `cup-ranking` |
| `src/app/samguk/duel/generals/[id]/page.tsx` | `` `duel-${id}` `` |
| `src/components/share/SharePage.tsx` (관상·동물상·닮은꼴 공유 착지) | `` `share-${kind}` `` |
| `src/app/mbti/r/[pair]/page.tsx` | `share-mbti` |
| `src/app/samguk/cup/r/[board]/[id]/page.tsx` | `share-cup` |
| `src/app/samguk/duel/r/[key]/page.tsx` | `share-duel` |
| `src/app/face-match/r/[pair]/page.tsx` | `share-face-match` |
| `src/app/fortune/mbti/r/[type]/page.tsx` | `share-mbti-daily` |

- Modify: `CLAUDE.md` 월드컵 표시 규칙의 배너 줄을 "판 고르기·끝 화면·순위·공유 착지에 있고 대결 중에는 없다"로, "시즌 추천" 절의 다이나믹 배너 문단에 "사진 테스트 시작 화면을 뺀 모든 내용 페이지와 공유 착지(subId `share-<종류>`)에 있다" 한 줄.
- Test: `tests/coupang.test.ts`, E2E 한 곳

- [ ] **Step 1: 실패하는 테스트** — `tests/coupang.test.ts`:
  - 기존 페이지 목록 `test.each`(`<CoupangBanner subId="${subId}"` 문자열 검사)에 고정 subId 11개 행을 더한다(표의 고정 문자열 전부).
  - 새 `test.each`: `['src/app/samguk/duel/generals/[id]/page.tsx', 'subId={`duel-${id}`}']`, `['src/components/share/SharePage.tsx', 'subId={`share-${kind}`}']` — 파일에 그 문자열이 있다.
  - `gaSlot('share-mbti-daily')`가 `share_mbti_daily`.
- [ ] **Step 2: 실패 확인** — `npx vitest run tests/coupang.test.ts` → 새 행만 FAIL.
- [ ] **Step 3: 13곳에 배너** — 위치 규칙대로. 서버 파일은 `import CoupangBanner from "@/components/CoupangBanner";`(파일의 따옴표 스타일을 따른다). `MbtiDailyClient`·`SharePage`에서 `kind`·`id` 변수 이름이 다르면 그 파일의 실제 이름을 쓰고 Step 1 검사 문자열도 같이 맞춘다.
- [ ] **Step 4: 통과 확인** — `npx vitest run tests/coupang.test.ts` PASS, `npm test` 전체 PASS (번들 검사 `tests/cupGame.test.tsx` 마지막 테스트 포함).
- [ ] **Step 5: E2E** — `e2e/`에서 `'추천 상품'`을 이미 검사하는 파일이 있으면 그 파일에, 없으면 `e2e/flows.spec.ts`에 테스트 하나: `/mbti`, `/unse`, `/samguk/cup/ranking`, `/samguk/duel/generals/guanyu`, `/samguk/r/zhaoyun?s=84`를 차례로 열어 `page.getByText('추천 상품', { exact: true })`가 보이는지. `npx playwright test e2e/flows.spec.ts e2e/chrome-emoji.spec.ts e2e/cup.spec.ts` PASS. (3200 포트에 다른 서버가 떠 있으면 끄지 말고 보고.)
- [ ] **Step 6: 커밋**

```bash
git add <위 13개 파일> CLAUDE.md tests/coupang.test.ts <고친 e2e 파일>
git commit -m "feat(coupang): 배너가 없던 허브·순위·장수·공유 착지 페이지에 다이나믹 배너

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## 배포 뒤 (컨트롤러, push는 사용자 승인 뒤)

- `curl`로 `/mbti/esfj` 제목이 `사교적인 외교관 ESFJ 특징·궁합 1위 ISTP – 운명을 읽다`인지, `/samguk/people/xiaohoudun` 본문에서 요약이 `추천 상품`보다 먼저 나오는지 확인.
- 네이버 수집 요청(하루 50건): 11/5 MBTI 16 + 월드컵 2 + 인물 32, 11/6 인물 50, 11/7 남은 인물. 이미 요청한 인물 목록은 메모리 `unse-ai-growth.md`.
- 2주 뒤 서치어드바이저 "콘텐츠 노출/클릭"에서 MBTI 페이지 CTR(지금 약 0.9%)과 "사교적인 외교관 mbti"(86/0) 같은 별명 검색어 클릭을 비교.
