// English copy for the animal-face test. Same keys and shape as src/lib/animalTypeDB.ts.
// Emoji values are kept identical to the Korean data (they are data, not copy).
import type { AnimalType } from '@/lib/animalTypeDB';

export const animalTypeDB: Record<string, AnimalType> = {
  dog: {
    name: 'Puppy Face',
    emoji: '🐶',
    title: 'The friendly, lively Puppy Face',
    description: 'You carry bright, positive energy and tend to be the mood-maker who gets everyone smiling. Big eyes and a round face shape give a pure, easy-to-like impression.',
    personality: {
      positive: ['Friendly', 'Lively', 'Loyal', 'Optimistic', 'Sociable'],
      negative: ['Scatterbrained', 'Jealous streak', 'Simple-minded', 'Short on patience'],
    },
    charm: 'A sociable nature that makes friends fast, and a pure, open charm',
    loveStyle: 'Once you like someone, you go straight for it. Active and honest in showing feelings, loyal and devoted to a partner.',
    compatibility: {
      best: ['Bear Face', 'Rabbit Face'],
      worst: ['Cat Face', 'Fox Face'],
    },
    celebrities: ['Suzy', 'IU', 'Cha Eun-woo', 'Park Bo-gum'],
  },

  cat: {
    name: 'Cat Face',
    emoji: '🐱',
    title: 'The poised, mysterious Cat Face',
    description: 'Sharp eyes and a slim face shape are your signature. A mysterious air draws people\'s attention. You are independent, yet quietly warm with the people close to you.',
    personality: {
      positive: ['Mysterious', 'Independent', 'Intellectual', 'Refined', 'Self-assured'],
      negative: ['Seems aloof', 'Picky', 'Moody', 'Guarded'],
    },
    charm: 'A mysterious, poised charm that is not easy to approach',
    loveStyle: 'You act cool but are warm inside. A master of push and pull, and once your heart opens, you give it your all.',
    compatibility: {
      best: ['Fox Face', 'Deer Face'],
      worst: ['Puppy Face', 'Bear Face'],
    },
    celebrities: ['Jennie', 'Kim Tae-hee', 'Won Bin', 'Gong Yoo'],
  },

  fox: {
    name: 'Fox Face',
    emoji: '🦊',
    title: 'The clever, sharp Fox Face',
    description: 'Narrow, sharp eyes and a pointed jawline are the hallmarks. You give off a clever, witty impression, read the room quickly and judge situations well.',
    personality: {
      positive: ['Clever', 'Quick-witted', 'Adaptable', 'Good talker', 'Analytical'],
      negative: ['Calculating', 'Suspicious', 'Sensitive', 'Hard to read'],
    },
    charm: 'A quick wit with words, and a gaze that seems to see right through people',
    loveStyle: 'Strategic even in love. Skilled at push and pull, and you take the lead. You do not open up easily, but fall deeply when it is real.',
    compatibility: {
      best: ['Cat Face', 'Tiger Face'],
      worst: ['Puppy Face', 'Bear Face'],
    },
    celebrities: ['Han Ye-seul', 'Song Hye-kyo', 'Hyun Bin', 'Lee Jong-suk'],
  },

  bear: {
    name: 'Bear Face',
    emoji: '🐻',
    title: 'The cozy, dependable Bear Face',
    description: 'Large, soft features and a broad face shape are the hallmarks. A solid, warm impression gives people a sense of security. You are the type who is comfortable to be around.',
    personality: {
      positive: ['Reliable', 'Warm', 'Patient', 'Big-hearted', 'Trustworthy'],
      negative: ['Easygoing to a fault', 'Blunt', 'Stubborn', 'Reserved in expressing feelings'],
    },
    charm: 'A warm presence that anyone can lean on',
    loveStyle: 'You show it through actions more than words. Once together, you last, and you protect your partner reliably.',
    compatibility: {
      best: ['Puppy Face', 'Rabbit Face'],
      worst: ['Cat Face', 'Fox Face'],
    },
    celebrities: ['Ma Dong-seok', 'Yoo Jae-suk', 'Jun Hyun-moo', 'Yoona'],
  },

  rabbit: {
    name: 'Rabbit Face',
    emoji: '🐰',
    title: 'The clear-eyed, gentle Rabbit Face',
    description: 'Big, round eyes and a neat, upturned nose are the hallmarks. A clear, gentle impression makes even people you have just met feel at ease. You have a soft, tender atmosphere.',
    personality: {
      positive: ['Gentle', 'Bright', 'Approachable', 'Pure-hearted', 'Delicate'],
      negative: ['Timid', 'Easily startled', 'Indecisive', 'Dependent'],
    },
    charm: 'A gentle charm that puts people at ease just by being nearby',
    loveStyle: 'Tender and honest in showing feelings. You look after a partner with care and give back as much love as you receive.',
    compatibility: {
      best: ['Bear Face', 'Puppy Face'],
      worst: ['Tiger Face', 'Eagle Face'],
    },
    celebrities: ['Irene', 'Seolhyun', 'Jung Hae-in', 'Park Seo-joon'],
  },

  deer: {
    name: 'Deer Face',
    emoji: '🦌',
    title: 'The clear-eyed, graceful Deer Face',
    description: 'Bright, soulful eyes and a slim face shape are the hallmarks. An elegant, tidy atmosphere gives a refined impression. You are quiet, but your presence is felt.',
    personality: {
      positive: ['Graceful', 'Delicate', 'Calm', 'Sensitive', 'Considerate'],
      negative: ['Introverted', 'Easily startled', 'Sensitive to stress', 'Slow to decide'],
    },
    charm: 'A clear, clean atmosphere and a quiet kind of beauty',
    loveStyle: 'You dream of a romantic relationship. Emotional and delicate, you are moved even by little things.',
    compatibility: {
      best: ['Cat Face', 'Puppy Face'],
      worst: ['Tiger Face', 'Fox Face'],
    },
    celebrities: ['Im Yoon-ah', 'Han Ga-in', 'Lee Min-ho', 'Song Kang'],
  },

  tiger: {
    name: 'Tiger Face',
    emoji: '🐯',
    title: 'The strong, confident Tiger Face',
    description: 'Sharp eyes and an angular face shape are the hallmarks. A charismatic, confident impression carries a sense of leadership. You are the type who commands presence anywhere.',
    personality: {
      positive: ['Charismatic', 'Leader', 'Confident', 'Driven', 'Decisive'],
      negative: ['Forceful', 'Set in your views', 'Hasty', 'Takes charge too much'],
    },
    charm: 'Overflowing charisma and a commanding presence',
    loveStyle: 'You take the lead in love too. You approach actively and guide your partner, with a strong protective instinct.',
    compatibility: {
      best: ['Fox Face', 'Eagle Face'],
      worst: ['Rabbit Face', 'Deer Face'],
    },
    celebrities: ['Kim Hye-soo', 'Jun Ji-hyun', 'Lee Byung-hun', 'Jung Woo-sung'],
  },

  eagle: {
    name: 'Eagle Face',
    emoji: '🦅',
    title: 'The charismatic, sharp Eagle Face',
    description: 'Deep, sharp eyes and distinct features are the hallmarks. An intense, chic impression comes with an aura that is hard to approach. You have an eye for sizing people up at a glance.',
    personality: {
      positive: ['Insightful', 'Decisive', 'Focused', 'Ambitious', 'Confident'],
      negative: ['Cool-headed to a fault', 'Perfectionist', 'Solitary', 'Uncompromising'],
    },
    charm: 'A charisma that is hard to approach, and a piercing gaze',
    loveStyle: 'You do not give your heart easily, but once you fall, you fall deeply. You try to protect a partner completely.',
    compatibility: {
      best: ['Tiger Face', 'Fox Face'],
      worst: ['Rabbit Face', 'Puppy Face'],
    },
    celebrities: ['Kim Soo-hyun', 'Lee Young-ae', 'Hyun Bin', 'Son Ye-jin'],
  },
};

export const animalTypeList = Object.keys(animalTypeDB);
