import { notFound } from "next/navigation";
import FaceLab from "./FaceLab";

// 개발 전용: 초상화·테스트 얼굴로 특징 추출과 매칭을 한 번에 점검하는 실험 페이지
export default function FaceLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <FaceLab />;
}
