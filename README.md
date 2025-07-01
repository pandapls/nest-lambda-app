# NestJS Lambda 应用部署指南

这是一个基于 NestJS 的 Serverless 应用，使用 AWS Lambda、API Gateway、RDS 和相关服务构建的完整后端解决方案。

## 📋 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [AWS 架构](#aws-架构)
- [环境准备](#环境准备)
- [本地开发](#本地开发)
- [AWS 配置](#aws-配置)
- [部署指南](#部署指南)
- [环境管理](#环境管理)
- [常见问题](#常见问题)

## 🎯 项目概述

这是一个企业级的 NestJS 应用，专为 AWS Lambda 环境优化，支持：

- **Serverless 架构**: 基于 AWS Lambda 的无服务器部署
- **数据库集成**: 使用 Prisma ORM 连接 PostgreSQL
- **API 网关**: 通过 API Gateway 提供 RESTful API
- **安全网络**: VPC 配置确保网络安全
- **配置管理**: SSM Parameter Store 管理敏感配置
- **文件存储**: S3 集成用于静态资源

## 🛠 技术栈

### 后端框架
- **NestJS**: 企业级 Node.js 框架
- **Fastify**: 高性能 HTTP 服务器（Lambda 适配）
- **TypeScript**: 类型安全的 JavaScript

### 数据库
- **Prisma**: 现代化 ORM
- **PostgreSQL**: 关系型数据库

### AWS 服务
- **Lambda**: 无服务器计算
- **API Gateway**: API 管理
- **RDS**: 托管数据库
- **VPC**: 虚拟私有云
- **SSM**: 参数存储
- **S3**: 对象存储
- **CloudFormation**: 基础设施即代码

### 开发工具
- **AWS SAM**: 无服务器应用模型
- **Webpack**: 模块打包
- **Docker**: 本地开发环境

## 📁 项目结构

```
nest-lambda-app/
├── src/                          # 源代码
│   ├── database/                 # 数据库配置
│   │   └── database-config.service.ts
│   ├── lambda.ts                 # Lambda 入口
│   └── main.ts                   # 本地开发入口
├── prisma/                       # 数据库模式
│   └── schema.prisma
├── scripts/                      # 部署脚本
│   ├── deploy.sh                 # 主要部署脚本
│   ├── setup-local-dev.sh        # 本地开发设置
│   └── setup-ssm.sh              # SSM 参数配置
├── sam.yaml                      # SAM 模板
├── samconfig.toml                # SAM 配置
├── webpack.config.js             # Webpack 配置
├── package.json                  # 项目依赖
└── README.md                     # 项目文档
```

## 🏗 AWS 架构

### 核心架构

```
Internet → API Gateway → Lambda → VPC → RDS
                         ↓
                      S3 Bucket
                         ↓
                   SSM Parameters
```

### 网络架构

**外网访问路径**:
```
Lambda (私有子网) → NAT Gateway (公有子网) → Internet Gateway → 外网
```

**VPC 内通信**:
```
Lambda ↔ RDS (通过默认路由表的 local 路由)
```

### 安全配置
- Lambda 部署在私有子网中
- 数据库访问仅限 VPC 内部
- 敏感配置存储在 SSM Parameter Store
- IAM 角色最小权限原则

## 🚀 环境准备

### 1. 系统要求

- **Node.js**: 20.x 或更高版本
- **npm**: 8.x 或更高版本
- **AWS CLI**: 2.x
- **AWS SAM CLI**: 1.x
- **Docker**: 用于本地开发

### 2. AWS CLI 配置

```bash
# 配置 AWS 凭证
aws configure

# 或使用 profile
aws configure --profile your-profile-name

# 验证配置
aws sts get-caller-identity
```

### 3. 环境变量设置

```bash
# 必需的环境变量
export AWS_REGION=us-east-1
export AWS_PROFILE=your-profile  # 可选

# 验证设置
echo $AWS_REGION
```

## 💻 本地开发

### 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 设置本地开发环境
npm run dev:setup

# 3. 启动本地数据库
npm run dev:db

# 4. 生成 Prisma 客户端
npm run db:generate

# 5. 推送数据库模式
npm run db:push

# 6. 启动开发服务器
npm run dev
```

### 开发命令详解

```bash
# === 本地开发 ===
npm run dev:setup        # 设置本地开发环境
npm run dev              # 启动 NestJS 开发服务器
npm run dev:sam          # 启动 SAM 本地服务器
npm run dev:db           # 启动本地数据库
npm run dev:status       # 查看服务状态
npm run dev:stop         # 停止所有服务
npm run dev:reset        # 重置开发环境

# === Prisma 操作 ===
npm run db:generate      # 生成 Prisma 客户端
npm run db:push          # 推送数据库模式
npm run db:studio        # 打开 Prisma Studio
npm run db:migrate       # 运行数据库迁移
npm run db:seed          # 执行数据库种子

# === 构建和部署 ===
npm run build:webpack    # Webpack 构建
npm run deploy:lambda    # 部署到 Lambda
npm run analyze:bundle   # 分析构建包大小
```

### 本地环境说明

- **数据库**: PostgreSQL 容器 (localhost:5433)
- **API 服务**: NestJS 开发服务器 (localhost:3001)
- **Lambda 模拟**: SAM Local (localhost:3000)

## ⚙️ AWS 配置

### 1. VPC 网络配置

当前项目使用的 VPC 配置：

```yaml
VpcConfig:
  SecurityGroupIds:
    - sg-0dabb594f5cfcbf34    # 默认安全组

```

**⚠️ 重要**: 请根据您的 AWS 环境修改这些 ID

### 2. SSM 参数配置

运行以下命令设置数据库配置：

```bash
# 设置 SSM 参数
npm run setup:ssm

# 或手动设置
aws ssm put-parameter \
  --name "/nest-app/database-write-url" \
  --value "postgresql://username:password@host:5432/database" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/nest-app/database-read-url" \
  --value "postgresql://username:password@read-host:5432/database" \
  --type "SecureString"
```

### 3. S3 存储桶

确保存在以下 S3 存储桶：

```bash
# 创建应用资源存储桶
aws s3 mb s3://mina-community-assets --region us-east-1

# SAM 部署存储桶会自动创建
```

### 4. RDS 数据库配置

建议的 RDS 配置：

- **引擎**: PostgreSQL 15+
- **实例类型**: db.t3.micro (开发) / db.t3.small (生产)
- **VPC**: 与 Lambda 相同的 VPC
- **子网组**: 私有子网
- **安全组**: 允许来自 Lambda 安全组的 5432 端口访问

## 🚢 部署指南

### 1. 一键部署

```bash
# 使用部署脚本（推荐）
npm run deploy:lambda

# 或直接运行脚本
./scripts/deploy.sh
```

### 2. 手动部署步骤

```bash
# 1. 生成 Prisma 客户端
npx prisma generate

# 2. 构建应用
npm run build:webpack

# 3. SAM 构建
sam build

# 4. SAM 部署
sam deploy
```

### 3. 部署配置

部署配置在 `samconfig.toml` 中定义：

```toml
[default.deploy.parameters]
stack_name = "nest-lambda-app-prod-v1"
region = "us-east-1"
parameter_overrides = [
    "Environment=\"production\""
]
```

### 4. 验证部署

```bash
# 获取 API 端点
aws cloudformation describe-stacks \
  --stack-name nest-lambda-app-prod-v1 \
  --query 'Stacks[0].Outputs'

# 测试 API
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/api/health
```

## 🌍 环境管理

### 支持的环境

- **staging**: 预发布环境
- **test**: 测试环境  
- **production**: 生产环境

### 环境切换

```bash
# 部署到不同环境
sam deploy --parameter-overrides Environment=staging
sam deploy --parameter-overrides Environment=production

# 使用不同的配置文件
sam deploy --config-file samconfig-staging.toml
```

### 环境特定配置

每个环境可以有不同的：
- Stack 名称
- SSM 参数路径
- VPC 配置
- 资源标签

## 🔧 配置详解

### Lambda 函数配置

```yaml
NestjsFunction:
  Properties:
    Runtime: nodejs20.x
    MemorySize: 3008
    Timeout: 30
    Architectures: ['arm64']
    EphemeralStorage:
      Size: 512
```

### 环境变量

Lambda 函数配置的环境变量：

```yaml
Environment:
  Variables:
    PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: '1'
    PRISMA_GENERATE_SKIP_DOWNLOAD: 'true'
    PRISMA_CLI_QUERY_ENGINE_TYPE: 'library'
    PRISMA_ENGINE_PROTOCOL: 'binary'
    DEBUG: 'prisma:*'
```

### API Gateway 配置

```yaml
Api:
  Properties:
    StageName: api
    Cors:
      AllowMethods: "'*'"
      AllowHeaders: "'Content-Type,Authorization'"
      AllowOrigin: "'*'"
      MaxAge: 600
```

## 🐛 常见问题

### 1. Prisma 相关问题

**问题**: Prisma 客户端无法连接数据库
```bash
# 解决方案：检查数据库 URL 和网络配置
npm run db:generate
aws ssm get-parameter --name "/nest-app/database-write-url" --with-decryption
```

**问题**: Lambda 中 Prisma 二进制文件错误
```bash
# 解决方案：确保正确的二进制目标
# 在 schema.prisma 中配置：
binaryTargets = ["native", "rhel-openssl-1.0.x", "linux-arm64-openssl-3.0.x"]
```

### 2. 网络连接问题

**问题**: Lambda 无法访问外网
- 检查 NAT Gateway 配置
- 确认路由表设置
- 验证安全组规则

**问题**: Lambda 无法连接 RDS
- 检查 VPC 配置
- 确认安全组规则
- 验证子网配置

### 3. 部署问题

**问题**: SAM 部署失败
```bash
# 检查 AWS 凭证
aws sts get-caller-identity

# 检查 SAM 配置
sam validate

# 清理并重新部署
rm -rf .aws-sam/
sam build
sam deploy
```

**问题**: 构建包过大
```bash
# 分析构建包
npm run analyze:bundle

# 优化依赖
npm audit
npm prune --production
```

### 4. 权限问题

**问题**: SSM 参数访问被拒绝
- 检查 Lambda IAM 角色权限
- 确认 SSM 参数路径正确
- 验证参数存在

**问题**: S3 访问被拒绝
- 检查 S3 存储桶策略
- 确认 IAM 角色权限
- 验证存储桶名称

## 📚 参考资源

### 官方文档
- [AWS SAM 文档](https://docs.aws.amazon.com/serverless-application-model/)
- [NestJS 文档](https://docs.nestjs.com/)
- [Prisma 文档](https://www.prisma.io/docs/)

### 最佳实践
- [AWS Lambda 最佳实践](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Serverless 架构模式](https://aws.amazon.com/architecture/serverless/)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目使用 UNLICENSED 许可证。详见 [LICENSE](LICENSE) 文件。

---

**维护者**: Backend Team  
**最后更新**: 2025-07-01