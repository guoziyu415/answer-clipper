# Answer Clipper

一个不会增加对话长度的 macOS 划词批注工具。选中 Codex、浏览器或其他应用里的文字，通过全局快捷键添加自己的批注并保存为 Markdown。

它完全在本地工作：不向聊天框发送消息，不调用模型，也不会打断当前阅读位置。

## 功能

- `⌥⌘A`：为当前选中文字添加批注、类型和标签
- `⌥⌘S`：快速保存当前选中文字
- 保留原文与批注的明确边界
- 自动记录来源应用和保存时间
- 自定义 Markdown 文件位置
- Clipboard 回退读取，并在完成后恢复原剪贴板
- 无网络请求、无 AI API、无账号依赖

## 使用方式

1. 安装 Xcode Command Line Tools 或 Xcode。
2. 在项目目录运行：

   ```bash
   ./scripts/build-app.sh
   ```

3. 打开 `build/Answer Clipper.app`。
4. 首次使用时，从菜单栏的荧光笔图标选择“辅助功能权限…”，并在系统设置中允许 Answer Clipper。
5. 在 Codex 或其他应用中选中文字。
6. 按 `⌥⌘A` 打开批注浮窗，写完后按 `⌘Enter` 保存。

`⌥⌘S` 可以不写批注，直接保存选中文字。

默认保存位置：`~/Documents/AnswerClipper/Inbox.md`。可以从菜单栏选择其他 Markdown 文件。

## 开发

运行测试：

```bash
swift test
```

项目使用 Swift Package Manager，无第三方依赖，支持 macOS 13 及以上版本。

## Markdown 格式

每条摘录由原文、可选批注、类型、标签、来源应用和时间组成：

```markdown
## 这是我的理解

> 选中的回答原文

**批注：**
这是我的理解

**类型：** 想法
**标签：** #插件 #MCP
**来源：** Codex
**时间：** 2026-08-14 00:10
```

## 隐私

Answer Clipper 完全在本地运行，不调用模型，也不会发送或生成新的对话消息。选中的文字和批注只会写入你指定的 Markdown 文件。
