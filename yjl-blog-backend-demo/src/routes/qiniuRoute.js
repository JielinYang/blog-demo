// 七牛云路由
import express from "express";
import {
  getUploadToken,
  verifyUpload,
} from "../controllers/qiniuController.js";

const router = express.Router();

// 获取上传token的路由，按照要求设置为 /api/qiniu/token
router.get("/token", async (req, res) => {
  try {
    const result = await getUploadToken(req, res);
    // 如果控制器已经发送响应，这里不需要再处理
    if (!res.headersSent) {
      res.json(result);
    }
  } catch (err) {
    console.error("获取七牛云上传token失败:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "获取七牛云上传token失败" });
    }
  }
});

// 验证文件上传的路由（可选）
router.post("/verify", async (req, res) => {
  try {
    console.log("验证七牛云文件上传请求参数:", req.body);
    const result = await verifyUpload(req, res);
    // 如果控制器已经发送响应，这里不需要再处理
    if (!res.headersSent) {
      res.json(result);
    }
  } catch (err) {
    console.error("验证七牛云文件上传失败:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "验证七牛云文件上传失败" });
    }
  }
});

export default router;
