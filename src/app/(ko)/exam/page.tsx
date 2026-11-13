import { redirect } from 'next/navigation'

// 과목이 밈 하나뿐인 동안은 바로 보낸다. 과목이 늘면 과목 고르기 화면으로 바꾼다.
export default function ExamIndex() {
  redirect('/exam/meme')
}
