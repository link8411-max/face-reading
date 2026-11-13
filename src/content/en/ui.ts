// Flat dictionary of UI strings for the English pages.
export const UI = {
  // bottom tabs
  'tab.home': 'Home',
  'tab.all': 'All',
  'tab.today': 'Today',

  // chips
  'chip.all': 'All',
  'chip.face': 'Face',
  'chip.fortune': 'Fortune',
  'chip.match': 'Match',
  'chip.play': 'Play',

  // buttons
  'btn.start': 'Start',
  'btn.choosePhoto': 'Choose a photo',
  'btn.analyze': 'Analyze',
  'btn.share': 'Share',
  'btn.saveImage': 'Save image',
  'btn.tryAgain': 'Try again',
  'btn.seeAll': 'See all',
  'btn.tryAnother': 'Try another test',

  // gender pills
  'gender.label': 'I am',
  'gender.female': 'Female',
  'gender.male': 'Male',

  // photo tips
  'tips.title': 'For the best result',
  'tips.front': 'Face the camera straight on',
  'tips.light': 'Use bright, even light',
  'tips.clear': 'Keep hair and glasses out of the way of your eyes and forehead',

  // privacy
  'privacy.line': 'Your photo never leaves your phone',

  // analyzing steps
  'analyzing.step1': 'Finding your face',
  'analyzing.step2': 'Measuring your features',
  'analyzing.step3': 'Writing your reading',

  // language banner and switcher
  'lang.viewInEnglish': 'View this page in English',
  'lang.readInEnglish': 'Read in English',
  'lang.koreanOnly': 'This page is only in Korean',
  'lang.switch': 'Language',

  // result card
  'result.watermark': 'Read your fate · unse-ai.com',
  'result.disclaimer': 'Just for fun. Not scientific.',
} as const;

export type UiKey = keyof typeof UI;
