import { generateFakeArticles } from "../utils/generateFakeData.js";
import { Articles } from "../models/Articles.js";
import ResponseWrapper from "../models/ResponseWrapper.js";

export async function insertFakeArticles(articlesNum) {
  const articles = generateFakeArticles(articlesNum);
  for (const article of articles) {
    const newArticle = new Articles(article);
    await newArticle.save();
  }
}

export async function getArticles(page = 1, limit = 5, categoryId = null) {
  const articles = await Articles.getArticles(page, limit, categoryId);
  return articles;
}

export async function getArticleById(id) {
  const article = await Articles.getById(id);
  return article;
}

export async function deleteArticleById(id) {
  const article = await Articles.deleteById(id);
  return article;
}
