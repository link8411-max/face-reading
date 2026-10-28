// 일기토 한 판의 진행: 웨이브·레벨·항복·보상·클리어. 순수 함수만 두고 입력 상태는 바꾸지 않는다.
// 난수는 RunState에 두지 않고 인자로 받는다(UI가 seed로 만들어 들고 있는다).
import { makeFighter, maxHpFor, resolveTurn, skillsOf } from './battle';
import { BALANCE } from './balance';
import { designedEnemy, makeDesignedEnemy } from './design';
import { BOSS_IDS, DUEL_GENERALS, getDuelGeneral, MOB_ID } from './generals';
import { drawRewards, getReward, topUpRewards } from './rewards';
import { SKILLS } from './skills';
import { createRng, type Rng } from './rng';
import type { Action, BattleState, Fighter, RunState, RunWave, TurnEvent } from './types';

export const WAVES = 36;
export const BOSS_WAVES = [6, 12, 18, 24, 30, 36] as const;

const MOB_WAVES = 3;
const RECRUIT_ONLY_UNTIL = 5;
const SURRENDER_MIN = 0.05;
const SURRENDER_MAX = 0.8;

function gen(id: string) {
  const g = getDuelGeneral(id);
  if (!g) throw new Error(`없는 장수: ${id}`);
  return g;
}


const bossIndex = (wave: number) => (BOSS_WAVES as readonly number[]).indexOf(wave);

/** 보스 웨이브인가 (장각·동탁·여포뿐 아니라 보스로 나온 영입 장수도) */
export const isBossWave = (wave: number) => bossIndex(wave) >= 0;

/** 동행 중인 장수, 이번 판 장수록(시작 장수 포함, 교체로 내보낸 장수도), 이번 판에 이미 나온 장수 */
function usedIds(run: RunState): Set<string> {
  return new Set([...run.roster, ...run.party.map((f) => f.id), ...run.record.waves.map((x) => x.enemy)]);
}

/**
 * 이 보스 웨이브의 보스 id(보스 웨이브가 아니면 null). 정해진 보스(BOSS_IDS)가 영입 장수(하후돈·황충·마초)인데
 * 이번 판에 이미 동행·장수록에 있거나 나왔으면, 아직 안 나온 영입 장수로 대신한다:
 * 뒤 보스 웨이브에 예약된 장수가 아닌 영입 장수 → 남은 영입 장수 → 남은 시작 장수 순, 각 안에서 명단 순서(난수 없음). 없으면 졸개.
 */
export function bossIdFor(run: RunState, wave: number): string | null {
  const b = bossIndex(wave);
  if (b < 0) return null;
  const id = BOSS_IDS[b];
  const used = usedIds(run);
  if (gen(id).role === 'boss' || !used.has(id)) return id;
  const later = new Set<string>(BOSS_IDS.slice(b + 1));
  const free = (role: string) => DUEL_GENERALS.filter((g) => g.role === role && !used.has(g.id));
  const sub =
    free('recruit').find((g) => !later.has(g.id)) ?? free('recruit')[0] ?? free('starter')[0];
  return sub ? sub.id : MOB_ID;
}

const firstAlive = (party: Fighter[]) => party.findIndex((f) => f.hp > 0);

const currentWave = (run: RunState): RunWave => run.record.waves[run.record.waves.length - 1];

/** 새 싸움 준비: 기술 횟수는 최대로, 상태 이상은 비운다. hp·level·bonus·exp·배운 기술은 그대로 */
export function freshForBattle(f: Fighter): Fighter {
  const next = structuredClone(f);
  next.uses = {};
  for (const sid of skillsOf(next)) {
    const n = SKILLS[sid].uses;
    if (n !== null) next.uses[sid] = n;
  }
  next.status = {};
  return next;
}

/** 웨이브 w에 나오는 적 id의 레벨: 설계표(BALANCE.waveDesign)를 피해 공식으로 푼 값 (design.ts) */
export function enemyLevel(wave: number, id: string): number {
  return designedEnemy(wave, id).level;
}

/**
 * 1~3 졸개, 4~5 영입 장수, 보스 웨이브는 bossIdFor(장각·하후돈·동탁·황충·마초·여포), 나머지는 영입·시작 장수.
 * 보스 웨이브에 예약된 영입 장수(하후돈·황충·마초)는 보통 웨이브에 나오지 않는다.
 * 동행 중인 장수, 이번 판 장수록(시작 장수 포함, 교체로 내보낸 장수도), 이번 판에 이미 나온 장수는 빼고, 남은 장수가 없으면 졸개.
 */
export function nextEnemyId(run: RunState, rng: Rng): string {
  const w = run.wave;
  const boss = bossIdFor(run, w);
  if (boss) return boss;
  if (w <= MOB_WAVES) return MOB_ID;
  const used = usedIds(run);
  for (const id of BOSS_IDS) used.add(id);
  const roles = w <= RECRUIT_ONLY_UNTIL ? ['recruit'] : ['recruit', 'starter'];
  const pool = DUEL_GENERALS.filter((g) => roles.includes(g.role) && !used.has(g.id));
  if (pool.length === 0) return MOB_ID;
  return pool[Math.floor(rng() * pool.length)].id;
}

