# 삼국지 인물열전·관계도·응원 순위 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 장수 이름으로 검색해 들어온 사람이 읽을 인물열전 22편과 관계도·응원 순위 페이지를 만들고, 응원·투표로 참여하게 하며, 닮은꼴·일기토와 서로 잇는다.

**Architecture:** 열전 글은 `src/content/samgukPeople/`의 인물별 TS 데이터(정사/연의 표시 포함)이고, 페이지는 정적 생성(`generateStaticParams`, `dynamicParams=false`)이다. 응원·투표는 Supabase `people_votes` 테이블 하나에 `/api/people/vote`(POST)·`/api/people/stats`(GET)로 쓰고 읽으며, 중복은 쿠키 id+IP를 날마다 바뀌는 키로 HMAC 해시해 막는다. 순위 페이지만 ISR(1시간)로 서버에서 집계를 읽는다.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind 4, vitest(node 환경, `tests/**/*.test.{ts,tsx}`), Playwright(`npm run test:e2e`, 3200 포트 빌드), Supabase PostgREST(fetch, SDK 없음).

**Spec:** `docs/superpowers/specs/2026-11-03-samguk-yeoljeon-design.md` (커밋 eec5555, 쿠팡 배너 최상단 반영본). 구현 전에 반드시 같이 읽는다.

## Global Constraints

- 사실이 아닌 내용 금지. 정사와 연의를 섞어 정사처럼 쓰지 않는다. 모든 전투·관계·명언·무기에 출처(`정사`·`배송지 주`·`연의`)를 단다. 확실하지 않은 사실은 쓰지 않는다.
- 나무위키·위키백과·책 문장을 그대로 또는 살짝 바꿔 옮기지 않는다. 글은 새로 쓴다.
- 가짜 숫자 금지. 응원 수·투표 비율은 실제 집계만. 투표 10표 미만이면 비율 대신 "아직 투표가 적어요". 순위는 전체 응원 30회 미만이면 "응원을 모으는 중"과 인물 목록.
- IP 원본·쿠키 원본을 저장·로그하지 않는다.
- 긴 글을 펼친 채 나열하지 않는다. 생애·전투·관계·정사와 연의는 `<details>`로 접는다(글은 HTML에 남는다).
- 검색 제목 48자 이하, 인물 이름으로 시작, 브랜드 ` – 운명을 읽다` 정확히 한 번. 설명 50~110자(기존 `tests/seo-snippets.test.tsx`의 `DESC_MAX = 110`이 문서의 160보다 우선). 제목·설명에 `!`·`2026` 금지(같은 테스트의 BANNED).
- 디자인: 4b 뉴트럴 토큰(`bg-paper` `bg-card` `bg-card-2` `border-line` `text-ink` `text-muted` `text-accent`), 주 버튼 `h-[52px] bg-ink text-paper rounded-full`, 카드 `rounded-[22px]`~`rounded-[30px]`, 제목 `font-serif`. 이모지 금지(제목·버튼·링크·메뉴, E2E `chrome-emoji.spec.ts`). 아이콘은 `src/components/icons.tsx`의 `Icon`만.
- "돌아가기"는 `useBackOrHome`(router.back 금지).
- GA는 기존 `track()`만, 허용 키는 `test_name`·`result_id`·`method`·`slot`·`keyword`, 값은 영문·숫자·밑줄·한글 24자 이하.
- 인물 id는 `src/lib/samgukDB.ts`의 실제 id를 쓴다. 하후돈은 `xiaohoudun`(오타처럼 보여도 DB 값 그대로).
- 홈 화면 파일(`src/app/page.tsx`, `src/components/home/*`)에는 순위 페이지로 가는 링크를 넣더라도 `인기 순위`·`HOT`·`N명 참여` 같은 문구를 쓰지 않는다(`tests/home.test.ts`).
- 새 페이지는 CLAUDE.md "새 페이지 추가 시 SEO 체크리스트"를 따르되, 메타는 일기토 장수 페이지처럼 page의 `generateMetadata`/`metadata`에 둬도 된다(PageGuide는 열전 본문이 이미 서버 렌더라 생략).
- 커밋은 태스크마다. push·배포·SQL 실행·외부 콘솔 작업은 Task 10에서 사용자 확인 후에만.
- 작업하지 않는 추적 안 된 파일(`public/images/samguk/새장수/`, `scripts/*portrait*`, `scripts/.run-faces.tmp.mjs`)은 건드리지도 커밋하지도 않는다. `git add`는 파일을 이름으로 지정한다.

## Review Focus

1. 초상화가 아직 없는 인물(`PENDING_PORTRAIT_IDS`)에게 열전이 생기면 깨진 이미지 대신 "초상화 추가 예정" 자리가 나와야 한다 → Task 2 `portraitSrc` 테스트.
2. Supabase 환경 변수가 없는 배포(미리보기·E2E)에서 응원·투표 버튼은 보이고, 숫자 영역은 숨고, 화면이 깨지지 않아야 한다 → Task 4 E2E.
3. 같은 날 같은 인물을 다시 응원하면 수가 늘지 않고 "오늘 응원했어요"로 보여야 한다 → Task 3 `counted:false` 테스트 + Task 4 화면.
4. 없는 인물 id, 남의 선택지, 큰 본문, 깨진 JSON은 DB를 부르지 않고 400/413 → Task 3 검증 테스트.
5. 관계 상대가 열전이 없는 인물이거나 DB에 없는 인물(이름만)일 때 링크 없이 이름만, 그림에서도 빠지지 않아야 한다 → Task 1 `relationsOf` 테스트.

