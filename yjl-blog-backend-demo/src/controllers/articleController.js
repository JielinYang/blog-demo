import { generateFakeArticles } from "../utils/generateFakeData.js";
import { Articles } from "../models/Articles.js";
import ResponseWrapper from "../models/ResponseWrapper.js";
import { sanitizeArticle } from "../utils/security.js";
import { generalLimiter } from "../utils/rateLimiter.js";
import {
  readMarkdownFile,
  extractDescription,
} from "../utils/markdownUtils.js";

export async function saveArticle(article) {
  // 清理文章内容，防止XSS攻击
  const sanitizedArticle = sanitizeArticle(article);

  // 如果提供了contentPath但没有description，自动提取摘要
  if (sanitizedArticle.contentPath && !sanitizedArticle.description) {
    try {
      const content = await readMarkdownFile(sanitizedArticle.contentPath);
      sanitizedArticle.description = extractDescription(content, 200);
    } catch (error) {
      console.error("读取Markdown文件失败:", error);
      // 如果读取失败，继续保存，但不设置摘要
    }
  }

  const newArticle = new Articles(sanitizedArticle);
  const result = await newArticle.save();
  return result;
}

// 获取文章列表（带分页和搜索）
export async function getArticles(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      category_id,
      keyword,
      status = "published",
    } = req.query;

    // 参数验证
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json(ResponseWrapper.error("分页参数必须为正数"));
    }

    // 状态映射
    const statusMap = {
      published: 1,
      draft: 0,
      deleted: 2,
      all: null,
    };

    const statusValue = statusMap[status] ?? (status ? parseInt(status) : null);

    // 使用增强后的Articles模型的getArticles方法
    const result = await Articles.getArticles(
      pageNum,
      limitNum,
      category_id ? parseInt(category_id) : null,
      keyword || null,
      statusValue
    );

    return res.json(
      ResponseWrapper.success({
        articles: result.data,
        pagination: {
          total: result.data.total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(result.data.total / limitNum),
        },
      })
    );
  } catch (error) {
    console.error("获取文章列表失败:", error);
    return res.status(500).json(ResponseWrapper.error("获取文章列表失败"));
  }
}

export async function getArticleById(id) {
  const article = await Articles.getById(id);

  // 如果文章有contentPath，读取Markdown文件内容
  if (article && article.contentPath) {
    try {
      const content = await readMarkdownFile(article.contentPath);
      article.content = content;
    } catch (error) {
      console.error("读取Markdown文件失败:", error);
      article.content = ""; // 如果读取失败，返回空内容
    }
  }

  // 如果有tags字段且是字符串，解析为JSON
  if (article && article.tags && typeof article.tags === "string") {
    try {
      article.tags = JSON.parse(article.tags);
    } catch (error) {
      console.error("解析tags失败:", error);
      article.tags = [];
    }
  }

  return article;
}

export async function deleteArticleById(id) {
  const article = await Articles.deleteById(id);
  return article;
}
