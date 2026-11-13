import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { castParam, loadCastImage } from '@/lib/ogCast';
import { CAST } from '@/content/cast';

export const runtime = 'edge';

// 공유 미리보기(OG) 이미지 — 사이트 뉴트럴 톤(바탕 #F7F8FC, 흰 카드, 블루·라임 포인트)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || '운명을 읽다';
    const subtitle = searchParams.get('subtitle') || '사진 한 장으로 보는 관상과 운세';
    const icon = searchParams.get('icon') || '';
    // ?cast= 는 캐릭터 키 허용 목록만(없으면 해태). 그림을 못 받으면 그림 없이 그린다.
    const castKey = castParam(searchParams.get('cast'));
    const castImg = await loadCastImage(castKey, request.url);

    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FC', padding: '56px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
              border: '3px solid #E1E6F5',
              borderRadius: '48px',
              padding: castImg ? '64px 80px 64px 72px' : '64px 80px',
              overflow: 'hidden',
            }}
          >
            {castImg ? (
              <div style={{ position: 'absolute', right: '36px', top: '36px', width: '440px', height: '440px', borderRadius: '50%', backgroundColor: CAST[castKey].bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={castImg as unknown as string} width={400} height={400} style={{ objectFit: 'cover', borderRadius: '50%' }} alt="" />
              </div>
            ) : (
              <>
                {/* 그림을 못 받았을 때: 초승달·별 장식 */}
                <div style={{ position: 'absolute', right: '60px', top: '40px', width: '220px', height: '220px', borderRadius: '50%', backgroundColor: '#EEF1FA', display: 'flex' }} />
                <div style={{ position: 'absolute', right: '20px', top: '10px', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: '#C6F24E', display: 'flex' }} />
                <div style={{ position: 'absolute', right: '330px', top: '70px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#2D55FF', display: 'flex' }} />
              </>
            )}

            <div style={{ display: 'flex', fontSize: '30px', color: '#2D55FF', fontWeight: 700 }}>운명을 읽다</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '24px' }}>
              {icon ? <span style={{ fontSize: '84px' }}>{icon}</span> : null}
              <span style={{ fontSize: castImg ? '68px' : '84px', fontWeight: 700, color: '#1A1B25', lineHeight: 1.2, maxWidth: castImg ? '520px' : '100%', wordBreak: 'keep-all' }}>{title}</span>
            </div>
            <div style={{ display: 'flex', fontSize: '38px', color: '#5E6070', marginTop: '24px', maxWidth: castImg ? '520px' : '100%', wordBreak: 'keep-all' }}>{subtitle}</div>
            <div style={{ display: 'flex', fontSize: '28px', color: '#5E6070', marginTop: '48px' }}>unse-ai.com</div>
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
