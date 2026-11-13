// English name/role lines for the six characters in src/content/cast.ts, plus a one-sentence folklore intro each.
import type { CastKey } from '@/content/cast';

export interface CastCopy {
  name: string;
  role: string;
  intro: string;
}

export const CAST_COPY: Record<CastKey, CastCopy> = {
  haetae: { name: 'Haetae', role: 'Looks after face reading', intro: 'Haetae is a lion-like guardian from Korean folklore, said to tell right from wrong and to keep fire and disaster away.' },
  saja: { name: 'Jeoseung Saja', role: 'Looks after Saju and fortunes', intro: 'The Jeoseung Saja is the "messenger of the afterlife" in Korean folklore, a black-robed guide who accompanies souls on their way.' },
  gumiho: { name: 'Gumiho', role: 'Looks after matches', intro: 'The Gumiho is the nine-tailed fox of Korean tales, a shape-shifter famous for charm and cleverness.' },
  mudang: { name: 'Mudang', role: 'Looks after talismans', intro: 'The Mudang is a traditional Korean shaman who holds rites and writes charms to carry people\'s wishes.' },
  tiger: { name: 'Baekho', role: 'Looks after animal faces', intro: 'Baekho is the White Tiger of Korean tradition, one of the four guardian beasts that watch over the directions.' },
  sajaF: { name: 'Little Reaper', role: 'Looks after today\'s fortune', intro: 'The youngest of the Jeoseung Saja, a bright-eyed guide in a black hat who reads out the page for today.' },
  sajaElder: { name: 'Elder Reaper', role: 'Looks after the new-year fortune', intro: 'The senior Jeoseung Saja, a calm guide who keeps the ledger for the whole year ahead.' },
  baksu: { name: 'Baksu Shaman', role: 'Looks after the twelve zodiac signs', intro: 'The Baksu is a male shaman in Korean tradition who rings bells and reads the year for each zodiac sign.' },
  dokkaebi: { name: 'Dokkaebi', role: 'Looks after games and exams', intro: 'The Dokkaebi is a playful goblin from Korean folktales, known for its magic club and love of tricks and contests.' },
};
