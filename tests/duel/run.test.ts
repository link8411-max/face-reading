import { describe, it, expect } from 'vitest';
import { createRng, type Rng } from '@/lib/duel/rng';
import { makeFighter, skillsOf } from '@/lib/duel/battle';
import { getDuelGeneral, MOB_ID } from '@/lib/duel/generals';
import { SKILLS } from '@/lib/duel/skills';
import { REWARDS, drawRewards, getReward } from '@/lib/duel/rewards';
import {
  WAVES,
  BOSS_WAVES,
  startRun,
  nextEnemyId,
  playerTurn,
  afterWin,
  pickReward,
  swapInRecruit,
  surrenderChance,
  freshForBattle,
} from '@/lib/duel/run';
import type { Action, RunState } from '@/lib/duel/types';

const SEEDS = [1, 2, 3, 7, 42, 99, 1234, 2026];

function basicAttack(run: RunState): Action {
  const b = run.battle!;
  return { type: 'skill', skillId: skillsOf(b.party[b.active])[0] };
}

function firstTarget(run: RunState, rewardId: string): number | undefined {
  const r = getReward(rewardId);
  return r.targets ? r.targets(run)[0] : undefined;
}

/** 기본 공격만 누르고, 보상은 첫 장, 동행 꽉 찬 영입은 건너뛴다. 매 단계 콜백 */
function autoPlay(seed: number, onStep?: (prev: RunState, next: RunState) => void) {
  const rng = createRng(seed);
  let run = startRun('guanyu', seed);
  let turns = 0;
  while (run.phase === 'battle' || run.phase === 'reward') {
    const prev = run;
    if (run.phase === 'battle') {
      run = playerTurn(run, basicAttack(run), rng);
      turns += 1;
    } else {
      const id = run.rewardsOffered[0];
      run = pickReward(run, id, rng, firstTarget(run, id));
    }
    onStep?.(prev, run);
    if (turns > 500) throw new Error(`시드 ${seed}: 500턴 넘음`);
  }
  return { run, turns };
}

/** 지금 웨이브의 적을 체력 1로 만든다 (승리 상황 만들기) */
function weakenEnemy(run: RunState): RunState {
  const r = structuredClone(run);
  r.battle!.enemy.hp = 1;
  r.enemy = r.battle!.enemy;
  return r;
}

/** 원하는 웨이브·적으로 전투 중 상태 만들기 */
function atWave(run: RunState, wave: number, enemyId: string, level = wave): RunState {
  const r = structuredClone(run);
  r.wave = wave;
  r.enemy = makeFighter(enemyId, level);
  r.battle = { party: r.party, active: 0, enemy: r.enemy, turn: 1 };
  r.record.waves = [{ wave, enemy: enemyId, turns: 0 }];
  return r;
}

describe('startRun', () => {
  it('웨이브 1, 시작 장수 1명 lv1, 적은 졸개', () => {
    const run = startRun('guanyu', 1);
    expect(run.wave).toBe(1);
    expect(run.phase).toBe('battle');
    expect(run.party).toHaveLength(1);
    expect(run.party[0].id).toBe('guanyu');
    expect(run.party[0].level).toBe(1);
    expect(run.partyMax).toBe(3);
    expect(run.enemy!.id).toBe(MOB_ID);
    expect(run.enemy!.level).toBe(1);
    expect(run.battle!.active).toBe(0);
    expect(run.record.starter).toBe('guanyu');
    expect(run.record.waves).toEqual([{ wave: 1, enemy: MOB_ID, turns: 0 }]);
    expect(WAVES).toBe(18);
    expect(BOSS_WAVES).toEqual([6, 12, 18]);
  });
});

