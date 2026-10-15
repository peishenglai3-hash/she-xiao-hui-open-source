# 社小会 · She Xiao Hui

一个面向社会学学习、校园生活与日常陪伴的数字人交互示例。它保留了 2026 年 5 月早期版本的核心视觉和 SSE 对话体验，但公开版移除了真实学生/教师名录、人物档案、部署凭据、服务器地址和课程实验资料。

本项目是独立个人开源项目，不代表任何学校、学院或行政服务机构。社小会会明确说明自己是 AI，不会把虚构角色包装成真实工作人员，也不会自动向服务端或模型提供方上传姓名、班级、联系方式等个人资料。

## 快速开始

需要 Node.js 20+。

```bash
npm ci
npm run lint
npm run build
```

启动开发服务时打开两个终端：

```bash
# 终端 1：API 服务
INVITE_CODE="replace-with-a-long-random-value" npm run dev:server

# 终端 2：Vite 前端
npm run dev:client
```

PowerShell 可使用：

```powershell
$env:INVITE_CODE = "replace-with-a-long-random-value"
npm run dev:server
```

如需启用 DeepSeek，把 `DEEPSEEK_API_KEY` 只放在服务端运行环境中；不要写入源码、`.env`、截图、日志或 Git 历史。没有 key 时，服务会返回本地确定性降级消息，便于离线开发。

## 公开版的边界

- 用户偏好和手动记忆只保存在浏览器 `localStorage`，不再通过服务端记忆接口持久化。
- 发给模型的请求只包含对话消息和有限的回复/场景偏好；服务端拒绝 `system` 消息，并限制消息数量、长度、请求体大小和上游超时。
- 服务端不记录原始聊天内容、邀请码尝试或长期用户画像。
- 邀请码只是访问门槛，不等同于完整身份认证；公开部署仍应使用 HTTPS、反向代理、限流和密钥轮换。
- `public/` 中的视觉素材与校徽/品牌元素不自动获得 MIT 授权，详见 [ASSETS.md](ASSETS.md)。

## 目录

- `src/`：React 前端、聊天交互、浏览器本地偏好与记忆。
- `server/`：Express API、输入校验、上游模型代理和安全降级。
- `public/`：项目视觉素材；代码许可证与素材权利分开处理。
- `SECURITY.md`：安全边界与漏洞报告方式。

## 许可证

源代码以 MIT 许可证发布，见 [LICENSE](LICENSE)。视觉素材、商标、字体和第三方内容不因代码采用 MIT 而自动获得再授权。
