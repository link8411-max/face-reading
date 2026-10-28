import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FeedbackForm from '@/components/duel/FeedbackForm';

describe('FeedbackForm 별점', () => {
  it('rating을 주면 그 별이 눌린 상태(밖의 별점과 같은 값)', () => {
    const html = renderToStaticMarkup(<FeedbackForm wave={4} starter="guanyu" cleared={false} rating={3} onRate={() => {}} />);
    expect(html).toContain('aria-label="별 3개" aria-pressed="true"');
    expect(html).toContain('aria-label="별 4개" aria-pressed="false"');
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
  });

  it('한 줄 의견 칸: 개인정보를 적지 말라는 안내와 접근성 이름', () => {
    const html = renderToStaticMarkup(<FeedbackForm wave={4} starter="guanyu" cleared={false} />);
    expect(html).toContain('placeholder="한 줄 남기기 (선택, 개인정보는 적지 마세요)"');
    expect(html).toContain('aria-label="한 줄 의견"');
  });

  it('rating 없이 쓰면 처음엔 아무 별도 눌리지 않고 보내기는 꺼져 있다', () => {
    const html = renderToStaticMarkup(<FeedbackForm wave={4} starter="guanyu" cleared={false} />);
    expect(html).not.toContain('aria-pressed="true"');
    expect(html).toMatch(/disabled=""[^>]*>보내기|<button[^>]*disabled=""[^>]*>보내기/);
  });
});
