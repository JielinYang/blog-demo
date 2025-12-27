#!/bin/bash

# 强制重新构建前端容器脚本

echo "=========================================="
echo "强制重新构建前端容器"
echo "=========================================="
echo ""

# 1. 停止并删除前端容器
echo "1. 停止并删除前端容器..."
docker-compose stop frontend
docker-compose rm -f frontend
echo "✅ 前端容器已删除"
echo ""

# 2. 删除前端镜像
echo "2. 删除旧的前端镜像..."
FRONTEND_IMAGE=$(docker images | grep blog-frontend | awk '{print $3}' | head -n 1)
if [ ! -z "$FRONTEND_IMAGE" ]; then
    docker rmi -f $FRONTEND_IMAGE
    echo "✅ 旧镜像已删除: $FRONTEND_IMAGE"
else
    echo "⚠️  未找到旧镜像"
fi
echo ""

# 3. 清理构建缓存
echo "3. 清理 Docker 构建缓存..."
docker builder prune -f
echo "✅ 构建缓存已清理"
echo ""

# 4. 验证本地 nginx.conf
echo "4. 验证本地 nginx.conf 文件..."
if grep -q "events {" yjl-blog-frontend-demo/nginx.conf; then
    echo "✅ nginx.conf 包含 events 块"
else
    echo "❌ nginx.conf 缺少 events 块！"
    exit 1
fi

if grep -q "http {" yjl-blog-frontend-demo/nginx.conf; then
    echo "✅ nginx.conf 包含 http 块"
else
    echo "❌ nginx.conf 缺少 http 块！"
    exit 1
fi

if grep -q "location /minio/" yjl-blog-frontend-demo/nginx.conf; then
    echo "✅ nginx.conf 包含 MinIO 代理配置"
else
    echo "❌ nginx.conf 缺少 MinIO 代理配置！"
    exit 1
fi
echo ""

# 5. 验证 Dockerfile
echo "5. 验证 Dockerfile..."
if grep -q "COPY nginx.conf /etc/nginx/nginx.conf" yjl-blog-frontend-demo/Dockerfile; then
    echo "✅ Dockerfile 配置正确"
else
    echo "❌ Dockerfile 配置错误！"
    exit 1
fi
echo ""

# 6. 重新构建（完全不使用缓存）
echo "6. 重新构建前端镜像（这可能需要几分钟）..."
docker-compose build --no-cache --pull frontend
if [ $? -ne 0 ]; then
    echo "❌ 构建失败！"
    exit 1
fi
echo "✅ 前端镜像构建成功"
echo ""

# 7. 启动容器
echo "7. 启动前端容器..."
docker-compose up -d frontend
if [ $? -ne 0 ]; then
    echo "❌ 容器启动失败！"
    exit 1
fi
echo "✅ 前端容器已启动"
echo ""

# 8. 等待容器启动
echo "8. 等待容器完全启动..."
sleep 10
echo ""

# 9. 检查容器状态
echo "9. 检查容器状态..."
CONTAINER_STATUS=$(docker ps --filter "name=blog-frontend" --format "{{.Status}}")
if [[ $CONTAINER_STATUS == *"Up"* ]]; then
    echo "✅ 容器运行正常: $CONTAINER_STATUS"
else
    echo "❌ 容器状态异常: $CONTAINER_STATUS"
    echo ""
    echo "查看容器日志："
    docker logs blog-frontend --tail 30
    exit 1
fi
echo ""

# 10. 验证容器中的配置
echo "10. 验证容器中的 nginx.conf..."
docker exec blog-frontend head -n 10 /etc/nginx/nginx.conf
echo ""

# 11. 测试 Nginx 配置
echo "11. 测试 Nginx 配置语法..."
docker exec blog-frontend nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Nginx 配置测试失败！"
    docker logs blog-frontend --tail 20
    exit 1
fi
echo "✅ Nginx 配置测试通过"
echo ""

# 12. 测试访问
echo "12. 测试 MinIO 代理..."
sleep 3
curl -I https://fbranch.top/minio/blog-images/default_head.jpg 2>/dev/null | head -n 1
echo ""

echo "=========================================="
echo "✅ 重新构建完成！"
echo "=========================================="
echo ""
echo "请测试图片访问："
echo "https://fbranch.top/minio/blog-images/default_head.jpg"
