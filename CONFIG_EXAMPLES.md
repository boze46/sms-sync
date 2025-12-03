# 配置文件示例（TOML 格式）

该文件展示了 `config.toml` 的各种配置选项和使用场景。

## 为什么使用 TOML？

相比 JSON，TOML 有以下优势：
- ✅ **支持注释**：使用 `#` 添加说明
- ✅ **正则表达式友好**：使用单引号 `''` 无需转义
- ✅ **人类可读**：专为配置文件设计
- ✅ **类型安全**：明确的类型系统

---

## 基础配置（当前默认）

```toml
# SMS 同步服务器配置文件

# 服务器监听端口
port = 46000

# 发送给 SmsForwarder 的响应消息
response = "success"

# 正则表达式（提取验证码）
# 注意：单引号 '' 无需转义，双引号 "" 需要转义
regex = '\d{4,}'

# 是否显示系统通知
enable_notification = true

# 是否自动复制到剪贴板
enable_clipboard = true
```

---

## 配置选项详解

### 1. port（端口号）
- **类型**：整数
- **说明**：Socket 服务器监听端口
- **示例**：`46000`, `65432`, `8080`
- **建议**：使用 1024-65535 之间的端口

### 2. response（响应消息）
- **类型**：字符串
- **说明**：发送给 SmsForwarder 的响应内容（必须非空）
- **示例**：`"success"`, `"ok"`, `"received"`
- **建议**：保持默认 `"success"` 即可

### 3. regex（正则表达式）
- **类型**：字符串
- **说明**：用于提取验证码的正则表达式
- **重要**：使用单引号 `''` 无需转义，使用双引号 `""` 需要转义

#### TOML 正则表达式语法对比

| JSON（旧格式） | TOML（推荐） | 说明 |
|--------------|-------------|------|
| `"\\d{4,}"` | `'\d{4,}'` | 4位以上数字 |
| `"\\d{6}"` | `'\d{6}'` | 恰好6位数字 |
| `"[A-Za-z0-9]{6,}"` | `'[A-Za-z0-9]{6,}'` | 字母+数字 |
| `"(?<=验证码[:：])\\d+"` | `'(?<=验证码[:：])\d+'` | 后行断言 |

#### 常用正则表达式示例

```toml
# 4-8位数字
regex = '\d{4,8}'

# 恰好6位数字（银行验证码）
regex = '\d{6}'

# 任意长度数字
regex = '\d+'

# 6位以上字母+数字混合
regex = '[A-Za-z0-9]{6,}'

# 提取"验证码："后的数字
regex = '(?<=验证码[:：])\d+'

# 提取【】中的数字
regex = '(?<=【).*?(?=】)'
```

### 4. enable_notification（是否显示通知）
- **类型**：布尔值
- **说明**：是否显示系统托盘通知
- **可选值**：`true`（启用）/ `false`（禁用）
- **建议**：日常使用建议启用，测试时可禁用

### 5. enable_clipboard（是否复制到剪贴板）
- **类型**：布尔值
- **说明**：是否自动复制验证码到剪贴板
- **可选值**：`true`（启用）/ `false`（禁用）
- **建议**：通常启用以方便粘贴

---

## 使用场景配置示例

### 场景 1：仅提取，不复制不通知（静默模式）

```toml
port = 46000
response = "success"
regex = '\d{4,}'
enable_notification = false
enable_clipboard = false
```

**适用场景**：
- 仅需要在终端日志中查看验证码
- 不想被通知打扰
- 测试或调试

---

### 场景 2：仅复制，不通知（安静模式）

```toml
port = 46000
response = "success"
regex = '\d{4,}'
enable_notification = false  # 关闭通知
enable_clipboard = true       # 保持复制
```

**适用场景**：
- 自动复制到剪贴板
- 不想被通知声音打扰
- 工作时需要专注

---

### 场景 3：仅通知，不复制（提醒模式）

```toml
port = 46000
response = "success"
regex = '\d{4,}'
enable_notification = true   # 保持通知
enable_clipboard = false     # 关闭复制
```

**适用场景**：
- 需要手动输入验证码（更安全）
- 仅需通知提醒
- 剪贴板有其他重要内容

---

### 场景 4：提取 6 位数字验证码（银行）

