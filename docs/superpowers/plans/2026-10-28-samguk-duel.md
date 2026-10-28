# 삼국지 일기토 로그라이크 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** unse-ai.com `/samguk/duel`에 삼국지3 일기토 구도의 포케로그식 로그라이크 웹게임을 넣는다. 기존 초상화·능력치·공유·쿠팡·SEO 기반을 그대로 쓴다.

**Architecture:** 게임 로직(데이터·전투·진행·저장·열전·공유 키)은 React와 무관한 순수 TS 모듈 `src/lib/duel/`에 두고 vitest로 고정한다. 화면은 `src/components/duel/`의 클라이언트 컴포넌트가 Canvas 2D로 전투 장면을 그리고, 페이지·레이아웃·SEO·공유 착지·장수 페이지는 `src/app/samguk/duel/` 아래 사이트 관례대로 둔다. 모든 동작은 코드 트윈(프레임 1장)이며 스프라이트 시트 구조로 나중에 프레임을 늘릴 수 있다.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind 4(사이트 토큰), **Phaser 3.90.0**(렌더링·연출, 클라이언트 전용), Web Audio, vitest, Playwright. Supabase는 REST `fetch`.

**Spec:** `docs/superpowers/specs/2026-10-28-samguk-duel-design.md`

## Global Constraints

- 저장소 CLAUDE.md 규칙: 이모지 금지(제목·버튼·링크·메뉴), 디자인 토큰만 사용(`bg-navy-game`, `text-gold-game`, `font-pixel`, `bg-ink`, `text-paper` 등), 글꼴 굵기 900 금지, 옛 토큰(vermilion·gold·navy·paper-2) 금지.
- "돌아가기"는 홈으로(`useBackOrHome`), `router.back()` 금지.
- GA는 `track()`만, 허용 키 `test_name·result_id·method·slot·keyword`, 값은 `[A-Za-z0-9_가-힣]{1,24}` 이고 4자리 숫자 연속 금지. 사진·개인정보 전송 금지.
- 새 페이지 = `layout.tsx`(메타+JSON-LD+canonical) + `sitemap.ts`(`SITEMAP_ROUTES`·`LAST_MODIFIED`) + `pageGuides.ts` 본문(intro 300자 이상, highlights 3개 이상, faqs 4개 이상, related는 sitemap 안 라우트). 제목 48자·설명 50~110자, 브랜드 "운명을 읽다" 정확히 1회.
- 공유 착지 페이지(`/r/`)는 noindex, canonical은 `/samguk/duel`, 사이트맵 제외. 링크에는 결과 키만(개인정보 없음). OG는 `ogQuery.ts` 허용 목록 통과분만.
- 쿠팡 배너는 결과 화면에만, `no-screenshot`, 대가성 문구는 `CoupangBanner`가 그린다. 사진 테스트 흐름 금지 규칙은 일기토와 무관(사진 없음).
- 사진·얼굴 데이터는 다루지 않는다. localStorage에는 장수록·기록·진행 중 판·열전만.
- 상성 1.5 / 역상성 0.67 / 자속 1.2 / 난수 0.85~1.0. 동행 최대 3명. 15~20웨이브, 보스 3명(5~7웨이브 간격), 보스 후 전원 회복, 교체 턴은 상대 공짜 행동, 웨이브 사이 회복 없음.
- 스프라이트 128×128 PNG 투명 배경, 오른쪽을 향함, 적은 코드에서 반전. 파일 `public/images/samguk/sprites/<id>.png`. 초상은 기존 `public/images/samguk/<한글이름>.jpg`.
- 모바일 세로 화면 우선: 게임 영역이 390px 너비에서 가로 스크롤 없이 들어가고, 모든 버튼은 높이 44px 이상.

## Review Focus

1. **`?me=` 에 허용 목록 밖 id**(`?me=caocao`처럼 1차 명단에 없는 장수, 또는 쓰레기 값) — 무시하고 기본 시작 화면이 떠야 한다. → Task 8 테스트.
2. **진행 중 판 저장 데이터가 깨졌거나 옛 버전**(JSON 오류, 알 수 없는 장수 id, 스키마 버전 불일치) — 게임이 멈추지 않고 그 판만 버리고 장수록은 지킨다. → Task 4 테스트.
3. **공유 키 변조**(길이 초과, 모르는 id, 웨이브 99999) — 착지 페이지가 `/samguk/duel`로 리디렉션하고 OG가 400을 준다. → Task 6 테스트.
4. **localStorage 사용 불가**(사파리 사생활 모드·용량 초과) — 저장 실패를 삼키고 플레이는 계속된다. → Task 4 테스트.
5. **모바일 세로 390px**에서 캔버스·버튼이 넘치거나 탭바에 가려짐 — E2E 모바일 뷰포트 검사. → Task 12.

---

## 파일 구조

```
src/lib/duel/
  types.ts        공용 타입 (GeneralKind, Skill, DuelGeneral, Fighter, RunState …)
  generals.ts     1차 명단 13명: samgukDB 참조 + 유형·속도·기술 id·스프라이트 파일명
  skills.ts       기술 정의 (유형·위력·효과·횟수)
  rng.ts          시드 난수 (테스트·E2E 재현용)
  battle.ts       상성·피해·턴 순서·기술 효과·교체 (한 턴 = 순수 함수)
  run.ts          웨이브표·경험치·항복·보상·판 상태 전이 (한 판 = 순수 함수)
  rewards.ts      보상 카드 정의·뽑기
  narrative.ts    열전 생성 (기록 → 문장)
  save.ts         localStorage 직렬화 (장수록·기록·진행 중·열전 히스토리), 버전·오류 내성
  shareKey.ts     결과 키 인코딩/디코딩 + 검증
src/components/duel/
  DuelClient.tsx  화면 상태 기계 (시작 → 전투 → 보상 → 결과), GA, 저장 호출
  BattleCanvas.tsx 캔버스 렌더 + 연출 큐 (트윈·흔들림·컷인)
  animations.ts   트윈 정의 (순수 함수, 시간 → 위치/알파)
  sfx.ts          Web Audio 칩튠 효과음
  StartScreen.tsx 장수록·시작 장수 선택·행군 기록
  BattleHud.tsx   초상·이름·유형·체력, 기술 4개 + 교체, 메시지 창
  RewardPick.tsx  카드 3장
  ResultScreen.tsx 열전·공유·피드백·쿠팡·다음 테스트
  FeedbackForm.tsx 별점+한 줄 → /api/duel/feedback
src/app/samguk/duel/
  layout.tsx, page.tsx
  r/[key]/page.tsx                공유 착지
  generals/[id]/page.tsx          장수 페이지(정적)
src/app/api/duel/feedback/route.ts
tests/duel/*.test.ts, e2e/duel.spec.ts
public/images/samguk/sprites/*.png
```

