import express from "express";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { authenticateToken, requireAdmin } from "../utils/auth.js";
import { generalLimiter } from "../utils/rateLimiter.js";

const router = express.Router();

// 获取分类列表（公开，带限流）
router.get("/", generalLimiter, getCategories);

// 获取单个分类（公开，带限流）
router.get("/:id", generalLimiter, getCategoryById);

// 创建分类（需要管理员权限）
router.post("/", authenticateToken, requireAdmin, createCategory);

// 更新分类（需要管理员权限）
router.put("/:id", authenticateToken, requireAdmin, updateCategory);

// 删除分类（需要管理员权限）
router.delete("/:id", authenticateToken, requireAdmin, deleteCategory);

export default router;