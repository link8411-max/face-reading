// 공유 링크 공통값: 사이트 주소와 utm. 데이터 모듈을 import하지 않는 잎 모듈(일기토 공유 링크도 여기만 쓴다)
export const SITE = 'https://unse-ai.com';

/** 공유 링크 utm (source=share, medium=friend_link) */
export const UTM = (campaign: string) => `utm_source=share&utm_medium=friend_link&utm_campaign=${campaign}`;
