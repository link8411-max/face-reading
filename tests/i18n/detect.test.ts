import { describe, it, expect } from 'vitest';
import { decide } from '@/lib/i18n/detect';

const base = { path: '/face2', langCookie: undefined, country: undefined, acceptLanguage: undefined, hasSuggestCookie: false };

describe('decide', () => {
  it('쿠키 없음 + 미국 + 영어 브라우저 → 안내 띠만, 리디렉션 없음', () => {
    const r = decide({ ...base, country: 'US', acceptLanguage: 'en-US,en;q=0.9' });
    expect(r).toEqual({ setSuggest: true });
    expect(r.redirect).toBeUndefined();
  });
  it('쿠키 없음 + 한국 → 아무것도 안 함', () => {
    expect(decide({ ...base, country: 'KR', acceptLanguage: 'en-US' })).toEqual({});
  });
  it('쿠키 없음 + 미국 IP + 한국어 브라우저 → 아무것도 안 함', () => {
    expect(decide({ ...base, country: 'US', acceptLanguage: 'ko-KR,ko;q=0.9' })).toEqual({});
  });
  it('이미 안내 쿠키가 있으면 다시 정하지 않는다', () => {
    expect(decide({ ...base, country: 'US', acceptLanguage: 'en', hasSuggestCookie: true })).toEqual({});
  });
  it('lang=en + 영어판 있는 한국어 경로 → 영어판으로', () => {
    expect(decide({ ...base, langCookie: 'en' })).toEqual({ redirect: '/en/face2' });
    expect(decide({ ...base, path: '/', langCookie: 'en' })).toEqual({ redirect: '/en' });
    expect(decide({ ...base, path: '/animal/r/cat', langCookie: 'en' })).toEqual({ redirect: '/en/animal/r/cat' });
  });
  it('lang=en + 영어판 없는 경로 → 그대로', () => {
    expect(decide({ ...base, path: '/saju', langCookie: 'en' })).toEqual({});
  });
  it('lang=ko + /en 아래 → 한국어 짝으로', () => {
    expect(decide({ ...base, path: '/en/animal', langCookie: 'ko' })).toEqual({ redirect: '/animal' });
    expect(decide({ ...base, path: '/en', langCookie: 'ko' })).toEqual({ redirect: '/' });
  });
  it('lang=ko + 한국어 경로 → 그대로', () => {
    expect(decide({ ...base, langCookie: 'ko' })).toEqual({});
  });
  it('쿠키 없음 + /en 경로 → 그대로(리디렉션 없음)', () => {
    expect(decide({ ...base, path: '/en/face2' })).toEqual({});
    expect(decide({ ...base, path: '/en/face2', country: 'KR', acceptLanguage: 'ko' })).toEqual({});
  });
  it('어떤 입력에서도 쿠키가 없으면 redirect가 없다', () => {
    for (const path of ['/', '/face2', '/en', '/en/face2', '/saju', '/animal/r/cat'])
      for (const country of [undefined, 'US', 'KR', 'JP'])
        for (const acceptLanguage of [undefined, 'en', 'ko', 'ja'])
          for (const hasSuggestCookie of [true, false])
            expect(decide({ path, langCookie: undefined, country, acceptLanguage, hasSuggestCookie }).redirect).toBeUndefined();
  });
  it('알 수 없는 lang 쿠키 값은 쿠키 없음으로 본다', () => {
    expect(decide({ ...base, langCookie: 'xx' }).redirect).toBeUndefined();
  });
  it('안내 쿠키가 이미 있고 lang 쿠키도 없는 영어 경로에서는 setSuggest 안 한다(한국어 경로만 안내)', () => {
    // 영어 경로에 온 사람은 이미 영어로 보고 있다
    expect(decide({ ...base, path: '/en/face2', country: 'US', acceptLanguage: 'en' })).toEqual({});
  });
});
