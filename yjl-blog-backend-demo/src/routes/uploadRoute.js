import express from "express";
import {
  uploadSingle,
  uploadMultiple,
  uploadImage,
  uploadImages,
  deleteFile,
  getUploadedFiles
} from "../controllers/uploadController.js";
import { authenticateToken, requireAdmin } from "../utils/auth.js";
import { uploadLimiter } from "../utils/rateLimiter.js";
import path from "path";
import fs from "fs";

const router = express.Router();

// 上传单张图片（需要认证，带上传限流）
router.post("/image", authenticateToken, uploadLimiter, uploadSingle, uploadImage);

// 上传多张图片（需要认证，带上传限流）
router.post("/images", authenticateToken, uploadLimiter, uploadMultiple, uploadImages);

// 删除文件（需要管理员权限）
router.delete("/file/:filename", authenticateToken, requireAdmin, deleteFile);

// 获取文件列表（需要管理员权限）
router.get("/files", authenticateToken, requireAdmin, getUploadedFiles);

// 提供静态文件访问
router.use("/uploads", (req, res, next) => {
  const filePath = path.join("uploads/", req.path);
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "文件不存在" });
  }
  
  // 设置正确的Content-Type
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  
  if (contentTypes[ext]) {
    res.setHeader('Content-Type', contentTypes[ext]);
  }
  
  // 发送文件
  res.sendFile(path.resolve(filePath));
});

export default router;