---

### Task 1: 장수·기술 데이터

**Files:**
- Create: `src/lib/duel/types.ts`, `src/lib/duel/skills.ts`, `src/lib/duel/generals.ts`
- Test: `tests/duel/generals.test.ts`

**Interfaces:**
- Produces:
  - `type GeneralKind = '맹장' | '기장' | '지장'`
  - `interface Skill { id: string; name: string; kind: GeneralKind; power: number; uses: number | null; effect?: 'burn' | 'confuse' | 'ambush' | 'taunt' | 'guard' | 'heal' | 'shout' }` (`uses: null` = 무제한)
  - `interface DuelGeneral { id: string; name: string; kind: GeneralKind; speed: number; skills: [string, string, string, string]; role: 'starter' | 'recruit' | 'boss' | 'mob'; sprite: string; stats: { 통솔: number; 무력: number; 지력: number; 매력: number } }` (stats는 `getCharacterById`에서 복사)
  - `DUEL_GENERALS: DuelGeneral[]`, `getDuelGeneral(id): DuelGeneral | undefined`, `STARTER_IDS = ['guanyu','zhangfei','zhaoyun'] as const`, `BOSS_IDS = ['zhangjiao','dongzhuo','lvbu'] as const`, `MOB_ID = 'mob'`
  - `SKILLS: Record<string, Skill>`, 공용 기술 id `strike`(기본 공격, 맹장), `thrust`(기본, 기장), `scheme`(기본, 지장), `guard`, `shout`, `breathe`, `fire`, `confuse`, `ambush`, `taunt`

**결정:** 보스 1은 **장각**(지장, 초상 있음, 황건적 졸개 웨이브의 우두머리라는 서사 일치). 화웅은 명단에서 뺀다(스펙 7절 "빌더 판단"). 졸개 `mob`은 samgukDB에 없으므로 generals.ts 안에서 stats를 직접 둔다(통솔 40 무력 45 지력 20 매력 10).