describe('자동 플레이', () => {
  it.each(SEEDS)('시드 %i: 기본 공격만 눌러도 500턴 안에 won 또는 lost로 끝난다', (seed) => {
    const { run } = autoPlay(seed);
    expect(['won', 'lost']).toContain(run.phase);
    if (run.phase === 'won') {
      expect(run.wave).toBe(18);
      expect(run.record.cleared).toBe(true);
    } else {
      expect(run.party.every((f) => f.hp <= 0)).toBe(true);
      expect(run.record.cleared).toBe(false);
    }
  });

  it.each(SEEDS)('시드 %i: 한 방에 끝내는 관우면 18웨이브를 다 돌아 won, 보스 6·12·18 순서', (seed) => {
    const rng = createRng(seed);
    let run = structuredClone(startRun('guanyu', seed));
    run.party[0].bonus = { atk: 5000, int: 0, speed: 5000 };
    run.battle!.party = run.party;
    const bosses: Record<number, string> = {};
    const enemies: string[] = [];
    let turns = 0;
    while (run.phase === 'battle' || run.phase === 'reward') {
      if (run.phase === 'battle') {
        enemies.push(run.enemy!.id);
        if ([6, 12, 18].includes(run.wave)) bosses[run.wave] = run.enemy!.id;
        run = playerTurn(run, basicAttack(run), rng);
        turns += 1;
      } else {
        const id = run.rewardsOffered[0];
        run = pickReward(run, id, rng, firstTarget(run, id));
      }
      expect(turns).toBeLessThanOrEqual(500);
    }
    expect(run.phase).toBe('won');
    expect(run.record.cleared).toBe(true);
    expect(run.record.waves).toHaveLength(18);
    expect(run.record.rewards).toHaveLength(17);
    expect(bosses).toEqual({ 6: 'zhangjiao', 12: 'dongzhuo', 18: 'lvbu' });
    const named = enemies.filter((id) => id !== MOB_ID);
    expect(new Set(named).size).toBe(named.length);
  });

  it('같은 시드면 같은 결과', () => {
    expect(autoPlay(42).run).toEqual(autoPlay(42).run);
  });

  it.each(SEEDS)('시드 %i: 같은 이름 있는 장수가 한 판에 두 번 나오지 않고, 동행 장수는 적으로 안 나온다', (seed) => {
    const seen: string[] = [];
    autoPlay(seed, (prev, next) => {
      if (next.phase === 'battle' && next.wave !== prev.wave) {
        const id = next.enemy!.id;
        expect(prev.party.map((f) => f.id)).not.toContain(id);
        if (id !== MOB_ID) {
          expect(seen).not.toContain(id);
          seen.push(id);
        }
      }
    });
  });

  it.each(SEEDS)('시드 %i: 승리마다 record.waves에 turns·finisher가 쌓인다', (seed) => {
    autoPlay(seed, (prev, next) => {
      if (prev.phase === 'battle' && (next.phase === 'reward' || next.phase === 'won')) {
        const w = next.record.waves[next.record.waves.length - 1];
        expect(next.record.waves).toHaveLength(prev.wave);
        expect(w.wave).toBe(prev.wave);
        expect(w.enemy).toBe(prev.enemy!.id);
        expect(w.turns).toBeGreaterThan(0);
        expect(typeof w.finisher).toBe('string');
        expect(typeof w.finisherBy).toBe('string');
      }
    });
  });
});

describe('nextEnemyId', () => {
  const rng = createRng(5);
  it('1~3 졸개, 4~5 영입급, 보스 웨이브는 장각·동탁·여포', () => {
    const base = startRun('guanyu', 5);
    for (const w of [1, 2, 3]) expect(nextEnemyId({ ...base, wave: w }, rng)).toBe(MOB_ID);
    for (const w of [4, 5]) expect(getDuelGeneral(nextEnemyId({ ...base, wave: w }, rng))!.role).toBe('recruit');
    expect(nextEnemyId({ ...base, wave: 6 }, rng)).toBe('zhangjiao');
    expect(nextEnemyId({ ...base, wave: 12 }, rng)).toBe('dongzhuo');
    expect(nextEnemyId({ ...base, wave: 18 }, rng)).toBe('lvbu');
    for (const w of [7, 9, 13, 17]) {
      const id = nextEnemyId({ ...base, wave: w }, rng);
      expect(id).not.toBe('guanyu');
      expect(['recruit', 'starter', 'mob']).toContain(getDuelGeneral(id)!.role);
    }
  });

  it.each(SEEDS)('시드 %i: 자동 플레이에서 보스 웨이브 적과 레벨', (seed) => {
    autoPlay(seed, (_prev, next) => {
      if (next.phase !== 'battle') return;
      const boss = BOSS_WAVES.indexOf(next.wave as 6 | 12 | 18);
      if (boss >= 0) {
        expect(next.enemy!.id).toBe(['zhangjiao', 'dongzhuo', 'lvbu'][boss]);
        expect(next.enemy!.level).toBe(next.wave + 3);
      } else {
        expect(next.enemy!.level).toBe(next.wave);
      }
    });
  });
});

