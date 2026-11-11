import { MetadataRoute } from 'next'
import { ZODIAC_SLUGS } from '@/content/fortune2027Zodiac'
import { MBTI_SLUGS } from '@/content/mbtiTypes'
import { DUEL_GENERALS } from '@/lib/duel/generals'
import { PEOPLE_IDS } from '@/content/samgukPeople'
import rounds from '@/content/exam/meme-rounds.json'
import { releasedWordRoutes } from '@/lib/exam/words'
import { kstDate } from '@/lib/kst'
import type { Round } from '@/lib/exam/types'

const DUEL_GENERAL_ROUTES = DUEL_GENERALS.filter((g) => g.role !== 'mob').map((g) => `/samguk/duel/generals/${g.id}`)

const PEOPLE_ROUTES = PEOPLE_IDS.map((id) => `/samguk/people/${id}`)

const baseUrl = 'https://unse-ai.com'

export const SITEMAP_ROUTES = [
    '',
    '/face2',
    '/fortune',
    '/saju',
    '/fortune/mbti',
    '/fortune/daily',
    '/samguk',
    '/animal',
    '/face-tests',
    '/unse',
    '/about',
    '/privacy',
    '/fortune/2027',
    ...ZODIAC_SLUGS.map((s) => `/fortune/2027/${s}` as const),
    '/mbti',
    '/mbti/match',
    ...MBTI_SLUGS.map((s) => `/mbti/${s}`),
    '/face-match',
    '/samguk/team',
    '/samguk/duel',
    ...DUEL_GENERAL_ROUTES,
    '/samguk/people',
    '/samguk/people/ranking',
    ...PEOPLE_ROUTES,
    '/samguk/cup',
    '/samguk/cup/ranking',
    '/samguk/videos',
    '/exam/meme',
    '/exam/meme/words',
]

// 페이지 내용을 바꾸면 해당 라우트 날짜도 갱신할 것 (new Date()를 쓰면 매 요청마다 바뀌어 검색엔진이 무시함)
export const LAST_MODIFIED: Record<string, string> = {
    '': '2026-11-07',
    '/face2': '2026-11-07',
    '/fortune': '2026-11-07',
    '/saju': '2026-11-07',
    '/fortune/mbti': '2026-10-27',
    '/fortune/daily': '2026-11-05',
    '/samguk': '2026-11-07',
    '/animal': '2026-11-07',
    '/face-tests': '2026-11-07',
    '/unse': '2026-11-07',
    '/about': '2026-10-26',
    '/privacy': '2026-11-04',
    '/fortune/2027': '2026-11-07',
    ...Object.fromEntries(ZODIAC_SLUGS.map((s) => [`/fortune/2027/${s}`, '2026-11-07'])),
    '/mbti': '2026-11-07',
    '/mbti/match': '2026-11-07',
    '/face-match': '2026-10-27',
    '/samguk/team': '2026-10-27',
    '/samguk/duel': '2026-10-28',
    ...Object.fromEntries(DUEL_GENERAL_ROUTES.map((r) => [r, '2026-10-28'])),
    '/samguk/people': '2026-11-04',
    '/samguk/people/ranking': '2026-11-03',
    ...Object.fromEntries(PEOPLE_ROUTES.map((r) => [r, '2026-11-04'])),
    '/samguk/cup': '2026-11-04',
    '/samguk/cup/ranking': '2026-11-04',
    '/samguk/videos': '2026-11-05',
    '/exam/meme': '2026-11-11',
    '/exam/meme/words': '2026-11-12',
    ...Object.fromEntries(MBTI_SLUGS.map((s) => [`/mbti/${s}`, '2026-11-07'])),
}

type ChangeFrequency = MetadataRoute.Sitemap[number]['changeFrequency']

// 낱말 페이지는 자정마다 새로 열리므로 6시간마다 다시 만든다(공개된 말만 넣는다)
export const revalidate = 21600

export default function sitemap(): MetadataRoute.Sitemap {
    const words = releasedWordRoutes(kstDate(new Date()), rounds.rounds as unknown as Round[]).map(([route, day]) => ({ url: `${baseUrl}${route}`, lastModified: day, changeFrequency: 'monthly' as ChangeFrequency, priority: 0.6 }))
    return [...SITEMAP_ROUTES.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: LAST_MODIFIED[route],
        changeFrequency: (route === '/fortune/daily' || route === '/fortune/mbti' ? 'daily' : route === '/about' || route === '/privacy' ? 'yearly' : 'weekly') as ChangeFrequency,
        priority: route === '' ? 1 : route === '/about' || route === '/privacy' ? 0.3 : 0.8,
    })), ...words]
}
