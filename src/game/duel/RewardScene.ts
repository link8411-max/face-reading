// 보상 화면(와꾸 v5 draw2): 승전 한 줄, 카드 3장, 동행·다음 싸움 창. pick이 있으면 고르기 창을 위에 띄운다
import type * as Phaser from 'phaser';
import { MUTED, PALETTE as S, hex } from './config';
import { PICK, REWARD_CARD, pickWindowH } from './layout';
import { PanelScene } from './PanelScene';
import { box, cursor } from './ui';
import type { PickView, RewardShow } from './bridge';

const CARD_INNER = REWARD_CARD.w - 12;

export class RewardScene extends PanelScene {
  protected readonly sceneName = 'reward' as const;

  constructor() {
    super('Reward');
  }

  protected accepts(id: string): boolean {
    return this.bridge.shown.reward?.pick ? /^opt\d+$/.test(id) : /^card\d$/.test(id);
  }

  protected listen(on: Parameters<PanelScene['listen']>[0]): void {
    on('reward:show', () => {
      // 카드 ↔ 고르기 창이 바뀌면 커서를 비운다
      if (this.focus && !this.accepts(this.focus)) this.focus = null;
      this.redraw();
    });
  }

  protected draw(g: Phaser.GameObjects.Graphics): void {
    const v: RewardShow | undefined = this.bridge.shown.reward;
    if (!v) return;
    box(g, 10, 12, 300, 22, S.cream);
    this.fit(this.t(16, 17, v.headline, { ko: 9 }), 288);
    this.t(16, 38, '보상 하나를 고르시오', { ko: 9, color: S.gold });

    v.cards.forEach((c, i) => {
      const x = REWARD_CARD.x0 + i * REWARD_CARD.step;
      const on = !v.pick && this.focus === `card${i}`;
      box(g, x, REWARD_CARD.y, REWARD_CARD.w, REWARD_CARD.h, on ? S.cream : S.cream2);
      if (on) {
        g.fillStyle(hex(S.red), 1);
        g.fillRect(x + 2, REWARD_CARD.y + 2, REWARD_CARD.w - 4, 2);
      }
      const rare = c.rarity === 'rare';
      this.t(x + 6, 57, rare ? '희귀' : '보통', { ko: 7, color: rare ? S.red : MUTED });
      this.fit(this.t(x + 6, 68, c.name, { ko: 11, bold: true }), CARD_INNER);
      g.fillStyle(hex(S.gold2), 1);
      g.fillRect(x + 6, 84, CARD_INNER, 1);
      const desc = this.t(x + 6, 89, c.desc, { ko: 9, wrap: CARD_INNER });
      // 설명이 길면 작은 글꼴로 다시 감싼다
      if (desc.height > 54) {
        desc.destroy();
        this.t(x + 6, 89, c.desc, { ko: 7, wrap: CARD_INNER });
      }
      // 작은 문장(희귀는 빨강, 보통은 파랑)
      const ix = x + REWARD_CARD.w / 2 - 10;
      const iy = 146;
      g.fillStyle(hex(rare ? S.red : S.blue), 1);
      g.fillRect(ix, iy, 20, 20);
      g.fillStyle(hex(S.ink), 1);
      g.fillRect(ix + 3, iy + 3, 14, 14);
      g.fillStyle(hex(S.gold), 1);
      g.fillRect(ix + 7, iy + 7, 6, 6);
      if (on) cursor(g, ix - 8, iy + 7);
    });

    box(g, 10, 180, 300, 50, S.cream);
    this.fit(this.t(16, 185, `동행  ${v.party.join(' · ')}`, { ko: 9 }), 288);
    if (v.next) this.fit(this.t(16, 200, `다음  ${v.next}`, { ko: 9 }), 288);
    this.more();

    if (v.pick) this.drawPick(v.pick);
  }

  private drawPick(p: PickView): void {
    const dim = this.add.rectangle(0, 0, 320, 240, hex(S.navy), 0.6).setOrigin(0);
    dim.setDepth(1);
    const g = this.add.graphics().setDepth(2);
    box(g, PICK.x, PICK.y, PICK.w, pickWindowH(p.options.length), S.cream);
    this.fit(this.t(PICK.x + 8, PICK.y + 6, p.title, { ko: 9, color: S.red }).setDepth(3), PICK.w - 16);
    p.options.forEach((o, i) => {
      const y = PICK.rowY0 + i * PICK.rowStep;
      const on = this.focus === `opt${i}`;
      g.fillStyle(hex(on ? S.cream2 : S.cream), 1);
      g.fillRect(PICK.rowX, y, PICK.rowW, PICK.rowH);
      g.fillStyle(hex(S.gold2), 1);
      g.fillRect(PICK.rowX, y + PICK.rowH, PICK.rowW, 1);
      if (on) cursor(g, PICK.rowX + 3, y + 7);
      const col = o.disabled ? MUTED : on ? S.red : S.ink;
      this.t(PICK.rowX + 10, y + 5, o.label, { ko: 9, color: col }).setDepth(3);
      if (o.sub) this.t(PICK.rowX + PICK.rowW - 4, y + 6, o.sub, { ko: 7, color: MUTED }).setOrigin(1, 0).setDepth(3);
    });
  }
}