describe('playerTurn', () => {
  it('선두가 쓰러지고 다른 아군이 있으면 적의 공짜 행동 없이 자동 교체', () => {
    let run = startRun('guanyu', 3);
    run = structuredClone(run);
    run.party.push(makeFighter('zhangfei', 1));
    run.party[0].hp = 1;
    run.battle!.party = run.party;
    const zf = run.party[1].hp;
    const next = playerTurn(run, { type: 'skill', skillId: 'guard' }, createRng(3));
    // 방어 태세 후 적 일격에 관우가 쓰러짐(체력 1)
    expect(next.party[0].hp).toBe(0);
    expect(next.phase).toBe('battle');
    expect(next.battle!.active).toBe(1);
    expect(next.party[1].hp).toBe(zf);
    expect(next.record.waves[0].lostAlly).toBe('guanyu');
  });

  it('전원 쓰러지면 lost', () => {
    const run = structuredClone(startRun('guanyu', 3));
    run.party[0].hp = 1;
    run.battle!.party = run.party;
    const next = playerTurn(run, { type: 'skill', skillId: 'guard' }, createRng(3));
    expect(next.phase).toBe('lost');
    expect(next.record.cleared).toBe(false);
  });

  it('battle 단계가 아니면 throw', () => {
    const run = { ...startRun('guanyu', 1), phase: 'reward' as const };
    expect(() => playerTurn(run, { type: 'skill', skillId: 'strike' }, createRng(1))).toThrow();
  });

  it('입력 상태를 바꾸지 않는다', () => {
    const run = startRun('guanyu', 1);
    const copy = structuredClone(run);
    playerTurn(run, { type: 'skill', skillId: 'strike' }, createRng(1));
    expect(run).toEqual(copy);
  });
});

