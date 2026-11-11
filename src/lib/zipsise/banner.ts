// 집시세 배너의 클라이언트 안전 값(서버 전용 highs.ts에서 분리). 이 파일은 서버 모듈을 가져오지 않는다.
export interface WeeklyHigh {
  aptName: string
  regionName: string
  /** 예: '15억 9,500만' */
  amountText: string
  /** 이전 최고가보다 오른 금액. 예: '+1억 500만' */
  jumpText: string
  /** 계약일 YYYY-MM-DD */
  dealDate: string
}

export const HOUSE_BANNER_URL = 'https://zipsise.com/highs?utm_source=unse&utm_medium=banner&utm_campaign=bujeok'
export const HOUSE_BANNER_SLOT = 'bujeok'
