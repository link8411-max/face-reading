# 삼국지 일기토 1단계 "보이는 선택" 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이미 있는 전투 규칙(상성·능력치·적 AI·보스 예고)을 화면에 드러내고, 의미 없는 보상 선택지를 없애서 매 턴 "무엇을 고를지" 판단할 근거를 준다.

**Architecture:** 규칙 쪽(`src/lib/duel/`)에 난수 없는 조회 함수(`enemyIntent`, `damageRange`, `skillDesc`, `rewardEffect`)를 더하고 실제 행동은 그 함수들을 그대로 쓴다(미리보기 = 실제). 화면 값은 전부 `src/components/duel/view.ts`가 `RunState`에서 계산해 `bridge.ts` 타입으로 넘기고, Phaser 장면(`BattleScene`·`StartScene`·`RewardScene`)은 받은 글자를 자리에 놓기만 한다. 저장 형식·밸런스 수치·그림은 바꾸지 않는다.

**Tech Stack:** Next.js 16, TypeScript, Phaser 3.90.0, vitest, Playwright. 글꼴 Galmuri 서브셋(새 글자 추가 금지: `→ ∞` 같은 글자는 쓰지 않고 ASCII `> + ~`로 쓴다).

**Spec:** `docs/superpowers/specs/2026-10-28-samguk-duel-stage1-visible-choices-design.md` (기존 설계 `2026-10-28-samguk-duel-design.md` 위의 수정 설계)

## Global Constraints

- 작업 위치: 워크트리 `/Users/hongseong-il/Documents/face-reading/.claude/worktrees/samguk-duel`(브랜치 `samguk-duel`). 푸시·배포 금지.
- `BALANCE`·`DIST_TARGETS`·설계표(`balance.ts`)·`autoplay.ts`의 봇 판단은 건드리지 않는다. `tests/duel/balance.*.test.ts`는 지금 값 그대로 통과해야 한다(수치 변경 없이 분포가 안 바뀐 증거). 깨지면 수치를 고치지 말고 어떤 지표가 얼마나 벗어났는지 보고하고 멈춘다(스펙 5.7).
- `enemyAction`의 난수 호출 횟수·순서는 지금과 같아야 한다(스펙 5.1).
- 저장 형식 `SaveData` version 1 그대로. 새 표시 값은 전부 `RunState`에서 계산한다.
- 대사창 한 줄은 `MSG_CHARS`(14)자 이하. 미리보기 첫 줄(`▶이름`)은 9자 이하(오른쪽 금색 "결정" 칩과 안 겹치게).
- 상성 낱말은 셋뿐: `유리` `불리` `비등`. 색은 금색(`S.gold`)·빨강(`S.red`)·크림(`S.cream`) 순.
- 이모지 금지. 글꼴 서브셋에 없는 글자 금지(`▶▼▷·…` 와 ASCII는 된다).
- E2E는 `button[data-duel-btn="…"]`로 버튼을 찾는다. `data-duel-btn` id를 바꾸지 않는다.
- 커밋 메시지는 기존 관례 `일기토: …`(한국어 한 줄), 끝에 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. **적이 도발당한 상태**(`enemy.status.taunt`)에서 의도 줄은 기본 공격을 보여야 하고 실제로도 기본 공격이 나가야 한다. → Task 1 테스트 `enemyIntent: 도발 중이면 기본 공격`.
2. **보스 필살기 횟수가 0**(`uses[…_ult] === 0`)이고 `charging`이 남아 있는 상태에서 의도는 다른 공격으로 떨어져야 한다(예고만 믿고 필살기를 보이면 거짓). → Task 1 테스트 `enemyIntent: 예고한 필살기가 바닥나면 다른 공격`.
3. **옛 저장 데이터**(`lastEvents`에 `eff` 없음, `Fighter.status` 비어 있음)로 `toBattleView`가 멈추지 않아야 한다. → Task 3 테스트 `toBattleView: eff·status 없는 옛 사건도 그린다`.
4. **동행이 지장뿐일 때 보검**, **맹장·기장뿐일 때 병법서**는 아예 카드로 안 나와야 한다(대상이 없는 카드). → Task 2 테스트 `보검·병법서는 효과 있는 장수에게만`.
5. **동행 자리가 이미 4**(`partyMax 4`, 4명)면 slot이 또 나오면 안 된다(기존 규칙 유지). → Task 2 기존 테스트 `쓸 수 없는 카드 제외` 유지.

---

## 파일 구조