---

## 파일 구조

| 파일 | 책임 |
|---|---|
| `src/content/samgukPeople/types.ts` | 열전 데이터 타입, 출처·관계 종류, 한 줄 평 공통 선택지 `VERDICTS` |
| `src/content/samgukPeople/<id>.ts` | 인물 한 명의 열전 데이터(`export const person: PersonEntry`) |
| `src/content/samgukPeople/index.ts` | 등록부 `PEOPLE`, `getPerson`, `PEOPLE_IDS` |
| `src/lib/people/relations.ts` | 양방향 관계, 혈연 구분, 세력별 묶기 |
| `src/lib/people/portrait.ts` | 초상화 경로(없으면 null) |
| `src/lib/people/votes.ts` | 투표 입력 검증, 대결 쌍 키, 해시 |
| `src/lib/people/store.ts` | Supabase 읽기·쓰기(fetch) |
| `src/app/api/people/vote/route.ts`, `src/app/api/people/stats/route.ts` | API |
| `src/app/samguk/people/[id]/page.tsx` | 열전 페이지 |
| `src/app/samguk/people/page.tsx` | 관계도·열전 목록 허브 |
| `src/app/samguk/people/ranking/page.tsx` | 응원 순위(ISR) |
| `src/components/people/*` | 머리 카드, 관계 SVG, 응원·투표 위젯 |
| `docs/people-votes.sql` | 테이블·함수 SQL(사용자가 실행) |
| `docs/samguk-people-progress.md` | 전체 인물 진행표 |

---

### Task 1: 열전 데이터 형식·등록부·관계 계산 + 기준 열전 2편(조조·관우)

**Files:**
- Create: `src/content/samgukPeople/types.ts`, `src/content/samgukPeople/index.ts`, `src/content/samgukPeople/caocao.ts`, `src/content/samgukPeople/guanyu.ts`, `src/lib/people/relations.ts`, `docs/samguk-people-progress.md`
- Test: `tests/samgukPeople.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  ```ts
  export type Source = '정사' | '배송지 주' | '연의'
  export type RelationType = '군신' | '의형제' | '부자' | '형제' | '부부' | '혼인' | '사촌' | '라이벌' | '원수'
  export const KIN_TYPES: RelationType[] = ['부자', '형제', '부부', '혼인', '사촌']
  export const VERDICTS = [
    { key: 'loyal', label: '충신' }, { key: 'righteous', label: '의리파' }, { key: 'brave', label: '용장' },
    { key: 'strategist', label: '책략가' }, { key: 'ambitious', label: '야심가' }, { key: 'tragic', label: '비운의 영웅' },
    { key: 'overrated', label: '과대평가' }, { key: 'underrated', label: '저평가' },
  ] as const
  export type VerdictKey = (typeof VERDICTS)[number]['key']
  export interface PersonEntry {
    id: string                       // samgukDB id
    style: string | null             // 자(字) 한글, 없으면 null
    styleHanja: string | null
    born: number | null; died: number | null   // 연도, 모르면 null
    birthplace: string | null
    summary: string                  // 2~3문장, 60~200자
    tags: string[]                   // 3~5개
    nameMeaning: string              // 이름·자 뜻 한두 문장
    weapon: { novel: string | null; history: string | null }  // 정사 기록 없으면 null
    famousQuote: { text: string; source: Source }
    life: string                     // 생애 열전(최후·묘 포함), 600~1200자, 문단은 \n\n
    battles: { name: string; year: number | null; role: string; source: Source }[]  // 2개 이상
    relations: { id?: string; name?: string; type: RelationType; note: string; source: Source }[]  // id 또는 name 하나는 필수
    novelVsHistory: string[]         // 2~4개
    rivalId: string                  // PEOPLE 안의 다른 id
    sceneOptions: { key: string; label: string; source: Source }[]  // 3~4개, key는 영문 소문자·밑줄
    verdictOptions: VerdictKey[]     // 4개
  }
  ```
- Produces (`index.ts`): `export const PEOPLE: Record<string, PersonEntry>`, `export const PEOPLE_IDS: string[]`, `export function getPerson(id: string): PersonEntry | undefined`.
- Produces (`relations.ts`):
  ```ts
  export interface RelationView { otherId: string | null; otherName: string; type: RelationType; note: string; source: Source; hasPage: boolean; kin: boolean }
  export function relationsOf(id: string): RelationView[]       // 내 relations + 남의 relations 중 나를 가리키는 것, otherId 기준 중복 제거(내 쪽 우선)
  export function factionGroups(): { faction: '위' | '촉' | '오' | '기타'; ids: string[] }[]  // samgukDB faction, PEOPLE_IDS만
  ```

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/samgukPeople.test.ts`
  - `every PEOPLE id exists in allSamgukCharacters`
  - `each entry passes shape rules`: summary 60~200자, tags 3~5, life 600~1200자, battles ≥2, novelVsHistory 2~4, sceneOptions 3~4 (key `/^[a-z_]+$/`), verdictOptions 정확히 4개이고 모두 `VERDICTS` key, rivalId ≠ 자기 id이고 `PEOPLE`에 있음, 모든 relation에 id 또는 name, relation id는 `allSamgukCharacters`에 있음, 모든 source가 세 값 중 하나.
  - `no banned copy`: 모든 문자열 필드에 `!` 없음, 이모지(`/\p{Extended_Pictographic}/u`) 없음.
  - `relationsOf is bidirectional`: `relationsOf('guanyu')`에 조조(`otherId: 'caocao'`)가 있고, `relationsOf('caocao')`에도 관우가 있다(한쪽에만 적혀 있어도).
  - `relationsOf marks pages and kin`: 열전 없는 인물은 `hasPage:false`, name만 있는 관계는 `otherId:null`이고 목록에 남는다, `부자`는 `kin:true`, `라이벌`은 `kin:false`.
  - `progress doc marks every published person as fact-checked`: `docs/samguk-people-progress.md`에서 `| <id> |`로 시작하는 줄마다 열 순서가 `id | 이름 | 초상화 | 열전 | 사실 검토 | 공개`이고, `PEOPLE_IDS`의 모든 id 줄은 `사실 검토` 칸이 `O`.
