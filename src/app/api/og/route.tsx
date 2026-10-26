import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// 공유 미리보기(OG) 이미지 — 사이트 뉴트럴 톤(바탕 #FBF6F1, 오트밀 카드, 테라코타 포인트)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || '운명을 읽다';
    const subtitle = searchParams.get('subtitle') || '사진 한 장으로 보는 관상과 운세';
    const icon = searchParams.get('icon') || '';

    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FBF6F1', padding: '56px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              backgroundColor: '#ECE5D9',
              borderRadius: '48px',
              padding: '64px 80px',
              overflow: 'hidden',
            }}
          >
            {/* 초승달·별 장식 */}
            <div style={{ position: 'absolute', right: '60px', top: '40px', width: '220px', height: '220px', borderRadius: '50%', backgroundColor: '#FBF6F1', display: 'flex' }} />
            <div style={{ position: 'absolute', right: '20px', top: '10px', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: '#ECE5D9', display: 'flex' }} />
            <div style={{ position: 'absolute', right: '330px', top: '70px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#9A4F35', display: 'flex' }} />

            <div style={{ display: 'flex', fontSize: '30px', color: '#9A4F35', fontWeight: 700 }}>운명을 읽다</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '24px' }}>
              {icon && <span style={{ fontSize: '84px' }}>{icon}</span>}
              <span style={{ fontSize: '84px', fontWeight: 700, color: '#2E2A27', lineHeight: 1.2 }}>{title}</span>
            </div>
            <div style={{ display: 'flex', fontSize: '38px', color: '#6B6259', marginTop: '24px' }}>{subtitle}</div>
            <div style={{ display: 'flex', fontSize: '28px', color: '#6B6259', marginTop: '48px' }}>unse-ai.com</div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (e: unknown) {
    console.error(e);
    return new Response('OG 이미지 생성 실패', { status: 500 });
  }
}
