// convert-to-webp.js
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// 이미지가 위치한 폴더
const imagesDir = './public/images';

async function convertToWebp() {
  console.log('🚀 이미지 WebP 변환 및 최적화를 시작합니다...');

  try {
    const files = fs.readdirSync(imagesDir);
    let count = 0;

    for (const file of files) {
      // 1. 이미 WebP인 파일은 건너뜀
      if (file.endsWith('.webp')) continue;

      // 2. 이미지 파일인지 확인 (png, jpg, jpeg 등 대소문자 무시)
      if (!file.match(/\.(png|jpg|jpeg|PNG|JPG|JPEG)$/)) continue;

      const inputPath = path.join(imagesDir, file);
      
      // 확장자를 .webp로 변경한 파일명 생성
      const fileNameWithoutExt = path.parse(file).name;
      const outputPath = path.join(imagesDir, `${fileNameWithoutExt}.webp`);

      // 3. 변환 작업 수행
      // .rotate(): EXIF 회전 정보 반영 (가장 중요!)
      // .webp({ quality: 80 }): 화질 80%로 WebP 변환 (용량 대폭 감소)
      await sharp(inputPath)
        .rotate() 
        .webp({ quality: 80 }) 
        .toFile(outputPath);

      // 4. 기존 원본 파일 삭제 (선택사항 - 용량 확보를 위해 삭제 추천)
      fs.unlinkSync(inputPath);

      console.log(`✨ 변환 완료: ${file} -> ${fileNameWithoutExt}.webp`);
      count++;
    }

    if (count === 0) {
      console.log('🤔 변환할 이미지가 없습니다 (모두 이미 WebP이거나 이미지가 없음).');
    } else {
      console.log(`🎉 총 ${count}개의 이미지를 WebP로 변환했습니다!`);
    }

  } catch (error) {
    console.error('❌ 변환 중 오류 발생:', error);
  }
}

convertToWebp();