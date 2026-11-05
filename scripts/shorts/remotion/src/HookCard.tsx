// 쇼츠 끝 카드(세로 1080x1920): 다음 내용을 한 줄 미리 보여 주고 긴 영상으로 넘기는 정지 화면.
import React from 'react';
import {AbsoluteFill} from 'remotion';

const FONT = '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
export const HookCard: React.FC<{lines: string[]; cta: string}> = ({lines, cta}) => (
	<AbsoluteFill style={{backgroundColor: '#23263A', fontFamily: FONT, justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 70px'}}>
		{lines.map((l, i) => <div key={l} style={{color: i === lines.length - 1 ? '#E8B547' : 'white', fontSize: 76, fontWeight: 900, lineHeight: 1.3, marginBottom: 10}}>{l}</div>)}
		<div style={{marginTop: 90, color: 'white', fontSize: 54, fontWeight: 800, border: '4px solid #E8B547', borderRadius: 60, padding: '18px 44px'}}>{cta}</div>
	</AbsoluteFill>
);
