import ExamGame from '@/components/exam/ExamGame'
import rounds from '@/content/exam/meme-rounds.json'
import type { Round } from '@/lib/exam/types'

export default function ExamMemePage() {
  return (
    <main className="mx-auto max-w-lg px-[22px] pt-8 pb-10">
      <h1 className="font-serif text-[27px] font-bold leading-[1.3]">밈 능력고사</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted break-keep">매일 5문제로 신조어·밈·레트로 유행어를 얼마나 아는지 확인해 보세요. 자정(한국 시간)에 새 문제가 열려요.</p>
      <ExamGame rounds={rounds.rounds as unknown as Round[]} />
    </main>
  )
}
