import { LifeFragments } from "../models/LifeFragments.js";

// 获取所有生活片段
export const getAllFragments = async (req, res) => {
  try {
    const result = await LifeFragments.getAllFragments();
    res.json(result);
  } catch (error) {
    console.error("获取生活片段失败:", error);
    res.status(500).json({
      code: 500,
      message: "服务器内部错误",
      data: null,
    });
  }
};

// 创建新的生活片段
export const createFragment = async (req, res) => {
  try {
    // 支持前端的小写驼峰命名和数据库的下划线命名
    const {
      content,
      image_url,
      imageUrl,
      mood,
      weather,
      record_time,
      recordTime,
    } = req.body;

    // 验证必填字段
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        code: 400,
        message: "内容不能为空",
        data: null,
      });
    }

    const recordTimeValue = record_time || recordTime;
    if (!recordTimeValue) {
      return res.status(400).json({
        code: 400,
        message: "记录时间不能为空",
        data: null,
      });
    }

    // 验证日期时间格式
    if (!LifeFragments.isValidDateTime(recordTimeValue)) {
      return res.status(400).json({
        code: 400,
        message: "记录时间格式无效",
        data: null,
      });
    }

    const result = await LifeFragments.createFragment({
      content,
      image_url: image_url || imageUrl,
      mood,
      weather,
      record_time: recordTimeValue,
    });

    res.json(result);
  } catch (error) {
    console.error("创建生活片段失败:", error);
    res.status(500).json({
      code: 500,
      message: "服务器内部错误",
      data: null,
    });
  }
};

// 获取指定ID的生活片段
export const getFragmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id) || id <= 0) {
      return res.status(400).json({
        code: 400,
        message: "无效的ID",
        data: null,
      });
    }

    const fragment = await LifeFragments.getById(id);

    if (!fragment) {
      return res.status(404).json({
        code: 404,
        message: "片段不存在",
        data: null,
      });
    }

    res.json({
      code: 200,
      message: "success",
      data: fragment,
    });
  } catch (error) {
    console.error("获取生活片段失败:", error);
    res.status(500).json({
      code: 500,
      message: "服务器内部错误",
      data: null,
    });
  }
};

// 删除生活片段
export const deleteFragment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id) || id <= 0) {
      return res.status(400).json({
        code: 400,
        message: "无效的ID",
        data: null,
      });
    }

    const result = await LifeFragments.deleteById(id);
    res.json(result);
  } catch (error) {
    console.error("删除生活片段失败:", error);
    res.status(500).json({
      code: 500,
      message: "服务器内部错误",
      data: null,
    });
  }
};
