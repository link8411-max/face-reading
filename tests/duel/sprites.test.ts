import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SPRITE_IDS = [
  'guanyu',
  'zhangfei',
  'zhaoyun',
  'machao',
  'huangzhong',
  'xuchu',
  'xiaohoudun',
  'zhouyu',
  'jiangwei',
  'zhangjiao',
  'dongzhuo',
  'lvbu',
  'mob',
];

const DIR = join(process.cwd(), 'public/images/samguk/sprites');

describe('일기토 장수 스프라이트', () => {
  for (const id of SPRITE_IDS) {
    it(`${id}.png 가 128×128 PNG이고 50KB 이하다`, () => {
      const file = join(DIR, `${id}.png`);
      expect(existsSync(file), file).toBe(true);
      const buf = readFileSync(file);
      expect(buf.subarray(1, 4).toString('ascii')).toBe('PNG');
      expect(buf.readUInt32BE(16)).toBe(128);
      expect(buf.readUInt32BE(20)).toBe(128);
      expect(statSync(file).size).toBeLessThanOrEqual(50 * 1024);
    });
  }
});
