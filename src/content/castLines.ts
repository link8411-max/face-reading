// 캐릭터 말풍선 대사의 키와 말하는 캐릭터. 대사 원문은 화면 문구 사전(ko·en ui.ts)에 있다.
// 말투는 docs/design/webtoon/voice-sheet.md: 해태·무당은 해요체, 저승사자·구미호·백호·도깨비는 반말.
import type { CastKey } from '@/content/cast'

export const CAST_LINES = {
  // 사주 (저승사자)
  'say.saju.start': 'saja',
  'say.saju.ask1': 'saja',
  'say.saju.ask2': 'saja',
  'say.saju.ask3': 'saja',
  'say.saju.analyzing': 'saja',
  'say.saju.reveal': 'saja',
  'say.saju.explain': 'saja',
  // 신년운세·오늘의 운세 (저승사자)
  'say.fortune.start': 'saja',
  'say.fortune.analyzing': 'saja',
  'say.fortune.reveal': 'saja',
  // 관상 (해태)
  'say.face2.start': 'haetae',
  'say.face2.ask': 'haetae',
  'say.face2.analyzing': 'haetae',
  'say.face2.reveal': 'haetae',
  'say.face2.explain': 'haetae',
  // 동물상 (백호)
  'say.animal.start': 'tiger',
  'say.animal.analyzing': 'tiger',
  'say.animal.reveal': 'tiger',
  // 얼굴 궁합 (구미호)
  'say.faceMatch.start': 'gumiho',
  'say.faceMatch.ask': 'gumiho',
  'say.faceMatch.analyzing': 'gumiho',
  'say.faceMatch.reveal': 'gumiho',
  // 밈 능력고사 (도깨비)
  'say.exam.start': 'dokkaebi',
  'say.exam.ask': 'dokkaebi',
  'say.exam.reveal': 'dokkaebi',
  // 부적 (무당)
  'say.bujeok.start': 'mudang',
  'say.bujeok.ask': 'mudang',
  'say.bujeok.reveal': 'mudang',
} as const satisfies Record<string, CastKey>

export type LineKey = keyof typeof CAST_LINES
