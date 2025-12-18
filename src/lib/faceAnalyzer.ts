import { FaceFeatures } from './faceDetection';
import { faceReadingDB, FaceFeatureReading } from './faceReadingDB';

// 분석 결과 타입 (기존 API 응답과 호환)
export interface AnalysisResult {
  type: string;
  title: string;
  faceFeatures: {
    이마: string;
    눈: string;
    코: string;
    입: string;
    전체윤곽: string;
  };
  lifeFortune: {
    초년운: {
      period: string;
      rating: number;
      description: string;
    };
    중년운: {
      period: string;
      rating: number;
      description: string;
    };
    말년운: {
      period: string;
      rating: number;
      description: string;
    };
  };
  categories: {
    재물운: number;
    애정운: number;
    직장운: number;
    건강운: number;
    대인운: number;
  };
  personality: string[];
  cautions: string[];  // 주의사항 추가
  career: string;
  advice: string;
  luckyNumber: number;
  luckyColor: string;
  summary: string;
}

// FaceFeatures를 한글 키워드로 변환
function mapFeaturesToKeywords(features: FaceFeatures): {
  눈: string;
  코: string;
  입: string;
  얼굴형: string;
  이마: string;
  턱: string;
} {
  // 눈 크기 + 간격 조합
  let 눈Key: string;
  if (features.eyes.size === 'large') {
    눈Key = '큰눈';
  } else if (features.eyes.size === 'small') {
    눈Key = '작은눈';
  } else if (features.eyes.spacing === 'wide') {
    눈Key = '눈간격넓음';
  } else if (features.eyes.spacing === 'close') {
    눈Key = '눈간격좁음';
  } else {
    눈Key = '보통눈';
  }

  // 코 크기/길이
  let 코Key: string;
  if (features.nose.size === 'large') {
    코Key = '넓은코';
  } else if (features.nose.size === 'small') {
    코Key = '좁은코';
  } else if (features.nose.bridge === 'high') {
    코Key = '긴코';
  } else if (features.nose.bridge === 'low') {
    코Key = '짧은코';
  } else {
    코Key = '넓은코'; // 기본값
  }

  // 입 크기/모양
  let 입Key: string;
  if (features.mouth.size === 'large') {
    입Key = '큰입';
  } else if (features.mouth.size === 'small') {
    입Key = '작은입';
  } else if (features.mouth.shape === 'full') {
    입Key = '두꺼운입술';
  } else if (features.mouth.shape === 'thin') {
    입Key = '얇은입술';
  } else {
    입Key = '큰입'; // 기본값
  }

  // 얼굴형
  let 얼굴형Key: string;
  switch (features.faceShape.type) {
    case 'oval':
      얼굴형Key = '계란형';
      break;
    case 'round':
      얼굴형Key = '둥근형';
      break;
    case 'square':
      얼굴형Key = '각진형';
      break;
    case 'long':
    case 'heart':
    case 'diamond':
      얼굴형Key = '긴형';
      break;
    default:
      얼굴형Key = '계란형';
  }

  // 이마 높이
  let 이마Key: string;
  if (features.forehead.height === 'high') {
    이마Key = '높은이마';
  } else {
    이마Key = '낮은이마';
  }

  // 턱 모양
  let 턱Key: string;
  switch (features.chin.shape) {
    case 'pointed':
      턱Key = '뾰족한턱';
      break;
    case 'round':
      턱Key = '둥근턱';
      break;
    case 'square':
      턱Key = '각진턱';
      break;
    default:
      턱Key = '둥근턱';
  }

  return { 눈: 눈Key, 코: 코Key, 입: 입Key, 얼굴형: 얼굴형Key, 이마: 이마Key, 턱: 턱Key };
}

// DB에서 해석 가져오기 (variations 랜덤 선택 포함)
function getInterpretation(category: keyof typeof faceReadingDB, key: string): FaceFeatureReading | null {
  const categoryData = faceReadingDB[category];
  if (categoryData && key in categoryData) {
    const original = (categoryData as Record<string, FaceFeatureReading>)[key];

    // variations가 있으면 랜덤하게 선택
    const result = { ...original };

    if (original.meaningVariations && original.meaningVariations.length > 0) {
      // 50% 확률로 variation 사용
      if (Math.random() > 0.5) {
        result.meaning = original.meaningVariations[Math.floor(Math.random() * original.meaningVariations.length)];
      }
    }

    if (original.fortuneVariations && original.fortuneVariations.length > 0) {
      if (Math.random() > 0.5) {
        result.fortune = original.fortuneVariations[Math.floor(Math.random() * original.fortuneVariations.length)];
      }
    }

    return result;
  }
  return null;
}

