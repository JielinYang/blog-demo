import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 初始化数据库表结构
export const initDatabase = async () => {
  try {
    console.log("开始初始化数据库...");
    
    // 读取SQL文件
    const schemaPath = path.join(__dirname, "../database/schema.sql");
    const sqlContent = fs.readFileSync(schemaPath, "utf8");
    
    // 分割SQL语句（按分号分割，但忽略字符串中的分号）
    const statements = sqlContent
      .split(/;(?=(?:[^']*'[^']*')*[^']*$)/) // 忽略字符串中的分号
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ";");

    // 逐条执行SQL语句
    for (const statement of statements) {
      try {
        await pool.query(statement);
        console.log(`执行SQL成功: ${statement.substring(0, 50)}...`);
      } catch (err) {
        // 忽略已存在的表错误
        if (err.code !== "ER_TABLE_EXISTS_ERROR" && err.code !== "ER_DUP_ENTRY") {
          console.error(`执行SQL失败: ${statement.substring(0, 50)}...`);
          console.error("错误详情:", err.message);
        }
      }
    }

    console.log("数据库初始化完成！");
    return true;
  } catch (err) {
    console.error("数据库初始化失败:", err);
    return false;
  }
};

// 重置数据库（删除所有表并重新创建）
export const resetDatabase = async () => {
  try {
    console.log("开始重置数据库...");
    
    // 获取所有表名
    const [tables] = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
    );

    // 禁用外键检查
    await pool.query("SET FOREIGN_KEY_CHECKS = 0");
    
    // 删除所有表
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      await pool.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      console.log(`删除表: ${tableName}`);
    }
    
    // 启用外键检查
    await pool.query("SET FOREIGN_KEY_CHECKS = 1");
    
    // 重新初始化数据库
    await initDatabase();
    
    console.log("数据库重置完成！");
    return true;
  } catch (err) {
    console.error("数据库重置失败:", err);
    return false;
  }
};

// 检查数据库连接和表结构
export const checkDatabase = async () => {
  try {
    console.log("开始检查数据库状态...");
    
    // 检查数据库连接
    const [result] = await pool.query("SELECT 1 as test");
    if (!result || result.length === 0) {
      throw new Error("数据库连接测试失败");
    }
    console.log("✓ 数据库连接正常");
    
    // 检查必需的表是否存在
    const requiredTables = ["articles", "categories"];
    for (const tableName of requiredTables) {
      const [tables] = await pool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
        [tableName]
      );
      
      if (tables.length === 0) {
        console.warn(`⚠ 表 ${tableName} 不存在，需要初始化数据库`);
        return false;
      }
      console.log(`✓ 表 ${tableName} 存在`);
    }
    
    console.log("✓ 数据库检查通过");
    return true;
  } catch (err) {
    console.error("✗ 数据库检查失败:", err);
    return false;
  }
};