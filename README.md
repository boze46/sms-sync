# 📱 SMS Sync - 跨平台短信验证码同步工具

<div align="center">

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![Bun](https://img.shields.io/badge/bun-%3E%3D1.0.0-black)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

一个使用 **Bun** 开发的跨平台短信验证码同步工具，可以将 Android 手机上的短信验证码自动同步到电脑端，并自动复制到剪贴板。

> 本项目是 [lzhdelife/SMS](https://github.com/lzhdelife/SMS) 的 Bun 版本复刻，原项目仅支持 Windows，本项目支持 **Windows、macOS、Linux** 全平台。

---

## ✨ 功能特性

- 📡 **跨平台支持** - Windows、macOS、Linux 全平台可用
- 🚀 **自动提取验证码** - 智能识别 4 位以上数字验证码
- 📋 **自动复制剪贴板** - 收到验证码后自动复制，直接粘贴使用
- 🔔 **系统通知提醒** - 跨平台系统通知，第一时间提醒
- ⚡ **高性能** - 基于 Bun 运行时，启动快速，资源占用低
- 🔧 **配置简单** - 仅需配置端口号即可使用

---

## 📸 效果展示

收到验证码后：
1. ✅ 自动提取验证码数字
2. ✅ 自动复制到系统剪贴板
3. ✅ 显示系统通知提醒
4. ✅ 终端显示详细日志

---

## 🚀 快速开始

### 1. 环境要求

- **Bun** >= 1.0.0 ([安装 Bun](https://bun.sh))
- **Node.js** (可选，用于某些依赖的兼容性)

### 2. 安装依赖

```bash
git clone <your-repo-url>
cd sms-sync
bun install
```

### 3. 配置端口

编辑 `config.json` 文件，设置监听端口（默认 65432）：

```json
{
  "port": 65432
}
```

### 4. 启动服务器

```bash
bun index.ts
```

或使用热重载模式（推荐开发使用）：

```bash
bun --hot index.ts
```

启动成功后会显示：

```
╔════════════════════════════════════════════════╗
║    📡 SMS 同步服务器已启动 (跨平台版本)        ║
╚════════════════════════════════════════════════╝
🌐 监听地址: 0.0.0.0:65432
📍 本地访问: localhost:65432
🔧 配置文件: config.json

💡 提示: 请在 Android 手机上配置 SmsForwarder
   将短信转发到: <电脑IP>:65432

⏳ 等待接收短信验证码...
```

---

## 📱 Android 端配置

### 1. 安装 SmsForwarder

在 Android 手机上安装短信转发器 [SmsForwarder](https://github.com/pppscn/SmsForwarder)

### 2. 配置转发规则

1. **关闭验证码安全保护**
   在手机设置中搜索"验证码"，关闭验证码安全保护功能

2. **配置发送通道**
   - 通道类型：Socket
   - 服务器地址：`<电脑IP>`
   - 端口：`65432`（与 config.json 中的端口一致）

3. **测试连接**
   发送测试短信，验证是否能正常接收

> 详细配置参考：[SmsForwarder 官方文档](https://gitee.com/pp/SmsForwarder/wikis/pages)

---

## 🧪 测试功能

项目包含测试客户端，可以在本地测试功能：

```bash
# 启动服务器（终端 1）
bun index.ts

# 运行测试客户端（终端 2）
bun test-client.ts
```

测试客户端会模拟发送 3 条验证码消息，验证功能是否正常。

---

## 📁 项目结构

```
sms-sync/
├── index.ts           # 主程序 - Socket 服务器
├── utils.ts           # 工具函数 - 验证码提取、剪贴板、通知
├── test-client.ts     # 测试客户端
├── config.json        # 配置文件
├── package.json       # 项目依赖
├── tsconfig.json      # TypeScript 配置
└── README.md          # 项目文档
```

---

## 🛠️ 技术栈

| 功能 | 技术方案 | 说明 |
|------|---------|------|
| **运行时** | [Bun](https://bun.sh) | 高性能 JavaScript 运行时 |
| **TCP Socket** | `Bun.listen()` | Bun 原生 API，无需第三方库 |
| **剪贴板** | [clipboardy](https://www.npmjs.com/package/clipboardy) | 跨平台剪贴板操作 |
| **系统通知** | [node-notifier](https://www.npmjs.com/package/node-notifier) | 跨平台系统通知 |
| **正则提取** | JavaScript RegExp | 原生正则表达式支持 |

---

## 🔧 配置说明

### config.json

```json
{
  "port": 65432  // Socket 服务器监听端口
}
```

### 修改端口

如果端口被占用，可以修改 `config.json` 中的 `port` 值，并在 Android 端同步修改。

---

## 🆚 与原 Python 版本对比

| 特性 | Python 版本 | Bun 版本（本项目） |
|------|-------------|-------------------|
| **平台支持** | ❌ 仅 Windows | ✅ Windows / macOS / Linux |
| **依赖数量** | 2 个 | 2 个 |
| **启动速度** | ~1s | ⚡ ~100ms |
| **类型安全** | ❌ 无 | ✅ TypeScript |
| **热重载** | ❌ 不支持 | ✅ `--hot` 模式 |
| **剪贴板** | `pyperclip` | `clipboardy` (跨平台) |
| **通知** | `win10toast` (仅 Windows) | `node-notifier` (跨平台) |

---

## 🐛 常见问题

### 1. 服务器启动失败，提示端口被占用

**解决方案**：修改 `config.json` 中的端口号，或关闭占用端口的程序。

```bash
# Linux/macOS 查看端口占用
lsof -i :65432

# Windows 查看端口占用
netstat -ano | findstr :65432
```

### 2. Android 端无法连接

**检查项**：
- ✅ 手机和电脑在同一局域网
- ✅ 电脑防火墙允许端口 65432
- ✅ IP 地址和端口配置正确

### 3. 系统通知不显示

**Linux 用户**：需要安装 `notify-send`

```bash
# Ubuntu/Debian
sudo apt install libnotify-bin

# Arch Linux
sudo pacman -S libnotify
```

---

## 📝 开发计划

- [ ] 添加 Web UI 管理界面
- [ ] 支持多种验证码格式（字母+数字）
- [ ] 支持验证码历史记录
- [ ] 支持 WebSocket 通信
- [ ] 添加加密传输功能

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License

---

## 🙏 致谢

- 原项目：[lzhdelife/SMS](https://github.com/lzhdelife/SMS)
- 短信转发器：[SmsForwarder](https://github.com/pppscn/SmsForwarder)
- Bun 运行时：[Bun](https://bun.sh)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，欢迎点个 Star！**

</div>
