# Lambda Layers 构建和部署指南

## 目录结构
```
project/
├── layer-core/
│   └── nodejs/
│       └── package.json          # 核心依赖
├── layer-prisma/  
│   └── nodejs/
│       ├── package.json          # Prisma依赖
│       └── prisma/
│           └── schema.prisma     # 你的Prisma schema
├── layer-core.yaml               # 核心层SAM模板
├── layer-prisma.yaml             # Prisma层SAM模板
├── nest.yaml                     # 主应用SAM模板
├── build-layers.sh               # 构建脚本
└── deploy.sh                     # 部署脚本
```

## 使用步骤

### 1. 准备层配置文件
将提供的 `package.json` 文件放到对应的层目录中：
- `layer-core/nodejs/package.json`
- `layer-prisma/nodejs/package.json`

在 `layer-prisma/nodejs/` 目录下创建 `prisma/` 目录，并将你的 `schema.prisma` 文件放入其中。

### 2. 构建层
```bash
chmod +x build-layers.sh
./build-layers.sh
```

### 3. 部署
```bash
chmod +x deploy.sh

# 部署到staging环境
./deploy.sh staging

# 部署到production环境  
./deploy.sh production
```

## 环境变量
部署前确保设置以下环境变量：
```bash
export AWS_REGION=us-east-1
export AWS_PROFILE=your-profile  # 可选
```

## 注意事项
- 首次部署前确保已配置AWS CLI
- 层的依赖需要手动维护在各自的 `package.json` 中
- Prisma schema 文件需要放在 `layer-prisma/nodejs/prisma/` 目录下
- 部署会按顺序执行：core layer → prisma layer → main app
  

# 链路说明

外网访问路径：
Lambda (私有路由表) → NAT Gateway (公有路由表) → IGW → 外网

VPC内通信路径：
任何资源 (默认路由表) ↔ 任何资源 (通过local路由)

完全隔离：
默认路由表关联的子网 = 只能VPC内通信，无法访问外网
