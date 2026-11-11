import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { parseShared, type ShareKind } from '@/lib/shareLinks';
import { mbtiShared, parseFaceMatch, parseInvite, parseTeam } from '@/lib/shareLinks';
import { buildTeam } from '@/lib/samguk/team';
import { REL_NAME } from '@/lib/faceMatch/compat';
import { ogQueryOk, OG_CACHE_CONTROL } from '@/lib/ogQuery';
import { parseMbtiDailyKey } from '@/lib/shareLinks';
import { duelShared } from '@/lib/duel/share';
import { decodeRunKey } from '@/lib/duel/shareKey';
import { cupName } from '@/lib/cup/share';
import { parseCupShare } from '@/lib/cup/shareLanding';
import { BOARDS } from '@/lib/cup/boards';
import { mbtiProfiles } from '@/content/mbtiTypes';
import { GRADE_NAME } from '@/lib/exam/score';
import { WISH_TEXT } from '@/content/bujeok';
import { FOIL, PAL } from '@/lib/bujeok/palette';
import type { BujeokStyle, Finish, Wish } from '@/lib/bujeok/keys';

export const runtime = 'edge';

const KINDS: ShareKind[] = ['animal', 'samguk', 'face', 'saju'];

// 결과 공유 미리보기 이미지 (1200×630, 카카오 권장 비율). 값은 허용 목록·점수 범위로 검증한 것만 그린다.
export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams;
  if (!ogQueryOk(q)) return new Response('bad request', { status: 400 });
  const kind = q.get('kind') ?? '';
  if (kind === 'bujeok') {
    // ogQueryOk가 화풍·소원·기운·마감을 허용 목록으로 확인했다. 이름은 받지 않는다.
    return bujeokImage(q.get('style') as BujeokStyle, q.get('wish') as Wish, q.get('finish') as Finish);
  }
  let big = '', score = '', phrase = '', label = '';
  let image: ArrayBuffer | undefined;
  let portraitMissing = false; // 초상화를 못 받았으면 잠깐만 캐시해 다음 요청에 다시 그린다
  // 초상화를 먼저 받아 둔다. 실패하면 초상화 없이 그린다(그리는 도중 실패하면 깨진 이미지가 오래 캐시될 수 있음)
  const loadPortrait = async (src: string) => {
    try {
      const res = await fetch(new URL(encodeURI(src), request.url), { signal: AbortSignal.timeout(1500) });
      if (res.ok) image = await res.arrayBuffer();
    } catch {
      image = undefined;
    }
    portraitMissing = !image;
  };
  if (kind === 'mbti') {
    const m = mbtiShared(q.get('a') ?? '', q.get('b') ?? '');
    if (!m) return new Response('bad request', { status: 400 });
    big = `${m.a} × ${m.b}`; score = `궁합 ${m.score}점`; phrase = m.phrase; label = 'MBTI 궁합';
  } else if (kind === 'face-match') {
    const m = parseFaceMatch(`${q.get('a') ?? ''}-${q.get('b') ?? ''}`, q.get('rel') ?? '');
    if (!m) return new Response('bad request', { status: 400 });
    big = `${m.aName} × ${m.bName}`; score = m.result.headline; phrase = m.phrase; label = `얼굴 궁합 · ${REL_NAME[m.rel]}`;
  } else if (kind === 'team') {
    const p = parseTeam(q.get('ids') ?? '');
    if (!p) return new Response('bad request', { status: 400 });
    const team = buildTeam(p.members.map((character) => ({ character })));
    big = `우리 팀은 ${team.spirit}`; score = team.members.map((m) => m.character.name).join(' · '); phrase = '너희 팀은 삼국지 속 누구야?'; label = '우리 팀 삼국지';
  } else if (kind === 'mbti-daily') {
    // 날짜를 넣지 않아 오래 캐시해도 맞는 내용만 그린다
    const t = parseMbtiDailyKey(q.get('type') ?? '');
    if (!t) return new Response('bad request', { status: 400 });
    big = `${t} 오늘의 운세`; score = mbtiProfiles[t].nickname; phrase = '너는 무슨 유형이야?'; label = '오늘의 MBTI 운세';
  } else if (kind === 'invite') {
    const inv = parseInvite(q.get('key') ?? '', q.get('rel') ?? '');
    if (!inv) return new Response('bad request', { status: 400 });
    big = `${REL_NAME[inv.rel]} 궁합 신청`; score = `${inv.who === '친구' ? '친구는' : '내 사람은'} ${inv.name}`; phrase = '내 사진을 올리면 바로 궁합이 나와요'; label = '얼굴 궁합';
  } else if ((KINDS as string[]).includes(kind)) {
    const r = parseShared(kind as ShareKind, q.get('key') ?? '', q.get('s') ?? undefined);
    if (!r) return new Response('bad request', { status: 400 });
    big = r.name; score = r.score !== null ? `닮음 ${r.score}%` : ''; phrase = r.phrase;
    label = kind === 'animal' ? '동물상 테스트' : kind === 'samguk' ? '나는 삼국지 속 누구?' : kind === 'saju' ? '내 사주 풀이' : 'AI 관상 테스트';
    if (r.image) await loadPortrait(r.image);
  } else if (kind === 'duel') {
    const key = q.get('key') ?? '';
    const d = duelShared(key);
    const k = decodeRunKey(key);
    if (!d || !k) return new Response('bad request', { status: 400 });
    big = d.starterName; score = k.cleared ? '여포를 꺾다' : `${k.wave}번째 싸움까지`; phrase = d.headline; label = '삼국지 일기토';
    await loadPortrait(d.image);
  } else if (kind === 'cup') {
    const c = parseCupShare(q.get('board') ?? '', q.get('key') ?? '');
    if (!c) return new Response('bad request', { status: 400 });
    big = c.name; score = cupName(BOARDS[c.board].title); phrase = c.phrase; label = '삼국지 장수 월드컵';
    await loadPortrait(c.image);
  } else if (kind === 'exam') {
    // ogQueryOk가 grade 1~9, correct 0~5 한 자리만 통과시킨다
    const grade = Number(q.get('grade'));
    big = `${grade}등급`; score = `5문제 중 ${q.get('correct')}개`; phrase = GRADE_NAME[grade]; label = '밈 능력고사';
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
    { width: 1200, height: 630, headers: { 'Cache-Control': portraitMissing ? 'public, max-age=60, s-maxage=300' : OG_CACHE_CONTROL } },
  );
}

