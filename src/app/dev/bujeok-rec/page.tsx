import { notFound } from "next/navigation";
import BujeokRec from "./BujeokRec";

// 개발 전용: 캔버스 애니메이션을 MediaRecorder로 녹화할 수 있는지 기기별로 시험하는 페이지 (production 404)
export default function BujeokRecPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <BujeokRec />;
}
