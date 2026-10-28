import { BODY_CHARS_11 } from './layout';
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

/** 열전 본문을 쪽으로 나눈다: Galmuri11 한 줄 BODY_CHARS_11자, 쪽마다 perPage줄(문장은 빼지 않는다, ▼로 넘긴다) */
export function bodyPages(sentences: string[], perPage: number, chars = BODY_CHARS_11): string[][] {
  const lines = wrapText(sentences.join(' '), chars);
  if (lines.length === 0) return [[]];
  const out: string[][] = [];
  for (let i = 0; i < lines.length; i += perPage) out.push(lines.slice(i, i + perPage));
  return out;
}