function beginWave(run: RunState, rng: Rng): RunState {
  // 레벨·공격 보정은 설계표대로 (design.ts)
  const enemy = makeDesignedEnemy(run.wave, nextEnemyId(run, rng));
  const party = run.party.map(freshForBattle);
  const active = firstAlive(party);
  if (active < 0) throw new Error('싸울 장수가 없다');
  const battle: BattleState = { party, active, enemy, turn: 1 };
  return {
    ...run,
    party,
    enemy,
    battle,
    phase: 'battle',
    rewardsOffered: [],
    lastEvents: [],
    record: { ...run.record, waves: [...run.record.waves, { wave: run.wave, enemy: enemy.id, turns: 0 }] },
  };
}

export function startRun(starterId: string, seed: number): RunState {
  const g = gen(starterId);
  // 장수록에 오른 영입 장수도 시작 장수가 된다(설계 문서 §1). 보스·졸개는 안 된다
  if (g.role !== 'starter' && g.role !== 'recruit') throw new Error(`시작 장수가 아니다: ${starterId}`);
  const run: RunState = {
    seed,
    wave: 1,
    party: [makeFighter(starterId, 1)],
    partyMax: 3,
    roster: [starterId],
    enemy: null,
    phase: 'battle',
    battle: null,
    record: { starter: starterId, waves: [], rewards: [], cleared: false },
    rewardsOffered: [],
  };
  return beginWave(run, createRng(seed));
}

/** 적을 쓰러뜨린 결정타: 기술 id, 매복 반격이면 'ambush', 화상이면 'burn' */
function finisherOf(log: TurnEvent[]): string | undefined {
  const ko = log.findIndex((e) => e.kind === 'ko' && e.who === 'enemy');
  if (ko <= 0) return undefined;
  const e = log[ko - 1];
  if (e.kind === 'hit' && e.who === 'player') return e.skillId;
  if (e.kind === 'counter' && e.who === 'player') return 'ambush';
  if (e.kind === 'status' && e.who === 'enemy') return 'burn';
  return undefined;
}

/**
 * 플레이어 한 턴. 적이 쓰러지면 afterWin, 아군 전원이 쓰러지면 'lost',
 * 나선 장수만 쓰러지면 다음 살아 있는 장수가 자동으로 나선다(적의 공짜 행동 없음).
 */
export function playerTurn(run: RunState, action: Action, rng: Rng): RunState {
  if (run.phase !== 'battle' || !run.battle) throw new Error(`전투 중이 아니다: ${run.phase}`);
  const before = run.battle;
  const actor = before.party[before.active].id;
  const { state, log } = resolveTurn(before, action, rng);
  const battle = state;
  const after = action.type === 'switch' ? battle.party[action.toIndex].id : actor;

  const wave: RunWave = { ...currentWave(run), turns: currentWave(run).turns + 1 };
  if (!wave.lostAlly) {
    const fallen = battle.party.find((f, i) => f.hp <= 0 && before.party[i].hp > 0);
    if (fallen) wave.lostAlly = fallen.id;
  }
  const enemyDown = battle.enemy.hp <= 0;
  if (enemyDown) {
    const fin = finisherOf(log);
    if (fin) wave.finisher = fin;
    wave.finisherBy = after;
  }

  let next: RunState = {
    ...run,
    party: battle.party,
    enemy: battle.enemy,
    battle,
    record: { ...run.record, waves: [...run.record.waves.slice(0, -1), wave] },
    // 화면이 이번 턴 연출·대사를 그리도록 사건 기록을 담는다
    lastEvents: log,
  };

  const alive = firstAlive(battle.party);
  if (alive < 0) return { ...next, phase: 'lost', battle: null, record: { ...next.record, cleared: false } };
  if (enemyDown) return afterWin(next, rng);
  if (battle.party[battle.active].hp <= 0) {
    const n = battle.party.length;
    let to = battle.active;
    for (let k = 1; k <= n; k++) {
      const i = (battle.active + k) % n;
      if (battle.party[i].hp > 0) {
        to = i;
        break;
      }
    }
    next = { ...next, battle: { ...battle, active: to } };
  }
  return next;
}

/**
 * 항복 확률. 이름 있는 적(졸개·보스 아님)만,
 * surrenderBase + (선두 매력−50)/200 − (적 level − 기준 레벨) × surrenderPerLevel 을 0.05~0.8로. 그 외 0.
 * 기준 레벨은 surrenderRefLevel(보통 웨이브의 설계 레벨). 보스로 나온 영입 장수는 그 값 × bossSurrenderFactor.
 */
/** 항복 판정의 기준 레벨: 이 장수가 이 웨이브의 보통 설계 줄(보스 웨이브면 바로 앞 줄)로 나왔을 때의 레벨 */
export function surrenderRefLevel(wave: number, id: string): number {
  return designedEnemy(isBossWave(wave) ? Math.max(1, wave - 1) : wave, id).level;
}

