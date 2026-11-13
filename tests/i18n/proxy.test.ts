import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy, config } from '@/proxy';

function req(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3200${path}`, { headers });
}

describe('proxy', () => {
  it('쿠키 없는 로봇(미국 IP, 영어)은 307이 나오지 않고 안내 쿠키만 받는다', () => {
    const res = proxy(req('/face2?x=1', { 'x-vercel-ip-country': 'US', 'accept-language': 'en-US,en;q=0.9' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
    expect(res.headers.get('set-cookie')).toContain('lang_suggest=en');
  });
  it('구글봇 같은 요청(헤더 거의 없음)도 그대로 지나간다', () => {
    const res = proxy(req('/', { 'user-agent': 'Googlebot' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });
  it('lang=en 쿠키가 있으면 쿼리를 지켜 307', () => {
    const res = proxy(req('/animal/r/cat?s=88&utm_source=share', { cookie: 'lang=en' }));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname + new URL(res.headers.get('location')!).search).toBe('/en/animal/r/cat?s=88&utm_source=share');
  });
  it('lang=en이어도 영어판 없는 경로는 그대로', () => {
    expect(proxy(req('/saju', { cookie: 'lang=en' })).status).toBe(200);
  });
  it('한국에서 오면 쿠키를 심지 않는다', () => {
    const res = proxy(req('/', { 'x-vercel-ip-country': 'KR', 'accept-language': 'ko-KR' }));
    expect(res.headers.get('set-cookie')).toBeNull();
  });
  it('matcher는 api·정적·파일 확장자를 뺀다', () => {
    const re = new RegExp('^' + config.matcher[0] + '$');
    for (const p of ['/', '/face2', '/en/face2', '/animal/r/cat']) expect(re.test(p), p).toBe(true);
    for (const p of ['/api/og', '/_next/static/a.js', '/images/x.webp', '/icons/a.png', '/models/m.task', '/robots.txt', '/sitemap.xml', '/sw.js', '/favicon.ico']) expect(re.test(p), p).toBe(false);
  });
});
