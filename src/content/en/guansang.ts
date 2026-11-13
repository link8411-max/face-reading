// English copy for the gwansang (face reading) result. Same keys and shape as src/content/guansang.ts.
import type { GuansangTypeKey, PalaceKey, PalaceLabel, ShapeKey, ZoneKey } from '@/lib/face/guansangKeys';
import type { GuansangTypeCopy } from '@/content/guansang';

export const GUANSANG_TYPES: Record<GuansangTypeKey, GuansangTypeCopy> = {
  'wood-up': {
    key: 'wood-up',
    nickname: 'The Early Sprout',
    oneLiner: 'A long face with a strong forehead reads as quick to start, with curiosity leading the way.',
    caution: { situation: 'A year when it is easy to jump to the next new thing before finishing the last one.', action: 'Write down one finish date whenever you start something.' },
    partner: 'water-down',
    partnerLine: 'Water feeds wood, so the Wide as the Sea type can steady your forward-leaning pace.',
  },
  'wood-mid': {
    key: 'wood-mid',
    nickname: 'The Straight Grower',
    oneLiner: 'A tall, straight face with its strength in the middle reads as someone who keeps going on a chosen path.',
    caution: { situation: 'A situation where it is easy to brush off other opinions while racing down the path you picked.', action: 'At the halfway point, ask one person how it looks from outside.' },
    partner: 'water-up',
    partnerLine: 'Water feeds wood, so the Deep Thinker type can help check which way you are heading.',
  },
  'wood-down': {
    key: 'wood-down',
    nickname: 'The Deep Roots',
    oneLiner: 'A long face whose strength runs down to the chin reads as someone who never rushes and roots deeply.',
    caution: { situation: 'A year when it is easy to repeat familiar methods while you settle in.', action: 'Try one thing this month that you have never done before.' },
    partner: 'water-up',
    partnerLine: 'Water feeds wood, so the Deep Thinker type can bring a fresh view to your firm roots.',
  },
  'fire-up': {
    key: 'fire-up',
    nickname: 'The Spark of Ideas',
    oneLiner: 'A wide, open forehead with a slim jawline reads as a mind that lights up with ideas.',
    caution: { situation: 'A situation where it is easy to skip the explanation because speed comes first.', action: 'Add one reason before you say what you want.' },
    partner: 'wood-down',
    partnerLine: 'Wood feeds fire, so the Deep Roots type can turn bright sparks into lasting strength.',
  },
  'fire-mid': {
    key: 'fire-mid',
    nickname: 'The Blazing Now',
    oneLiner: 'Warmth gathered in the middle of the face, between forehead and slim chin, reads as full focus on the present.',
    caution: { situation: 'A year when it is easy to fill the whole schedule on enthusiasm and leave no room to rest.', action: 'Keep one empty slot in your day, every day.' },
    partner: 'wood-up',
    partnerLine: 'Wood feeds fire, so the Early Sprout type can hand fresh fuel to a burning spark.',
  },
  'fire-down': {
    key: 'fire-down',
    nickname: 'The Slow Warmth',
    oneLiner: 'Strength that reaches down into a slim jawline reads as warmth that is kept steady for a long time.',
    caution: { situation: 'A situation where it is easy to hold the heat inside, put off saying it and carry it alone.', action: 'Tell one person about anything hard within a day.' },
    partner: 'wood-up',
    partnerLine: 'Wood feeds fire, so the Early Sprout type can add a new spark to your easygoing warmth.',
  },
  'earth-up': {
    key: 'earth-up',
    nickname: 'The Solid Ground',
    oneLiner: 'A round, generous face with a sturdy forehead reads as someone who builds a base before moving.',
    caution: { situation: 'A year when it is easy to hold off on deciding until you feel certain.', action: 'Set a decision deadline first and research only until that day.' },
    partner: 'fire-down',
    partnerLine: 'Fire hardens earth, so the Slow Warmth type can bring warmth to the ground you have built.',
  },
  'earth-mid': {
    key: 'earth-mid',
    nickname: 'The Full Storehouse',
    oneLiner: 'A round, generous face with its strength in the middle reads as strong at saving and safeguarding.',
    caution: { situation: 'A year when it is easy to start calculating even at moments meant for spending.', action: 'Once a month, pick one purchase that is just for you.' },
    partner: 'fire-up',
    partnerLine: 'Fire hardens earth, so the Spark of Ideas type can shine a light on new uses for what you have stored up.',
  },
  'earth-down': {
    key: 'earth-down',
    nickname: 'The Safe Haven',
    oneLiner: 'A round, generous face that carries down to the chin reads as someone who puts others at ease.',
    caution: { situation: 'A situation where it is easy to give up your own share while looking after other people\'s requests.', action: 'When someone asks for a favor, say you will answer tomorrow.' },
    partner: 'fire-up',
    partnerLine: 'Fire hardens earth, so the Spark of Ideas type can add fresh energy to your comfortable haven.',
  },
  'metal-up': {
    key: 'metal-up',
    nickname: 'The Planner',
    oneLiner: 'A sharply defined outline with a forward forehead reads as someone who draws up the plan first.',
    caution: { situation: 'A year when it is easy to delay acting while polishing the plan.', action: 'Once the plan is roughly set, take the first step.' },
    partner: 'earth-down',
    partnerLine: 'Earth holds and grows metal, so the Safe Haven type can add some breathing room to your designs.',
  },
  'metal-mid': {
    key: 'metal-mid',
    nickname: 'The Decider',
    oneLiner: 'A crisp, defined face with its strength in the middle reads as quick to choose and settle.',
    caution: { situation: 'A situation where it is easy to reach a conclusion fast and leave out the other person\'s circumstances.', action: 'Ask for the other person\'s view once before you announce a decision.' },
    partner: 'earth-up',
    partnerLine: 'Earth holds and grows metal, so the Solid Ground type can give your decisions something to lean on.',
  },
  'metal-down': {
    key: 'metal-down',
    nickname: 'The Keeper to the End',
    oneLiner: 'A crisp, defined jawline with real strength reads as someone who sees every task through.',
    caution: { situation: 'A year when it is easy to hold off asking for help because you want to carry everything yourself.', action: 'Ask someone to take half of the load that feels too heavy.' },
    partner: 'earth-up',
    partnerLine: 'Earth holds and grows metal, so the Solid Ground type can be a sturdy floor for your long haul.',
  },
  'water-up': {
    key: 'water-up',
    nickname: 'The Deep Thinker',
    oneLiner: 'A soft, round face with a forward forehead reads as someone who thinks long and weighs things deeply.',
    caution: { situation: 'A year when it is easy to keep turning a decision over the deeper you think.', action: 'Give a worry one set day, and reach an answer within it.' },
    partner: 'metal-down',
    partnerLine: 'Metal nurtures water, so the Keeper to the End type can carry deep thoughts into action.',
  },
  'water-mid': {
    key: 'water-mid',
    nickname: 'The Connector',
    oneLiner: 'A soft, round face with its strength in the middle reads as someone who links people together.',
    caution: { situation: 'A situation where it is easy to leave out your own opinion while tending to everyone else\'s circumstances.', action: 'At your next gathering, say your own view in one sentence first.' },
    partner: 'metal-up',
    partnerLine: 'Metal nurtures water, so the Planner type can give shape to the flow between people.',
  },
  'water-down': {
    key: 'water-down',
    nickname: 'Wide as the Sea',
    oneLiner: 'A soft, round face that carries down to the chin reads as someone who takes in and holds a lot.',
    caution: { situation: 'A year when it is easy to take on other people\'s worries and push your own work back.', action: 'Finish your own task first, then offer help.' },
    partner: 'metal-up',
    partnerLine: 'Metal nurtures water, so the Planner type can give direction to your big-hearted nature.',
  },
};