// 관상 유형 결정 함수
function determineFaceReadingType(
  categories: AnalysisResult['categories'],
  personality: string[]
): { type: string; title: string } {
  const { 재물운, 애정운, 직장운, 건강운, 대인운 } = categories;

  // 재물운이 가장 높은 경우
  if (재물운 >= 4.5 && 재물운 >= Math.max(애정운, 직장운, 건강운, 대인운)) {
    return { type: '재물상', title: '타고난 재물상' };
  }

  // 애정운과 대인운이 높은 경우
  if (애정운 >= 4.5 && 대인운 >= 4.5) {
    return { type: '복덕상', title: '복이 넘치는 복덕상' };
  }

  // 직장운이 가장 높은 경우
  if (직장운 >= 4.5 && 직장운 >= Math.max(재물운, 애정운, 건강운, 대인운)) {
    const hasLeadership = personality.some(p => p.includes('리더십') || p.includes('추진력'));
    if (hasLeadership) {
      return { type: '리더상', title: '타고난 리더상' };
    }
    return { type: '귀인상', title: '출세하는 귀인상' };
  }

  // 지적, 지혜 관련 성격이 많은 경우
  const hasIntellectual = personality.some(p =>
    p.includes('지적') || p.includes('지혜') || p.includes('분석') || p.includes('학구')
  );
  if (hasIntellectual && 직장운 >= 4) {
    return { type: '학자상', title: '지혜로운 학자상' };
  }

  // 예술적, 감성적 특징이 많은 경우
  const hasArtistic = personality.some(p =>
    p.includes('예술') || p.includes('감성') || p.includes('창의') || p.includes('섬세')
  );
  if (hasArtistic) {
    return { type: '예술가상', title: '감성적인 예술가상' };
  }

  // 균형잡힌 경우
  const avgScore = (재물운 + 애정운 + 직장운 + 건강운 + 대인운) / 5;
  if (avgScore >= 4) {
    return { type: '귀인상', title: '균형잡힌 귀인상' };
  }

  // 기본값
  return { type: '복덕상', title: '성장하는 복덕상' };
}

// 직업 추천 함수
function recommendCareer(
  categories: AnalysisResult['categories'],
  personality: string[]
): string {
  const careers: string[] = [];

  if (categories.재물운 >= 4) {
    careers.push('금융업', '투자가', '사업가');
  }
  if (categories.직장운 >= 4) {
    const hasLeadership = personality.some(p => p.includes('리더십') || p.includes('추진력'));
    if (hasLeadership) {
      careers.push('경영자', '관리직');
    } else {
      careers.push('전문직', '공무원');
    }
  }
  if (categories.대인운 >= 4) {
    careers.push('영업', '서비스업', '마케팅');
  }
  if (personality.some(p => p.includes('지적') || p.includes('분석'))) {
    careers.push('연구원', '교수', '개발자');
  }
  if (personality.some(p => p.includes('예술') || p.includes('창의'))) {
    careers.push('예술가', '디자이너', '크리에이터');
  }

  // 중복 제거 및 최대 3개 선택
  const uniqueCareers = [...new Set(careers)];
  return uniqueCareers.slice(0, 3).join(', ') || '전문직, 사업가, 자영업';
}

// 행운의 색상 결정
function getLuckyColor(faceType: string): string {
  const colorMap: Record<string, string> = {
    '재물상': '금색',
    '복덕상': '주황색',
    '귀인상': '보라색',
    '리더상': '빨간색',
    '학자상': '파란색',
    '예술가상': '초록색'
  };
  return colorMap[faceType] || '흰색';
}

