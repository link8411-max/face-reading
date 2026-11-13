// 네이버 월간 검색 횟수 조회 (네이버 검색광고 API의 키워드 도구).
// 블랙키위·키워드마스터 같은 도구가 쓰는 것과 같은 공식 API다. 무료.
//
// 준비: searchad.naver.com 로그인 → 도구 → API 사용 관리에서 발급한 값을 .env.local에 넣는다.
//   NAVER_AD_CUSTOMER_ID=1234567        (CUSTOMER_ID)
//   NAVER_AD_API_KEY=...                 (액세스라이선스)
//   NAVER_AD_SECRET=...                  (비밀키)
//
// 사용:
//   node scripts/keyword-volume.mjs 구미호 도깨비 저승사자 해태 무당
//   node scripts/keyword-volume.mjs --related 관상테스트      # 연관 키워드까지 상위 30개
//
// 주의: 키워드에 띄어쓰기를 넣으면 API가 받지 않는다. "관상 테스트"는 "관상테스트"로 넣는다(스크립트가 지운다).
//       10 미만은 API가 "< 10"으로 준다. 여기서는 5로 센다.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = 'https://api.searchad.naver.com'
const URI = '/keywordstool'

function readEnv() {
  const out = { ...process.env }
  const file = path.join(ROOT, '.env.local')
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && out[m[1]] === undefined) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  }
  return out
}

/** 서명: HMAC-SHA256("<시각>.<메서드>.<경로>") → base64 */
export function sign(secret, timestamp, method, uri) {
  return crypto.createHmac('sha256', secret).update(`${timestamp}.${method}.${uri}`).digest('base64')
}

const toNumber = (v) => (typeof v === 'number' ? v : String(v).includes('<') ? 5 : Number(v) || 0)

async function query(env, keywords) {
  const timestamp = String(Date.now())
  const url = `${BASE}${URI}?hintKeywords=${encodeURIComponent(keywords.join(','))}&showDetail=1`
  const res = await fetch(url, {
    headers: {
      'X-Timestamp': timestamp,
      'X-API-KEY': env.NAVER_AD_API_KEY,
      'X-Customer': env.NAVER_AD_CUSTOMER_ID,
      'X-Signature': sign(env.NAVER_AD_SECRET, timestamp, 'GET', URI),
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return (await res.json()).keywordList ?? []
}

async function main() {
  const args = process.argv.slice(2)
  const related = args.includes('--related')
  const keywords = args.filter((a) => !a.startsWith('--')).map((k) => k.replace(/\s+/g, ''))
  if (keywords.length === 0) {
    console.error('사용: node scripts/keyword-volume.mjs [--related] <키워드> [키워드 ...]')
    process.exit(1)
  }
  const env = readEnv()
  const missing = ['NAVER_AD_CUSTOMER_ID', 'NAVER_AD_API_KEY', 'NAVER_AD_SECRET'].filter((k) => !env[k])
  if (missing.length) {
    console.error(`.env.local에 값이 없어요: ${missing.join(', ')}\n발급: searchad.naver.com → 도구 → API 사용 관리`)
    process.exit(1)
  }

  const rows = new Map()
  for (let i = 0; i < keywords.length; i += 5) {
    const chunk = keywords.slice(i, i + 5) // 한 번에 다섯 개까지
    for (const k of await query(env, chunk)) {
      const pc = toNumber(k.monthlyPcQcCnt)
      const mobile = toNumber(k.monthlyMobileQcCnt)
      rows.set(k.relKeyword, { keyword: k.relKeyword, pc, mobile, total: pc + mobile, competition: k.compIdx ?? '' })
    }
  }

  const wanted = new Set(keywords.map((k) => k.toUpperCase()))
  let list = [...rows.values()]
  list = related
    ? list.sort((a, b) => b.total - a.total).slice(0, 30)
    : list.filter((r) => wanted.has(r.keyword.toUpperCase())).sort((a, b) => b.total - a.total)

  console.log('키워드\tPC\t모바일\t합계\t경쟁')
  for (const r of list) console.log(`${r.keyword}\t${r.pc}\t${r.mobile}\t${r.total}\t${r.competition}`)
  const notFound = keywords.filter((k) => !rows.has(k) && ![...rows.keys()].some((x) => x.toUpperCase() === k.toUpperCase()))
  if (!related && notFound.length) console.log(`\n응답에 없는 키워드: ${notFound.join(', ')}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error('조회 실패:', e.message)
    process.exit(1)
  })
}
