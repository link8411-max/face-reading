// English copy for Face Match. Mirrors the user-facing strings of src/lib/faceMatch/compat.ts
// (slot.ts has no user-facing strings). Scoring stays in compat.ts; this file only holds words.
import type { Rel } from '@/lib/faceMatch/compat';

export const REL_NAME: Record<Rel, string> = { friend: 'Friends', lover: 'Couple', crush: 'Crush' };

/** Result phrase by score tier. Same thresholds as compat.ts: 95, 85, 75, 65, below. */
export const LABELS: Record<Rel, [string, string, string, string, string]> = {
  friend: ['Soulmates', 'A perfect fit', 'A great pair', 'Learning from each other', 'Shines with effort'],
  lover: ['Soulmates', 'A perfect fit', 'A great pair', 'Learning from each other', 'Shines with effort'],
  crush: ['A fated connection', 'Worth confessing', 'Best taken slowly', 'Getting to know each other', 'Time is on your side'],
};

export const CLOSING: Record<Rel, [string, string, string]> = {
  friend: ['The conversation never runs dry when you are together.', 'You are each other\'s steady support.', 'The longer you know each other, the easier it gets.'],
  lover: ['A warm bond where you cherish each other as you are.', 'You keep being drawn to each other, and the spark lasts.', 'The more you adjust to each other, the stronger you get.'],
  crush: ['The vibe says a warm answer may come if you share your feelings.', 'A chance to get closer will come naturally, and soon.', 'Steady attention is the key that opens a heart.'],
};

export const HEADLINE = {
  crush: (score: number) => `Crush match: ${score}%`,
  other: (rel: Rel, score: number) => `${REL_NAME[rel]} match: ${score} points`,
};

export const FIRST_LINE = {
  same: (animal: string, trait: string) => `You are both ${animal}s, so you click right away over being ${trait.toLowerCase()}.`,
  different: (animalA: string, traitA: string, animalB: string, traitB: string) =>
    `The ${traitA.toLowerCase()} side of a ${animalA} meets the ${traitB.toLowerCase()} side of a ${animalB}, and you complete each other.`,
};
