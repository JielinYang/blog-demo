import { generateFakeArticles } from "../utils/generateFakeData.js";
import { Articles } from "../models/Articles.js";
import ResponseWrapper from "../models/ResponseWrapper.js";
import { sanitizeArticle } from "../utils/security.js";
import { generalLimiter } from "../utils/rateLimiter.js";

export async function insertFakeArticles(articlesNum) {
  const articles = generateFakeArticles(articlesNum);
  for (const article of articles) {
    // 清理假数据，防止XSS攻击
    const sanitizedArticle = sanitizeArticle(article);
    const newArticle = new Articles(sanitizedArticle);
    await newArticle.save();
  }
}

export async function saveArticle(article) {
  // 清理文章内容，防止XSS攻击
  const sanitizedArticle = sanitizeArticle(article);
  const newArticle = new Articles(sanitizedArticle);
  const result = await newArticle.save();
  return result;
}

// 获取文章列表（带分页和搜索）
export async function getArticles(req, res) {
  try {
    const { page = 1, limit = 10, category_id, keyword, status = "published" } = req.query;
    
    // 参数验证
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    
    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json(ResponseWrapper.error("分页参数必须为正数"));
    }

    // 状态映射
    const statusMap = {
      "published": 1,
      "draft": 0,
      "deleted": 2,
      "all": null
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
  return article;
}

export async function deleteArticleById(id) {
  const article = await Articles.deleteById(id);
  return article;
}