```
src/lib/duel/
  types.ts      TurnEvent.eff, Reward.effect 타입 추가
  skills.ts     SKILL_RULES(효과 상수, battle.ts에서 옮김), skillDesc()
  battle.ts     enemyIntent(), damageRange(), 상성 문구(eff), 공통 피해식
  rewards.ts    slot 조건, 보검·병법서 대상 조건, rewardEffect()
src/game/duel/
  bridge.ts     SkillView·FighterView·BattleView·RecruitView·StartShow 확장, battle:prompt 모양 변경
  BattleScene.ts 적 의도 줄, 상성 낱말, 메뉴 보조글, 교체 줄, 상태 표, 미리보기 3줄
  StartScene.ts 행군 기록 첫 줄 = 고른 장수 능력치
  RewardScene.ts 항복 창 능력치 줄
src/components/duel/
  view.ts       effOf(), intentView(), battlePreview(), 능력치 문자열, 첫 턴 안내
  DuelClient.tsx battle:prompt에 미리보기 줄, aria-label에 유불리
tests/duel/     battle·battleText·run·view·duelClient 테스트 갱신
e2e/duel.spec.ts aria-label 유불리 확인
```

---

### Task 1: 규칙 — 적 의도, 피해 범위, 상성 문구

**Files:**
- Modify: `src/lib/duel/types.ts` (`TurnEvent`)
- Modify: `src/lib/duel/skills.ts` (효과 상수 옮기기)
- Modify: `src/lib/duel/battle.ts`
- Test: `tests/duel/battle.test.ts`, `tests/duel/battleText.test.ts`

**Interfaces:**
- Produces (`skills.ts`): `export const SKILL_RULES = { burnTurns: 3, confuseActions: 1, confuseFail: 0.5, tauntActions: 2, shoutRate: 0.8, ambushRate: 0.5, lowHp: 0.3, defendChance: 0.3 } as const` — 지금 `battle.ts` 상단의 `BURN_TURNS … DEFEND_CHANCE` 값 그대로. `battle.ts`는 이걸 import해 쓴다(값·동작 변화 없음).
- Produces (`battle.ts`):
  - `export function enemyIntent(state: BattleState): { skillId: string; sure: boolean }` — 난수 없음. 지금 `enemyAction`의 결정 규칙 그대로(도발 중 → 기본 공격 / `charging`이 있고 쓸 수 있으면 그 기술 / 아니면 위력×상성×자속 점수 최대, 보스는 `_ult` 제외). `sure`는 `e.hp <= e.maxHp * lowHp`이고 쓸 수 있는 guard·heal 기술이 있으면 `false`. 도발 중·예고 중이면 항상 `true`.
  - `export function enemyAction(state: BattleState, rng: Rng): Action` — `enemyIntent`를 부르고 `sure === false`일 때만 `rng() < defendChance`면 그 guard·heal 기술(지금처럼 `defend[0]`). 그 밖엔 `rng`를 부르지 않는다.
  - `export function damageRange(att: Fighter, def: Fighter, sk: Skill): { min: number; max: number }` — `damageRoll`과 같은 식(공통 내부 함수 `baseDamage(att, def, sk): number`로 빼서 둘 다 쓴다)에 난수 계수 0.85와 1.0, 치명타 없음, `shouted`·`guard` 반영, `Math.max(1, Math.round(v))`. 위력 0이면 `{ min: 0, max: 0 }`.
  - `export type Eff = 'win' | 'lose' | 'even'`; `export function effOf(attackKind: GeneralKind, defendKind: GeneralKind): Eff` — `matchup`과 같은 판정(`BEATS`).
  - `TurnEvent.eff?: 'win' | 'lose'` — `hit` 사건에 기술 유형 대 맞는 쪽 유형이 win/lose면 붙인다. 문구: `${crit ? '회심의 일격! ' : ''}${eff === 'win' ? '상성이 좋다! ' : eff === 'lose' ? '상성이 나쁘다… ' : ''}${name}에게 ${dmg}의 피해!`.

- [ ] **Step 1: 실패하는 테스트 쓰기** (`tests/duel/battle.test.ts`에 `describe('enemyIntent·damageRange (1단계)')` 추가, `battleText.test.ts`에 상성 문구)

