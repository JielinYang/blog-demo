import express from "express";
import {
  getAllFragments,
  createFragment,
  getFragmentById,
  deleteFragment,
} from "../controllers/lifeFragmentController.js";

const router = express.Router();

// GET /api/life/fragments - 获取所有生活片段
router.get("/fragments", getAllFragments);

// POST /api/life/fragments - 创建新的生活片段
router.post("/fragments", createFragment);

// GET /api/life/fragments/:id - 获取指定ID的生活片段
router.get("/fragments/:id", getFragmentById);

// DELETE /api/life/fragments/:id - 删除生活片段
router.delete("/fragments/:id", deleteFragment);

export default router;
