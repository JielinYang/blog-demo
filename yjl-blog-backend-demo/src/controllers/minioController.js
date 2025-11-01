import multer from "multer";
import ResponseWrapper from "../models/ResponseWrapper.js";
import { validateFile } from "../utils/fileValidator.js";
import { minioClient, minioConfig, getFileUrl } from "../config/minioConfig.js";

// 配置multer用于内存存储（避免本地文件写入）
const storage = multer.memoryStorage();

// 文件过滤器
const fileFilter = function (req, file, cb) {
  // 允许的图片类型
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("只允许上传图片文件 (jpeg, jpg, png, gif, webp, svg)"));
  }
};

// 创建 multer 实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为 5MB
  },
  fileFilter: fileFilter
});

// 单文件上传中间件
export const uploadSingle = upload.single("file");

/**
 * 上传图片到MinIO
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
export const uploadToMinio = async (req, res) => {
  try {
    // 检查是否有文件上传
    if (!req.file) {
      return res.status(400).json(ResponseWrapper.error("请上传文件"));
    }

    // 获取文件名参数
    const { fileName } = req.body;
    if (!fileName) {
      return res.status(400).json(ResponseWrapper.error("缺少文件名参数"));
    }

    // 验证文件
    const validation = validateFile(req.file, {
      allowedTypes: {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/gif': ['.gif'],
        'image/webp': ['.webp'],
        'image/svg+xml': ['.svg']
      },
      maxSize: 5 * 1024 * 1024, // 5MB
      checkIntegrity: true,
      checkMalicious: true
    });

    if (!validation.valid) {
      return res.status(400).json(ResponseWrapper.error(validation.message));
    }

    // 确保文件名有正确的扩展名
    let finalFileName = fileName;
    const originalExt = req.file.originalname.split('.').pop().toLowerCase();
    if (!finalFileName.includes('.')) {
      finalFileName = `${finalFileName}.${originalExt}`;
    }

    // 上传文件到MinIO
    const metaData = {
      'Content-Type': req.file.mimetype,
      'original-filename': req.file.originalname
    };

    await minioClient.putObject(
      minioConfig.bucketName,
      finalFileName,
      req.file.buffer,
      req.file.size,
      metaData
    );

    // 生成文件访问URL
    const fileUrl = getFileUrl(finalFileName);

    // 返回成功响应
    return res.json(ResponseWrapper.success({
      url: fileUrl,
      fileName: finalFileName,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    }));

  } catch (error) {
    console.error("MinIO文件上传失败:", error);
    return res.status(500).json(ResponseWrapper.error(`文件上传失败: ${error.message}`));
  }
};

/**
 * 从MinIO删除文件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
export const deleteFromMinio = async (req, res) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json(ResponseWrapper.error("缺少文件名参数"));
    }

    await minioClient.removeObject(minioConfig.bucketName, fileName);
    
    return res.json(ResponseWrapper.success("文件删除成功"));
  } catch (error) {
    console.error("MinIO文件删除失败:", error);
    return res.status(500).json(ResponseWrapper.error(`文件删除失败: ${error.message}`));
  }
};

/**
 * 获取MinIO文件列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
export const getMinioFiles = async (req, res) => {
  try {
    const stream = minioClient.listObjects(minioConfig.bucketName, '', true);
    const files = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        files.push({
          name: obj.name,
          size: obj.size,
          lastModified: obj.lastModified,
          etag: obj.etag,
          url: getFileUrl(obj.name)
        });
      });

      stream.on('end', () => {
        resolve(res.json(ResponseWrapper.success(files)));
      });

      stream.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error("获取MinIO文件列表失败:", error);
    return res.status(500).json(ResponseWrapper.error(`获取文件列表失败: ${error.message}`));
  }
};