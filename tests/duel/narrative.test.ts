import { describe, it, expect } from 'vitest';
import { narrate, ordinal, ORDINALS, koreanCount } from '@/lib/duel/narrative';
import type { RunRecord, RunWave } from '@/lib/duel/types';

const mob = (wave: number, turns = 2): RunWave => ({ wave, enemy: 'mob', turns, finisher: 'strike', finisherBy: 'guanyu' });

// 클리어: 관우, 18웨이브, 보스 셋, 영입 하나, rare 보상 둘
const CLEARED: RunRecord = {
  starter: 'guanyu',
  waves: [
    mob(1), mob(2), mob(3),
    { wave: 4, enemy: 'machao', turns: 4, finisher: 'guanyu_ult', finisherBy: 'guanyu', recruited: true },
    { wave: 5, enemy: 'huangzhong', turns: 3, finisher: 'strike', finisherBy: 'machao' },
    { wave: 6, enemy: 'zhangjiao', turns: 5, finisher: 'guanyu_ult', finisherBy: 'guanyu' },
    { wave: 7, enemy: 'xuchu', turns: 3, finisher: 'thrust', finisherBy: 'machao' },
    { wave: 8, enemy: 'zhouyu', turns: 4, finisher: 'strike', finisherBy: 'guanyu' },
    { wave: 9, enemy: 'jiangwei', turns: 2, finisher: 'machao_ult', finisherBy: 'machao' },
    { wave: 10, enemy: 'xiaohoudun', turns: 6 },
    { wave: 11, enemy: 'zhaoyun', turns: 3, finisher: 'burn', finisherBy: 'guanyu' },
    { wave: 12, enemy: 'dongzhuo', turns: 7, finisher: 'guanyu_ult', finisherBy: 'guanyu', lostAlly: 'machao' },
    { wave: 13, enemy: 'zhangfei', turns: 4, finisher: 'strike', finisherBy: 'guanyu' },
    mob(14), mob(15), mob(16), mob(17),
    { wave: 18, enemy: 'lvbu', turns: 9, finisher: 'guanyu_ult', finisherBy: 'guanyu' },
  ],
  rewards: ['potion', 'redhare', 'sword', 'greendragon', 'potion'],
  cleared: true,
};

// 6웨이브 패배: 장비, 졸개 셋 → 허저 → 주유 → 장각에게 쓰러짐
const LOST6: RunRecord = {
  starter: 'zhangfei',
  waves: [
    mob(1), mob(2), mob(3),
    { wave: 4, enemy: 'xuchu', turns: 3, finisher: 'zhangfei_ult', finisherBy: 'zhangfei' },
    { wave: 5, enemy: 'zhouyu', turns: 4, finisher: 'strike', finisherBy: 'zhangfei' },
    { wave: 6, enemy: 'zhangjiao', turns: 9 },
  ],
  rewards: ['potion', 'redhare', 'book', 'slot', 'potion'],
  cleared: false,
};

// 영입·전사 포함: 조운, 마초 항복 → 강유전에서 마초 전사 → 장각 격파 → 하후돈에게 패배
const RECRUIT: RunRecord = {
  starter: 'zhaoyun',
  waves: [
    mob(1), mob(2), mob(3),
    { wave: 4, enemy: 'machao', turns: 5, finisher: 'zhaoyun_ult', finisherBy: 'zhaoyun', recruited: true },
    { wave: 5, enemy: 'jiangwei', turns: 6, finisher: 'thrust', finisherBy: 'zhaoyun', lostAlly: 'machao' },
    { wave: 6, enemy: 'zhangjiao', turns: 8, finisher: 'zhaoyun_ult', finisherBy: 'zhaoyun' },
    { wave: 7, enemy: 'xiaohoudun', turns: 4, lostAlly: 'zhaoyun' },
  ],
  rewards: ['slot', 'potion', 'redhare', 'sword', 'potion', 'steed'],
  cleared: false,
};

// 첫 싸움 패배
const LOST1: RunRecord = {
  starter: 'guanyu',
  waves: [{ wave: 1, enemy: 'mob', turns: 3 }],
  rewards: [],
  cleared: false,
};

