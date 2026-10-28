// 일기토 휴리스틱 자동 플레이: 밸런스 측정용(순수 함수, UI 없음).
// 'smart'는 상성·필살기·회복을 따지는 사람 흉내, 'basic'은 기본 공격만·보상은 첫 장(상성 무시 기준선).
import { damage, makeFighter, matchup, skillsOf } from './battle';
import { getDuelGeneral } from './generals';
import { getReward } from './rewards';
import { BOSS_WAVES, playerTurn, pickReward, startRun, swapInRecruit } from './run';
import { SKILLS } from './skills';
import { createRng, type Rng } from './rng';
import { BALANCE, withBalance, type BalanceOverride } from './balance';
import type { Action, Fighter, GeneralKind, RunState, Skill } from './types';

const LOW = 0.4;
/** 기대 피해용 난수(0.85~1.0의 가운데) */
const MID: Rng = () => 0.5;
/** 확실히 쓰러뜨리는지 볼 때(가장 약한 난수) */
const LOWEST: Rng = () => 0;

const kindOf = (f: Fighter): GeneralKind => getDuelGeneral(f.id)!.kind;
const usable = (f: Fighter, id: string) => !(id in f.uses) || f.uses[id] > 0;
const isUlt = (id: string) => id.endsWith('_ult');

/** 적이 f에게 이번에 줄 수 있는 가장 큰 기대 피해 */
function threat(enemy: Fighter, f: Fighter, basicOnly = false): number {
  const ids = basicOnly ? [skillsOf(enemy)[0]] : skillsOf(enemy).filter((id) => usable(enemy, id));
  let best = 0;
  for (const id of ids) {
    const s = SKILLS[id];
    if (s.power > 0) best = Math.max(best, damage(enemy, f, s, MID));
  }
  return best;
}

/** 기술 하나의 값: 기대 피해 + 효과의 대략적 값(피해 환산) */
function skillValue(me: Fighter, foe: Fighter, s: Skill): number {
  let v = s.power > 0 ? damage(me, foe, s, MID) : 0;
  const t = threat(foe, me);
  switch (s.effect) {
    case 'burn':
      if (!foe.status.burn) v += 3 * 0.08 * foe.maxHp;
      break;
    case 'confuse':
      if (!foe.status.confuse) v += 0.5 * t;
      break;
    case 'shout':
      if (!foe.status.shouted) v += 0.2 * t;
      break;
    case 'ambush':
      if (!me.status.ambush) v += 0.5 * t;
      break;
    case 'taunt':
      if (!foe.status.taunt) v += 2 * (t - threat(foe, me, true));
      break;
  }
  return v;
}

/** 선두 f가 적과 싸울 때의 유불리: (f가 버티는 턴) / (적이 버티는 턴) */
function edge(f: Fighter, foe: Fighter): number {
  let dmg = 1;
  for (const id of skillsOf(f)) {
    const s = SKILLS[id];
    if (s.power > 0 && usable(f, id)) dmg = Math.max(dmg, damage(f, foe, s, MID));
  }
  const t = Math.max(1, threat(foe, f));
  return f.hp / t / (foe.hp / dmg);
}

/**
 * 상성 유리 기술 우선(필살기는 횟수가 남고 적 hp ≥ 40%일 때), 지금 쓰러뜨릴 수 있으면 그 기술,
 * 선두 hp ≤ 40%면 숨 고르기(회복이 받는 피해보다 클 때)나 성한 장수로 교체,
 * 선두가 상성 불리하고 동행 중 상성 유리한 성한 장수가 있으면 교체.
 */
/** 플레이어 실력 단계: 실수하는 싸움 비율(그 싸움은 기본 공격만), 회복을 시작하는 hp 비율, 보상을 아무거나 고를 확률 */
export type SkillProfile = 'novice' | 'average' | 'expert';
export const SKILL_PROFILES: Record<SkillProfile, { mistake: number; healAt: number; randomReward: number }> = {
  novice: { mistake: 0.35, healAt: 0.2, randomReward: 0.5 },
  average: { mistake: 0.15, healAt: 0.3, randomReward: 0 },
  expert: { mistake: 0, healAt: 0.4, randomReward: 0 },
};

/** 보상 성향: 회복 먼저(기본) / 공격 먼저 / 아무거나 */
export type RewardPref = 'heal' | 'attack' | 'random';

/** 이 판·웨이브의 싸움이 '실수하는 싸움'인지 정하는 [0,1) 값 (난수 흐름을 건드리지 않게 시드·웨이브에서 만든다) */
function mistakeBattle(run: RunState): number {
  return createRng((run.seed * 31 + run.wave) * 2246822519)();
}

