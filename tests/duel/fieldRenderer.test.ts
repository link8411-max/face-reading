import { describe, it, expect } from 'vitest';
import { createFieldScene, shakeAt, sceneLength, DEFAULT_REGION } from '@/components/duel/fieldRenderer';
import { eventsToTimeline } from '@/components/duel/animations';
import type { TurnEvent } from '@/lib/duel/types';

// node 환경: 그리기 호출만 세는 최소 2D context
function mockCtx() {
  const calls: Record<string, number> = {};
  const count = (k: string) => () => {
    calls[k] = (calls[k] ?? 0) + 1;
  };
  const ctx = {
    fillStyle: '',
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    imageSmoothingEnabled: true,
    fillRect: count('fillRect'),
    fillText: count('fillText'),
    drawImage: count('drawImage'),
    save: count('save'),
    restore: count('restore'),
    translate: count('translate'),
    scale: count('scale'),
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls, raw: ctx };
}

const ev = (e: Partial<TurnEvent> & Pick<TurnEvent, 'who' | 'kind'>): TurnEvent => ({ text: '', ...e });

describe('createFieldScene.render', () => {
  const fighters = { player: { id: 'guanyu', name: '관우' }, enemy: { id: 'mob', name: '황건적 졸개' } };

  it('빈 timeline이면 바로 done, 자리 그대로, 흔들림 없음', () => {
    const scene = createFieldScene(fighters);
    const { ctx, calls, raw } = mockCtx();
    const res = scene.render(ctx, DEFAULT_REGION, [], 0, { player: 'right' });
    expect(res.done).toBe(true);
    expect(res.sidesAfter).toEqual({ player: 'right' });
    expect(res.shake).toEqual({ dx: 0, dy: 0 });
    expect(calls.fillRect).toBeGreaterThan(100);
    expect(raw.imageSmoothingEnabled).toBe(false);
    scene.dispose();
  });

  it('타임라인 중간에는 not done, 끝나면 done + 바뀐 자리', () => {
    const tl = eventsToTimeline(
      [ev({ who: 'player', kind: 'skill', skillId: 'strike' }), ev({ who: 'player', kind: 'hit', amount: 30 })],
      { player: 'left' },
    );
    const scene = createFieldScene(fighters);
    const { ctx, calls } = mockCtx();
    const mid = scene.render(ctx, DEFAULT_REGION, tl, 300, { player: 'left' });
    expect(mid.done).toBe(false);
    expect(calls.fillText).toBeGreaterThan(0); // 피해 숫자
    const end = scene.render(ctx, DEFAULT_REGION, tl, sceneLength(tl), { player: 'left' });
    expect(end.done).toBe(true);
    expect(end.sidesAfter).toEqual({ player: 'right' });
  });

  it('흔들림은 충돌 직후에만, region 배율만큼 커진다', () => {
    const tl = eventsToTimeline(
      [ev({ who: 'player', kind: 'skill', skillId: 'strike' }), ev({ who: 'player', kind: 'hit', amount: 30 })],
      { player: 'left' },
    );
    const clash = tl.find((i) => i.kind === 'clash')!;
    expect(shakeAt(tl, clash.at).dx).not.toBe(0);
    expect(shakeAt(tl, clash.at + 250)).toEqual({ dx: 0, dy: 0 });
    const scene = createFieldScene(fighters);
    const { ctx } = mockCtx();
    const res = scene.render(ctx, { x: 0, y: 0, w: 592, h: 140 }, tl, clash.at, { player: 'left' });
    expect(res.shake.dx).toBe(shakeAt(tl, clash.at).dx * 2);
    const calm = scene.render(ctx, DEFAULT_REGION, tl, clash.at, { player: 'left' }, { reducedMotion: true });
    expect(calm.shake).toEqual({ dx: 0, dy: 0 });
  });

  it('필살기·반격·화상·쓰러짐 타임라인을 처음부터 끝까지 그려도 멈추지 않는다', () => {
    const tl = eventsToTimeline(
      [
        ev({ who: 'player', kind: 'skill', skillId: 'guanyu_ult' }),
        ev({ who: 'player', kind: 'hit', amount: 90 }),
        ev({ who: 'enemy', kind: 'counter', amount: 20 }),
        ev({ who: 'enemy', kind: 'skill', skillId: 'strike' }),
        ev({ who: 'enemy', kind: 'hit', amount: 10 }),
        ev({ who: 'enemy', kind: 'status', amount: 8, text: '불길' }),
        ev({ who: 'enemy', kind: 'ko' }),
      ],
      { player: 'right' },
    );
    const scene = createFieldScene(fighters);
    const { ctx } = mockCtx();
    const total = sceneLength(tl);
    let last = null as ReturnType<typeof scene.render> | null;
    for (let e = 0; e <= total; e += 25) last = scene.render(ctx, { x: 12, y: 30, w: 296, h: 70 }, tl, e, { player: 'right' });
    last = scene.render(ctx, DEFAULT_REGION, tl, total, { player: 'right' });
    expect(last.done).toBe(true);
    expect(last.sidesAfter).toEqual({ player: 'left' });
  });
});