```ts
import { damageRange, effOf, enemyIntent, enemyAction, makeFighter, resolveTurn, damageRoll } from '@/lib/duel/battle';
import { SKILLS } from '@/lib/duel/skills';

const st = (party: Fighter[], enemy: Fighter): BattleState => ({ party, active: 0, enemy, turn: 1 });

it('enemyIntent: 상성·자속 점수 최대 공격, sure=true', () => {
  const s = st([makeFighter('guanyu', 10)], makeFighter('zhangjiao', 10));
  expect(enemyIntent(s)).toEqual({ skillId: 'zhangjiao_ult', sure: true });
  expect(enemyAction(s, () => 0.1)).toEqual({ type: 'skill', skillId: 'zhangjiao_ult' });
});
it('enemyIntent: 저체력이면 sure=false, enemyAction은 30%로 방어·회복', () => {
  const e = makeFighter('zhangjiao', 10); e.hp = Math.floor(e.maxHp * 0.2);
  const s = st([makeFighter('guanyu', 10)], e);
  expect(enemyIntent(s)).toEqual({ skillId: 'zhangjiao_ult', sure: false });
  expect(enemyAction(s, () => 0.1)).toEqual({ type: 'skill', skillId: 'breathe' });
  expect(enemyAction(s, () => 0.9)).toEqual({ type: 'skill', skillId: 'zhangjiao_ult' });
});
it('enemyIntent: 도발 중이면 기본 공격', () => {
  const e = makeFighter('zhangjiao', 10); e.status.taunt = 1;
  expect(enemyIntent(st([makeFighter('guanyu', 10)], e))).toEqual({ skillId: 'scheme', sure: true });
});
it('enemyIntent: 보스는 예고한 필살기, 예고한 필살기가 바닥나면 다른 공격', () => {
  const e = makeFighter('dongzhuo', 10); e.boss = true; e.status.charging = 'dongzhuo_ult';
  expect(enemyIntent(st([makeFighter('guanyu', 10)], e)).skillId).toBe('dongzhuo_ult');
  e.uses.dongzhuo_ult = 0;
  expect(enemyIntent(st([makeFighter('guanyu', 10)], e)).skillId).toBe('scheme');
});
it('damageRange: damageRoll의 난수 0.85/1.0 값과 같다(치명타 없음)', () => {
  const a = makeFighter('guanyu', 10), d = makeFighter('zhaoyun', 10);
  const r = damageRange(a, d, SKILLS.strike);
  const seq = (xs: number[]) => { let i = 0; return () => xs[i++ % xs.length]; };
  expect(r.min).toBe(damageRoll(a, d, SKILLS.strike, seq([0, 0.99])).amount);
  expect(Math.abs(r.max - damageRoll(a, d, SKILLS.strike, seq([0.999999, 0.99])).amount)).toBeLessThanOrEqual(1);
  expect(r.min).toBeLessThanOrEqual(r.max);
  expect(damageRange(a, d, SKILLS.guard)).toEqual({ min: 0, max: 0 });
});
it('effOf: 맹>기>지>맹', () => {
  expect(effOf('맹장', '기장')).toBe('win'); expect(effOf('기장', '맹장')).toBe('lose'); expect(effOf('지장', '지장')).toBe('even');
});
```

`battleText.test.ts`:
```ts
it('상성 문구: 좋다/나쁘다, 치명타 뒤에 온다', () => {
  const win = resolveTurn(state([makeFighter('guanyu', 10)], makeFighter('zhaoyun', 10)), { type: 'skill', skillId: 'strike' }, ONE);
  expect(win.log.find((e) => e.kind === 'hit' && e.who === 'player')).toMatchObject({ eff: 'win' });
  expect(texts(win).some((t) => /^상성이 좋다! 조운에게 \d+의 피해!$/.test(t))).toBe(true);
  const lose = resolveTurn(state([makeFighter('guanyu', 10)], makeFighter('zhouyu', 10)), { type: 'skill', skillId: 'strike' }, ONE);
  expect(texts(lose).some((t) => /^상성이 나쁘다… 주유에게 \d+의 피해!$/.test(t))).toBe(true);
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/duel/battle.test.ts tests/duel/battleText.test.ts`
Expected: FAIL — `enemyIntent`, `damageRange`, `effOf` is not exported / 문구 불일치.

- [ ] **Step 3: 구현** — `skills.ts`에 `SKILL_RULES`, `battle.ts`에 `baseDamage`·`damageRange`·`effOf`·`enemyIntent`, `enemyAction`을 `enemyIntent` 위에, `act()`의 hit 사건에 `eff`와 문구. `BURN_TURNS` 등 지역 상수는 지우고 `SKILL_RULES`로.

- [ ] **Step 4: 통과 확인 + 밸런스 불변 확인**