- [ ] **Step 2: 실행해 실패 확인** — `npx vitest run tests/samgukPeople.test.ts` → 모듈 없음으로 FAIL.
- [ ] **Step 3: 타입·등록부·관계 구현**, 그리고 `caocao.ts`·`guanyu.ts` 작성(아래 "열전 쓰기 규칙"). 조조·관우는 이후 작성자들의 본보기이므로 가장 신중하게 쓴다. 관우의 관계에는 관평(`guanping`, 열전 없음)을 넣는다(Task 2 테스트가 쓴다). rivalId는 PEOPLE 안이어야 하므로 지금은 둘이 서로를 가리키고, Task 7 배치 A가 끝나면 조조↔유비, 관우↔여포처럼 더 맞는 상대로 바꿔도 된다.
- [ ] **Step 4: 진행표 생성** — `allSamgukCharacters` 전원(현재 127명) 한 줄씩. 초상화 칸은 `PENDING_PORTRAIT_IDS`면 `대기`, 아니면 `O`. 열전·사실 검토·공개 칸은 빈칸, 조조·관우는 열전 `O`, 사실 검토는 Step 5 뒤 `O`. 표 위에 "첫 공개 22명" 목록(Task 7 배치)과 이어 쓰는 방법 3줄.
- [ ] **Step 5: 사실 검토(별도 검토자)** — 작성자가 아닌 검토 에이전트가 두 편을 정사(진수『삼국지』·배송지 주)·연의와 대조해 연도·관계·최후·명언 출처를 확인하고, 확인 못 한 문장은 지운다. 통과하면 진행표 `사실 검토`를 `O`.
- [ ] **Step 6: 통과 확인** — `npx vitest run tests/samgukPeople.test.ts` PASS, `npx tsc --noEmit` 0.
- [ ] **Step 7: 커밋** — `feat(people): 열전 데이터 형식·관계 계산, 조조·관우 열전`

**열전 쓰기 규칙(모든 열전 공통, Task 7도 따른다)**
- 근거: 진수『삼국지』, 배송지 주, 나관중『삼국지연의』. 사람이 검색하는 것(이름 뜻·자, 무기, 명언, 최후·묘, 관계)을 꼭 넣는다. 스펙 "왜 만드나"의 자동완성 검색어 참고.
- 무기: 연의의 무기(예: 청룡언월도)는 `novel`, 정사에 기록이 없으면 `history: null`(화면에 "정사 기록 없음").
- 명언은 짧게 원문 뜻을 우리말로 새로 옮긴다. 출처를 단다. 연의에만 있는 말을 정사라고 하지 않는다.
- 생애는 출신→주요 활약→최후·묘 순서, 문단 3~5개. 평가는 "~로 평가된다"처럼 단정하지 않는다.
- 다른 사이트 문장을 붙여 넣거나 어순만 바꾸지 않는다.

---

### Task 2: 인물열전 페이지 `/samguk/people/[id]`

**Files:**
- Create: `src/lib/people/portrait.ts`, `src/app/samguk/people/[id]/page.tsx`, `src/components/people/PersonHeader.tsx`, `src/components/people/RelationMap.tsx`
- Modify: `tests/seo-snippets.test.tsx` (pages()에 열전 추가)
- Test: `tests/peoplePage.test.tsx`

