// 신년운세 기준 연도. 해가 바뀌면 이 값과 fortuneDB의 띠별올해·올해조언 데이터를 함께 바꾼다.
export const FORTUNE_YEAR = {
  year: 2027,
  간지: "정미",
  한자: "丁未",
  띠: "양",
  띠이모지: "🐑",
  오행: "화·토",
  특징: "붉은 양의 해, 따뜻한 정과 결실의 해",
} as const;

export const 올해이름 = `${FORTUNE_YEAR.year}년 ${FORTUNE_YEAR.간지}년`;
