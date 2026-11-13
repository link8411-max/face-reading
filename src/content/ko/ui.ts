// 영어 사전(src/content/en/ui.ts)과 같은 키의 한국어 값. 지금 화면에 있는 한국어 그대로 옮겼다.
import type { UiKey } from '@/content/en/ui';

export const UI: Record<UiKey, string> = {
  'tab.home': '홈',
  'tab.all': '전체',
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
  'result.disclaimer': '재미로 보는 결과예요',
};