// 긴 판: 졸개·이름 있는 상대·보스·영입·전사가 섞여 fit 단계(묶기·영입 잇기·쌍 합치기)를 모두 거친다
const LONG: RunRecord = {
  starter: 'zhaoyun',
  waves: [
    mob(1), mob(2),
    { wave: 3, enemy: 'machao', turns: 3, finisher: 'zhaoyun_ult', finisherBy: 'zhaoyun', recruited: true },
    { wave: 4, enemy: 'huangzhong', turns: 4, finisher: 'thrust', finisherBy: 'zhaoyun', recruited: true },
    { wave: 5, enemy: 'xuchu', turns: 5, finisher: 'thrust', finisherBy: 'machao' },
    mob(6),
    { wave: 7, enemy: 'zhangjiao', turns: 6, finisher: 'zhaoyun_ult', finisherBy: 'zhaoyun', lostAlly: 'huangzhong' },
    { wave: 8, enemy: 'zhouyu', turns: 3, finisher: 'strike', finisherBy: 'machao' },
    { wave: 9, enemy: 'jiangwei', turns: 4 },
    { wave: 10, enemy: 'xiaohoudun', turns: 2, finisher: 'thrust', finisherBy: 'zhaoyun', lostAlly: 'machao' },
    { wave: 11, enemy: 'guanyu', turns: 5, finisher: 'thrust', finisherBy: 'zhaoyun', recruited: true },
    { wave: 12, enemy: 'dongzhuo', turns: 7, finisher: 'zhaoyun_ult', finisherBy: 'zhaoyun' },
    mob(13), mob(14),
    { wave: 15, enemy: 'zhangfei', turns: 6, lostAlly: 'guanyu' },
  ],
  rewards: ['slot', 'redhare'],
  cleared: false,
};

// 짝수 웨이브에서 시작하는 졸개 연승
const EVEN_MOB: RunRecord = {
  starter: 'guanyu',
  waves: [
    { wave: 1, enemy: 'machao', turns: 3, finisher: 'strike', finisherBy: 'guanyu' },
    mob(2), mob(3), mob(4),
    { wave: 5, enemy: 'xuchu', turns: 5 },
  ],
  rewards: [],
  cleared: false,
};

// 보스를 꺾었으나 아군이 쓰러진 판
const BOSS_LOST: RunRecord = {
  starter: 'guanyu',
  waves: [
    mob(1), mob(2), mob(3), mob(4), mob(5),
    { wave: 6, enemy: 'zhangjiao', turns: 6, finisher: 'guanyu_ult', finisherBy: 'guanyu', lostAlly: 'machao' },
    { wave: 7, enemy: 'xuchu', turns: 2 },
  ],
  rewards: ['book_fire'],
  cleared: false,
};

const ALL = [CLEARED, LOST6, RECRUIT, LOST1, LONG, EVEN_MOB, BOSS_LOST];
const EMOJI = /\p{Extended_Pictographic}/u;