**Interfaces:**
- Consumes: Task 1의 `getPerson`, `PEOPLE_IDS`, `relationsOf`, `VERDICTS`; `getCharacterById`, `PENDING_PORTRAIT_IDS`(samgukDB); `getDuelGeneral`(lib/duel/generals); `CoupangBanner`.
- Produces: `export function portraitSrc(id: string): string | null` (`/images/samguk/<한글이름>.jpg`, PENDING이면 null); `export function personTitle(id: string): string`; 페이지 안의 앵커 id `cheer`, `duel-vote`, `scene-vote`, `verdict-vote`(Task 4 위젯이 들어갈 자리, 이 태스크에서는 빈 `<section id=...>`).
- Produces: `RelationMap({ centerId }: { centerId: string })` — 서버 컴포넌트, 가운데 인물 + 관계 상대를 원형으로 둔 SVG(최대 10명, 혈연 선은 실선 `text-accent`, 그 밖은 점선 `text-muted`), 그 아래 같은 관계를 혈연/그 밖 두 목록 글로.

- [ ] **Step 1: 실패하는 테스트** — `tests/peoplePage.test.tsx`
  - `portraitSrc`: `portraitSrc('guanyu') === '/images/samguk/관우.jpg'`, `portraitSrc('caojie') === null`.
  - `personTitle`: `personTitle('caocao')`가 `조조 열전`으로 시작, ` – 운명을 읽다`로 끝나고 48자 이하. 자가 있으면 `자 <자>` 포함.
  - 페이지 렌더(`renderToStaticMarkup(await Page({ params: Promise.resolve({ id: 'guanyu' }) }))`): 순서대로 `쿠팡 추천 상품`(iframe title) → `나도 관우를 닮았을까` → 이름 → `<details` 4개(생애·주요 전투·관계도·정사와 연의) → `id="cheer"`. 링크 `/samguk/duel?me=guanyu` 있음(일기토 장수). `application/ld+json`에 `"@type":"Person"`.
  - 일기토에 없는 인물(`caocao`)은 `일기토에서 싸워 보기` 없음.
  - 함께 보는 인물: 관우 페이지에 `/samguk/people/caocao` 링크가 있고, 열전이 없는 관계 상대(예: 관평 `guanping`)는 이름만 있고 `/samguk/people/guanping` 링크는 없음.
- [ ] **Step 2: 실패 확인** — `npx vitest run tests/peoplePage.test.tsx`.
- [ ] **Step 3: 구현** — 순서는 스펙 "1. 인물열전"의 0~12번 그대로(0 쿠팡 `subId="people-<id>"`, 1 닮은꼴 배너: 버튼 `나도 <이름>을/를 닮았을까? 사진 한 장으로 확인하기` → `/samguk`, PENDING이면 `삼국지 닮은꼴 테스트 하기`; 일기토 장수면 두 번째 버튼 `일기토에서 싸워 보기` → `/samguk/duel?me=<id>`). 받침에 따라 을/를. 무기 칸은 `연의: …` / `정사: …`(null이면 `정사 기록 없음`). 각 전투·관계 줄 끝에 출처 칩. `generateStaticParams`는 `PEOPLE_IDS`, `dynamicParams = false`. 메타: 제목 `personTitle(id)`, 설명은 summary 앞부분 + `무기·관계·최후` 포함 50~110자, canonical `https://unse-ai.com/samguk/people/<id>`, OG 이미지 `/api/og?title=<이름 열전>&subtitle=<자 또는 역할>`, JSON-LD `Person`(name, alternateName=[한자, 자], birthDate/deathDate 연도 문자열, affiliation=세력)과 `BreadcrumbList`.
- [ ] **Step 4: seo-snippets에 추가** — `pages()`에 `PEOPLE_IDS`마다 `/samguk/people/<id>` 메타를 넣어 기존 길이·브랜드·BANNED 규칙을 그대로 적용.
- [ ] **Step 5: 통과 확인** — `npx vitest run tests/peoplePage.test.tsx tests/seo-snippets.test.tsx` PASS.
- [ ] **Step 6: 커밋** — `feat(people): 인물열전 페이지`

---

### Task 3: 응원·투표 저장 (SQL·해시·API)

**Files:**
- Create: `docs/people-votes.sql`, `src/lib/people/votes.ts`, `src/lib/people/store.ts`, `src/app/api/people/vote/route.ts`, `src/app/api/people/stats/route.ts`
- Test: `tests/peopleVotes.test.ts`

**Interfaces:**
- Consumes: Task 1 `getPerson`; `createGuard`, `clientIp`, `readLimitedBody` (`src/lib/duel/feedbackGuard.ts`).
- Produces (`votes.ts`):
  ```ts
  export type VoteKind = 'cheer' | 'duel' | 'scene' | 'verdict'
  export interface VoteInput { kind: VoteKind; target: string; option: string }
  export function pairKey(a: string, b: string): string            // 두 id를 정렬해 `${x}__${y}`
  export function validateVote(body: unknown): VoteInput | null      // cheer: target=인물, option='cheer' / duel: target=pairKey(인물, 그 rivalId), option ∈ 두 id / scene: option ∈ sceneOptions key / verdict: option ∈ verdictOptions
  export function kstDay(now: Date): string                          // 'YYYY-MM-DD' 한국 날짜
  export async function voterHash(secret: string, day: string, deviceId: string, ip: string): Promise<string>  // HMAC-SHA256(HMAC-SHA256(secret, day), `${deviceId}|${ip}`) hex, Web Crypto
  export interface PersonStats { cheer: number; duel: Record<string, number>; scene: Record<string, number>; verdict: Record<string, number> }
  ```
