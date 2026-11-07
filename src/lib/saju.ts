// 사주팔자 계산 유틸리티

// 천간 (10개)
export const 천간 = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;
export const 천간한자 = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;

// 지지 (12개) - 띠
export const 지지 = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const;
export const 지지한자 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
export const 띠동물 = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'] as const;
export const 띠이모지 = ['🐀', '🐂', '🐅', '🐇', '🐉', '🐍', '🐎', '🐑', '🐵', '🐔', '🐕', '🐷'] as const;

// 오행
export const 오행 = ['목', '화', '토', '금', '수'] as const;
export const 오행한자 = ['木', '火', '土', '金', '水'] as const;
export const 오행색상 = ['#22c55e', '#ef4444', '#eab308', '#f5f5f5', '#3b82f6'] as const;

// 천간 → 오행 매핑
export const 천간오행: Record<string, string> = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수',
};

// 지지 → 오행 매핑
export const 지지오행: Record<string, string> = {
  '인': '목', '묘': '목',
  '사': '화', '오': '화',
  '진': '토', '술': '토', '축': '토', '미': '토',
  '신': '금', '유': '금',
  '해': '수', '자': '수',
};

// 음양
export const 천간음양: Record<string, '양' | '음'> = {
  '갑': '양', '을': '음',
  '병': '양', '정': '음',
  '무': '양', '기': '음',
  '경': '양', '신': '음',
  '임': '양', '계': '음',
};

// ---- 년주·월주·일주 ----
// manseryeok(한국천문연구원 역법 데이터 기반) 만세력으로 계산한다. 년주·월주는 절입 시각(분 단위)까지 반영한다.
// 시간을 모르면 hour 기본값 12(정오)로 본다. 절입 당일은 시각에 따라 달라질 수 있다.
// 계산 기준은 src/lib/saju/engine.ts와 같다(자정 날짜 경계, 경도 보정 0, 서머타임 반영).
import { calculateFourPillars } from "manseryeok";

function 기둥계산(year: number, month: number, day: number, hour: number) {
  return calculateFourPillars({
    year, month, day, hour, minute: 0,
    dayBoundary: "midnight",
    trueSolarTime: { longitude: 135, applyEquationOfTime: false, applyHistoricalDst: true },
  });
}

export function 년주계산(year: number, month: number, day: number, hour = 12): { 천간: string; 지지: string; 띠: string; 띠이모지: string } {
  const p = 기둥계산(year, month, day, hour).year;
  const 지지인덱스 = 지지.indexOf(p.earthlyBranch);
  return { 천간: p.heavenlyStem, 지지: p.earthlyBranch, 띠: 띠동물[지지인덱스], 띠이모지: 띠이모지[지지인덱스] };
}

export function 띠찾기(year: number, month: number, day: number): string {
  return 년주계산(year, month, day).띠;
}

export function 월주계산(year: number, month: number, day: number, hour = 12): { 천간: string; 지지: string } {
  const p = 기둥계산(year, month, day, hour).month;
  return { 천간: p.heavenlyStem, 지지: p.earthlyBranch };
}

export function 일주계산(year: number, month: number, day: number): { 천간: string; 지지: string } {
  const p = 기둥계산(year, month, day, 12).day;
  return { 천간: p.heavenlyStem, 지지: p.earthlyBranch };
}

// 오행 분포 계산
export function 오행분포계산(사주: { 년: { 천간: string; 지지: string }; 월: { 천간: string; 지지: string }; 일: { 천간: string; 지지: string } }) {
  const 분포: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };

  // 천간 오행
  분포[천간오행[사주.년.천간]]++;
  분포[천간오행[사주.월.천간]]++;
  분포[천간오행[사주.일.천간]]++;

  // 지지 오행
  분포[지지오행[사주.년.지지]]++;
  분포[지지오행[사주.월.지지]]++;
  분포[지지오행[사주.일.지지]]++;

  return 분포;
}

// 전체 사주 분석
export function 사주분석(year: number, month: number, day: number) {
  const 년 = 년주계산(year, month, day);
  const 월 = 월주계산(year, month, day);
  const 일 = 일주계산(year, month, day);

  const 사주 = { 년: { 천간: 년.천간, 지지: 년.지지 }, 월, 일 };
  const 오행분포 = 오행분포계산(사주);

  // 가장 강한/약한 오행
  const 오행entries = Object.entries(오행분포);
  const 강한오행 = 오행entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
  const 약한오행 = 오행entries.reduce((a, b) => a[1] < b[1] ? a : b)[0];

  // 일간 (본인의 오행)
  const 일간오행 = 천간오행[일.천간];

  return {
    생년: year,
    생월: month,
    생일: day,
    사주: {
      년주: `${년.천간}${년.지지}`,
      월주: `${월.천간}${월.지지}`,
      일주: `${일.천간}${일.지지}`,
    },
    띠: 년.띠,
    띠이모지: 년.띠이모지,
    일간: 일.천간,
    일간오행,
    오행분포,
    강한오행,
    약한오행,
    음양: 천간음양[일.천간],
  };
}
