// routes/articles.js
import express from "express";
import {
  getArticles,
  getArticleById,
  deleteArticleById,
  saveArticle,
} from "../controllers/articleController.js";
import { authenticateToken, requireAdmin } from "../utils/auth.js";
import { generalLimiter } from "../utils/rateLimiter.js";
import ResponseWrapper from "../models/ResponseWrapper.js";
import { uploadMarkdownSingle, uploadMarkdownFile } from "../controllers/markdownUploadController.js";

const router = express.Router();

// 测试接口（用于启动时测试）
router.get("/test", generalLimiter, async (req, res) => {
  try {
    // 返回系统状态信息
    const testData = {
      status: "success",
      message: "文章服务运行正常",
      timestamp: new Date().toISOString(),
      serverTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0"
    };
    
    res.json(ResponseWrapper.success(testData));
  } catch (err) {
    console.error("测试接口错误:", err);
    res.status(500).json(ResponseWrapper.error("测试接口异常"));
  }
});

// 获取分页文章列表（公开，带限流）
router.get("/", generalLimiter, getArticles);

// 获取单篇文章详情（公开，带限流）
router.get("/:id", generalLimiter, async (req, res) => {
  try {
    const article = await getArticleById(req.params.id);
    if (article) {
      // 返回完整的文章信息，包含所有数据库字段
      res.json(ResponseWrapper.success(article));
    } else {
      res.status(404).json(ResponseWrapper.error("文章未找到"));
    }
  } catch (err) {
    console.error("获取文章详情失败:", err);
    res.status(500).json(ResponseWrapper.error("获取文章详情失败"));
  }
});

// 上传Markdown文件（需要管理员权限）
router.post("/upload-markdown", authenticateToken, requireAdmin, uploadMarkdownSingle, async (req, res) => {
  await uploadMarkdownFile(req, res);
});

// 插入/更新文章（需要管理员权限）
router.post("/save", authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log("articleRoute: ", req.body);
    const result = await saveArticle(req.body);
    if (result) {
      res.json({ success: true, message: "文章保存成功" });
    } else {
      res.status(500).json({ success: false, error: "文章保存失败" });
    }
  } catch (err) {
    console.error("保存文章错误:", err);
    res.status(500).json({ success: false, error: "服务器错误：" + err.message });
  }
});

// 删除文章（需要管理员权限）
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await deleteArticleById(req.params.id);
    result
      ? res.json({ success: true })
      : res.status(404).json({ error: "删除失败" });
  } catch (err) {
    res.status(500).json({ error: "服务器错误" });
  }
});

export default router;
