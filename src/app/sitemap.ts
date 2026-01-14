import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://unse-ai.com'

    const routes = [
        '',
        '/face2',
        '/fortune',
        '/fortune/daily',
        '/samguk',
        '/animal',
        '/face'
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '/fortune/daily' ? 'daily' : 'weekly' as any,
        priority: route === '' ? 1 : 0.8,
    }))

    return routes
}
