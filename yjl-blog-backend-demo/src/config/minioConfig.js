// MinIO配置
import * as Minio from "minio";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

// MinIO配置信息（从环境变量读取）
const minioConfig = {
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  bucketName: process.env.MINIO_BUCKET,
};

// 创建MinIO客户端实例
const minioClient = new Minio.Client({
  endPoint: minioConfig.endPoint,
  port: minioConfig.port,
  useSSL: minioConfig.useSSL,
  accessKey: minioConfig.accessKey,
  secretKey: minioConfig.secretKey,
});

// 确保存储桶存在
const ensureBucketExists = async () => {
  try {
    const bucketExists = await minioClient.bucketExists(minioConfig.bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(minioConfig.bucketName, "us-east-1");
      console.log(`存储桶 ${minioConfig.bucketName} 创建成功`);

      // 设置存储桶策略为公开读取
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: "*",
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${minioConfig.bucketName}/*`],
          },
        ],
      };

      await minioClient.setBucketPolicy(
        minioConfig.bucketName,
        JSON.stringify(policy)
      );
      console.log(`存储桶 ${minioConfig.bucketName} 策略设置成功`);
    }
  } catch (error) {
    console.error("MinIO存储桶初始化失败:", error);
    throw error;
  }
};

// 初始化MinIO连接
const initMinio = async () => {
  try {
    await ensureBucketExists();
    console.log("MinIO连接初始化成功");
  } catch (error) {
    console.error("MinIO初始化失败:", error);
    throw error;
  }
};

// 获取文件访问URL
export const getFileUrl = (fileName) => {
  return `http://${minioConfig.endPoint}:${minioConfig.port}/${minioConfig.bucketName}/${fileName}`;
};

export { minioClient, minioConfig, initMinio };
export default minioConfig;
