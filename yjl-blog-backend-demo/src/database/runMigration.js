import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run the migration to add Markdown support to articles table
 */
const runMigration = async () => {
  try {
    console.log("开始执行数据库迁移...");
    
    // Read migration SQL file
    const migrationPath = path.join(__dirname, "migration_add_markdown_support.sql");
    const sqlContent = fs.readFileSync(migrationPath, "utf8");
    
    // Split SQL statements by semicolon
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement
    for (const statement of statements) {
      try {
        await pool.query(statement);
        console.log(`✓ 执行成功: ${statement.substring(0, 60)}...`);
      } catch (err) {
        // Ignore duplicate column errors
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME') {
          console.log(`⚠ 跳过（已存在）: ${statement.substring(0, 60)}...`);
        } else {
          console.error(`✗ 执行失败: ${statement.substring(0, 60)}...`);
          console.error("错误详情:", err.message);
          throw err;
        }
      }
    }
    
    console.log("✓ 数据库迁移完成！");
    process.exit(0);
  } catch (err) {
    console.error("✗ 数据库迁移失败:", err);
    process.exit(1);
  }
};

runMigration();