**속도 기본값:** 기장 70 / 맹장 55 / 지장 45, 장수별 보정은 generals.ts 주석으로 근거를 쓴다(조운·마초 +10, 여포 +10, 동탁 −10).

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/duel/generals.test.ts`
  - 모든 `DUEL_GENERALS`(mob 제외)의 id가 `samgukCharacters`(초상 있는 장수)에 있고 stats가 samgukDB 값과 같다
  - 장수마다 skills 4개가 전부 `SKILLS`에 있고, 그중 자기 kind 기술이 1개 이상, 필살기(`uses !== null`)가 1개 이상
  - `STARTER_IDS`·`BOSS_IDS` 전부 `getDuelGeneral`로 찾아진다, `role`이 맞다
  - 유형별 장수 수: 맹장·기장·지장 각 2명 이상
- [ ] **Step 2: 실패 확인** — `npx vitest run tests/duel/generals.test.ts` → 모듈 없음으로 FAIL
- [ ] **Step 3: types.ts, skills.ts, generals.ts 작성** (스펙 7·8절의 명단·유형·필살기 이름 그대로: 관우 청룡언월도 참, 장비 장판교 호통, 조운 칠진칠출, 여포 방천화극 난무, 주유 적벽 화계, 마초 서량철기, 황충 백발백중(활·기장), 허저 호치돌격, 하후돈 척안맹공, 강유 구벌중원, 장각 태평요술(confuse), 동탁 폭정(taunt))
- [ ] **Step 4: 통과 확인** — 같은 명령 PASS
- [ ] **Step 5: 커밋** — `git add src/lib/duel tests/duel && git commit -m "일기토: 장수·기술 데이터"`

---

### Task 2: 전투 한 턴

**Files:**
- Create: `src/lib/duel/rng.ts`, `src/lib/duel/battle.ts`
- Test: `tests/duel/battle.test.ts`

**Interfaces:**
- Consumes: Task 1
- Produces:
  - `rng.ts`: `createRng(seed: number): () => number` (mulberry32, [0,1)) 
  - `interface Fighter { id: string; level: number; hp: number; maxHp: number; uses: Record<string, number>; status: { burn?: number; confuse?: number; ambush?: boolean; taunt?: number; guard?: boolean }; bonus: { atk: number; int: number; speed: number } }`
  - `makeFighter(id: string, level: number): Fighter` — maxHp = 통솔 × 2 + level × 6 *(제 판단)*
  - `matchup(a: GeneralKind, d: GeneralKind): 1.5 | 1 | 0.67`
  - `damage(att: Fighter, def: Fighter, skill: Skill, rng): number` — 스펙 공식, 공격 능력치 = 맹장·기장 무력(+bonus.atk), 지장 지력(+bonus.int); 기장은 `(무력 + speed/4)`; 최소 1
  - `type Action = { type: 'skill'; skillId: string } | { type: 'switch'; toIndex: number }`
  - `resolveTurn(state: BattleState, playerAction: Action, rng): { state: BattleState; log: TurnEvent[] }` — 속도 순(동속은 플레이어 먼저), 교체면 플레이어 행동 없이 적만 행동, 기술 uses 감소, 효과 적용(burn: 턴 끝 maxHp 8% 피해 3턴, confuse: 다음 행동 50% 실패, ambush: 다음 피격 시 반격 50% 위력, taunt: 2턴 동안 기본 공격만, guard: 그 턴 피해 절반, heal: maxHp 30%, shout: 상대 다음 피해 0.8배)
  - `interface BattleState { party: Fighter[]; active: number; enemy: Fighter; turn: number }`
  - `type TurnEvent = { who: 'player' | 'enemy'; kind: 'skill' | 'switch' | 'hit' | 'miss' | 'status' | 'ko' | 'counter'; skillId?: string; amount?: number; text: string }`
  - `enemyAction(state, rng): Action` — 상성 유리 기술 우선, 체력 30% 이하면 guard/heal 있으면 30% 확률로 사용
- [ ] **Step 1: 실패하는 테스트** — `tests/duel/battle.test.ts`
  - `matchup('맹장','기장')===1.5`, `matchup('기장','맹장')===0.67`, 같은 유형 1
  - 자속: 관우가 `strike`(맹장) 쓸 때 피해가 같은 위력의 지장 기술보다 1.2배(난수 고정 1.0으로 시드 주입)
  - 피해 범위: 시드 100개 돌려 `0.85~1.0` 배 안, 최소 1
  - 교체 턴: `{type:'switch',toIndex:1}` 후 active=1이고 log에 enemy 행동만 있다
  - 필살기 uses가 0이면 resolveTurn이 기본 공격으로 대체하고 log에 `miss` 아닌 `text`에 "힘이 남지 않았다"
  - burn 3턴 후 사라짐, guard 턴 피해 절반(동일 시드 비교)
  - ko: hp 0 → `ko` 이벤트
  - 동일 시드·동일 입력 → 동일 결과(결정성)
- [ ] **Step 2: 실패 확인** — `npx vitest run tests/duel/battle.test.ts`
- [ ] **Step 3: rng.ts, battle.ts 구현** (한 턴은 입력 상태를 바꾸지 않고 새 상태를 돌려준다)
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: 커밋** — `"일기토: 전투 한 턴(상성·피해·교체·효과)"`

---

### Task 3: 한 판의 진행(웨이브·레벨·항복·보상·클리어)

**Files:**
- Create: `src/lib/duel/rewards.ts`, `src/lib/duel/run.ts`
- Test: `tests/duel/run.test.ts`

**Interfaces:**
- Consumes: Task 1, 2
- Produces:
  - `rewards.ts`: `interface Reward { id: string; name: string; desc: string; rarity: 'common' | 'rare'; apply(run: RunState, targetIndex?: number): RunState }`, `REWARDS: Reward[]` — 명마(적토마 speed+15 rare, 준마 speed+8), 명기(청룡언월도: guanyu 전용 atk+15 rare, 보검 atk+8), 병법서(int+10, 또는 fire 기술 습득 rare), 회복약(선택 1명 50%), 부활약(쓰러진 1명 50% rare), 새 공용 기술(ambush/taunt 중), 동행 자리+1(1회, rare). `drawRewards(run, rng): Reward[]` 3장, 중복 없음, 쓸 수 없는 카드(부활 대상 없음 등) 제외, rare 확률 25%.
  - `run.ts`:
    - `const WAVES = 18`, `BOSS_WAVES = [6, 12, 18]` → 장각·동탁·여포
    - `interface RunState { seed: number; wave: number; party: Fighter[]; partyMax: 3 | 4; roster: string[]; enemy: Fighter | null; phase: 'battle' | 'reward' | 'won' | 'lost'; battle: BattleState | null; record: RunRecord; rewardsOffered: string[] }`
    - `interface RunRecord { starter: string; waves: { wave: number; enemy: string; turns: number; finisher?: string; lostAlly?: string; recruited?: boolean }[]; rewards: string[]; cleared: boolean }`
    - `startRun(starterId: string, seed: number): RunState`
    - `nextEnemyId(run, rng): string` — 1~3 mob, 4~5 recruit급, 보스 웨이브는 BOSS, 나머지 recruit/starter(동행 제외, 한 판 1회), 레벨 = wave × 1 + 보스 +3
    - `playerTurn(run, action, rng): RunState` — resolveTurn 호출, 적 ko면 `afterWin`, 전원 ko면 phase 'lost'
    - `afterWin(run, rng): RunState` — 경험치: 전원 +(10 + wave×2), 레벨업 100 단위(maxHp 재계산·현재 hp 비례 유지), 항복 판정: 이름 있는 적이고 role !== 'boss', 확률 = 0.25 + (선두 매력−50)/200 − (적 level−wave)/20 (0.05~0.8로 클램프), 성공이면 record.recruited=true·roster에 추가·동행 자리 있으면 합류, 보스면 전원 hp=maxHp, wave===18 이면 phase 'won' record.cleared=true, 아니면 phase 'reward' + rewardsOffered
    - `pickReward(run, rewardId, targetIndex?): RunState` → phase 'battle', wave+1, 새 enemy
    - `swapInRecruit(run, recruitId, outIndex): RunState` (동행 꽉 찼을 때)
- [ ] **Step 1: 실패하는 테스트** — `tests/duel/run.test.ts`
  - `startRun('guanyu', 1)`: wave 1, party 1명 lv1, enemy는 mob
  - 시드 고정으로 18웨이브까지 플레이어가 항상 `strike`만 눌러도 상태 전이가 끊기지 않고 phase가 won 또는 lost로 끝난다(자동 플레이 루프, 500턴 상한)
  - 보스 웨이브 6·12·18 의 적 id가 zhangjiao·dongzhuo·lvbu
  - 보스 승리 후 전원 hp===maxHp; 일반 승리 후 hp가 회복되지 않는다
  - 같은 이름 있는 장수가 한 판에 두 번 나오지 않는다(여러 시드)
  - 항복 확률이 0.05~0.8 사이, 보스는 항복 안 함
  - `drawRewards`는 3장·중복 없음, 쓰러진 아군 없으면 부활약 없음
  - 열전 재료: 승리마다 record.waves에 turns·finisher가 쌓인다
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: rewards.ts, run.ts 구현**
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: 커밋** — `"일기토: 한 판의 진행(웨이브·레벨·항복·보상·클리어)"`

---

### Task 4: 저장

**Files:**
- Create: `src/lib/duel/save.ts`
- Test: `tests/duel/save.test.ts`

**Interfaces:**
- Consumes: Task 3 `RunState`, `RunRecord`
- Produces:
  - `const SAVE_VERSION = 1`, 키 `unse-duel:v1`
  - `interface SaveData { version: 1; roster: string[]; best: { wave: number; clears: number }; history: RunRecord[]; current: RunState | null }`
  - `loadSave(storage: Pick<Storage,'getItem'|'setItem'|'removeItem'> | null): SaveData` — 없거나 깨지면 기본값(roster = STARTER_IDS), 버전 다르면 current만 버림, current의 장수 id가 `getDuelGeneral`에 없으면 current 버림
  - `writeSave(storage, data): boolean` — 예외 삼키고 false
  - `recordRunEnd(data, record): SaveData` — history 앞에 추가(최대 20), best 갱신, cleared면 clears+1, roster에 record의 영입 장수 합집합
- [ ] **Step 1: 실패하는 테스트** — 가짜 storage 객체로: 빈 저장 → 기본값; 잘못된 JSON → 기본값(throw 없음); version 0 → roster 유지·current null; 알 수 없는 id 든 current → null; setItem이 throw → writeSave false; history 21개 → 20개 유지; best.wave는 최대값
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: save.ts 구현**
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: 커밋** — `"일기토: 저장(장수록·기록·진행 중 판) 버전·오류 내성"`

---

### Task 5: 열전 생성

**Files:**
- Create: `src/lib/duel/narrative.ts`
- Test: `tests/duel/narrative.test.ts`

**Interfaces:**
- Consumes: Task 3 `RunRecord`, Task 1 이름
- Produces:
  - `narrate(record: RunRecord): { title: string; lines: string[]; headline: string }` — `headline`은 공유 한 줄(예: "관우, 열일곱째 싸움에서 여포에게 아홉 합 끝에 쓰러지다" / 클리어: "관우, 열여덟째 싸움에서 여포를 꺾고 천하에 이름을 떨치다"), `lines`는 스펙 12절 문체의 문장 3~8개. 서수는 `ORDINALS` 배열(첫째…스무째), 합 수는 한글 수사(`koreanCount`), 조사는 `josa`(`@/lib/shareLinks`).
  - 문장 틀은 종류별 2~3개(졸개 연승 묶기, 보스 승리, 영입, 아군 전사, 보상 중 rare, 마지막 싸움)로 record 내용으로 결정적으로 고른다(난수 없음).
- [ ] **Step 1: 실패하는 테스트** — 고정 record 3종(클리어/6웨이브 패배/영입·전사 포함)으로: headline에 선두 장수 이름과 마지막 상대 이름이 있다; 클리어면 "꺾고"가 들어가고 패배면 "쓰러지"가 들어간다; lines 길이 3~8; 같은 record → 같은 출력; 졸개 3연승은 한 문장으로 묶인다("황건적을 셋 베고"); 이모지 없음
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: narrative.ts 구현**
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: 커밋** — `"일기토: 열전 생성"`

---

### Task 6: 공유 키·착지 페이지·OG

**Files:**
- Create: `src/lib/duel/shareKey.ts`, `src/app/samguk/duel/r/[key]/page.tsx`
- Modify: `src/lib/shareLinks.ts` (duel 헬퍼 추가), `src/lib/ogQuery.ts` (`duel: ['key']`), `src/app/api/og/result/route.tsx` (duel 분기), `src/lib/analytics.ts` (`TestName`에 `'duel'`)
- Test: `tests/duel/shareKey.test.ts`, `tests/sharePages.test.tsx`(duel 케이스 추가)

**Interfaces:**
- Consumes: Task 3 `RunRecord`, Task 5 `narrate`
- Produces:
  - `encodeRunKey(record: RunRecord): string` — `<starter>.<lastEnemy>.<wave>.<c|l>.<turns>` 를 base64url 없이 그대로(영문 id·숫자·점만, 60자 이하). 예 `guanyu.lvbu.17.l.9`
  - `decodeRunKey(key: string): { starter: string; lastEnemy: string; wave: number; cleared: boolean; turns: number } | null` — 형식·허용 id·wave 1~18·turns 1~99 검증
  - `shareLinks.ts`: `duelShareUrl(record): string` (`${SITE}/samguk/duel/r/${key}?utm…campaign=duel`), `duelShared(key): { headline: string; starterName: string; image: string } | null` (headline은 decode 결과로 짧은 열전 한 줄 재구성: `narrate`에 넘길 최소 record를 만들어 headline만 사용), `ogImageUrl('duel', key)`
  - 착지 페이지: `generateMetadata` noindex, canonical `/samguk/duel`, OG 이미지 `kind=duel&key=`; 본문은 선두 장수 초상 + headline + "나도 일기토 하기"(`/samguk/duel`) + GA `shared_landing(test_name:'duel', result_id: starter)`. 키가 null이면 `redirect('/samguk/duel')`.
  - OG 분기: `big = headline` 대신 `big = starterName`, `score = cleared ? '여포를 꺾다' : `${wave}번째 싸움까지``, `phrase = headline`, `label = '삼국지 일기토'`, image = 선두 초상(기존 samguk 분기와 같은 fetch 방식).
- [ ] **Step 1: 실패하는 테스트** — encode→decode 왕복; `'guanyu.lvbu.99.l.9'` null; `'caocao.lvbu.3.l.2'`(명단 밖) null; 60자 넘는 키 null; `ogQueryOk(new URLSearchParams('kind=duel&key=guanyu.lvbu.17.l.9'))` true, `kind=duel&key=…&s=70` false; sharePages 테스트에 duel 착지가 noindex·canonical 규칙을 따른다
- [ ] **Step 2: 실패 확인** — `npx vitest run tests/duel/shareKey.test.ts tests/sharePages.test.tsx`
- [ ] **Step 3: 구현** (OG 라우트는 기존 분기 스타일을 따라 `else if (kind === 'duel')` 추가)
- [ ] **Step 4: 통과 확인** + `npx vitest run tests/shareLinks.test.ts tests/analytics.test.ts`
- [ ] **Step 5: 커밋** — `"일기토: 공유 키·착지 페이지·OG 미리보기"`

---

### Task 7: Phaser 게임 뼈대와 전투 연출

> 2026-10-28 방향 전환(의뢰인): 자체 Canvas 루프 대신 **Phaser 3** 엔진 위에서 게임이 돈다. 이전 Task 7 커밋(7c357db)의 `animations.ts`(타임라인)·`sfx.ts`는 재사용하고, `fieldRenderer.ts`의 그리기 코드는 텍스처 생성에 재사용하며, `BattleCanvas.tsx`는 제거한다.

**Files:**
- Modify: `package.json` (`phaser` **3.90.0** 고정, Phaser 4.x 금지)
- Create: `src/game/duel/config.ts`, `src/game/duel/bridge.ts`, `src/game/duel/textures.ts`, `src/game/duel/BootScene.ts`, `src/game/duel/BattleScene.ts`, `src/game/duel/ui.ts`(캔버스 UI 그리기 헬퍼: 베벨 상자·표찰·체력바·커서), `src/game/duel/createDuelGame.ts`
- Move: `src/components/duel/animations.ts` → `src/game/duel/timeline.ts`(내용 유지, import 경로만), `src/components/duel/sfx.ts` → `src/game/duel/sfx.ts`, `src/components/duel/fieldRenderer.ts` → `src/game/duel/fieldPainter.ts`(React 무관 그리기 함수만 남김)
- Delete: `src/components/duel/BattleCanvas.tsx`
- Test: `tests/duel/timeline.test.ts`(기존 animations 테스트 이동), `tests/duel/textures.test.ts`, `tests/duel/bridge.test.ts`

**Interfaces:**
- Consumes: `src/lib/duel/*`(battle.ts `resolveTurn`/`enemyAction`, run.ts `playerTurn`/`afterWin`, types), `eventsToTimeline(events, sides)` from `timeline.ts`
- Produces:
  - `config.ts`: `GAME_W = 320`, `GAME_H = 240`, `FIELD = { x: 12, y: 78, w: 296, h: 70 }`, `PALETTE`(와꾸 v5의 S 객체 값 그대로: navy, green1~3, gold, gold2, red, cream, cream2, ink, blue, white), `SPRITE_PX = 34`
  - `bridge.ts`: `class DuelBridge extends Phaser.Events.EventEmitter` — React→Phaser: `bridge.emit('run:start', { run: RunState, seed })`, `bridge.emit('run:update', { run })`; Phaser→React: `'ui:action'`(`{ type: 'skill', skillId } | { type: 'switch', toIndex } | { type: 'reward', rewardId, targetIndex? } | { type: 'result', action: 'share'|'retry'|'samguk' } | { type: 'rate', stars }`), `'anim:done'`, `'scene:changed'`(`{ scene: 'battle'|'reward'|'result' }`). `window.__duel = { phase, wave, scene }`를 `'scene:changed'`·`'run:update'` 때 갱신(E2E 디버그 훅; production에서도 무해).
  - `textures.ts`: `makeTextures(scene: Phaser.Scene)` — HTMLCanvas에 `fieldPainter`로 벌판(296×70)·천 바탕(320×240)·장식 틀을 1회 그려 `scene.textures.addCanvas('field'|'cloth'|'frame', canvas)`; 초상은 BootScene이 `load.image('portrait:<id>', '/images/samguk/<이름>.jpg')`, 스프라이트는 `load.image('sprite:<id>', '/images/samguk/sprites/<id>.png')` + 실패 시 `'sprite:mob'` → 색 사각형 텍스처 폴백.
  - `BootScene`: 에셋 로드 → `makeTextures` → `scene.start('Battle')`
  - `BattleScene`: 레이아웃은 와꾸 v5 draw1과 같다 — 천 바탕, 틀, 양쪽 베벨 액자 초상(46×54) + 이름 + 표찰(무력·통솔) + 유형·레벨, WAVE/TURN 텍스트, 벌판(296×70) 안에 두 스프라이트(34px, 양 끝, `flipX`로 방향), 벌판 아래 파랑/빨강 체력바 + 숫자, 왼쪽 아래 명령 메뉴(▶ 커서, 기술 4개 + 교체 줄), 오른쪽 아래 크림색 대사창(▼). **보이는 UI는 전부 Phaser 오브젝트**(Graphics/Image/Text). 입력은 React의 투명 DOM 버튼이 `bridge`로 보낸다(Phaser 내부 포인터 입력은 메뉴 커서 이동 정도만).
  - 연출: `eventsToTimeline`의 항목을 Phaser 트윈/타임라인으로 — `pass`: 둘 다 가운데로 돌진(tween x) → 충돌 지점에서 `clash`면 `cameras.main.shake(120, 0.004)` + 불꽃(파티클 또는 3프레임 Graphics) + 피해 텍스트 tween(위로 뜨며 사라짐) → 서로 지나쳐 반대편에 정지(`flipX` 토글, sidesAfter 반영); 빗나감·가드는 불꽃 없음; `cutin`: 돌진 중 가운데 정지 → 검은 반투명 Rect(alpha .65) → 공격자 초상 확대 컷인(tween scale) + 기술명 → `strike`: 흰 호 3프레임 + 피해 텍스트 → 계속 지나침; `ko`: 패자 alpha 1→0, y +20, scale .9 (600ms); `text`: 대사창 갱신. 재생이 끝나면 `bridge.emit('anim:done')`. `prefers-reduced-motion`이면 shake 생략·2배속.
  - 효과음: `sfx.ts`(Web Audio 합성 유지; Phaser 오디오로 바꾸는 것은 범위 밖) — clash→hit, cutin→cutin, strike→slash, ko→ko, 메뉴 이동→card.
  - `createDuelGame(parent: HTMLElement, bridge: DuelBridge): Phaser.Game` — `{ type: Phaser.AUTO, parent, width: 320, height: 240, pixelArt: true, roundPixels: true, scale: { mode: Phaser.Scale.FIT, autoCenter: CENTER_BOTH, zoom: Phaser.Scale.MAX_ZOOM }, backgroundColor: PALETTE.green1, scene: [BootScene, BattleScene] }`; `game.destroy(true)`는 호출자 몫.
  - 글꼴: 숫자 `Silkscreen`, 한글 `"Noto Sans KR"`(Galmuri 승인 후 `public/fonts/`에 넣고 `@font-face` + `document.fonts.load` 뒤 Boot). `Phaser.GameObjects.Text`의 `resolution: 1`로 도트 느낌 유지.
- [ ] **Step 1: 실패하는 테스트** — `tests/duel/bridge.test.ts`: `DuelBridge`가 `'ui:action'`을 발행·수신하고 `window.__duel`을 갱신한다(jsdom 없이 `globalThis.window` 스텁); `tests/duel/textures.test.ts`: `fieldPainter`의 `paintField(ctx, 296, 70)`·`paintCloth(ctx)`·`paintFrame(ctx)`가 모의 2D 컨텍스트에서 예외 없이 끝나고 fillRect 호출 수가 0보다 크다; `tests/duel/timeline.test.ts`: 기존 animations 테스트가 새 경로에서 통과
- [ ] **Step 2: 실패 확인** — `npx vitest run tests/duel`
- [ ] **Step 3: 구현** — `npm i phaser@3.90.0 --save-exact`; 파일 이동·생성; Phaser는 `import Phaser from 'phaser'`로만 `src/game/**`에서 import(서버 번들에 섞이지 않게 `src/components`나 `src/lib`에서는 import 금지, 테스트는 Phaser를 import하지 않는 모듈만 대상)
- [ ] **Step 4: 통과 확인** — `npx vitest run tests/duel`, `npx tsc --noEmit`, `npx eslint src/game tests/duel`, `npx next build`가 Phaser 청크를 클라이언트 전용으로 분리하는지(빌드 성공) 확인
- [ ] **Step 5: 커밋** — `"일기토: Phaser 3 게임 뼈대와 전투 연출"`

---

### Task 8: 게임 화면(React 마운트·보상·결과·시작)

**Files:**
- Create: `src/game/duel/RewardScene.ts`, `src/game/duel/ResultScene.ts`, `src/game/duel/StartScene.ts`, `src/components/duel/DuelClient.tsx`, `src/components/duel/DuelMount.tsx`(dynamic ssr:false 로더), `src/components/duel/OverlayButtons.tsx`(투명 DOM 버튼), `src/app/samguk/duel/page.tsx`
- Modify: `src/app/samguk/page.tsx:217-223` (ResultActions `lead`를 `{ label: "이 장수로 일기토 하기", href: `/samguk/duel?me=${result.character.id}` }`로 바꾸고 "우리 팀 삼국지 만들기"는 `companion`으로 이동), `src/game/duel/createDuelGame.ts`(장면 등록 추가)
- Test: `tests/duel/duelClient.test.ts`(`resolveStarterUnlock`, `overlayLayout`), `tests/nextTests.test.tsx`·`tests/design.test.tsx` 통과 유지

**Interfaces:**
- Consumes: Task 1~7 전부(`startRun`, `playerTurn`, `afterWin`, `pickReward(run, id, rng, target?)`, `swapInRecruit(run, id, out, rng)`, `drawRewards`, `loadSave/writeSave/recordRunEnd`, `narrate`, `duelShareUrl`, `ogImageUrl('duel', key)`, `encodeRunKey`, `DuelBridge`, `createDuelGame`), `useResultShare`, `CoupangBanner`, `FeedbackForm`(Task 10), `track`, `useBackOrHome`
- Produces:
  - `resolveStarterUnlock(me: string | null, roster: string[]): string[]` — `me`가 starter/recruit면 roster에 합치고 아니면 그대로(순수, 테스트)
  - `overlayLayout(scene: 'start'|'battle'|'reward'|'result', n?: number): { id: string; x: number; y: number; w: number; h: number; label: string }[]` — 320×240 설계 좌표의 투명 버튼 자리(전투: 기술 4개는 메뉴 줄 위치 118×13 → 높이 44px CSS를 보장하려면 캔버스 배율로 환산해 `min-height:44px`; 교체 1; 보상: 카드 3; 결과: 버튼 3 + 별 5; 시작: 장수록 목록 n개 + 출진). 순수 함수, 테스트.
  - `DuelClient`("use client"): 상태 = `RunState | null` + `screen`; `?seed=` 있으면 그 시드, `?me=`는 `resolveStarterUnlock`; 게임 규칙 호출은 전부 React 쪽(`bridge.on('ui:action')` → `playerTurn`/`pickReward`/… → `bridge.emit('run:update')`), Phaser는 그리기와 연출만; 턴마다 `writeSave`; 결과에서 `recordRunEnd`; GA `test_start(duel)`·`result_view(duel, result_id: starterId)`; 공유는 `useResultShare` meta `{ testName:'duel', title: headline, text: headline, url: duelShareUrl(record), imageUrl: ogImageUrl('duel', encodeRunKey(record)) }`를 결과 화면 "공유하기" 투명 버튼에 연결; "내 얼굴은 어떤 장수?" → `/samguk`; "다시 출진" → 시작 화면; 별점 → `FeedbackForm`이 캔버스 아래에 펼쳐짐; `CoupangBanner subId="samguk-duel"`은 결과 화면에서만 캔버스 아래 DOM.
  - `DuelMount`: `dynamic(() => import('./DuelClient'), { ssr: false, loading: 로딩 문구 })`; 컨테이너 `max-w-[480px] mx-auto`, 캔버스 래퍼 `aspect-ratio: 4/3`, 언마운트 시 `game.destroy(true)`.
  - `StartScene`: 장수록(초상 썸네일 + 이름 + 유형, 잠긴 장수는 어둡게), 최고 기록/클리어, 행군 기록(열전 제목 목록) 창; `RewardScene`: 와꾸 v5 draw2(카드 3장 + 동행/다음 전투 창); `ResultScene`: draw3(초상 + 열전 제목·한 줄 + 열전 본문 창 + 버튼 3 + 별점 줄). 세 장면 모두 `bridge.emit('scene:changed')`.
  - `page.tsx`: `<TestHeader title="삼국지 일기토" />` + `<DuelMount />`; 그 아래는 Task 9의 PageGuide.
  - 모바일: 캔버스 CSS 폭 100%(최대 480px), 투명 버튼은 캔버스 위 `position:absolute`에 비율 배치, 각 `min-height:44px`·`aria-label`, 포커스 시 캔버스 커서 이동(`bridge.emit('ui:focus', id)`).
- [ ] **Step 1: 실패하는 테스트** — `resolveStarterUnlock('zhouyu', ['guanyu'])`에 zhouyu 포함; `'caocao'`·`'<script>'`·null·`'lvbu'`(boss)는 변화 없음; `overlayLayout('battle')`이 5개(기술 4 + 교체)를 돌려주고 모두 320×240 안에 있으며 서로 겹치지 않는다; `overlayLayout('result')`는 8개
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: 구현** — 장면·컴포넌트·페이지; `npx next dev -p 3311`로 한 판 끝까지 수동 확인(모바일 뷰 390px, 투명 버튼이 메뉴 줄과 맞는지, 교대 돌진이 보이는지)
- [ ] **Step 4: 통과 확인** — `npx vitest run tests/duel tests/design.test.tsx tests/nextTests.test.tsx`, `npx tsc --noEmit`, `npx next build`
- [ ] **Step 5: 커밋** — `"일기토: 게임 화면(시작·전투·보상·결과)과 삼국지 결과 연결"`

---

### Task 9: 레이아웃·SEO·메뉴·장수 페이지

**Files:**
- Create: `src/app/samguk/duel/layout.tsx`, `src/app/samguk/duel/generals/[id]/page.tsx`, `src/content/duelGuide.ts`(장수별 소개 문단 13개)
- Modify: `src/content/pageGuides.ts` (`GuideRoute`에 `'/samguk/duel'`, `TEST_LINKS`, `pageGuides` 항목; `/samguk` related에 추가), `src/app/sitemap.ts` (`'/samguk/duel'`, `'/samguk/duel/generals/<id>'` 12개, 날짜 `'2026-10-28'`), `src/content/navigation.ts` (face 묶음에 `{ title:'삼국지 일기토', desc:'관우·여포와 벌이는 로그라이크 일기토', href:'/samguk/duel', thumb:{ image:'/images/samguk/여포.jpg' }, chip:'미니게임' }`; `tabForPath`는 `/samguk` prefix라 이미 face)
- Test: 기존 `tests/pageGuides.test.ts`, `tests/sitemap.test.ts`, `tests/seo-snippets.test.tsx`, `tests/navigation.test.ts`, `tests/hubs.test.ts` + `tests/duel/generalsPages.test.ts`

**Interfaces:**
- Produces: `DUEL_GENERAL_INTRO: Record<string, { lines: string[]; signature: string }>` (장수당 본문 300자 이상), `generateStaticParams`로 12명(mob 제외)

**복사 고정:** layout TITLE `"삼국지 일기토 미니게임 – 관우·여포 로그라이크 – 운명을 읽다"`(48자 이하 확인), DESCRIPTION `"삼국지3 감성 도트 일기토. 장수 하나로 시작해 적장을 영입하고 여포까지 도전하는 무료 로그라이크 웹게임. 설치 없이 바로 플레이."`(50~110자). JSON-LD `VideoGame` + BreadcrumbList(운명을 읽다 → 삼국지 닮은꼴 → 삼국지 일기토).

- [ ] **Step 1: 실패하는 테스트** — `tests/duel/generalsPages.test.ts`: 12명 전원 intro 300자 이상·`signature`(필살기 이름)가 SKILLS에 있음; sitemap에 `/samguk/duel`과 generals 12개; pageGuides `/samguk/duel` 존재·related에 `/samguk`
- [ ] **Step 2: 실패 확인** — `npx vitest run tests/duel/generalsPages.test.ts tests/pageGuides.test.ts tests/sitemap.test.ts`
- [ ] **Step 3: 구현** — 장수 페이지: 초상(큰 것) + 코에이 능력치 표(기존 `/samguk` "코에이 능력치 보기"와 같은 표) + 유형·속도 + 기술 4개(이름·유형·위력·횟수) + 소개 문단 + "이 장수로 시작"(`/samguk/duel?me=<id>`, starter/recruit만) + 다른 장수 링크 12개. 메타는 `generateMetadata`로 "<이름> 일기토 능력치·필살기 – 운명을 읽다".
- [ ] **Step 4: 통과 확인** — `npm test` 전체
- [ ] **Step 5: 커밋** — `"일기토: 레이아웃·SEO·메뉴·장수 페이지"`

---

### Task 10: 피드백 API

**Files:**
- Create: `src/app/api/duel/feedback/route.ts`, `src/components/duel/FeedbackForm.tsx`, `src/lib/duel/feedback.ts`
- Test: `tests/duel/feedback.test.ts`

**Interfaces:**
- Produces:
  - `feedback.ts`: `validateFeedback(body: unknown): { rating: 1|2|3|4|5; note: string; wave: number; starter: string; cleared: boolean; device: 'mobile'|'desktop' } | null` — note 200자 이하 trim, wave 1~18, starter는 DUEL_GENERALS id, 그 외 키 무시
  - route `POST`: 검증 실패 400; 환경변수 `SUPABASE_URL`·`SUPABASE_SERVICE_KEY` 없으면 503(게임은 영향 없음); 있으면 `fetch(`${SUPABASE_URL}/rest/v1/duel_feedback`, { method:'POST', headers:{ apikey, Authorization:'Bearer …', 'Content-Type':'application/json', Prefer:'return=minimal' } })` → 201이면 `{ ok:true }`. IP·UA 저장 안 함.
  - `FeedbackForm` props `{ wave: number; starter: string; cleared: boolean }`: 별점 5개 버튼(`aria-label`, 44px) + 한 줄 input + 보내기; 성공 "고마워요", 실패/503 "지금은 보낼 수 없어요"(게임 흐름 영향 없음), 한 판에 한 번만.
  - Supabase 테이블 DDL은 `docs/duel-feedback.sql`에 둔다(`id uuid default gen_random_uuid()`, `created_at timestamptz default now()`, rating int, note text, wave int, starter text, cleared bool, device text; RLS 켜고 service key만 insert).
- [ ] **Step 1: 실패하는 테스트** — validateFeedback: 정상 통과; rating 6 null; note 201자 → 200자로 잘림; starter 'caocao' null; 추가 키 `ip` 버려짐
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인** + `curl -X POST localhost:3311/api/duel/feedback -d '{}'` → 400, env 없이 정상 본문 → 503
- [ ] **Step 5: 커밋** — `"일기토: 플레이어 피드백(API·폼·Supabase DDL)"`

---

### Task 11: 스프라이트 13장 생성·배치

**Files:**
- Create: `public/images/samguk/sprites/{guanyu,zhangfei,zhaoyun,machao,huangzhong,xuchu,xiaohoudun,zhouyu,jiangwei,zhangjiao,dongzhuo,lvbu,mob}.png`, `docs/duel-sprites.md`(생성 기록: 설명문·강도·몇 번째 시도)
- Test: `tests/duel/sprites.test.ts`

**절차(PixelLab, 사람 또는 브라우저 에이전트가 수행):** 스펙 18절 규칙. Creator → "Create S-XL image (new)", 128×128, 투명 배경, Direction East, View Side, Outline Black, Init Image = `docs/duel-sprite-tests/guanyu_test_128.png`, 강도 100. 설명문은 `docs/duel-sprites.md`에 장수별로 미리 적어 두고(색을 못 박음: 장비 "black horse, dark face, black armor", 조운 "white horse, silver armor", 마초 "white horse, silver helmet with lion", 황충 "bow and arrows, white beard", 허저 "bare muscular arms, huge mace", 하후돈 "eyepatch, blue armor", 주유 "red robe, no helmet, scholar general, sword", 강유 "blue robe and armor, spear", 장각 "yellow turban, yellow robe, staff, no armor", 동탁 "very fat, purple robe, black horse", 여포 "pheasant feathers, halberd, red horse", 졸개 "yellow turban, plain brown clothes, spear, small horse") 결과를 저장한다. 관우는 테스트 그림을 그대로 쓴다. 무료 생성 잔여 32회 → 13장 + 실패분.
- [ ] **Step 1: 실패하는 테스트** — 13개 파일 존재, 각 PNG 헤더의 크기 128×128(바이트 16~24 읽기), 50KB 이하
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: 생성·배치** (docs/duel-sprites.md 갱신)
- [ ] **Step 4: 통과 확인** + 로컬에서 BattleCanvas에 전원 표시 확인
- [ ] **Step 5: 커밋** — `"일기토: 장수 스프라이트 13장"`

---

### Task 12: E2E·마무리 검사

**Files:**
- Create: `e2e/duel.spec.ts`
- Modify: `e2e/helpers.ts` (`PAGES`에 `'/samguk/duel'`, `'/samguk/duel/generals/lvbu'`), `CLAUDE.md` (일기토 절 추가: 파일 위치, 시드 쿼리, 스프라이트 규칙, 피드백 env), `docs/backlog.md` (일기토 항목을 "친구 대전은 나중" 메모로 바꾸고 설계 문서 링크)

- [ ] **Step 1: E2E 작성** — `e2e/duel.spec.ts`:
  - 데스크톱: `/samguk/duel?seed=7` 열기 → 관우 선택 → "출진" → 기술 첫 번째 버튼을 연출이 끝날 때까지 반복 클릭(최대 60회) → 결과 화면 또는 보상 화면 도달; 콘솔 오류 0(`trackErrors`); 이모지 없음 검사는 기존 spec이 담당
  - 모바일(viewport 390×844): 같은 흐름, 게임 카드 `scrollWidth <= clientWidth`, 기술 버튼 bounding box height ≥ 44, 버튼이 하단 탭바와 겹치지 않음
  - `/samguk/duel/r/guanyu.lvbu.17.l.9` 200 + meta robots noindex; `/samguk/duel/r/bad` → `/samguk/duel`로 리디렉션
  - `/samguk` 결과 후 "이 장수로 일기토 하기" 링크가 `/samguk/duel?me=`로 간다(기존 flows 테스트 패턴, 실얼굴 사진 있을 때만)
- [ ] **Step 2: 실행** — `npm run test:e2e -- duel` → PASS; `npm test` 전체 PASS; `npm run lint`
- [ ] **Step 3: 문서 갱신** — CLAUDE.md·backlog.md
- [ ] **Step 4: 커밋** — `"일기토: E2E·문서"`
- [ ] **Step 5: 수동 점검 목록(배포 전, 의뢰인)** — Vercel 환경변수 `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` 등록과 `docs/duel-feedback.sql` 실행, 카카오 공유 카드 실기기 확인, 서치어드바이저·서치콘솔 수집 요청, 침하하 글 업데이트.

---

## Self-Review 메모

- 스펙 대응: 5절(기존 자산) → T8·T9 사용; 6절(흐름·포케로그 규칙·적 풀) → T3; 7절(데이터·상성·명단) → T1·T2(화웅→장각 결정 명시); 8절 전투 → T2; 9절 화면·연출 → T7·T8; 10절 영입 → T3; 11절 보상 → T3; 12절 열전·공유·행군 기록 → T5·T6·T8(StartScreen 행군 기록 탭)·T4; 13절 연결 → T8(lead·companion)·T9(메뉴); 14절 쿠팡 → T8; 15절 SEO → T9·T12; 16절 피드백 → T10; 17절 저장 → T4; 18절 그림 → T11; 19절 기술 선택 → 전체.
- 타입 일관성: `Fighter`·`BattleState`·`TurnEvent`(T2) ↔ `RunState`·`RunRecord`(T3) ↔ `SaveData`(T4) ↔ `narrate`(T5) ↔ `encodeRunKey`(T6) ↔ `eventsToTimeline`(T7) ↔ DuelClient(T8). 이름은 위 Interfaces 블록 그대로 쓴다.
- Review Focus 1→T8, 2·4→T4, 3→T6, 5→T12 테스트에 각각 들어 있다.
