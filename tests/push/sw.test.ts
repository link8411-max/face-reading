import { koLayoutSource } from '../helpers/koLayoutSource'
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import manifest from '@/app/manifest';

const root = process.cwd();
const sw = readFileSync(join(root, 'public/sw.js'), 'utf8');

describe('service worker source', () => {
  it.each([
    "addEventListener('push'",
    "addEventListener('notificationclick'",
    "addEventListener('pushsubscriptionchange'",
    'renotify: true',
    "tag: 'daily-fortune'",
    '오늘의 운세가 도착했어요',
    'unmyeong-v2',
  ])('contains %s', (s) => {
    expect(sw).toContain(s);
  });
});

describe('push icons', () => {
  it.each(['icon-192', 'icon-512', 'apple-touch-icon-180', 'badge-96'])('%s.png is a PNG', (n) => {
    const p = join(root, `public/icons/${n}.png`);
    expect(existsSync(p)).toBe(true);
    const buf = readFileSync(p);
    expect([...buf.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });
});

describe('manifest / layout', () => {
  it('first icon is PNG 192', () => {
    const m = manifest();
    expect(m.icons?.[0]).toMatchObject({ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' });
  });
  it('layout uses apple-touch-icon-180.png', () => {
    expect(koLayoutSource()).toContain('apple-touch-icon-180.png');
  });
});
