#!/bin/bash

# MinIO 代理修复脚本

echo "=========================================="
echo "MinIO 代理修复脚本"
echo "=========================================="
echo ""

# 1. 拉取最新代码
echo "1. 拉取最新代码..."
git pull origin master
if [ $? -ne 0 ]; then
    echo "❌ Git pull 失败，请检查！"
    exit 1
fi
echo "✅ 代码已更新"
echo ""

# 2. 检查 nginx.conf 是否包含 MinIO 代理配置
echo "2. 检查本地 nginx.conf..."
if grep -q "location /minio/" yjl-blog-frontend-demo/nginx.conf; then
    echo "✅ nginx.conf 包含 MinIO 代理配置"
    echo "配置内容："
    grep -A 5 "location /minio/" yjl-blog-frontend-demo/nginx.conf
else
    echo "❌ nginx.conf 缺少 MinIO 代理配置！"
    echo "请确保已经提交并推送了最新的 nginx.conf"
    exit 1
fi
echo ""

# 3. 停止前端容器
echo "3. 停止前端容器..."
docker-compose stop frontend
echo "✅ 前端容器已停止"
echo ""

# 4. 重新构建前端镜像
echo "4. 重新构建前端镜像（这可能需要几分钟）..."
docker-compose build --no-cache frontend
if [ $? -ne 0 ]; then
    echo "❌ 前端镜像构建失败！"
    exit 1
fi
echo "✅ 前端镜像构建成功"
echo ""

# 5. 启动前端容器
echo "5. 启动前端容器..."
docker-compose up -d frontend
if [ $? -ne 0 ]; then
    echo "❌ 前端容器启动失败！"
    exit 1
fi
echo "✅ 前端容器已启动"
echo ""

# 6. 等待容器启动
echo "6. 等待容器完全启动..."
sleep 5
echo ""

# 7. 验证 Nginx 配置
echo "7. 验证 Nginx 配置..."
docker exec blog-frontend nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Nginx 配置有误！"
    docker logs blog-frontend
    exit 1
fi
echo "✅ Nginx 配置正确"
echo ""

# 8. 检查容器中的配置
echo "8. 检查容器中的 MinIO 代理配置..."
if docker exec blog-frontend cat /etc/nginx/nginx.conf | grep -q "location /minio/"; then
    echo "✅ 容器中包含 MinIO 代理配置"
else
    echo "❌ 容器中缺少 MinIO 代理配置！"
    echo "这不应该发生，请检查 Dockerfile 和构建过程"
    exit 1
fi
echo ""

# 9. 测试代理
echo "9. 测试 MinIO 代理..."
echo "测试从容器内部访问："
docker exec blog-frontend curl -I http://localhost/minio/blog-images/default_head.jpg 2>/dev/null | head -n 1
echo ""

echo "测试从外部访问（需要等待几秒）..."
sleep 3
curl -I https://fbranch.top/minio/blog-images/default_head.jpg 2>/dev/null | head -n 1
echo ""

# 10. 显示容器状态
echo "10. 当前容器状态..."
docker ps --filter "name=blog-" --format "table {{.Names}}\t{{.Status}}"
echo ""

echo "=========================================="
echo "修复完成！"
echo "=========================================="
echo ""
echo "请测试以下 URL："
echo "https://fbranch.top/minio/blog-images/default_head.jpg"
echo ""
echo "如果仍然失败，请运行诊断脚本："
echo "bash diagnose-minio-proxy.sh"
