import { Categories } from "../models/Categories.js";
import ResponseWrapper from "../models/ResponseWrapper.js";
import { sanitizeText } from "../utils/security.js";

// 获取所有分类
export const getCategories = async (req, res) => {
  try {
    const result = await Categories.getAllCategories();
    return res.json(result);
  } catch (err) {
    console.error("获取分类列表失败:", err);
    return res.status(500).json(ResponseWrapper.error("获取分类列表失败"));
  }
};

// 根据ID获取分类详情
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Categories.getById(parseInt(id));
    
    if (!result.data) {
      return res.status(404).json(ResponseWrapper.error("分类不存在"));
    }
    
    return res.json(result);
  } catch (err) {
    console.error("获取分类详情失败:", err);
    return res.status(500).json(ResponseWrapper.error("获取分类详情失败"));
  }
};

// 创建新分类
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || name.trim().length < 1) {
      return res.status(400).json(ResponseWrapper.error("分类名称不能为空"));
    }

    const category = new Categories({
      name: sanitizeText(name.trim()),
      description: sanitizeText(description || ""),
    });

    const result = await category.save();
    return res.json(result);
  } catch (err) {
    console.error("创建分类失败:", err);
    return res.status(500).json(ResponseWrapper.error("创建分类失败"));
  }
};

// 更新分类
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name || name.trim().length < 1) {
      return res.status(400).json(ResponseWrapper.error("分类名称不能为空"));
    }

    const category = new Categories({
      id: parseInt(id),
      name: sanitizeText(name.trim()),
      description: sanitizeText(description || ""),
    });

    const result = await category.save();
    return res.json(result);
  } catch (err) {
    console.error("更新分类失败:", err);
    return res.status(500).json(ResponseWrapper.error("更新分类失败"));
  }
};

// 删除分类
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Categories.deleteById(parseInt(id));
    
    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (err) {
    console.error("删除分类失败:", err);
    return res.status(500).json(ResponseWrapper.error("删除分类失败"));
  }
};