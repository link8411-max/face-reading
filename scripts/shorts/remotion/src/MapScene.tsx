// 지도 장면: Natural Earth로 그린 실제 땅·강(public/maps/china.json) 위에 카메라 이동, 지명 점, 길, 세력 색을 얹는다.
// 지도 모양은 AI에게 맡기지 않는다(DIRECTION.md 지도 규칙). 컷마다 MAP_SHOTS의 한 항목을 6~8초 클립으로 렌더해 ShortV2의 videos에 넣는다.
//   npx remotion render MapScene --props='{"shot":"xinye"}' out.mp4
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';

type LonLat = [number, number];
type MapData = {bbox: {w: number; e: number; s: number; n: number}; lat0: number; k: number; width: number; height: number; land: string[]; lakes: string[]; rivers: {name: string; rank: number; d: string}[]};

// 지명 좌표(현재 지명 기준). 신야 = 허난성 신예현, 융중 = 후베이성 샹양시 구룽중
export const PLACES: Record<string, {ll: LonLat; name: string}> = {
	zhuo: {ll: [115.97, 39.49], name: '탁군'},
	xuzhou: {ll: [117.18, 34.26], name: '서주'},
	xudu: {ll: [113.85, 34.03], name: '허도'},
	ye: {ll: [114.37, 36.3], name: '기주'},
	xinye: {ll: [112.36, 32.52], name: '신야'},
	longzhong: {ll: [112.08, 32.02], name: '융중'},
	chengdu: {ll: [104.07, 30.67], name: '성도'},
	wu: {ll: [120.6, 31.3], name: '오'},
	// ep06 고구려: 환도성 = 지린성 지안, 서안평 = 압록강 하구(단둥 부근), 요동 = 양평(랴오양), 옥저 = 함흥 일대
	luoyang: {ll: [112.45, 34.62], name: '낙양'},
	liaodong: {ll: [123.17, 41.27], name: '요동'},
	xianping: {ll: [124.38, 40.12], name: '서안평'},
	wandu: {ll: [126.18, 41.13], name: '환도성'},
	okjeo: {ll: [127.53, 39.92], name: '옥저'},
	sushen: {ll: [129.9, 42.9], name: '숙신'},
};
// 세력 영역은 대략적인 경계(연출용 근사). 색은 편 공용: 조조 푸른색, 손권 붉은색, 유비 녹색
const REGIONS: Record<string, {color: string; ll: LonLat[]; label: string; at: LonLat; dep?: boolean}> = {
	cao: {color: '#3F78B5', label: '조조', at: [113.5, 37.5], ll: [[86, 52], [134, 52], [134, 42], [122, 37], [121, 32.6], [117, 32.6], [113, 33.2], [110, 33.3], [106, 34.3], [103, 36], [100, 37], [86, 37]]},
	sun: {color: '#C8403A', label: '손권', at: [118.5, 28.5], ll: [[117, 32.6], [121, 32.6], [122, 30], [121, 26], [117, 23], [112, 22], [113, 26], [114.5, 28], [115.5, 30]]},
	jing: {color: '#4E8F4A', label: '형주', at: [112, 29.5], ll: [[110, 33.3], [113, 33.2], [115.5, 31.5], [115.5, 30], [114.5, 28], [113, 26], [111, 25], [109, 27], [109.5, 30], [110, 31.5]]},
	// 240년대 세 나라 + 고구려(대략, 연출용 근사). 고구려는 3세기 압록강 중류·혼강 일대만
	wei240: {color: '#3F78B5', label: '위', at: [113, 37.5], ll: [[95, 42], [124.2, 42.3], [124.6, 40.6], [124.4, 39.9], [125.2, 39.9], [126.6, 39.2], [126.9, 38.1], [125.4, 37.6], [124, 37.9], [121.5, 38.8], [122, 37], [121, 32.6], [117, 32.6], [113, 33.2], [110, 33.3], [106, 34.3], [103, 36], [100, 37], [95, 38]]},
	shu240: {color: '#4E8F4A', label: '촉', at: [104, 29], ll: [[100, 33], [106, 34.3], [110, 33.3], [110, 31.5], [109.5, 30], [109, 27], [105, 23], [100, 24]]},
	wu240: {color: '#C8403A', label: '오', at: [115.5, 27.5], ll: [[110, 33.3], [113, 33.2], [117, 32.6], [121, 32.6], [122, 30], [121, 26], [117, 23], [110, 21], [106, 22], [109, 27], [109.5, 30], [110, 31.5]]},
	// 고구려 3세기 중엽: 국사편찬위원회 우리역사넷 '여러 나라의 성장' 지도의 표기 범위(졸본·국내성~백두산, 압록강 남북 산간)를 따른 대략 영역.
	// 정사 동이전 "方可二千里"; 옥저 "遂臣屬句麗", 동예 "漢末更屬句麗" → 복속지(점선·연한 색)
	goguryeo: {color: '#E8B547', label: '고구려', at: [126.3, 42.2], ll: [[124.3, 41.3], [124.9, 40.4], [126.0, 40.0], [127.2, 40.3], [128.3, 41.0], [128.6, 42.0], [127.9, 43.2], [126.3, 43.5], [124.9, 42.9]]},
	okjeo: {color: '#E8B547', dep: true, label: '옥저', at: [129.0, 41.4], ll: [[127.2, 39.7], [128.3, 40.3], [129.6, 41.6], [130.7, 42.6], [129.9, 43.1], [128.6, 42.0], [128.3, 41.0], [127.2, 40.3]]},
	dongye: {color: '#E8B547', dep: true, label: '동예', at: [128.3, 38.6], ll: [[127.0, 39.4], [127.2, 39.7], [128.0, 39.1], [128.9, 38.4], [129.4, 37.4], [128.3, 37.6], [127.4, 38.4]]},
	// 238년 요동·낙랑의 공손씨(회색): 사마의가 치러 간 곳
	gongsun: {color: '#8a8a8a', label: '공손씨', at: [121.6, 39.5], ll: [[120.5, 42.3], [124.2, 42.3], [124.6, 40.7], [124.4, 39.9], [125.2, 39.9], [126.6, 39.2], [126.9, 38.1], [125.4, 37.6], [124, 37.9], [121.5, 38.8], [120.5, 40]]},
	yi: {color: '#4E8F4A', label: '익주', at: [104.5, 30], ll: [[100, 33], [106, 34.3], [110, 33.3], [110, 31.5], [109.5, 30], [109, 27], [105, 26], [100, 27]]},
};

