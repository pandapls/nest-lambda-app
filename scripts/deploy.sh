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

# 检查本地配置文件
if [ ! -f ".env.deploy" ]; then
    echo "❌ 未找到 .env.deploy 文件"
    echo ""
    echo "请执行以下步骤："
    echo "1. 复制配置模板: cp .env.deploy.example .env.deploy"
    echo "2. 编辑 .env.deploy 文件，填入真实的数据库密码"
    echo "3. 重新运行部署脚本"
    exit 1
fi

# 加载本地配置
echo "📋 加载本地配置..."
source .env.deploy

# 验证必要的配置
if [ -z "$DATABASE_URL_WRITE" ]; then
    echo "❌ DATABASE_URL_WRITE 未配置"
    exit 1
fi

if [ -z "$DATABASE_URL_READ" ]; then
    echo "❌ DATABASE_URL_READ 未配置"
    exit 1
fi


if [ -z "$ENVIRONMENT" ]; then
    echo "⚠️  ENVIRONMENT 未配置，使用默认值: staging"
    ENVIRONMENT="production"
fi

echo "✅ 配置验证通过："
echo "   环境: $ENVIRONMENT"
echo "   写库: $(echo $DATABASE_URL_WRITE | sed 's/:.*@/:***@/')"
echo "   读库: $(echo $DATABASE_URL_READ | sed 's/:.*@/:***@/')"
echo "   Github Token: $(echo $GITHUB_TOKEN)"

# 4. SAM 部署
echo "🚀 开始 SAM 部署..."

# 检查 sam.yaml 是否存在
if [ ! -f "sam.yaml" ]; then
    echo "❌ 错误: sam.yaml 文件不存在！"
    exit 1
fi

echo "🎯 使用 SAM 现有配置部署..."
sam deploy \
    --template-file sam.yaml \
    --parameter-overrides \
        Environment="$ENVIRONMENT" \
        DatabaseUrlWrite="$DATABASE_URL_WRITE" \
        DatabaseUrlRead="$DATABASE_URL_READ" \
        GithubToken="$GITHUB_TOKEN"



echo "✨ 部署完成!"