export function heuristicAction(run: RunState, rng?: Rng, skill: SkillProfile = 'expert'): Action {
  const prof = SKILL_PROFILES[skill];
  const b = run.battle;
  if (!b) throw new Error('전투 중이 아니다');
  const me = b.party[b.active];
  const foe = b.enemy;
  const skills = skillsOf(me).filter((id) => usable(me, id));
  if (me.status.taunt) return { type: 'skill', skillId: skillsOf(me)[0] };
  // 실수: 싸움 단위로 mistake 비율만큼은 상성·교체·필살기를 따지지 않고 기본 공격만 한다
  if (prof.mistake > 0 && mistakeBattle(run) < prof.mistake) return { type: 'skill', skillId: skillsOf(me)[0] };

  // 1) 지금 확실히 쓰러뜨릴 수 있으면: 무제한 기술 먼저
  const killers = skills.filter((id) => SKILLS[id].power > 0 && damage(me, foe, SKILLS[id], LOWEST) >= foe.hp);
  if (killers.length > 0) {
    const pick = killers.find((id) => !(id in me.uses)) ?? killers[0];
    return { type: 'skill', skillId: pick };
  }

  const others = b.party.map((f, i) => ({ f, i })).filter(({ f, i }) => i !== b.active && f.hp > f.maxHp * LOW);
  const myEdge = edge(me, foe);
  const t = threat(foe, me);

  // 2) 위기: 회복이 남는 장사면 숨 고르기, 아니면 더 나은 장수로 교체
  if (me.hp <= me.maxHp * prof.healAt) {
    const heal = skills.find((id) => SKILLS[id].effect === 'heal');
    if (heal && Math.round(me.maxHp * BALANCE.healRate) > t * 1.1 && me.hp > t) return { type: 'skill', skillId: heal };
    const better = others.map((o) => ({ ...o, e: edge(o.f, foe) })).sort((x, y) => y.e - x.e)[0];
    if (better && better.e > myEdge * 1.5) return { type: 'switch', toIndex: better.i };
  }

  // 3) 상성 불리하면 상성 유리한 장수로
  const fk = kindOf(foe);
  if (matchup(fk, kindOf(me)) > 1 || matchup(kindOf(me), fk) < 1) {
    const adv = others
      .filter(({ f }) => matchup(kindOf(f), fk) > 1)
      .map((o) => ({ ...o, e: edge(o.f, foe) }))
      .sort((x, y) => y.e - x.e)[0];
    if (adv && adv.e > myEdge) return { type: 'switch', toIndex: adv.i };
  }

  // 4) 가장 값진 기술 (필살기는 적 hp ≥ 40%일 때만)
  const foeHigh = foe.hp >= foe.maxHp * LOW;
  let best = skillsOf(me)[0];
  let bestV = -1;
  for (const id of skills) {
    const s = SKILLS[id];
    if (s.effect === 'heal' || s.effect === 'guard') continue;
    if (isUlt(id) && !foeHigh) continue;
    let v = skillValue(me, foe, s);
    if (isUlt(id)) v *= 1.05;
    if (v > bestV) {
      best = id;
      bestV = v;
    }
  }
  return { type: 'skill', skillId: best };
}

const ORDER = ['redhare', 'steed', 'greendragon', 'sword', 'book', 'book_fire', 'slot', 'learn_ambush', 'learn_taunt'];

function bestTarget(run: RunState, rewardId: string): number | undefined {
  const r = getReward(rewardId);
  if (!r.targets) return undefined;
  const ts = r.targets(run);
  if (ts.length === 0) return undefined;
  const p = run.party;
  const by = (score: (f: Fighter) => number) => [...ts].sort((a, b) => score(p[b]) - score(p[a]) || a - b)[0];
  switch (rewardId) {
    case 'potion':
      return by((f) => f.maxHp - f.hp);
    case 'revive':
      return by((f) => f.maxHp);
    case 'redhare':
    case 'steed':
      return by((f) => (kindOf(f) === '기장' ? 1000 : 0) + f.level);
    case 'sword':
    case 'greendragon':
      return by((f) => (kindOf(f) === '지장' ? -1000 : 0) + f.level);
    case 'book':
      return by((f) => (kindOf(f) === '지장' ? 1000 : 0) + f.level);
    case 'book_fire':
      // 화공(지장 기술)은 맹장을 친다: 지장 아닌 장수가 배우면 맹장 상대 수단이 생긴다
      return by((f) => (kindOf(f) === '맹장' ? 1000 : kindOf(f) === '기장' ? 500 : 0) + f.level);
    default:
      return by((f) => f.level);
  }
}

/** 부활약(쓰러진 장수) > 회복약(부상) > 명마 > 명기 > 병법서 > 기타. 쓸모없는 카드(지장 없는 병법서)는 뒤로 */
const ATTACK_ORDER = ['sword', 'greendragon', 'book', 'redhare', 'book_fire', 'steed'];

