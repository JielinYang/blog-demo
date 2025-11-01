// 七牛云控制器
import { generateUploadToken } from "../config/qiniuConfig.js";
import ResponseWrapper from "../models/ResponseWrapper.js";

/**
 * 获取七牛云上传token
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
export const getUploadToken = async (req, res) => {
  try {
    const { fileName, expires } = req.query;

    // 生成上传凭证
    const token = generateUploadToken({
      fileName: fileName ? String(fileName) : undefined,
      expires: expires ? Number(expires) : undefined,
    });

    // 返回成功响应
    return res.json(
      ResponseWrapper.success({
        token,
        expires: expires || 3600,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error("获取七牛云token失败:", error);
    return res.json(
      ResponseWrapper.error(`获取上传凭证失败: ${error.message}`)
    );
  }
};

/**
 * 验证文件上传（可选）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
export const verifyUpload = async (req, res) => {
  try {
    const { key, hash } = req.body;

    if (!key || !hash) {
      return res.json(ResponseWrapper.error("缺少必要参数"));
    }

    // 这里可以添加文件上传后的验证逻辑
    // 例如检查文件类型、大小、内容等

    return res.json(
      ResponseWrapper.success({
        message: "文件上传验证成功",
        key,
        hash,
      })
    );
  } catch (error) {
    console.error("验证文件上传失败:", error);
    return res.json(ResponseWrapper.error(`验证失败: ${error.message}`));
  }
};
