// 七牛云配置
import dotenv from "dotenv";
// 使用默认导入方式
import qiniu from "qiniu";

dotenv.config();

// 七牛云配置信息
const qiniuConfig = {
  accessKey: process.env.QINIU_ACCESS_KEY || "",
  secretKey: process.env.QINIU_SECRET_KEY || "",
  bucket: process.env.QINIU_BUCKET || "",
  domain: process.env.QINIU_DOMAIN || "",
  uploadDir: process.env.QINIU_UPLOAD_DIR || "blog/",
};

console.log("开始初始化七牛云配置");

// 初始化七牛云鉴权对象
const mac = new qiniu.auth.digest.Mac(
  qiniuConfig.accessKey,
  qiniuConfig.secretKey
);

console.log("结束初始化七牛云配置");

// 生成上传凭证的方法
export function generateUploadToken(options = {}) {
  const {
    fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    expires = 3600, // 默认过期时间1小时
    scope = qiniuConfig.bucket,
  } = options;

  // 直接使用原始文件名，不需要添加目录前缀，因为fbranch已经是scope(存储空间名称)
  const putPolicy = new qiniu.rs.PutPolicy({
    scope: `${scope}`,
    expires: expires,
  });

  return putPolicy.uploadToken(mac);
}

// 获取文件访问URL
export function getFileUrl(key) {
  return `${qiniuConfig.domain}/${key}`;
}

export default qiniuConfig;
