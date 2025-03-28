import pool from "../config/db.js";
import ResponseWrapper from "./ResponseWrapper.js";

export class Articles {
  constructor({
    id = null,
    title,
    content,
    authorId,
    categoryId,
    views = 0,
    likeCount = 0,
    commentCount = 0,
    status = 0,
    coverUrl = "",
  }) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.authorId = authorId;
    this.categoryId = categoryId;
    this.views = views;
    this.likeCount = likeCount;
    this.commentCount = commentCount;
    this.status = status;
    this.coverUrl = coverUrl;
  }

  async save() {
    if (!this.title || this.title.trim().length < 5) {
      throw new Error("标题不能为空且至少5个字符");
    }

    try {
      if (this.id) {
        // 更新逻辑
        const [result] = await pool.query(
          `UPDATE articles SET 
              title = ?, content = ?, category_id = ?,
              views = ?, like_count = ?, comment_count = ?,
              status = ?, cover_url = ?
             WHERE id = ?`,
          [
            this.title,
            this.content,
            this.categoryId,
            this.views,
            this.likeCount,
            this.commentCount,
            this.status,
            this.coverUrl,
            this.id,
          ]
        );
        // @ts-ignore
        ResponseWrapper.success(`文章更新成功: ${this.id}`);
      } else {
        // 新建逻辑
        const [results] = await pool.query(
          `INSERT INTO articles (
              title, content, author_id, category_id,
              views, like_count, comment_count, status, cover_url
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            this.title,
            this.content,
            this.authorId,
            this.categoryId,
            this.views,
            this.likeCount,
            this.commentCount,
            this.status,
            this.coverUrl,
          ]
        );
        // @ts-ignore
        this.id = results.insertId;
        ResponseWrapper.success(`文章新建成功: ${this.id}`);
      }
    } catch (err) {
      ResponseWrapper.error(`保存失败: ${err.message}`);
    }

    return this;
  }

  // 分页查询（带分类过滤）
  static async getArticles(page = 1, limit = 2, categoryId = null) {
    try {
      // 参数校验
      if (limit <= 0) {
        return ResponseWrapper.error("每页限制数量必须大于0");
      }

      const offset = (page - 1) * limit;
      let query = "SELECT * FROM articles";
      const params = [];

      // 构建查询条件
      if (categoryId) {
        query += " WHERE category_id = ?";
        params.push(categoryId);
      }

      // 分页处理
      query += " LIMIT ? OFFSET ?";
      params.push(limit, offset);

      // 执行查询
      const [rows] = await pool.query(query, params);
      const data = Array.isArray(rows) ? rows.map((o) => new Articles(o)) : [];

      // 返回标准化成功响应
      return ResponseWrapper.success({
        page,
        limit,
        total: data.length,
        data,
      });
    } catch (err) {
      // 返回标准化错误响应
      console.error(err);
      return ResponseWrapper.error(`查询失败: ${err.message}, ${err.sql}`);
    }
  }

  // 按ID查询
  static async getById(id) {
    if (id <= 0) {
      ResponseWrapper.error("id必须大于0");
    }
    try {
      const [rows] = await pool.query(
        `SELECT *
         FROM articles
         WHERE id = ?`,
        [id]
      );
      const data = rows[0] ? new Articles(rows[0]) : null;
      ResponseWrapper.success(data);
    } catch (err) {
      return ResponseWrapper.error(`查询失败: ${err.message}`);
    }
  }

  // 删除文章
  static async deleteById(id) {
    if (id <= 0) {
      return ResponseWrapper.error("id必须大于0");
    }
    // 执行删除操作
    try {
      const [result] = await pool.query(
        `DELETE FROM articles
         WHERE id = ?`,
        [id]
      );

      // 判断是否成功删除
      // @ts-ignore
      return result.affectedRows > 0 ? `文章删除成功` : null;
    } catch (err) {
      return ResponseWrapper.error(`删除失败: ${err.message}`);
    }
  }
}
