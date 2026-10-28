import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WAVES } from '@/lib/duel/run';

// Supabase에 붙여 넣는 SQL의 웨이브 범위가 게임 웨이브 수(36)와 같아야 끝까지 간 판이 거절되지 않는다
const sql = (f: string) => readFileSync(join(__dirname, '../../docs', f), 'utf8');

describe('일기토 SQL 문서', () => {
  it('피드백 테이블: wave 1~WAVES, 기존 테이블용 ALTER 안내', () => {
    const s = sql('duel-feedback.sql');
    expect(s).toContain(`wave int not null check (wave between 1 and ${WAVES})`);
    expect(s).not.toMatch(/wave between 1 and 18/);
    expect(s).toContain(
      `-- alter table duel_feedback drop constraint duel_feedback_wave_check, add constraint duel_feedback_wave_check check (wave between 1 and ${WAVES});`,
    );
  });

  it('판 기록 테이블: reached_wave 1~WAVES', () => {
    expect(sql('duel-runs.sql')).toContain(`check (reached_wave between 1 and ${WAVES})`);
  });
});
