// 시작 화면: 장수록(초상 46×54 + 이름·유형, 잠긴 장수는 어둡게), 최고 기록, 행군 기록, 출진 단추
import type * as Phaser from 'phaser';
import { MUTED, PALETTE as S, hex } from './config';
import { START_CELL, START_HISTORY, START_NEW, START_RESUME, START_SORTIE, START_TALL, startCellPos } from './layout';
import { PanelScene } from './PanelScene';
import { portraitKeyFor } from './textures';
import { KIND_MARK, box, cursor } from './ui';
import type { StartShow } from './bridge';

/** 저장 안 됨 안내(한 줄) */
const NO_SAVE = '이 브라우저에서는 이어하기가 저장되지 않아요';
/** 가로형 행군 기록 칸(188px)에 들어가는 짧은 안내 */
const NO_SAVE_SHORT = '이 브라우저는 저장이 안 돼요';

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
      // 유형 한 글자 표찰(왼쪽 위, 초상 위에 얹는다)
      this.add.rectangle(x + 2, y + 2, 11, 11, hex(S.ink)).setOrigin(0);
      this.t(x + 4, y + 3, KIND_MARK[gen.kind] ?? '', { ko: 7, color: S.gold });
      if (gen.locked) this.t(x + 25, y + 20, '?', { ko: 11, bold: true, color: S.gold2 }).setOrigin(0.5, 0);
      const name = this.t(x + 25, y + 59, gen.name, { ko: 9, color: gen.locked ? S.cream2 : on || picked ? S.gold : S.cream, shadow: true });
      name.setOrigin(0.5, 0);
      this.fit(name, START_CELL.w + 8);
      if (on) cursor(g, x - 6, y + 26);
    });

    // 행군 기록: 열전 제목 5개까지(2열)
    const h = this.tall ? START_TALL.history : START_HISTORY;
    box(g, h.x, h.y, h.w, h.h, S.cream);
    this.t(h.x + 6, h.y + 4, '행군 기록', { ko: 9, color: S.red });
    // 이 브라우저에 저장할 수 없으면(인앱·사생활 보호 모드) 한 줄 알린다: 세로형은 아래 천 위에, 가로형은 행군 기록 첫 줄에
    const noSave = v.storageOk === false;
    if (noSave && this.tall) {
      this.fit(this.t(160, START_TALL.noteY, NO_SAVE, { ko: 11, color: S.gold, shadow: true }).setOrigin(0.5, 0), 296);
    }
    const lines = noSave && !this.tall ? [NO_SAVE_SHORT, ...v.history.slice(0, 2)] : v.history.slice(0, 3);
    if (lines.length === 0) {
      this.t(h.x + 6, h.y + 16, '아직 지난 행군이 없다', { ko: 9, color: MUTED });
    }
    // 읽히게 Galmuri9로 최근 3개만(한 줄에 하나)
    lines.forEach((line, i) => {
      this.fit(this.t(h.x + 6, h.y + 15 + i * 10, line, { ko: 9, color: noSave && i === 0 && !this.tall ? S.red : S.ink }), h.w - 12);
    });

    const lead = v.roster.find((r) => r.id === v.selected);
    if (v.resume) {
      this.drawResume(g, v, lead?.name ?? '');
      return;
    }
    // 출진
    const s = this.tall ? START_TALL.sortie : START_SORTIE;
    const on = this.focus === 'sortie';
    box(g, s.x, s.y, s.w, s.h, S.gold);
    this.t(s.x + s.w / 2, s.y + 9, '출진', { ko: 11, bold: true, color: on ? S.red : S.ink }).setOrigin(0.5, 0);
    if (lead) this.fit(this.t(s.x + s.w / 2, s.y + (this.tall ? 30 : 27), `선두 ${lead.name}`, { ko: this.tall ? 11 : 9 }).setOrigin(0.5, 0), s.w - 8);
    if (on) cursor(g, s.x + 8, s.y + 12);
  }

  /** 진행 중 판이 있으면: 위 이어하기(금), 아래 새로 출진 */
  private drawResume(g: Phaser.GameObjects.Graphics, v: StartShow, leadName: string): void {
    const r = v.resume!;
    const onR = this.focus === 'resume';
    const onN = this.focus === 'sortie';
    const R = this.tall ? START_TALL.resume : START_RESUME;
    const N = this.tall ? START_TALL.fresh : START_NEW;
    // 세로형은 큰 단추라 Galmuri11로 가운데에
    const ko = this.tall ? 11 : 9;
    const ty = (b: { y: number; h: number }) => b.y + Math.floor((b.h - (this.tall ? 12 : 10)) / 2) - 1;
    box(g, R.x, R.y, R.w, R.h, S.gold);
    this.fit(this.t(R.x + 12, ty(R), `이어하기 ${r.name} 제${r.wave}전`, { ko, color: onR ? S.red : S.ink }), R.w - 16);
    if (onR) cursor(g, R.x + 4, ty(R) + 3);
    box(g, N.x, N.y, N.w, N.h, S.cream);
    this.fit(this.t(N.x + 12, ty(N), this.tall ? `새로 출진 · 선두 ${leadName}` : `새로 ${leadName}`, { ko, color: onN ? S.red : S.ink }), N.w - 16);
    if (onN) cursor(g, N.x + 4, ty(N) + 3);
  }
}
