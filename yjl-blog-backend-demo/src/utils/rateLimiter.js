import rateLimit from "express-rate-limit";

// 通用限流配置
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 300, // 每个IP最多100次请求
  message: {
    code: 429,
    message: "请求过于频繁，请稍后再试",
    data: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 严格限流配置（用于敏感操作）
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 20, // 每个IP最多20次请求
  message: {
    code: 429,
    message: "操作过于频繁，请稍后再试",
    data: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 文件上传限流
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 50, // 每个IP最多50次上传
  message: {
    code: 429,
    message: "上传过于频繁，请稍后再试",
    data: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录限流
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每个IP最多5次登录尝试
  message: {
    code: 429,
    message: "登录尝试过于频繁，请稍后再试",
    data: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 自定义限流配置生成器
export const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      code: 429,
      message: message || "请求过于频繁，请稍后再试",
      data: null,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};