type Cam = {at: number; center: LonLat; span: number}; // at: 0~1(장면 비율), span: 화면 세로에 보이는 위도 폭
type Route = {from: number; to: number; stops: string[]; dashed?: boolean; color?: string; label?: string};
type Shot = {flags?: {id: string; from: number; color: string; text: string}[]; rivers?: boolean; seconds: number; cams: Cam[]; pins?: {id: string; from: number; color?: string; big?: boolean}[]; routes?: Route[]; regions?: {id: string; from: number}[]; hSpan?: number; scale?: {from: number; a: string; b: string; km: number; vs: string; vsKm: number; text1?: string; text2?: string; top?: number}};

// 삼고초려(long01) 지도 컷
export const MAP_SHOTS: Record<string, Shot> = {
	// "조조에게 쫓겨 남의 땅 신야에 얹혀살죠" — 중국 전체 → 형주 확대 → 신야, 북쪽 허도의 조조
	xinye: {seconds: 7, cams: [{at: 0, center: [111, 31], span: 34}, {at: 0.6, center: [113, 33.2], span: 6}, {at: 1, center: [113, 33.2], span: 5.5}], rivers: true,
		pins: [{id: 'xinye', from: 0.45, color: '#C8403A', big: true}, {id: 'xudu', from: 0.65, color: '#3F78B5'}],
		routes: [{from: 0.66, to: 0.86, stops: ['xinye', 'xudu'], dashed: true, color: '#3F78B5', label: '약 220km'}], flags: [{id: 'xudu', from: 0.62, color: '#3F78B5', text: '황제'}]},
	// "이 사람 밑, 저 사람 밑을 전전하다가" — 탁군 → 서주 → 허도 → 기주 → 신야
	wander: {seconds: 8, hSpan: 1.25, cams: [{at: 0, center: [115.3, 35.6], span: 10.5}, {at: 1, center: [115.3, 35.2], span: 11}],
		pins: [{id: 'zhuo', from: 0.05}, {id: 'xuzhou', from: 0.25}, {id: 'xudu', from: 0.45}, {id: 'ye', from: 0.65}, {id: 'xinye', from: 0.78, color: '#C8403A', big: true}],
		routes: [{from: 0.05, to: 0.85, stops: ['zhuo', 'xuzhou', 'xudu', 'ye', 'xinye'], dashed: true, color: '#4E8F4A'}]},
	// "신야에서 융중까지 60킬로미터 남짓, 서울에서 평택쯤"
	distance: {seconds: 7, cams: [{at: 0, center: [112.2, 32.4], span: 2.2}, {at: 1, center: [112.2, 32.3], span: 2}],
		pins: [{id: 'xinye', from: 0, color: '#C8403A', big: true}, {id: 'longzhong', from: 0.2, color: '#4E8F4A', big: true}],
		routes: [{from: 0.2, to: 0.55, stops: ['xinye', 'longzhong'], color: '#C8403A', label: '약 62km'}],
		scale: {from: 0.6, a: '신야', b: '융중', km: 62, vs: '서울–평택', vsKm: 65}},
	// 세 번의 방문: 같은 길에 왕복선이 하나씩
	visit1: {seconds: 5, cams: [{at: 0, center: [112.2, 32.3], span: 1.6}, {at: 1, center: [112.2, 32.3], span: 1.5}], pins: [{id: 'xinye', from: 0}, {id: 'longzhong', from: 0}],
		routes: [{from: 0.1, to: 0.8, stops: ['xinye', 'longzhong'], color: '#C8403A', label: '첫 번째'}]},
	visit2: {seconds: 5, cams: [{at: 0, center: [112.2, 32.3], span: 1.6}, {at: 1, center: [112.2, 32.3], span: 1.5}], pins: [{id: 'xinye', from: 0}, {id: 'longzhong', from: 0}],
		routes: [{from: 0, to: 0, stops: ['xinye', 'longzhong'], color: '#C8403A', label: '첫 번째'}, {from: 0.1, to: 0.8, stops: ['xinye', 'longzhong'], color: '#E8B547', label: '두 번째'}]},
	visit3: {seconds: 5, cams: [{at: 0, center: [112.2, 32.3], span: 1.6}, {at: 1, center: [112.2, 32.3], span: 1.5}], pins: [{id: 'xinye', from: 0}, {id: 'longzhong', from: 0}],
		routes: [{from: 0, to: 0, stops: ['xinye', 'longzhong'], color: '#C8403A', label: '첫 번째'}, {from: 0, to: 0, stops: ['xinye', 'longzhong'], color: '#E8B547', label: '두 번째'}, {from: 0.1, to: 0.8, stops: ['xinye', 'longzhong'], color: '#FFFFFF', label: '세 번째'}]},
	// 긴 영상: 해설 "북쪽 조조… 동쪽 손권… 형주와 익주"에 맞춰 칠한다(20초)
	splitLong: {seconds: 20, hSpan: 0.7, cams: [{at: 0, center: [111.5, 31], span: 30}, {at: 1, center: [111.5, 31], span: 28}],
		regions: [{id: 'cao', from: 0.0}, {id: 'sun', from: 0.15}, {id: 'jing', from: 0.34}, {id: 'yi', from: 0.4}],
		pins: [{id: 'longzhong', from: 0, color: '#FFFFFF'}]},
	// ep06 훅: 세 나라 색 → 오른쪽 위 고구려가 켜짐 → 그쪽으로 다가감
	g_hook: {seconds: 8, hSpan: 0.6, cams: [{at: 0, center: [114.5, 33], span: 46}, {at: 0.3, center: [114.5, 33], span: 46}, {at: 0.6, center: [126, 41.6], span: 16}, {at: 1, center: [126.9, 41.9], span: 13}],
		regions: [{id: 'wei240', from: 0}, {id: 'shu240', from: 0}, {id: 'wu240', from: 0}, {id: 'goguryeo', from: 0.35}, {id: 'okjeo', from: 0.45}, {id: 'dongye', from: 0.45}]},
	// ep06 b03: 낙양 → 요동(사마의), 환도 → 요동(고구려 원군), 4년 뒤 환도 → 서안평
	g_ally: {seconds: 8, cams: [{at: 0, center: [121.3, 38.6], span: 27}, {at: 0.6, center: [121.3, 38.6], span: 27}, {at: 1, center: [124.4, 41.5], span: 9}],
		regions: [{id: 'gongsun', from: 0}, {id: 'goguryeo', from: 0}],  // 동맹 지도는 요동·환도 글자가 많아 복속지는 훅 지도에만
		pins: [{id: 'luoyang', from: 0, color: '#3F78B5'}, {id: 'liaodong', from: 0.1}, {id: 'wandu', from: 0.3, color: '#E8B547', big: true}, {id: 'xianping', from: 0.65, color: '#C8403A'}],
		routes: [{from: 0.05, to: 0.35, stops: ['luoyang', 'liaodong'], color: '#3F78B5', label: '사마의'}, {from: 0.35, to: 0.55, stops: ['wandu', 'liaodong'], color: '#E8B547', label: '고구려 원군'}, {from: 0.68, to: 0.85, stops: ['wandu', 'xianping'], color: '#C8403A', label: '4년 뒤, 서안평'}]},
	// ep06 b05: 환도성에서 옥저를 지나 천 리 넘게(숙신 남쪽 경계까지)
	g_chase: {seconds: 5, cams: [{at: 0, center: [128.5, 41.7], span: 8.4}, {at: 1, center: [128.7, 41.8], span: 8.8}],
		regions: [{id: 'goguryeo', from: 0}],  // 추격 지도는 '옥저' 점과 겹치지 않게 복속지 표시를 뺀다
		pins: [{id: 'wandu', from: 0, color: '#E8B547', big: true}, {id: 'okjeo', from: 0.35}, {id: 'sushen', from: 0.7}],
		routes: [{from: 0.1, to: 0.7, stops: ['wandu', 'okjeo', 'sushen'], dashed: true, color: '#3F78B5', label: '천 리 넘게'}],
		// 위나라 1리 ≈ 410~430m → 천 리 ≈ 400km. 서울–부산 직선 약 325km
		scale: {from: 0.72, a: '', b: '', km: 400, vs: '', vsKm: 325, text1: '천 리 ≈ 400km', text2: '서울–부산 약 325km', top: 1500}},
	// "북쪽은 조조, 동쪽은 손권, 장군은 형주와 익주" — 천하삼분
	split: {seconds: 8, cams: [{at: 0, center: [111.5, 31], span: 30}, {at: 1, center: [111.5, 31], span: 29}],
		regions: [{id: 'cao', from: 0.05}, {id: 'sun', from: 0.3}, {id: 'jing', from: 0.55}, {id: 'yi', from: 0.7}],
		pins: [{id: 'longzhong', from: 0, color: '#FFFFFF'}]},
};

