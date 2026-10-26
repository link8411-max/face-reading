import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";

// "친구랑 같이 해봐요" 2열 카드. 4번째 칸은 친구 얼굴 궁합(8단계)이 생기기 전까지 MBTI 궁합.
export const PLAY_TOGETHER: { title: string; desc: string; href: string; icon: IconName; bg: string }[] = [
  { title: "관상 테스트", desc: "타고난 복과 연애운", href: "/face2", icon: "face", bg: "#F1EBE2" },
  { title: "동물상 테스트", desc: "고양이상? 여우상?", href: "/animal", icon: "cat", bg: "#F3EBDD" },
  { title: "나는 삼국지 속 누구?", desc: "닮은 장수와 회사생활 스탯", href: "/samguk", icon: "fan", bg: "#E8EEE6" },
  { title: "MBTI 궁합", desc: "우리 둘 궁합은 몇 점?", href: "/mbti/match", icon: "heart", bg: "#E6E8DF" },
];

export default function PlayTogether() {
  return (
    <section aria-labelledby="play-together-title">
      <h2 id="play-together-title" className="font-serif font-bold text-[19px]">친구랑 같이 해봐요</h2>
      <div className="grid grid-cols-2 gap-2.5 mt-3.5">
        {PLAY_TOGETHER.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-[22px] px-4 py-[18px] flex flex-col gap-2.5 min-h-[150px] hover:ring-1 hover:ring-accent/40 transition" style={{ background: c.bg }}>
            <span className="w-11 h-11 rounded-full bg-paper grid place-items-center text-ink">
              <Icon name={c.icon} size={26} />
            </span>
            <span className="text-base font-bold break-keep">{c.title}</span>
            <span className="text-[13px] leading-normal text-muted">{c.desc}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
