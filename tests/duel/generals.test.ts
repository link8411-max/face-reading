import { describe, it, expect } from 'vitest';
import { samgukCharacters } from '@/lib/samgukDB';
import { DUEL_GENERALS, getDuelGeneral, STARTER_IDS, BOSS_IDS, MOB_ID } from '@/lib/duel/generals';
import { SKILLS } from '@/lib/duel/skills';

describe('일기토 장수 데이터', () => {
  const real = DUEL_GENERALS.filter((g) => g.id !== MOB_ID);

  it('mob 제외 모든 장수가 초상 있는 samgukDB 장수이고 stats가 같다', () => {
    for (const g of real) {
      const c = samgukCharacters.find((x) => x.id === g.id);
      expect(c, g.id).toBeDefined();
      expect(g.stats).toEqual({
        통솔: c!.stats.통솔,
        무력: c!.stats.무력,
        지력: c!.stats.지력,
        매력: c!.stats.매력,
      });
    }
  });

  it('장수마다 기술 4개가 SKILLS에 있고 자기 유형 기술·필살기가 있다', () => {
    for (const g of DUEL_GENERALS) {
      expect(g.skills).toHaveLength(4);
      const skills = g.skills.map((id) => SKILLS[id]);
      skills.forEach((s, i) => expect(s, `${g.id}:${g.skills[i]}`).toBeDefined());
      expect(skills.some((s) => s.kind === g.kind), g.id).toBe(true);
      expect(skills.some((s) => s.uses !== null), g.id).toBe(true);
    }
  });

  it('시작·보스 장수가 role과 함께 조회된다', () => {
    for (const id of STARTER_IDS) expect(getDuelGeneral(id)?.role).toBe('starter');
    expect(BOSS_IDS).toEqual(['zhangjiao', 'xiaohoudun', 'dongzhuo', 'huangzhong', 'machao', 'lvbu']);
    for (const id of ['zhangjiao', 'dongzhuo', 'lvbu']) expect(getDuelGeneral(id)?.role).toBe('boss');
    for (const id of ['xiaohoudun', 'huangzhong', 'machao', 'xuchu']) expect(getDuelGeneral(id)?.role).toBe('recruit');
    // 보스 유형 2·2·2: 지장(장각·동탁) 맹장(하후돈·여포) 기장(황충·마초)
    expect(BOSS_IDS.map((id) => getDuelGeneral(id)!.kind).sort()).toEqual(['기장', '기장', '맹장', '맹장', '지장', '지장']);
    expect(getDuelGeneral(MOB_ID)?.role).toBe('mob');
    expect(getDuelGeneral('nobody')).toBeUndefined();
  });

  it('유형별 장수가 각 2명 이상', () => {
    for (const k of ['맹장', '기장', '지장'] as const) {
      expect(DUEL_GENERALS.filter((g) => g.kind === k).length).toBeGreaterThanOrEqual(2);
    }
  });
});
