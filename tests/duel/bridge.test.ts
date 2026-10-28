import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DuelBridge, type UiAction } from '@/game/duel/bridge';

type G = { window?: unknown };
const g = globalThis as G;

describe('DuelBridge', () => {
  beforeEach(() => {
    g.window = {};
  });
  afterEach(() => {
    delete g.window;
  });

  it("'ui:action'을 발행하고 받는다", () => {
    const b = new DuelBridge();
    const got: UiAction[] = [];
    b.on('ui:action', (a) => got.push(a));
    b.emit('ui:action', { type: 'skill', skillId: 'strike' });
    b.emit('ui:action', { type: 'switch', toIndex: 1 });
    expect(got).toEqual([
      { type: 'skill', skillId: 'strike' },
      { type: 'switch', toIndex: 1 },
    ]);
  });

  it('off로 떼면 더 받지 않는다', () => {
    const b = new DuelBridge();
    let n = 0;
    const fn = () => void n++;
    b.on('anim:done', fn);
    b.emit('anim:done', { sides: { player: 'left' } });
    b.off('anim:done', fn);
    b.emit('anim:done', { sides: { player: 'left' } });
    expect(n).toBe(1);
  });

  it('once는 한 번만 부른다', () => {
    const b = new DuelBridge();
    let n = 0;
    b.once('anim:done', () => void n++);
    b.emit('anim:done', { sides: { player: 'right' } });
    b.emit('anim:done', { sides: { player: 'right' } });
    expect(n).toBe(1);
  });

  it("'scene:changed'와 'run:update' 때 window.__duel을 갱신한다", () => {
    const b = new DuelBridge();
    b.emit('scene:changed', { scene: 'battle' });
    const w = g.window as { __duel?: Record<string, unknown> };
    expect(w.__duel?.scene).toBe('battle');
    expect(w.__duel?.animating).toBe(false);
    b.emit('run:update', { run: { phase: 'battle', wave: 3 } as never });
    expect(w.__duel?.phase).toBe('battle');
    expect(w.__duel?.wave).toBe(3);
    b.setAnimating(true);
    expect(w.__duel?.animating).toBe(true);
  });

  it('window가 없어도 예외 없이 동작한다', () => {
    delete g.window;
    const b = new DuelBridge();
    expect(() => b.emit('run:update', { run: { phase: 'battle', wave: 1 } as never })).not.toThrow();
  });
});