- Produces (`store.ts`): `export function storeConfig(): { url: string; key: string } | null`, `export async function insertVote(cfg, row: { kind; target; option; voter_hash; day }): Promise<{ counted: boolean }>`, `export async function readStats(cfg, id: string): Promise<PersonStats>`, `export async function readCheerRanking(cfg): Promise<{ id: string; n: number }[]>`.
- Produces (API): `POST /api/people/vote` body `VoteInput` → `200 { ok: true, counted: boolean, stats: PersonStats }` / `400` / `413` / `429` / `503 { ok:false, reason:'disabled' }`. `GET /api/people/stats?id=<id>` → `200 PersonStats` (`Cache-Control: public, s-maxage=30, stale-while-revalidate=300`) / `400` / `503`.

- [ ] **Step 1: SQL 작성** — `docs/people-votes.sql`: 테이블 `people_votes(id bigserial pk, kind text not null check (kind in ('cheer','duel','scene','verdict')), target text not null, option text not null, voter_hash text not null, day date not null, created_at timestamptz not null default now(), unique (kind, target, voter_hash, day))`, RLS 켜고 정책 없음(서비스 키만 접근), 함수 `people_stats(p_id text)` → `table(kind text, option text, n bigint)`: `target = p_id` 또는 `target like p_id||'\_\_%' or target like '%\_\_'||p_id` 묶음 count, 함수 `people_cheer_ranking()` → `table(target text, n bigint)` 응원 수 내림차순. 파일 위에 "Supabase SQL Editor에서 한 번 실행" 안내.
- [ ] **Step 2: 실패하는 테스트** — `tests/peopleVotes.test.ts`
  - `pairKey('guanyu','caocao') === 'caocao__guanyu'`, 순서 무관.
  - `validateVote`: cheer 정상 / 없는 인물 null / duel에서 rival이 아닌 상대 null / scene에서 다른 인물의 key null / verdict에서 그 인물 선택지 밖 null / 문자열·null·배열 본문 null.
  - `voterHash`: 같은 입력 같은 값, 날짜가 다르면 다른 값, 64자 hex, 결과에 IP·기기 id 문자열이 들어 있지 않음.
  - `kstDay(new Date('2026-11-03T15:30:00Z')) === '2026-11-04'`.
  - API(라우트 함수를 직접 호출, `fetch`는 `vi.stubGlobal`):
    - env 없음 → POST 503 `reason:'disabled'`, fetch 호출 0회.
    - 깨진 JSON → 400, fetch 0회. 2048바이트 초과 → 413.
    - cheer 처음 → Supabase 응답 `[{...}]` → `counted:true`; 같은 날 두 번째 → 응답 `[]` → `counted:false`.
    - 응답에 `Set-Cookie: pv=`가 처음 요청에만 붙고(`HttpOnly; SameSite=Lax; Path=/api/people; Max-Age=31536000; Secure`), 쿠키가 있으면 다시 붙지 않음.
    - Supabase로 보낸 본문에 IP 문자열과 쿠키 값이 없음.
- [ ] **Step 3: 실패 확인** — `npx vitest run tests/peopleVotes.test.ts`.
- [ ] **Step 4: 구현** — 비밀 값은 `process.env.PEOPLE_VOTE_SECRET ?? process.env.SUPABASE_SERVICE_KEY`(새 환경 변수 없이 동작). 쓰기: cheer는 `POST /rest/v1/people_votes?on_conflict=kind,target,voter_hash,day` + `Prefer: resolution=ignore-duplicates,return=representation`(빈 배열이면 counted false), 나머지는 같은 주소 + `resolution=merge-duplicates,return=representation`(다시 누르면 선택 바꾸기, counted true). 읽기: `POST /rest/v1/rpc/people_stats`, `/rpc/people_cheer_ranking`. 속도 제한 `createGuard(20)`. 타임아웃 5초, 실패 502. IP·본문·키는 로그에 남기지 않는다(기존 `api/duel/run/route.ts`와 같은 태도).
- [ ] **Step 5: 통과 확인** — `npx vitest run tests/peopleVotes.test.ts` PASS, `npx tsc --noEmit` 0.
- [ ] **Step 6: 커밋** — `feat(people): 응원·투표 저장 API와 SQL`

---

### Task 4: 응원·투표 화면 + GA + 개인정보처리방침

**Files:**
- Create: `src/components/people/CheerButton.tsx`, `src/components/people/VotePoll.tsx`, `src/components/people/usePersonStats.ts`
- Modify: `src/app/samguk/people/[id]/page.tsx`(Task 2의 빈 section 4개 채우기, 머리 카드 옆 많이 고른 한 줄 평), `src/lib/analytics.ts`, `src/app/privacy/page.tsx`
- Test: `tests/peopleWidgets.test.tsx`, `e2e/people.spec.ts`

