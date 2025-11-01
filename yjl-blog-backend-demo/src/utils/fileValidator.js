import path from "path";
import fs from "fs";
import crypto from "crypto";

// 文件类型白名单
const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
  'image/bmp': ['.bmp'],
  'image/tiff': ['.tiff', '.tif']
};

const ALLOWED_DOCUMENT_TYPES = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
};

// 合并所有允许的文件类型
const ALLOWED_FILE_TYPES = {
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES
};

// 文件大小限制
const MAX_FILE_SIZE = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  general: 2 * 1024 * 1024 // 2MB 默认限制
};

/**
 * 验证文件类型
 * @param {Object} file - multer文件对象
 * @param {Array} allowedTypes - 允许的文件类型数组
 * @returns {Object} - 验证结果 { valid: boolean, message: string }
 */
export function validateFileType(file, allowedTypes = null) {
  if (!file) {
    return { valid: false, message: "文件不存在" };
  }

  const fileExt = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  // 如果没有指定允许的类型，使用默认的图片类型
  const typesToCheck = allowedTypes || ALLOWED_IMAGE_TYPES;

  // 检查MIME类型是否在允许列表中
  if (!typesToCheck[mimeType]) {
    const allowedExtensions = Object.values(typesToCheck).flat();
    return { 
      valid: false, 
      message: `不支持的文件类型。允许的类型: ${allowedExtensions.join(', ')}` 
    };
  }

  // 检查文件扩展名是否与MIME类型匹配
  const allowedExtensions = typesToCheck[mimeType];
  if (!allowedExtensions.includes(fileExt)) {
    return { 
      valid: false, 
      message: `文件扩展名与MIME类型不匹配。期望扩展名: ${allowedExtensions.join(', ')}` 
    };
  }

  return { valid: true, message: "文件类型验证通过" };
}

/**
 * 验证文件大小
 * @param {Object} file - multer文件对象
 * @param {number} maxSize - 最大文件大小（字节）
 * @returns {Object} - 验证结果 { valid: boolean, message: string }
 */
export function validateFileSize(file, maxSize = null) {
  if (!file) {
    return { valid: false, message: "文件不存在" };
  }

  const sizeLimit = maxSize || MAX_FILE_SIZE.general;
  
  if (file.size > sizeLimit) {
    const sizeInMB = (sizeLimit / (1024 * 1024)).toFixed(2);
    return { 
      valid: false, 
      message: `文件大小超过限制。最大允许大小: ${sizeInMB}MB` 
    };
  }

  return { valid: true, message: "文件大小验证通过" };
}

/**
 * 验证文件完整性（通过检查文件头）
 * @param {string} filePath - 文件路径
 * @param {string} expectedMimeType - 期望的MIME类型
 * @returns {Object} - 验证结果 { valid: boolean, message: string }
 */
export function validateFileIntegrity(filePath, expectedMimeType) {
  try {
    if (!fs.existsSync(filePath)) {
      return { valid: false, message: "文件不存在" };
    }

    const buffer = fs.readFileSync(filePath, { length: 16 }); // 读取文件头
    const fileSignature = buffer.toString('hex').toUpperCase();

    // 文件签名（魔数）验证
    const fileSignatures = {
      'image/jpeg': ['FFD8FF', 'FFD8FFE0', 'FFD8FFE1', 'FFD8FFE2', 'FFD8FFE3', 'FFD8FFE8'],
      'image/png': ['89504E470D0A1A0A'],
      'image/gif': ['474946383761', '474946383961'], // GIF87a, GIF89a
      'image/webp': ['52494646'],
      'image/svg+xml': ['3C737667', '3C3F786D6C'], // <svg, <?xml
      'application/pdf': ['25504446'], // %PDF
      'application/msword': ['D0CF11E0A1B11AE1'], // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['504B0304'], // .docx (ZIP)
      'application/vnd.ms-excel': ['D0CF11E0A1B11AE1'], // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['504B0304'], // .xlsx (ZIP)
      'text/plain': null // 文本文件没有特定的签名
    };

    const expectedSignatures = fileSignatures[expectedMimeType];
    
    if (expectedSignatures && expectedSignatures.length > 0) {
      const isValid = expectedSignatures.some(signature => 
        fileSignature.startsWith(signature)
      );
      
      if (!isValid) {
        return { 
          valid: false, 
          message: `文件签名验证失败。文件可能已损坏或类型不匹配` 
        };
      }
    }

    return { valid: true, message: "文件完整性验证通过" };
  } catch (error) {
    console.error("文件完整性验证失败:", error);
    return { valid: false, message: "文件完整性验证失败" };
  }
}

