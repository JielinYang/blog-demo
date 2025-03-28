import express from "express";
import cors from "cors";
import articleRouter from "./src/routes/articles.js";

export const app = express();

const port = 3000;

app.use(cors());
app.use(express.json());

app.use("/articles", articleRouter);

// 测试路由
app.get("/", (req, res) => {
  res.send("Node.js + MySQL 服务已启动！");
});

app.use(
  cors({
    origin: "http://localhost:5173", // 仅允许前端地址访问
    methods: ["GET", "POST", "PUT", "DELETE"], // 允许的 HTTP 方法
    allowedHeaders: ["Content-Type", "Authorization"], // 允许的请求头
  })
);

app.listen(port, () => {
  console.log(`服务运行在 http://localhost:${port}`);
});

// 测试
import { myTest } from "./src/controllers/test.js";
myTest();