```toml
port = 46000
response = "success"
regex = '\d{6}'  # 恰好6位，无需转义！
enable_notification = true
enable_clipboard = true
```

**适用场景**：
- 银行或支付应用（通常是 6 位）
- 严格限制验证码长度
- 避免误匹配

---

### 场景 5：提取字母+数字混合验证码

```toml
port = 46000
response = "success"
regex = '[A-Za-z0-9]{6,8}'  # 无需转义！
enable_notification = true
enable_clipboard = true
```

**适用场景**：
- 某些网站使用字母+数字混合验证码
- 示例：`A1B2C3`, `XYZ789`

---

### 场景 6：提取特定格式（如"验证码："后的数字）

```toml
port = 46000
response = "success"
# 使用后行断言，单引号无需转义！
regex = '(?<=验证码[:：])\d+'
enable_notification = true
enable_clipboard = true
```

**适用场景**：
- 短信格式统一（如："您的验证码：123456"）
- 更精确的匹配，避免误提取

---

## TOML 语法要点

### 1. 注释

```toml
# 这是单行注释
port = 46000  # 行尾注释也可以
```

### 2. 字符串

```toml
# 基本字符串（需要转义特殊字符）
response = "success"

# 字面字符串（不需要转义，推荐用于正则）
regex = '\d{4,}'

# 多行基本字符串
description = """
这是一个
多行字符串
"""

# 多行字面字符串
long_regex = '''
\d{4,}
[A-Za-z]+
'''
```

### 3. 布尔值

```toml
enable_notification = true
enable_clipboard = false
```

### 4. 整数

```toml
port = 46000
timeout = 3000
```

---

## 测试配置

修改配置后，可以通过以下方式验证：

```bash
# 启动服务器（会显示当前配置）
bun start

# 查看配置是否正确加载
# 输出会显示：
#   📋 当前配置:
#      正则表达式: \d{4,}
#      剪贴板: ✅ 启用
#      通知: ✅ 启用

# 新终端运行测试
bun test
```

---

## 常见问题

### 1. TOML 语法错误？

**常见错误**：
```toml
# ❌ 错误：使用了双引号但没有转义
regex = "\d{4,}"

# ✅ 正确：使用单引号
regex = '\d{4,}'

# ✅ 或者：使用双引号并正确转义
regex = "\\d{4,}"
```

**检查方法**：
```bash
# 启动服务器，查看错误信息
bun start

# 如果 TOML 语法错误，会显示详细的错误位置
```

### 2. 正则表达式不工作？

**调试步骤**：
1. 检查正则表达式语法是否正确
2. 使用单引号避免转义问题
3. 查看服务器日志：
   ```
   ⚠️  未找到符合正则 "..." 的验证码
   ```

### 3. 配置修改后不生效？

**解决方法**：
- 重启服务器（Ctrl+C 停止，再运行 `bun start`）
- TOML 会立即读取，无需缓存清理

---

## 推荐配置

### 日常使用（推荐）

```toml
port = 46000
response = "success"
regex = '\d{4,8}'  # 4-8位数字，覆盖大多数情况
enable_notification = true
enable_clipboard = true
```

### 工作场景（安静）

```toml
port = 46000
response = "success"
regex = '\d{4,8}'
enable_notification = false  # 不打扰
enable_clipboard = true
```

### 测试调试

```toml
port = 46000
response = "success"
regex = '\d+'  # 匹配任意数字
enable_notification = false
enable_clipboard = false
```

---

## 从 JSON 迁移到 TOML

如果你之前使用的是 `config.json`，迁移非常简单：

### JSON 格式（旧）
```json
{
  "port": 46000,
  "response": "success",
  "regex": "\\d{4,}",
  "enableNotification": true,
  "enableClipboard": true
}
```

### TOML 格式（新）
```toml
port = 46000
response = "success"
regex = '\d{4,}'  # 单引号，无需转义！
enable_notification = true  # 注意：使用 snake_case
enable_clipboard = true
```

**主要区别**：
1. ✅ 支持注释（`#`）
2. ✅ 正则表达式无需双重转义
3. ✅ 字段名使用 `snake_case`（`enable_notification` 而非 `enableNotification`）
4. ✅ 更简洁清晰

---

## 更多参考

- [TOML 官方文档](https://toml.io/cn/)
- [正则表达式测试工具](https://regex101.com/)
- 项目文档：`README.md`
