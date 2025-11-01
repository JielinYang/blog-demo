// 数据库配置
import mysql from "mysql2/promise"; // 使用 Promise 版本
import dotenv from "dotenv"; // 导入 dotenv 包

// 配置连接池
dotenv.config(); // 读取 .env 文件

// 配置连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST, // 数据库地址
  port: process.env.DB_PORT || 3306, // 数据库端口，从环境变量读取
  user: process.env.DB_USER, // 数据库用户名
  password: process.env.DB_PASSWORD, // 数据库密码
  database: process.env.DB_DATABASE, // 数据库名称
  waitForConnections: true,
  connectionLimit: 10,
  // 确保支持大文本数据传输，优化富文本存储
  supportBigNumbers: true,
  bigNumberStrings: false,
});

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("数据库连接成功");
    connection.release();
  } catch (error) {
    console.error("数据库连接失败:", error);
  }
}

testConnection();

export default pool;