/**
 * 보상 고르기. pref 'heal': 부활약(쓰러진 장수) > 회복약(부상) > 명마 > 명기 > 병법서 > 기타.
 * 'attack': 공격·지력·속도 보상 먼저, 회복은 뒤. 'random': 아무거나(rng 필요).
 */
export function heuristicReward(
  run: RunState,
  offered: string[],
  pref: RewardPref = 'heal',
  rng?: Rng,
): { rewardId: string; targetIndex?: number } {
  if (pref === 'random' && rng) {
    const rewardId = offered[Math.floor(rng() * offered.length)];
    return { rewardId, targetIndex: bestTarget(run, rewardId) };
  }
  if (pref === 'attack') {
    const rank = (id: string) => {
      const i = ATTACK_ORDER.indexOf(id);
      return i < 0 ? 99 : i;
    };
    const rewardId = [...offered].sort((a, b) => rank(a) - rank(b))[0];
    return { rewardId, targetIndex: bestTarget(run, rewardId) };
  }
  const hurt = (pct: number) => run.party.some((f) => f.hp > 0 && f.hp < f.maxHp * pct);
  const hasInt = run.party.some((f) => kindOf(f) === '지장');
  const score = (id: string): number => {
    if (id === 'potion') return hurt(0.5) ? 100 : hurt(0.85) ? 60 : 1;
    if (id === 'revive') return 90;
    if (id === 'book' && !hasInt) return 2;
    if (id === 'slot') return run.party.length >= run.partyMax ? 15 : 3;
    const i = ORDER.indexOf(id);
    return i < 0 ? 0 : 50 - i;
  };
  const rewardId = [...offered].sort((a, b) => score(b) - score(a))[0];
  return { rewardId, targetIndex: bestTarget(run, rewardId) };
}

export interface SimResult {
  reachedWave: number;
  cleared: boolean;
  turns: number;
  roster: string[];
  bossResults: Record<number, 'win' | 'loss' | 'unreached'>;
  /** 한 싸움이 battleTurnCap을 넘겨(서로 회복만 하는 교착) 패배로 친 판 */
  stalled: boolean;
}

export type SimMode = 'smart' | 'basic';

export interface SimOptions {
  /** 판 시작부터 동행하는 장수(시작 장수 제외, 동행 자리까지). 장수록에 영입 장수가 있는 판을 흉내 낸다 */
  roster?: string[];
  mode?: SimMode;
  maxTurns?: number;
  /** 한 싸움 합 수 상한. 넘으면 교착으로 보고 패배 처리 (기본 150) */
  battleTurnCap?: number;
  /** 이 판 동안만 덮어쓸 밸런스 값 (튜너용) */
  balance?: BalanceOverride;
  /** smart의 실력 단계 (기본 average: 설계 목표가 가리키는 플레이어) */
  skill?: SkillProfile;
  /** smart의 보상 성향 (기본 heal) */
  rewardPref?: RewardPref;
}

/** 시뮬레이션용 판 시작: startRun + 처음부터 동행할 장수(레벨 1, 자리가 모자라면 새 유형 먼저) */
export function newSimRun(starterId: string, seed: number, roster: string[] = []): RunState {
  const run = structuredClone(startRun(starterId, seed));
  // 동행 자리가 모자라면 아직 없는 유형의 장수부터 데려간다(사람도 상성을 맞춰 꾸린다)
  const kinds = new Set([kindOf(run.party[0])]);
  const pool = roster.filter((id) => id !== starterId);
  const extra: string[] = [];
  while (extra.length < run.partyMax - 1 && pool.length > 0) {
    const i = Math.max(0, pool.findIndex((id) => !kinds.has(getDuelGeneral(id)!.kind)));
    const [id] = pool.splice(i, 1);
    kinds.add(getDuelGeneral(id)!.kind);
    extra.push(id);
  }
  if (extra.length > 0) {
    run.party = [...run.party, ...extra.map((id) => makeFighter(id, 1))];
    run.roster = [...run.roster, ...extra];
    run.battle = { ...run.battle!, party: run.party };
  }
  return run;
}

/** 시뮬레이션용 판 난수 (startRun의 시드와 다른 흐름) */
export const simRng = (seed: number): Rng => createRng((seed * 2654435761) ^ 0x5bd1e995);

