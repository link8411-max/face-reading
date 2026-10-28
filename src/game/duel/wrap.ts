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