**Interfaces:**
- Consumes: Task 3 API와 `PersonStats`, `pairKey`; `useResultShare`(`src/hooks/useResultShare.ts`, `ShareMeta`).
- Produces: `usePersonStats(id: string): { stats: PersonStats | null; disabled: boolean; vote(kind, target, option): Promise<{ counted: boolean } | null> }` — 마운트 때 `/api/people/stats` 한 번, 503이면 `disabled:true`. `export function ratioView(counts: Record<string, number>, threshold = 10): { show: boolean; pct: Record<string, number> }`(합 < threshold면 show false). `export const LOW_VOTE_TEXT = '아직 투표가 적어요'`.
- analytics.ts: `TestName`에 `'people'` 추가, 이벤트 `people_cheer: { result_id: string }`, `people_vote: { result_id: string }`(값 `<kind>_<id>`, 예 `duel_guanyu`).

- [ ] **Step 1: 실패하는 테스트** — `tests/peopleWidgets.test.tsx`
  - `ratioView({a:3,b:2})` → show false. `ratioView({a:6,b:4})` → show true, pct `{a:60,b:40}`(반올림, 합 100).
  - `CheerButton` 서버 렌더: 버튼 문구 `응원하기`, 숫자 영역 없음(stats null 초기 상태).
  - `VotePoll` 서버 렌더: 투표 전에는 `%` 문자가 없음.
- [ ] **Step 2: 실패 확인** — `npx vitest run tests/peopleWidgets.test.tsx`.
- [ ] **Step 3: 구현** —
  - 응원: 누르면 vote → counted true면 수 +1·`오늘 응원했어요`, false면 `오늘은 이미 응원했어요`. 기기 표시는 `localStorage['pv:cheer:<id>:<kstDay>']`(try/catch). disabled면 숫자를 숨기고 버튼은 눌러도 조용히 `고마워요`만.
  - 투표 3종(대결 `<이름> vs <라이벌>, 일기토하면 누가 이길까?`, 명장면, 한 줄 평): 투표 전 비율 숨김, 투표하면 `ratioView`로 막대와 %, 10표 미만이면 `LOW_VOTE_TEXT`. 대결 투표 뒤 공유 버튼 → `useResultShare({ testName:'people', title:'운명을 읽다 · 삼국지 인물열전', text:'<A> vs <B>, 나는 <선택>. 너는?', url:'https://unse-ai.com/samguk/people/<id>?utm_source=share&utm_medium=friend_link&utm_campaign=people', imageUrl: <Task 2 OG 이미지 절대 주소> })`.
  - 한 줄 평 집계가 10표 이상이면 머리 카드 태그 옆에 1위 라벨 칩.
  - GA: 응원 `track('people_cheer', { result_id: id })`, 투표 `track('people_vote', { result_id: \`${kind}_${id}\` })`, 공유는 기존 `share_click`(test_name `people`).
  - 개인정보처리방침 이용 기록 목록에 한 줄: "삼국지 인물열전의 응원·투표는 고른 항목과 날짜, 그리고 기기·접속 정보를 되돌릴 수 없게 바꾼 값(해시)만 저장합니다. IP 주소와 쿠키 값 자체는 저장하지 않습니다." 개정일자 줄 갱신.
- [ ] **Step 4: E2E** — `e2e/people.spec.ts`(E2E 서버에는 Supabase 환경 변수가 없다): `/samguk/people/guanyu` 로딩, 쿠팡 배너가 닮은꼴 배너보다 위, `<details>` 펼치면 생애 글 보임, 응원 버튼 보이고 숫자 영역 없음, 누르면 `people_cheer` 이벤트(dataLayer)와 화면 깨짐 없음, 닮은꼴 배너 링크가 `/samguk`. 이모지 금지 규칙은 기존 `chrome-emoji.spec.ts`가 새 경로를 훑는지 확인하고, 경로 목록이 있으면 추가.
- [ ] **Step 5: 통과 확인** — `npx vitest run tests/peopleWidgets.test.tsx`, `npm run test:e2e -- e2e/people.spec.ts e2e/chrome-emoji.spec.ts` PASS.
- [ ] **Step 6: 커밋** — `feat(people): 응원·투표 화면, GA, 개인정보처리방침`

---

### Task 5: 관계도 허브 `/samguk/people` + 응원 순위 `/samguk/people/ranking`

**Files:**
- Create: `src/app/samguk/people/page.tsx`, `src/app/samguk/people/ranking/page.tsx`, `src/components/people/FactionMap.tsx`
- Modify: `tests/seo-snippets.test.tsx`(두 페이지 추가)
- Test: `tests/peopleHub.test.tsx`, `e2e/people.spec.ts`(추가)

**Interfaces:**
- Consumes: Task 1 `factionGroups`, `relationsOf`, `PEOPLE`; Task 2 `portraitSrc`; Task 3 `storeConfig`, `readCheerRanking`.
- Produces: `export function rankingView(rows: { id: string; n: number }[], threshold = 30): { ready: boolean; rows: { id: string; n: number; rank: number }[] }`(합 < threshold면 ready false, 동점은 같은 순위).

