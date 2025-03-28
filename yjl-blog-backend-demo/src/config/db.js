// 数据库配置
import mysql from "mysql2/promise"; // 使用 Promise 版本
import dotenv from "dotenv"; // 导入 dotenv 包

// 配置连接池
dotenv.config(); // 读取 .env 文件

// 配置连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST, // 数据库地址
  port: 3306, // 数据库端口
  user: process.env.DB_USER, // 数据库用户名
  password: process.env.DB_PASSWORD, // 数据库密码
  database: process.env.DB_DATABASE, // 数据库名称
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
