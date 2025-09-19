# Chat Echo - 操作记录器

一个强大的VS Code扩展，用于记录用户在编辑器中的操作和AI对话内容到本地文件。

## 功能特性

### 📝 操作记录
- **光标位置跟踪**: 记录光标移动、选择范围和文件定位
- **文件操作记录**: 跟踪文件的打开、保存、关闭操作
- **文本变化监控**: 记录代码编辑和修改历史
- **命令执行日志**: 捕获VS Code命令的执行记录

### 🤖 AI对话跟踪
- **智能内容检测**: 自动识别可能的AI对话内容
- **剪贴板监控**: 检测复制的AI回复内容
- **对话上下文记录**: 保存完整的用户-AI交互历史
- **多AI工具支持**: 兼容Cursor、GitHub Copilot等AI编程工具

### 💾 本地存储
- **结构化日志**: JSON格式存储，便于分析和处理
- **文件轮转**: 自动管理日志文件大小，防止磁盘空间耗尽
- **可配置路径**: 支持自定义日志存储位置
- **数据安全**: 所有数据仅存储在本地，保护隐私

## 安装方式

### 从源码安装
1. 克隆仓库到本地
2. 安装依赖：`npm install`
3. 编译项目：`npm run compile`
4. 在VS Code中按F5启动调试模式

### 打包安装
```bash
npm install -g vsce
vsce package
code --install-extension chat-echo-0.0.1.vsix
```

## 使用方法

### 基本操作
1. 安装扩展后，它会自动开始记录操作
2. 使用命令面板（Ctrl+Shift+P）访问以下命令：
   - `Chat Echo: 开始记录操作` - 开始记录用户操作
   - `Chat Echo: 停止记录操作` - 停止记录
   - `Chat Echo: 查看操作日志` - 在新窗口中查看日志
   - `Chat Echo: 清空操作日志` - 清除所有日志记录

### 配置选项
在VS Code设置中搜索"Chat Echo"来配置扩展：

```json
{
  "chatEcho.enabled": true,                    // 启用/禁用扩展
  "chatEcho.logPath": "",                      // 自定义日志路径（留空使用默认）
  "chatEcho.recordCursorMovement": true,       // 记录光标移动
  "chatEcho.recordFileOperations": true,       // 记录文件操作
  "chatEcho.recordAIChat": true,               // 记录AI对话
  "chatEcho.maxLogFileSize": 10                // 最大日志文件大小（MB）
}
```

## 日志格式

每条日志记录都包含以下信息：
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "type": "CURSOR_MOVEMENT",
  "data": {
    "filePath": "/path/to/file.js",
    "fileName": "file.js",
    "line": 42,
    "character": 15,
    "selectionStart": {"line": 42, "character": 10},
    "selectionEnd": {"line": 42, "character": 20},
    "isSelection": true
  }
}
```

### 支持的日志类型
- `CURSOR_MOVEMENT` - 光标位置变化
- `EDITOR_FOCUS` / `EDITOR_BLUR` - 编辑器焦点变化
- `FILE_OPEN` / `FILE_SAVE` / `FILE_CLOSE` - 文件操作
- `TEXT_CHANGE` - 文本内容变化
- `COMMAND_EXECUTION` - 命令执行
- `AI_CONVERSATION` - AI对话记录
- `AI_CLIPBOARD_CONTENT` - AI内容检测

## 开发指南

### 项目结构
```
src/
├── extension.ts              # 扩展主入口
├── operationRecorder.ts      # 操作记录器
├── logManager.ts            # 日志管理器
├── aiConversationTracker.ts # AI对话跟踪器
└── test/                    # 测试文件
```

### 开发命令
```bash
npm run compile          # 编译TypeScript
npm run watch           # 监听文件变化并自动编译
npm run lint            # 代码检查
npm run test            # 运行测试
```

### 贡献指南
1. Fork 项目
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 创建Pull Request

## 隐私说明

Chat Echo扩展非常重视用户隐私：
- 所有数据仅存储在本地计算机上
- 不会向任何外部服务器发送数据
- 用户可以随时删除或清空日志文件
- 支持自定义存储位置，便于数据管理

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 更新日志

### v0.0.1
- 初始版本发布
- 基本的操作记录功能
- AI对话内容检测
- 本地文件存储系统
- 可配置的记录选项

## 支持与反馈

如果您遇到问题或有功能建议，请：
1. 查看[常见问题](docs/FAQ.md)
2. 在GitHub上创建Issue
3. 发送邮件至开发团队

---

**享受更智能的编程体验！** 🚀