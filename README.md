# 飞书Prompt管理工具

这是一个用于管理飞书多维表格中Prompt的工具，支持添加、编辑、删除、收藏和搜索Prompt。

## 功能特点

- 支持Prompt的增删改查
- 支持按分类和标签筛选
- 支持收藏功能
- 支持搜索功能
- 支持密码保护管理操作

## 部署说明

### Vercel部署

1. 在Vercel上创建新项目，并关联GitHub仓库

2. 配置环境变量
   在Vercel项目设置中，添加以下环境变量：
   - `REACT_APP_FEISHU_APP_ID`: 飞书应用的App ID
   - `REACT_APP_FEISHU_APP_SECRET`: 飞书应用的App Secret
   - `REACT_APP_FEISHU_APP_TOKEN`: 飞书多维表格的App Token
   - `REACT_APP_FEISHU_TABLE_ID`: 飞书多维表格的Table ID
   - `REACT_APP_ADMIN_PASSWORD`: 管理员密码

3. 部署设置
   - 构建命令: `npm run build`
   - 输出目录: `build`
   - 安装命令: `npm install`

4. 点击部署按钮，等待部署完成

### 本地开发

1. 克隆仓库
   ```
   git clone <仓库地址>
   cd feishu-prompt-manager
   ```

2. 安装依赖
   ```
   npm install
   ```

3. 创建`.env`文件，添加环境变量
   ```
   REACT_APP_FEISHU_APP_ID=你的飞书应用ID
   REACT_APP_FEISHU_APP_SECRET=你的飞书应用密钥
   REACT_APP_FEISHU_APP_TOKEN=你的飞书多维表格Token
   REACT_APP_FEISHU_TABLE_ID=你的飞书多维表格ID
   REACT_APP_ADMIN_PASSWORD=管理员密码
   ```

4. 启动开发服务器
   ```
   npm start
   ```

## 技术栈

- React
- Ant Design
- Axios
- Vercel Serverless Functions