// 결과 화면(와꾸 v5 draw3): 초상 + 열전 제목·한 줄 + 열전 본문 창 + 단추 3 + 별점 줄
import type * as Phaser from 'phaser';
import { PALETTE as S, MUTED } from './config';
import { RESULT_BTN, RESULT_STAR } from './layout';
import { PanelScene } from './PanelScene';
import { portraitKeyFor } from './textures';
import { box, cursor } from './ui';
import { bodyLines, wrapText } from './wrap';
import type { ResultShow } from './bridge';

/** 한 줄 요약 줄당 글자 수 */
const HEAD_CHARS = 25;
const BUTTONS = [
  { id: 'share', label: '공유하기' },
  { id: 'retry', label: '다시 출진' },
  { id: 'samguk', label: '닮은 장수 찾기' },
];

export class ResultScene extends PanelScene {
  protected readonly sceneName = 'result' as const;

  constructor() {
    super('Result');
  }

  protected accepts(id: string): boolean {
    return BUTTONS.some((b) => b.id === id) || /^star[1-5]$/.test(id);
  }

  protected listen(on: Parameters<PanelScene['listen']>[0]): void {
    on('result:show', () => this.redraw());
  }

  protected draw(g: Phaser.GameObjects.Graphics): void {
    const v: ResultShow | undefined = this.bridge.shown.result;
    if (!v) return;
    box(g, 10, 12, 50, 58);
    const pk = portraitKeyFor(this, v.starter);
    if (pk) this.add.image(12, 14, pk).setOrigin(0).setDisplaySize(46, 54);
    this.t(66, 13, v.title, { ko: 11, bold: true, color: S.gold, shadow: true });
    // 한 줄 요약: Galmuri9 두 줄까지(넘치면 말줄임)
    const head = wrapText(v.headline, HEAD_CHARS);
    const shown = head.length > 2 ? [head[0], `${head[1].slice(0, HEAD_CHARS - 1)}…`] : head;
    shown.forEach((l, i) => this.t(66, 30 + i * 12, l, { ko: 9, color: S.cream, shadow: true }));
    this.t(66, 58, `BEST ${v.best}  CLEAR ${v.clears}`, { color: S.cream2, num: true, shadow: true });

    // 열전 본문: Galmuri9로 26자씩 7줄까지. 넘치면 첫 문장과 마지막 문장을 남기고 가운데 문장을 뺀다(글꼴은 줄이지 않는다)
    box(g, 10, 76, 300, 96, S.cream);
    bodyLines(v.lines).forEach((l, i) => this.t(16, 80 + i * 12, l, { ko: 9 }));

    BUTTONS.forEach((b, i) => {
      const x = RESULT_BTN.x0 + i * RESULT_BTN.step;
      const on = this.focus === b.id;
      box(g, x, RESULT_BTN.y, RESULT_BTN.w, RESULT_BTN.h, i === 0 ? S.gold : S.cream);
      const t = this.t(x + RESULT_BTN.w / 2 + 3, RESULT_BTN.y + 5, b.label, { ko: 9, color: on ? S.red : S.ink }).setOrigin(0.5, 0);
      this.fit(t, RESULT_BTN.w - 16);
      if (t.height < 11) t.setY(RESULT_BTN.y + 7);
      if (on) cursor(g, x + 4, RESULT_BTN.y + 8);
    });

    box(g, 10, 208, 300, 22, S.cream2);
    this.t(16, 213, '이 판 어땠어요?', { ko: 9 });
    const stars = v.stars ?? 0;
    for (let s = 1; s <= 5; s++) {
      const x = RESULT_STAR.x0 + (s - 1) * RESULT_STAR.step + RESULT_STAR.w / 2;
      const on = this.focus === `star${s}`;
      this.t(x, 212, s <= stars ? '★' : '☆', { ko: 9, color: s <= stars || on ? S.red : S.ink }).setOrigin(0.5, 0);
    }
    this.t(304, 213, stars ? '아래에 남기기' : '한 줄 남기기 ▷', { ko: 9, color: MUTED }).setOrigin(1, 0);
  }
}
