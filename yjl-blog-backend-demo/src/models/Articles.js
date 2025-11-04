import pool from "../config/db.js";
import ResponseWrapper from "./ResponseWrapper.js";

export class Articles {
  // 格式化日期时间的辅助方法（转换为本地时间）
  static formatDateTime(dateTime) {
    if (!dateTime) return null;
    const date = new Date(dateTime);

    // 转换为本地时间（北京时间 UTC+8）
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  constructor({
    id,
    title,
    content,
    categoryId,
    category_id = null, // 兼容数据库字段名
    views = 0,
    like_count = 0, // 数据库字段名
    likeCount = 0, // JavaScript属性名
    comment_count = 0, // 数据库字段名
    commentCount = 0, // JavaScript属性名
    status = 0,
    coverUrl = "",
    cover_url = "", // 兼容数据库字段名
    description = "",
    is_top = 0,
    create_time, // 数据库字段名
    createTime, // JavaScript属性名
    update_time, // 数据库字段名
    updateTime, // JavaScript属性名
  }) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.categoryId = category_id || categoryId; // 优先使用数据库字段名
    this.views = views;
    this.likeCount = like_count || likeCount; // 优先使用数据库字段名
    this.commentCount = comment_count || commentCount; // 优先使用数据库字段名
    this.status = status;
    // 优先使用cover_url，如果为空则使用coverUrl
    this.coverUrl = cover_url || coverUrl;
    this.description = description;
    this.is_top = is_top;
    this.createTime = create_time || createTime; // 优先使用数据库字段名
    this.updateTime = update_time || updateTime; // 优先使用数据库字段名
  }

  async save() {
    if (!this.title || this.title.trim().length < 5) {
      throw new Error("标题不能为空且至少5个字符");
    }

    try {
      if (this.id) {
        // 更新逻辑
        console.log("执行文章更新操作，将显式更新update_time字段");
        const updateQuery = `UPDATE articles SET 
              title = ?, content = ?, category_id = ?,
              views = ?, like_count = ?, comment_count = ?,
              status = ?, cover_url = ?, description = ?,
              update_time = CURRENT_TIMESTAMP
             WHERE id = ?`;
        const updateParams = [
          this.title,
          this.content,
          this.categoryId,
          this.views,
          this.likeCount,
          this.commentCount,
          this.status,
          this.coverUrl,
          this.description,
          this.id,
        ];
        
        console.log("UPDATE语句:", updateQuery);
        console.log("UPDATE参数:", updateParams);
        
        const [result] = await pool.query(updateQuery, updateParams);
        
        console.log("UPDATE执行结果:", result);
        // @ts-ignore
        return result.affectedRows > 0;
      } else {
        // 新建逻辑
        const [results] = await pool.query(
          `INSERT INTO articles (
              title, content, category_id,
              views, like_count, comment_count, status, cover_url, description
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            this.title,
            this.content,
            this.categoryId,
            this.views,
            this.likeCount,
            this.commentCount,
            this.status,
            this.coverUrl,
            this.description,
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
  static async getArticles(
    page = 1,
    limit = 2,
    categoryId = null,
    keyword = null,
    status = null
  ) {
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

      // 添加排序条件：按更新时间降序排列，最新的在最前面
      query += " ORDER BY update_time DESC";

      query += " LIMIT ? OFFSET ?";
      params.push(limit, offset);

      // 执行查询
      console.log("执行查询语句:", query);
      console.log("查询参数:", params);
      console.log("统计查询语句:", countQuery);
      console.log("统计查询参数:", countParams);

      const [rows] = await pool.query(query, params);
      const [[{ total }]] = await pool.query(countQuery, countParams);

      console.log("查询结果：", rows);

      // 处理时间字段映射
      const data = Array.isArray(rows)
        ? rows.map((row) => {
            const article = new Articles(row);
            // 确保时间字段正确映射
            article.createTime = Articles.formatDateTime(row.create_time);
            article.updateTime = Articles.formatDateTime(row.update_time);
            return article;
          })
        : [];

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

  // 按ID查询（每次查询自动增加浏览量）
  static async getById(id) {
    if (id <= 0) {
      return null;
    }
    try {
      // 先查询文章详情
      const [rows] = await pool.query(
        `SELECT id, title, content, category_id, views, like_count, comment_count, status, cover_url, description, is_top, create_time, update_time
         FROM articles
         WHERE id = ?`,
        [id]
      );

      if (rows[0]) {
        // 更新浏览量（views + 1），但不更新update_time字段
        const viewsUpdateQuery = `UPDATE articles SET views = views + 1 WHERE id = ?`;
        const viewsUpdateParams = [id];
        
        console.log("浏览量更新语句:", viewsUpdateQuery);
        console.log("浏览量更新参数:", viewsUpdateParams);
        
        const [viewsResult] = await pool.query(viewsUpdateQuery, viewsUpdateParams);
        
        console.log("浏览量更新结果:", viewsResult);

        const article = new Articles(rows[0]);
        article.createTime = Articles.formatDateTime(rows[0].create_time);
        article.updateTime = Articles.formatDateTime(rows[0].update_time);

        // 更新views属性为增加后的值
        article.views = rows[0].views + 1;

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
