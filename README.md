### 部署
```bash
chmod +x deploy.sh

# 部署到production环境  
./deploy.sh
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
