import type { FeatureKey } from '@/lib/face/landmarkFeatures'

// 삼국지 인물별 얼굴 프로필 (z 단위: 0 = 평균, ±1 = 흔한 차이, ±2 = 뚜렷한 특징)
// 근거는 samgukDB의 appearance와 연의·고전 게임 속 인상. 각 인물 위 주석이 근거다.
//
// 특징 의미 (+ / -)
//   eyeAspect 둥글고 큰 눈 / 가는 눈      eyeTilt 올라간 눈꼬리 / 처진 눈꼬리
//   eyeWidth 긴 눈 / 짧은 눈              eyeSpacing 미간 넓음 / 좁음
//   browGap 눈썹이 눈에서 멂(여유) / 붙음(강렬)   browTilt 치켜올라간 눈썹 / 처진 눈썹
//   noseLength 긴 코 / 짧은 코            noseWidth 넓은 콧볼 / 좁고 오똑한 코
//   mouthWidth 큰 입 / 작은 입            lipFullness 두툼한 입술 / 얇은 입술
//   mouthCornerLift 올라간 입꼬리 / 처진 입꼬리   faceAspect 긴 얼굴 / 넓적한 얼굴
//   jawWidth 각지고 넓은 턱 / 갸름한 턱   chinLength 긴 턱 / 짧은 턱
//   midfaceRatio 긴 중안부 / 짧은 중안부

export interface CharacterProfile {
  z: Partial<Record<FeatureKey, number>>
  weight: Partial<Record<FeatureKey, number>>
}