export const SHAPE_COPY: Record<ShapeKey, { easy: string; traditional: string; evidence: string }> = {
  wood: { easy: 'A long, straight face', traditional: 'Wood type (mokhyeong)', evidence: 'The face runs long from top to bottom with straight lines, so it reads as a Wood type.' },
  fire: { easy: 'A wide forehead and a slim chin', traditional: 'Fire type (hwahyeong)', evidence: 'The forehead opens wide and the chin tapers, so it reads as a Fire type.' },
  earth: { easy: 'A round, generous face', traditional: 'Earth type (tohyeong)', evidence: 'The face lines are round and stay full down to the chin, so it reads as an Earth type.' },
  metal: { easy: 'A crisp, defined face', traditional: 'Metal type (geumhyeong)', evidence: 'The jawline is angular and the cheekbones and chin are clearly outlined, so it reads as a Metal type.' },
  water: { easy: 'A round, soft face', traditional: 'Water type (suhyeong)', evidence: 'The face lines flow in a curve and the chin follows softly, so it reads as a Water type.' },
};

export const ZONE_COPY: Record<ZoneKey, { easy: string; traditional: string; evidence: string }> = {
  up: { easy: 'A strong-forehead face', traditional: 'Upper zone (sangjeong)', evidence: 'The most strength sits in the forehead, a face that is good at thinking and getting started.' },
  mid: { easy: 'A strong nose-and-cheekbone face', traditional: 'Middle zone (jungjeong)', evidence: 'The strength sits in the middle, around the nose and cheekbones, a face that is good at connecting people and work.' },
  down: { easy: 'A strong-chin face', traditional: 'Lower zone (hajeong)', evidence: 'The strength runs from below the nose down to the chin, a face that is good at enduring and protecting.' },
};

