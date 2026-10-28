import { describe, it, expect } from 'vitest';
import { formatRealRow, groupReal, summarizeReal, type RunRow } from '@/lib/duel/realStats';

const row = (o: Partial<RunRow>): RunRow => ({
  version: 'aaaaaaaa',
  starter: 'guanyu',
  reached_wave: 5,
  cleared: false,
  last_enemy: 'mob',
  turns: 10,
  duration_bucket: '<10m',
  ...o,
});

describe('summarizeReal', () => {
  it('빈 입력은 0으로 채운다', () => {
    const s = summarizeReal([]);
    expect(s.n).toBe(0);
    expect(s.survive[12]).toBe(0);
    expect(s.meanTurns).toBe(0);
  });
  it('생존: 해당 웨이브를 넘겼거나 클리어한 판의 비율', () => {
    const s = summarizeReal([
      row({ reached_wave: 5 }),
      row({ reached_wave: 12 }), // 12에서 졌다 -> 12까지 넘기지 못함
      row({ reached_wave: 13 }),
      row({ reached_wave: 19 }),
      row({ reached_wave: 36, cleared: true }),
    ]);
    expect(s.survive[12]).toBeCloseTo(3 / 5);
    expect(s.survive[18]).toBeCloseTo(2 / 5);
    expect(s.survive[24]).toBeCloseTo(1 / 5);
    expect(s.clear).toBeCloseTo(1 / 5);
  });
  it('보스별 패배 비율은 패배한 판 안에서의 비율', () => {
    const s = summarizeReal([
      row({ reached_wave: 6 }),
      row({ reached_wave: 6 }),
      row({ reached_wave: 12 }),
      row({ reached_wave: 7 }),
      row({ reached_wave: 36, cleared: true }),
    ]);
    expect(s.deathShare.find((d) => d.wave === 6)!.share).toBeCloseTo(2 / 4);
    expect(s.deathShare.find((d) => d.wave === 12)!.share).toBeCloseTo(1 / 4);
    expect(s.deathShare.find((d) => d.wave === 36)!.share).toBe(0);
  });
  it('평균 턴과 시간 구간 분포', () => {
    const s = summarizeReal([
      row({ turns: 10, duration_bucket: '<10m' }),
      row({ turns: 30, duration_bucket: '10-30m' }),
      row({ turns: 50, duration_bucket: '10-30m' }),
      row({ turns: 10, duration_bucket: '>90m' }),
    ]);
    expect(s.meanTurns).toBe(25);
    expect(s.duration['<10m']).toBeCloseTo(0.25);
    expect(s.duration['10-30m']).toBeCloseTo(0.5);
    expect(s.duration['>90m']).toBeCloseTo(0.25);
    expect(s.duration['30-60m']).toBe(0);
  });
});

describe('groupReal', () => {
  it('버전별 -> 시작 장수별 + 전체', () => {
    const g = groupReal([row({ version: 'aaaaaaaa', starter: 'guanyu' }), row({ version: 'aaaaaaaa', starter: 'zhaoyun' }), row({ version: 'bbbbbbbb' })]);
    expect([...g.keys()].sort()).toEqual(['aaaaaaaa', 'bbbbbbbb']);
    const a = g.get('aaaaaaaa')!;
    expect([...a.keys()]).toEqual(['guanyu', 'zhaoyun', '*']);
    expect(a.get('*')!.n).toBe(2);
    expect(g.get('bbbbbbbb')!.get('*')!.n).toBe(1);
  });
});

describe('formatRealRow', () => {
  it('한 줄에 판수·생존·클리어가 들어간다', () => {
    const line = formatRealRow('guanyu', summarizeReal([row({ reached_wave: 13 }), row({ reached_wave: 3 })]));
    expect(line).toContain('guanyu');
    expect(line).toContain('50%');
    expect(formatRealRow('*', summarizeReal([]))).toContain('전체');
  });
});
