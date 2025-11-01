import pool from "../config/db.js";
import ResponseWrapper from "./ResponseWrapper.js";

export class Articles {
  // 格式化日期时间的辅助方法
  static formatDateTime(dateTime) {
    if (!dateTime) return null;
    const date = new Date(dateTime);
    return date.toISOString().slice(0, 19).replace("T", " ");
  }

  constructor({
    id = null,
    title,
    content,
    categoryId,
    views = 0,
    likeCount = 0,
    commentCount = 0,
    status = 0,
    coverUrl = "",
    cover_url = "", // 兼容数据库字段名
    createTime,
    updateTime,
  }) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.categoryId = categoryId;
    this.views = views;
    this.likeCount = likeCount;
    this.commentCount = commentCount;
    this.status = status;
    // 优先使用cover_url，如果为空则使用coverUrl
    this.coverUrl = cover_url || coverUrl;
    this.createTime = createTime;
    this.updateTime = updateTime;
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
        return result.affectedRows > 0;
      } else {
        // 新建逻辑
        const [results] = await pool.query(
          `INSERT INTO articles (
              title, content, category_id,
              views, like_count, comment_count, status, cover_url
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            this.title,
            this.content,
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
        return results.affectedRows > 0;
      }
    } catch (err) {
      console.error("保存文章失败:", err);
      throw new Error(`保存失败: ${err.message}`);
    }
  }

  // 分页查询（带分类过滤、关键词搜索、状态过滤）
  static async getArticles(page = 1, limit = 2, categoryId = null, keyword = null, status = null) {
    try {
      // 参数校验
      if (limit <= 0) {
        return ResponseWrapper.error("每页限制数量必须大于0");
      }

      // 构建查询条件
      const offset = (page - 1) * limit;
      let query = "SELECT * FROM articles";
      let countQuery = "SELECT COUNT(*) as total FROM articles";
      const params = [];
      const countParams = [];
      const conditions = [];

      // 分类过滤
      if (categoryId) {
        conditions.push("category_id = ?");
        params.push(categoryId);
        countParams.push(categoryId);
      }

      // 状态过滤
      if (status !== null && status !== undefined && status !== "") {
        conditions.push("status = ?");
        params.push(status);
        countParams.push(status);
      }

      // 关键词搜索（标题和内容）
      if (keyword) {
        conditions.push("(title LIKE ? OR content LIKE ?)");
        const keywordParam = `%${keyword}%`;
        params.push(keywordParam, keywordParam);
        countParams.push(keywordParam, keywordParam);
      }

      // 组装WHERE子句
      if (conditions.length > 0) {
        const whereClause = " WHERE " + conditions.join(" AND ");
        query += whereClause;
        countQuery += whereClause;
      }

      query += " LIMIT ? OFFSET ?";
      params.push(limit, offset);

      // 执行查询
      const [rows] = await pool.query(query, params);
      const [[{ total }]] = await pool.query(countQuery, countParams);
      
      const data = Array.isArray(rows) ? rows.map((o) => new Articles(o)) : [];

      // 返回标准化成功响应
      return ResponseWrapper.success({
        page,
        limit,
        total: total,
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
      return null;
    }
    try {
      const [rows] = await pool.query(
        `SELECT id, title, content, category_id, views, like_count, comment_count, status, cover_url, create_time, update_time
         FROM articles
         WHERE id = ?`,
        [id]
      );
      if (rows[0]) {
        const article = new Articles(rows[0]);
        article.createTime = Articles.formatDateTime(rows[0].create_time);
        article.updateTime = Articles.formatDateTime(rows[0].update_time);
        return article;
      }
      return null;
    } catch (err) {
      console.error("查询文章失败:", err);
      return null;
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
