// 글자 수로 줄 나누기(Phaser 없음). 띄어쓰기에서 끊고, 한 낱말이 max보다 길면 그 자리에서 자른다.
export function wrapText(text: string, max: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    let w = word;
    while (w.length > max) {
      if (line) {
        out.push(line);
        line = '';
      }
      out.push(w.slice(0, max));
      w = w.slice(max);
    }
    if (!w) continue;
    if (!line) line = w;
    else if (line.length + 1 + w.length <= max) line += ` ${w}`;
    else {
      out.push(line);
      line = w;
    }
  }
  if (line) out.push(line);
  return out;
}

/** 열전 본문 한 줄 글자 수·최대 줄 수(결과 화면 Galmuri9) */
export const BODY_CHARS = 26;
export const BODY_MAX = 7;

/** 문장들을 26자 줄로. 7줄이 넘으면 첫 문장·마지막 문장은 남기고 가운데 문장부터 뺀다(글꼴은 줄이지 않는다) */
export function bodyLines(sentences: string[]): string[] {
  const keep = [...sentences];
  const wrap = () => wrapText(keep.join(' '), BODY_CHARS);
  while (wrap().length > BODY_MAX && keep.length > 2) keep.splice(1, 1);
  return wrap().slice(0, BODY_MAX);
}
