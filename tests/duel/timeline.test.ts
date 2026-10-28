import { describe, it, expect } from 'vitest';
import { passPose, koPose, cutinAlpha, eventsToTimeline, HITSTOP_MS, PASS_MS, type TimelineItem } from '@/game/duel/timeline';
import type { TurnEvent } from '@/lib/duel/types';

const ev = (e: Partial<TurnEvent> & Pick<TurnEvent, 'who' | 'kind'>): TurnEvent => ({ text: '', ...e });

const monotone = (tl: TimelineItem[]) => tl.every((it, i) => i === 0 || it.at >= tl[i - 1].at);

describe('passPose', () => {
  it('0.45에 가운데에 닿는다', () => {
    expect(passPose(0.45, 'left').x).toBeCloseTo(0.5, 5);
    expect(passPose(0.45, 'right').x).toBeCloseTo(0.5, 5);
  });
  it('왼쪽에서 출발하면 오른쪽 끝에 멈추고 오른쪽을 본다', () => {
    const p = passPose(1, 'left');
    expect(p.x).toBeCloseTo(0.98, 5);
    expect(p.facing).toBe(1);
    expect(passPose(0, 'left').x).toBeCloseTo(0.02, 5);
  });
  it('오른쪽에서 출발하면 왼쪽 끝에 멈추고 왼쪽을 본다', () => {
    const p = passPose(1, 'right');
    expect(p.x).toBeCloseTo(0.02, 5);
    expect(p.facing).toBe(-1);
  });
  it('충돌 구간(0.45~0.55)에는 가운데에 멈춰 있다', () => {
    expect(passPose(0.5, 'left').x).toBeCloseTo(0.5, 5);
    expect(passPose(0.55, 'right').x).toBeCloseTo(0.5, 5);
  });
});

describe('koPose / cutinAlpha', () => {
  it('koPose(1)은 완전히 사라진다', () => {
    const p = koPose(1);
    expect(p.alpha).toBe(0);
    expect(p.dy).toBe(20);
    expect(p.scale).toBeCloseTo(0.9, 5);
    expect(koPose(0).alpha).toBe(1);
  });
  it('cutinAlpha는 0~1 사이이고 가운데에서 1', () => {
    expect(cutinAlpha(0)).toBe(0);
    expect(cutinAlpha(0.5)).toBe(1);
    expect(cutinAlpha(1)).toBe(0);
  });
});

