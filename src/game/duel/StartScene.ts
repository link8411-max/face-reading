// 시작 화면: 장수록(초상 46×54 + 이름·유형, 잠긴 장수는 어둡게), 최고 기록, 행군 기록, 출진 단추
import type * as Phaser from 'phaser';
import { MUTED, PALETTE as S, hex } from './config';
import { START_CELL, START_HISTORY, START_NEW, START_RESUME, START_SORTIE, startCellPos } from './layout';
import { PanelScene } from './PanelScene';
import { portraitKeyFor } from './textures';
import { KIND_MARK, box, cursor } from './ui';
import type { StartShow } from './bridge';

export class StartScene extends PanelScene {
  protected readonly sceneName = 'start' as const;

  constructor() {
    super('Start');
  }

  protected accepts(id: string): boolean {
    return id === 'sortie' || id === 'resume' || /^general\d+$/.test(id);
  }

  protected listen(on: Parameters<PanelScene['listen']>[0]): void {
    on('start:show', () => this.redraw());
  }

  protected draw(g: Phaser.GameObjects.Graphics): void {
    const v: StartShow | undefined = this.bridge.shown.start;
    box(g, 10, 12, 300, 22, S.cream);
    this.t(16, 16, '장수록', { ko: 11, bold: true });
    this.t(66, 17, '함께 출진할 장수를 고르시오', { ko: 9, color: MUTED });
    this.t(304, 19, `BEST ${v?.best ?? 0}  CLEAR ${v?.clears ?? 0}`, { num: true }).setOrigin(1, 0);
    if (!v) return;

    v.roster.forEach((gen, i) => {
      const { x, y } = startCellPos(i);
      const on = this.focus === `general${i}`;
      const picked = v.selected === gen.id;
      if (picked) {
        g.fillStyle(hex(S.red), 1);
        g.fillRect(x - 2, y - 2, START_CELL.w + 4, 62);
      }
      box(g, x, y, START_CELL.w, 58, gen.locked ? S.ink : S.cream);
      const pk = portraitKeyFor(this, gen.id);
      if (pk) {
        const img = this.add.image(x + 2, y + 2, pk).setOrigin(0).setDisplaySize(46, 54);
        // 잠긴 장수: 거의 검은 그림자(누군지는 이름으로만)
        if (gen.locked) img.setTint(0x161616);
      }
      // 유형 한 글자 표찰(왼쪽 위)
      g.fillStyle(hex(S.ink), 1);
      g.fillRect(x + 2, y + 2, 10, 10);
      this.t(x + 3, y + 2, KIND_MARK[gen.kind] ?? '', { size: 8, color: S.gold });
      if (gen.locked) this.t(x + 25, y + 20, '?', { ko: 11, bold: true, color: S.gold2 }).setOrigin(0.5, 0);
      const name = this.t(x + 25, y + 59, gen.name, { ko: 9, color: gen.locked ? S.cream2 : on || picked ? S.gold : S.cream, shadow: true });
      name.setOrigin(0.5, 0);
      this.fit(name, START_CELL.w + 8);
      if (on) cursor(g, x - 6, y + 26);
    });

    // 행군 기록: 열전 제목 5개까지(2열)
    const h = START_HISTORY;
    box(g, h.x, h.y, h.w, h.h, S.cream);
    this.t(h.x + 6, h.y + 4, '행군 기록', { ko: 9, color: S.red });
    if (v.history.length === 0) {
      this.t(h.x + 6, h.y + 16, '아직 지난 행군이 없다', { ko: 9, color: MUTED });
    }
    // 읽히게 Galmuri9로 최근 3개만(한 줄에 하나)
    v.history.slice(0, 3).forEach((line, i) => {
      this.fit(this.t(h.x + 6, h.y + 15 + i * 10, line, { ko: 9 }), h.w - 12);
    });

    const lead = v.roster.find((r) => r.id === v.selected);
    if (v.resume) {
      this.drawResume(g, v, lead?.name ?? '');
      return;
    }
    // 출진
    const s = START_SORTIE;
    const on = this.focus === 'sortie';
    box(g, s.x, s.y, s.w, s.h, S.gold);
    this.t(s.x + s.w / 2, s.y + 9, '출진', { ko: 11, bold: true, color: on ? S.red : S.ink }).setOrigin(0.5, 0);
    if (lead) this.fit(this.t(s.x + s.w / 2, s.y + 27, `선두 ${lead.name}`, { ko: 9 }).setOrigin(0.5, 0), s.w - 8);
    if (on) cursor(g, s.x + 8, s.y + 12);
  }

  /** 진행 중 판이 있으면: 위 이어하기(금), 아래 새로 출진 */
  private drawResume(g: Phaser.GameObjects.Graphics, v: StartShow, leadName: string): void {
    const r = v.resume!;
    const onR = this.focus === 'resume';
    const onN = this.focus === 'sortie';
    box(g, START_RESUME.x, START_RESUME.y, START_RESUME.w, START_RESUME.h, S.gold);
    this.fit(this.t(START_RESUME.x + 12, START_RESUME.y + 5, `이어하기 제${r.wave}전`, { ko: 9, color: onR ? S.red : S.ink }), START_RESUME.w - 16);
    if (onR) cursor(g, START_RESUME.x + 4, START_RESUME.y + 8);
    box(g, START_NEW.x, START_NEW.y, START_NEW.w, START_NEW.h, S.cream);
    this.fit(this.t(START_NEW.x + 12, START_NEW.y + 5, `새로 ${leadName}`, { ko: 9, color: onN ? S.red : S.ink }), START_NEW.w - 16);
    if (onN) cursor(g, START_NEW.x + 4, START_NEW.y + 8);
  }
}
