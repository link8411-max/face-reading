import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// 한국어 루트 레이아웃의 소스. 레이아웃에서 SiteShell·SiteHead·siteFonts로 나눠 뽑았으므로 넷을 이어 읽는다.
const ROOT = join(__dirname, '../..');
export function koLayoutSource(): string {
  return ['src/app/(ko)/layout.tsx', 'src/components/SiteShell.tsx', 'src/components/SiteHead.tsx', 'src/lib/siteFonts.ts']
    .map((f) => readFileSync(join(ROOT, f), 'utf8'))
    .join('\n');
}
