import type { CastKey } from "@/content/cast";
import type { UiKey } from "@/lib/i18n/dict";

// 홈 캐러셀: 캐릭터가 주인공인 큰 카드 여섯 장(순서 고정). 영어판은 열려 있는 세 곳만 쓴다.
export interface HeroSlide {
  cast: CastKey;
  href: string;
  kindKey: UiKey;
  titleKey: UiKey;
  sayKey: UiKey;
  ctaKey: UiKey;
}

const slide = (cast: CastKey, href: string): HeroSlide => ({
  cast, href,
  kindKey: `hero.${cast}.kind` as UiKey,
  titleKey: `hero.${cast}.title` as UiKey,
  sayKey: `hero.${cast}.say` as UiKey,
  ctaKey: `hero.${cast}.cta` as UiKey,
});

export const HOME_HERO: HeroSlide[] = [
  slide("saja", "/saju"),
  slide("gumiho", "/face-match"),
  slide("haetae", "/face2"),
  slide("tiger", "/animal"),
  slide("dokkaebi", "/exam/meme"),
  slide("mudang", "/bujeok"),
];

export const EN_HERO_ROUTES = ["/face2", "/animal", "/face-match"];
