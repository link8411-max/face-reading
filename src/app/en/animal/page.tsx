import AnimalTypePage from "@/app/(ko)/animal/page";
import { EnCopyProvider } from "@/lib/i18n/copy";
import { EN_ANIMALS } from "@/lib/i18n/enCopy";

// 영어판: 한국어 페이지 컴포넌트를 그대로 쓰고, 언어(en)와 영어 결과 문구만 바꾼다.
export default function Page() {
  return (
    <EnCopyProvider copy={{ animals: EN_ANIMALS }}>
      <AnimalTypePage />
    </EnCopyProvider>
  );
}
