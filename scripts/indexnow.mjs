// IndexNow: 사이트맵의 주소(또는 인자로 준 경로)를 네이버·빙 등에 한 번에 알린다.
// 네이버 '웹 페이지 수집 요청'(하루 50건)과 달리 한 번에 1만 개까지 보낼 수 있다.
//   node scripts/indexnow.mjs --dry-run                 사이트맵 전체, 보내지 않고 개수만
//   node scripts/indexnow.mjs                           사이트맵 전체 전송
//   node scripts/indexnow.mjs /samguk/cup /fortune      이 경로들만 전송
// 키는 공개값이다(규격상 public/<키>.txt 로 노출). 키를 바꾸면 그 파일도 바꾼다.

const SITE = 'https://unse-ai.com';
const HOST = 'unse-ai.com';
const KEY = 'bdd5889660e497f527dd0a32a46b7f0f';
const ENDPOINTS = ['https://searchadvisor.naver.com/indexnow', 'https://api.indexnow.org/indexnow'];
const MAX_URLS = 10_000;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const paths = args.filter((a) => !a.startsWith('--'));

async function sitemapUrls() {
  const res = await fetch(`${SITE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

const urls = [...new Set(paths.length ? paths.map((p) => `${SITE}${p.startsWith('/') ? '' : '/'}${p}`) : await sitemapUrls())];
const foreign = urls.filter((u) => new URL(u).host !== HOST);
if (foreign.length) throw new Error(`다른 호스트 주소: ${foreign.slice(0, 3).join(', ')}`);

console.log(`주소 ${urls.length}개`, urls.slice(0, 5));
if (dryRun) process.exit(0);

for (let i = 0; i < urls.length; i += MAX_URLS) {
  const urlList = urls.slice(i, i + MAX_URLS);
  const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList });
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body });
      console.log(`${endpoint}: ${res.status} (${urlList.length}개)`);
    } catch (e) {
      console.log(`${endpoint}: 실패 ${e.message}`);
    }
  }
}
