// 영어 사전(src/content/en/ui.ts)과 같은 키의 한국어 값. 지금 화면에 있는 한국어 그대로 옮겼다.
import type { UiKey } from '@/content/en/ui';

export const UI: Record<UiKey, string> = {
  'tab.home': '홈',
  'tab.all': '전체',
  'nav.bottom': '하단 메뉴',
  'tab.today': '오늘',

  'chip.all': '전체',
  'chip.face': '얼굴',
  'chip.fortune': '운세',
  'chip.match': '궁합',
  'chip.play': '게임',

  'btn.start': '시작',
  'btn.choosePhoto': '사진 고르기',
  'btn.analyze': '분석하기',
  'btn.share': '공유하기',
  'btn.saveImage': '이미지 저장',
  'btn.tryAgain': '다시하기',
  'btn.seeAll': '전체 보기',
  'btn.tryAnother': '다른 테스트 보기',

  'gender.label': '나는',
  'gender.female': '여자',
  'gender.male': '남자',

  'tips.title': '더 정확하게 보려면',
  'tips.front': '정면을 바라봐 주세요',
  'tips.light': '밝은 곳에서',
  'tips.clear': '앞머리는 살짝 넘겨주세요',

  'privacy.line': '사진은 내 폰 안에서만 보고 바로 지워요. 어디에도 올라가지 않아요.',

  'analyzing.step1': '얼굴형 살피는 중',
  'analyzing.step2': '이목구비 비율 재는 중',
  'analyzing.step3': '결과 정리하는 중',

  'lang.viewInEnglish': 'View this page in English',
  'lang.readInEnglish': 'Read in English',
  'lang.koreanOnly': '이 페이지는 한국어만 있어요',
  'lang.switch': '언어',
  'lang.dismiss': '닫기',

  'result.watermark': '운명을 읽다 · unse-ai.com',
  'result.disclaimer': '재미로만 봐 주세요. 과학적 근거는 없어요.',

  // buttons
  'btn.back': '돌아가기',
  'btn.sharePreparing': '공유 준비 중…',

  // start screen
  'start.photoHint': '셀카도 좋아요 · 정면이면 더 정확해요',
  'start.anotherPhoto': '다른 사진 고르기',
  'start.chosenAlt': '고른 사진',
  'start.needPhoto': '사진을 먼저 골라 주세요',
  'start.needGender': '성별을 먼저 골라 주세요',
  'start.preparing': '분석 준비 중…',
  'start.analyzing': '분석 중…',
  'gender.aria': '성별',

  // more tests
  'more.title': '다른 테스트 둘러보기',

  // brand
  'brand.name': '운명을 읽다',
  'cast.alt': '캐릭터',

  // sharing
  'share.copied': '링크를 복사했어요. 원하는 곳에 붙여 넣어 공유해 주세요.',
  'share.failed': '공유하지 못했어요. 이미지 저장을 눌러 주세요.',

  // photo errors
  'err.tool': '분석 도구를 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요. 카카오톡·인스타 안 브라우저라면 크롬이나 사파리로 열어 보세요.',
  'err.noface': '얼굴을 찾지 못했어요. 얼굴이 사진의 3분의 1 이상 차지하게 가까이에서, 밝은 곳에서 찍은 사진이 좋아요. 마스크·선글라스·그림체가 강한 일러스트는 인식이 어려워요.',
  'err.turned': '고개가 {dir}돌아가 있어요(돌아간 정도 {got}, {limit} 이하여야 해요). 카메라를 똑바로 보고 찍은 사진으로 다시 해 주세요.',
  'err.frontal': '정면 사진을 올려 주세요. 고개를 돌린 사진은 얼굴을 비교하기 어려워요.',
  'err.read': '사진을 읽지 못했어요. JPG나 PNG 사진으로 다시 올려 주세요.',

  // face reading page
  'face.title': 'AI 관상 테스트',
  'face.heading': '웃는 사진 한 장이면\n충분해요',
  'face.desc': '사진 한 장으로 보는 무료 관상이에요. 얼굴형 5가지와 힘이 실린 자리 3곳으로 15가지 상을 나누고, 돈·일·사랑·사람·버팀 다섯 자리를 풀어드려요.',
  'face.tip1': '앞머리는 살짝 넘겨주세요',
  'face.tip2': '밝은 곳에서',
  'face.analyze': '관상 보기',
  'face.eyebrow': 'AI 관상',
  'face.why': '왜 이 상인가요',
  'face.caution': '조심할 점',
  'face.partner': '잘 맞는 상',
  'face.shareTitle': '운명을 읽다 · AI 관상 테스트',
  'face.saveTitle': '나의 관상',
  'face.file': '관상',
  'reveal.skip': '건너뛰기',
  'reveal.dots': '얼굴 기준점 478개를 재고 있어요',
  'reveal.zones': '이마·코·턱 세 구간의 비율을 봐요',
  'reveal.palaces': '다섯 자리의 힘을 읽어요',
  'reveal.card': '결과를 준비했어요',
  'reveal.up': '상',
  'reveal.mid': '중',
  'reveal.down': '하',

  // animal page
  'animal.title': '동물상 테스트',
  'animal.heading': '나는 어떤 동물을\n닮았을까?',
  'animal.desc': '사진 한 장으로 보는 동물상 테스트예요. 눈매와 얼굴형으로 강아지상, 고양이상, 여우상 등 13가지 중 가장 닮은 동물을 찾아요.',
  'animal.tip1': '정면 사진이 좋아요',
  'animal.tip2': '밝은 곳에서',
  'animal.analyze': '동물상 찾기',
  'animal.companion': '친구 얼굴이랑 궁합',
  'animal.shareTitle': '운명을 읽다 · 동물상 테스트',
  'animal.saveTitle': '나의 동물상',
  'animal.file': '동물상',
  'animal.match': '닮음',
  'animal.charm': '매력',
  'animal.face': '얼굴',
  'animal.together': '함께',
  'animal.blendTail': '기운도 함께 있어요',
  'animal.seeMore': '풀이 자세히 보기',
  'animal.alsoHint': '느낌도 있어요',
  'animal.features': '분석된 얼굴 특징',
  'animal.personality': '성격',
  'animal.otherSides': '이런 면도 있어요',
  'animal.love': '연애 스타일',
  'animal.best': '잘 맞는 동물상',
  'animal.worst': '맞춰 가면 좋은 동물상',
  'animal.celebs': '같은 동물상 연예인',
  'animal.toFace': 'AI 관상 테스트',
  'animal.toFaceSub': '같은 사진으로 타고난 복과 연애운 보기',

  // next tests
  'next.title': '이 얼굴, 다른 테스트로도 볼까요?',
  'next.sameFace': '같은 사진으로 바로',
  'next.face': '관상으로는?',
  'next.animal': '동물상으로는?',

  // face match page
  'fm.title': '얼굴 궁합 테스트',
  'fm.heading': '우리 둘,\n얼굴 궁합은 몇 점?',
  'fm.desc': '두 사람의 얼굴로 동물상을 찾아 친구·연인·짝사랑 궁합을 알려 드려요.',
  'fm.step1': '두 얼굴 살피는 중',
  'fm.step2': '동물상 맞춰 보는 중',
  'fm.step3': '궁합 계산하는 중',
  'fm.relQuestion': '어떤 사이예요?',
  'fm.relAria': '관계',
  'fm.me': '나',
  'fm.otherFriend': '친구',
  'fm.otherLover': '내 사람',
  'fm.otherCrush': '그 사람',
  'fm.otherDefault': '상대',
  'fm.fixedTail': '결과로 볼게요',
  'fm.pickAria': '사진 고르기',
  'fm.fileAria': '사진 파일',
  'fm.pointsSuffix': '점',
  'fm.photoAlt': '사진',
  'fm.genderAria': '성별',
  'fm.privacy': '사진은 내 폰 안에서만 보고 바로 지워요. 어디에도 올라가지 않아요.',
  'fm.privacyCrush': '그 사람 사진도 내 폰 안에서만 보고 바로 지워요. 어디에도 올라가지 않고, 상대에게 알림도 가지 않아요.',
  'fm.go': '궁합 보기',
  'fm.going': '궁합 보는 중…',
  'fm.needRel': '어떤 사이인지 먼저 골라 주세요',
  'fm.cardSuffix': '궁합',
  'fm.shareTitle': '운명을 읽다 · 얼굴 궁합',
  'fm.file': '얼굴궁합',
  'fm.toAnimal': '내 동물상 자세히 보기',
  'fm.toAnimalSub': '성격·연애 스타일·잘 맞는 동물상',
  'fm.inviteAsk': '도 자기 사진으로 해 보게 할까요?',
  'fm.inviteSend': '초대 링크 보내기',
  'fm.inviteOr': '또는 아래에 사진을 올려도 돼요',

  // home page
  'home.badge': '사진 테스트',
  'home.heroHeading': '내 얼굴에는\n어떤 기운이\n담겨 있을까?',
  'home.heroStart': '시작하기',
  'home.heroSr': ' – 내 관상 보러 가기',
  'home.heroPrivacy': '사진은 저장되지 않아요',
  'home.cardsAria': '테스트 카드',
  'home.faq': '자주 묻는 질문',
  'home.faqAria': '자주 묻는 질문',
  'home.sub': '무료 AI 관상과 내 사주 풀이, 2027 신년운세',
  'all.title': '전체 테스트',
  'all.desc': '사진 한 장, 생년월일, MBTI로 보는 무료 테스트를 모두 모았어요. 글자를 쳐서 바로 찾을 수 있어요.',

  // guide
  'guide.more': '자세히 보기',
  'guide.faq': '자주 묻는 질문',
  'guide.related': '다른 테스트도 해보세요',

  // footer
  'footer.tests': '테스트',

  // menu items
  'item.face2.title': '내 관상 풀이',
  'item.face2.desc': '오행 얼굴형과 삼정으로 읽는 15가지 관상',
  'item.animal.title': '동물상 테스트',
  'item.animal.desc': '강아지상? 고양이상? 13가지 중 하나',
  'item.faceMatch.title': '얼굴 궁합',
  'item.faceMatch.desc': '두 얼굴로 보는 친구·연인·짝사랑 궁합',
  'all.search': '테스트 검색',
  'all.placeholder': '테스트 검색 (예: 관상, 궁합, 부적)',
  'all.none': '맞는 테스트가 없어요. 다른 말로 찾아 보세요.',
};
