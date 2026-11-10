// 능력고사 과목별 후보 수집 틀 (설계: docs/superpowers/specs/2026-11-11-meme-exam-design.md '수집을 기계적으로')
// 과목마다 scripts/exam/subjects/<과목>.json 하나만 만들면 같은 절차로 돈다. 결과는 docs/exam/<과목>-candidates.json.
//
// 쓰는 법:
//   node scripts/exam/collect.mjs                    밈 과목: 목록 사이트 + 블로그 찾기 + 확인
//   node scripts/exam/collect.mjs --subject=<과목>   다른 과목
//   node scripts/exam/collect.mjs --no-find          블로그 찾기는 건너뜀(씨앗·목록 사이트·기존 후보만)
//   node scripts/exam/collect.mjs --all              전부 다시 확인
//
// 하는 일(규칙만, 글을 이해해서 고르지 않는다):
//   1. 찾기  meme-config.json의 findQueries로 네이버 블로그 검색(최근 findPeriod) → 글 주소
//   2. 뽑기  글에서 "말 - 풀이", "말 : 풀이", "말 뜻" 줄을 규칙으로 잘라 (말, 풀이, 주소)
//   3. 세기  서로 다른 블로그에 minPosts번 이상 나온 말만 남김(씨앗은 그냥 통과)
//   4. 확인  네이버에서 "<말> 뜻" 검색 → 요약 첫 문장, 출처 수, 사용 예시, 위쪽 글 제목을 저장
//   5. 거르기 banned에 걸리면 rejected
//   6. 내놓기 docs/exam/meme-candidates.json에 합치고, 이번에 새로 생긴 말을 출력
//
// 상태: new(뽑힘) → checked(검색 결과 있음) | unverified(결과 없음·다른 말로 바뀜) | rejected(금지)
//       approved / hold / rejected / used 는 Claude가 decision에 이유와 함께 적는다(사용자 결정 2026-11-11:
//       "정하는 건 추론 영역"). 한번 적힌 decision은 스크립트가 건드리지 않는다. hold는 지우면 다시 확인된다.
//       주의: 네이버 요약(AI 브리핑)은 틀릴 때가 있다. 요약 하나만 보고 승인하지 않는다.
//
// 네이버 공식 검색 API는 2026년에 개발자센터에서 빠져 NAVER API HUB로 옮겨졌다. 그래서 키 없이
// Playwright(레포 E2E에 이미 있음)로 검색 화면을 읽는다. 화면 구조가 바뀌면 parseVerify를 고친다.

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const argv = process.argv.slice(2);
const args = new Set(argv);
const subject = (argv.find((a) => a.startsWith('--subject=')) || '--subject=meme').split('=')[1];
const CONFIG = path.join(here, 'subjects', subject + '.json');
const OUT = path.join(root, 'docs/exam', subject + '-candidates.json');
const today = new Date().toISOString().slice(0, 10);
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const norm = (s) => s.replace(/[‘’'"“”`*#✔️✅▶•·]/g, '').replace(/\s+/g, ' ').trim();
const key = (s) => norm(s).replace(/\s/g, '').toLowerCase();

/** 글 본문에서 (말, 풀이) 쌍을 규칙으로 뽑는다. */
export function extractPairs(text, stop) {
  const pairs = [];
  const termRe = '([가-힣A-Za-z0-9][가-힣A-Za-z0-9 ]{1,11})';
  const listLine = new RegExp(`^\\s*(?:\\d{1,2}[.)]\\s*|[-•▶✅]\\s*)?${termRe}\\s*[-:：–=]\\s*(.{4,90})$`);
  const meanLine = new RegExp(`^\\s*(?:\\d{1,2}[.)]\\s*)?${termRe}\\s?뜻(?:은|이란|과|,|\\s|$)`);
  for (const raw of text.split('\n')) {
    const line = norm(raw);
    if (line.length < 3 || line.length > 120) continue;
    let m = line.match(listLine);
    let gloss = m ? m[2] : '';
    if (!m) m = line.match(meanLine);
    if (!m) continue;
    const term = m[1].trim();
    if (term.split(' ').length > 4) continue;
    if (stop.has(term) || /^\d+$/.test(term) || /https?/.test(line)) continue;
    if (!/[가-힣]{2}/.test(term) || /^\d{4} /.test(term)) continue; // 'A', 'test', '2026 신조어' 같은 오탐 방지
    pairs.push({ term, gloss: gloss.trim() });
  }
  return pairs;
}

/** "<말> 뜻" 검색 화면의 글자에서 확인 정보를 뽑는다. */
export function parseVerify(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const noResult = /검색결과가 없습니다/.test(text);
  const redirected = /(으로|로) 검색한 결과입니다/.test(text.slice(0, 300));
  let summary = '';
  const ai = lines.indexOf('AI 브리핑');
  if (ai >= 0) summary = lines.slice(ai + 1, ai + 12).find((l) => l.length >= 15 && /[다요]\.$/.test(l)) || '';
  const src = text.match(/출처 (\d+)건/);
  const examples = [];
  const ex = lines.findIndex((l) => /^(사용|활용) ?(예시|예문|방식|맥락)/.test(l));
  if (ex >= 0) for (const l of lines.slice(ex + 1, ex + 8)) if (/^[“"'‘]/.test(l) && l.length < 80) examples.push(l);
  return { summary, sources: src ? Number(src[1]) : 0, examples: examples.slice(0, 3), noResult, redirected };
}

async function main() {
  const cfg = JSON.parse(await fs.readFile(CONFIG, 'utf8'));
  const stop = new Set(cfg.stopwords);
  let db = { updated: today, terms: {} };
  try {
    db = JSON.parse(await fs.readFile(OUT, 'utf8'));
  } catch {}
  const before = new Set(Object.keys(db.terms));
  const touch = (term, by) => {
    const k = key(term);
    db.terms[k] ??= { term: norm(term), glosses: [], blogs: [], firstSeen: today, from: by, status: 'new' };
    db.terms[k].lastSeen = today;
    return db.terms[k];
  };

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ locale: 'ko-KR', userAgent: UA });
  const page = await ctx.newPage();
  const open = async (url) => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1800);
  };

  for (const s of cfg.seeds || []) touch(s, 'seed');

  // 목록 사이트: 이미 누가 날짜순으로 쌓아 둔 목록에서 이름만 가져온다.
  for (const src of cfg.listSources || []) {
    for (const url of src.urls) {
      try {
        await open(url);
        const names = await page.evaluate(([pat, sel]) => {
          const re = new RegExp(pat);
          return [...document.querySelectorAll('a[href]')]
            .filter((a) => re.test(a.getAttribute('href') || ''))
            .map((a) => ({
              name: ((sel.title && a.querySelector(sel.title)) || a).innerText.trim().split('\n')[0].trim(),
              period: ((sel.period && a.querySelector(sel.period)) || { innerText: '' }).innerText.trim(),
              href: a.href,
            }));
        }, [src.linkPattern, { title: src.titleSelector, period: src.periodSelector }]);
        let n = 0;
        for (const { name, period, href } of names) {
          let term = name;
          for (const suf of src.stripSuffix || []) if (term.endsWith(suf)) term = term.slice(0, -suf.length).trim(); // 위에서부터 차례로 한 번씩 뗀다
          term = term.replace(/\(.*?\)/g, '').split(/[:,]/)[0].trim();
          if (term.length < 2 || term.length > 24) continue;
          const t = touch(term, 'site');
          t.site = { name: src.name, url: href, period };
          n++;
        }
        console.log(`[목록] ${src.name} ${url.slice(-12)}: ${n}개`);
      } catch (e) {
        console.log(`[목록] ${src.name} 실패: ${String(e.message).slice(0, 80)}`);
      }
      await sleep(1000);
    }
  }

  if (!args.has('--no-find')) {
    for (const q of cfg.findQueries) {
      try {
        await open(
          'https://search.naver.com/search.naver?ssc=tab.blog.all&nso=' +
            encodeURIComponent(`so:r,p:${cfg.findPeriod}`) + '&query=' + encodeURIComponent(q),
        );
        const urls = await page.evaluate(() => [
          ...new Set(
            [...document.querySelectorAll('a[href*="blog.naver.com/"]')]
              .map((a) => (a.href.match(/blog\.naver\.com\/([A-Za-z0-9_-]+)\/(\d{9,})/) || []).slice(1).join('/'))
              .filter(Boolean),
          ),
        ]);
        console.log(`[찾기] ${q}: 글 ${urls.length}개`);
        for (const u of urls.slice(0, cfg.postsPerQuery)) {
          try {
            await open('https://m.blog.naver.com/' + u);
            const body = await page.evaluate(
              () => (document.querySelector('.se-main-container, #viewTypeSelector, .post_ct') || document.body).innerText,
            );
            const blog = u.split('/')[0];
            for (const p of extractPairs(body, stop)) {
              const t = touch(p.term, 'find');
              if (!t.blogs.includes(blog)) t.blogs.push(blog);
              if (p.gloss && t.glosses.length < 5 && !t.glosses.some((g) => g.text === p.gloss))
                t.glosses.push({ text: p.gloss, url: 'https://blog.naver.com/' + u });
            }
          } catch (e) {
            console.log(`  글 읽기 실패 ${u}: ${String(e.message).slice(0, 60)}`);
          }
          await sleep(600);
        }
      } catch (e) {
        console.log(`[찾기] ${q} 실패: ${String(e.message).slice(0, 80)}`);
      }
    }
  }

  const banned = cfg.banned.map((b) => ({ k: key(b.term), reason: b.reason }));
  const stale = (t) => !t.verify || args.has('--all') || (Date.now() - Date.parse(t.verify.checkedAt)) / 864e5 > 14;
  let checked = 0;
  for (const [k, t] of Object.entries(db.terms)) {
    if (t.decision) continue;
    const ban = banned.find((b) => k.includes(b.k));
    if (ban) {
      t.status = 'rejected';
      t.decision = { status: 'rejected', by: 'rule', reason: ban.reason, date: today };
      continue;
    }
    if (t.from === 'find' && t.blogs.length < cfg.minPosts) continue;
    if (!stale(t)) continue;
    try {
      await open('https://search.naver.com/search.naver?query=' + encodeURIComponent(t.term + (cfg.verifySuffix ?? ' 뜻')));
      const got = await page.evaluate(() => {
        const m = document.querySelector('#main_pack') || document.body;
        const links = [...m.querySelectorAll('a[href]')]
          .map((a) => ({ title: a.innerText.trim().replace(/\s+/g, ' ').slice(0, 80), href: a.href }))
          .filter((l) => l.title.length > 5 && /^https?:/.test(l.href) && !/search\.naver\.com|help\.naver/.test(l.href));
        return { text: m.innerText.replace(/\n{2,}/g, '\n').slice(0, 6000), links };
      });
      const v = parseVerify(got.text);
      // 독립 출처: 제목에 그 말이 들어간 글을, 목록 사이트를 빼고 블로그·매체 단위로 센다.
      const owner = (href) => {
        const u = new URL(href);
        const b = href.match(/blog\.naver\.com\/([A-Za-z0-9_-]+)/);
        return b ? 'nblog:' + b[1] : u.hostname.replace(/^www\.|^m\./, '');
      };
      const own = t.site ? owner(t.site.url) : '';
      const seen = new Map();
      for (const l of got.links) {
        if (!key(l.title).includes(k)) continue;
        const o = owner(l.href);
        if (o === own || seen.has(o)) continue;
        seen.set(o, { title: l.title, href: l.href });
      }
      const hit = seen.size;
      t.verify = { ...v, links: [...seen.values()].slice(0, 5), titleHits: hit, checkedAt: new Date().toISOString() };
      t.status = v.noResult || (v.redirected && hit === 0) || (!v.summary && hit === 0) ? 'unverified' : 'checked';
      checked++;
      console.log(`[확인] ${t.term} → ${t.status} (출처 ${v.sources}, 제목 ${hit})`);
    } catch (e) {
      console.log(`[확인] ${t.term} 실패: ${String(e.message).slice(0, 80)}`);
    }
    await sleep(700);
  }
  await browser.close();

  db.updated = today;
  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(db, null, 2) + '\n');

  const all = Object.values(db.terms);
  const count = (s) => all.filter((t) => (t.decision?.status || t.status) === s).length;
  const fresh = Object.entries(db.terms).filter(([k, t]) => !before.has(k) && t.status === 'checked').map(([, t]) => t.term);
  console.log(`\n이번에 확인 ${checked}개. 전체 ${all.length}개: checked ${count('checked')}, unverified ${count('unverified')}, approved ${count('approved')}, rejected ${count('rejected')}, used ${count('used')}, new ${count('new')}`);
  console.log(`새로 올라온 확인된 말(${fresh.length}): ${fresh.join(', ') || '없음'}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
