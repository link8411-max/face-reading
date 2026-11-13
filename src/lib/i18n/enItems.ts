// 영어판에 있는 테스트 목록(홈 카드·다른 테스트 둘러보기). 제목·설명은 src/content/en/ui.ts, 썸네일은 한국어 메뉴 데이터를 재사용한다.
// 클라이언트 번들에도 들어가므로 큰 문구 파일(pageGuides 등)은 가져오지 않는다.
import { ALL_ITEMS, type CategoryItem } from "@/content/navigation";
import { castForHref, CAST } from "@/content/cast";
import { t, type UiKey } from "@/lib/i18n/dict";
import { localePath } from "@/lib/i18n/locales";

const ROUTES: { route: string; title: UiKey; desc: UiKey }[] = [
  { route: "/face2", title: "item.face2.title", desc: "item.face2.desc" },
  { route: "/animal", title: "item.animal.title", desc: "item.animal.desc" },
  { route: "/face-match", title: "item.faceMatch.title", desc: "item.faceMatch.desc" },
];

export const EN_ITEMS: CategoryItem[] = ROUTES.map(({ route, title, desc }) => {
  const src = ALL_ITEMS.find((i) => i.href === route)!;
  const key = castForHref(route);
  return {
    ...src,
    title: t("en", title),
    desc: t("en", desc),
    href: localePath("en", route),
    thumb: key ? { ...src.thumb, alt: `${CAST[key].en} ${t("en", "cast.alt")}` } : src.thumb,
    group: undefined,
    chip: undefined,
  };
});
