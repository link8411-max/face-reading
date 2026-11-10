// 얼린 회차(src/content/exam/<과목>-rounds.json)의 뒤에 새 회차를 덧붙인다. 이미 있는 회차는 다시 만들지 않는다(대결 링크가 옛 회차를 가리킨다).
//   npx tsx --tsconfig tsconfig.json scripts/exam/make-rounds.ts --add=14        14회차를 덧붙여 저장
//   npx tsx --tsconfig tsconfig.json scripts/exam/make-rounds.ts --add=14 --print  저장 없이 출력만
//   --subject=<과목>  기본 meme
import fs from 'node:fs'
import path from 'node:path'
import { makeRound, replayUsed } from '../../src/lib/exam/rounds'
import type { Card, Round } from '../../src/lib/exam/types'

const root = path.resolve(__dirname, '../..')
const argv = process.argv.slice(2)
const opt = (k: string, d: string) => (argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=')[1]
const subject = opt('subject', 'meme')
const add = Number(opt('add', '14'))
const printOnly = argv.includes('--print')

const cardsPath = path.join(root, 'src/content/exam', `${subject}-cards.json`)
const roundsPath = path.join(root, 'src/content/exam', `${subject}-rounds.json`)
const cards = (JSON.parse(fs.readFileSync(cardsPath, 'utf8')) as { cards: Card[] }).cards
const rounds: Round[] = fs.existsSync(roundsPath) ? (JSON.parse(fs.readFileSync(roundsPath, 'utf8')) as { rounds: Round[] }).rounds : []

const used = replayUsed(rounds)
const added: Round[] = []
for (let i = 0; i < add; i++) {
  const n = rounds.length + added.length + 1
  const rd = makeRound(n, cards, used)
  if (!rd) { console.log(`${n}회차는 카드가 모자라 만들 수 없다. 카드를 더 쓴 뒤 다시 돌린다.`); break }
  added.push(rd)
}

for (const rd of added) {
  console.log(`\n# ${rd.round}회차`)
  rd.questions.forEach((q, i) => {
    console.log(`${i + 1}. [${q.badge} · 난이도 ${q.level} · ${q.type}] ${q.term}${q.ask ? ' — ' + q.ask : ''}${q.show ? ` / "${q.show}"` : ''}`)
    q.options.forEach((o, j) => console.log(`   ${j === q.answer ? '●' : '○'} ${o}`))
  })
}
console.log(`\n카드 ${cards.length}장, 기존 ${rounds.length}회차 + 새 ${added.length}회차`)
if (!printOnly && added.length) {
  fs.writeFileSync(roundsPath, JSON.stringify({ subject, rounds: [...rounds, ...added] }, null, 2) + '\n')
  console.log('저장: ' + path.relative(root, roundsPath))
}