const FONT = '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
const SERIF = '"Nanum Myeongjo", "AppleMyungjo", serif';

export const MapScene: React.FC<{shot: string}> = ({shot}) => {
	const f = useCurrentFrame();
	const {fps, durationInFrames, width: VW, height: VH} = useVideoConfig();
	const [data, setData] = useState<MapData | null>(null);
	const [handle] = useState(() => delayRender('map'));
	useEffect(() => { fetch(staticFile('maps/china.json')).then((r) => r.json()).then((j) => { setData(j); continueRender(handle); }); }, [handle]);
	if (!data) return null;
	const S = MAP_SHOTS[shot];
	const t = f / durationInFrames;
	const cx = Math.cos((data.lat0 * Math.PI) / 180);
	const P = ([lon, lat]: LonLat) => [(lon - data.bbox.w) * data.k * cx, (data.bbox.n - lat) * data.k] as const;
	const kmU = data.k / 111; // 1km의 지도 단위

	// 카메라 보간(부드럽게)
	const ats = S.cams.map((c) => c.at);
	const ease = {easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
	const lon = interpolate(t, ats.length > 1 ? ats : [0, 1], S.cams.length > 1 ? S.cams.map((c) => c.center[0]) : [S.cams[0].center[0], S.cams[0].center[0]], ease);
	const lat = interpolate(t, ats.length > 1 ? ats : [0, 1], S.cams.length > 1 ? S.cams.map((c) => c.center[1]) : [S.cams[0].center[1], S.cams[0].center[1]], ease);
	const span = interpolate(t, ats.length > 1 ? ats : [0, 1], S.cams.length > 1 ? S.cams.map((c) => c.span) : [S.cams[0].span, S.cams[0].span], ease);
	// 가로 화면은 옆이 넓어 지도 밖(빈 바다·자료 경계)이 보이지 않게 hSpan배로 좁히고, 자막 띠가 얇아 남쪽으로 덜 내린다
	const land = VW > VH, sp = land ? span * (S.hSpan ?? 1) : span;
	const vh = sp * data.k, vw = (vh * VW) / VH;
	const [ccx, ccy] = P([lon, lat - sp * (land ? 0.08 : 0.16)]); // 지명이 자막 위로 오게 카메라를 조금 남쪽으로
	const vb = `${ccx - vw / 2} ${ccy - vh / 2} ${vw} ${vh}`;
	const u = vh / VH; // 화면 1px의 지도 단위(글자·선 굵기를 화면 기준으로 고정)
	const appear = (from: number) => interpolate(t, [from, from + 0.08], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	const routePath = (stops: string[]) => stops.map((s, i) => { const [x, y] = P(PLACES[s].ll); return `${i ? 'L' : 'M'}${x},${y}`; }).join('');
	const routeLen = (stops: string[]) => stops.slice(1).reduce((a, s, i) => { const [x1, y1] = P(PLACES[stops[i]].ll); const [x2, y2] = P(PLACES[s].ll); return a + Math.hypot(x2 - x1, y2 - y1); }, 0);

	return (
		<AbsoluteFill style={{backgroundColor: '#1d2a33'}}>
			<svg viewBox={vb} width={VW} height={VH} style={{position: 'absolute', inset: 0}}>
				<defs>
					<clipPath id="landclip">{data.land.map((d, i) => <path key={i} d={d} />)}</clipPath>
					<filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" /><feColorMatrix type="saturate" values="0" /><feComponentTransfer><feFuncA type="table" tableValues="0 0.08" /></feComponentTransfer><feComposite in2="SourceGraphic" operator="in" /><feBlend in="SourceGraphic" mode="multiply" /></filter>
				</defs>
				<rect x={ccx - vw} y={ccy - vh} width={vw * 2} height={vh * 2} fill="#22333f" />
				<g filter="url(#paper)">
					{data.land.map((d, i) => <path key={i} d={d} fill="#d9c9a3" stroke="#8a7650" strokeWidth={2 * u} />)}
				</g>
				{S.regions?.map((r) => { const R = REGIONS[r.id]; const a = appear(r.from); const d = R.ll.map((p, i) => { const [x, y] = P(p); return `${i ? 'L' : 'M'}${x},${y}`; }).join('') + 'Z';
					const [lx, ly] = P(R.at);
					return <g key={r.id} opacity={a}><path clipPath="url(#landclip)" d={d} fill={R.color} fillOpacity={R.dep ? 0.2 : 0.45} stroke={R.color} strokeWidth={4 * u} strokeDasharray={R.dep ? `${14 * u} ${10 * u}` : undefined} /><text x={lx} y={ly} fontSize={(R.dep ? 44 : 64) * u} fontWeight={900} fill="#fff" stroke="#000" strokeWidth={8 * u} paintOrder="stroke" textAnchor="middle" fontFamily={FONT}>{R.label}{R.dep ? '(복속)' : ''}</text></g>; })}
				{data.lakes.map((d, i) => <path key={i} d={d} fill="#5d7d8c" />)}
				{data.rivers.filter((r) => r.rank <= 6 || /Yangtze|Han|Huang|Yellow/.test(r.name)).map((r, i) => <path key={i} d={r.d} fill="none" stroke="#5d7d8c" strokeWidth={(/Yangtze|Huang|Yellow/.test(r.name) ? 5 : 3) * u} strokeLinecap="round" />)}
				{S.rivers && [['장강', [113.5, 29.4]], ['한수', [110.3, 32.75]]].map(([n, ll]) => { const [x, y] = P(ll as LonLat); return <text key={n as string} x={x} y={y} fontSize={42 * u} fill="#cfe3ec" stroke="#22333f" strokeWidth={6 * u} paintOrder="stroke" fontFamily={SERIF} fontStyle="italic" opacity={interpolate(t, [0, 0.15, 0.45, 0.55], [0, 1, 1, 0])}>{n as string}</text>; })}
				{S.routes?.map((r, i) => { const L = routeLen(r.stops); const p = interpolate(t, [r.from, Math.max(r.to, r.from + 0.001)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
					const [mx, my] = P(PLACES[r.stops[r.stops.length - 1]].ll); const [sx, sy] = P(PLACES[r.stops[0]].ll); const off = i * 7 * u;
					return <g key={i} transform={`translate(${off},${-off})`}>
						<path d={routePath(r.stops)} fill="none" stroke={r.color ?? '#C8403A'} strokeWidth={7 * u} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={r.dashed ? `${L * p} ${L}` : `${L * p} ${L}`} />
						{r.dashed && <path d={routePath(r.stops)} fill="none" stroke="#22333f" strokeWidth={8 * u} strokeDasharray={`${10 * u} ${14 * u}`} opacity={p > 0 ? 0.6 : 0} />}
						{r.label && (S.routes?.length ?? 0) === 1 && p > 0.9 && <text x={(sx + mx) / 2 + 30 * u} y={(sy + my) / 2} fontSize={44 * u} fontWeight={800} fill={r.color ?? '#fff'} stroke="#000" strokeWidth={7 * u} paintOrder="stroke" fontFamily={FONT}>{r.label}</text>}
					</g>; })}
				{S.flags?.map((fl) => { const a = appear(fl.from); const [x, y] = P(PLACES[fl.id].ll);
					return <g key={fl.id} opacity={a} transform={`translate(${x},${y})`}><line x1={0} y1={0} x2={0} y2={-120 * u} stroke="#2a1d10" strokeWidth={6 * u} /><path d={`M0,${-120 * u} L${110 * u},${-95 * u} L0,${-70 * u}Z`} fill={fl.color} stroke="#000" strokeWidth={3 * u} /><text x={14 * u} y={-86 * u} fontSize={34 * u} fontWeight={900} fill="#fff" fontFamily={FONT}>{fl.text}</text></g>; })}
				{S.pins?.map((p) => { const a = appear(p.from); const [x, y] = P(PLACES[p.id].ll); const s = interpolate(a, [0, 1], [0.3, 1]);
					return <g key={p.id} opacity={a} transform={`translate(${x},${y}) scale(${s})`}>
						<circle r={(p.big ? 18 : 12) * u} fill={p.color ?? '#fff'} stroke="#000" strokeWidth={4 * u} />
						<text x={26 * u} y={14 * u} fontSize={(p.big ? 64 : 54) * u} fontWeight={900} fill="#fff" stroke="#000" strokeWidth={8 * u} paintOrder="stroke" fontFamily={SERIF}>{PLACES[p.id].name}</text>
					</g>; })}
			</svg>
			{(S.routes?.length ?? 0) > 1 && S.routes!.some((r) => r.label) && (
				<div style={{position: 'absolute', left: 80, top: VW > VH ? 110 : 420, fontFamily: FONT, fontSize: 52, fontWeight: 900, textShadow: '0 0 8px #000'}}>
					{S.routes!.map((r, i) => { const p = interpolate(t, [r.from, Math.max(r.to, r.from + 0.001)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
						return <div key={i} style={{color: r.color ?? '#fff', opacity: p > 0 ? 1 : 0.15, marginBottom: 10}}>━ {r.label}</div>; })}
				</div>
			)}
			{S.scale && (() => { const a = appear(S.scale.from); const pxPerKm = 1 / u * kmU; const w1 = S.scale.km * pxPerKm, w2 = S.scale.vsKm * pxPerKm;
				return <div style={{position: 'absolute', left: 70, top: VW > VH ? 110 : S.scale.top ?? 400, opacity: a, fontFamily: FONT, color: '#fff', fontSize: 54, fontWeight: 900, WebkitTextStroke: '8px #000', paintOrder: 'stroke fill', background: 'rgba(20,28,34,0.55)', padding: '20px 28px', borderRadius: 16}}>
					<div>{S.scale.text1 ?? `${S.scale.a}–${S.scale.b} ${S.scale.km}km`}</div><div style={{width: w1, height: 14, background: '#C8403A', margin: '8px 0 26px', border: '2px solid #000'}} />
					<div>{S.scale.text2 ?? `${S.scale.vs} ${S.scale.vsKm}km`}</div><div style={{width: w2, height: 14, background: '#E8B547', margin: '8px 0', border: '2px solid #000'}} />
				</div>; })()}
			<AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.35) 100%)', pointerEvents: 'none'}} />
		</AbsoluteFill>
	);
};

export const mapShotFrames = (shot: string, fps: number) => Math.round((MAP_SHOTS[shot]?.seconds ?? 6) * fps);