// 부적 미리보기 1200×630. 마감에 맞는 바탕(종이 노랑 / 먹색), 붉은 바탕 없음, 이름 없음.
// 이 경로는 글꼴을 따로 싣지 않는다. 한자 글귀(전통)도 대체 글꼴로 그려지는 것을 로컬에서 눈으로 확인했다(2026-11-11, 두부 글자 없음).
function bujeokImage(style: BujeokStyle, wish: Wish, finish: Finish) {
  const t = WISH_TEXT[wish];
  const foil = finish !== 'paper';
  const bg = foil ? FOIL.lacquer : style === 'trad' ? PAL.paper : PAL.cutePaper;
  const ink = foil ? FOIL.gold : style === 'trad' ? '#3A2A10' : PAL.cuteInk;
  const sub = foil ? '#CDBE9E' : style === 'trad' ? '#5C4720' : PAL.cuteSub;
  const edge = foil ? FOIL.goldDeep : style === 'trad' ? PAL.paperEdge : PAL.cuteLine;
  const phrase = style === 'cute' ? t.cutePhrase : t.hanja;
  const holo = finish === 'holo' ? 'linear-gradient(90deg,#ff5f6d,#ffc371,#f9f871,#7bffb1,#6ad7ff,#b28dff)' : null;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', backgroundColor: bg, padding: '40px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: `6px solid ${edge}`, borderRadius: '36px', padding: '0 80px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', fontSize: '30px', color: sub, fontWeight: 700 }}>운명을 읽다 · 나만의 부적</div>
            <div style={{ display: 'flex', fontSize: '120px', fontWeight: 700, color: ink, marginTop: '16px', lineHeight: 1.1 }}>{t.label} 부적</div>
            <div style={{ display: 'flex', fontSize: '40px', color: ink, marginTop: '24px', wordBreak: 'keep-all', maxWidth: '640px' }}>{phrase}</div>
            <div style={{ display: 'flex', fontSize: '28px', color: sub, marginTop: '40px' }}>받아서 손으로 돌려 보세요 · unse-ai.com</div>
          </div>
          <div style={{ display: 'flex', width: '230px', height: '430px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `6px solid ${edge}`, borderRadius: '24px', backgroundColor: foil ? '#241E17' : style === 'trad' ? '#F0D27A' : '#FFFFFF' }}>
            {holo ? <div style={{ display: 'flex', width: '170px', height: '10px', borderRadius: '5px', backgroundImage: holo, marginBottom: '28px' }} /> : null}
            <div style={{ display: 'flex', fontSize: '84px', fontWeight: 700, color: ink }}>{t.label}</div>
            <div style={{ display: 'flex', width: '120px', height: '4px', backgroundColor: edge, margin: '22px 0' }} />
            <div style={{ display: 'flex', fontSize: '40px', color: sub }}>부적</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { 'Cache-Control': OG_CACHE_CONTROL } },
  );
}
