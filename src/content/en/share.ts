// English first-person share lines and landing-page copy for result links (Korean originals live in src/lib/shareLinks.ts).
import type { Rel } from '@/lib/faceMatch/compat';

export const SHARE_PHRASE = {
  face: (nickname: string) => `I got "${nickname}" in my face reading. What does your face say?`,
  animal: (name: string, score: number) => `I'm ${score}% ${name}. Which animal are you?`,
  faceMatch: (rel: Rel, relName: string, score: number) =>
    rel === 'crush' ? `My crush match came out at ${score}%. Want to try yours?` : `Our ${relName.toLowerCase()} match is ${score} points. Want to try yours?`,
};

/** Landing-page lines for a shared result */
export const LANDING = {
  faceTitle: (nickname: string) => `Someone got "${nickname}" in the AI face reading`,
  animalTitle: (name: string, score: number) => `Someone is ${score}% ${name}`,
  faceMatchTitle: (headline: string) => `Face match result: ${headline}`,
  cta: 'Try it yourself',
  ctaSub: 'Free, no sign-up. Your photo never leaves your phone.',
  note: 'Just for fun. Not scientific.',
};