describe('열전 생성', () => {
  it('서수와 한글 수사', () => {
    expect(ORDINALS[0]).toBe('첫째');
    expect(ORDINALS[16]).toBe('열일곱째');
    expect(ORDINALS[19]).toBe('스무째');
    // 21~36번째 싸움(36웨이브)은 숫자 서수
    for (let w = 21; w <= 36; w++) expect(ordinal(w)).toBe(`${w}번째`);
    expect(koreanCount(1)).toBe('한');
    expect(koreanCount(3)).toBe('세');
    expect(koreanCount(9)).toBe('아홉');
    expect(koreanCount(10)).toBe('열');
    expect(koreanCount(12)).toBe('12');
  });

  it('title은 "<시작 장수> 열전"', () => {
    expect(narrate(CLEARED).title).toBe('관우 열전');
    expect(narrate(RECRUIT).title).toBe('조운 열전');
  });

  it('headline에 선두 장수와 마지막 상대가 있고, 클리어면 꺾고 / 패배면 쓰러지', () => {
    const c = narrate(CLEARED).headline;
    expect(c).toBe('관우, 열여덟째 싸움에서 여포를 꺾고 천하에 이름을 떨치다');
    const l = narrate(LOST6).headline;
    expect(l).toBe('장비, 여섯째 싸움에서 장각에게 아홉 합 끝에 쓰러지다');
    const r = narrate(RECRUIT).headline;
    expect(r).toContain('조운');
    expect(r).toContain('하후돈');
    expect(r).toContain('쓰러지');
    expect(r).not.toContain('꺾고');
    expect(narrate(LOST1).headline).toBe('관우, 첫째 싸움에서 황건적에게 세 합 끝에 쓰러지다');
  });

  it('lines는 3~8문장', () => {
    for (const rec of ALL) {
      const { lines } = narrate(rec);
      expect(lines.length, rec.starter).toBeGreaterThanOrEqual(3);
      expect(lines.length, rec.starter).toBeLessThanOrEqual(8);
      for (const s of lines) expect(s.length).toBeGreaterThan(0);
    }
  });

  it('같은 record면 같은 출력', () => {
    for (const rec of ALL) expect(narrate(structuredClone(rec))).toEqual(narrate(rec));
  });

  it('졸개 3연승은 한 문장으로 묶인다', () => {
    const { lines } = narrate(LOST6);
    const mobLines = lines.filter((s) => s.includes('황건적'));
    expect(mobLines).toHaveLength(1);
    expect(mobLines[0]).toContain('황건적을 셋 베고');
    expect(lines[0]).toContain('장비');
  });

  it('영입과 아군 전사가 이야기에 들어간다', () => {
    const text = narrate(RECRUIT).lines.join(' ');
    expect(text).toContain('마초가 항복하여 합류');
    expect(text).toContain('마초가 쓰러졌으나');
    expect(text).toContain('여기서 행군이 끝나다');
  });

  it('rare 보상은 많아야 한 문장, common은 말하지 않는다', () => {
    for (const rec of ALL) {
      const text = narrate(rec).lines.join(' ');
      expect(text.split('도중에').length - 1).toBeLessThanOrEqual(1);
      expect(text).not.toContain('회복약');
      expect(text).not.toContain('보검');
    }
    expect(narrate(LOST6).lines).toContain('도중에 적토마를 얻었다.');
  });

  it('클리어는 천하에 이름을 떨치며 끝난다', () => {
    const { lines } = narrate(CLEARED);
    expect(lines[lines.length - 1]).toContain('천하에 이름을 떨치다');
  });

  it('첫 싸움 패배는 출진 문장으로 채운다', () => {
    const { lines } = narrate(LOST1);
    expect(lines[0]).toBe('관우, 홀로 말을 달려 출진하다.');
    expect(lines[lines.length - 1]).toContain('여기서 행군이 끝나다');
  });

  it('짝수 웨이브에서 시작한 졸개 연승도 "황건적을 N 베고"', () => {
    expect(narrate(EVEN_MOB).lines).toEqual([
      '첫째 싸움, 관우가 일격으로 마초를 세 합 만에 베다.',
      '황건적을 셋 베고 길을 열다.',
      '다섯째 싸움, 허저와 마주하다.',
      '다섯 합 끝에 관우가 쓰러지니, 여기서 행군이 끝나다.',
    ]);
  });

  it('6웨이브 패배 전문', () => {
    expect(narrate(LOST6).lines).toEqual([
      '장비, 황건적을 셋 베고 나아가다.',
      '넷째 싸움, 장비가 장판교 호통으로 허저를 세 합 만에 베다.',
      '다섯째 싸움에서 주유를 만나 네 합 만에 장비의 일격으로 물리치다.',
      '도중에 적토마를 얻었다.',
      '여섯째 싸움, 장각과 마주하다.',
      '아홉 합 끝에 장비가 쓰러지니, 여기서 행군이 끝나다.',
    ]);
  });

  it('영입·전사 판 전문', () => {
    expect(narrate(RECRUIT).lines).toEqual([
      '조운, 황건적을 셋 베고 나아가다.',
      '넷째 싸움, 조운이 칠진칠출로 마초를 다섯 합 만에 베다.',
      '마초가 항복하여 합류하다.',
      '다섯째 싸움, 강유에게 마초가 쓰러졌으나 조운이 찌르기로 끝을 냈다.',
      '여섯째 싸움에서 조운이 장각을 여덟 합 만에 칠진칠출로 꺾으니 사기가 올랐다.',
      '장각이 쓰러지자 적진이 흩어졌다.',
      '일곱째 싸움, 하후돈과 마주하다.',
      '네 합 끝에 조운이 쓰러지니, 여기서 행군이 끝나다.',
    ]);
  });

  it('클리어 판 전문: 승리 묶기와 항복 잇기', () => {
    expect(narrate(CLEARED).lines).toEqual([
      '관우, 황건적을 셋 베고 나아가다.',
      '넷째 싸움, 관우가 청룡언월도 참으로 마초를 네 합 만에 베니, 마초가 항복하여 합류하다.',
      '여섯째 싸움에서 관우가 장각을 다섯 합 만에 청룡언월도 참으로 꺾으니 사기가 올랐다.',
      '일곱째부터 열한째 싸움까지 허저, 주유, 강유, 하후돈, 조운을 차례로 꺾다.',
      '열두째 싸움, 동탁에게 마초가 쓰러졌으나 관우가 청룡언월도 참으로 끝을 내니 사기가 올랐다.',
      '열셋째부터 열일곱째 싸움까지 장비와 황건적 무리를 차례로 꺾다.',
      '열여덟째 싸움, 여포와 마주하다.',
      '아홉 합 만에 관우가 청룡언월도 참으로 여포를 꺾으니, 천하에 이름을 떨치다.',
    ]);
  });

  it('긴 판 전문: 묶고, 항복을 모으고, 덜 중요한 승리를 뺀다', () => {
    expect(narrate(LONG).lines).toEqual([
      '조운, 황건적을 둘 베고 나아가다.',
      '일곱째 싸움, 장각에게 황충이 쓰러졌으나 조운이 칠진칠출로 끝을 내니 사기가 올랐다.',
      '열째 싸움, 하후돈에게 마초가 쓰러졌으나 조운이 찌르기로 끝을 냈다.',
      '열한째 싸움에서 관우를 만나 다섯 합 만에 조운의 찌르기로 물리치다.',
      '그사이 마초, 황충, 관우가 차례로 항복하여 합류하다.',
      '열두째 싸움에서 조운이 동탁을 일곱 합 만에 칠진칠출로 꺾으니 사기가 올랐다.',
      '열다섯째 싸움, 장비와 마주하다.',
      '관우가 먼저 쓰러지고, 여섯 합 끝에 조운도 쓰러지니, 여기서 행군이 끝나다.',
    ]);
  });

  it('두 웨이브만 묶으면 "<서수>와 <서수> 싸움에서"', () => {
    const rec: RunRecord = {
      starter: 'guanyu',
      waves: [
        mob(1),
        { wave: 2, enemy: 'machao', turns: 2, finisher: 'strike', finisherBy: 'guanyu', lostAlly: 'zhangfei' },
        { wave: 3, enemy: 'huangzhong', turns: 2, finisher: 'strike', finisherBy: 'guanyu', recruited: true },
        { wave: 4, enemy: 'xuchu', turns: 2, lostAlly: 'huangzhong' },
        { wave: 5, enemy: 'zhouyu', turns: 3, finisher: 'strike', finisherBy: 'guanyu' },
        { wave: 6, enemy: 'zhangjiao', turns: 4, finisher: 'guanyu_ult', finisherBy: 'guanyu' },
        { wave: 7, enemy: 'jiangwei', turns: 3, finisher: 'strike', finisherBy: 'guanyu' },
        mob(8),
        { wave: 9, enemy: 'xiaohoudun', turns: 5 },
      ],
      rewards: ['redhare'],
      cleared: false,
    };
    expect(narrate(rec).lines).toContain('일곱째와 여덟째 싸움에서 강유와 황건적 무리를 차례로 꺾다.');
  });

  it('보스를 꺾은 싸움에 전사가 있어도 사기 문구가 붙고, 보상 이름은 조사가 맞다', () => {
    expect(narrate(BOSS_LOST).lines).toEqual([
      '관우, 황건적을 다섯 베고 나아가다.',
      '여섯째 싸움, 장각에게 마초가 쓰러졌으나 관우가 청룡언월도 참으로 끝을 내니 사기가 올랐다.',
      '장각이 쓰러지자 적진이 흩어졌다.',
      '도중에 화공의 병법서를 얻었다.',
      '일곱째 싸움, 허저와 마주하다.',
      '두 합 끝에 관우가 쓰러지니, 여기서 행군이 끝나다.',
    ]);
    const slot = narrate({ ...LOST6, rewards: ['slot'] }).lines;
    expect(slot).toContain('도중에 동행 자리를 하나 더 얻었다.');
  });

  it('사건이 많은 긴 판도 8문장을 넘지 않는다', () => {
    const ids = ['machao', 'huangzhong', 'xuchu', 'zhouyu', 'jiangwei', 'xiaohoudun'];
    const waves: RunWave[] = Array.from({ length: 22 }, (_, k) => ({
      wave: k + 1,
      enemy: ids[k % ids.length],
      turns: k + 1,
      finisher: 'strike',
      finisherBy: 'guanyu',
      lostAlly: k % 2 ? 'machao' : undefined,
      recruited: k % 3 === 0,
    }));
    const n = narrate({ starter: 'guanyu', waves, rewards: ['redhare', 'slot'], cleared: false });
    expect(n.lines.length).toBeLessThanOrEqual(8);
    expect(n.lines.length).toBeGreaterThanOrEqual(3);
    expect(n.headline).toContain('22번째 싸움');
    expect(n.headline).toContain('22 합 끝에');
    expect(n.lines).toContain('그사이 마초와 주유가 차례로 항복하여 합류하다.');
  });

  it('이모지가 없다', () => {
    for (const rec of ALL) {
      const n = narrate(rec);
      for (const s of [n.title, n.headline, ...n.lines]) expect(EMOJI.test(s), s).toBe(false);
    }
  });
});