export const characterProfiles: Record<string, CharacterProfile> = {
  // ===== 위 =====
  // 조조: 날카롭고 깊은 눈매, 강인한 턱선, 위엄 있는 표정
  caocao: {
    z: { eyeTilt: 1.2, eyeAspect: -0.8, browTilt: 1.5, browGap: -1.2, jawWidth: 1.3, mouthCornerLift: -0.6 },
    weight: { browTilt: 1.8, eyeTilt: 1.5, jawWidth: 1.5 },
  },
  // 사마의: 길고 가는 눈, 넓은 관자놀이, 여윈 얼굴, 냉정함
  simayi: {
    z: { eyeAspect: -2, eyeWidth: 1.5, faceAspect: 1.6, jawWidth: -1.4, mouthCornerLift: -0.8, eyeSpacing: 0.8 },
    weight: { eyeAspect: 2, faceAspect: 1.8, jawWidth: 1.5 },
  },
  // 장료: 넓은 이마, 굵은 눈썹(눈에 가까움), 위풍당당
  zhangliao: {
    z: { browGap: -1.6, browTilt: 0.8, jawWidth: 1.2, faceAspect: -0.6, noseWidth: 0.8 },
    weight: { browGap: 2, jawWidth: 1.5 },
  },
  // 하후돈: 강인한 인상, 우락부락, 사나운 눈
  xiaohoudun: {
    z: { browTilt: 2, eyeTilt: 0.8, jawWidth: 1.8, mouthCornerLift: -1.2, noseWidth: 1, faceAspect: -0.8 },
    weight: { browTilt: 2, jawWidth: 1.8 },
  },
  // 허저: 거대한 체구, 험상궂은 얼굴, 단순한 표정
  xuchu: {
    z: { faceAspect: -2, jawWidth: 2, noseWidth: 1.6, eyeWidth: -1, lipFullness: 1, mouthWidth: 0.8 },
    weight: { faceAspect: 2, jawWidth: 1.8, noseWidth: 1.5 },
  },
  // 전위: 거대한 체구, 무서운 눈빛, 넓은 어깨
  dianwei: {
    z: { faceAspect: -1.4, jawWidth: 1.6, eyeAspect: 1.2, browGap: -1.5, browTilt: 1.4, mouthCornerLift: -1.4 },
    weight: { eyeAspect: 1.5, browGap: 1.5, mouthCornerLift: 1.5 },
  },
  // 순욱: 단정한 귀공자풍, 온화한 눈매, 품위
  xunyu: {
    z: { noseWidth: -1.4, browTilt: -0.8, eyeTilt: -0.5, jawWidth: -1, mouthWidth: -0.8, browGap: 0.8 },
    weight: { noseWidth: 1.8, jawWidth: 1.5 },
  },
  // 곽가: 수척하고 창백한 얼굴, 총명한 눈빛, 자유분방
  guojia: {
    z: { faceAspect: 1.4, jawWidth: -1.8, eyeAspect: 1, mouthCornerLift: 1, chinLength: 0.8 },
    weight: { jawWidth: 2, faceAspect: 1.5, mouthCornerLift: 1.5 },
  },
  // 가후: 평범한 외모, 날카로운 눈, 경계하는 표정
  jiaxu: {
    z: { eyeAspect: -1.4, eyeWidth: -1.2, eyeSpacing: -1, mouthWidth: -1.2, lipFullness: -1 },
    weight: { eyeAspect: 1.5, eyeSpacing: 1.5, mouthWidth: 1.5 },
  },
  // 장합: 날렵한 인상, 예리한 눈, 균형 잡힌 체격
  zhanghe: {
    z: { eyeTilt: 1.8, jawWidth: -0.8, noseLength: 1, noseWidth: -0.8, chinLength: 0.8 },
    weight: { eyeTilt: 2, noseLength: 1.5 },
  },
  // 변씨: 단아하고 우아한 외모, 현명한 눈빛, 검소함
  bianshi: {
    z: { browGap: 1.2, eyeTilt: -0.4, mouthWidth: -1, lipFullness: -0.6, faceAspect: 0.6 },
    weight: { browGap: 1.8, mouthWidth: 1.5 },
  },
  // 장춘화: 날카로운 눈매, 단호한 표정, 귀족적
  zhangchunhua: {
    z: { eyeTilt: 2, browTilt: 1.6, eyeAspect: -1, mouthCornerLift: -1.2, noseWidth: -0.8 },
    weight: { eyeTilt: 2, browTilt: 1.8 },
  },
  // 견씨: 빼어난 미모, 슬픈 눈빛, 청초함
  zhenji: {
    z: { eyeAspect: 1.4, eyeTilt: -1.2, browTilt: -1.2, jawWidth: -1.2, lipFullness: 0.6 },
    weight: { eyeTilt: 1.8, browTilt: 1.5, eyeAspect: 1.5 },
  },

  // ===== 촉 =====
  // 유비: 큰 귀, 온화한 눈매, 인자한 표정
  liubei: {
    z: { eyeTilt: -1.2, browTilt: -1, mouthCornerLift: 1.2, browGap: 1, eyeAspect: 0.6, noseWidth: 0.6 },
    weight: { mouthCornerLift: 1.8, eyeTilt: 1.5, browTilt: 1.5 },
  },
  // 관우: 봉황의 눈(길고 위로 올라감), 긴 얼굴(긴 수염), 위풍당당
  guanyu: {
    z: { eyeTilt: 2.2, eyeWidth: 1.8, eyeAspect: -1.4, faceAspect: 1.4, noseLength: 1.2, browTilt: 1 },
    weight: { eyeTilt: 2, eyeWidth: 2, eyeAspect: 1.5 },
  },
  // 장비: 고리눈(둥글고 큰 눈), 제비 턱(넓은 턱), 표범 같은 머리
  zhangfei: {
    z: { eyeAspect: 2.2, eyeWidth: 0.8, jawWidth: 1.8, faceAspect: -1.6, mouthWidth: 1.4, browTilt: 1.2 },
    weight: { eyeAspect: 2, jawWidth: 1.8, faceAspect: 1.5 },
  },
  // 제갈량: 학처럼 늘씬, 맑은 눈, 단정함
  zhugeliang: {
    z: { faceAspect: 1.8, noseLength: 1.2, noseWidth: -1, browGap: 1, eyeAspect: 0.4, jawWidth: -0.8 },
    weight: { faceAspect: 2, noseLength: 1.5 },
  },
  // 조운: 잘생긴 외모, 단정하고 기품 있음
  zhaoyun: {
    z: { noseWidth: -1.2, eyeWidth: 1, jawWidth: 0.6, mouthCornerLift: 0.8, eyeTilt: 0.6, noseLength: 0.8 },
    weight: { noseWidth: 1.5, eyeWidth: 1.5 },
  },
  // 마초: 잘생긴 얼굴, 귀공자풍, 혈기
  machao: {
    z: { eyeTilt: 1, browTilt: 1.2, noseWidth: -1.4, jawWidth: -0.4, eyeAspect: 0.8, chinLength: -0.6 },
    weight: { noseWidth: 1.8, browTilt: 1.5 },
  },
  // 황충: 백발, 굳은 의지의 눈빛, 노련함
  huangzhong: {
    z: { eyeAspect: -1.2, browGap: -1, mouthCornerLift: -1.4, faceAspect: 0.8, noseLength: 1 },
    weight: { mouthCornerLift: 1.8, eyeAspect: 1.5 },
  },
  // 위연: 반골의 상(뒤통수), 사나운 눈빛, 불만스러운 표정
  weiyan: {
    z: { browTilt: 1.8, mouthCornerLift: -2, browGap: -1.2, eyeTilt: 1, jawWidth: 1 },
    weight: { mouthCornerLift: 2, browTilt: 1.8 },
  },
  // 강유: 총명한 눈빛, 단정한 외모, 젊고 패기
  jiangwei: {
    z: { eyeAspect: 1.2, eyeTilt: 1, browGap: 0.6, chinLength: -0.8, jawWidth: -0.6 },
    weight: { eyeAspect: 1.5, eyeTilt: 1.5 },
  },
  // 방통: 못생긴 외모, 작은 키, 총명한 눈빛
  pangtong: {
    z: { faceAspect: -1.6, noseWidth: 1.8, noseLength: -1.2, eyeWidth: -1.2, lipFullness: 1, eyeSpacing: 1 },
    weight: { noseWidth: 2, faceAspect: 1.5, noseLength: 1.5 },
  },
  // 황월영: 평범한 외모, 총명한 눈빛, 솜씨 좋은 인상
  huangyueying: {
    z: { eyeAspect: 1.2, faceAspect: -0.8, noseWidth: 0.8, mouthWidth: 0.8, mouthCornerLift: 0.6 },
    weight: { eyeAspect: 1.5, faceAspect: 1.5 },
  },
  // 감부인: 온화하고 인자한 얼굴, 부드러운 눈매
  ganfuren: {
    z: { eyeTilt: -1.4, mouthCornerLift: 1.2, faceAspect: -1, jawWidth: -0.4, browTilt: -0.8 },
    weight: { eyeTilt: 1.8, mouthCornerLift: 1.5 },
  },
  // 미부인: 아름다운 얼굴, 슬픈 눈빛, 연약함
  mifuren: {
    z: { browTilt: -1.8, mouthCornerLift: -1, jawWidth: -1.4, faceAspect: 0.8, mouthWidth: -0.8 },
    weight: { browTilt: 2, jawWidth: 1.5 },
  },
  // 손상향: 늠름하고 활달, 강인한 눈빛, 여전사
  sunshangxiang: {
    z: { browTilt: 1.6, eyeTilt: 1.2, mouthWidth: 1.2, mouthCornerLift: 1, jawWidth: 0.8 },
    weight: { browTilt: 1.8, mouthWidth: 1.5 },
  },

  // ===== 오 =====
  // 손권: 푸른 눈, 붉은 수염, 당당한 체격 (네모난 턱, 큰 입)
  sunquan: {
    z: { jawWidth: 1.6, mouthWidth: 1.6, faceAspect: -0.6, eyeSpacing: 1, noseWidth: 0.6 },
    weight: { mouthWidth: 1.8, jawWidth: 1.5, eyeSpacing: 1.5 },
  },
  // 주유: 빼어난 미모, 우아함, 풍류 아는 귀공자
  zhouyu: {
    z: { noseWidth: -1.8, eyeWidth: 1.4, eyeTilt: 0.8, lipFullness: -0.6, jawWidth: -1, noseLength: 0.8 },
    weight: { noseWidth: 2, eyeWidth: 1.5 },
  },
  // 육손: 젊고 단정한 외모, 서생 같은 인상, 온화함
  luxun: {
    z: { chinLength: -1.2, faceAspect: -0.4, browGap: 1.2, eyeTilt: -0.6, mouthWidth: -1, lipFullness: -0.6 },
    weight: { chinLength: 1.5, browGap: 1.5 },
  },
  // 여몽: 무인의 풍모, 지적인 눈빛
  lvmeng: {
    z: { jawWidth: 1.4, browGap: -0.8, eyeAspect: 0.8, faceAspect: -0.4, noseLength: -0.8 },
    weight: { jawWidth: 1.5, eyeAspect: 1.5 },
  },
  // 감녕: 화려한 차림, 거친 인상, 해적 같은 분위기 (짓궂은 입꼬리)
  ganning: {
    z: { mouthCornerLift: 1.8, browTilt: 1.4, mouthWidth: 1, eyeTilt: 0.8, noseWidth: 0.8 },
    weight: { mouthCornerLift: 2, browTilt: 1.5 },
  },
  // 태사자: 건장한 체격, 늠름한 외모, 정의로운 눈빛
  taishici: {
    z: { eyeAspect: 1, jawWidth: 1.2, browGap: -0.6, noseLength: 1, eyeSpacing: -0.8 },
    weight: { eyeAspect: 1.5, jawWidth: 1.5 },
  },
  // 노숙: 온화한 인상, 부드러운 눈매, 점잖음
  lusu: {
    z: { eyeTilt: -1, browTilt: -1.2, faceAspect: -1.2, lipFullness: 0.8, mouthCornerLift: 0.4, browGap: 0.8 },
    weight: { browTilt: 1.5, faceAspect: 1.5 },
  },
  // 손책: 잘생긴 외모, 패기 넘치는 눈빛, 젊고 활기참
  sunce: {
    z: { eyeAspect: 1.4, mouthCornerLift: 1.4, eyeTilt: 1.2, chinLength: -0.6, mouthWidth: 0.6 },
    weight: { mouthCornerLift: 1.5, eyeAspect: 1.5, eyeTilt: 1.5 },
  },
  // 대교: 절세미녀, 단아함, 슬픈 눈
  daqiao: {
    z: { eyeTilt: -0.8, eyeWidth: 1.2, noseWidth: -1.2, lipFullness: 0.8, browGap: 1, faceAspect: 0.4 },
    weight: { eyeWidth: 1.5, noseWidth: 1.5 },
  },
  // 소교: 절세미녀, 밝고 화사함
  xiaoqiao: {
    z: { mouthCornerLift: 1.8, eyeAspect: 1.4, faceAspect: -1, chinLength: -1, noseWidth: -0.8 },
    weight: { mouthCornerLift: 2, eyeAspect: 1.5 },
  },
  // 오국태: 위엄 있는 노부인, 날카로운 눈빛, 귀족적 품위
  wuguotai: {
    z: { eyeAspect: -1.2, browTilt: 1, mouthCornerLift: -1.4, noseLength: 1.2, jawWidth: 0.8 },
    weight: { mouthCornerLift: 1.5, noseLength: 1.5 },
  },
  // 보련사: 청초한 미모, 온화한 눈빛, 부드러움
  bujianying: {
    z: { eyeTilt: -1.2, eyeAspect: 0.8, mouthWidth: -1.2, jawWidth: -1, lipFullness: -0.4 },
    weight: { eyeTilt: 1.5, mouthWidth: 1.5 },
  },

  // ===== 기타 =====
  // 여포: 압도적 체격, 위압적인 눈빛
  lvbu: {
    z: { browTilt: 2, eyeTilt: 1.6, browGap: -1.8, jawWidth: 1.4, noseLength: 1, eyeAspect: 0.6 },
    weight: { browTilt: 2, browGap: 1.8, eyeTilt: 1.5 },
  },
  // 동탁: 비대한 체구, 탐욕스러운 눈, 잔인한 인상
  dongzhuo: {
    z: { faceAspect: -2.2, eyeWidth: -1.6, eyeAspect: -1, lipFullness: 1.6, noseWidth: 1.4, jawWidth: 1 },
    weight: { faceAspect: 2, eyeWidth: 1.8, lipFullness: 1.5 },
  },
  // 원소: 귀족적 외모, 고고한 분위기
  yuanshao: {
    z: { noseLength: 1.6, noseWidth: -1, faceAspect: 1, browGap: 1, mouthCornerLift: -0.6 },
    weight: { noseLength: 2, browGap: 1.5 },
  },
  // 원술: 기름진 얼굴, 오만한 표정
  yuanshu: {
    z: { faceAspect: -1.2, lipFullness: 1.4, mouthCornerLift: -1, eyeAspect: -1, chinLength: -1 },
    weight: { lipFullness: 1.8, faceAspect: 1.5 },
  },
  // 공손찬: 백마 장수, 북방 전사의 거친 매력
  gongsunzan: {
    z: { jawWidth: 1.4, noseLength: 1.2, eyeTilt: 1, eyeSpacing: -1.2, faceAspect: 0.6 },
    weight: { eyeSpacing: 1.5, jawWidth: 1.5 },
  },
  // 장각: 도사, 카리스마 있는 눈빛, 신비로움
  zhangjiao: {
    z: { eyeAspect: 1.6, eyeSpacing: 1.4, faceAspect: 1.2, browGap: 1.4, mouthWidth: -0.8 },
    weight: { eyeSpacing: 1.8, eyeAspect: 1.5, browGap: 1.5 },
  },
  // 화타: 온화한 노인, 의사의 인자함, 지혜로운 눈
  huatuo: {
    z: { eyeTilt: -1.6, browTilt: -1.4, mouthCornerLift: 0.8, faceAspect: 1, chinLength: 1 },
    weight: { eyeTilt: 1.8, browTilt: 1.5 },
  },
  // 유표: 학자풍의 온화한 외모, 점잖음
  liubiao: {
    z: { browGap: 1.6, faceAspect: 0.8, mouthWidth: -0.8, eyeTilt: -0.4, midfaceRatio: 1 },
    weight: { browGap: 2, midfaceRatio: 1.5 },
  },
  // 맹획: 거친 외모, 이국적, 우직함
  menghuo: {
    z: { noseWidth: 2, lipFullness: 1.6, jawWidth: 1.6, faceAspect: -1.2, eyeSpacing: 0.8 },
    weight: { noseWidth: 2, lipFullness: 1.8 },
  },
  // 초선: 삼국지 제일의 미녀, 아름다운 자태
  diaochan: {
    z: { eyeWidth: 1.6, eyeTilt: 1, noseWidth: -1.4, jawWidth: -1.6, lipFullness: 0.8, chinLength: 0.6 },
    weight: { eyeWidth: 1.8, jawWidth: 1.8 },
  },
  // 축융: 야성적 아름다움, 전사의 강인함, 이국적
  zhurong: {
    z: { browTilt: 1.8, mouthWidth: 1.4, lipFullness: 1.2, jawWidth: 1, eyeTilt: 1 },
    weight: { browTilt: 1.8, mouthWidth: 1.5 },
  },
  // 채문희: 지적인 외모, 슬픈 눈빛, 문인의 우아함
  caiwenji: {
    z: { faceAspect: 1.4, browGap: 1.4, eyeTilt: -1, noseLength: 1, mouthCornerLift: -0.6 },
    weight: { faceAspect: 1.5, browGap: 1.5 },
  },
  // 동백: 어린 소녀, 순수한 외모
  dongbai: {
    z: { faceAspect: -1.6, eyeAspect: 1.8, chinLength: -1.6, noseLength: -1.2, midfaceRatio: -1 },
    weight: { eyeAspect: 2, faceAspect: 1.5, chinLength: 1.5 },
  },
}
