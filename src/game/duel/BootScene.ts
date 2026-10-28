// 에셋 로드(장수록 초상·스프라이트) → 글꼴 대기(최대 1초) → 텍스처 생성 → 첫 장면, 그 뒤 보스 초상
import * as Phaser from 'phaser';
import { DUEL_GENERALS } from '@/lib/duel/generals';
import { FONT_KR, FONT_NUM } from './config';
import { makeTextures } from './textures';
import { fonts } from './ui';
import { SCENE_KEY } from './sceneKeys';
import type { DuelBridge } from './bridge';

const FONT_WAIT_MS = 1000;

/** 게임용 초상 PNG(scripts/duel-portraits.ts가 만든다) */
const portraitUrl = (id: string) => `/images/samguk/duel-portraits/${id}.png`;

/** next/font는 글꼴 이름에 해시를 붙여 CSS 변수로만 알려 준다. 변수가 있으면 그 이름을 쓴다 */
function resolveFont(varName: string, fallback: string): string {
  try {
    for (const el of [document.body, document.documentElement]) {
      if (!el) continue;
      const v = getComputedStyle(el).getPropertyValue(varName).trim();
      if (v) return `${v}, ${fallback}`;
    }
  } catch {
    // 스타일을 못 읽으면 기본 이름
  }
  return fallback;
}

async function waitFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  const loads = [`8px ${fonts.kr}`, `bold 8px ${fonts.kr}`, `8px ${fonts.num}`].map((f) =>
    document.fonts.load(f, '가0').catch(() => []),
  );
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, FONT_WAIT_MS));
  try {
    await Promise.race([Promise.all(loads), timeout]);
  } catch {
    // 글꼴을 못 받아도 기본 글꼴로 진행
  }
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // 실패한 그림은 텍스처가 생기지 않는다 → spriteKeyFor가 sprite:mob → 색 사각형 순으로 고른다
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      if (typeof console !== 'undefined') console.debug(`[duel] 그림 없음 ${file.key} → 대체`);
    });
    // 게임용 작은 초상(46×54 팔레트 PNG, 장당 수 KB)은 시작 화면 장수록에 보이는 장수만 먼저, 보스는 뒤에(lateLoad)
    for (const g of DUEL_GENERALS) {
      if (g.role === 'starter' || g.role === 'recruit') this.load.image(`portrait:${g.id}`, portraitUrl(g.id));
      // 외곽선을 넣은 40px 스프라이트
      this.load.image(`sprite:${g.id}`, `/images/samguk/sprites-outlined/${g.id}.png`);
    }
  }

  /** 시작 화면이 뜬 뒤 나머지 초상(보스)을 받는다. 보스 웨이브(6) 전에 다 온다 */
  private lateLoad(): void {
    const rest = DUEL_GENERALS.filter((g) => g.role === 'boss');
    for (const g of rest) this.load.image(`portrait:${g.id}`, portraitUrl(g.id));
    this.load.start();
  }

  create(): void {
    fonts.kr = resolveFont('--font-noto-sans-kr', FONT_KR);
    fonts.num = resolveFont('--font-silkscreen', FONT_NUM);
    makeTextures(this);
    // 부팅이 끝나면 React가 마지막으로 부른 장면으로 간다(그 뒤의 장면 바꾸기는 game.ts의 컨트롤러 몫)
    void waitFonts().then(() => {
      const bridge = this.registry.get('bridge') as DuelBridge;
      this.registry.set('booted', true);
      // Boot는 그림 없이 남아 나머지 초상을 받는다(장면 컨트롤러는 Boot를 멈추지 않는다)
      this.scene.launch(SCENE_KEY[bridge.wantScene]);
      this.lateLoad();
    });
  }
}
