import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // URL 파라미터에서 값 가져오기
    const title = searchParams.get('title') || '운명을 읽다';
    const subtitle = searchParams.get('subtitle') || '전통 관상으로 보는 나의 운세';
    const icon = searchParams.get('icon') || '🔮';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F5E6D3', // 한지 느낌의 베이지/크림색
            position: 'relative',
          }}
        >
          {/* 전통 문양 느낌의 테두리 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              border: '16px solid',
              borderImage: 'linear-gradient(135deg, #C41E3A, #D4AF37, #C41E3A) 1',
              boxShadow: 'inset 0 0 0 4px #F5E6D3, inset 0 0 0 8px #D4AF37',
            }}
          />

          {/* 상단 장식 패턴 */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              display: 'flex',
              gap: '20px',
            }}
          >
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: i % 2 === 0 ? '#C41E3A' : '#D4AF37',
                  opacity: 0.3,
                }}
              />
            ))}
          </div>

          {/* 하단 장식 패턴 */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              display: 'flex',
              gap: '20px',
            }}
          >
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: i % 2 === 0 ? '#D4AF37' : '#C41E3A',
                  opacity: 0.3,
                }}
              />
            ))}
          </div>

          {/* 메인 컨텐츠 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '30px',
              padding: '60px',
              zIndex: 1,
            }}
          >
            {/* 아이콘 */}
            <div
              style={{
                fontSize: '120px',
                lineHeight: 1,
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
              }}
            >
              {icon}
            </div>

            {/* 제목 - 붓글씨 느낌 */}
            <div
              style={{
                fontSize: '80px',
                fontWeight: 900,
                color: '#2C1810', // 먹물 색
                textAlign: 'center',
                fontFamily: 'serif',
                letterSpacing: '0.05em',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
                lineHeight: 1.2,
              }}
            >
              {title}
            </div>

            {/* 부제목 */}
            <div
              style={{
                fontSize: '36px',
                fontWeight: 600,
                color: '#5C4033', // 진한 갈색
                textAlign: 'center',
                fontFamily: 'serif',
                letterSpacing: '0.1em',
                opacity: 0.9,
              }}
            >
              {subtitle}
            </div>

            {/* 오방색 장식 라인 */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '20px',
              }}
            >
              <div style={{ width: '60px', height: '8px', backgroundColor: '#C41E3A', borderRadius: '4px' }} /> {/* 빨강 */}
              <div style={{ width: '60px', height: '8px', backgroundColor: '#003DA5', borderRadius: '4px' }} /> {/* 파랑 */}
              <div style={{ width: '60px', height: '8px', backgroundColor: '#FFD700', borderRadius: '4px' }} /> {/* 노랑 */}
              <div style={{ width: '60px', height: '8px', backgroundColor: '#FFFFFF', borderRadius: '4px', border: '1px solid #CCC' }} /> {/* 흰색 */}
              <div style={{ width: '60px', height: '8px', backgroundColor: '#2C1810', borderRadius: '4px' }} /> {/* 검정 */}
            </div>
          </div>

          {/* 좌측 장식 문양 */}
          <div
            style={{
              position: 'absolute',
              left: '60px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '30px',
            }}
          >
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  border: '4px solid #C41E3A',
                  opacity: 0.4,
                }}
              />
            ))}
          </div>

          {/* 우측 장식 문양 */}
          <div
            style={{
              position: 'absolute',
              right: '60px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '30px',
            }}
          >
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  border: '4px solid #D4AF37',
                  opacity: 0.4,
                }}
              />
            ))}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: unknown) {
    console.error('OG 이미지 생성 오류:', e);
    return new Response('OG 이미지 생성 실패', { status: 500 });
  }
}
