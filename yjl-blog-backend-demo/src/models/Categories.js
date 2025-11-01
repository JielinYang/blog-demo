import pool from "../config/db.js";
import ResponseWrapper from "./ResponseWrapper.js";

export class Categories {
  constructor({
    id = null,
    name,
    description = "",
    articleCount = 0,
    createTime,
    updateTime,
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.articleCount = articleCount;
    this.createTime = createTime;
    this.updateTime = updateTime;
  }

  static formatDateTime(dateTime) {
    if (!dateTime) return null;
    const date = new Date(dateTime);
    return date.toISOString().slice(0, 19).replace("T", " ");
  }

  async save() {
    if (!this.name || this.name.trim().length < 1) {
      throw new Error("分类名称不能为空");
    }

    try {
      if (this.id) {
        // 更新逻辑
        const [result] = await pool.query(
          `UPDATE categories SET 
              name = ?, description = ?, article_count = ?
             WHERE id = ?`,
          [this.name, this.description, this.articleCount, this.id]
        );
        return ResponseWrapper.success(`分类更新成功: ${this.id}`);
      } else {
        // 新建逻辑
        const [results] = await pool.query(
          `INSERT INTO categories (name, description, article_count) 
           VALUES (?, ?, ?)`,
          [this.name, this.description, this.articleCount]
        );
        this.id = results.insertId;
        return ResponseWrapper.success(`分类新建成功: ${this.id}`);
      }
    } catch (err) {
      return ResponseWrapper.error(`保存失败: ${err.message}`);
    }
  }

  // 获取所有分类
  static async getAllCategories() {
    try {
      const [rows] = await pool.query(
        `SELECT id, name, description, article_count, create_time, update_time 
         FROM categories 
         ORDER BY article_count DESC`
      );

      const categories = rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        articleCount: row.article_count,
        createTime: Categories.formatDateTime(row.create_time),
        updateTime: Categories.formatDateTime(row.update_time),
      }));

      return ResponseWrapper.success(categories);
    } catch (err) {
      console.error("获取分类列表失败:", err);
      return ResponseWrapper.error(`获取分类列表失败: ${err.message}`);
    }
  }

  // 根据ID获取分类
  static async getById(id) {
    if (id <= 0) {
      return ResponseWrapper.error("id必须大于0");
    }
    try {
      const [rows] = await pool.query(
        `SELECT id, name, description, article_count, create_time, update_time 
         FROM categories 
         WHERE id = ?`,
        [id]
      );
      
      if (rows[0]) {
        return ResponseWrapper.success({
          id: rows[0].id,
          name: rows[0].name,
          description: rows[0].description,
          articleCount: rows[0].article_count,
          createTime: Categories.formatDateTime(rows[0].create_time),
          updateTime: Categories.formatDateTime(rows[0].update_time),
        });
      }
      return ResponseWrapper.success(null);
    } catch (err) {
      return ResponseWrapper.error(`查询失败: ${err.message}`);
    }
  }

  // 更新分类文章数量
  static async updateArticleCount(categoryId) {
    try {
      const [result] = await pool.query(
        `UPDATE categories 
         SET article_count = (
           SELECT COUNT(*) FROM articles 
           WHERE category_id = ? AND status = 1
         )
         WHERE id = ?`,
        [categoryId, categoryId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      console.error("更新分类文章数量失败:", err);
      return false;
    }
  }

  // 删除分类
  static async deleteById(id) {
    if (id <= 0) {
      return ResponseWrapper.error("id必须大于0");
    }
    
    try {
      // 检查是否有文章使用该分类
      const [articles] = await pool.query(
        `SELECT COUNT(*) as count FROM articles WHERE category_id = ?`,
        [id]
      );
      
      if (articles[0].count > 0) {
        return ResponseWrapper.error("该分类下有文章，无法删除");
      }

      const [result] = await pool.query(
        `DELETE FROM categories WHERE id = ?`,
        [id]
      );

      return result.affectedRows > 0 
        ? ResponseWrapper.success("分类删除成功")
        : ResponseWrapper.error("分类不存在");
    } catch (err) {
      return ResponseWrapper.error(`删除失败: ${err.message}`);
    }
  }
}