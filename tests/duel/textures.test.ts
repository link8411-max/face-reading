import { describe, it, expect } from 'vitest';
import { paintField, paintCloth, paintFrame } from '@/game/duel/fieldPainter';

// 모의 2D 컨텍스트: 호출 수만 센다
function mockCtx() {
  const calls = { fillRect: 0, arc: 0, stroke: 0 };
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    imageSmoothingEnabled: true,
    fillRect: () => void calls.fillRect++,
    beginPath: () => {},
    arc: () => void calls.arc++,
    stroke: () => void calls.stroke++,
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

describe('fieldPainter', () => {
  it('paintField(ctx, 296, 70)가 예외 없이 사각형을 칠한다', () => {
    const { ctx, calls } = mockCtx();
    expect(() => paintField(ctx, 296, 70)).not.toThrow();
    expect(calls.fillRect).toBeGreaterThan(0);
  });
  it('paintCloth가 체커 디더와 곡선을 그린다', () => {
    const { ctx, calls } = mockCtx();
    expect(() => paintCloth(ctx)).not.toThrow();
    // 바탕 1번 + 체커 320*240/2
    expect(calls.fillRect).toBeGreaterThan(320 * 120);
    expect(calls.arc).toBe(15);
  });
  it('paintFrame이 삼중선과 모서리 문양을 그린다', () => {
    const { ctx, calls } = mockCtx();
    expect(() => paintFrame(ctx)).not.toThrow();
    expect(calls.fillRect).toBe(12 + 4 * 4);
  });
});
