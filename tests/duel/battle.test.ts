import { describe, it, expect } from 'vitest';
import { createRng } from '@/lib/duel/rng';
import { makeFighter, matchup, damage, resolveTurn, enemyAction } from '@/lib/duel/battle';
import { SKILLS } from '@/lib/duel/skills';
import type { BattleState, Fighter, Skill } from '@/lib/duel/types';

/** 난수 고정 1.0 (0.85~1.0 계수가 사실상 1.0) */
const ONE = () => 0.999999;
const F = 0.85 + 0.15 * 0.999999;

function state(party: Fighter[], enemy: Fighter): BattleState {
  return { party, active: 0, enemy, turn: 1 };
}

describe('createRng', () => {
  it('같은 시드는 같은 수열, [0,1) 범위', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 50; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
    expect(createRng(1)()).not.toBe(createRng(2)());
  });
});

describe('makeFighter', () => {
  it('maxHp = 통솔×2 + level×6, uses는 횟수 있는 기술만, status 비고 bonus 0', () => {
    const f = makeFighter('guanyu', 5);
    expect(f.maxHp).toBe(88 * 2 + 5 * 6);
    expect(f.hp).toBe(f.maxHp);
    expect(f.uses).toEqual({ guanyu_ult: 3, shout: 5 });
    expect(f.status).toEqual({});
    expect(f.bonus).toEqual({ atk: 0, int: 0, speed: 0 });
  });
});

describe('matchup', () => {
  it('맹장>기장>지장>맹장, 같은 유형 1', () => {
    expect(matchup('맹장', '기장')).toBe(1.5);
    expect(matchup('기장', '맹장')).toBe(0.67);
    expect(matchup('기장', '지장')).toBe(1.5);
    expect(matchup('지장', '맹장')).toBe(1.5);
    expect(matchup('맹장', '지장')).toBe(0.67);
    expect(matchup('맹장', '맹장')).toBe(1);
    expect(matchup('지장', '지장')).toBe(1);
  });
});

describe('damage', () => {
  it('자속: 관우의 strike(맹장)는 같은 위력 지장 기술보다 1.2배 (상성 차이 제외)', () => {
    const att = makeFighter('guanyu', 10);
    const def = makeFighter('lvbu', 10); // 맹장
    const fake: Skill = { id: 'fake', name: '가짜 책략', kind: '지장', power: 40, uses: null };
    const own = damage(att, def, SKILLS.strike, ONE);
    const other = damage(att, def, fake, ONE);
    const expectedRatio = (1.2 * matchup('맹장', '맹장')) / matchup('지장', '맹장');
    expect(own / other).toBeCloseTo(expectedRatio, 1);
    // 지장 주유: 자기 유형 scheme(자속 1.2, 상성 1.5) vs 같은 위력 맹장 기술(자속 없음, 상성 1)
    const mengSkill: Skill = { ...fake, kind: '맹장' };
    const zhouyu = makeFighter('zhouyu', 10);
    expect(damage(zhouyu, def, SKILLS.scheme, ONE) / damage(zhouyu, def, mengSkill, ONE)).toBeCloseTo(
      (1.2 * matchup('지장', '맹장')) / 1,
      1,
    );
    // 공식 그대로: 40 × (97/68) × 1 × 1.2 × ~1.0
    expect(own).toBe(Math.round(40 * (97 / 68) * 1.2 * F));
  });

  it('기장 공격 능력치는 무력 + speed/4', () => {
    const att = makeFighter('zhaoyun', 1); // 무력 96, speed 80
    const def = makeFighter('zhaoyun', 1); // 통솔 85
    expect(damage(att, def, SKILLS.thrust, ONE)).toBe(Math.round(40 * ((96 + 80 / 4) / 85) * 1.2 * F));
  });

  it('난수 계수는 0.85~1.0, 최소 1', () => {
    const att = makeFighter('guanyu', 10);
    const def = makeFighter('zhouyu', 10);
    const max = 40 * (97 / 95) * 0.67 * 1.2;
    for (let seed = 1; seed <= 100; seed++) {
      const d = damage(att, def, SKILLS.strike, createRng(seed));
      expect(d).toBeGreaterThanOrEqual(Math.floor(max * 0.85));
      expect(d).toBeLessThanOrEqual(Math.ceil(max));
    }
    const weak = { ...att, bonus: { ...att.bonus, atk: -1000 } };
    expect(damage(weak, def, SKILLS.strike, ONE)).toBe(1);
  });
});