describe('afterWin', () => {
  it('일반 승리 후 hp가 회복되지 않고, 경험치가 오른다', () => {
    let run = weakenEnemy(startRun('guanyu', 1));
    run.party[0].hp = 50;
    run.battle!.party = run.party;
    // 관우가 먼저 친다(속도 55 vs 졸개 40)
    run = playerTurn(run, { type: 'skill', skillId: 'strike' }, createRng(1));
    expect(run.phase).toBe('reward');
    expect(run.party[0].hp).toBe(50);
    expect(run.party[0].exp).toBe(10 + 1 * 2);
    expect(run.rewardsOffered).toHaveLength(3);
    expect(run.battle).toBeNull();
    const w = run.record.waves[0];
    expect(w).toMatchObject({ wave: 1, enemy: MOB_ID, turns: 1, finisher: 'strike', finisherBy: 'guanyu' });
  });

  it('경험치 100마다 레벨업, maxHp 다시 계산하고 현재 hp 비율 유지', () => {
    const run = structuredClone(atWave(startRun('guanyu', 1), 2, MOB_ID));
    run.party[0].exp = 95;
    const oldMax = run.party[0].maxHp;
    run.party[0].hp = Math.round(oldMax / 2);
    run.battle!.party = run.party;
    run.battle!.enemy.hp = 0;
    const next = afterWin(run, createRng(1));
    const g = getDuelGeneral('guanyu')!;
    expect(next.party[0].level).toBe(2);
    expect(next.party[0].exp).toBe(95 + 14 - 100);
    expect(next.party[0].maxHp).toBe(g.stats.통솔 * 2 + 2 * 6);
    expect(next.party[0].hp).toBe(Math.round((Math.round(oldMax / 2) / oldMax) * next.party[0].maxHp));
  });

  it('보스 승리 후 전원 hp === maxHp (쓰러진 아군 포함)', () => {
    const run = structuredClone(atWave(startRun('guanyu', 1), 6, 'zhangjiao', 9));
    run.party.push(makeFighter('zhangfei', 1));
    run.party[0].hp = 10;
    run.party[1].hp = 0;
    run.battle!.party = run.party;
    run.battle!.enemy.hp = 0;
    const next = afterWin(run, createRng(1));
    expect(next.phase).toBe('reward');
    for (const f of next.party) expect(f.hp).toBe(f.maxHp);
    expect(next.record.waves[0].recruited).toBeFalsy();
  });

  it('18웨이브 승리면 won, cleared', () => {
    const run = structuredClone(atWave(startRun('guanyu', 1), 18, 'lvbu', 21));
    run.battle!.enemy.hp = 0;
    const next = afterWin(run, createRng(1));
    expect(next.phase).toBe('won');
    expect(next.record.cleared).toBe(true);
    expect(next.rewardsOffered).toEqual([]);
  });

  it('항복 성공: 장수록에 오르고 자리가 있으면 합류 (적 레벨, 체력 가득)', () => {
    const base = atWave(startRun('guanyu', 1), 4, 'machao');
    base.battle!.enemy.hp = 0;
    const next = afterWin(base, () => 0); // 난수 0 → 항복 성공
    expect(next.record.waves[0].recruited).toBe(true);
    expect(next.roster).toContain('machao');
    expect(next.party.map((f) => f.id)).toEqual(['guanyu', 'machao']);
    expect(next.party[1].level).toBe(4);
    expect(next.party[1].hp).toBe(next.party[1].maxHp);
  });

  it('항복 실패면 영입 없음', () => {
    const base = atWave(startRun('guanyu', 1), 4, 'machao');
    base.battle!.enemy.hp = 0;
    const next = afterWin(base, () => 0.9999);
    expect(next.record.waves[0].recruited).toBeFalsy();
    expect(next.roster).not.toContain('machao');
    expect(next.party).toHaveLength(1);
  });

  it('동행 꽉 찼으면 장수록에만 오르고, swapInRecruit로 교체', () => {
    const base = structuredClone(atWave(startRun('guanyu', 1), 4, 'machao'));
    base.party.push(makeFighter('zhangfei', 1), makeFighter('zhaoyun', 1));
    base.battle!.party = base.party;
    base.battle!.enemy.hp = 0;
    const next = afterWin(base, () => 0);
    expect(next.record.waves[0].recruited).toBe(true);
    expect(next.party.map((f) => f.id)).toEqual(['guanyu', 'zhangfei', 'zhaoyun']);
    const swapped = swapInRecruit(next, 'machao', 1);
    expect(swapped.party.map((f) => f.id)).toEqual(['guanyu', 'machao', 'zhaoyun']);
    expect(swapped.party[1].level).toBe(4);
    expect(() => swapInRecruit(next, 'xuchu', 1)).toThrow();
    expect(() => swapInRecruit(next, 'machao', 5)).toThrow();
  });
});

describe('surrenderChance', () => {
  it('이름 있는 적은 0.05~0.8, 보스·졸개는 0', () => {
    const base = startRun('guanyu', 1);
    for (const id of ['machao', 'huangzhong', 'xuchu', 'xiaohoudun', 'zhouyu', 'jiangwei', 'zhangfei', 'zhaoyun']) {
      for (const [wave, level] of [[4, 4], [10, 10], [5, 30], [17, 1]]) {
        const p = surrenderChance(atWave(base, wave, id, level));
        expect(p).toBeGreaterThanOrEqual(0.05);
        expect(p).toBeLessThanOrEqual(0.8);
      }
    }
    expect(surrenderChance(atWave(base, 6, 'zhangjiao', 9))).toBe(0);
    expect(surrenderChance(atWave(base, 1, MOB_ID))).toBe(0);
  });

  it('식: 0.25 + (선두 매력−50)/200 − (적 level−wave)/20', () => {
    const run = atWave(startRun('guanyu', 1), 4, 'machao', 4);
    const 매력 = getDuelGeneral('guanyu')!.stats.매력;
    const raw = 0.25 + (매력 - 50) / 200;
    expect(surrenderChance(run)).toBeCloseTo(Math.min(0.8, Math.max(0.05, raw)));
  });

  it('보스는 난수 0이어도 항복하지 않는다', () => {
    for (const [wave, id] of [[6, 'zhangjiao'], [12, 'dongzhuo']] as const) {
      const run = atWave(startRun('guanyu', 1), wave, id, wave + 3);
      run.battle!.enemy.hp = 0;
      const next = afterWin(run, () => 0);
      expect(next.record.waves[0].recruited).toBeFalsy();
      expect(next.roster).not.toContain(id);
    }
  });
});