export function surrenderChance(run: RunState): number {
  const e = run.enemy;
  if (!e) return 0;
  const role = gen(e.id).role;
  if (role === 'mob' || role === 'boss') return 0;
  const lead = run.battle ? run.battle.party[run.battle.active] : run.party[0];
  const p =
    BALANCE.surrenderBase + (gen(lead.id).stats.매력 - 50) / 200 - (e.level - surrenderRefLevel(run.wave, e.id)) * BALANCE.surrenderPerLevel;
  const c = Math.min(SURRENDER_MAX, Math.max(SURRENDER_MIN, p));
  return isBossWave(run.wave) ? c * BALANCE.bossSurrenderFactor : c;
}

function gainExp(f: Fighter, amount: number): Fighter {
  const next = structuredClone(f);
  let exp = (next.exp ?? 0) + amount;
  let level = next.level;
  while (exp >= BALANCE.expPerLevel) {
    exp -= BALANCE.expPerLevel;
    level += 1;
  }
  if (level !== next.level) {
    const maxHp = maxHpFor(next.id, level);
    next.hp = Math.round((next.hp / next.maxHp) * maxHp);
    next.maxHp = maxHp;
    next.level = level;
  }
  next.exp = exp;
  return next;
}

/** 승리 뒤: 경험치·레벨업 → 보스 웨이브면 전원 회복 → 항복 판정 → 마지막(WAVES) 웨이브면 won, 아니면 보상 3장 */
export function afterWin(run: RunState, rng: Rng): RunState {
  const enemy = run.enemy;
  if (!enemy) throw new Error('쓰러뜨린 적이 없다');
  const chance = surrenderChance(run);
  let party = run.party.map((f) => gainExp(f, Math.max(0, BALANCE.expBase + run.wave * BALANCE.expPerWave)));
  if (isBossWave(run.wave)) party = party.map((f) => ({ ...f, hp: f.maxHp }));

  let roster = run.roster;
  const wave: RunWave = { ...currentWave(run) };
  if (chance > 0 && rng() < chance) {
    wave.recruited = true;
    if (!roster.includes(enemy.id)) roster = [...roster, enemy.id];
    if (party.length < run.partyMax) party = [...party, makeFighter(enemy.id, enemy.level)];
  }

  const next: RunState = {
    ...run,
    party,
    roster,
    battle: null,
    record: { ...run.record, waves: [...run.record.waves.slice(0, -1), wave] },
  };
  if (run.wave >= WAVES) {
    return { ...next, phase: 'won', rewardsOffered: [], record: { ...next.record, cleared: true } };
  }
  return { ...next, phase: 'reward', rewardsOffered: drawRewards(next, rng).map((r) => r.id) };
}

/** 제시된 보상 하나를 적용하고 다음 웨이브를 연다 */
export function pickReward(run: RunState, rewardId: string, rng: Rng, targetIndex?: number): RunState {
  if (run.phase !== 'reward') throw new Error(`보상 단계가 아니다: ${run.phase}`);
  if (!run.rewardsOffered.includes(rewardId)) throw new Error(`제시되지 않은 보상: ${rewardId}`);
  const applied = getReward(rewardId).apply(run, targetIndex);
  return beginWave(
    { ...applied, wave: run.wave + 1, record: { ...applied.record, rewards: [...applied.record.rewards, rewardId] } },
    rng,
  );
}

/**
 * 동행이 꽉 찼을 때 이번 웨이브에 항복한 장수를 outIndex 자리와 바꾼다 (적 레벨, 체력 가득).
 * 바뀐 동행으로 쓸 수 없게 된 보상 카드(대상이 빠진 청룡언월도·부활약·회복약 등)는 빼고 새로 채운다.
 */
export function swapInRecruit(run: RunState, recruitId: string, outIndex: number, rng: Rng): RunState {
  if (run.phase !== 'reward' || !run.enemy) throw new Error(`보상 단계가 아니다: ${run.phase}`);
  const w = currentWave(run);
  if (!w.recruited || w.enemy !== recruitId) throw new Error(`이번에 항복한 장수가 아니다: ${recruitId}`);
  if (run.party.some((f) => f.id === recruitId)) throw new Error(`이미 동행 중: ${recruitId}`);
  if (outIndex < 0 || outIndex >= run.party.length) throw new Error(`없는 자리: ${outIndex}`);
  const party = [...run.party];
  party[outIndex] = makeFighter(recruitId, run.enemy.level);
  const next = { ...run, party };
  return { ...next, rewardsOffered: topUpRewards(next, run.rewardsOffered, rng).map((r) => r.id) };
}

/** 이번 웨이브의 항복 창을 처리했다고 적는다(입력은 바꾸지 않는다). 항복이 없으면 그대로 */
export function markRecruitHandled(run: RunState): RunState {
  const waves = run.record.waves;
  const w = waves[waves.length - 1];
  if (!w?.recruited || w.recruitHandled) return run;
  return { ...run, record: { ...run.record, waves: [...waves.slice(0, -1), { ...w, recruitHandled: true }] } };
}
