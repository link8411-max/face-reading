import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";

const apiKey = "AIzaSyCltI-V0cYrB71sbi7WhdB-mYQokELViGQ";
const genAI = new GoogleGenerativeAI(apiKey);

// 레퍼런스 이미지 로드
const refImage = fs.readFileSync("/Users/hongseong-il/Downloads/삼국지.webp");
const refBase64 = refImage.toString("base64");

// 출력 폴더
const outputDir = "/Users/hongseong-il/Downloads/samguk_portraits";

// 캐릭터 데이터
const characters = [
  // 위 남성
  { name: "조조", hanja: "曹操", gender: "남", appearance: "날카롭고 깊은 눈매, 짧고 정돈된 수염, 위엄 있는 표정, 강인한 턱선", role: "위나라 창업주", outfit: "dark blue armor with gold trim" },
  { name: "사마의", hanja: "司馬懿", gender: "남", appearance: "길고 가는 눈, 관자놀이가 넓음, 냉정한 인상, 여윈 얼굴", role: "위나라 대도독", outfit: "black scholar robes with silver trim" },
  { name: "장료", hanja: "張遼", gender: "남", appearance: "넓은 이마, 굵은 눈썹, 강인한 체격, 위풍당당한 모습", role: "위나라 명장", outfit: "blue warrior armor" },
  { name: "하후돈", hanja: "夏侯惇", gender: "남", appearance: "한쪽 눈, 강인한 인상, 전투의 흉터, 우락부락한 체격", role: "위나라 맹장", outfit: "blue armor with eyepatch" },
  { name: "허저", hanja: "許褚", gender: "남", appearance: "거대한 체구, 근육질, 험상궂은 얼굴, 단순한 표정", role: "호위무장", outfit: "minimal armor showing muscular build" },
  { name: "전위", hanja: "典韋", gender: "남", appearance: "거대한 체구, 험상궂은 얼굴, 넓은 어깨, 무서운 눈빛", role: "호위무장", outfit: "heavy armor with twin halberds" },
  { name: "순욱", hanja: "荀彧", gender: "남", appearance: "단정하고 귀공자풍, 온화한 눈매, 품위 있는 분위기", role: "위나라 책사", outfit: "elegant blue scholar robes" },
  { name: "곽가", hanja: "郭嘉", gender: "남", appearance: "수척하고 창백한 얼굴, 총명한 눈빛, 자유분방한 차림", role: "위나라 귀재", outfit: "casual scholar robes, wine cup" },
  { name: "가후", hanja: "賈詡", gender: "남", appearance: "평범하고 눈에 띄지 않는 외모, 날카로운 눈, 경계하는 표정", role: "위나라 책사", outfit: "plain dark robes" },
  { name: "장합", hanja: "張郃", gender: "남", appearance: "날렵한 인상, 예리한 눈, 균형 잡힌 체격", role: "위나라 명장", outfit: "blue armor with decorated helmet" },

  // 위 여성
  { name: "변씨", hanja: "卞氏", gender: "여", appearance: "단아하고 우아한 외모, 현명한 눈빛, 검소한 차림", role: "조조의 정실", outfit: "elegant but modest blue hanfu" },
  { name: "장춘화", hanja: "張春華", gender: "여", appearance: "날카로운 눈매, 단호한 표정, 귀족적 분위기", role: "사마의의 아내", outfit: "dark elegant hanfu" },
  { name: "견씨", hanja: "甄氏", gender: "여", appearance: "빼어난 미모, 슬픈 눈빛, 우아하고 청초한 분위기", role: "조비의 황후", outfit: "luxurious imperial hanfu with pearls" },

  // 촉 남성
  { name: "유비", hanja: "劉備", gender: "남", appearance: "큰 귀, 긴 팔, 온화한 눈매, 인자한 표정", role: "촉나라 황제", outfit: "green imperial robes with gold dragon" },
  { name: "관우", hanja: "關羽", gender: "남", appearance: "붉은 얼굴, 긴 수염, 봉황의 눈, 위풍당당한 체격", role: "촉나라 무신", outfit: "green armor, blue dragon blade" },
  { name: "장비", hanja: "張飛", gender: "남", appearance: "표범 같은 머리, 고리눈, 제비 턱, 우렁찬 목소리", role: "촉나라 맹장", outfit: "fierce warrior armor with snake spear" },
  { name: "제갈량", hanja: "諸葛亮", gender: "남", appearance: "학처럼 늘씬한 체형, 맑은 눈, 단정한 수염, 깃털부채", role: "촉나라 승상", outfit: "green silk scholar robes, white feathered fan" },
  { name: "조운", hanja: "趙雲", gender: "남", appearance: "잘생긴 외모, 백마, 은갑, 단정하고 기품 있는 모습", role: "촉나라 명장", outfit: "silver armor on white horse" },
  { name: "마초", hanja: "馬超", gender: "남", appearance: "잘생긴 얼굴, 금빛 갑옷, 백마, 귀공자풍", role: "촉나라 맹장", outfit: "golden armor, white lion helm" },
  { name: "황충", hanja: "黃忠", gender: "남", appearance: "백발, 굳은 의지의 눈빛, 탄탄한 체격, 노련한 분위기", role: "촉나라 노장", outfit: "veteran warrior armor with bow" },
  { name: "위연", hanja: "魏延", gender: "남", appearance: "반골의 상, 사나운 눈빛, 불만스러운 표정", role: "촉나라 장수", outfit: "dark green armor" },
  { name: "강유", hanja: "姜維", gender: "남", appearance: "총명한 눈빛, 단정한 외모, 젊고 패기 있는 모습", role: "촉나라 대장군", outfit: "green military robes" },
  { name: "방통", hanja: "龐統", gender: "남", appearance: "못생긴 외모, 작은 키, 하지만 총명한 눈빛", role: "촉나라 책사", outfit: "plain scholar robes" },

  // 촉 여성
  { name: "황월영", hanja: "黃月英", gender: "여", appearance: "평범한 외모, 총명한 눈빛, 손재주가 좋아 보이는 손", role: "제갈량의 아내", outfit: "practical scholar hanfu" },
  { name: "감부인", hanja: "甘夫人", gender: "여", appearance: "온화하고 인자한 얼굴, 부드러운 눈매, 현숙한 분위기", role: "유비의 부인", outfit: "gentle green hanfu" },
  { name: "미부인", hanja: "糜夫人", gender: "여", appearance: "아름다운 얼굴, 슬픈 눈빛, 연약한 분위기", role: "유비의 부인", outfit: "delicate green hanfu" },
  { name: "손상향", hanja: "孫尚香", gender: "여", appearance: "늠름하고 활달한 외모, 강인한 눈빛, 여전사의 기품", role: "유비의 부인", outfit: "warrior princess armor with bow" },

  // 오 남성
  { name: "손권", hanja: "孫權", gender: "남", appearance: "푸른 눈, 붉은 수염, 당당한 체격", role: "오나라 황제", outfit: "red imperial robes" },
  { name: "주유", hanja: "周瑜", gender: "남", appearance: "빼어난 미모, 우아한 분위기, 풍류를 아는 귀공자", role: "오나라 대도독", outfit: "elegant red armor with musical instrument" },
  { name: "육손", hanja: "陸遜", gender: "남", appearance: "젊고 단정한 외모, 서생 같은 인상, 온화한 분위기", role: "오나라 대도독", outfit: "scholar military robes" },
  { name: "여몽", hanja: "呂蒙", gender: "남", appearance: "강인한 체격, 무인의 풍모지만 지적인 눈빛", role: "오나라 장수", outfit: "red warrior armor with books" },
  { name: "감녕", hanja: "甘寧", gender: "남", appearance: "화려한 차림, 방울 장식, 거친 인상, 해적 같은 분위기", role: "오나라 맹장", outfit: "pirate-style armor with bells" },
  { name: "태사자", hanja: "太史慈", gender: "남", appearance: "건장한 체격, 늠름한 외모, 정의로운 눈빛", role: "오나라 장수", outfit: "archer armor with bow" },
  { name: "노숙", hanja: "魯肅", gender: "남", appearance: "온화한 인상, 부드러운 눈매, 점잖은 분위기", role: "오나라 책사", outfit: "diplomatic robes" },
  { name: "손책", hanja: "孫策", gender: "남", appearance: "잘생긴 외모, 패기 넘치는 눈빛, 젊고 활기찬 모습", role: "오나라 창업주", outfit: "heroic red armor" },

  // 오 여성
  { name: "대교", hanja: "大喬", gender: "여", appearance: "절세미녀, 우아하고 단아한 분위기, 슬픈 눈", role: "손책의 아내", outfit: "elegant red hanfu with flowers" },
  { name: "소교", hanja: "小喬", gender: "여", appearance: "절세미녀, 밝고 화사한 분위기, 음악을 아는 우아함", role: "주유의 아내", outfit: "beautiful red hanfu with musical motifs" },
  { name: "오국태", hanja: "吳國太", gender: "여", appearance: "위엄 있는 노부인, 날카로운 눈빛, 귀족적 품위", role: "손권의 어머니", outfit: "dignified matriarch hanfu" },
  { name: "보련사", hanja: "步練師", gender: "여", appearance: "청초한 미모, 온화한 눈빛, 부드러운 분위기", role: "손권의 후궁", outfit: "graceful red hanfu" },

  // 기타 남성
  { name: "여포", hanja: "呂布", gender: "남", appearance: "압도적 체격, 위압적인 눈빛, 화려한 갑옷", role: "천하제일무장", outfit: "magnificent armor with sky piercer halberd" },
  { name: "동탁", hanja: "董卓", gender: "남", appearance: "비대한 체구, 탐욕스러운 눈, 잔인한 인상", role: "폭군", outfit: "luxurious but gaudy robes" },
  { name: "원소", hanja: "袁紹", gender: "남", appearance: "귀족적 외모, 고고한 분위기, 명문가의 품위", role: "하북의 맹주", outfit: "noble purple armor" },
  { name: "원술", hanja: "袁術", gender: "남", appearance: "기름진 얼굴, 사치스러운 차림, 오만한 표정", role: "참칭 황제", outfit: "overly luxurious imperial robes" },
  { name: "공손찬", hanja: "公孫瓚", gender: "남", appearance: "백마를 탄 늠름한 장수, 북방 전사의 거친 매력", role: "백마장군", outfit: "white armor on white horse" },
  { name: "장각", hanja: "張角", gender: "남", appearance: "도사 복장, 카리스마 있는 눈빛, 신비로운 분위기", role: "황건적 수괴", outfit: "yellow Taoist robes with staff" },
  { name: "화타", hanja: "華佗", gender: "남", appearance: "온화한 노인, 의사의 인자함, 지혜로운 눈", role: "신의", outfit: "physician robes with medicine bag" },
  { name: "유표", hanja: "劉表", gender: "남", appearance: "학자풍의 온화한 외모, 점잖은 분위기", role: "형주목", outfit: "elegant scholarly robes" },
  { name: "맹획", hanja: "孟獲", gender: "남", appearance: "거친 외모, 이국적 복장, 우직한 인상", role: "남만왕", outfit: "exotic tribal king armor" },

  // 기타 여성
  { name: "초선", hanja: "貂蟬", gender: "여", appearance: "삼국지 제일의 미녀, 아름다운 자태, 달빛 같은 피부", role: "절세미녀", outfit: "stunning dance costume" },
  { name: "축융", hanja: "祝融", gender: "여", appearance: "야성적 아름다움, 전사의 강인함, 이국적 외모", role: "남만 여장군", outfit: "tribal warrior armor with throwing knives" },
  { name: "채문희", hanja: "蔡文姬", gender: "여", appearance: "지적인 외모, 슬픈 눈빛, 문인의 우아함", role: "문학가", outfit: "scholarly hanfu with guqin" },
  { name: "동백", hanja: "董白", gender: "여", appearance: "어린 소녀, 순수한 외모, 귀족적 차림", role: "동탁의 손녀", outfit: "young noble girl hanfu" }
];