describe('resolveTurn', () => {
  it('교체 턴: active가 바뀌고 플레이어는 기술을 쓰지 않으며 적만 행동한다', () => {
    const s = state([makeFighter('guanyu', 5), makeFighter('zhaoyun', 5)], makeFighter('mob', 5));
    const { state: next, log } = resolveTurn(s, { type: 'switch', toIndex: 1 }, createRng(7));
    expect(next.active).toBe(1);
    const playerEvents = log.filter((e) => e.who === 'player');
    expect(playerEvents.every((e) => e.kind === 'switch')).toBe(true);
    expect(log.some((e) => e.who === 'enemy' && e.kind === 'skill')).toBe(true);
    // 적의 공격은 새로 나온 조운이 맞는다
    expect(next.party[1].hp).toBeLessThan(next.party[1].maxHp);
    expect(next.party[0].hp).toBe(next.party[0].maxHp);
    expect(next.turn).toBe(2);
  });

  it('필살기 uses가 0이면 기본 공격으로 대체, text에 "힘이 남지 않았다"', () => {
    const g = makeFighter('guanyu', 5);
    const s = state([{ ...g, uses: { ...g.uses, guanyu_ult: 0 } }], makeFighter('lvbu', 20));
    const { log } = resolveTurn(s, { type: 'skill', skillId: 'guanyu_ult' }, ONE);
    const mine = log.filter((e) => e.who === 'player');
    expect(mine.some((e) => e.kind === 'miss')).toBe(false);
    const sk = mine.find((e) => e.kind === 'skill')!;
    expect(sk.skillId).toBe('strike');
    expect(sk.text).toContain('힘이 남지 않았다');
  });

  it('기술을 쓰면 uses가 줄고 입력 상태는 바뀌지 않는다', () => {
    const s = state([makeFighter('guanyu', 5)], makeFighter('lvbu', 20));
    const before = structuredClone(s);
    const { state: next } = resolveTurn(s, { type: 'skill', skillId: 'guanyu_ult' }, createRng(3));
    expect(next.party[0].uses.guanyu_ult).toBe(2);
    expect(s).toEqual(before);
  });

  it('burn은 턴 끝마다 maxHp 8% 피해, 3턴 후 사라진다', () => {
    const enemy = makeFighter('lvbu', 30);
    let s = state([makeFighter('zhouyu', 5)], { ...enemy, status: { burn: 3 } });
    const tick = Math.round(enemy.maxHp * 0.08);
    for (let t = 1; t <= 3; t++) {
      const hpBefore = s.enemy.hp;
      const r = resolveTurn(s, { type: 'skill', skillId: 'breathe' }, ONE);
      expect(r.log.some((e) => e.who === 'enemy' && e.kind === 'status' && e.amount === tick)).toBe(true);
      expect(r.state.enemy.hp).toBe(hpBefore - tick);
      s = r.state;
    }
    expect(s.enemy.status.burn).toBeUndefined();
    const r4 = resolveTurn(s, { type: 'skill', skillId: 'breathe' }, ONE);
    expect(r4.state.enemy.hp).toBe(s.enemy.hp);
  });

  it('fire는 상대에게 burn을 건다', () => {
    const s = state([makeFighter('jiangwei', 5)], makeFighter('lvbu', 30));
    const { state: next } = resolveTurn(s, { type: 'skill', skillId: 'fire' }, ONE);
    expect(next.enemy.status.burn).toBe(2); // 걸린 턴 끝에 1번 탔다
  });

  it('guard 턴에는 받는 피해가 절반 (동일 난수 비교)', () => {
    const s = state([makeFighter('guanyu', 10)], makeFighter('lvbu', 30));
    const hitOnPlayer = (skillId: string) =>
      resolveTurn(s, { type: 'skill', skillId }, ONE).log.find((e) => e.who === 'enemy' && e.kind === 'hit')!.amount!;
    const normal = hitOnPlayer('strike');
    const guarded = hitOnPlayer('guard');
    expect(Math.abs(guarded - normal / 2)).toBeLessThanOrEqual(1);
    // guard는 그 턴에만
    const after = resolveTurn(s, { type: 'skill', skillId: 'guard' }, ONE).state;
    expect(after.party[0].status.guard).toBeUndefined();
  });

  it('hp 0이 되면 ko 이벤트, 쓰러진 적은 행동하지 않는다', () => {
    const mob = makeFighter('mob', 1);
    const s = state([makeFighter('guanyu', 10)], { ...mob, hp: 1 });
    const { state: next, log } = resolveTurn(s, { type: 'skill', skillId: 'strike' }, ONE);
    expect(next.enemy.hp).toBe(0);
    expect(log.some((e) => e.who === 'enemy' && e.kind === 'ko')).toBe(true);
    expect(log.some((e) => e.who === 'enemy' && e.kind === 'skill')).toBe(false);
  });

  it('속도 순: 빠른 쪽이 먼저 행동한다', () => {
    const s = state([makeFighter('guanyu', 10)], makeFighter('lvbu', 10)); // 55 < 65
    const { log } = resolveTurn(s, { type: 'skill', skillId: 'strike' }, ONE);
    expect(log.find((e) => e.kind === 'skill')!.who).toBe('enemy');
  });

  it('동속이면 플레이어 먼저', () => {
    const s = state([makeFighter('guanyu', 10)], makeFighter('zhangfei', 10)); // 55 = 55
    const { log } = resolveTurn(s, { type: 'skill', skillId: 'strike' }, ONE);
    expect(log.find((e) => e.kind === 'skill')!.who).toBe('player');
  });

  it('도발당하면 기본 공격만 쓴다', () => {
    const g = makeFighter('guanyu', 10);
    const s = state([{ ...g, status: { taunt: 2 } }], makeFighter('lvbu', 30));
    const { state: next, log } = resolveTurn(s, { type: 'skill', skillId: 'guanyu_ult' }, ONE);
    const sk = log.find((e) => e.who === 'player' && e.kind === 'skill')!;
    expect(sk.skillId).toBe('strike');
    expect(sk.text).toContain('도발');
    expect(next.party[0].status.taunt).toBe(1);
    expect(next.party[0].uses.guanyu_ult).toBe(3);
  });

  it('혼란: 실패하면 miss 이벤트, 혼란은 풀린다', () => {
    const g = makeFighter('guanyu', 10);
    const s = state([{ ...g, status: { confuse: 1 } }], makeFighter('lvbu', 30));
    const { state: next, log } = resolveTurn(s, { type: 'skill', skillId: 'strike' }, () => 0.1);
    expect(log.some((e) => e.who === 'player' && e.kind === 'miss')).toBe(true);
    expect(log.some((e) => e.who === 'player' && e.kind === 'hit')).toBe(false);
    expect(next.party[0].status.confuse).toBeUndefined();
  });

  it('매복: 다음 피격 때 피해의 50%를 반격하고 소모된다', () => {
    const z = makeFighter('zhaoyun', 10);
    const s = state([{ ...z, status: { ambush: true } }], makeFighter('lvbu', 30));
    // 조운(80)이 여포(65)보다 빠르니 breathe 후 여포가 친다
    const { state: next, log } = resolveTurn(s, { type: 'skill', skillId: 'breathe' }, ONE);
    const hit = log.find((e) => e.who === 'enemy' && e.kind === 'hit')!;
    const counter = log.find((e) => e.who === 'player' && e.kind === 'counter')!;
    expect(counter.amount).toBe(Math.max(1, Math.round(hit.amount! * 0.5)));
    expect(next.enemy.hp).toBe(next.enemy.maxHp - counter.amount!);
    expect(next.party[0].status.ambush).toBeUndefined();
  });

  it('일갈: 상대의 다음 피해가 0.8배', () => {
    const s = state([makeFighter('guanyu', 10)], makeFighter('lvbu', 30));
    // 여포가 먼저 치므로 shout는 다음 턴 피해에 적용된다
    const t1 = resolveTurn(s, { type: 'skill', skillId: 'shout' }, ONE);
    expect(t1.state.enemy.status.shouted).toBe(true);
    const plain = resolveTurn(s, { type: 'skill', skillId: 'guard' }, ONE).log.find(
      (e) => e.who === 'enemy' && e.kind === 'hit',
    )!.amount!;
    const t2 = resolveTurn(t1.state, { type: 'skill', skillId: 'guard' }, ONE);
    const weakened = t2.log.find((e) => e.who === 'enemy' && e.kind === 'hit')!.amount!;
    expect(Math.abs(weakened - plain * 0.8)).toBeLessThanOrEqual(1);
    expect(t2.state.enemy.status.shouted).toBeUndefined();
  });

  it('heal(숨 고르기)은 maxHp 30% 회복, 최대치를 넘지 않는다', () => {
    const z = makeFighter('zhaoyun', 10);
    const s = state([{ ...z, hp: 10 }], makeFighter('mob', 1));
    // 조운(80)이 졸개(40)보다 빨라 먼저 회복하고 맞는다
    const { state: next, log } = resolveTurn(s, { type: 'skill', skillId: 'breathe' }, ONE);
    const healed = log.find((e) => e.who === 'player' && e.kind === 'status')!.amount!;
    expect(healed).toBe(Math.round(z.maxHp * 0.3));
    const hit = log.find((e) => e.who === 'enemy' && e.kind === 'hit')?.amount ?? 0;
    expect(next.party[0].hp).toBe(10 + healed - hit);
    const full = resolveTurn(state([z], makeFighter('mob', 1)), { type: 'skill', skillId: 'breathe' }, ONE);
    expect(full.log.find((e) => e.who === 'player' && e.kind === 'status')!.amount).toBe(0);
  });

  it('동일 시드·동일 입력 → 동일 결과', () => {
    const s = state([makeFighter('guanyu', 5), makeFighter('zhaoyun', 5)], makeFighter('zhangjiao', 8));
    const run = () => {
      const rng = createRng(1234);
      let cur = s;
      const logs = [];
      for (let i = 0; i < 5; i++) {
        const r = resolveTurn(cur, { type: 'skill', skillId: i % 2 ? 'strike' : 'guanyu_ult' }, rng);
        cur = r.state;
        logs.push(r.log);
      }
      return { cur, logs };
    };
    expect(run()).toEqual(run());
  });
});

describe('enemyAction', () => {
  it('상성 유리한 공격 기술을 고른다 (지장 장각 vs 맹장 관우 → 필살기)', () => {
    const s = state([makeFighter('guanyu', 5)], makeFighter('zhangjiao', 5));
    expect(enemyAction(s, ONE)).toEqual({ type: 'skill', skillId: 'zhangjiao_ult' });
  });

  it('필살기가 바닥나면 다음으로 센 기술', () => {
    const e = makeFighter('zhangjiao', 5);
    const s = state([makeFighter('guanyu', 5)], { ...e, uses: { ...e.uses, zhangjiao_ult: 0 } });
    expect(enemyAction(s, ONE)).toEqual({ type: 'skill', skillId: 'scheme' });
  });

  it('체력 30% 이하면 30% 확률로 guard/heal', () => {
    const e = makeFighter('zhangjiao', 5);
    const s = state([makeFighter('guanyu', 5)], { ...e, hp: Math.floor(e.maxHp * 0.3) });
    expect(enemyAction(s, () => 0.1)).toEqual({ type: 'skill', skillId: 'breathe' });
    expect(enemyAction(s, () => 0.9)).toEqual({ type: 'skill', skillId: 'zhangjiao_ult' });
  });
});
