import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

// 路由导入
import categoryRouter from "./src/routes/categoryRoute.js";
import articleRouter from "./src/routes/articleRoute.js";
import uploadRouter from "./src/routes/uploadRoute.js";
import authRouter from "./src/routes/authRoute.js";
import minioRouter from "./src/routes/minioRoute.js";

// 工具导入
import { checkDatabase, initDatabase } from "./src/utils/databaseInit.js";
import { generalLimiter } from "./src/utils/rateLimiter.js";
import { initMinio } from "./src/config/minioConfig.js";

// 多环境配置加载策略
const loadEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  console.log(`🚀 启动环境: ${env}`);
  
  // 配置加载优先级（从高到低）：
  // 1. .env.local（本地覆盖，最高优先级）
  dotenv.config({ path: '.env.local' });
  
  // 2. 环境特定配置（如 .env.development, .env.production）
  dotenv.config({ path: `.env.${env}` });
  
  // 3. 默认配置 .env（最低优先级）
  dotenv.config();
  
  // 验证配置加载
  console.log('📊 配置验证:');
  console.log('  - 数据库主机:', process.env.DB_HOST || '未设置');
  console.log('  - 应用端口:', process.env.PORT || '未设置');
  console.log('  - 当前环境:', process.env.NODE_ENV || 'development');
  console.log('  - JWT密钥长度:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : '未设置');
};

// 执行配置加载
loadEnvironmentConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS配置（根据环境动态调整）
const getCorsOptions = () => {
  const env = process.env.NODE_ENV || 'development';
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
  
  console.log(`🌐 CORS配置 - 环境: ${env}`);
  console.log(`  允许的域名列表: ${allowedOrigins.join(', ') || '未设置'}`);
  
  return {
    origin: function (origin, callback) {
      // 使用正则表达式匹配所有本地域名（localhost和127.0.0.1，任意端口）
      const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

      // 使用正则表达式匹配106.53.47.170的所有端口
      const ipRegex = /^http:\/\/106\.53\.47\.170(:\d+)?$/;

      console.log("=== CORS检查开始 ===");
      console.log("请求来源域名:", origin || "undefined (移动端/直接请求)");
      console.log("正则表达式匹配检查:");
      console.log("  - localhostRegex测试:", localhostRegex.test(origin));
      console.log("  - ipRegex测试:", ipRegex.test(origin));
      console.log("  - 环境变量域名列表匹配:", allowedOrigins.includes(origin));
      console.log("  - origin为空检查:", !origin);

      // 检查origin是否匹配本地域名、匹配IP地址的所有端口、环境变量域名列表、或者为空
      if (!origin || localhostRegex.test(origin) || ipRegex.test(origin) || allowedOrigins.includes(origin)) {
        console.log("✅ CORS检查通过 - 允许访问");
        console.log("允许的域名类型:");
        if (!origin) {
          console.log("  - undefined (移动端应用/直接请求)");
        }
        if (localhostRegex.test(origin)) {
          console.log("  - 本地域名 (localhost/127.0.0.1)");
        }
        if (ipRegex.test(origin)) {
          console.log("  - 指定IP地址 (106.53.47.170)");
        }
        if (allowedOrigins.includes(origin)) {
          console.log("  - 环境变量配置的域名");
        }
        callback(null, true);
      } else {
        console.log("❌ CORS检查失败 - 拒绝访问");
        console.log("拒绝原因: 域名不在允许列表中");
        console.log("当前允许的域名模式:");
        console.log("  - http://localhost:* (任意端口)");
        console.log("  - http://127.0.0.1:* (任意端口)");
        console.log("  - http://106.53.47.170:* (任意端口)");
        if (allowedOrigins.length > 0) {
          console.log("  - 环境变量域名:", allowedOrigins.join(', '));
        }
        console.log("  - undefined (移动端应用)");
        callback(new Error("Not allowed by CORS"));
      }
      console.log("=== CORS检查结束 ===\n");
    },
    credentials: true,
    optionsSuccessStatus: 200,
    exposedHeaders: ["Authorization"],
  };
};

const corsOptions = getCorsOptions();

// 中间件
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 全局限流中间件
app.use(generalLimiter);

// 静态文件服务
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 健康检查接口（不受限流影响）
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// CORS测试接口
app.get("/cors-test", (req, res) => {
  console.log("CORS测试接口被调用，请求头:", req.headers);
  res.json({ 
    message: "CORS配置正常", 
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || "undefined"
  });
});

// API路由
app.use("/categories", categoryRouter);
app.use("/articles", articleRouter);
app.use("/upload", uploadRouter);
app.use("/auth", authRouter);
app.use("/minio", minioRouter);

// 404处理
app.use("*", (req, res) => {
  res.status(404).json({
    code: 404,
    message: "接口不存在",
    data: null,
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error("全局错误:", err);
  res.status(500).json({
    code: 500,
    message: "服务器内部错误",
    data: null,
  });
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`服务器运行在端口 ${PORT}`);

  try {
    // 检查数据库连接和表结构
    const isDatabaseReady = await checkDatabase();
    if (!isDatabaseReady) {
      console.log("数据库表结构不完整，正在初始化...");
      await initDatabase();
      console.log("数据库初始化完成");
    } else {
      console.log("数据库连接正常");
    }

    // 初始化MinIO连接（如果MinIO服务不可用，应用仍可启动）
    try {
      await initMinio();
      console.log("✅ MinIO连接初始化成功");
    } catch (minioError) {
      console.warn("⚠️ MinIO连接初始化失败，但应用将继续启动");
      console.warn("   错误信息:", minioError.message);
      console.warn("   注意: 文件上传功能将不可用，请确保MinIO服务正在运行");
    }
  } catch (error) {
    console.error("初始化失败:", error);
    process.exit(1);
  }
});

export { app };