async function generatePortrait(character, index) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

  const genderStyle = character.gender === "남"
    ? `EXTREMELY HANDSOME male:
- Young, beautiful face (late 20s-30s appearance)
- SLIM face, NOT round or chubby
- Sharp jawline, high cheekbones
- Beautiful intelligent eyes
- Elegant thin eyebrows
- Small refined nose
- Neat beard or clean-shaven
- Long black hair, elegantly styled
- Pale fair skin
- Bishonen/pretty boy aesthetic
- Think: Korean drama actor handsome`
    : `EXTREMELY BEAUTIFUL female:
- Young, beautiful face (early-mid 20s appearance)
- Elegant oval face shape
- Delicate features, high cheekbones
- Beautiful almond-shaped eyes
- Graceful thin eyebrows
- Small refined nose
- Soft pink lips
- Long black hair, beautifully styled
- Pale fair porcelain skin
- Classic Chinese beauty aesthetic
- Think: Korean actress beautiful`;

  const prompt = `Look at the character portrait art style in this reference image from KOEI's Romance of Three Kingdoms game.

Generate a NEW portrait in that SAME painted pixel art style:

Character: ${character.name} (${character.hanja}) - ${character.role}

${genderStyle}

Physical features from history: ${character.appearance}

Outfit: ${character.outfit}

Style: SAME as reference - classic KOEI game portrait with painted/pixel texture, dark background

This should look like an idealized, beautiful portrait from KOEI Sangokushi game - elegant, noble, ${character.gender === "남" ? "handsome hero" : "beautiful heroine"}.`;

  try {
    const result = await model.generateContent({
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/webp", data: refBase64 } },
          { text: prompt }
        ]
      }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
    });

    for (const part of result.response.candidates[0].content.parts) {
      if (part.inlineData) {
        const filePath = `${outputDir}/${character.name}.png`;
        fs.writeFileSync(filePath, Buffer.from(part.inlineData.data, "base64"));
        console.log(`[${index + 1}/${characters.length}] ${character.name} 완료!`);
        return { success: true, name: character.name };
      }
    }
    console.log(`[${index + 1}/${characters.length}] ${character.name}: 이미지 없음`);
    return { success: false, name: character.name, error: "no image" };
  } catch (e) {
    console.error(`[${index + 1}/${characters.length}] ${character.name} 실패:`, e.message);
    return { success: false, name: character.name, error: e.message };
  }
}

async function main() {
  console.log(`총 ${characters.length}명의 캐릭터 초상화 생성 시작...`);
  console.log(`출력 폴더: ${outputDir}\n`);

  // 동시에 5개씩 병렬 처리 (API 제한 고려)
  const batchSize = 5;
  const results = [];

  for (let i = 0; i < characters.length; i += batchSize) {
    const batch = characters.slice(i, i + batchSize);
    console.log(`\n--- 배치 ${Math.floor(i / batchSize) + 1}/${Math.ceil(characters.length / batchSize)} 처리 중 ---`);

    const batchResults = await Promise.all(
      batch.map((char, idx) => generatePortrait(char, i + idx))
    );
    results.push(...batchResults);

    // 배치 사이에 잠시 대기 (rate limit 방지)
    if (i + batchSize < characters.length) {
      console.log("다음 배치 준비 중...");
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // 결과 요약
  const success = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success);

  console.log(`\n========== 완료 ==========`);
  console.log(`성공: ${success}/${characters.length}`);
  if (failed.length > 0) {
    console.log(`실패: ${failed.map(f => f.name).join(", ")}`);
  }
  console.log(`저장 위치: ${outputDir}`);
}

main();
