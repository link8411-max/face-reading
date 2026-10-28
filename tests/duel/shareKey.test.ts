import { describe, it, expect } from 'vitest';
import { decodeRunKey, encodeRunKey } from '@/lib/duel/shareKey';
import { duelShared, duelShareUrl, ogImageUrl } from '@/lib/shareLinks';
import { ogQueryOk } from '@/lib/ogQuery';
import { generateMetadata as duelShareMeta } from '@/app/samguk/duel/r/[key]/page';
import type { RunRecord } from '@/lib/duel/types';

const lost: RunRecord = {
  starter: 'guanyu',
  waves: [
    { wave: 1, enemy: 'mob', turns: 3 },
    { wave: 17, enemy: 'lvbu', turns: 9 },
  ],
  rewards: [],
  cleared: false,
};

describe('일기토 공유 키', () => {
  it('encode: <starter>.<lastEnemy>.<wave>.<c|l>.<turns>', () => {
    expect(encodeRunKey(lost)).toBe('guanyu.lvbu.17.l.9');
    expect(encodeRunKey({ ...lost, cleared: true, waves: [{ wave: 18, enemy: 'lvbu', turns: 12 }] })).toBe('guanyu.lvbu.18.c.12');
  });

  it('encode → decode 왕복', () => {
    expect(decodeRunKey(encodeRunKey(lost))).toEqual({ starter: 'guanyu', lastEnemy: 'lvbu', wave: 17, cleared: false, turns: 9 });
    expect(decodeRunKey('zhaoyun.mob.2.l.4')).toEqual({ starter: 'zhaoyun', lastEnemy: 'mob', wave: 2, cleared: false, turns: 4 });
    expect(decodeRunKey('machao.dongzhuo.12.l.30')?.starter).toBe('machao');
  });

  it('잘못된 키는 null', () => {
    expect(decodeRunKey('guanyu.lvbu.99.l.9')).toBeNull();
    expect(decodeRunKey('guanyu.lvbu.0.l.9')).toBeNull();
    expect(decodeRunKey('guanyu.lvbu.17.l.0')).toBeNull();
    expect(decodeRunKey('caocao.lvbu.3.l.2')).toBeNull();
    expect(decodeRunKey('lvbu.lvbu.3.l.2')).toBeNull(); // 보스는 선두가 될 수 없다
    expect(decodeRunKey('mob.lvbu.3.l.2')).toBeNull();
    expect(decodeRunKey('guanyu.caocao.3.l.2')).toBeNull();
    expect(decodeRunKey('guanyu.lvbu.3.x.2')).toBeNull();
    expect(decodeRunKey('guanyu.lvbu.3.l.2.extra')).toBeNull();
    expect(decodeRunKey('constructor.lvbu.3.l.2')).toBeNull();
    expect(decodeRunKey(`guanyu.${'a'.repeat(60)}.3.l.2`)).toBeNull();
  });

  it('duelShared: headline·선두 이름·초상', () => {
    expect(duelShared('guanyu.lvbu.17.l.9')).toEqual({
      headline: '관우, 열일곱째 싸움에서 여포에게 아홉 합 끝에 쓰러지다',
      starterName: '관우',
      image: '/images/samguk/관우.jpg',
    });
    expect(duelShared('zhaoyun.lvbu.18.c.12')?.headline).toBe('조운, 열여덟째 싸움에서 여포를 꺾고 천하에 이름을 떨치다');
    expect(duelShared('nope')).toBeNull();
  });

  it('duelShareUrl·ogImageUrl', () => {
    expect(duelShareUrl(lost)).toBe('https://unse-ai.com/samguk/duel/r/guanyu.lvbu.17.l.9?utm_source=share&utm_medium=friend_link&utm_campaign=duel');
    expect(ogImageUrl('duel', 'guanyu.lvbu.17.l.9')).toBe('https://unse-ai.com/api/og/result?kind=duel&key=guanyu.lvbu.17.l.9');
  });

  it('ogQueryOk: duel은 key만', () => {
    expect(ogQueryOk(new URLSearchParams('kind=duel&key=guanyu.lvbu.17.l.9'))).toBe(true);
    expect(ogQueryOk(new URLSearchParams('kind=duel&key=guanyu.lvbu.17.l.9&s=70'))).toBe(false);
  });

  it('착지 페이지 메타: headline 제목, 검색 제외, canonical은 일기토, 미리보기 kind=duel', async () => {
    const m = await duelShareMeta({ params: Promise.resolve({ key: 'guanyu.lvbu.17.l.9' }) });
    expect(m.title).toBe('관우, 열일곱째 싸움에서 여포에게 아홉 합 끝에 쓰러지다');
    expect(m.description).toBe('친구가 보낸 삼국지 일기토 기록이에요. 나도 출진해 볼까?');
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(m.alternates?.canonical).toBe('https://unse-ai.com/samguk/duel');
    expect(JSON.stringify(m.openGraph?.images)).toContain('/api/og/result?kind=duel&key=guanyu.lvbu.17.l.9');
    expect(JSON.stringify(m.twitter)).toContain('kind=duel&key=guanyu.lvbu.17.l.9');
    expect((await duelShareMeta({ params: Promise.resolve({ key: 'caocao.lvbu.3.l.2' }) })).openGraph).toBeUndefined();
  });
});