// 메인 분석 함수
export function analyzeFace(features: FaceFeatures): AnalysisResult {
  // 1. 특징을 한글 키워드로 변환
  const keywords = mapFeaturesToKeywords(features);

  // 2. 각 특징별 해석 조회
  const interpretations: FaceFeatureReading[] = [];

  const 눈해석 = getInterpretation('눈', keywords.눈);
  const 코해석 = getInterpretation('코', keywords.코);
  const 입해석 = getInterpretation('입', keywords.입);
  const 얼굴형해석 = getInterpretation('얼굴형', keywords.얼굴형);
  const 이마해석 = getInterpretation('이마', keywords.이마);
  const 턱해석 = getInterpretation('턱', keywords.턱);

  if (눈해석) interpretations.push(눈해석);
  if (코해석) interpretations.push(코해석);
  if (입해석) interpretations.push(입해석);
  if (얼굴형해석) interpretations.push(얼굴형해석);
  if (이마해석) interpretations.push(이마해석);
  if (턱해석) interpretations.push(턱해석);

  // 3. 운세 점수 계산 (평균)
  const categories = {
    재물운: 0,
    애정운: 0,
    직장운: 0,
    건강운: 0,
    대인운: 0
  };

  interpretations.forEach(interp => {
    categories.재물운 += interp.scores.재물운;
    categories.애정운 += interp.scores.애정운;
    categories.직장운 += interp.scores.직장운;
    categories.건강운 += interp.scores.건강운;
    categories.대인운 += interp.scores.대인운;
  });

  const count = interpretations.length || 1;
  categories.재물운 = Math.round((categories.재물운 / count) * 10) / 10;
  categories.애정운 = Math.round((categories.애정운 / count) * 10) / 10;
  categories.직장운 = Math.round((categories.직장운 / count) * 10) / 10;
  categories.건강운 = Math.round((categories.건강운 / count) * 10) / 10;
  categories.대인운 = Math.round((categories.대인운 / count) * 10) / 10;

  // 4. 성격 특징 수집 (중복 제거)
  const personalitySet = new Set<string>();
  interpretations.forEach(interp => {
    interp.personality.slice(0, 2).forEach(trait => personalitySet.add(trait));
  });
  const personality = Array.from(personalitySet).slice(0, 6);

  // 4.5 주의사항 수집 (각 특징에서 1-2개씩 선택)
  const cautionsSet = new Set<string>();
  interpretations.forEach(interp => {
    if (interp.cautions && interp.cautions.length > 0) {
      // 각 특징에서 랜덤하게 1-2개 선택
      const shuffled = [...interp.cautions].sort(() => Math.random() - 0.5);
      shuffled.slice(0, 2).forEach(caution => cautionsSet.add(caution));
    }
  });
  // 최대 6개의 주의사항 선택
  const cautions = Array.from(cautionsSet).slice(0, 6);

  // 5. 생애 운세 계산
  // 초년운: 이마 중심
  const earlyLifeScore = 이마해석 ?
    (이마해석.scores.재물운 + 이마해석.scores.직장운 + 이마해석.scores.대인운) / 3 : 3.5;

  // 중년운: 눈, 코 중심
  const middleScores = [눈해석, 코해석].filter(Boolean) as FaceFeatureReading[];
  const middleLifeScore = middleScores.length > 0 ?
    middleScores.reduce((sum, i) => sum + (i.scores.재물운 + i.scores.직장운) / 2, 0) / middleScores.length : 3.5;

  // 말년운: 입, 턱 중심
  const lateScores = [입해석, 턱해석].filter(Boolean) as FaceFeatureReading[];
  const lateLifeScore = lateScores.length > 0 ?
    lateScores.reduce((sum, i) => sum + (i.scores.건강운 + i.scores.대인운) / 2, 0) / lateScores.length : 3.5;

  // 6. 관상 유형 결정
  const { type, title } = determineFaceReadingType(categories, personality);

  // 7. 직업 추천
  const career = recommendCareer(categories, personality);

  // 8. 조언 생성
  const advices: string[] = [];
  interpretations.forEach(interp => {
    if (interp.advice && advices.length < 2) {
      advices.push(interp.advice.split('.')[0] + '.');
    }
  });
  const advice = advices.join(' ') || '타고난 장점을 잘 활용하면 큰 복을 누릴 수 있습니다.';

  // 9. 행운의 숫자 (1-99)
  const luckyNumber = Math.floor((earlyLifeScore + middleLifeScore + lateLifeScore) * 11) % 99 + 1;

  // 10. 행운의 색상
  const luckyColor = getLuckyColor(type);

  // 11. 요약 생성
  const avgScore = (categories.재물운 + categories.애정운 + categories.직장운 + categories.건강운 + categories.대인운) / 5;
  let summary = `${title}의 특징을 지니고 있습니다. `;

  if (avgScore >= 4.2) {
    summary += '전반적으로 매우 좋은 관상으로 복록이 넘칩니다. ';
  } else if (avgScore >= 3.8) {
    summary += '균형잡힌 좋은 관상으로 꾸준한 성공이 기대됩니다. ';
  } else {
    summary += '성장 가능성이 큰 관상으로 노력하면 큰 성취를 이룰 것입니다. ';
  }

  if (earlyLifeScore >= 4) {
    summary += '특히 젊은 시절부터 좋은 기회를 맞이할 것입니다.';
  } else if (middleLifeScore >= 4) {
    summary += '중년기에 크게 발전하여 안정을 이룰 것입니다.';
  } else if (lateLifeScore >= 4) {
    summary += '말년운이 좋아 편안한 노후를 보낼 것입니다.';
  } else {
    summary += '꾸준한 노력으로 점차 운이 상승할 것입니다.';
  }

  // 12. 부위별 설명 생성
  const faceFeatures = {
    이마: 이마해석 ? 이마해석.meaning : '균형잡힌 이마로 안정적인 초년운을 지녔습니다.',
    눈: 눈해석 ? 눈해석.meaning : '조화로운 눈으로 좋은 대인운을 지녔습니다.',
    코: 코해석 ? 코해석.meaning : '안정적인 코로 재물운이 있습니다.',
    입: 입해석 ? 입해석.meaning : '균형잡힌 입으로 말복이 있습니다.',
    전체윤곽: 얼굴형해석 ? 얼굴형해석.meaning : '조화로운 얼굴형으로 좋은 운을 지녔습니다.'
  };

  // 13. 결과 반환
  return {
    type,
    title,
    faceFeatures,
    lifeFortune: {
      초년운: {
        period: '1-30세',
        rating: Math.round(earlyLifeScore * 10) / 10,
        description: earlyLifeScore >= 4
          ? '이마의 상을 보니 초년기에 좋은 환경에서 성장하여 탄탄한 기반을 다질 것입니다. 학업이나 초기 경력에서 좋은 성과를 거둘 것입니다.'
          : earlyLifeScore >= 3.5
          ? '초년기에 안정적인 성장을 하며 기초를 다질 것입니다. 꾸준한 노력으로 점차 발전하는 시기입니다.'
          : '초기에는 다소 어려움이 있을 수 있으나 이를 극복하며 강인함을 기를 것입니다.'
      },
      중년운: {
        period: '31-50세',
        rating: Math.round(middleLifeScore * 10) / 10,
        description: middleLifeScore >= 4
          ? '눈과 코의 상을 보니 중년기에 크게 발전하여 사회적 성공을 거둘 것입니다. 재물운도 좋고 원하는 목표를 이룰 수 있습니다.'
          : middleLifeScore >= 3.5
          ? '중년기에 안정적으로 성장하며 사회적 입지를 다질 것입니다. 꾸준한 발전으로 만족스러운 성과를 거둘 것입니다.'
          : '노력이 필요한 시기이나 끈기있게 나아가면 점차 운이 열릴 것입니다.'
      },
      말년운: {
        period: '51세 이후',
        rating: Math.round(lateLifeScore * 10) / 10,
        description: lateLifeScore >= 4
          ? '입과 턱의 상을 보니 말년에 매우 편안하고 복된 삶을 누릴 것입니다. 건강도 좋고 행복한 노후를 보낼 것입니다.'
          : lateLifeScore >= 3.5
          ? '말년에 안정적이고 평온한 노후를 보낼 것입니다. 그동안의 노력이 결실을 맺을 것입니다.'
          : '평범하지만 건강하게 보낼 수 있습니다. 검소한 생활 습관이 중요합니다.'
      }
    },
    categories,
    personality,
    cautions,
    career,
    advice,
    luckyNumber,
    luckyColor,
    summary
  };
}
