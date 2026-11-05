// 긴 영상 썸네일(1280x720): 그림 한 장 + 큰 글자 두 줄. npx remotion still Thumb --props='{"img":"long01-samgo-h/thumb_A.png","l1":"…","l2":"…"}' out.png
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

const FONT = '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
export const Thumb: React.FC<{img: string; l1: string; l2: string}> = ({img, l1, l2}) => (
	<AbsoluteFill style={{backgroundColor: 'black'}}>
		{/* 오른쪽 아래 ✦ 표시가 나가도록 왼쪽 위 기준으로 키운다 */}
		<Img src={staticFile(img)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.25)', transformOrigin: '0 0'}} />
		<AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)'}} />
		<div style={{position: 'absolute', right: 50, top: 150, textAlign: 'right', fontFamily: FONT, fontWeight: 900, lineHeight: 1.15}}>
			<div style={{fontSize: 78, color: 'white', WebkitTextStroke: '12px black', paintOrder: 'stroke fill'}}>{l1}</div>
			<div style={{fontSize: 120, color: '#E8B547', WebkitTextStroke: '14px black', paintOrder: 'stroke fill'}}>{l2}</div>
		</div>
	</AbsoluteFill>
);
