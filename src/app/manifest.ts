import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '운명을 읽다 - AI 관상 & 신년운세',
    short_name: '운명을읽다',
    description: '무료 AI 관상 분석과 사주팔자 기반 신년운세',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F8FC',
    theme_color: '#F7F8FC',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
