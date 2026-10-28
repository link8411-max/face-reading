// 일기토 공용 타입

export type GeneralKind = '맹장' | '기장' | '지장';

export type SkillEffect = 'burn' | 'confuse' | 'ambush' | 'taunt' | 'guard' | 'heal' | 'shout';

export interface Skill {
  id: string;
  name: string;
  kind: GeneralKind;
  power: number;
  /** null = 무제한 */
  uses: number | null;
  effect?: SkillEffect;
}

export interface DuelGeneral {
  id: string;
  name: string;
  kind: GeneralKind;
  speed: number;
  skills: [string, string, string, string];
  role: 'starter' | 'recruit' | 'boss' | 'mob';
  /** 파일 이름만 (예: guanyu.png) */
  sprite: string;
  stats: { 통솔: number; 무력: number; 지력: number; 매력: number };
}
