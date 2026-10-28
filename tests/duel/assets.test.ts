import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DUEL_GENERALS } from '@/lib/duel/generals';
import { REWARDS } from '@/lib/duel/rewards';
import { ART, rewardIcon } from '@/game/duel/rewardIcons';
import { SPRITE_PX } from '@/game/duel/config';

const IMG = join(process.cwd(), 'public/images/samguk');
const pngSize = (file: string) => {
  const buf = readFileSync(file);
  expect(buf.subarray(1, 4).toString('ascii')).toBe('PNG');
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), bytes: statSync(file).size };
};

describe('게임용 초상(46×54 팔레트 PNG)', () => {
  for (const g of DUEL_GENERALS.filter((x) => x.role !== 'mob')) {
    it(`${g.id}: 46×54, 8KB 이하`, () => {
      const f = join(IMG, 'duel-portraits', `${g.id}.png`);
      expect(existsSync(f), f).toBe(true);
      const s = pngSize(f);
      expect([s.w, s.h]).toEqual([46, 54]);
      expect(s.bytes).toBeLessThanOrEqual(8 * 1024);
    });
  }
});

describe('외곽선 스프라이트(40×40)', () => {
  for (const g of DUEL_GENERALS) {
    it(`${g.id}: ${SPRITE_PX}×${SPRITE_PX}, 8KB 이하`, () => {
      const f = join(IMG, 'sprites-outlined', `${g.id}.png`);
      expect(existsSync(f), f).toBe(true);
      const s = pngSize(f);
      expect([s.w, s.h]).toEqual([SPRITE_PX, SPRITE_PX]);
      expect(s.bytes).toBeLessThanOrEqual(8 * 1024);
    });
  }
});

describe('Galmuri 서브셋 글꼴', () => {
  it('woff2 합계 400KB 이하, 라이선스 파일 유지', () => {
    const dir = join(process.cwd(), 'public/fonts/galmuri');
    const fonts = readdirSync(dir).filter((f) => f.endsWith('.woff2'));
    expect(fonts.length).toBeGreaterThanOrEqual(4);
    const total = fonts.reduce((n, f) => n + statSync(join(dir, f)).size, 0);
    expect(total).toBeLessThanOrEqual(400 * 1024);
    expect(existsSync(join(dir, 'LICENSE.txt'))).toBe(true);
  });
});

describe('보상 카드 아이콘', () => {
  it('모든 보상에 아이콘이 있고, 그림은 16×16, 아는 글자만', () => {
    for (const r of REWARDS) expect(ART[rewardIcon(r.id)]).toBeDefined();
    for (const [name, rows] of Object.entries(ART)) {
      expect(rows, name).toHaveLength(16);
      for (const row of rows) {
        expect(row.length, `${name} ${row}`).toBe(16);
        expect(/^[.kwgyrcobsm]+$/.test(row), `${name} ${row}`).toBe(true);
      }
    }
    // 종류가 6가지 이상
    expect(new Set(REWARDS.map((r) => rewardIcon(r.id))).size).toBeGreaterThanOrEqual(6);
  });
});
