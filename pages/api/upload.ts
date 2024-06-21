import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../lib/supabase";
import sharp from "sharp";
import multer from "multer";
import { promisify } from "util";
import fs from "fs";

// Multer 설정
const upload = multer({ dest: "/tmp" });

// 타입 선언 확장
interface NextApiRequestWithFile extends NextApiRequest {
  file: Express.Multer.File;
}

// Multer 미들웨어를 프로미스화
const uploadMiddleware = (req: NextApiRequest, res: NextApiResponse) =>
  new Promise<void>((resolve, reject) => {
    upload.single("image")(req as any, res as any, (err: any) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequestWithFile,
  res: NextApiResponse
) {
  try {
    // Multer 미들웨어 호출
    await uploadMiddleware(req, res);

    // 업로드된 파일 경로
    const filePath = req.file.path;
    const buffer = await fs.promises.readFile(filePath);

    // 이미지 리사이징
    const resizedImage = await sharp(buffer).resize({ width: 800 }).toBuffer();

    // Supabase 스토리지에 업로드
    const { data, error } = await supabase.storage
      .from("images")
      .upload(`resized/${req.file.originalname}`, resizedImage);

    if (error) {
      throw error;
    }

    // Public URL 가져오기
    const { data: publicUrlData } = supabase.storage
      .from("images")
      .getPublicUrl(`resized/${req.file.originalname}`);

    res.status(200).json({ url: publicUrlData.publicUrl });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Unknown error occurred" });
    }
  }
}
