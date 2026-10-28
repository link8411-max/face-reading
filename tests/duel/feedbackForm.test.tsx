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

  it('rating 없이 쓰면 처음엔 아무 별도 눌리지 않고 보내기는 꺼져 있다', () => {
    const html = renderToStaticMarkup(<FeedbackForm wave={4} starter="guanyu" cleared={false} />);
    expect(html).not.toContain('aria-pressed="true"');
    expect(html).toMatch(/disabled=""[^>]*>보내기|<button[^>]*disabled=""[^>]*>보내기/);
  });
});
