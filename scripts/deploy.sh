#!/bin/bash

set -e

echo "🚀 开始完整部署流程..."

# 1. 清理之前的构建
echo "📁 清理构建目录..."
sudo rm -rf dist/
sudo rm -rf .aws-sam/
sudo rm -f deploy.zip

# 2. 构建
echo "📦 执行构建..."
npx prisma generate
npm run build:webpack
cp package.json dist/

echo "✅ 构建完成！"
echo "📊 构建结果:"
echo "Bundle 大小: $(du -h dist/lambda.js | cut -f1)"
echo "总大小: $(du -sh dist/ | cut -f1)"
echo "文件列表:"
ls -la dist/

# 3. 打包 deploy.zip
echo "📦 开始打包 deploy.zip..."

mkdir -p dist/node_modules/@prisma
mkdir -p dist/node_modules/.prisma

cp -r node_modules/@prisma/client dist/node_modules/@prisma/
cp -r node_modules/.prisma dist/node_modules/

cd dist

zip -r ../deploy.zip ./*

cd ..

echo "✅ 打包完成！"
echo "压缩包大小: $(du -h deploy.zip | cut -f1)"
ls -lh deploy.zip

# 4. SAM 部署
echo "🚀 开始 SAM 部署..."

# 检查 sam.yaml 是否存在
if [ ! -f "sam.yaml" ]; then
    echo "❌ 错误: sam.yaml 文件不存在！"
    exit 1
fi

echo "🎯 使用 SAM 现有配置部署..."
sam deploy --template-file sam.yaml

echo "✨ 部署完成!"
