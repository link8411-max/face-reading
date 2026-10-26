// 업로드한 사진을 최대 너비로 줄인 JPEG dataURL로 바꾼다.
// 브라우저가 디코딩하지 못하는 파일(HEIC, 손상 파일 등)이면 reject해서 호출부가 안내를 띄우게 한다.
export function compressImage(base64Str: string, maxWidth = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => reject(new Error("이미지를 읽을 수 없어요"));
    img.src = base64Str;
  });
}