describe('drawRewards', () => {
  function rewardRun(): RunState {
    const r = structuredClone(atWave(startRun('guanyu', 1), 2, MOB_ID));
    r.phase = 'reward';
    r.battle = null;
    return r;
  }

  it.each(SEEDS)('시드 %i: 3장, 중복 없음, 쓰러진 아군 없으면 부활약 없음', (seed) => {
    const rng = createRng(seed);
    for (let i = 0; i < 50; i++) {
      const run = rewardRun();
      run.party[0].hp = 10;
      const ids = drawRewards(run, rng).map((r) => r.id);
      expect(ids).toHaveLength(3);
      expect(new Set(ids).size).toBe(3);
      expect(ids).not.toContain('revive');
    }
  });

  it('쓸 수 없는 카드 제외: 회복(전원 가득), 자리+1(이미 4), 청룡언월도(관우 없음)', () => {
    const rng = createRng(9);
    const run = rewardRun();
    run.party = [makeFighter('zhangfei', 1)];
    run.partyMax = 4;
    for (let i = 0; i < 100; i++) {
      const ids = drawRewards(run, rng).map((r) => r.id);
      expect(ids).not.toContain('potion');
      expect(ids).not.toContain('slot');
      expect(ids).not.toContain('greendragon');
      expect(ids).not.toContain('revive');
    }
  });

  it('rare는 대략 25%', () => {
    const rng = createRng(11);
    const run = rewardRun();
    run.party.push(makeFighter('zhangfei', 1));
    run.party[1].hp = 0;
    let rare = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) rare += drawRewards(run, rng).filter((r) => r.rarity === 'rare').length;
    expect(rare / (N * 3)).toBeGreaterThan(0.2);
    expect(rare / (N * 3)).toBeLessThan(0.3);
  });

  it('보상 목록에 브리프의 카드가 다 있다', () => {
    const byId = Object.fromEntries(REWARDS.map((r) => [r.id, r]));
    expect(byId.redhare.rarity).toBe('rare');
    expect(byId.steed.rarity).toBe('common');
    expect(byId.greendragon.rarity).toBe('rare');
    expect(byId.sword.rarity).toBe('common');
    expect(byId.book.rarity).toBe('common');
    expect(byId.book_fire.rarity).toBe('rare');
    expect(byId.potion.rarity).toBe('common');
    expect(byId.revive.rarity).toBe('rare');
    expect(byId.learn_ambush).toBeDefined();
    expect(byId.learn_taunt).toBeDefined();
    expect(byId.slot.rarity).toBe('rare');
  });
});

