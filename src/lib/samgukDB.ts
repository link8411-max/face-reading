// 삼국지 인물 데이터베이스
// 코에이 삼국지 스타일 능력치 (통솔/무력/지력/정치/매력)

export interface SamgukCharacter {
  id: string;
  name: string;
  hanja: string;
  gender: "남" | "여";
  faction: "위" | "촉" | "오" | "기타";
  factionColor: string;
  role: string;
  stats: {
    통솔: number;
    무력: number;
    지력: number;
    정치: number;
    매력: number;
  };
  traits: string[];
  appearance: string;
  personality: string;
  quote: string;
  modernJob: string;
  description: string;
}

export const samgukCharacters: SamgukCharacter[] = [
  // ========== 위(魏) 남성 ==========
  {
    id: "caocao",
    name: "조조",
    hanja: "曹操",
    gender: "남",
    faction: "위",
    factionColor: "#3B82F6",
    role: "위나라 창업주",
    stats: { 통솔: 96, 무력: 72, 지력: 91, 정치: 94, 매력: 96 },
    traits: ["야망가", "시인", "전략가", "카리스마"],
    appearance: "날카롭고 깊은 눈매, 짧고 정돈된 수염, 위엄 있는 표정, 강인한 턱선",
    personality: "대담하고 결단력 있으며, 인재를 아끼지만 냉철한 판단을 내림",
    quote: "나는 차라리 천하를 저버릴지언정, 천하가 나를 저버리게 하지 않겠다",
    modernJob: "대기업 CEO, 정치인",
    description: "난세의 간웅으로 불리는 위나라의 창업주. 뛰어난 군사적 재능과 정치력으로 화북을 통일했다."
  },
  {
    id: "simayi",
    name: "사마의",
    hanja: "司馬懿",
    gender: "남",
    faction: "위",
    factionColor: "#3B82F6",
    role: "위나라 대도독",
    stats: { 통솔: 91, 무력: 62, 지력: 98, 정치: 92, 매력: 78 },
    traits: ["인내심", "야망가", "책략가", "늑대"],
    appearance: "길고 가는 눈, 관자놀이가 넓음, 냉정한 인상, 여윈 얼굴",
    personality: "인내심이 강하고 기회를 노리며, 겉으로는 순종적이나 속으로는 야망이 큼",
    quote: "참을 수 있으면 참고, 견딜 수 있으면 견뎌라",
    modernJob: "전략 컨설턴트, 투자가",
    description: "제갈량의 라이벌로 유명한 위나라의 명장. 끝없는 인내로 결국 천하를 손에 넣었다."
  },
  {
    id: "zhangliao",
    name: "장료",
    hanja: "張遼",
    gender: "남",
    faction: "위",
    factionColor: "#3B82F6",
    role: "위나라 명장",
    stats: { 통솔: 89, 무력: 92, 지력: 74, 정치: 63, 매력: 80 },
    traits: ["용맹", "충직", "돌격장", "위엄"],
    appearance: "넓은 이마, 굵은 눈썹, 강인한 체격, 위풍당당한 모습",
    personality: "용맹하면서도 지략이 있고, 적에게도 존경받는 무장",
    quote: "800명으로 10만 대군을 막겠다!",
    modernJob: "군인, 소방관, 경호원",
    description: "합비 전투에서 800명으로 손권의 10만 대군을 막아낸 전설적인 무장."
  },
  {
    id: "xiaohoudun",
    name: "하후돈",
    hanja: "夏侯惇",
    gender: "남",
    faction: "위",
    factionColor: "#3B82F6",
    role: "위나라 맹장",
    stats: { 통솔: 83, 무력: 90, 지력: 55, 정치: 62, 매력: 75 },
    traits: ["맹렬", "충성", "외눈", "불굴"],
    appearance: "한쪽 눈, 강인한 인상, 전투의 흉터, 우락부락한 체격",
    personality: "불같은 성격에 충성심이 강하고, 두려움을 모르는 용맹함",
    quote: "부모에게 받은 몸, 버릴 수 없다!",
    modernJob: "격투기 선수, 경찰 특공대",
    description: "전투 중 눈에 화살을 맞고도 싸운 조조의 가장 충직한 무장."
  },
  {
    id: "xuchu",
    name: "허저",
    hanja: "許褚",
    gender: "남",
    faction: "위",
    factionColor: "#3B82F6",
    role: "조조의 호위무장",
    stats: { 통솔: 68, 무력: 96, 지력: 38, 정치: 28, 매력: 62 },
    traits: ["괴력", "우직", "호위무사", "미친 호랑이"],
    appearance: "거대한 체구, 근육질, 험상궂은 얼굴, 단순한 표정",
    personality: "말은 적지만 충성심이 깊고, 전투에서는 미친 듯이 싸움",
    quote: "...(말없이 적을 베어버림)",
    modernJob: "보디빌더, 경호원",
    description: "호치(虎痴)라 불린 조조의 친위대장. 맨몸으로 마초와 대등하게 싸웠다."
  },
  {
    id: "dianwei",
    name: "전위",
    hanja: "典韋",
    gender: "남",
    faction: "위",
    factionColor: "#3B82F6",
    role: "조조의 호위무장",
    stats: { 통솔: 62, 무력: 97, 지력: 35, 정치: 22, 매력: 58 },
    traits: ["괴력", "희생", "쌍철극", "충성"],
    appearance: "거대한 체구, 험상궂은 얼굴, 넓은 어깨, 무서운 눈빛",
    personality: "과묵하지만 주군을 위해 목숨을 바치는 충성심",
    quote: "주공을 지키는 것이 내 임무다!",
    modernJob: "경호원, 군인",
    description: "조조를 위해 목숨을 바친 최강의 호위무장. 80근 쌍철극을 휘둘렀다."
  },
  {
    id: "xunyu",
    name: "순욱",
    hanja: "荀彧",
    gender: "남",
    faction: "위",
    factionColor: "#3B82F6",
    role: "위나라 책사",
    stats: { 통솔: 75, 무력: 29, 지력: 95, 정치: 98, 매력: 92 },
    traits: ["명사", "충신", "향기", "왕좌"],
    appearance: "단정하고 귀공자풍, 온화한 눈매, 품위 있는 분위기",
    personality: "온화하면서도 원칙을 지키며, 한나라에 대한 충성심이 깊음",
    quote: "천하를 위한 것이지, 개인을 위한 것이 아닙니다",
    modernJob: "국무총리, 대학교수",
    description: "왕좌의 향기로 불린 조조의 수석 책사. 뛰어난 인재 추천 능력."
  },
  {
    id: "guojia",
    name: "곽가",
    hanja: "郭嘉",
    gender: "남",
    faction: "위",
    factionColor: "#3B82F6",
    role: "위나라 귀재",
    stats: { 통솔: 68, 무력: 24, 지력: 97, 정치: 75, 매력: 88 },
    traits: ["귀재", "요절", "술꾼", "자유분방"],
    appearance: "수척하고 창백한 얼굴, 총명한 눈빛, 자유분방한 차림",
    personality: "천재적 두뇌에 자유분방한 성격, 술을 즐기고 예의에 얽매이지 않음",
    quote: "봉효가 있었다면 내가 이 지경이 되었겠는가!",
    modernJob: "스타트업 창업자, 천재 해커",
    description: "조조가 가장 아꼈던 천재 책사. 38세에 요절하여 조조를 통곡하게 했다."
  },
  {
    id: "jiaxu",
    name: "가후",
    hanja: "賈詡",
    gender: "남",
    faction: "위",
    factionColor: "#3B82F6",
    role: "위나라 책사",
    stats: { 통솔: 62, 무력: 31, 지력: 96, 정치: 88, 매력: 52 },
    traits: ["독사", "처세술", "생존", "냉철"],
    appearance: "평범하고 눈에 띄지 않는 외모, 날카로운 눈, 경계하는 표정",
    personality: "극도로 조심성이 많고, 자신의 안위를 최우선시하며 냉철함",
    quote: "밝은 곳에 서지 말고, 어두운 곳에서 살아남아라",
    modernJob: "로비스트, 위기관리 전문가",
    description: "독사라 불린 난세의 생존 전문가. 여러 주군을 섬기며 끝까지 살아남았다."
  },
  {
    id: "zhanghe",
    name: "장합",
    hanja: "張郃",
    gender: "남",
    faction: "위",
    factionColor: "#3B82F6",
    role: "위나라 명장",
    stats: { 통솔: 86, 무력: 88, 지력: 72, 정치: 54, 매력: 68 },
    traits: ["지장", "변화무쌍", "교묘", "노련"],
    appearance: "날렵한 인상, 예리한 눈, 균형 잡힌 체격",
    personality: "지략과 무력을 겸비하고 상황 판단이 빠름",
    quote: "병법은 물과 같아 변화무쌍해야 한다",
    modernJob: "특수부대 지휘관, 전술가",
    description: "오호대장군 중 가장 지략이 뛰어난 무장. 제갈량도 경계했다."
  },

  // ========== 위(魏) 여성 ==========
  {
    id: "bianshi",
    name: "변씨",
    hanja: "卞氏",
    gender: "여",
    faction: "위",
    factionColor: "#3B82F6",
    role: "조조의 정실",
    stats: { 통솔: 72, 무력: 18, 지력: 78, 정치: 85, 매력: 88 },
    traits: ["현모양처", "검소", "지혜", "내조"],
    appearance: "단아하고 우아한 외모, 현명한 눈빛, 검소한 차림",
    personality: "검소하고 지혜로우며, 조조의 내조자로서 후궁들을 잘 다스림",
    quote: "후궁의 사치는 나라를 병들게 합니다",
    modernJob: "재단 이사장, 교육자",
    description: "조조의 정실부인. 기녀 출신이지만 지혜와 덕으로 위나라 황후가 되었다."
  },
  {
    id: "zhangchunhua",
    name: "장춘화",
    hanja: "張春華",
    gender: "여",
    faction: "위",
    factionColor: "#3B82F6",
    role: "사마의의 아내",
    stats: { 통솔: 68, 무력: 22, 지력: 82, 정치: 78, 매력: 75 },
    traits: ["냉철", "결단력", "독한 여자", "내조"],
    appearance: "날카로운 눈매, 단호한 표정, 귀족적 분위기",
    personality: "냉철하고 결단력 있으며, 필요하면 과감한 결정을 내림",
    quote: "비밀을 지키려면 증인을 없애야 합니다",
    modernJob: "검사, 기업 법무팀장",
    description: "사마의의 아내. 사마의의 꾀병을 들킨 하녀를 직접 처리한 냉철한 여인."
  },
  {
    id: "zhenji",
    name: "견씨",
    hanja: "甄氏",
    gender: "여",
    faction: "위",
    factionColor: "#3B82F6",
    role: "조비의 황후",
    stats: { 통솔: 42, 무력: 15, 지력: 72, 정치: 58, 매력: 96 },
    traits: ["절세미녀", "비운", "시인", "낙신부"],
    appearance: "빼어난 미모, 슬픈 눈빛, 우아하고 청초한 분위기",
    personality: "아름답고 시적 감수성이 뛰어나지만, 비운의 삶을 살았음",
    quote: "낙수의 신녀처럼 아름다운...",
    modernJob: "시인, 예술가",
    description: "조비의 황후. 절세미인으로 낙신부의 모델이 되었으나 비운의 죽음을 맞았다."
  },

  // ========== 촉(蜀) 남성 ==========
  {
    id: "liubei",
    name: "유비",
    hanja: "劉備",
    gender: "남",
    faction: "촉",
    factionColor: "#22C55E",
    role: "촉나라 황제",
    stats: { 통솔: 78, 무력: 68, 지력: 75, 정치: 80, 매력: 99 },
    traits: ["인덕", "눈물", "한실부흥", "의형제"],
    appearance: "큰 귀, 긴 팔, 온화한 눈매, 인자한 표정",
    personality: "백성을 사랑하고 의리를 중시하며, 인재를 모으는 능력이 탁월",
    quote: "형제는 수족과 같고, 아내는 의복과 같다",
    modernJob: "NGO 대표, 사회운동가",
    description: "삼고초려로 제갈량을 얻고 촉한을 세운 인덕의 군주."
  },
  {
    id: "guanyu",
    name: "관우",
    hanja: "關羽",
    gender: "남",
    faction: "촉",
    factionColor: "#22C55E",
    role: "촉나라 무신",
    stats: { 통솔: 88, 무력: 97, 지력: 72, 정치: 62, 매력: 93 },
    traits: ["의리", "청룡언월도", "적토마", "무신"],
    appearance: "붉은 얼굴, 긴 수염, 봉황의 눈, 위풍당당한 체격",
    personality: "의리를 목숨보다 중시하고, 오만하지만 진정한 영웅",
    quote: "여기서 죽을지언정 항복은 없다!",
    modernJob: "무술 사범, 경찰청장",
    description: "무신으로 추앙받는 의리의 화신. 청룡언월도와 적토마의 주인."
  },
  {
    id: "zhangfei",
    name: "장비",
    hanja: "張飛",
    gender: "남",
    faction: "촉",
    factionColor: "#22C55E",
    role: "촉나라 맹장",
    stats: { 통솔: 82, 무력: 98, 지력: 45, 정치: 32, 매력: 72 },
    traits: ["호걸", "괴성", "술꾼", "사모바위"],
    appearance: "표범 같은 머리, 고리눈, 제비 턱, 우렁찬 목소리",
    personality: "불같은 성격에 술을 좋아하지만, 지략가를 존경함",
    quote: "나는 장비다! 누가 와서 죽음을 겨뤄볼 테냐!",
    modernJob: "프로레슬러, 술집 사장",
    description: "장판교에서 혼자 조조 대군을 막은 만인지적의 용장."
  },
  {
    id: "zhugeliang",
    name: "제갈량",
    hanja: "諸葛亮",
    gender: "남",
    faction: "촉",
    factionColor: "#22C55E",
    role: "촉나라 승상",
    stats: { 통솔: 92, 무력: 38, 지력: 100, 정치: 95, 매력: 92 },
    traits: ["지략", "충성", "우선", "출사표"],
    appearance: "학처럼 늘씬한 체형, 맑은 눈, 단정한 수염, 깃털부채",
    personality: "신중하고 충성스러우며, 모든 일을 완벽하게 처리하려 함",
    quote: "신은 다만 몸이 부서져도 은혜에 보답하고자 할 뿐입니다",
    modernJob: "국방장관, AI 연구원",
    description: "삼국지 최고의 지략가. 천하삼분지계를 세우고 촉한을 이끌었다."
  },
  {
    id: "zhaoyun",
    name: "조운",
    hanja: "趙雲",
    gender: "남",
    faction: "촉",
    factionColor: "#22C55E",
    role: "촉나라 명장",
    stats: { 통솔: 85, 무력: 96, 지력: 74, 정치: 68, 매력: 90 },
    traits: ["상산조자룡", "충직", "용맹", "완벽"],
    appearance: "잘생긴 외모, 백마, 은갑, 단정하고 기품 있는 모습",
    personality: "냉철하면서도 충성스럽고, 모든 면에서 균형 잡힌 무장",
    quote: "나는 상산 조자룡이다!",
    modernJob: "특수부대 대원, 모델",
    description: "장판 전투에서 아두를 구한 상산의 백룡. 완벽한 무장의 대명사."
  },
  {
    id: "machao",
    name: "마초",
    hanja: "馬超",
    gender: "남",
    faction: "촉",
    factionColor: "#22C55E",
    role: "촉나라 맹장",
    stats: { 통솔: 87, 무력: 97, 지력: 52, 정치: 42, 매력: 88 },
    traits: ["금마초", "서량", "복수", "금수"],
    appearance: "잘생긴 얼굴, 금빛 갑옷, 백마, 귀공자풍",
    personality: "용맹하지만 충동적이고, 복수심에 불타는 비운의 영웅",
    quote: "조조! 내 아버지의 원수!",
    modernJob: "레이서, 익스트림 스포츠 선수",
    description: "금마초라 불린 서량의 맹장. 조조를 벌벌 떨게 만든 돌격의 화신."
  },
  {
    id: "huangzhong",
    name: "황충",
    hanja: "黃忠",
    gender: "남",
    faction: "촉",
    factionColor: "#22C55E",
    role: "촉나라 노장",
    stats: { 통솔: 76, 무력: 92, 지력: 58, 정치: 48, 매력: 72 },
    traits: ["노익장", "명궁", "정군산", "불굴"],
    appearance: "백발, 굳은 의지의 눈빛, 탄탄한 체격, 노련한 분위기",
    personality: "나이에 굴하지 않는 불굴의 정신, 젊은이 못지않은 패기",
    quote: "늙었다고? 아직 멀었다!",
    modernJob: "양궁 코치, 은퇴 안 한 운동선수",
    description: "60이 넘어 정군산에서 하후연을 베어 명성을 떨친 노장."
  },
  {
    id: "weiyan",
    name: "위연",
    hanja: "魏延",
    gender: "남",
    faction: "촉",
    factionColor: "#22C55E",
    role: "촉나라 장수",
    stats: { 통솔: 84, 무력: 90, 지력: 68, 정치: 45, 매력: 52 },
    traits: ["반골", "야망", "자오곡", "비운"],
    appearance: "반골의 상, 사나운 눈빛, 불만스러운 표정",
    personality: "능력은 뛰어나지만 오만하고, 자신의 재능이 인정받지 못함을 불만",
    quote: "내 계책이 채택되었다면 천하가 바뀌었을 것이다!",
    modernJob: "스타트업 CTO (퇴사 후 창업)",
    description: "반골의 상이라 의심받은 비운의 맹장. 자오곡 기습을 건의했다."
  },
  {
    id: "jiangwei",
    name: "강유",
    hanja: "姜維",
    gender: "남",
    faction: "촉",
    factionColor: "#22C55E",
    role: "촉나라 대장군",
    stats: { 통솔: 88, 무력: 85, 지력: 90, 정치: 72, 매력: 78 },
    traits: ["제갈량 후계자", "북벌", "충성", "비운"],
    appearance: "총명한 눈빛, 단정한 외모, 젊고 패기 있는 모습",
    personality: "스승 제갈량에 대한 충성심이 깊고, 끝까지 촉한 부흥을 꿈꿈",
    quote: "신의 계책이 이루어지지 않은 것은 하늘의 뜻입니다",
    modernJob: "사회운동가, 변호사",
    description: "제갈량의 후계자로 9번의 북벌을 감행한 촉한 최후의 충신."
  },
  {
    id: "pangtong",
    name: "방통",
    hanja: "龐統",
    gender: "남",
    faction: "촉",
    factionColor: "#22C55E",
    role: "촉나라 책사",
    stats: { 통솔: 72, 무력: 35, 지력: 98, 정치: 82, 매력: 58 },
    traits: ["봉추", "못생김", "요절", "연환계"],
    appearance: "못생긴 외모, 작은 키, 하지만 총명한 눈빛",
    personality: "외모로 무시당하지만 천재적 두뇌, 성격이 급함",
    quote: "복룡(제갈량)과 봉추(방통) 중 하나만 얻어도 천하를 얻는다",
    modernJob: "괴짜 천재 개발자",
    description: "제갈량과 쌍벽을 이루는 봉추. 낙봉파에서 36세에 요절했다."
  },

  // ========== 촉(蜀) 여성 ==========
  {
    id: "huangyueying",
    name: "황월영",
    hanja: "黃月英",
    gender: "여",
    faction: "촉",
    factionColor: "#22C55E",
    role: "제갈량의 아내",
    stats: { 통솔: 58, 무력: 25, 지력: 92, 정치: 72, 매력: 55 },
    traits: ["천재", "발명가", "못생김", "현명"],
    appearance: "평범한 외모, 총명한 눈빛, 손재주가 좋아 보이는 손",
    personality: "외모보다 지혜를 중시하며, 발명과 기계에 천재적 재능",
    quote: "외모가 중요한 게 아니라 머리가 중요하지요",
    modernJob: "공학자, 발명가",
    description: "제갈량의 아내. 못생겼다고 알려졌지만 천재적 두뇌로 남편을 도왔다."
  },
  {
    id: "ganfuren",
    name: "감부인",
    hanja: "甘夫人",
    gender: "여",
    faction: "촉",
    factionColor: "#22C55E",
    role: "유비의 부인",
    stats: { 통솔: 45, 무력: 18, 지력: 62, 정치: 55, 매력: 85 },
    traits: ["현모양처", "인내", "유선의 어머니", "피난"],
    appearance: "온화하고 인자한 얼굴, 부드러운 눈매, 현숙한 분위기",
    personality: "인내심이 강하고 어려운 시절에도 유비를 내조함",
    quote: "어디로 가시든 함께 하겠습니다",
    modernJob: "상담사, 교육자",
    description: "유비의 부인이자 유선(아두)의 어머니. 장판 전투에서 조운이 구해냈다."
  },
  {
    id: "mifuren",
    name: "미부인",
    hanja: "糜夫人",
    gender: "여",
    faction: "촉",
    factionColor: "#22C55E",
    role: "유비의 부인",
    stats: { 통솔: 38, 무력: 15, 지력: 58, 정치: 48, 매력: 82 },
    traits: ["희생", "충절", "우물", "비운"],
    appearance: "아름다운 얼굴, 슬픈 눈빛, 연약한 분위기",
    personality: "남편과 아들을 위해 자신을 희생하는 충절",
    quote: "저 때문에 지체하지 마세요...",
    modernJob: "봉사자, 간호사",
    description: "유비의 부인. 장판 전투에서 아두를 조운에게 맡기고 우물에 투신했다."
  },
  {
    id: "sunshangxiang",
    name: "손상향",
    hanja: "孫尚香",
    gender: "여",
    faction: "촉",
    factionColor: "#22C55E",
    role: "유비의 부인, 손권의 여동생",
    stats: { 통솔: 72, 무력: 78, 지력: 68, 정치: 62, 매력: 88 },
    traits: ["여장군", "활달", "궁술", "비운의 사랑"],
    appearance: "늠름하고 활달한 외모, 강인한 눈빛, 여전사의 기품",
    personality: "무예를 좋아하고 활달하며, 일반적인 여성상과 다름",
    quote: "검을 쥐면 남자도 두렵지 않아요!",
    modernJob: "스포츠 선수, 무술가",
    description: "손권의 여동생이자 유비의 아내. 무예를 좋아한 여장군 스타일의 공주."
  },

  // ========== 오(吳) 남성 ==========
  {
    id: "sunquan",
    name: "손권",
    hanja: "孫權",
    gender: "남",
    faction: "오",
    factionColor: "#EF4444",
    role: "오나라 황제",
    stats: { 통솔: 88, 무력: 68, 지력: 82, 정치: 90, 매력: 88 },
    traits: ["벽안아", "균형", "인재등용", "수성"],
    appearance: "푸른 눈, 붉은 수염, 당당한 체격",
    personality: "인재를 잘 쓰고 참모의 말을 경청하며, 균형 감각이 뛰어남",
    quote: "아들을 낳으려면 손중모 같은 아들을 낳아야 한다",
    modernJob: "대기업 2세 경영인",
    description: "형과 아버지의 유산을 지키고 발전시킨 오나라의 군주."
  },
  {
    id: "zhouyu",
    name: "주유",
    hanja: "周瑜",
    gender: "남",
    faction: "오",
    factionColor: "#EF4444",
    role: "오나라 대도독",
    stats: { 통솔: 95, 무력: 68, 지력: 96, 정치: 82, 매력: 95 },
    traits: ["미주랑", "음악", "적벽", "질투"],
    appearance: "빼어난 미모, 우아한 분위기, 풍류를 아는 귀공자",
    personality: "재능이 뛰어나고 자존심이 강하며, 예술적 감각이 있음",
    quote: "하늘은 어찌하여 주유를 낳고 제갈량을 낳았는가!",
    modernJob: "오케스트라 지휘자, 연예기획사 대표",
    description: "적벽대전의 영웅. 뛰어난 외모와 음악적 재능을 겸비한 오나라의 천재."
  },
  {
    id: "luxun",
    name: "육손",
    hanja: "陸遜",
    gender: "남",
    faction: "오",
    factionColor: "#EF4444",
    role: "오나라 대도독",
    stats: { 통솔: 92, 무력: 52, 지력: 95, 정치: 88, 매력: 82 },
    traits: ["서생", "이릉", "인내", "화공"],
    appearance: "젊고 단정한 외모, 서생 같은 인상, 온화한 분위기",
    personality: "겸손하고 인내심이 강하며, 겉으로는 평범해 보이지만 뛰어난 지략",
    quote: "적이 교만해질 때까지 기다려라",
    modernJob: "전략 컨설턴트, 대학교수",
    description: "이릉대전에서 유비를 대파한 오나라의 명장. 서생 같은 외모에 숨은 지략가."
  },
  {
    id: "lvmeng",
    name: "여몽",
    hanja: "呂蒙",
    gender: "남",
    faction: "오",
    factionColor: "#EF4444",
    role: "오나라 장수",
    stats: { 통솔: 86, 무력: 82, 지력: 85, 정치: 68, 매력: 72 },
    traits: ["오하아몽", "공부벌레", "형주", "변신"],
    appearance: "강인한 체격, 무인의 풍모지만 지적인 눈빛",
    personality: "처음엔 무식했으나 끊임없이 공부하여 지장으로 성장",
    quote: "선비가 3일을 떨어져 있으면 눈을 비비고 다시 봐야 한다",
    modernJob: "자수성가 CEO, 평생학습자",
    description: "오하아몽에서 지장으로 성장한 입지전적 인물. 관우를 사로잡았다."
  },
  {
    id: "ganning",
    name: "감녕",
    hanja: "甘寧",
    gender: "남",
    faction: "오",
    factionColor: "#EF4444",
    role: "오나라 맹장",
    stats: { 통솔: 75, 무력: 94, 지력: 52, 정치: 38, 매력: 72 },
    traits: ["금범적", "해적", "방울", "돌격"],
    appearance: "화려한 차림, 방울 장식, 거친 인상, 해적 같은 분위기",
    personality: "호탕하고 거침없으며, 과거 해적 출신의 거친 매력",
    quote: "100명의 기병으로 조조 진영을 휩쓸겠다!",
    modernJob: "오토바이 라이더, 익스트림 스포츠 선수",
    description: "금범적이라 불린 전 해적. 100명으로 조조 진영을 기습한 맹장."
  },
  {
    id: "taishici",
    name: "태사자",
    hanja: "太史慈",
    gender: "남",
    faction: "오",
    factionColor: "#EF4444",
    role: "오나라 장수",
    stats: { 통솔: 78, 무력: 93, 지력: 62, 정치: 55, 매력: 82 },
    traits: ["효자", "명궁", "의리", "결투"],
    appearance: "건장한 체격, 늠름한 외모, 정의로운 눈빛",
    personality: "효심이 깊고 의리를 중시하며, 약속을 목숨보다 중히 여김",
    quote: "대장부가 세상에 태어나 칠 척 검을 차고...",
    modernJob: "국궁 선수, 의리파 형사",
    description: "손책과 일대일 결투를 벌인 명궁. 효자이자 의리의 무장."
  },
  {
    id: "lusu",
    name: "노숙",
    hanja: "魯肅",
    gender: "남",
    faction: "오",
    factionColor: "#EF4444",
    role: "오나라 책사",
    stats: { 통솔: 72, 무력: 48, 지력: 88, 정치: 92, 매력: 90 },
    traits: ["온화", "천하이분", "중재자", "호인"],
    appearance: "온화한 인상, 부드러운 눈매, 점잖은 분위기",
    personality: "대국적 관점에서 생각하고, 온화하며 중재를 잘함",
    quote: "유비와 손을 잡아야 조조에 맞설 수 있습니다",
    modernJob: "외교관, UN 직원",
    description: "손유동맹을 이끈 오나라의 외교가. 대국적 안목의 소유자."
  },
  {
    id: "sunce",
    name: "손책",
    hanja: "孫策",
    gender: "남",
    faction: "오",
    factionColor: "#EF4444",
    role: "오나라 창업주",
    stats: { 통솔: 90, 무력: 92, 지력: 72, 정치: 75, 매력: 94 },
    traits: ["소패왕", "패기", "요절", "정복"],
    appearance: "잘생긴 외모, 패기 넘치는 눈빛, 젊고 활기찬 모습",
    personality: "패기 넘치고 과감하며, 카리스마가 있지만 성급함",
    quote: "나는 강동의 땅을 평정하겠다!",
    modernJob: "스타트업 창업자, 모험가",
    description: "소패왕이라 불린 오나라의 창업주. 26세에 요절한 비운의 영웅."
  },

  // ========== 오(吳) 여성 ==========
  {
    id: "daqiao",
    name: "대교",
    hanja: "大喬",
    gender: "여",
    faction: "오",
    factionColor: "#EF4444",
    role: "손책의 아내",
    stats: { 통솔: 42, 무력: 22, 지력: 68, 정치: 58, 매력: 98 },
    traits: ["절세미녀", "손책의 아내", "교자매", "비운"],
    appearance: "절세미녀, 우아하고 단아한 분위기, 슬픈 눈",
    personality: "아름답고 현숙하며, 남편의 요절로 비운의 삶",
    quote: "...(말없이 미소)",
    modernJob: "배우, 모델",
    description: "손책의 아내이자 동오의 국모. 이교와 함께 이교자매로 유명."
  },
  {
    id: "xiaoqiao",
    name: "소교",
    hanja: "小喬",
    gender: "여",
    faction: "오",
    factionColor: "#EF4444",
    role: "주유의 아내",
    stats: { 통솔: 38, 무력: 18, 지력: 72, 정치: 62, 매력: 99 },
    traits: ["절세미녀", "주유의 아내", "교자매", "음악"],
    appearance: "절세미녀, 밝고 화사한 분위기, 음악을 아는 우아함",
    personality: "밝고 예술적 감각이 뛰어나며, 주유와 금슬이 좋음",
    quote: "주랑의 음악은 천하제일이에요",
    modernJob: "음악가, 예술가",
    description: "주유의 아내. 적벽대전에서 조조가 탐냈다는 전설의 미녀."
  },
  {
    id: "wuguotai",
    name: "오국태",
    hanja: "吳國太",
    gender: "여",
    faction: "오",
    factionColor: "#EF4444",
    role: "손권의 어머니",
    stats: { 통솔: 75, 무력: 15, 지력: 78, 정치: 82, 매력: 80 },
    traits: ["현명", "국모", "손견의 아내", "정치력"],
    appearance: "위엄 있는 노부인, 날카로운 눈빛, 귀족적 품위",
    personality: "현명하고 결단력 있으며, 손씨 가문을 뒤에서 이끔",
    quote: "내 눈으로 직접 보고 판단하겠다",
    modernJob: "기업 회장, 재단 이사장",
    description: "손권의 어머니. 현명한 판단으로 손씨 가문을 뒤에서 이끈 여걸."
  },
  {
    id: "bujianying",
    name: "보련사",
    hanja: "步練師",
    gender: "여",
    faction: "오",
    factionColor: "#EF4444",
    role: "손권의 총애를 받은 후궁",
    stats: { 통솔: 48, 무력: 12, 지력: 72, 정치: 68, 매력: 92 },
    traits: ["총애", "미모", "온화", "황후"],
    appearance: "청초한 미모, 온화한 눈빛, 부드러운 분위기",
    personality: "성격이 온화하고 질투하지 않아 손권의 사랑을 독차지함",
    quote: "다른 후궁들도 아껴주세요",
    modernJob: "상담사, 중재자",
    description: "손권이 가장 사랑한 후궁. 온화한 성품으로 후궁들 사이를 화목하게 했다."
  },

  // ========== 기타 남성 ==========
  {
    id: "lvbu",
    name: "여포",
    hanja: "呂布",
    gender: "남",
    faction: "기타",
    factionColor: "#A855F7",
    role: "비장의 무장",
    stats: { 통솔: 68, 무력: 100, 지력: 28, 정치: 22, 매력: 72 },
    traits: ["천하무적", "방천화극", "적토마", "배신"],
    appearance: "압도적 체격, 위압적인 눈빛, 화려한 갑옷",
    personality: "무예는 천하제일이나 의리가 없고 배신을 밥먹듯이 함",
    quote: "내가 여기 있는데 누가 나와 겨루겠는가!",
    modernJob: "UFC 챔피언, 용병",
    description: "삼국지 최강의 무장. 방천화극과 적토마의 주인이지만 배신자."
  },
  {
    id: "dongzhuo",
    name: "동탁",
    hanja: "董卓",
    gender: "남",
    faction: "기타",
    factionColor: "#A855F7",
    role: "폭군",
    stats: { 통솔: 75, 무력: 82, 지력: 52, 정치: 38, 매력: 18 },
    traits: ["폭군", "탐욕", "비만", "잔인"],
    appearance: "비대한 체구, 탐욕스러운 눈, 잔인한 인상",
    personality: "탐욕스럽고 잔인하며, 권력을 위해 무엇이든 함",
    quote: "천자를 내 손에 쥐었으니 천하가 내 것이다!",
    modernJob: "부패한 정치인, 마피아 보스",
    description: "한나라를 멸망의 길로 이끈 폭군. 여포에게 살해당했다."
  },
  {
    id: "yuanshao",
    name: "원소",
    hanja: "袁紹",
    gender: "남",
    faction: "기타",
    factionColor: "#A855F7",
    role: "하북의 맹주",
    stats: { 통솔: 78, 무력: 62, 지력: 65, 정치: 72, 매력: 85 },
    traits: ["명문", "우유부단", "관도", "자존심"],
    appearance: "귀족적 외모, 고고한 분위기, 명문가의 품위",
    personality: "명문 출신의 자존심이 강하나 결단력이 부족",
    quote: "내가 4대 삼공의 후예인데!",
    modernJob: "재벌 3세 (실패한)",
    description: "명문가 출신으로 최대 세력을 이끌었으나 관도대전에서 조조에게 패배."
  },
  {
    id: "yuanshu",
    name: "원술",
    hanja: "袁術",
    gender: "남",
    faction: "기타",
    factionColor: "#A855F7",
    role: "참칭 황제",
    stats: { 통솔: 52, 무력: 48, 지력: 42, 정치: 38, 매력: 35 },
    traits: ["사치", "오만", "참칭", "몰락"],
    appearance: "기름진 얼굴, 사치스러운 차림, 오만한 표정",
    personality: "명문가의 자존심만 강하고 실력이 없으며 사치스러움",
    quote: "내가 황제다!",
    modernJob: "파산한 재벌 2세",
    description: "스스로 황제를 칭했다가 몰락한 원소의 동생. 꿀물을 찾으며 죽었다."
  },
  {
    id: "gongsunzan",
    name: "공손찬",
    hanja: "公孫瓚",
    gender: "남",
    faction: "기타",
    factionColor: "#A855F7",
    role: "북방의 맹장",
    stats: { 통솔: 82, 무력: 85, 지력: 55, 정치: 48, 매력: 72 },
    traits: ["백마장군", "북방", "오랑캐", "비운"],
    appearance: "백마를 탄 늠름한 장수, 북방 전사의 거친 매력",
    personality: "용맹하고 오랑캐와의 전투 경험이 풍부하나 고집이 셈",
    quote: "나의 백마의병이 오랑캐를 몰아내겠다!",
    modernJob: "국경수비대장",
    description: "백마장군으로 북방 오랑캐를 토벌한 맹장. 원소와의 싸움에서 패배."
  },
  {
    id: "zhangjiao",
    name: "장각",
    hanja: "張角",
    gender: "남",
    faction: "기타",
    factionColor: "#A855F7",
    role: "황건적 수괴",
    stats: { 통솔: 88, 무력: 42, 지력: 78, 정치: 82, 매력: 95 },
    traits: ["태평도", "황건", "요술", "혁명"],
    appearance: "도사 복장, 카리스마 있는 눈빛, 신비로운 분위기",
    personality: "백성의 고통을 이용해 혁명을 일으킨 카리스마적 지도자",
    quote: "창천이 이미 죽었으니 황천이 마땅히 서리라!",
    modernJob: "종교 지도자, 혁명가",
    description: "황건적의 난을 일으킨 태평도의 교주. 삼국시대의 시작점."
  },
  {
    id: "huatuo",
    name: "화타",
    hanja: "華佗",
    gender: "남",
    faction: "기타",
    factionColor: "#A855F7",
    role: "신의",
    stats: { 통솔: 32, 무력: 28, 지력: 92, 정치: 45, 매력: 88 },
    traits: ["신의", "마비산", "관우치료", "오금희"],
    appearance: "온화한 노인, 의사의 인자함, 지혜로운 눈",
    personality: "인술을 베푸는 어진 의사, 환자를 차별하지 않음",
    quote: "병을 고치는 것이 나의 도리입니다",
    modernJob: "외과 전문의, 노벨 의학상 수상자",
    description: "삼국시대 최고의 명의. 마취제를 발명하고 관우의 뼈를 긁었다."
  },
  {
    id: "liubiao",
    name: "유표",
    hanja: "劉表",
    gender: "남",
    faction: "기타",
    factionColor: "#A855F7",
    role: "형주목",
    stats: { 통솔: 65, 무력: 42, 지력: 72, 정치: 78, 매력: 82 },
    traits: ["문인", "수성", "형주", "우유부단"],
    appearance: "학자풍의 온화한 외모, 점잖은 분위기",
    personality: "문화를 좋아하고 평화를 원하나 결단력이 부족",
    quote: "나는 싸우기보다 지키는 것을 원한다",
    modernJob: "대학 총장, 문화재단 이사장",
    description: "형주를 평화롭게 다스린 문인 군주. 유비에게 형주를 맡겼다."
  },
  {
    id: "menghuo",
    name: "맹획",
    hanja: "孟獲",
    gender: "남",
    faction: "기타",
    factionColor: "#A855F7",
    role: "남만왕",
    stats: { 통솔: 78, 무력: 82, 지력: 38, 정치: 35, 매력: 72 },
    traits: ["남만왕", "칠종칠금", "고집", "의리"],
    appearance: "거친 외모, 이국적 복장, 우직한 인상",
    personality: "고집이 세지만 은혜를 알고, 한번 마음 먹으면 충성함",
    quote: "일곱 번 잡혀도 항복하지 않겠다... 아 진짜 항복",
    modernJob: "소수민족 지도자",
    description: "제갈량에게 7번 잡혔다 7번 풀려난 남만의 왕. 결국 진심으로 복종."
  },

  // ========== 기타 여성 ==========
  {
    id: "diaochan",
    name: "초선",
    hanja: "貂蟬",
    gender: "여",
    faction: "기타",
    factionColor: "#A855F7",
    role: "절세미녀",
    stats: { 통솔: 35, 무력: 18, 지력: 82, 정치: 68, 매력: 100 },
    traits: ["미인계", "연환계", "여포", "동탁"],
    appearance: "삼국지 제일의 미녀, 아름다운 자태, 달빛 같은 피부",
    personality: "나라를 위해 미인계를 펼친 애국녀, 지혜롭고 담대함",
    quote: "이 몸을 바쳐 나라를 구하겠습니다",
    modernJob: "첩보원, 배우",
    description: "미인계로 동탁과 여포를 이간질시킨 중국 4대 미녀 중 하나."
  },
  {
    id: "zhurong",
    name: "축융",
    hanja: "祝融",
    gender: "여",
    faction: "기타",
    factionColor: "#A855F7",
    role: "남만의 여장군",
    stats: { 통솔: 72, 무력: 88, 지력: 52, 정치: 38, 매력: 85 },
    traits: ["여장군", "비도", "맹획의 아내", "남만"],
    appearance: "야성적 아름다움, 전사의 강인함, 이국적 외모",
    personality: "용맹하고 불같은 성격, 남편을 뛰어넘는 무력",
    quote: "남만의 전사를 얕보지 마라!",
    modernJob: "여성 격투기 선수, 액션 배우",
    description: "남만왕 맹획의 아내. 비도를 던지며 촉군과 맞서 싸운 여장군."
  },
  {
    id: "caiwenji",
    name: "채문희",
    hanja: "蔡文姬",
    gender: "여",
    faction: "기타",
    factionColor: "#A855F7",
    role: "문학가",
    stats: { 통솔: 35, 무력: 12, 지력: 88, 정치: 58, 매력: 85 },
    traits: ["문학가", "음악가", "비운", "호가십팔박"],
    appearance: "지적인 외모, 슬픈 눈빛, 문인의 우아함",
    personality: "뛰어난 문학적 재능, 파란만장한 삶을 살았음",
    quote: "고향을 그리는 마음을 어찌 글로 다 표현할까",
    modernJob: "작가, 음악가",
    description: "채옹의 딸. 흉노에게 납치되었다가 조조가 몸값을 치르고 구해온 문학가."
  },
  {
    id: "dongbai",
    name: "동백",
    hanja: "董白",
    gender: "여",
    faction: "기타",
    factionColor: "#A855F7",
    role: "동탁의 손녀",
    stats: { 통솔: 28, 무력: 15, 지력: 42, 정치: 35, 매력: 78 },
    traits: ["동탁의 손녀", "어린 나이", "비운", "권력"],
    appearance: "어린 소녀, 순수한 외모, 귀족적 차림",
    personality: "어린 나이에 권력을 얻었으나 그 무게를 모름",
    quote: "할아버지가 주신 거예요",
    modernJob: "재벌 3세",
    description: "동탁의 손녀. 어린 나이에 제후에 봉해졌으나 동탁 멸망과 함께 몰락."
  }
];

