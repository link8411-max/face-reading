// English page guides for '/', '/face2', '/animal', '/face-match'.
// Same shape as PageGuideData in src/content/pageGuides.ts ('/' and '/face-match' have no Korean entry yet;
// they follow the same shape). Related links use the Korean route keys; the page adds the /en prefix.
import { GUANSANG_TYPES } from '@/content/en/guansang';
import { GUANSANG_TYPE_KEYS } from '@/lib/face/guansangKeys';
import { animalTypeDB, animalTypeList } from '@/content/en/animal';

export type EnGuideRoute = '/' | '/face2' | '/animal' | '/face-match';

export interface EnGuideData {
  heading: string;
  summary: string;
  intro: string[];
  highlights: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
  related: string[];
  sections?: { heading: string; items: { title: string; body: string; href?: string }[] }[];
}

export const TEST_LINKS_EN: Record<string, { label: string }> = {
  '/face2': { label: 'AI Face Reading' },
  '/animal': { label: 'Animal Face Test' },
  '/face-match': { label: 'Face Match' },
  '/samguk': { label: 'Which Three Kingdoms Hero Are You?' },
  '/fortune': { label: 'Saju New Year Fortune' },
  '/fortune/daily': { label: 'Daily Fortune by Zodiac' },
};

export const pageGuides: Record<EnGuideRoute, EnGuideData> = {
  '/': {
    heading: 'Photo tests and fortunes from Korea, free to try',
    summary: 'Read your face the Korean way: gwansang face reading, an animal-face test and a face match with a friend. Your photo is analyzed in your browser and never uploaded.',
    intro: [
      'unse-ai.com is a Korean web app for photo tests and fortunes. Pick a test, choose a photo, and get a result card you can share or save.',
      'Gwansang is the Korean art of face reading, a long tradition of reading personality from the face. The animal-face test is a very Korean way of describing first impressions: people are called Puppy, Cat or Fox Face. The face match compares two faces for friends, couples or a crush.',
      'Every test and fortune is free with no limit on tries, and you do not need to sign up. Results are for fun, not scientific.',
    ],
    highlights: [
      { title: 'Gwansang face reading', body: 'Find your face type among 15, based on face shape and where the strength of the face sits, plus five life zones: money, work, love, friends and support.' },
      { title: 'Animal face test', body: `Find which of ${animalTypeList.length} animal faces you resemble most, with your personality, love style and best matches.` },
      { title: 'Face match', body: 'Compare two faces as friends, a couple or a crush, and get a match score with a short reading.' },
    ],
    faqs: [
      { q: 'Is my photo saved?', a: 'No. Photos are analyzed inside your browser only. They are never sent to a server or stored.' },
      { q: 'Is it free?', a: 'Yes. Every test is free with no limit on tries, and you do not need to sign up.' },
      { q: 'Are the results scientific?', a: 'No. Gwansang is a traditional way of interpreting faces and the animal-face idea is a fun cultural shorthand. Enjoy the results as entertainment.' },
    ],
    related: ['/face2', '/animal', '/face-match'],
  },

  '/face2': {
    heading: 'Free AI face reading, and how it works',
    summary: 'Measure your eyes, nose, mouth and face shape from one photo, then read personality, early-middle-later life flow and life-area fortunes through traditional gwansang.',
    intro: [
      'Gwansang, the Korean art of face reading, is a traditional East Asian way of reading personality and the flow of fortune from the features of a face. The forehead has long been linked to early life, the nose and cheekbones to midlife, and the mouth and chin to later life, while the eyes are treated as the window of the heart and weighed most heavily.',
      'This AI face reading finds 68 reference points on a face in one photo, then measures eye size and eye-corner direction, nose length and nostril width, mouth size and mouth corners, forehead and chin proportions, and overall face shape. The measurements are matched to traditional gwansang readings for early, middle and later life, and for wealth, love, career, health and people.',
      'It is free with no limit on tries, so feel free to compare the photos of family or friends for fun.',
    ],
    highlights: [
      { title: 'Feature-by-feature readings', body: 'The eyes relate to heart and wisdom, the nose to wealth and self-regard, the mouth to speech and affection, the forehead to early-life fortune and the chin to stability in later life. Each feature gets its own reading.' },
      { title: 'Early, middle and later life', body: 'The face is divided into three parts, upper, middle and lower (samjeong), and each is read with a score for that stage of life.' },
      { title: 'Scores by life area', body: 'Wealth, love, career, health and people each get a score, along with your natural strengths and what to watch for.' },
    ],
    faqs: [
      { q: 'Is my photo saved?', a: 'No. Face analysis happens only inside your browser. The photo is never sent to a server or stored, and it disappears when you close the page.' },
      { q: 'Is it really free? Is there a limit?', a: 'It is completely free with no limit on tries. You do not need to sign up or log in.' },
      { q: 'What kind of photo works best?', a: 'A bright, front-facing photo works best. If your head is turned a lot or part of your face is covered, the reference points are harder to find and results can change.' },
      { q: 'Why do I get different results from different photos?', a: 'Expression, angle and lighting change the measured proportions a little. A neutral, front-facing photo gives the most consistent result.' },
      { q: 'Should I trust the reading?', a: 'Gwansang is a traditional interpretation and has not been scientifically validated. Take it lightly, as a fun prompt for reflecting on yourself.' },
    ],
    related: ['/animal', '/samguk', '/fortune'],
    sections: [
      {
        heading: '15 face reading types',
        items: GUANSANG_TYPE_KEYS.map((k) => ({ title: GUANSANG_TYPES[k].nickname, body: GUANSANG_TYPES[k].oneLiner })),
      },
      {
        heading: 'Reading the face, feature by feature',
        items: [
          { title: 'Eyes', body: 'In gwansang the eyes are the window of the heart and carry the most weight. Eye size and the gap between the eyes change the reading.' },
          { title: 'Nose', body: 'The nose relates to wealth and self-regard. The length of the bridge and the width of the nostrils change the impression and the reading.' },
          { title: 'Mouth', body: 'The mouth relates to speech and affection. Mouth size and lip fullness change the reading.' },
          { title: 'Forehead', body: 'The forehead relates to the flow of early life. Whether it is high or modest in height shifts the impression between intellectual and practical.' },
          { title: 'Chin', body: 'The chin relates to stability in later life. A pointed, round or angular chin gives a delicate, gentle or firm impression.' },
        ],
      },
    ],
  },

  '/animal': {
    heading: 'Animal face test: which animal do you look like?',
    summary: 'Measure your eye shape and face shape to find the animal face you resemble most, with match rate, personality, love style and compatibility.',
    intro: [
      'In Korea, people are often described by animal: Puppy Face, Cat Face, Fox Face. It is a fun way to sum up a first impression in one phrase. Soft, rounded eyes read as a gentle Puppy Face, while upturned, slim eyes read as a poised Cat Face.',
      `This animal face test finds reference points on your face in a photo, measures your eye shape and eye-corner angle, nose and mouth proportions, jawline and face shape, then finds the closest of ${animalTypeList.length} animal faces and a match rate. Each result includes strengths and weaknesses, charm points, love style, best and tricky matches, and celebrities often given the same animal face.`,
      'It is even more fun to compare results with a friend or partner. Check whether your animal faces are a good match too.',
    ],
    highlights: [
      { title: `${animalTypeList.length} animal faces`, body: `Find your closest among ${animalTypeList.map((k) => animalTypeDB[k].name).join(', ')}.` },
      { title: 'Personality and charm', body: 'Each animal face comes with natural strengths, weaknesses and the charm people see in you.' },
      { title: 'Love style and compatibility', body: 'See how you act in love, plus the animal faces you click with and the ones that take more adjusting. Compare with a partner or friend.' },
    ],
    faqs: [
      { q: 'Is my photo saved?', a: 'No. Face analysis happens only inside your browser. The photo is never sent to a server or stored.' },
      { q: 'How many animal faces are there?', a: `${animalTypeList.map((k) => animalTypeDB[k].name).join(', ')}: ${animalTypeList.length} in all.` },
      { q: 'How is the match rate calculated?', a: 'Features such as eye shape, eye-corner angle, nose and mouth proportions, jawline and face shape are scored for how close they are to the typical features of each animal face.' },
      { q: 'My results differ between photos.', a: 'Expression, angle and lighting shift the measurements a little. A neutral, front-facing photo gives the most consistent result.' },
      { q: 'Is it free?', a: 'Yes. It is free with no limit on tries, and you do not need to sign up.' },
    ],
    related: ['/face2', '/samguk', '/fortune/daily'],
    sections: [
      {
        heading: '8 animal faces: which one are you?',
        items: [
          { title: 'Puppy Face', body: 'Big eyes and a round face are the hallmarks. Gentle and bright, an impression that puts even new faces at ease.' },
          { title: 'Cat Face', body: 'Sharp, slightly upturned eyes and a slim face are the hallmarks. A mysterious, poised impression.' },
          { title: 'Fox Face', body: 'Narrow, long eyes and a pointed jawline are the hallmarks. A clever, witty impression.' },
          { title: 'Bear Face', body: 'Large, soft features and a broad face are the hallmarks. A solid, warm impression that feels secure.' },
          { title: 'Rabbit Face', body: 'Big, round eyes and a neat, upturned nose are the hallmarks. A clear, soft impression that is easy to approach.' },
          { title: 'Deer Face', body: 'Clear, long-lashed eyes and a slim face are the hallmarks. An elegant, tidy impression with a quiet presence.' },
          { title: 'Tiger Face', body: 'Distinct eyes and an angular face are the hallmarks. A confident, charismatic impression.' },
          { title: 'Eagle Face', body: 'Deep, sharp eyes and distinct features are the hallmarks. An intense, chic impression that catches the eye.' },
        ],
      },
    ],
  },

  '/face-match': {
    heading: 'Face match: how well do two faces fit?',
    summary: 'Choose your relationship first, then compare the animal faces of two people for a match score and a short reading.',
    intro: [
      'Face match starts with the relationship you want to check: friends, a couple or a crush. Then each person\'s photo is analyzed for an animal face, and the two animal faces are compared.',
      'Scores run from 55 to 100 for each relationship, and the best pair for each relationship scores exactly 100. The same two animal faces and the same relationship always give the same score.',
      'If you start from your own animal face result, your side is already filled in. For friends and couples you can send an invite link that carries only the animal face type, not the photo.',
    ],
    highlights: [
      { title: 'Three relationships', body: 'Friends, couple or crush. The same pair of animal faces can score differently depending on the relationship.' },
      { title: 'Score and short reading', body: 'You get a match score, a result phrase and two lines on how the pair fits together, plus the scores for the other two relationships.' },
      { title: 'Invite a friend', body: 'Friends and couples can send an invite link. A crush match does not make an invite link.' },
    ],
    faqs: [
      { q: 'Is my photo saved?', a: 'No. Photos are analyzed inside your browser only. An invite link carries only the animal face type, never the photo.' },
      { q: 'How is the score decided?', a: 'It is based on the best and tricky matches of each animal face, adjusted for the relationship you chose, then scaled to 55 to 100.' },
      { q: 'Is it free?', a: 'Yes. It is free with no limit on tries, and you do not need to sign up.' },
    ],
    related: ['/animal', '/face2', '/samguk'],
  },
};
