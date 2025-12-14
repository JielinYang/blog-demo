import multer from "multer";
import path from "path";
import fs from "fs";
import ResponseWrapper from "../models/ResponseWrapper.js";
import { generateFilePath, saveMarkdownFile } from "../utils/markdownUtils.js";

// 配置Markdown文件上传
const storage = multer.memoryStorage(); // 使用内存存储，稍后手动保存到指定路径

// Markdown文件过滤器
const markdownFileFilter = function (req, file, cb) {
  // 只允许.md文件
  const extname = path.extname(file.originalname).toLowerCase() === '.md';
  const mimetype = file.mimetype === 'text/markdown' || 
                   file.mimetype === 'text/plain' || 
                   file.mimetype === 'application/octet-stream';

  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error("只允许上传 .md 格式的Markdown文件"));
  }
};

// 创建 multer 实例（仅用于Markdown文件）
const uploadMarkdown = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为 5MB
  },
  fileFilter: markdownFileFilter
});

// 单个Markdown文件上传中间件
export const uploadMarkdownSingle = uploadMarkdown.single("file");

/**
 * 上传Markdown文件处理函数
 */
export const uploadMarkdownFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(ResponseWrapper.error("请上传Markdown文件"));
    }

    // 验证文件扩展名
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== '.md') {
      return res.status(400).json(ResponseWrapper.error("只允许上传 .md 文件"));
    }

    // 验证文件大小
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json(ResponseWrapper.error("文件大小不能超过 5MB"));
    }

    // 生成文件路径
    const timestamp = Date.now();
    const filePath = generateFilePath(timestamp);
    
    // 保存文件
    const content = req.file.buffer.toString('utf-8');
    await saveMarkdownFile(content, filePath);

    // 生成访问URL
    const fileUrl = `${req.protocol}://${req.get('host')}${filePath}`;

    const fileInfo = {
      filePath: filePath,
      fileUrl: fileUrl,
      originalname: req.file.originalname,
      size: req.file.size,
      uploadTime: new Date().toISOString()
    };

    return res.json(ResponseWrapper.success(fileInfo, "上传成功"));
  } catch (err) {
    console.error("Markdown文件上传失败:", err);
    return res.status(500).json(ResponseWrapper.error("文件上传失败: " + err.message));
  }
};
