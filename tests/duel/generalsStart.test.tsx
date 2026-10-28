import { describe, it, expect, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import GeneralPage from '@/app/samguk/duel/generals/[id]/page';
import RosterStartLink, { rosterHas } from '@/components/duel/RosterStartLink';
import { SAVE_KEY, defaultSave } from '@/lib/duel/save';

const render = async (id: string) => renderToStaticMarkup(await GeneralPage({ params: Promise.resolve({ id }) }));

describe('장수 페이지 "이 장수로 시작" (?me=)', () => {
  it.each(['guanyu', 'zhangfei', 'zhaoyun', 'zhouyu'])('시작 장수 %s: 서버에서 바로 ?me= 링크', async (id) => {
    const html = await render(id);
    expect(html).toContain(`href="/samguk/duel?me=${id}"`);
    expect(html).toContain('이 장수로 시작');
  });

  it.each(['machao', 'huangzhong', 'xuchu', 'xiaohoudun', 'jiangwei'])('영입 장수 %s: 서버 화면엔 ?me= 링크가 없고 영입 안내 + 일반 링크', async (id) => {
    const html = await render(id);
    expect(html).not.toContain('?me=');
    expect(html).not.toContain('이 장수로 시작');
    expect(html).toContain('영입하면 시작 장수로 고를 수 있어요');
    expect(html).toContain('href="/samguk/duel"');
  });

  it.each(['lvbu', 'dongzhuo', 'zhangjiao'])('보스 %s: 시작 링크 없음', async (id) => {
    const html = await render(id);
    expect(html).not.toContain('?me=');
    expect(html).toContain('보스로 등장');
  });

  it('RosterStartLink 첫 그림(서버·하이드레이션 전)은 영입 안내', () => {
    const html = renderToStaticMarkup(<RosterStartLink id="machao" />);
    expect(html).not.toContain('?me=');
    expect(html).toContain('영입하면 시작 장수로 고를 수 있어요');
  });
});

describe('rosterHas (이 기기 장수록)', () => {
  const g = globalThis as { window?: unknown };
  afterEach(() => {
    delete g.window;
  });
  const withStore = (value: string | null, throws = false) => {
    g.window = {
      get localStorage() {
        if (throws) throw new Error('blocked');
        return { getItem: (k: string) => (k === SAVE_KEY ? value : null), setItem() {}, removeItem() {} };
      },
    };
  };

  it('저장된 장수록에 있으면 true, 없으면 false', () => {
    withStore(JSON.stringify({ ...defaultSave(), roster: ['guanyu', 'machao'] }));
    expect(rosterHas('machao')).toBe(true);
    expect(rosterHas('jiangwei')).toBe(false);
  });

  it('저장이 없거나 깨졌거나 저장소를 못 열면 false', () => {
    withStore(null);
    expect(rosterHas('machao')).toBe(false);
    withStore('{broken');
    expect(rosterHas('machao')).toBe(false);
    withStore(null, true);
    expect(rosterHas('machao')).toBe(false);
  });
});
