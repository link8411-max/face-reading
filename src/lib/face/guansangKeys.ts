// 관상 2판 공용 키. 값과 타입만 두고 로직은 두지 않는다(분류기·문구·화면이 함께 import).
export const SHAPE_KEYS = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
export type ShapeKey = (typeof SHAPE_KEYS)[number];

export const ZONE_KEYS = ['up', 'mid', 'down'] as const;
export type ZoneKey = (typeof ZONE_KEYS)[number];

export type GuansangTypeKey = `${ShapeKey}-${ZoneKey}`;

export const GUANSANG_TYPE_KEYS: readonly GuansangTypeKey[] = SHAPE_KEYS.flatMap((s) =>
  ZONE_KEYS.map((z) => `${s}-${z}` as GuansangTypeKey),
);

export const PALACE_KEYS = ['money', 'work', 'love', 'people', 'base'] as const;
export type PalaceKey = (typeof PALACE_KEYS)[number];

export type PalaceLabel = 'strong' | 'even' | 'grow';

export function isGuansangTypeKey(s: string): s is GuansangTypeKey {
  return (GUANSANG_TYPE_KEYS as readonly string[]).includes(s);
}
