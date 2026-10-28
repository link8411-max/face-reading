// 웨이브 설계표(BALANCE.waveDesign) → 그 웨이브 적의 레벨·능력치 보정. 피해 공식(battle.ts damage)을 거꾸로 푼다.
// 기준 아군 = BALANCE.refGeneral이 경험치 곡선대로 자란 모습(+ 웨이브마다 refAtkPerWave 공격). 상성 1, 평균 난수 0.925.
import { BALANCE } from './balance';
import { attackStat, makeFighter, skillsOf } from './battle';
import { getDuelGeneral } from './generals';
import { SKILLS } from './skills';
import type { Fighter } from './types';

/** 난수 0.85~1.0의 평균 */
const AVG_ROLL = 0.925;

function gen(id: string) {
  const g = getDuelGeneral(id);
  if (!g) throw new Error(`없는 장수: ${id}`);
  return g;
}

/** 웨이브 w를 시작할 때 기준 아군의 레벨 (1웨이브 = 1, 이긴 웨이브마다 경험치) */
export function refLevel(wave: number): number {
  let level = 1;
  let exp = 0;
  for (let i = 1; i < wave; i++) {
    exp += Math.max(0, BALANCE.expBase + i * BALANCE.expPerWave);
    while (exp >= BALANCE.expPerLevel) {
      exp -= BALANCE.expPerLevel;
      level += 1;
    }
  }
  return level;
}

/** 웨이브 w의 기준 아군 (보상 공격 가정 포함) */
export function refFighter(wave: number): Fighter {
  const f = makeFighter(BALANCE.refGeneral, refLevel(wave));
  f.bonus.atk = Math.round((wave - 1) * BALANCE.refAtkPerWave);
  f.bonus.int = f.bonus.atk;
  return f;
}

/** a가 d를 기본 공격으로 칠 때 평균 피해(상성 1, 자속 반영, 장수 피해 배율 반영) */
export function basicHit(a: Fighter, d: Fighter): number {
  const sk = SKILLS[skillsOf(a)[0]];
  const stab = sk.kind === gen(a.id).kind ? BALANCE.stab : 1;
  return (sk.power * attackStat(a) / gen(d.id).stats.통솔) * stab * AVG_ROLL * (BALANCE.generalPower[a.id] ?? 1);
}

/**
 * 웨이브 w에 나오는 적 id의 설계 레벨과 공격 보정.
 * 레벨: 기준 아군이 hitsToKillEnemy 합에 쓰러뜨릴 체력 → maxHp 공식을 거꾸로.
 * 보정: 이 적의 기본 공격이 hitsToKillPlayer 합에 기준 아군을 쓰러뜨리도록 공격 능력치(무력·지력)에 더할 값.
 */
export function designedEnemy(wave: number, id: string): { level: number; bonus: number } {
  const des = BALANCE.waveDesign[Math.min(BALANCE.waveDesign.length, Math.max(1, wave)) - 1];
  const me = refFighter(wave);
  const probe = makeFighter(id, 1);
  const hp = des.hitsToKillEnemy * basicHit(me, probe);
  const level = Math.max(1, Math.round((hp - gen(id).stats.통솔 * BALANCE.hpPerLead) / BALANCE.hpPerLevel));
  // 기본 공격 피해는 공격 능력치에 비례: 원하는 피해 / 지금 피해 만큼 능력치를 키운다
  const want = me.maxHp / des.hitsToKillPlayer;
  const now = basicHit(probe, me);
  const stat = attackStat(probe);
  const bonus = Math.max(1 - Math.floor(stat), Math.round(stat * (want / now) - stat));
  return { level, bonus };
}

/** 설계대로 만든 적 */
export function makeDesignedEnemy(wave: number, id: string): Fighter {
  const { level, bonus } = designedEnemy(wave, id);
  const f = makeFighter(id, level);
  f.bonus.atk = bonus;
  f.bonus.int = bonus;
  return f;
}
