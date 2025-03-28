// routes/articles.js
import express from "express";
import {
  getArticles,
  getArticleById,
  deleteArticleById,
} from "../controllers/articleController.js";

const router = express.Router();

// 获取分页文章列表
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 5, categoryId } = req.query;
    const result = await getArticles(
      // @ts-ignore
      parseInt(page),
      // @ts-ignore
      parseInt(limit),
      // @ts-ignore
      categoryId
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "获取文章列表失败" });
  }
});

// 获取单篇文章详情
router.get("/:id", async (req, res) => {
  try {
    const article = await getArticleById(req.params.id);
    article ? res.json(article) : res.status(404).json({ error: "文章未找到" });
  } catch (err) {
    res.status(500).json({ error: "获取文章详情失败，error：", err });
  }
});

// 删除文章
router.delete("/:id", async (req, res) => {
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