Run: `npx vitest run tests/duel`
Expected: 전부 PASS(기존 `enemyAction` 테스트 포함). `balance.main/skill/combo`가 그대로 통과해야 한다. 깨지면 Global Constraints의 보고 규칙.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/duel/types.ts src/lib/duel/skills.ts src/lib/duel/battle.ts tests/duel/battle.test.ts tests/duel/battleText.test.ts
git commit -m "일기토: 적 의도(enemyIntent)·피해 범위(damageRange)·상성 문구 — 미리보기와 실제 행동이 같은 함수를 쓴다"
```

---

### Task 2: 규칙 — 기술 설명, 보상 효과 표시값, 가짜 선택지 제거

**Files:**
- Modify: `src/lib/duel/types.ts` (`Reward`)
- Modify: `src/lib/duel/skills.ts`
- Modify: `src/lib/duel/rewards.ts`
- Test: `tests/duel/generals.test.ts`(기술 설명), `tests/duel/run.test.ts`(보상)

**Interfaces:**
- Produces (`skills.ts`): `export function skillDesc(id: string): { short: string; long: string }` — `short` 6자 이하, `long` 14자 이하. `SKILLS`·`BALANCE`·`SKILL_RULES`에서 계산한다(숫자 하드코딩 금지). 값:

| 조건 | short | long |
|---|---|---|
| 위력>0, 효과 없음, `_ult` 아님 | `기본` | `기본 공격` |
| `_ult`, 효과 없음 | `큰 한 방` | `큰 한 방` |
| guard | `피해 절반` | `이번 턴 피해 절반` |
| shout(위력 0) | `기 꺾기` | `상대 다음 피해 ${shoutRate}배` → `상대 다음 피해 0.8배` |
| heal | `회복 ${healRate*100}%` → `회복 30%` | `체력 30% 회복` |
| burn | `불 ${n}턴` | `피해 + 불 ${n}턴` (n = `sk.burnTurns ?? SKILL_RULES.burnTurns`; `zhouyu_ult`는 1) |
| confuse | `혼란` | `피해 + 혼란 ${confuseActions}회` |
| ambush | `반격` | `다음 피격 때 반격` |
| taunt(위력 0) | `도발` | `상대 ${tauntActions}턴 기본만` |
| `_ult` + 효과 | `큰 한 방` | `큰 한 방 + ${효과 short}` 예: `큰 한 방 + 기 꺾기`, `큰 한 방 + 불 1턴`, `큰 한 방 + 혼란`, `큰 한 방 + 도발` |

- Produces (`rewards.ts`):
  - `Reward.effect?: { stat: 'atk' | 'int' | 'speed' }` (타입은 `types.ts`), `bonusReward`가 채운다.
  - `export function rewardEffect(id: string): { stat: 'atk' | 'int' | 'speed'; amount: number } | null` — `amount`는 부를 때 `BALANCE[amountKey]`에서 읽는다(redhare→`redhareSpeed` 등).
  - `slot.canUse = (run) => run.partyMax < 4 && run.party.length >= run.partyMax`.
  - `sword`·`greendragon`의 `targets`: `kind !== '지장'`(greendragon은 관우 조건 유지), `book`의 `targets`: `kind === '지장'`. 유형은 `getDuelGeneral(f.id).kind`.

- [ ] **Step 1: 실패하는 테스트** (`generals.test.ts`에 `describe('skillDesc')`, `run.test.ts` 보상 뽑기 describe에 추가)

```ts
it('skillDesc: 14자 이하, 효과 설명', () => {
  for (const id of Object.keys(SKILLS)) { const d = skillDesc(id); expect(d.short.length).toBeLessThanOrEqual(6); expect(d.long.length).toBeLessThanOrEqual(14); }
  expect(skillDesc('strike')).toEqual({ short: '기본', long: '기본 공격' });
  expect(skillDesc('guard')).toEqual({ short: '피해 절반', long: '이번 턴 피해 절반' });
  expect(skillDesc('breathe')).toEqual({ short: '회복 30%', long: '체력 30% 회복' });
  expect(skillDesc('fire').long).toBe('피해 + 불 3턴');
  expect(skillDesc('zhouyu_ult').long).toBe('큰 한 방 + 불 1턴');
  expect(skillDesc('guanyu_ult')).toEqual({ short: '큰 한 방', long: '큰 한 방' });
  expect(skillDesc('zhangfei_ult').long).toBe('큰 한 방 + 기 꺾기');
  expect(skillDesc('taunt').long).toBe('상대 2턴 기본만');
});
```

```ts
it('동행 자리 +1은 동행이 꽉 찼을 때만', () => {
  const run = rewardRun(); // 관우 1명, partyMax 3
  const rng = createRng(3);
  for (let i = 0; i < 100; i++) expect(drawRewards(run, rng).map((r) => r.id)).not.toContain('slot');
  const full = { ...run, party: [run.party[0], makeFighter('zhaoyun', 1), makeFighter('zhouyu', 1)] };
  let seen = false;
  for (let i = 0; i < 200; i++) if (drawRewards(full, rng).some((r) => r.id === 'slot')) seen = true;
  expect(seen).toBe(true);
});
it('보검·병법서는 효과 있는 장수에게만', () => {
  const run = rewardRun();
  run.party = [makeFighter('guanyu', 1), makeFighter('zhouyu', 1)];
  expect(getReward('sword').targets!(run)).toEqual([0]);
  expect(getReward('book').targets!(run)).toEqual([1]);
  run.party = [makeFighter('guanyu', 1)];
  const rng = createRng(5);
  for (let i = 0; i < 100; i++) expect(drawRewards(run, rng).map((r) => r.id)).not.toContain('book');
});
it('rewardEffect', () => {
  expect(rewardEffect('sword')).toEqual({ stat: 'atk', amount: BALANCE.swordAtk });
  expect(rewardEffect('book')).toEqual({ stat: 'int', amount: BALANCE.bookInt });
  expect(rewardEffect('redhare')).toEqual({ stat: 'speed', amount: BALANCE.redhareSpeed });
  expect(rewardEffect('potion')).toBeNull();
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run tests/duel/generals.test.ts tests/duel/run.test.ts` → FAIL.

- [ ] **Step 3: 구현** — 위 Interfaces대로. 기존 run.test의 `쓸 수 없는 카드 제외`(partyMax 4, 1명)는 그대로 통과해야 한다.

- [ ] **Step 4: 통과 + 밸런스 불변 확인** — `npx vitest run tests/duel` 전부 PASS. `balance.*`가 깨지면 수치를 고치지 말고 어떤 `expect`가 어떤 값으로 벗어났는지 보고하고 멈춘다.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/duel/types.ts src/lib/duel/skills.ts src/lib/duel/rewards.ts tests/duel/generals.test.ts tests/duel/run.test.ts
git commit -m "일기토: 기술 한 줄 설명, 보상 효과값, 동행 자리 +1은 꽉 찼을 때만, 보검·병법서는 효과 있는 장수에게만"
```

---

### Task 3: 화면 값 — view.ts와 bridge 타입

**Files:**
- Modify: `src/game/duel/bridge.ts` (타입만)
- Modify: `src/components/duel/view.ts`
- Test: `tests/duel/view.test.ts`

**Interfaces:**
- Consumes: Task 1 `enemyIntent`, `damageRange`, `effOf`, `Eff`; Task 2 `skillDesc`, `rewardEffect`.
- Produces (`bridge.ts`):
  ```ts
  export type Eff = 'win' | 'lose' | 'even';            // battle.ts의 Eff를 re-export해도 된다
  export interface SkillView { id; name; kind; usesLeft; eff: Eff | null; /** 위력>0이면 내 선두 기술 유형 vs 적 유형, 아니면 null */ dmg: { min: number; max: number } | null; desc: { short: string; long: string } }
  export interface FighterView { id; name; kind; level; hp; maxHp; stats: { 무력: number; 지력: number; 통솔: number; 속도: number }; /** 보너스 합산 */ status: string[]; /** 도발·혼란·화상·위축·매복 순, 최대 2개 */ skills: SkillView[] }
  export interface IntentView { skillId: string; name: string; eff: Eff; /** 적 기술 유형 vs 내 선두 유형: win = 나에게 불리 */ dmg: { min: number; max: number } | null; sure: boolean; ult: boolean }
  export interface BattleView { wave; turn; player: FighterView; matchup: Eff; /** 내 선두 유형 vs 적 유형 */ enemy: FighterView & { isBoss: boolean; charging?: boolean; intent: IntentView }; party: …; switchTo: { index: number; name: string; eff: Eff; hurt: boolean } | null; message: string[] }
  export interface RecruitView { …; stats: string }   // `무92 지70 통85`
  export interface StartShow { …; leadStats: string } // `관우 무97 지75 통95 속55`
  'battle:prompt': { lines: string[] }                // 빈 배열 = 미리보기 없음
  ```
- Produces (`view.ts`):
  - `export function battlePreview(run: RunState, id: BattleFocusId, hint: boolean): string[]` — 고른 줄의 미리보기 0~3줄, 각 줄 `MSG_CHARS` 이하, 첫 줄 9자 이하. 규칙(스펙 5.2·6.3):
    - 실행할 수 없는 줄(횟수 0, 교체 불가) → `[]`.
    - 공격 기술: 실제로 나갈 기술로 계산(선두가 도발 중이면 기본 공격). `['▶' + name, `${effWord} 예상 ${min}~${max}`, hint ? '한 번 더 누르면 결정' : 없음]`. 도발로 바뀌었으면 둘째 줄 `도발 중 ${effWord} ${min}~${max}`.
    - guard: 둘째 줄 `피해 절반 ~${Math.max(1, Math.round(intent.dmg.max * 0.5))}`; 적 의도가 위력 0이면 `skillDesc.long`.
    - 그 밖의 효과 기술: 둘째 줄 `skillDesc(id).long`.
    - 교체: `['▶교체 ' + name, `${intent.name}에 ${effWord}`]` — effWord는 들어올 장수 입장(`effOf(enemySkillKind, incomingKind)`가 win이면 `불리`, lose면 `유리`, even이면 `비등`). 둘째 줄이 14자를 넘으면 `wrapText(…, MSG_CHARS)[0]`.
  - `export const EFF_WORD: Record<Eff, string> = { win: '유리', lose: '불리', even: '비등' }` — `bridge.ts`에 둔다(Phaser 장면과 view·DuelClient가 같이 쓴다. 아래 `effWord[...]`는 전부 이것).
  - `toBattleView`의 첫 대사(사건이 없을 때): `[`제${wave}전, ${enemy} 등장!`, `${enemy} 다음 ${intent.name}`, wave === 1 && turn === 1 ? '상성 맹>기>지>맹' : `${player}, 무엇을 할까?`]` → `messageLines`.
  - `statsLine(f: Fighter): string` → `무${무력+bonus.atk} 지${지력+bonus.int} 통${통솔} 속${speedOf(f)}`; `toStartShow().leadStats`는 `${name} ${statsLine(makeFighter(id,1))}`; `recruitView().stats`는 `무.. 지.. 통..`(속도 없음).
  - `pickView` 보상 대상 줄 `sub`: `rewardEffect(rewardId)`가 있으면 `Lv${level} ${hp}/${maxHp} ${무|지|속}${현재값}+${amount}`(현재값은 atk→무력+bonus.atk, int→지력+bonus.int, speed→`speedOf`), 없으면 지금처럼.
  - `FighterView.status` 변환: `taunt→'도발'`, `confuse→'혼란'`, `burn→'화상'`, `shouted→'위축'`, `ambush→'매복'`(이 순서, 최대 2개).

- [ ] **Step 1: 실패하는 테스트** (`view.test.ts`)

```ts
it('toBattleView: 상성·의도·기술 유불리·설명', () => {
  const run = startRun('guanyu', 7);                       // 적 졸개(맹장)
  const v = toBattleView(run)!;
  expect(v.matchup).toBe('even');
  expect(v.enemy.intent).toMatchObject({ skillId: 'strike', name: '일격', eff: 'even', sure: true, ult: false });
  expect(v.enemy.intent.dmg!.min).toBeGreaterThan(0);
  expect(v.player.skills[0]).toMatchObject({ eff: 'even', desc: { long: '기본 공격' } });
  expect(v.player.skills[2]).toMatchObject({ eff: null, dmg: null, desc: { long: '이번 턴 피해 절반' } });
  expect(v.player.stats.무력).toBe(getDuelGeneral('guanyu')!.stats.무력);
  expect(v.message).toContain('상성 맹>기>지>맹');
  expect(v.message.every((l) => l.length <= MSG_CHARS)).toBe(true);
});
it('toBattleView: 지장 상대면 불리, 적 의도는 나에게 win', () => {
  const run = structuredClone(startRun('guanyu', 7));
  run.battle!.enemy = makeFighter('zhouyu', 1); run.enemy = run.battle!.enemy;
  const v = toBattleView(run)!;
  expect(v.matchup).toBe('lose');
  expect(v.enemy.intent).toMatchObject({ skillId: 'scheme', eff: 'win' });
  expect(v.player.skills[0].eff).toBe('lose');
});
it('toBattleView: 교체 줄과 상태 표', () => {
  const run = structuredClone(startRun('guanyu', 7));
  run.battle!.party.push(makeFighter('zhouyu', 1)); run.party = run.battle!.party;
  run.battle!.enemy = makeFighter('zhaoyun', 1); run.enemy = run.battle!.enemy;
  run.battle!.party[0].status = { taunt: 2, burn: 1 };
  const v = toBattleView(run)!;
  expect(v.switchTo).toMatchObject({ index: 1, name: '주유', eff: 'lose', hurt: false });
  expect(v.player.status).toEqual(['도발', '화상']);
});
it('toBattleView: eff·status 없는 옛 사건도 그린다', () => {
  const run = structuredClone(startRun('guanyu', 7));
  run.lastEvents = [{ who: 'player', kind: 'hit', amount: 3, text: '졸개에게 3의 피해!' }];
  expect(() => toBattleView(run)).not.toThrow();
});
it('battlePreview', () => {
  const run = startRun('guanyu', 7);
  const p = battlePreview(run, 'skill0', true);
  expect(p[0]).toBe('▶일격'); expect(p[1]).toMatch(/^비등 예상 \d+~\d+$/); expect(p[2]).toBe('한 번 더 누르면 결정');
  expect(battlePreview(run, 'skill0', false)).toHaveLength(2);
  expect(battlePreview(run, 'skill2', true)[1]).toMatch(/^피해 절반 ~\d+$/);
  expect(battlePreview(run, 'switch', true)).toEqual([]);
  const r2 = structuredClone(run); r2.battle!.party[0].uses.guanyu_ult = 0;
  expect(battlePreview(r2, 'skill1', true)).toEqual([]);
  const r3 = structuredClone(run); r3.battle!.party[0].status.taunt = 1;
  expect(battlePreview(r3, 'skill1', false)).toEqual(['▶일격', expect.stringMatching(/^도발 중 비등 \d+~\d+$/)]);
  for (const id of ['skill0', 'skill1', 'skill2', 'skill3'] as const) for (const l of battlePreview(run, id, true)) expect(l.length).toBeLessThanOrEqual(MSG_CHARS);
});
it('능력치 줄: 시작 화면·항복 창·보상 대상', () => {
  expect(toStartShow(defaultSave(), 'guanyu').leadStats).toMatch(/^관우 무\d+ 지\d+ 통\d+ 속\d+$/);
  // recruitView(...).stats → /^무\d+ 지\d+ 통\d+$/ (기존 recruitView 테스트의 run·pick 재사용)
  // pickView(run, { kind: 'target', rewardId: 'sword', targets: [0] }).options[0].sub → /^Lv1 \d+\/\d+ 무\d+\+8$/
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run tests/duel/view.test.ts` → FAIL.
- [ ] **Step 3: 구현** — `bridge.ts` 타입, `view.ts` 함수. `fighterView`가 `stats`·`status`·`skills[].eff/dmg/desc`를 채운다(적 쪽 `SkillView.eff`는 적 기술 vs 내 선두 유형).
- [ ] **Step 4: 통과 확인** — `npx vitest run tests/duel/view.test.ts tests/duel/bridge.test.ts` PASS. `npx tsc --noEmit -p tsconfig.json`은 Task 4 전엔 `BattleScene`·`DuelClient`에서 타입 오류가 나도 된다(Task 4가 고친다) — 대신 `npx vitest run tests/duel`로 확인.
- [ ] **Step 5: 커밋** — `git commit -m "일기토: 화면 값에 상성·적 의도·피해 범위·기술 설명·능력치 줄·미리보기(battlePreview)"`

---

### Task 4: 전투 화면 — 보이게 그리기와 미리보기

**Files:**
- Modify: `src/game/duel/BattleScene.ts` (`buildFighterTexts`, `applyView`, `applyFighter`, `skillSub`, `drawList`, `drawCards`, `drawMenu`, `onPrompt`, `drawMessages`)
- Modify: `src/components/duel/DuelClient.tsx` (`rowInfo`, `battle:prompt` effect, 버튼 `label`)
- Test: `tests/duel/duelClient.test.ts`(라벨), `tests/duel/bridge.test.ts`(prompt 모양이 있으면)

**Interfaces:**
- Consumes: Task 3 `BattleView.matchup/enemy.intent/switchTo/player.status`, `SkillView.eff/dmg/desc`, `battlePreview`, `effWord`, `'battle:prompt': { lines }`.

- [ ] **Step 1: 실패하는 테스트** (`duelClient.test.ts` — 기존 테스트가 라벨을 검사하는 방식 그대로)

```ts
it('전투 버튼 aria-label에 유불리·설명이 들어간다', () => {
  // 관우, seed 7 시작 후 전투 화면 버튼들
  expect(skill0.label).toMatch(/^일격 비등 무제한/);          // 공격 기술: `${name} ${effWord} ${uses}`
  expect(skill2.label).toMatch(/^방어 태세 이번 턴 피해 절반 무제한/); // 효과 기술: `${name} ${desc.long} ${uses}`
});
```
`bridge.test.ts`에 `battle:prompt` 페이로드를 검사하는 테스트가 있으면 `{ lines: [...] }`로 고친다.

- [ ] **Step 2: 실패 확인** — `npx vitest run tests/duel/duelClient.test.ts` → FAIL.

- [ ] **Step 3: DuelClient 구현**
  - `rowInfo`: 공격 기술 라벨 `${sk.name} ${effWord[sk.eff]} ${uses}`, 효과 기술 `${sk.name} ${sk.desc.long} ${uses}`; 교체 라벨 `${name}(으)로 교체 ${effWord}`(`switchTo.eff`).
  - `battle:prompt` effect: `bridge.emit('battle:prompt', { lines: screen === 'battle' && pending && !animating && battleChoice?.action ? battlePreview(run, battleSel, !hintDone) : [] })`.

- [ ] **Step 4: BattleScene 구현** (좌표는 320×240 설계 좌표, 세로형은 위 170px가 같으므로 동일)
  - **적 의도 줄**: `buildFighterTexts`에 적 쪽 `intent` 텍스트(Galmuri9, x=256 오른끝 맞춤, y=44, shadow). `applyView`에서 `다음 ${name}${dmg ? ' ~' + dmg.max : ''}${sure ? '' : '?'}`. 색: `ult`면 `S.red`, 아니면 eff win→`S.red`, lose→`S.gold`, even→`S.cream`. 보스 표찰(y=30)과 겹치지 않는다(y=44).
  - **상성 낱말**: `buildDynamic`에 `matchupT = text(160, 56, '', { ko: 9, shadow: true }).setOrigin(0.5, 0)`; `applyView`에서 `상성 ${effWord[v.matchup]}`, 색 win→gold, lose→red, even→cream.
  - **상태 표**: `applyFighter('player', …, `${kind} Lv${level}${status.length ? ' ' + status.join(' ') : ''}`)`; 적도 같게.
  - **메뉴 보조글** `skillSub(s)`: `s.dmg`(위력>0)이면 `${effWord[s.eff]}·${usesLeft === null ? '무제한' : usesLeft + '회'}`, 아니면 `s.desc.short`. 세로형 카드 보조 줄은 `${effWord}·${uses}·${desc.short}`(공격) / `${desc.long}`(효과), `fitText`로 자른다.
  - **교체 줄**: `v.switchTo`로 `교체 ▷ ${name} ${effWord[eff]}${hurt ? '(부상)' : ''}`, 없으면 `교체 · 동행 없음`.
  - **미리보기**: `onPrompt`는 `this.prompt = p.lines.length ? p.lines.slice(0, MSG_LINES) : null`. `drawMessages`: 첫 미리보기 줄은 `S.red`, 나머지 미리보기 줄은 `S.ink`. 금색 "결정" 칩 위치는 지금처럼 첫 미리보기 줄 오른쪽(첫 줄이 9자 이하라 안 겹친다).
  - `CONFIRM_HINT` 상수와 `hint` 분기는 지운다(줄은 view가 만든다).

- [ ] **Step 5: 타입·테스트 확인**

Run: `npx tsc --noEmit -p tsconfig.json && npx vitest run tests/duel && npm run lint`
Expected: 오류 0, 전부 PASS.

- [ ] **Step 6: 눈으로 확인(스크린샷)** — `.superpowers/sdd/2026-10-28-samguk-duel/shots/` 아래 Playwright로 찍는 기존 방식(`task-14cd-report.md` 참고)으로 (a) 데스크톱 1280×800 전투 화면에서 skill0 한 번 누른 상태(미리보기 3줄·결정 칩) (b) 모바일 390×844 같은 상태 (c) 웨이브 6 장각(지장) 상대 화면(상성 불리·의도 빨강). 파일명 `stage1-wide-preview.png`, `stage1-tall-preview.png`, `stage1-boss.png`. 글자가 상자를 넘치거나 겹치면 좌표를 고친다.

- [ ] **Step 7: 커밋** — `git commit -m "일기토: 전투 화면에 적 의도·상성 유불리·기술 설명·상태 표·명령 미리보기 3줄"`

---

### Task 5: 시작·보상 화면 — 능력치 줄

**Files:**
- Modify: `src/game/duel/StartScene.ts` (`draw`)
- Modify: `src/game/duel/RewardScene.ts` (`drawRecruit`)
- Test: 없음(그리기만, Task 3 테스트가 값을 고정). `tests/duel/readable.test.ts`가 글자 크기 규칙을 검사하면 통과해야 한다.

**Interfaces:**
- Consumes: Task 3 `StartShow.leadStats`, `RecruitView.stats`.

- [ ] **Step 1: StartScene** — 행군 기록 창의 첫 줄을 `v.leadStats`(Galmuri9, `S.ink`)로 두고, 그 아래 기록 2줄(지금 3줄 → 2줄; 경고·저장 불가 줄이 있으면 그것이 먼저, 기록은 남는 줄 수만큼). 세로형도 같다.
- [ ] **Step 2: RewardScene** — `drawRecruit`의 `${r.kind} Lv${r.level}` 줄을 `${r.kind} Lv${r.level} ${r.stats}`로. `fit`으로 `R.w - R.slotX`에 맞춘다.
- [ ] **Step 3: 확인** — `npx tsc --noEmit -p tsconfig.json && npx vitest run tests/duel` PASS. 스크린샷 `stage1-start.png`(시작 화면, 관우 선택), `stage1-recruit.png`(항복 창: `?seed=`로 항복이 나는 시드를 찾아 찍는다. 못 찾으면 `pickView` 대상 창 `stage1-pick.png`로 대신하고 보고에 적는다).
- [ ] **Step 4: 커밋** — `git commit -m "일기토: 시작 화면·항복 창에 능력치 줄"`

---

### Task 6: E2E·문서

**Files:**
- Modify: `e2e/duel.spec.ts`
- Modify: `CLAUDE.md`(일기토 절 "입력" 항목), `docs/duel-balance.md`(보상 대상 조건 변경 기록 한 줄)

- [ ] **Step 1: E2E** — 데스크톱 테스트의 `onBattle` 검사에 추가:
```ts
await expect(btn(page, 'skill0')).toHaveAttribute('aria-label', /유리|불리|비등/)
await btn(page, 'skill0').click()   // 고르기 → 미리보기
await expect(btn(page, 'confirm')).toHaveAttribute('aria-label', /^결정: 일격/)
```
(이미 `onBattle` 안에서 `skill0`을 누르는 흐름이 있으면 그 자리에 맞춘다. 검사 뒤 전투 흐름은 기존대로 두 번 눌러 진행.)
- [ ] **Step 2: 실행** — `npm run test:e2e` → duel.spec 전부 PASS(얼굴 사진 필요한 스펙은 건너뜀 허용).
- [ ] **Step 3: 문서** — `CLAUDE.md` 일기토 절 "입력"에 한 줄: "명령을 한 번 누르면 대사창에 미리보기(상성 유불리·예상 피해·효과), 적의 다음 기술은 항상 표시(`enemyIntent`)". `docs/duel-balance.md` 끝에 날짜와 함께: "보상 대상 조건 변경(동행 자리 +1은 꽉 찼을 때만, 보검은 맹장·기장, 병법서는 지장만) — balance 테스트 변화 없음(또는 변화 수치)".
- [ ] **Step 4: 커밋** — `git commit -m "일기토: E2E 미리보기 확인, 문서"`

---

## 자기 검토 메모

- 스펙 6.2(c)의 "시작 화면에도 상성 한 줄"은 가로형 시작 화면에 빈 자리가 없어 뺐다(웨이브 1 첫 턴 대사창과 메뉴 보조글의 유불리가 대신한다). 제 판단.
- 스펙 6.3의 "횟수 0 기술을 고르면 `힘이 남지 않았다` 줄"은 지금 동작(실행 불가 줄은 미리보기 없음, 버튼 라벨에 `(쓸 수 없음)`)을 유지하는 것으로 단순화했다.
- `∞`·`→` 글자는 글꼴 서브셋 재생성이 필요해 쓰지 않는다. `무제한`, `+`, `>`로 대신한다.