export const PALACE_COPY: Record<PalaceKey, { easy: string; part: string; traditional: string; lines: Record<PalaceLabel, string>; grow: string }> = {
  money: {
    easy: 'Money zone', part: 'Nose', traditional: 'Jaebaekgung',
    lines: {
      strong: 'A long nose bridge and full nostrils read as a face that money tends to stick to.',
      even: 'The nose bridge and nostrils sit in harmony, which reads as steady balance between earning and spending.',
      grow: 'A neat, compact nose reads as someone who saves carefully rather than chasing big gains. Jotting down one line a day about what you spent helps it grow.',
    },
    grow: 'Writing down just one line about the day\'s spending helps your money zone grow noticeably.',
  },
  work: {
    easy: 'Work zone', part: 'Forehead', traditional: 'Gwanrokgung',
    lines: {
      strong: 'A broad, open forehead reads as someone whose presence shows first at work.',
      even: 'A forehead that sits evenly with the rest of the face reads as someone who works through things calmly.',
      grow: 'A neat, gathered forehead gives an impression of working without fuss. Leaving three lines about your day each evening helps it grow.',
    },
    grow: 'Leaving three lines about what you did at the end of each day helps your work zone grow.',
  },
  love: {
    easy: 'Love zone', part: 'Beside the outer eye', traditional: 'Bucheogung',
    lines: {
      strong: 'An open area beside the outer eye reads as a strong ability to express feelings.',
      even: 'An evenly set area beside the outer eye reads as someone who keeps relationships calmly connected.',
      grow: 'A neat, gathered area beside the outer eye gives an impression of keeping feelings close. Saying what you liked out loud first helps it grow.',
    },
    grow: 'Saying aloud one thing you liked, before the other person does, helps your love zone grow.',
  },
  people: {
    easy: 'Friends zone', part: 'Eyebrows', traditional: 'Hyeongjegung',
    lines: {
      strong: 'Long, flowing eyebrows read as a standout gift for drawing people together and leading them.',
      even: 'Eyebrows of even length and texture read as someone who mixes easily with others.',
      grow: 'Neat, gathered eyebrows give an impression of deep friendships with a few people. Sending a quick hello first helps it grow.',
    },
    grow: 'Sending a hello first, once a month, helps your friends zone grow.',
  },
  base: {
    easy: 'Support zone', part: 'Chin', traditional: 'Nobokgung',
    lines: {
      strong: 'A firm jawline reads as dependable, with the strength to hold on to the end.',
      even: 'An evenly flowing jawline reads as someone who keeps their center without wobbling.',
      grow: 'A softly gathered jawline gives a gentle impression. Staying power grows through one simple routine.',
    },
    grow: 'Choosing one simple routine to do at the same time every day helps your support zone grow.',
  },
};

export const LABEL_COPY: Record<PalaceLabel, string> = {
  strong: 'Standout zone',
  even: 'Balanced zone',
  grow: 'Zone that grows with care',
};

export const BALANCED_CHIP = 'An evenly balanced face';
export const FOREHEAD_NOTE = 'Bangs cover your forehead, so the forehead zone is an estimate';
export const DISCLAIMER = 'Gwansang is a long-standing tradition of interpretation, not a scientific diagnosis. This result maps the outline and proportions in your photo onto a traditional framework, just for fun.';
export const SCHOOL_NOTE = 'Different schools classify face shapes a little differently';

export function evidenceText(shape: ShapeKey, zone: ZoneKey): string {
  return `${SHAPE_COPY[shape].evidence} ${ZONE_COPY[zone].evidence}`;
}

export { LEGACY_FACE_KEYS } from '@/content/guansang';