- [ ] **Step 1: 실패하는 테스트** — `tests/peopleHub.test.tsx`
  - `rankingView([{id:'a',n:10},{id:'b',n:10}])` → ready false. 합 30 이상이면 ready true, 동점 rank 같음, 열전 없는 id는 빠짐.
  - 허브 렌더: 세력 제목 `위`·`촉`·`오`·`기타` 중 인물이 있는 것, 각 열전 링크 `/samguk/people/<id>`, 관계 글 목록에 `관우`와 `조조`가 한 줄에 함께 나오는 줄이 있음.
  - 순위 렌더(env 없음): `응원을 모으는 중` 문구와 열전 링크 목록.
- [ ] **Step 2: 실패 확인.**
- [ ] **Step 3: 구현** — 허브: 제목 `삼국지 인물 관계도 | 위·촉·오 인물 소개 – 운명을 읽다`, 세력별 `<details open>`(첫 세력만 open) 안에 `FactionMap`(그 세력 인물 원형 배치 SVG + 세력 안 관계선) + 인물 카드(초상화·이름·역할·열전 링크) + 관계 글 목록. 세력을 넘는 관계는 맨 아래 "세력을 넘는 관계" 글 목록. 순위: 제목 `삼국지 인물 순위 | 가장 응원받는 장수 – 운명을 읽다`, `export const revalidate = 3600`, 서버에서 `readCheerRanking`(env 없거나 실패면 빈 배열) → `rankingView` → 전체 순위 + 세력별 순위, 각 줄 열전 링크. 두 페이지 모두 canonical·BreadcrumbList, 쿠팡 배너(`people-hub`, `people-ranking`)는 본문 아래.
- [ ] **Step 4: E2E 추가** — 허브에서 열전 링크 하나 눌러 이동, 순위 페이지 `응원을 모으는 중`.
- [ ] **Step 5: 통과 확인** — 단위·seo-snippets·`e2e/people.spec.ts` PASS.
- [ ] **Step 6: 커밋** — `feat(people): 인물 관계도·응원 순위 페이지`

---

### Task 6: 연결·검색 (닮은꼴·공유 착지·일기토·사이트맵·메뉴)

**Files:**
- Modify: `src/app/samguk/(match)/page.tsx`(결과 ResultActions 근처), `src/components/share/SharePage.tsx`(kind `samguk`일 때), `src/app/samguk/duel/generals/[id]/page.tsx`, `src/app/sitemap.ts`, `src/content/navigation.ts`
- Test: `tests/peopleLinks.test.ts`

**Interfaces:**
- Consumes: Task 1 `getPerson`, `PEOPLE_IDS`.
- Produces: 없음(연결만).

- [ ] **Step 1: 실패하는 테스트** — `tests/peopleLinks.test.ts`
  - `SITEMAP_ROUTES`에 `/samguk/people`, `/samguk/people/ranking`, 모든 `/samguk/people/<id>` 포함, `LAST_MODIFIED`에 같은 키 모두 있음.
  - 소스 문자열 검사: 닮은꼴 결과 파일에 `/samguk/people/` 링크와 `#cheer`, `SharePage.tsx`에 `/samguk/people/`, 일기토 장수 페이지에 `인물열전 보기`.
  - `navigation.ts`에 `/samguk/people` 항목.
- [ ] **Step 2: 실패 확인.**
- [ ] **Step 3: 구현** — 닮은꼴 결과: 결과 장수에게 열전이 있을 때만 ResultActions 아래에 작은 링크 두 개 `<이름> 열전 보기`(→ `/samguk/people/<id>`)·`내가 닮은 장수 응원하기`(→ `/samguk/people/<id>#cheer`), 쿠팡 배너보다 위. 공유 착지(삼국지): 같은 `열전 보기` 링크. 일기토 장수 페이지: 본문 위쪽에 `인물열전 보기` 버튼(열전 있을 때). 사이트맵 날짜는 커밋 날짜. 메뉴: 얼굴 탭 목록의 `삼국지 일기토` 다음에 `{ title: '삼국지 인물열전', desc: '관계도·응원 순위와 장수별 열전', href: '/samguk/people', thumb: { image: '/images/samguk/제갈량.jpg' }, chip: '관계도' }`.
- [ ] **Step 4: 통과 확인** — `npm test` 전체 PASS(메뉴 항목 수·장수 수 문구 테스트 포함), `npm run test:e2e -- e2e/home.spec.ts e2e/tabbar.spec.ts` PASS.
- [ ] **Step 5: 커밋** — `feat(people): 닮은꼴·일기토·공유 착지에서 열전 연결, 사이트맵·메뉴`

---

### Task 7: 열전 20편 작성 (배치 4개, 각 배치마다 사실 검토 관문)

배치마다 별도 작성 에이전트 → 별도 검토 에이전트. 배치끼리는 서로 독립이라 병렬 가능(같은 파일을 건드리는 건 `index.ts` 등록 줄과 진행표뿐이므로 배치마다 순서대로 합친다).