/**
 * 生成文件哈希值
 * @param {string} filePath - 文件路径
 * @param {string} algorithm - 哈希算法（默认: md5）
 * @returns {string} - 文件哈希值
 */
export function generateFileHash(filePath, algorithm = 'md5') {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash(algorithm);
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    console.error("生成文件哈希失败:", error);
    return null;
  }
}

/**
 * 检查文件是否为恶意文件（简单的启发式检查）
 * @param {string} filePath - 文件路径
 * @returns {Object} - 检查结果 { valid: boolean, message: string }
 */
export function checkForMaliciousContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 检查常见的恶意代码模式
    const maliciousPatterns = [
      /<script\b[^>]*>.*?<\/script>/is, // 脚本标签
      /javascript:/i, // javascript: 协议
      /on\w+\s*=/i, // 事件处理器
      /eval\s*\(/i, // eval函数
      /document\.write/i, // document.write
      /window\./i, // window对象
      /php\s*:/i, // PHP代码
      /<%/i, // ASP代码
      /\[if\s.*\]/i, // 条件注释
      /behavior\s*:/i, // CSS behavior
      /expression\s*\(/i // CSS expression
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(content)) {
        return { 
          valid: false, 
          message: `检测到潜在的恶意内容: ${pattern.toString()}` 
        };
      }
    }

    return { valid: true, message: "未检测到恶意内容" };
  } catch (error) {
    // 如果文件不是文本文件，跳过内容检查
    if (error.code === 'ENOENT') {
      return { valid: false, message: "文件不存在" };
    }
    return { valid: true, message: "非文本文件，跳过内容检查" };
  }
}

/**
 * 综合文件验证
 * @param {Object} file - multer文件对象
 * @param {Object} options - 验证选项
 * @returns {Object} - 验证结果 { valid: boolean, message: string, details: Object }
 */
export function validateFile(file, options = {}) {
  const {
    allowedTypes = ALLOWED_IMAGE_TYPES,
    maxSize = MAX_FILE_SIZE.general,
    checkIntegrity = true,
    checkMalicious = true
  } = options;

  const result = {
    valid: true,
    message: "文件验证通过",
    details: {}
  };

  try {
    // 1. 验证文件类型
    const typeValidation = validateFileType(file, allowedTypes);
    result.details.type = typeValidation;
    if (!typeValidation.valid) {
      result.valid = false;
      result.message = typeValidation.message;
      return result;
    }

    // 2. 验证文件大小
    const sizeValidation = validateFileSize(file, maxSize);
    result.details.size = sizeValidation;
    if (!sizeValidation.valid) {
      result.valid = false;
      result.message = sizeValidation.message;
      return result;
    }

    // 3. 验证文件完整性（如果文件已保存到磁盘）
    if (checkIntegrity && file.path) {
      const integrityValidation = validateFileIntegrity(file.path, file.mimetype);
      result.details.integrity = integrityValidation;
      if (!integrityValidation.valid) {
        result.valid = false;
        result.message = integrityValidation.message;
        return result;
      }
    }

    // 4. 检查恶意内容（如果文件已保存到磁盘）
    if (checkMalicious && file.path) {
      const maliciousValidation = checkForMaliciousContent(file.path);
      result.details.malicious = maliciousValidation;
      if (!maliciousValidation.valid) {
        result.valid = false;
        result.message = maliciousValidation.message;
        return result;
      }
    }

    return result;
  } catch (error) {
    console.error("文件验证失败:", error);
    return {
      valid: false,
      message: "文件验证过程中发生错误",
      details: { error: error.message }
    };
  }
}

/**
 * 清理上传的文件
 * @param {string} filePath - 文件路径
 */
export function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`已清理文件: ${filePath}`);
    }
  } catch (error) {
    console.error(`清理文件失败: ${filePath}`, error);
  }
}