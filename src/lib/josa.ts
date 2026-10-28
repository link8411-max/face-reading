// 받침 유무로 조사 고르기 (다른 모듈을 import하지 않는 잎 모듈: 어디서 불러도 무거운 데이터가 따라오지 않는다)

const jongOf = (w: string): number => {
  const c = w.charCodeAt(w.length - 1) - 0xac00;
  return c >= 0 && c <= 11171 ? c % 28 : 0;
};

/** 낱말 + 조사. 받침이 있으면 withB, 없으면(한글이 아니어도) without. 예 josa('관우', '이', '가') → '관우가' */
export const josa = (w: string, withB: string, without: string) => w + (jongOf(w) !== 0 ? withB : without);

/** 낱말 + '로'/'으로'. 받침이 없거나 ㄹ 받침이면 '로' */
export const euro = (w: string) => {
  const j = jongOf(w);
  return w + (j === 0 || j === 8 ? '로' : '으로');
};
