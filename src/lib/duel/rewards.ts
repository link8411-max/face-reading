// 일기토 보상 카드: 웨이브 사이 3장 중 1장. 적용은 순수 함수(입력 상태를 바꾸지 않는다).
import { skillsOf } from './battle';
import { SKILLS } from './skills';
import type { Rng } from './rng';
import type { Fighter, Reward, RunState } from './types';

const RARE_CHANCE = 0.25;
const DRAW = 3;
const POTION_RATE = 0.5;
const REVIVE_RATE = 0.5;
/** 새 기술은 셋째 칸(첫 공용 기술 자리)을 바꾼다. 넷째 칸의 숨 고르기·일갈은 남긴다 */
const LEARN_SLOT = 2;

const indices = (run: RunState, ok: (f: Fighter) => boolean) =>
  run.party.flatMap((f, i) => (ok(f) ? [i] : []));

/** 대상 1명을 고쳐 새 RunState를 낸다. 대상이 targets에 없으면 throw */
function onTarget(
  r: Reward,
  run: RunState,
  targetIndex: number | undefined,
  edit: (f: Fighter) => void,
): RunState {
  if (targetIndex === undefined || !r.targets!(run).includes(targetIndex)) {
    throw new Error(`${r.name}: 고를 수 없는 대상 ${targetIndex}`);
  }
  const next = structuredClone(run);
  edit(next.party[targetIndex]);
  return next;
}

function bonusReward(
  id: string,
  name: string,
  desc: string,
  rarity: Reward['rarity'],
  stat: keyof Fighter['bonus'],
  amount: number,
  only?: string,
): Reward {
  const r: Reward = {
    id,
    name,
    desc,
    rarity,
    targets: (run) => indices(run, (f) => !only || f.id === only),
    apply: (run, t) => onTarget(r, run, t, (f) => (f.bonus[stat] += amount)),
  };
  return r;
}

function learnReward(id: string, skillId: string, name: string, rarity: Reward['rarity']): Reward {
  const sk = SKILLS[skillId];
  const r: Reward = {
    id,
    name,
    desc: `장수 1명이 ${sk.name}을(를) 배운다 (셋째 기술 자리를 바꾼다)`,
    rarity,
    targets: (run) => indices(run, (f) => !skillsOf(f).includes(skillId)),
    apply: (run, t) =>
      onTarget(r, run, t, (f) => {
        const skills: [string, string, string, string] = [...skillsOf(f)];
        const old = skills[LEARN_SLOT];
        delete f.uses[old];
        skills[LEARN_SLOT] = skillId;
        f.skills = skills;
        if (sk.uses !== null) f.uses[skillId] = sk.uses;
      }),
  };
  return r;
}

const potion: Reward = {
  id: 'potion',
  name: '회복약',
  desc: '살아 있는 장수 1명의 체력을 최대치의 50% 회복',
  rarity: 'common',
  targets: (run) => indices(run, (f) => f.hp > 0 && f.hp < f.maxHp),
  apply: (run, t) =>
    onTarget(potion, run, t, (f) => (f.hp = Math.min(f.maxHp, f.hp + Math.round(f.maxHp * POTION_RATE)))),
};

const revive: Reward = {
  id: 'revive',
  name: '부활약',
  desc: '쓰러진 장수 1명을 체력 50%로 일으킨다',
  rarity: 'rare',
  targets: (run) => indices(run, (f) => f.hp <= 0),
  apply: (run, t) => onTarget(revive, run, t, (f) => (f.hp = Math.round(f.maxHp * REVIVE_RATE))),
};

const slot: Reward = {
  id: 'slot',
  name: '동행 자리 +1',
  desc: '함께 다닐 수 있는 장수가 4명으로 늘어난다 (한 판 1회)',
  rarity: 'rare',
  canUse: (run) => run.partyMax < 4,
  apply: (run) => {
    if (run.partyMax >= 4) throw new Error('동행 자리는 이미 4');
    return { ...structuredClone(run), partyMax: 4 };
  },
};

export const REWARDS: Reward[] = [
  bonusReward('redhare', '적토마', '장수 1명의 속도 +15', 'rare', 'speed', 15),
  bonusReward('steed', '준마', '장수 1명의 속도 +8', 'common', 'speed', 8),
  bonusReward('greendragon', '청룡언월도', '관우 전용. 공격 +15', 'rare', 'atk', 15, 'guanyu'),
  bonusReward('sword', '보검', '장수 1명의 공격 +8', 'common', 'atk', 8),
  bonusReward('book', '병법서', '장수 1명의 지력 +10', 'common', 'int', 10),
  learnReward('book_fire', 'fire', '병법서: 화공', 'rare'),
  potion,
  revive,
  learnReward('learn_ambush', 'ambush', '비전: 매복', 'common'),
  learnReward('learn_taunt', 'taunt', '비전: 도발', 'common'),
  slot,
];

export function getReward(id: string): Reward {
  const r = REWARDS.find((x) => x.id === id);
  if (!r) throw new Error(`없는 보상: ${id}`);
  return r;
}

/** 지금 쓸 수 있는 카드인지 (대상이 하나라도 있어야 한다) */
export function usableReward(r: Reward, run: RunState): boolean {
  if (r.canUse && !r.canUse(run)) return false;
  if (r.targets && r.targets(run).length === 0) return false;
  return true;
}

/** 3장, 중복 없음, 쓸 수 없는 카드 제외. 장마다 25% 확률로 rare (rare가 바닥나면 common, 반대도) */
export function drawRewards(run: RunState, rng: Rng): Reward[] {
  return topUpRewards(run, [], rng);
}

/**
 * keep 중 지금도 쓸 수 있는 카드는 그대로 두고, 모자란 장수만 drawRewards와 같은 규칙으로 채운다.
 * (동행이 바뀌어 대상이 사라진 카드를 걸러낼 때 쓴다)
 */
export function topUpRewards(run: RunState, keep: string[], rng: Rng): Reward[] {
  const out = keep.map(getReward).filter((r) => usableReward(r, run));
  const pool = REWARDS.filter((r) => usableReward(r, run) && !out.includes(r));
  while (out.length < DRAW && pool.length > 0) {
    const want = rng() < RARE_CHANCE ? 'rare' : 'common';
    let cands = pool.filter((r) => r.rarity === want);
    if (cands.length === 0) cands = pool;
    const pick = cands[Math.floor(rng() * cands.length)];
    out.push(pick);
    pool.splice(pool.indexOf(pick), 1);
  }
  return out;
}