describe('eventsToTimeline', () => {
  it('빈 events는 빈 timeline', () => {
    expect(eventsToTimeline([], { player: 'left' })).toEqual([]);
  });

  it('두 행동이 한 합: pass 하나, 피해마다 clash, at 단조 증가, ko는 끝에', () => {
    const tl = eventsToTimeline(
      [
        ev({ who: 'player', kind: 'skill', skillId: 'strike' }),
        ev({ who: 'player', kind: 'hit', skillId: 'strike', amount: 30 }),
        ev({ who: 'enemy', kind: 'skill', skillId: 'strike' }),
        ev({ who: 'enemy', kind: 'hit', skillId: 'strike', amount: 20 }),
        ev({ who: 'enemy', kind: 'ko' }),
      ],
      { player: 'left' },
    );
    expect(tl.filter((i) => i.kind === 'pass')).toHaveLength(1);
    expect(tl.filter((i) => i.kind === 'clash')).toHaveLength(2);
    expect(tl[tl.length - 1].kind).toBe('ko');
    expect(tl[tl.length - 1].who).toBe('enemy');
    expect(monotone(tl)).toBe(true);
    const clash = tl.find((i) => i.kind === 'clash')!;
    expect(clash.at).toBe(PASS_MS / 2 - 150);
    expect(clash.dur).toBe(300);
  });

  it('합이 끝나면 좌우가 바뀐다', () => {
    const tl = eventsToTimeline(
      [
        ev({ who: 'player', kind: 'skill', skillId: 'strike' }),
        ev({ who: 'player', kind: 'hit', amount: 10 }),
        ev({ who: 'enemy', kind: 'skill', skillId: 'guard' }),
      ],
      { player: 'left' },
    );
    expect(tl.every((i) => i.sidesAfter.player === 'right')).toBe(true);
    const back = eventsToTimeline([ev({ who: 'enemy', kind: 'skill', skillId: 'guard' }), ev({ who: 'player', kind: 'skill', skillId: 'guard' })], {
      player: 'right',
    });
    expect(back[0].sidesAfter.player).toBe('left');
  });

  it('두 합이 이어지면 두 번 바뀌어 제자리', () => {
    const turn = [
      ev({ who: 'player', kind: 'skill', skillId: 'strike' }),
      ev({ who: 'enemy', kind: 'skill', skillId: 'strike' }),
    ];
    const tl = eventsToTimeline([...turn, ...turn], { player: 'left' });
    const passes = tl.filter((i) => i.kind === 'pass');
    expect(passes).toHaveLength(2);
    expect(passes[0].sidesAfter.player).toBe('right');
    expect(passes[1].sidesAfter.player).toBe('left');
    expect(passes[1].at).toBeGreaterThanOrEqual(passes[0].at + passes[0].dur);
    expect(monotone(tl)).toBe(true);
  });

  it('빗나감(혼란)은 clash 없이 pass만', () => {
    const tl = eventsToTimeline(
      [ev({ who: 'player', kind: 'miss' }), ev({ who: 'enemy', kind: 'skill', skillId: 'guard' }), ev({ who: 'enemy', kind: 'status' })],
      { player: 'left' },
    );
    expect(tl.some((i) => i.kind === 'pass')).toBe(true);
    expect(tl.some((i) => i.kind === 'clash')).toBe(false);
  });

  it('필살기(_ult)는 cutin 다음 strike, clash는 없다', () => {
    const tl = eventsToTimeline(
      [
        ev({ who: 'player', kind: 'skill', skillId: 'guanyu_ult' }),
        ev({ who: 'player', kind: 'hit', skillId: 'guanyu_ult', amount: 90 }),
        ev({ who: 'enemy', kind: 'skill', skillId: 'strike' }),
        ev({ who: 'enemy', kind: 'miss' }),
      ],
      { player: 'left' },
    );
    const ci = tl.findIndex((i) => i.kind === 'cutin');
    const st = tl.findIndex((i) => i.kind === 'strike');
    expect(ci).toBeGreaterThanOrEqual(0);
    expect(st).toBeGreaterThan(ci);
    expect(tl[ci].dur).toBe(900);
    expect(tl[ci].skillId).toBe('guanyu_ult');
    expect(tl[ci].who).toBe('player');
    expect(tl[st].dur).toBe(400);
    expect(tl[st].amount).toBe(90);
    expect(tl[st].at).toBeGreaterThanOrEqual(tl[ci].at + 900);
    expect(tl.some((i) => i.kind === 'clash')).toBe(false);
    // 컷인·베기 동안 pass가 멈춰 있으므로 pass는 그만큼 길다
    const pass = tl.find((i) => i.kind === 'pass')!;
    expect(pass.dur).toBe(PASS_MS + 900 + 400);
    expect(monotone(tl)).toBe(true);
  });

  it('횟수 제한 공용 기술(일갈)은 필살기가 아니다', () => {
    const tl = eventsToTimeline(
      [ev({ who: 'player', kind: 'skill', skillId: 'shout' }), ev({ who: 'enemy', kind: 'skill', skillId: 'strike' })],
      { player: 'left' },
    );
    expect(tl.some((i) => i.kind === 'cutin')).toBe(false);
  });

  it('교체 턴도 한 합(적 행동만)', () => {
    const tl = eventsToTimeline(
      [
        ev({ who: 'player', kind: 'switch' }),
        ev({ who: 'enemy', kind: 'skill', skillId: 'strike' }),
        ev({ who: 'enemy', kind: 'hit', amount: 12 }),
      ],
      { player: 'right' },
    );
    expect(tl.filter((i) => i.kind === 'pass')).toHaveLength(1);
    expect(tl.filter((i) => i.kind === 'clash')).toHaveLength(1);
    expect(tl[0].sidesAfter.player).toBe('left');
  });

  it('상태 이벤트는 합 뒤 text 항목, 화상 피해량을 담는다', () => {
    const tl = eventsToTimeline(
      [
        ev({ who: 'player', kind: 'skill', skillId: 'fire' }),
        ev({ who: 'player', kind: 'hit', amount: 20 }),
        ev({ who: 'enemy', kind: 'status', text: '불이 붙었다' }),
        ev({ who: 'enemy', kind: 'skill', skillId: 'strike' }),
        ev({ who: 'enemy', kind: 'hit', amount: 15 }),
        ev({ who: 'enemy', kind: 'status', amount: 8, text: '불길' }),
      ],
      { player: 'left' },
    );
    const texts = tl.filter((i) => i.kind === 'text');
    expect(texts).toHaveLength(2);
    expect(texts[1].amount).toBe(8);
    const pass = tl.find((i) => i.kind === 'pass')!;
    expect(texts[0].at).toBeGreaterThanOrEqual(pass.at + pass.dur);
    expect(monotone(tl)).toBe(true);
  });
});

