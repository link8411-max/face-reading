import { MetadataRoute } from 'next'
import { ZODIAC_SLUGS } from '@/content/fortune2027Zodiac'

const baseUrl = 'https://unse-ai.com'

export const SITEMAP_ROUTES = [
    '',
    '/face2',
    '/fortune',
    '/fortune/daily',
    '/samguk',
    '/animal',
    '/about',
    '/privacy',
    '/fortune/2027',
    ...ZODIAC_SLUGS.map((s) => `/fortune/2027/${s}` as const),
]

// 페이지 내용을 바꾸면 해당 라우트 날짜도 갱신할 것 (new Date()를 쓰면 매 요청마다 바뀌어 검색엔진이 무시함)
export const LAST_MODIFIED: Record<string, string> = {
    '': '2026-10-26',
    '/face2': '2026-10-26',
    '/fortune': '2026-10-26',
    '/fortune/daily': '2026-10-26',
    '/samguk': '2026-10-26',
    '/animal': '2026-10-26',
    '/about': '2026-10-26',
    '/privacy': '2026-10-26',
    '/fortune/2027': '2026-10-27',
    ...Object.fromEntries(ZODIAC_SLUGS.map((s) => [`/fortune/2027/${s}`, '2026-10-27'])),
}

type ChangeFrequency = MetadataRoute.Sitemap[number]['changeFrequency']

export default function sitemap(): MetadataRoute.Sitemap {
    return SITEMAP_ROUTES.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: LAST_MODIFIED[route],
        changeFrequency: (route === '/fortune/daily' ? 'daily' : route === '/about' || route === '/privacy' ? 'yearly' : 'weekly') as ChangeFrequency,
        priority: route === '' ? 1 : route === '/about' || route === '/privacy' ? 0.3 : 0.8,
    }))
}
