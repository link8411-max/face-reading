import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { parseShared, type ShareKind } from '@/lib/shareLinks';
import { mbtiShared, parseFaceMatch, parseInvite } from '@/lib/shareLinks';
import { REL_NAME } from '@/lib/faceMatch/compat';

export const runtime = 'edge';

const KINDS: ShareKind[] = ['animal', 'samguk', 'face'];

// 결과 공유 미리보기 이미지 (1200×630, 카카오 권장 비율). 값은 허용 목록·점수 범위로 검증한 것만 그린다.
export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams;
  const kind = q.get('kind') ?? '';
  let big = '', score = '', phrase = '', label = '';
  let image: ArrayBuffer | undefined;
  if (kind === 'mbti') {
    const m = mbtiShared(q.get('a') ?? '', q.get('b') ?? '');
    if (!m) return new Response('bad request', { status: 400 });
    big = `${m.a} × ${m.b}`; score = `궁합 ${m.score}점`; phrase = m.phrase; label = 'MBTI 궁합';
  } else if (kind === 'face-match') {
    const m = parseFaceMatch(`${q.get('a') ?? ''}-${q.get('b') ?? ''}`, q.get('rel') ?? '');
    if (!m) return new Response('bad request', { status: 400 });
    big = `${m.aName} × ${m.bName}`; score = m.result.headline; phrase = m.phrase; label = `얼굴 궁합 · ${REL_NAME[m.rel]}`;
  } else if (kind === 'invite') {
    const inv = parseInvite(q.get('key') ?? '', q.get('rel') ?? '');
    if (!inv) return new Response('bad request', { status: 400 });
    big = `${REL_NAME[inv.rel]} 궁합 신청`; score = `친구는 ${inv.name}`; phrase = '내 사진을 올리면 바로 궁합이 나와요'; label = '얼굴 궁합';
  } else if ((KINDS as string[]).includes(kind)) {
    const r = parseShared(kind as ShareKind, q.get('key') ?? '', q.get('s') ?? undefined);
    if (!r) return new Response('bad request', { status: 400 });
    big = r.name; score = r.score !== null ? `닮음 ${r.score}%` : ''; phrase = r.phrase;
    label = kind === 'animal' ? '동물상 테스트' : kind === 'samguk' ? '나는 삼국지 속 누구?' : 'AI 관상 테스트';
    if (r.image) {
      // 초상화를 먼저 받아 둔다. 실패하면 초상화 없이 그린다(그리는 도중 실패하면 깨진 이미지가 오래 캐시될 수 있음)
      try {
        const res = await fetch(new URL(encodeURI(r.image), request.url));
        if (res.ok) image = await res.arrayBuffer();
      } catch {
        image = undefined;
      }
    }
  } else {
    return new Response('bad request', { status: 400 });
  }

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', backgroundColor: '#FBF6F1', padding: '48px' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', backgroundColor: '#ECE5D9', borderRadius: '48px', padding: '56px 72px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', fontSize: '30px', color: '#9A4F35', fontWeight: 700 }}>운명을 읽다 · {label}</div>
            <div style={{ display: 'flex', fontSize: '96px', fontWeight: 700, color: '#2E2A27', marginTop: '20px', lineHeight: 1.1 }}>{big}</div>
            {score ? <div style={{ display: 'flex', fontSize: '52px', fontWeight: 700, color: '#9A4F35', marginTop: '16px' }}>{score}</div> : null}
            <div style={{ display: 'flex', fontSize: '34px', color: '#6B6259', marginTop: '28px', maxWidth: image ? '640px' : '900px', wordBreak: 'keep-all' }}>{phrase}</div>
          </div>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            // @vercel/og는 img src로 ArrayBuffer를 받는다 (엣지 런타임에서 Buffer 없이)
            <img src={image as unknown as string} width={300} height={360} style={{ objectFit: 'cover', borderRadius: '24px', border: '8px solid #23263A' }} alt="" />
          ) : (
            <div style={{ display: 'flex', position: 'absolute', right: '40px', top: '40px', width: '220px', height: '220px' }}>
              <div style={{ position: 'absolute', right: '40px', top: '30px', width: '180px', height: '180px', borderRadius: '50%', backgroundColor: '#FBF6F1', display: 'flex' }} />
              <div style={{ position: 'absolute', right: '0px', top: '0px', width: '170px', height: '170px', borderRadius: '50%', backgroundColor: '#ECE5D9', display: 'flex' }} />
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
