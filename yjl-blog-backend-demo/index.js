import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

// 路由导入
import categoryRouter from "./src/routes/categoryRoute.js";
import articleRouter from "./src/routes/articleRoute.js";
import qiniuRouter from "./src/routes/qiniuRoute.js";
import uploadRouter from "./src/routes/uploadRoute.js";
import authRouter from "./src/routes/authRoute.js";
import minioRouter from "./src/routes/minioRoute.js";

// 工具导入
import { checkDatabase, initDatabase } from "./src/utils/databaseInit.js";
import { generalLimiter } from "./src/utils/rateLimiter.js";
import { initMinio } from "./src/config/minioConfig.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
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

// API路由
app.use("/categories", categoryRouter);
app.use("/articles", articleRouter);
app.use("/qiniu", qiniuRouter);
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

    // 初始化MinIO连接
    await initMinio();
    console.log("MinIO连接初始化成功");
  } catch (error) {
    console.error("初始化失败:", error);
    process.exit(1);
  }
});

export { app };
