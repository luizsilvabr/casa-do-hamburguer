import type { NextFunction, Request, Response } from "express";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import multer, { MulterError } from "multer";
import { BadRequestError } from "../errors/AppError.js";

export const UPLOADS_DIR = join(process.cwd(), "uploads");
mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError("Formato de imagem não suportado"));
    }
  },
});

const single = upload.single("image");

export function uploadSingleImage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  single(req, res, (err: unknown) => {
    if (!err) return next();

    if (err instanceof BadRequestError) return next(err);

    if (err instanceof MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Imagem muito grande (máximo 5MB)"
          : "Falha ao processar o upload";
      return next(new BadRequestError(message));
    }

    return next(new BadRequestError("Falha ao processar o upload"));
  });
}
