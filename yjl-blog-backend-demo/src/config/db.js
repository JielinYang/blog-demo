// 数据库配置
import mysql from "mysql2/promise"; // 使用 Promise 版本
import dotenv from "dotenv"; // 导入 dotenv 包

// 多环境配置加载策略
const loadEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  // 配置加载优先级（从高到低）：
  // 1. .env.local（本地覆盖，最高优先级）
  dotenv.config({ path: '.env.local' });
  
  // 2. 环境特定配置（如 .env.development, .env.production）
  dotenv.config({ path: `.env.${env}` });
  
  // 3. 默认配置 .env（最低优先级）
  dotenv.config();
};

// 执行配置加载
loadEnvironmentConfig();

// 根据环境设置不同的连接参数
const getDatabaseConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const baseConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    supportBigNumbers: true,
    bigNumberStrings: false,
  };
  
  // 环境特定配置
  if (env === 'production') {
    return {
      ...baseConfig,
      connectionLimit: 20, // 生产环境增加连接数
      acquireTimeout: 60000, // 生产环境超时时间更长
      timeout: 60000,
    };
  }
  
  if (env === 'test') {
    return {
      ...baseConfig,
      connectionLimit: 5, // 测试环境减少连接数
      database: process.env.DB_DATABASE + '_test', // 测试数据库
    };
  }
  
  // 开发环境默认配置
  return baseConfig;
};

// 配置连接池
const pool = mysql.createPool(getDatabaseConfig());

// 测试数据库连接（带环境信息）
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const env = process.env.NODE_ENV || 'development';
    console.log(`✅ 数据库连接成功 (${env}环境)`);
    console.log(`   数据库: ${process.env.DB_DATABASE}`);
    console.log(`   主机: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    connection.release();
  } catch (error) {
    console.error("❌ 数据库连接失败:", error.message);
  }
}

testConnection();

export default pool;
