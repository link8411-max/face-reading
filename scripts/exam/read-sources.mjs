// 문제 초안을 쓰기 전에 후보 말의 출처 글을 읽는다.
//   node scripts/exam/read-sources.mjs "전여친 감자칼" "책없쾌"      (--subject=meme 기본)
// 후보 파일에 저장된 요약·예시와, 독립 출처 글(네이버 블로그·그 밖의 매체) 최대 3개의 본문 앞부분을 출력한다.
// 해설은 여기서 읽은 내용으로 새로 쓴다. 출처 문장을 그대로 옮기지 않는다.

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const argv = process.argv.slice(2);
const subject = (argv.find((a) => a.startsWith('--subject=')) || '--subject=meme').split('=')[1];
const words = argv.filter((a) => !a.startsWith('--'));
const key = (s) => s.replace(/[‘’'"“”`*#]/g, '').replace(/\s/g, '').toLowerCase();
const db = JSON.parse(await fs.readFile(path.join(root, 'docs/exam', subject + '-candidates.json'), 'utf8'));

const browser = await chromium.launch();
const page = await (await browser.newContext({ locale: 'ko-KR' })).newPage();
for (const w of words) {
  const t = db.terms[key(w)];
  if (!t) { console.log(`\n##### ${w}: 후보 파일에 없음`); continue; }
  const v = t.verify || {};
  console.log(`\n##### ${t.term} [${t.decision?.status || t.status}] 독립 출처 ${v.titleHits ?? 0}곳${t.site ? ' · 시기 ' + t.site.period : ''}`);
  console.log(`요약(네이버 AI, 틀릴 수 있음): ${v.summary || '-'}`);
  if (v.examples?.length) console.log(`예시: ${v.examples.join(' ')}`);
  let n = 0;
  for (const l of v.links || []) {
    if (n >= 3) break;
    const m = l.href.match(/blog\.naver\.com\/([A-Za-z0-9_-]+)\/(\d{9,})/);
    const url = m ? `https://m.blog.naver.com/${m[1]}/${m[2]}` : l.href;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1500);
      const tx = await page.evaluate(() =>
        (document.querySelector('.se-main-container, article, main') || document.body).innerText.replace(/\s+/g, ' '),
      );
      const core = t.term.split(' ')[0];
      const i = Math.max(0, tx.indexOf(core) - 60);
      console.log(`--- 출처 ${++n}: ${l.title.slice(0, 50)} (${url})\n${tx.slice(i, i + 900)}`);
    } catch (e) {
      console.log(`--- 읽기 실패: ${url} ${String(e.message).slice(0, 50)}`);
    }
  }
  if (!n) console.log('--- 저장된 독립 출처 글 없음. 네이버에서 직접 검색해 확인할 것.');
}
await browser.close();
