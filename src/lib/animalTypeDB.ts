// 동물상 타입 정의
export interface AnimalType {
  name: string;
  emoji: string;
  title: string;
  description: string;
  personality: {
    positive: string[];
    negative: string[];
  };
  charm: string;
  loveStyle: string;
  compatibility: {
    best: string[];
    worst: string[];
  };
  celebrities: string[];
}

// 동물상 데이터베이스
export const animalTypeDB: Record<string, AnimalType> = {
  dog: {
    name: "강아지상",
    emoji: "🐶",
    title: "친근하고 활발한 강아지상",
    description: "밝고 긍정적인 에너지를 가진 당신! 주변 사람들에게 웃음을 주는 분위기 메이커입니다. 큰 눈과 둥근 얼굴형이 특징이며, 순수하고 호감 가는 인상을 줍니다.",
    personality: {
      positive: ["친근함", "활발함", "충성스러움", "낙천적", "사교적"],
      negative: ["덜렁거림", "질투심", "단순함", "참을성 부족"],
    },
    charm: "어디서든 금방 친해지는 사교성과 순수한 매력",
    loveStyle: "한번 좋아하면 직진! 적극적이고 솔직한 표현을 하는 타입. 연인에게 충성스럽고 헌신적입니다.",
    compatibility: {
      best: ["곰상", "토끼상"],
      worst: ["고양이상", "여우상"],
    },
    celebrities: ["수지", "아이유", "차은우", "박보검"],
  },

  cat: {
    name: "고양이상",
    emoji: "🐱",
    title: "도도하고 신비로운 고양이상",
    description: "날카로운 눈매와 갸름한 얼굴형이 특징인 당신! 신비로운 분위기로 사람들의 관심을 끄는 매력이 있습니다. 독립적이면서도 은근한 애교가 있어요.",
    personality: {
      positive: ["신비로움", "독립적", "지적", "세련됨", "자존감 높음"],
      negative: ["차가워 보임", "까다로움", "변덕스러움", "경계심"],
    },
    charm: "쉽게 다가갈 수 없는 신비로운 매력과 도도함",
    loveStyle: "쿨한 척하지만 속은 따뜻해요. 밀당의 고수이며, 한번 마음 열면 진심을 다합니다.",
    compatibility: {
      best: ["여우상", "사슴상"],
      worst: ["강아지상", "곰상"],
    },
    celebrities: ["제니", "김태희", "원빈", "공유"],
  },

  fox: {
    name: "여우상",
    emoji: "🦊",
    title: "영리하고 날카로운 여우상",
    description: "가늘고 날카로운 눈매에 뾰족한 턱선이 특징! 영리하고 센스 있는 인상을 주며, 눈치가 빠르고 상황 판단력이 뛰어납니다.",
    personality: {
      positive: ["영리함", "눈치 빠름", "적응력", "화술", "분석력"],
      negative: ["계산적", "의심 많음", "예민함", "겉과 속 다름"],
    },
    charm: "요염하고 섹시한 매력, 사람 마음을 꿰뚫는 눈빛",
    loveStyle: "연애도 전략적! 밀당에 능하고 상대를 리드합니다. 쉽게 마음을 열지 않지만 진심이면 깊이 빠져요.",
    compatibility: {
      best: ["고양이상", "호랑이상"],
      worst: ["강아지상", "곰상"],
    },
    celebrities: ["한예슬", "송혜교", "현빈", "이종석"],
  },

  bear: {
    name: "곰상",
    emoji: "🐻",
    title: "포근하고 믿음직한 곰상",
    description: "크고 부드러운 이목구비에 넓은 얼굴형이 특징! 듬직하고 따뜻한 인상으로 사람들에게 안정감을 줍니다. 같이 있으면 편안해지는 타입이에요.",
    personality: {
      positive: ["듬직함", "따뜻함", "인내심", "포용력", "신뢰감"],
      negative: ["느긋함", "무뚝뚝", "고집", "표현 부족"],
    },
    charm: "누구나 기댈 수 있는 넓은 어깨와 따뜻한 분위기",
    loveStyle: "말보다 행동으로 표현하는 타입. 한번 사귀면 오래가고, 연인을 든든하게 지켜줍니다.",
    compatibility: {
      best: ["강아지상", "토끼상"],
      worst: ["고양이상", "여우상"],
    },
    celebrities: ["마동석", "유재석", "전현무", "윤아"],
  },

  rabbit: {
    name: "토끼상",
    emoji: "🐰",
    title: "귀엽고 애교 있는 토끼상",
    description: "크고 동그란 눈에 작고 오똑한 코가 특징! 귀엽고 청순한 인상으로 보호본능을 자극합니다. 말랑말랑하고 부드러운 분위기의 소유자예요.",
    personality: {
      positive: ["귀여움", "순수함", "사랑스러움", "밝음", "애교"],
      negative: ["소심함", "겁 많음", "우유부단", "의존적"],
    },
    charm: "본능적으로 지켜주고 싶게 만드는 순수한 매력",
    loveStyle: "연애할 때 애교 폭발! 연인에게 잘 따르고 순종적인 편. 사랑받고 싶어하는 타입이에요.",
    compatibility: {
      best: ["곰상", "강아지상"],
      worst: ["호랑이상", "독수리상"],
    },
    celebrities: ["아이린", "설현", "정해인", "박서준"],
  },

  deer: {
    name: "사슴상",
    emoji: "🦌",
    title: "청순하고 순수한 사슴상",
    description: "맑은 눈망울과 갸름한 얼굴형이 특징! 우아하고 청초한 분위기로 고급스러운 인상을 줍니다. 조용하지만 존재감이 있어요.",
    personality: {
      positive: ["우아함", "청순함", "조용함", "섬세함", "감성적"],
      negative: ["내성적", "겁 많음", "예민함", "결단력 부족"],
    },
    charm: "맑고 깨끗한 분위기, 청아한 아름다움",
    loveStyle: "로맨틱한 연애를 꿈꿔요. 감성적이고 섬세해서 작은 것에도 감동받는 타입.",
    compatibility: {
      best: ["고양이상", "강아지상"],
      worst: ["호랑이상", "여우상"],
    },
    celebrities: ["임윤아", "한가인", "이민호", "송강"],
  },

  tiger: {
    name: "호랑이상",
    emoji: "🐯",
    title: "강인하고 당당한 호랑이상",
    description: "날카로운 눈매와 각진 얼굴형이 특징! 카리스마 넘치고 당당한 인상으로 리더십이 느껴집니다. 어디서든 존재감을 뿜는 타입이에요.",
    personality: {
      positive: ["카리스마", "리더십", "자신감", "추진력", "결단력"],
      negative: ["공격적", "독선적", "급함", "지배적"],
    },
    charm: "넘치는 카리스마와 압도적인 존재감",
    loveStyle: "연애도 주도적! 적극적으로 다가가고 연인을 리드합니다. 보호 본능이 강해요.",
    compatibility: {
      best: ["여우상", "독수리상"],
      worst: ["토끼상", "사슴상"],
    },
    celebrities: ["김혜수", "전지현", "이병헌", "정우성"],
  },

  eagle: {
    name: "독수리상",
    emoji: "🦅",
    title: "카리스마와 날카로움의 독수리상",
    description: "깊고 날카로운 눈매와 뚜렷한 이목구비가 특징! 강렬하고 시크한 인상으로 범접할 수 없는 아우라가 있습니다. 한눈에 사람을 파악하는 눈을 가졌어요.",
    personality: {
      positive: ["통찰력", "결단력", "집중력", "야망", "자신감"],
      negative: ["냉정함", "완벽주의", "고독함", "비타협적"],
    },
    charm: "범접할 수 없는 카리스마와 날카로운 눈빛",
    loveStyle: "쉽게 마음을 주지 않지만, 한번 빠지면 깊이 빠져요. 연인을 완벽하게 지키려 합니다.",
    compatibility: {
      best: ["호랑이상", "여우상"],
      worst: ["토끼상", "강아지상"],
    },
    celebrities: ["김수현", "이영애", "현빈", "손예진"],
  },
};

// 동물상 목록
export const animalTypeList = Object.keys(animalTypeDB);