/** 지금 싸움을 끝까지(이기면 reward·won, 지면 lost). 합 수가 cap을 넘으면 stalled */
export function playBattle(
  run: RunState,
  rng: Rng,
  mode: SimMode = 'smart',
  cap = 150,
  skill: SkillProfile = 'average',
): { run: RunState; turns: number; stalled: boolean } {
  let turns = 0;
  while (run.phase === 'battle') {
    if (run.battle!.turn > cap) return { run, turns, stalled: true };
    const b = run.battle!;
    const act: Action =
      mode === 'basic' ? { type: 'skill', skillId: skillsOf(b.party[b.active])[0] } : heuristicAction(run, rng, skill);
    run = playerTurn(run, act, rng);
    turns += 1;
  }
  return { run, turns, stalled: false };
}

/** 보상 단계: (smart면) 항복한 장수 교체 판단 → 보상 고르기 → 다음 웨이브 */
export function playReward(
  run: RunState,
  rng: Rng,
  mode: SimMode = 'smart',
  skill: SkillProfile = 'average',
  pref: RewardPref = 'heal',
): RunState {
  const w = run.record.waves[run.record.waves.length - 1];
  if (mode === 'smart' && w.recruited && !run.party.some((f) => f.id === w.enemy) && run.enemy) {
    // 동행이 꽉 찼으면 쓰러진 장수나 레벨이 한참 낮은 장수와 바꾼다
    const lvl = run.enemy.level;
    let out = run.party.findIndex((f) => f.hp <= 0);
    if (out < 0) {
      const low = run.party.reduce((m, f, i) => (f.level < run.party[m].level ? i : m), 0);
      if (run.party[low].level + 3 <= lvl) out = low;
    }
    if (out >= 0) run = swapInRecruit(run, w.enemy, out, rng);
  }
  let pick: { rewardId: string; targetIndex?: number };
  if (mode === 'basic') {
    const id = run.rewardsOffered[0];
    const r = getReward(id);
    pick = { rewardId: id, targetIndex: r.targets ? r.targets(run)[0] : undefined };
  } else {
    const random = SKILL_PROFILES[skill].randomReward > 0 && rng() < SKILL_PROFILES[skill].randomReward;
    pick = heuristicReward(run, run.rewardsOffered, random ? 'random' : pref, rng);
  }
  return pickReward(run, pick.rewardId, rng, pick.targetIndex);
}

/** 시드 고정 한 판. 패배·클리어·턴 상한 중 먼저 오는 것까지 */
export function simulateRun(starterId: string, seed: number, opts: SimOptions = {}): SimResult {
  return withBalance(opts.balance, () => {
    const mode = opts.mode ?? 'smart';
    const maxTurns = opts.maxTurns ?? 3000;
    const rng = simRng(seed);
    let run = newSimRun(starterId, seed, opts.roster);
    let turns = 0;
    let stalled = false;
    while ((run.phase === 'battle' || run.phase === 'reward') && turns < maxTurns) {
      if (run.phase === 'battle') {
        const r = playBattle(run, rng, mode, opts.battleTurnCap, opts.skill);
        run = r.run;
        turns += r.turns;
        if (r.stalled) {
          stalled = true;
          break;
        }
      } else run = playReward(run, rng, mode, opts.skill, opts.rewardPref);
    }
    const cleared = run.phase === 'won';
    const reachedWave = run.wave;
    const bossResults: SimResult['bossResults'] = {};
    for (const bw of BOSS_WAVES) {
      bossResults[bw] =
        bw < reachedWave || (bw === reachedWave && cleared) ? 'win' : bw === reachedWave ? 'loss' : 'unreached';
    }
    return { reachedWave, cleared, turns, roster: run.roster, bossResults, stalled };
  });
}

/** 사분위(선형 보간) */
function quantile(sorted: number[], p: number): number {
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.min(sorted.length - 1, lo + 1);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

export interface RunSummary {
  /** 보스 웨이브마다 도달률과 도달했을 때 승률 */
  boss: { wave: number; reached: number; pass: number }[];
  clear: number;
  median: number;
  iqr: number;
  meanTurns: number;
  /** 교착으로 끝난 판 비율 */
  stalled: number;
}

export function summarizeRuns(rs: SimResult[]): RunSummary {
  const boss = BOSS_WAVES.map((wave) => {
    const reached = rs.filter((r) => r.bossResults[wave] !== 'unreached');
    const won = reached.filter((r) => r.bossResults[wave] === 'win').length;
    return { wave, reached: reached.length / rs.length, pass: reached.length ? won / reached.length : 0 };
  });
  const waves = rs.map((r) => r.reachedWave).sort((a, b) => a - b);
  return {
    boss,
    clear: rs.filter((r) => r.cleared).length / rs.length,
    median: quantile(waves, 0.5),
    iqr: quantile(waves, 0.75) - quantile(waves, 0.25),
    meanTurns: rs.reduce((a, r) => a + r.turns, 0) / rs.length,
    stalled: rs.filter((r) => r.stalled).length / rs.length,
  };
}
