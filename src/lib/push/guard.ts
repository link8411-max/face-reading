import { createGuard } from '@/lib/duel/feedbackGuard'

// 구독(POST)·해지(DELETE)가 한 한도를 나눠 쓴다
export const pushGuard = createGuard(30)
