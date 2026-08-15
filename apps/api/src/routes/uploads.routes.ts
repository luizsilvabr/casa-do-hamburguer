import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authGuard } from "../middlewares/authGuard.js";
import { uploadSingleImage } from "../middlewares/upload.js";
import { uploadImageController } from "../controllers/uploads.controller.js";

export const uploadsRoutes = Router();

uploadsRoutes.post(
  "/",
  authGuard,
  uploadSingleImage,
  asyncHandler(uploadImageController),
);
