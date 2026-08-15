import type { Request, Response } from "express";
import { createHash } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BadRequestError } from "../errors/AppError.js";
import { UPLOADS_DIR } from "../middlewares/upload.js";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function uploadImageController(req: Request, res: Response) {
  const file = req.file;
  if (!file) {
    throw new BadRequestError("Nenhuma imagem enviada");
  }

  const ext = MIME_TO_EXT[file.mimetype];
  if (!ext) {
    throw new BadRequestError("Formato de imagem não suportado");
  }

  const hash = createHash("sha256").update(file.buffer).digest("hex");
  const filename = `${hash}${ext}`;
  const filePath = join(UPLOADS_DIR, filename);

  if (!existsSync(filePath)) {
    writeFileSync(filePath, file.buffer);
  }

  return res.status(201).json({ url: `/uploads/${filename}` });
}
