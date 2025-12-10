import pool from "../config/db.js";
import ResponseWrapper from "./ResponseWrapper.js";

export class LifeFragments {
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

  // 验证日期时间格式
  static isValidDateTime(dateTimeStr) {
    if (!dateTimeStr) return false;
    const date = new Date(dateTimeStr);
    return date instanceof Date && !isNaN(date.getTime());
  }

  constructor({
    id,
    content,
    image_url = null,
    imageUrl = null,
    mood = null,
    weather = null,
    record_time,
    recordTime,
    created_at,
    createdAt,
    updated_at,
    updatedAt,
  }) {
    this.id = id;
    this.content = content;
    this.imageUrl = image_url || imageUrl;
    this.mood = mood;
    this.weather = weather;
    this.recordTime = record_time || recordTime;
    this.createdAt = created_at || createdAt;
    this.updatedAt = updated_at || updatedAt;
  }

  // 获取所有生活片段
  static async getAllFragments() {
    try {
      const query = "SELECT * FROM life_fragments ORDER BY record_time DESC";
      const [rows] = await pool.query(query);

      console.log("查询生活片段结果：", rows);

      // 处理时间字段映射
      const data = Array.isArray(rows)
        ? rows.map((row) => {
            const fragment = new LifeFragments(row);
            // 确保时间字段正确映射
            fragment.recordTime = LifeFragments.formatDateTime(row.record_time);
            fragment.createdAt = LifeFragments.formatDateTime(row.created_at);
            fragment.updatedAt = LifeFragments.formatDateTime(row.updated_at);
            return fragment;
          })
        : [];

      // 返回标准化成功响应
      return ResponseWrapper.success(data);
    } catch (err) {
      console.error("查询生活片段失败:", err);
      return ResponseWrapper.error(`查询失败: ${err.message}`);
    }
  }

  // 创建新的生活片段
  static async createFragment(data) {
    try {
      const { content, image_url, mood, weather, record_time } = data;

      // 验证必填字段
      if (!content || content.trim().length === 0) {
        return ResponseWrapper.error("内容不能为空");
      }

      if (!record_time) {
        return ResponseWrapper.error("记录时间不能为空");
      }

      // 验证日期时间格式
      if (!LifeFragments.isValidDateTime(record_time)) {
        return ResponseWrapper.error("记录时间格式无效");
      }

      // 插入数据
      const [result] = await pool.query(
        `INSERT INTO life_fragments (content, image_url, mood, weather, record_time)
         VALUES (?, ?, ?, ?, ?)`,
        [content, image_url || null, mood || null, weather || null, record_time]
      );

      // 查询新创建的记录
      const [rows] = await pool.query(
        "SELECT * FROM life_fragments WHERE id = ?",
        [result.insertId]
      );

      if (rows[0]) {
        const fragment = new LifeFragments(rows[0]);
        fragment.recordTime = LifeFragments.formatDateTime(rows[0].record_time);
        fragment.createdAt = LifeFragments.formatDateTime(rows[0].created_at);
        fragment.updatedAt = LifeFragments.formatDateTime(rows[0].updated_at);
        return ResponseWrapper.success(fragment);
      }

      return ResponseWrapper.error("创建成功但无法获取数据");
    } catch (err) {
      console.error("创建生活片段失败:", err);
      return ResponseWrapper.error(`创建失败: ${err.message}`);
    }
  }

  // 按ID查询生活片段
  static async getById(id) {
    if (!id || id <= 0) {
      return null;
    }

    try {
      const [rows] = await pool.query(
        `SELECT * FROM life_fragments WHERE id = ?`,
        [id]
      );

      if (rows[0]) {
        const fragment = new LifeFragments(rows[0]);
        fragment.recordTime = LifeFragments.formatDateTime(rows[0].record_time);
        fragment.createdAt = LifeFragments.formatDateTime(rows[0].created_at);
        fragment.updatedAt = LifeFragments.formatDateTime(rows[0].updated_at);
        return fragment;
      }

      return null;
    } catch (err) {
      console.error("查询生活片段失败:", err);
      return null;
    }
  }

  // 删除生活片段
  static async deleteById(id) {
    if (!id || id <= 0) {
      return ResponseWrapper.error("id必须大于0");
    }

    try {
      const [result] = await pool.query(
        `DELETE FROM life_fragments WHERE id = ?`,
        [id]
      );

      // 判断是否成功删除
      return result.affectedRows > 0
        ? ResponseWrapper.success(null)
        : ResponseWrapper.error("片段不存在或已被删除");
    } catch (err) {
      console.error("删除生活片段失败:", err);
      return ResponseWrapper.error(`删除失败: ${err.message}`);
    }
  }
}
