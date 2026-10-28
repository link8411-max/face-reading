import { describe, it, expect } from 'vitest';
import { duelCta } from '@/lib/duel/cta';

describe('duelCta (삼국지 결과 → 일기토 단추)', () => {
  it.each(['guanyu', 'zhangfei', 'zhaoyun', 'machao', 'zhouyu', 'jiangwei'])('%s(시작·영입 장수)는 ?me=…&from=samguk으로 그 장수를 연다', (id) => {
    expect(duelCta(id)).toEqual({ label: '이 장수로 일기토 하기', href: `/samguk/duel?me=${id}&from=samguk` });
  });
  it.each(['caocao', 'lvbu', 'dongzhuo', 'mob', 'simayi', ''])('%s(명단 밖·보스·졸개)는 일반 링크', (id) => {
    expect(duelCta(id)).toEqual({ label: '삼국지 일기토 하러 가기', href: '/samguk/duel' });
  });
});
