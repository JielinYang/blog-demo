import { Router } from "express";
import { register, login, refreshToken, getUserInfo, updateUserInfo } from "../controllers/authController.js";
import { authenticateToken } from "../utils/auth.js";
import { loginLimiter } from "../utils/rateLimiter.js";

const router = Router();

// 用户注册
router.post("/register", register);

// 用户登录（带限流）
router.post("/login", loginLimiter, login);

// 刷新令牌
router.post("/refresh", refreshToken);

// 获取用户信息（需要认证）
router.get("/me", authenticateToken, getUserInfo);

// 更新用户信息（需要认证）
router.put("/me", authenticateToken, updateUserInfo);

export default router;