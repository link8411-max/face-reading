// 결과 화면(와꾸 v5 draw3): 초상 + 열전 제목·한 줄 + 열전 본문 창 + 단추 3 + 별점 줄
import type * as Phaser from 'phaser';
import { PALETTE as S, MUTED } from './config';
import { resultLayout } from './layout';
import { PanelScene } from './PanelScene';
import { portraitKeyFor } from './textures';
import { box, cursor, starIcon } from './ui';
import { bodyPages, wrapText } from './wrap';
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
    return BUTTONS.some((b) => b.id === id) || id === 'page' || /^star[1-5]$/.test(id);
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

    // 열전 본문: Galmuri11로 쪽을 나눠 보인다(창 하나에 6줄, 세로형 10줄). 쪽이 더 있으면 ▼, 창을 누르면 넘긴다
    const L = resultLayout(this.tall);
    const pages = bodyPages(v.lines, L.bodyLines);
    const page = (v.page ?? 0) % pages.length;
    box(g, L.body.x, L.body.y, L.body.w, L.body.h, S.cream);
    pages[page].forEach((l, i) => this.t(L.body.x + 6, L.body.y + 5 + i * 14, l, { ko: 11 }));
    if (pages.length > 1) {
      this.t(L.body.x + L.body.w - 40, L.body.y + L.body.h - 13, `${page + 1}/${pages.length}`, { num: true, color: MUTED }).setOrigin(1, 0);
      this.more(L.body.x + L.body.w - 12, L.body.y + L.body.h - 14);
    }

    BUTTONS.forEach((b, i) => {
      const x = L.btn.x0 + i * L.btn.step;
      const on = this.focus === b.id;
      box(g, x, L.btn.y, L.btn.w, L.btn.h, i === 0 ? S.gold : S.cream);
      const ko = this.tall ? 11 : 9;
      const ty = L.btn.y + Math.floor((L.btn.h - (this.tall ? 12 : 10)) / 2) - 1;
      const t = this.t(x + L.btn.w / 2 + 3, ty, b.label, { ko, color: on ? S.red : S.ink }).setOrigin(0.5, 0);
      this.fit(t, L.btn.w - 16);
      if (on) cursor(g, x + 4, ty + 3);
    });

    // 별점 줄: 가로형은 한 줄(별 24px 간격 → 2배에서 48×44), 세로형은 제목 아래 별 5개(각 52×44)
    const sb = L.starBox;
    box(g, sb.x, sb.y, sb.w, sb.h, S.cream2);
    const stars = v.stars ?? 0;
    const tail = stars ? '아래에 남기기' : '한 줄 남기기 ▷';
    if (this.tall) {
      this.t(sb.x + 6, sb.y + 5, '이 판 어땠어요?', { ko: 11 });
      this.t(sb.x + sb.w - 6, sb.y + 5, tail, { ko: 11, color: MUTED }).setOrigin(1, 0);
    } else {
      this.t(16, sb.y + 5, '이 판 어땠어요?', { ko: 9 });
      this.t(304, sb.y + 5, tail, { ko: 9, color: MUTED }).setOrigin(1, 0);
    }
    for (let s = 1; s <= 5; s++) {
      const x = L.star.x0 + (s - 1) * L.star.step + L.star.w / 2;
      const on = this.focus === `star${s}`;
      // 세로형은 별마다 누를 칸을 상자로 보인다
      if (this.tall) box(g, L.star.x0 + (s - 1) * L.star.step + 2, L.star.y, L.star.w - 4, L.star.h, on || s <= stars ? S.cream : S.cream2);
      starIcon(g, x, L.star.y + L.star.h / 2, s <= stars || on, this.tall ? 2 : 1);
    }
  }
}
