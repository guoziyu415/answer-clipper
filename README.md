# Answer Clipper

一个不会增加对话长度的 macOS 划词批注工具。选中 ChatGPT 桌面版或其他应用里的文字，选区旁会自动出现“批注”按钮；点击即可添加自己的批注并保存为 Markdown。

它完全在本地工作：不向聊天框发送消息，不调用模型，也不会打断当前阅读位置。

## 功能

- 鼠标划选或双击文字后，在选区旁显示“批注”按钮
- 点击浮动按钮添加批注、类型和标签，不产生新对话
- `⌥⌘A`：备用快捷键，为当前选中文字添加批注
- `⌥⌘S`：备用快捷键，快速保存当前选中文字
- 保留原文与批注的明确边界
- 自动记录来源应用和保存时间
- 每条批注可选择本次保存文件，并可将其设为新的默认位置
- 菜单栏可更改或恢复默认 Markdown 保存位置
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
5. 在 ChatGPT 桌面版或其他应用中，用鼠标划选一段文字。
6. 点击选区旁出现的“批注”按钮，写完后按 `⌘Enter` 保存。

如果浮动按钮不方便使用，也可以按 `⌥⌘A` 打开批注框；`⌥⌘S` 可以不写批注，直接保存选中文字。

默认保存位置：`~/Documents/AnswerClipper/Inbox.md`。批注窗口可以为当前摘录选择其他 Markdown 文件，也可以将所选位置设为以后默认位置。菜单栏还可以随时更改或恢复默认位置。

## 开发

运行测试：

```bash
swift test
```

项目使用 Swift Package Manager，无第三方依赖，支持 macOS 13 及以上版本。

开发过程中如果需要让辅助功能授权在重新构建后保持有效，可以使用稳定的开发签名：

```bash
CODE_SIGN_IDENTITY="Apple Development: your-name@example.com (TEAMID)" ./scripts/build-app.sh
```

未设置 `CODE_SIGN_IDENTITY` 时，构建脚本使用本地临时签名。

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
