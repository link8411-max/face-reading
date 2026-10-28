// 보상 카드 앞면 16×16 도트 아이콘(코드로 그림). 종류: 말·칼·책·불 책·약·부활약·깃발·동행
import type * as Phaser from 'phaser';
import { PALETTE as S, hex } from './config';

type G = Phaser.GameObjects.Graphics;
export type RewardIcon = 'horse' | 'sword' | 'book' | 'firebook' | 'potion' | 'revive' | 'flag' | 'ally';

/** 보상 id → 아이콘 */
export function rewardIcon(id: string): RewardIcon {
  if (id === 'redhare' || id === 'steed') return 'horse';
  if (id === 'greendragon' || id === 'sword') return 'sword';
  if (id === 'book_fire') return 'firebook';
  if (id === 'book') return 'book';
  if (id === 'potion') return 'potion';
  if (id === 'revive') return 'revive';
  if (id === 'slot') return 'ally';
  return 'flag';
}

/** 글자 그림: 한 글자 = 한 화소. 색 표는 아래 COLORS */
export const ART: Record<RewardIcon, string[]> = {
  horse: [
    '................',
    '..........kk....',
    '.........kmmk...',
    '........kmmmmk..',
    '.......kmmmwmk..',
    '......kmmmmmmmk.',
    '.....kmmmmmmmmk.',
    '....kmmmmkkkmk..',
    '...kmmmmk..kk...',
    '..kmmmmk........',
    '..kmmmmk........',
    '.kmmmmmk........',
    '.kmmmmmmk.......',
    '.kmmmmmmmk......',
    '.kkkkkkkkk......',
    '................',
  ],
  sword: [
    '.............kk.',
    '............kwk.',
    '...........kwk..',
    '..........kwk...',
    '.........kwk....',
    '........kwk.....',
    '.......kwk......',
    '......kwk.......',
    '..k..kwk........',
    '..kk.kwk........',
    '...kgwk.........',
    '....kgk.........',
    '...kgkgk........',
    '..kgk..k........',
    '.kgk............',
    '.kk.............',
  ],
  book: [
    '................',
    '..kkkkkkkkkkkk..',
    '..krrrrrrrrrrck.',
    '..krkkkkkkkrrck.',
    '..krkyyyyykrrck.',
    '..krkkkkkkkrrck.',
    '..krrrrrrrrrrck.',
    '..krrrrrrrrrrck.',
    '..krrrrrrrrrrck.',
    '..krrrrrrrrrrck.',
    '..krrrrrrrrrrck.',
    '..krrrrrrrrrrck.',
    '..kkkkkkkkkkkcck',
    '...kcccccccccck.',
    '....kkkkkkkkkk..',
    '................',
  ],
  firebook: [
    '.......o........',
    '......ooo.......',
    '.....oyyo.......',
    '..kkkkoyokkkkk..',
    '..krrrkokrrrrck.',
    '..krkkkkkkkrrck.',
    '..krkyyyyykrrck.',
    '..krkkkkkkkrrck.',
    '..krrrrrrrrrrck.',
    '..krrrrrrrrrrck.',
    '..krrrrrrrrrrck.',
    '..krrrrrrrrrrck.',
    '..kkkkkkkkkkkcck',
    '...kcccccccccck.',
    '....kkkkkkkkkk..',
    '................',
  ],
  potion: [
    '......kkkk......',
    '......kbbk......',
    '.......kk.......',
    '......kggk......',
    '.....kggggk.....',
    '.....kgwggk.....',
    '......kggk......',
    '.....kggggk.....',
    '....kggggggk....',
    '...kgwgggggk....',
    '...kggggggggk...',
    '...kggggggggk...',
    '...kggggggggk...',
    '....kggggggk....',
    '.....kkkkkk.....',
    '................',
  ],
  revive: [
    '......kkkk......',
    '......kbbk......',
    '.......kk.......',
    '.....kkkkkk.....',
    '....kcccccck....',
    '...kcccccccck...',
    '...kccckkccck...',
    '...kccckrkccck..',
    '...kckkkrkkkck..',
    '...kcrrrrrrrck..',
    '...kckkkrkkkck..',
    '...kccckrkccck..',
    '...kccckkccck...',
    '....kccccccck...',
    '.....kkkkkkk....',
    '................',
  ],
  flag: [
    '..kk............',
    '..kgkkkkkkkk....',
    '..kgkrrrrrrrk...',
    '..kgkrrrrrrrrk..',
    '..kgkrryyrrrrk..',
    '..kgkrryyrrrk...',
    '..kgkrrrrrrk....',
    '..kgkrrrrrrrk...',
    '..kgkkkkkkkkk...',
    '..kgk...........',
    '..kgk...........',
    '..kgk...........',
    '..kgk...........',
    '..kgk...........',
    '.kkkkk..........',
    '................',
  ],
  ally: [
    '................',
    '.....kkkk.......',
    '....kssssk......',
    '....kssssk......',
    '....kssssk...k..',
    '.....kkkk...kgk.',
    '....kbbbbk.kgggk',
    '...kbbbbbbk.kgk.',
    '..kbbbbbbbbk.k..',
    '..kbbbbbbbbk....',
    '..kbkbbbbkbk....',
    '..kbkbbbbkbk....',
    '..kk.kbbk.kk....',
    '.....kbbk.......',
    '.....kkkk.......',
    '................',
  ],
};

/** 글자 → 팔레트 색(m은 말 색: 적토마 빨강·준마 갈색) */
const COLORS: Record<string, string> = {
  k: S.ink,
  w: '#CFC8BC',
  g: S.gold,
  y: S.cream,
  r: S.red,
  c: S.cream2,
  o: '#E07B39',
  b: '#5E3F2B',
  s: '#E2B48A',
};

/** (x,y) 왼쪽 위에 아이콘을 정수 배율 k로 그린다 */
export function drawRewardIcon(g: G, id: string, x: number, y: number, k = 1): void {
  const icon = rewardIcon(id);
  const horse = id === 'redhare' ? S.red : '#8A5A3B';
  // potion 초록, revive는 크림 병에 빨간 십자
  const pot = icon === 'potion' ? '#2E6B3A' : null;
  ART[icon].forEach((row, yy) => {
    for (let xx = 0; xx < row.length; xx++) {
      const ch = row[xx];
      if (ch === '.') continue;
      const col = ch === 'm' ? horse : ch === 'g' && pot ? pot : (COLORS[ch] ?? S.ink);
      g.fillStyle(hex(col), 1);
      g.fillRect(x + xx * k, y + yy * k, k, k);
    }
  });
}
