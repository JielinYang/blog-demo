// MinIO功能测试脚本
import { minioClient, minioConfig, getFileUrl } from './src/config/minioConfig.js';

async function testMinioConnection() {
  try {
    console.log('开始测试MinIO连接...');
    
    // 测试存储桶是否存在
    const bucketExists = await minioClient.bucketExists(minioConfig.bucketName);
    console.log(`存储桶 ${minioConfig.bucketName} 存在:`, bucketExists);
    
    if (bucketExists) {
      // 测试列出存储桶中的对象
      const stream = minioClient.listObjects(minioConfig.bucketName, '', true);
      let fileCount = 0;
      
      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          fileCount++;
          console.log(`文件: ${obj.name}, 大小: ${obj.size} bytes`);
        });
        
        stream.on('end', () => {
          console.log(`存储桶中共有 ${fileCount} 个文件`);
          resolve(true);
        });
        
        stream.on('error', (err) => {
          console.error('列出文件失败:', err);
          reject(err);
        });
      });
    }
    
    return bucketExists;
  } catch (error) {
    console.error('MinIO连接测试失败:', error);
    return false;
  }
}

// 运行测试
async function runTest() {
  try {
    const success = await testMinioConnection();
    if (success) {
      console.log('✅ MinIO连接测试成功');
      console.log('文件访问URL示例:', getFileUrl('test.jpg'));
    } else {
      console.log('❌ MinIO连接测试失败');
    }
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

runTest();