| 배치 | id |
|---|---|
| A | liubei, zhangfei, zhugeliang, zhaoyun, lvbu |
| B | sunquan, zhouyu, simayi, xiaohoudun, xiahouyuan |
| C | xuchu, dianwei, zhangliao, machao, huangzhong |
| D | dongzhuo, diaochan, sunce, jiangwei, zhangjiao |

(스펙의 20명 + 일기토 12명을 모두 넣으려고 강유·장각을 더해 첫 공개는 22명이다.)

**Files (배치마다):** Create `src/content/samgukPeople/<id>.ts` 5개, Modify `src/content/samgukPeople/index.ts`, `docs/samguk-people-progress.md`.

- [ ] **Step 1: 작성** — Task 1의 "열전 쓰기 규칙"과 `caocao.ts`·`guanyu.ts`를 본보기로 5편. rivalId는 PEOPLE 안의 인물(배치 밖이면 이미 등록된 인물만). 관계는 같은 세력 핵심 인물과 혈연을 우선.
- [ ] **Step 2: 형식 테스트** — `npx vitest run tests/samgukPeople.test.ts tests/seo-snippets.test.tsx`가 사실 검토 칸을 빼고 통과(진행표 `사실 검토`가 아직 비어 있어 progress 테스트만 실패하는 것이 정상).
- [ ] **Step 3: 사실 검토(별도 에이전트)** — 연도·관계·최후·무기·명언 출처를 정사/배송지 주/연의와 대조. 틀리거나 확인 못 한 문장은 지우거나 고친다. 다른 사이트 문장과 거의 같은 문장이 보이면 다시 쓰게 돌려보낸다. 통과한 인물만 진행표 `사실 검토`·`열전`을 `O`.
- [ ] **Step 4: 통과 확인** — 같은 테스트 전부 PASS, `npm run test:e2e -- e2e/people.spec.ts`.
- [ ] **Step 5: 커밋** — `content(people): 열전 배치 <A|B|C|D> 5편`

---

### Task 8: MBTI 16개 검색 제목·설명 (열전과 독립)

**Files:**
- Modify: `src/app/mbti/[type]/page.tsx:20-21`, `src/components/mbti/MbtiArticle.tsx`(위쪽에 사진 테스트 한 줄)
- Test: `tests/seo-snippets.test.tsx`(MBTI 줄 추가)

- [ ] **Step 1: 실패하는 테스트** — MBTI 16개 제목이 `^${T} 특징·궁합 순위 \| ` 로 시작하고 별명을 포함, 설명에 `잘 맞는 유형 1위`와 실제 1위 유형(기존 `src/lib/mbti/compat`의 궁합 계산으로 구한 값) 포함, 기존 48자·110자 규칙 통과. MbtiArticle 렌더에 `/face2` 링크와 `내 얼굴은 무슨 상일까` 문구.
- [ ] **Step 2: 실패 확인.**
- [ ] **Step 3: 구현** — 제목 `${T} 특징·궁합 순위 | ${nickname} – 운명을 읽다`(48자 넘으면 nickname을 뺀 `${T} 특징·궁합 순위 – 운명을 읽다`), 설명 `${T}와 잘 맞는 유형 1위는 ${best}. 연애 스타일과 어울리는 직업, 여행지까지 정리했어요.` 같은 꼴(50~110자). OG 제목도 같은 문구.
- [ ] **Step 4: 통과 확인** — `npx vitest run tests/seo-snippets.test.tsx` PASS.
- [ ] **Step 5: 커밋** — `seo(mbti): 유형 페이지 제목을 특징·궁합 순위로`

---

### Task 9: 전체 검증

- [ ] `npm test`, `npx tsc --noEmit`, 바뀐 파일 `npx eslint <files>`(전체 lint는 기존 오류가 많아 바뀐 파일만), `npm run test:e2e` 전체 PASS.
- [ ] 개발 서버(3311)에서 `/samguk/people/guanyu`, `/samguk/people`, `/samguk/people/ranking`을 모바일 폭(375)으로 열어 스크린샷: 쿠팡 배너 최상단, 접힌 항목, 관계 그림이 글자와 겹치지 않음.
- [ ] 전체 브랜치 리뷰(가장 좋은 모델의 새 검토자 1명).

### Task 10: 배포와 검색 등록 (사용자 확인 후)

- [ ] 사용자에게 `docs/people-votes.sql`을 Supabase SQL Editor에서 실행해 달라고 요청(또는 사용자가 허락하면 Supabase MCP `apply_migration`으로 실행). 실행 전에는 응원·투표가 숫자 없이만 동작한다.
- [ ] 사용자 확인 뒤 `git push`(Vercel 자동 배포). 실제 사이트에서 제목·canonical·사이트맵 포함 확인.
- [ ] 네이버 서치어드바이저 웹 페이지 수집 요청: 새 URL 24개(열전 22 + 허브 + 순위). 구글 서치 콘솔 색인 요청: 허브·순위·조조·관우·제갈량·여포·하후돈 등 하루 한도 안에서.
- [ ] 진행표 `공개` 칸을 `O`로, 메모리에 공개일·다음 배치 기록.
