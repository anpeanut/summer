# Flask 后端项目文档

## 📦 环境要求
- **Python**: 3.8 或更高版本
- **核心依赖**:
- Flask (微框架核心)
- Cerberus (数据校验)
- 其他依赖见 `requirements.txt`

## 🚀 快速开始
1. **安装依赖**:
```bash
pip install -r requirements.txt
```

2. **本地开发服务器**:
```bash
python app.py
```
- 开发模式: `http://localhost:5000` (自动热更新)

## ☁️ 自动化部署
### GitHub Actions 工作流
- 触发条件: 主分支(`main`)的推送(push)或合并(merge)事件
- 自动执行: 构建、测试及部署到 Azure App Service
- 工作流文件: `.github/workflows/deploy.yml`

### 部署流程
1. **构建阶段**:
- 设置 Python 环境
- 安装项目依赖
- 运行单元测试 (需配置测试脚本)

2. **部署阶段**:
- 使用 OpenID Connect 进行 Azure 认证
- 将构建产物部署到预配置的 Azure Web App
- 自动重启应用服务

```yaml
# 示例工作流片段
name: Azure Deployment
on:
push:
branches: [ main ]
pull_request:
branches: [ main ]

jobs:
deploy:
runs-on: ubuntu-latest
steps:
- uses: actions/checkout@v4
- uses: azure/login@v2
with:
client-id: ${{ secrets.AZURE_CLIENT_ID }}
tenant-id: ${{ secrets.AZURE_TENANT_ID }}
subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
- name: Deploy to Azure Web App
uses: azure/webapps-deploy@v3
with:
app-name: 'your-app-name'
package: '.'
```

## 🔧 核心功能
### 1. 数据校验系统
- 使用 Cerberus 实现严格的请求参数校验
- 支持嵌套结构校验（如 GeoJSON 格式）

### 2. 标准化响应
- 统一响应格式包含：
- API 版本号
- UTC 时间戳
- 数据主体
- 元数据（来源、许可协议等）

## 📂 项目结构
```
/flask_backend
├── .github/
│└── workflows/
│└── deploy.yml# CI/CD 工作流配置
├── app.py# 主应用文件
├── requirements.txt# 依赖列表
└── /project_docs# 文档目录
└── API.md# API文档
```

## 🔗 相关资源
- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [Azure App Service 部署指南](https://learn.microsoft.com/en-us/azure/app-service/deploy-github-actions)
- [OpenID Connect 认证配置](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-secret)

> 💡 **提示**:
> - 生产环境变量通过 GitHub Repository Secrets 配置
> - 部署状态可通过仓库的 "Actions" 标签页实时监控
> - 主分支保护建议启用 Required Status Checks 确保部署质量