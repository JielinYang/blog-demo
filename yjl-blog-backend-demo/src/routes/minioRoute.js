// MinIO路由
import express from "express";
import {
  uploadSingle,
  uploadToMinio,
  deleteFromMinio,
  getMinioFiles
} from "../controllers/minioController.js";
import { authenticateToken, requireAdmin } from "../utils/auth.js";
import { uploadLimiter } from "../utils/rateLimiter.js";

const router = express.Router();

// 上传图片到MinIO（需要认证，带上传限流）
router.post("/upload", authenticateToken, uploadLimiter, uploadSingle, uploadToMinio);

// 删除MinIO文件（需要管理员权限）
router.delete("/file/:fileName", authenticateToken, requireAdmin, deleteFromMinio);

// 获取MinIO文件列表（需要管理员权限）
router.get("/files", authenticateToken, requireAdmin, getMinioFiles);

export default router;