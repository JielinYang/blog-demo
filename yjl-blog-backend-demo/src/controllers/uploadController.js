import multer from "multer";
import path from "path";
import fs from "fs";
import ResponseWrapper from "../models/ResponseWrapper.js";
import { validateFile } from "../utils/fileValidator.js";

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/";
    // 确保上传目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器
const fileFilter = function (req, file, cb) {
  // 允许的图片类型
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
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

// 单文件上传
export const uploadSingle = upload.single("file");

// 多文件上传（最多10个）
export const uploadMultiple = upload.array("files", 10);

// 上传单张图片
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(ResponseWrapper.error("请上传文件"));
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
      // 删除上传的文件
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json(ResponseWrapper.error(validation.message));
    }

    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${req.file.filename}` // 返回可访问的URL
    };

    return res.json(ResponseWrapper.success(fileInfo));
  } catch (err) {
    console.error("文件上传失败:", err);
    // 清理上传的文件
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.error("清理上传文件失败:", cleanupErr);
      }
    }
    return res.status(500).json(ResponseWrapper.error("文件上传失败"));
  }
};

// 上传多张图片
export const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json(ResponseWrapper.error("请上传文件"));
    }

    const fileInfos = [];
    const validationErrors = [];

    // 验证每个文件
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const validation = validateFile(file, {
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
        validationErrors.push(`${file.originalname}: ${validation.message}`);
        // 删除验证失败的文件
        if (file.path) {
          try {
            fs.unlinkSync(file.path);
          } catch (cleanupErr) {
            console.error(`清理文件 ${file.originalname} 失败:`, cleanupErr);
          }
        }
      } else {
        fileInfos.push({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          url: `/uploads/${file.filename}`
        });
      }
    }

    if (fileInfos.length === 0) {
      return res.status(400).json(ResponseWrapper.error("所有文件验证失败", { errors: validationErrors }));
    }

    return res.json(ResponseWrapper.success({
      uploaded: fileInfos,
      errors: validationErrors.length > 0 ? validationErrors : undefined
    }));
  } catch (err) {
    console.error("批量上传失败:", err);
    // 清理所有上传的文件
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.path) {
          try {
            fs.unlinkSync(file.path);
          } catch (cleanupErr) {
            console.error(`清理文件 ${file.originalname} 失败:`, cleanupErr);
          }
        }
      });
    }
    return res.status(500).json(ResponseWrapper.error("批量上传失败"));
  }
};

// 删除文件
export const deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join("uploads/", filename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(ResponseWrapper.error("文件不存在"));
    }

    // 删除文件
    fs.unlinkSync(filePath);
    
    return res.json(ResponseWrapper.success("文件删除成功"));
  } catch (err) {
    console.error("文件删除失败:", err);
    return res.status(500).json(ResponseWrapper.error("文件删除失败"));
  }
};

// 获取上传的文件列表
export const getUploadedFiles = async (req, res) => {
  try {
    const uploadDir = "uploads/";
    
    if (!fs.existsSync(uploadDir)) {
      return res.json(ResponseWrapper.success([]));
    }

    const files = fs.readdirSync(uploadDir);
    const fileList = files.map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename,
        size: stats.size,
        mimetype: getMimeType(filename),
        createTime: stats.birthtime,
        url: `/uploads/${filename}`
      };
    });

    return res.json(ResponseWrapper.success(fileList));
  } catch (err) {
    console.error("获取文件列表失败:", err);
    return res.status(500).json(ResponseWrapper.error("获取文件列表失败"));
  }
};

// 辅助函数：根据文件名获取MIME类型
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}