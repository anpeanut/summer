
### 项目运行指南 (React + TypeScript)

```markdown
# React 项目运行指南

## 📦 环境要求
- **Node.js**: v18.x 或更高版本 (建议官网下载LTS版本并以管理员身份运行) 
  [下载地址](https://nodejs.org/)
- **npm**: v9.x 或更高版本 (随 Node.js 自动安装)

## 🚀 本地运行
1. **克隆仓库**:
   ```bash
   git clone https://github.com/anpeanut/summer.git
   cd .\frontend\
   ```

2. **安装依赖**:
   ```bash
   npm install
   ```

3. **启动开发服务器**:
   ```bash
   npm start
   ```
   - 自动打开浏览器访问: `http://localhost:3000`
   - 修改代码会自动热更新

## ☁️ 部署到 Azure
### 自动部署 (推荐)
1. 已部署工作流，推送代码到 `main` 分支即可
2. 会自动触发部署流程:
   - GitHub Actions 构建生产包
   - Azure 自动更新线上版本
3. 访问线上地址:  
   `https://blue-pond-0e5d6d300.2.azurestaticapps.net/`

### 手动部署
1. 生成生产包:
   ```bash
   npm run build
   ```
2. 使用 [Azure Static Web Apps 扩展](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurestaticwebapps):
   - VS Code 左侧栏点击 Azure 图标
   - 右键你的应用 → 选择 `Deploy to Static Web App`
   - 选择 `build` 文件夹

## 🔗 线上访问
- 最新部署版本:  
  `https://blue-pond-0e5d6d300.2.azurestaticapps.net/`
- 变更生效时间: 推送代码后约 2-5 分钟

> 💡 **提示**: 所有代码变更必须推送到 `main` 分支才会触发自动部署
```

---

### 关键信息速查表
| 项目 | 命令/地址 |
|------|-----------|
| 本地运行 | `npm start` |
| 生产构建 | `npm run build` |
| 依赖安装 | `npm install` |
| 线上地址 | https://blue-pond-0e5d6d300.2.azurestaticapps.net/|
| 问题排查 | 查看 GitHub Actions 日志 |