describe('치명타·보스 예고 연출 (Task 14cd)', () => {
  const sides = { player: 'left' as const };
  it('crit 피해는 clash에 crit: true, 그 합은 히트스톱(HITSTOP_MS)만큼 가운데에 더 멈춘다', () => {
    const plain = eventsToTimeline([ev({ who: 'player', kind: 'skill', skillId: 'strike' }), ev({ who: 'player', kind: 'hit', amount: 10 })], sides);
    const crit = eventsToTimeline([ev({ who: 'player', kind: 'skill', skillId: 'strike' }), ev({ who: 'player', kind: 'hit', amount: 15, crit: true })], sides);
    const c = crit.find((it) => it.kind === 'clash')!;
    expect(c.crit).toBe(true);
    expect(plain.find((it) => it.kind === 'clash')!.crit).toBeUndefined();
    const pass = crit.find((it) => it.kind === 'pass')!;
    expect(pass.hold).toBe(HITSTOP_MS);
    expect(pass.dur).toBe(PASS_MS + HITSTOP_MS);
    expect(HITSTOP_MS).toBe(120);
  });
  it('필살기 베기가 치명타면 strike에 crit: true', () => {
    const tl = eventsToTimeline([ev({ who: 'player', kind: 'skill', skillId: 'guanyu_ult' }), ev({ who: 'player', kind: 'hit', amount: 40, crit: true })], sides);
    expect(tl.find((it) => it.kind === 'strike')!.crit).toBe(true);
  });
  it('보스 필살기 예고(적 status + skillId)는 text 항목에 telegraph: true', () => {
    const tl = eventsToTimeline(
      [
        ev({ who: 'player', kind: 'skill', skillId: 'strike' }),
        ev({ who: 'player', kind: 'hit', amount: 10 }),
        ev({ who: 'enemy', kind: 'status', skillId: 'dongzhuo_ult', text: '동탁이 폭정을 준비한다!' }),
      ],
      sides,
    );
    const t = tl.find((it) => it.kind === 'text')!;
    expect(t.telegraph).toBe(true);
    expect(t.skillId).toBe('dongzhuo_ult');
    // 화상 같은 보통 상태 글은 예고가 아니다
    const burn = eventsToTimeline([ev({ who: 'enemy', kind: 'status', amount: 5, text: '불길' })], sides);
    expect(burn[0].telegraph).toBeUndefined();
  });
});