describe('보상 적용', () => {
  function rewardRun(rng: Rng = createRng(1)): RunState {
    let run = weakenEnemy(startRun('guanyu', 1));
    run = playerTurn(run, { type: 'skill', skillId: 'strike' }, rng);
    expect(run.phase).toBe('reward');
    return run;
  }

  it('pickReward: 보상 적용, 다음 웨이브, 새 적, uses·status 초기화, hp·level·bonus 이어짐', () => {
    const rng = createRng(1);
    const run = structuredClone(rewardRun(rng));
    run.rewardsOffered = ['sword', 'steed', 'book'];
    run.party[0].hp = 77;
    run.party[0].uses.guanyu_ult = 0;
    run.party[0].status.burn = 2;
    const next = pickReward(run, 'sword', rng, 0);
    expect(next.phase).toBe('battle');
    expect(next.wave).toBe(2);
    expect(next.party[0].bonus.atk).toBe(8);
    expect(next.party[0].hp).toBe(77);
    expect(next.party[0].uses.guanyu_ult).toBe(3);
    expect(next.party[0].status).toEqual({});
    expect(next.enemy!.level).toBe(2);
    expect(next.battle).toEqual({ party: next.party, active: 0, enemy: next.enemy, turn: 1 });
    expect(next.record.rewards).toEqual(['sword']);
    expect(next.record.waves).toHaveLength(2);
    expect(next.rewardsOffered).toEqual([]);
  });

  it('제시되지 않은 보상, 잘못된 대상은 throw', () => {
    const rng = createRng(1);
    const run = structuredClone(rewardRun(rng));
    run.rewardsOffered = ['potion', 'revive', 'greendragon'];
    run.party[0].hp = 10;
    expect(() => pickReward(run, 'slot', rng)).toThrow();
    expect(() => pickReward(run, 'potion', rng)).toThrow();
    expect(() => pickReward(run, 'potion', rng, 3)).toThrow();
    expect(() => pickReward(run, 'revive', rng, 0)).toThrow(); // 쓰러진 장수가 아님
  });

  it('active는 첫 번째 살아 있는 자리', () => {
    const rng = createRng(1);
    const run = structuredClone(rewardRun(rng));
    run.party.unshift({ ...makeFighter('zhangfei', 1), hp: 0 });
    run.rewardsOffered = ['steed', 'sword', 'book'];
    const next = pickReward(run, 'steed', rng, 0);
    expect(next.battle!.active).toBe(1);
  });

  it('각 보상의 효과', () => {
    const run = structuredClone(rewardRun());
    run.party.push({ ...makeFighter('zhangfei', 1), hp: 0 });
    run.party[0].hp = 10;
    const g = (id: string, i?: number) => getReward(id).apply(run, i);
    expect(g('redhare', 0).party[0].bonus.speed).toBe(15);
    expect(g('steed', 0).party[0].bonus.speed).toBe(8);
    expect(g('greendragon', 0).party[0].bonus.atk).toBe(15);
    expect(() => g('greendragon', 1)).toThrow();
    expect(g('book', 0).party[0].bonus.int).toBe(10);
    const healed = g('potion', 0).party[0];
    expect(healed.hp).toBe(Math.min(healed.maxHp, 10 + Math.round(healed.maxHp * 0.5)));
    const revived = g('revive', 1).party[1];
    expect(revived.hp).toBe(Math.round(revived.maxHp * 0.5));
    expect(g('slot').partyMax).toBe(4);
    const fireGuy = g('book_fire', 0).party[0];
    expect(skillsOf(fireGuy)).toContain('fire');
    expect(fireGuy.uses.fire).toBe(SKILLS.fire.uses);
    expect(skillsOf(fireGuy)[0]).toBe('strike');
    expect(skillsOf(fireGuy)).toContain('guanyu_ult');
    expect(skillsOf(g('learn_ambush', 0).party[0])).toContain('ambush');
    expect(skillsOf(g('learn_taunt', 0).party[0])).toContain('taunt');
    // 이미 아는 기술은 다시 못 배운다: 조운은 매복을 안다
    const zy = structuredClone(run);
    zy.party[0] = makeFighter('zhaoyun', 1);
    expect(getReward('learn_ambush').targets!(zy)).not.toContain(0);
    expect(() => getReward('learn_ambush').apply(zy, 0)).toThrow();
  });

  it('배운 기술을 전투에서 쓸 수 있다', () => {
    const rng = createRng(1);
    const run = structuredClone(rewardRun(rng));
    run.rewardsOffered = ['book_fire', 'sword', 'book'];
    let next = pickReward(run, 'book_fire', rng, 0);
    next = playerTurn(next, { type: 'skill', skillId: 'fire' }, rng);
    expect(next.party[0].uses.fire).toBe((SKILLS.fire.uses as number) - 1);
  });
});

describe('freshForBattle', () => {
  it('uses는 최대로, status는 비우고, hp·level·bonus·exp는 그대로', () => {
    const f = { ...makeFighter('guanyu', 3), hp: 20, exp: 40, bonus: { atk: 8, int: 0, speed: 0 } };
    f.uses.guanyu_ult = 0;
    f.status = { burn: 2, taunt: 1 };
    const g = freshForBattle(f);
    expect(g.uses.guanyu_ult).toBe(3);
    expect(g.status).toEqual({});
    expect(g).toMatchObject({ hp: 20, level: 3, exp: 40, bonus: { atk: 8, int: 0, speed: 0 } });
    expect(f.uses.guanyu_ult).toBe(0);
  });
});