// ID로 인물 찾기
export function getCharacterById(id: string): SamgukCharacter | undefined {
  return samgukCharacters.find(c => c.id === id);
}

// 이름으로 인물 찾기
export function getCharacterByName(name: string): SamgukCharacter | undefined {
  return samgukCharacters.find(c => c.name === name || c.hanja === name);
}

// 세력별 인물 목록
export function getCharactersByFaction(faction: string): SamgukCharacter[] {
  return samgukCharacters.filter(c => c.faction === faction);
}

// 성별로 인물 목록
export function getCharactersByGender(gender: "남" | "여"): SamgukCharacter[] {
  return samgukCharacters.filter(c => c.gender === gender);
}

// 프롬프트용 인물 목록 생성 (성별 필터 포함)
export function getCharacterListForPrompt(gender?: "남" | "여"): string {
  const filtered = gender ? samgukCharacters.filter(c => c.gender === gender) : samgukCharacters;
  return filtered.map(c =>
    `${c.name}(${c.hanja}): ${c.appearance}`
  ).join("\n");
}

// 인물 이름 목록만 (성별 필터 포함)
export function getCharacterNames(gender?: "남" | "여"): string[] {
  const filtered = gender ? samgukCharacters.filter(c => c.gender === gender) : samgukCharacters;
  return filtered.map(c => c.name);
}
