import { processVerificationCode, type CodeProcessOptions } from "./utils";
import * as TOML from "@iarna/toml";
import SysTray from "systray2";
import clipboardy from "clipboardy";
import path from "path";

/**
 * SMS 同步服务器配置
 */
interface Config {
  port: number;
  response: string;
  regex: string;
  enable_notification: boolean;
  enable_clipboard: boolean;
}

/**
 * 验证码历史记录
 */
interface CodeHistory {
  code: string;
  time: Date;
  message: string;
}

/**
 * 全局状态
 */
const state = {
  recentCodes: [] as CodeHistory[],
  systray: null as any,
  serverRunning: true,
};

/**
 * 加载配置文件（TOML 格式）
 */
async function loadConfig(): Promise<Config> {
  const configPath = new URL("./config.toml", import.meta.url);
  const configFile = Bun.file(configPath);
  const configText = await configFile.text();
  const config = TOML.parse(configText) as Config;
  return config;
}

/**
 * 添加验证码到历史记录
 */
function addCodeToHistory(code: string, message: string) {
  const history: CodeHistory = {
    code,
    time: new Date(),
    message: message.substring(0, 50), // 限制长度
  };

  // 添加到开头，保持最多 5 条记录
  state.recentCodes.unshift(history);
  if (state.recentCodes.length > 5) {
    state.recentCodes.pop();
  }
}

/**
 * 格式化时间（相对时间）
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // 秒

  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

/**
 * 构建托盘菜单
 */
function buildTrayMenu(config: Config) {
  const iconPath = path.join(import.meta.dir, "icon.png");

  const recentCodesItems =
    state.recentCodes.length > 0
      ? state.recentCodes.map((item) => ({
          title: `${item.code} (${formatRelativeTime(item.time)})`,
          tooltip: item.message,
          enabled: true,
          checked: false,
        }))
      : [
          {
            title: "暂无验证码",
            tooltip: "等待接收验证码",
            enabled: false,
            checked: false,
          },
        ];

  return {
    icon: iconPath,
    title: "SMS Sync",
    tooltip: "SMS 同步服务",
    items: [
      {
        title: `📡 服务状态: ${state.serverRunning ? "运行中" : "已停止"}`,
        tooltip: "查看服务状态",
        enabled: false,
        checked: false,
      },
      {
        title: "---", // 分隔符
        enabled: false,
        checked: false,
      },
      {
        title: "📋 最近验证码",
        tooltip: "点击验证码可复制",
        enabled: true,
        checked: false,
        items: recentCodesItems,
      },
      {
        title: "---",
        enabled: false,
        checked: false,
      },
      {
        title: `⚙️ 端口: ${config.port}`,
        tooltip: `监听端口: ${config.port}`,
        enabled: false,
        checked: false,
      },
      {
        title: `📋 剪贴板: ${config.enable_clipboard ? "✅" : "❌"}`,
        tooltip: config.enable_clipboard ? "剪贴板已启用" : "剪贴板已禁用",
        enabled: false,
        checked: false,
      },
      {
        title: `🔔 通知: ${config.enable_notification ? "✅" : "❌"}`,
        tooltip: config.enable_notification ? "通知已启用" : "通知已禁用",
        enabled: false,
        checked: false,
      },
      {
        title: "---",
        enabled: false,
        checked: false,
      },
      {
        title: "❌ 退出",
        tooltip: "退出 SMS 同步服务",
        enabled: true,
        checked: false,
      },
    ],
  };
}

/**
 * 初始化系统托盘
 */
function initSysTray(config: Config) {
  const menu = buildTrayMenu(config);

  state.systray = new SysTray({
    menu,
    debug: false,
    copyDir: true,
  });

  // 处理点击事件
  state.systray.onClick((action: any) => {
    const title = action.item.title;

    console.log(`\n🖱️  托盘点击: ${title}`);

    // 退出
    if (title.includes("退出")) {
      console.log("👋 正在退出...");
      state.systray.kill();
      process.exit(0);
    }

    // 点击验证码，复制到剪贴板
    const codeMatch = title.match(/^(\d+)\s+\(/);
    if (codeMatch) {
      const code = codeMatch[1];
      clipboardy
        .write(code)
        .then(() => {
          console.log(`✅ 已复制验证码: ${code}`);
        })
        .catch((err) => {
          console.error(`❌ 复制失败: ${err}`);
        });
    }
  });

  console.log("✅ 系统托盘已初始化\n");
}

/**
 * 更新托盘菜单
 */
function updateTrayMenu(config: Config) {
  if (!state.systray) return;

  const menu = buildTrayMenu(config);

  state.systray.sendAction({
    type: "update-menu",
    menu,
  });
}

/**
 * 启动 SMS 接收服务器
 */
async function startServer() {
  const config = await loadConfig();
  const { port, response, regex, enable_notification, enable_clipboard } = config;

  // 准备验证码处理选项
  const codeOptions: CodeProcessOptions = {
    regex,
    enableNotification: enable_notification,
    enableClipboard: enable_clipboard,
  };

  const server = Bun.listen({
    hostname: "0.0.0.0",
    port,
    socket: {
      data(socket, data) {
        // 解码接收到的数据
        const text = Buffer.from(data).toString("utf-8");
        const clientAddress = socket.remoteAddress;

        console.log(`\n📱 收到来自 ${clientAddress} 的连接`);
        console.log(`📨 接收数据: ${text}`);

        // 处理验证码：提取、复制、通知
        processVerificationCode(text, codeOptions)
          .then((code) => {
            if (code) {
              console.log(`✨ 处理完成\n`);

              // 添加到历史记录
              addCodeToHistory(code, text);

              // 更新托盘菜单
              updateTrayMenu(config);
            } else {
              console.log(`⚠️  未提取到验证码\n`);
            }
          })
          .catch((err) => {
            console.error(`❌ 处理验证码失败: ${err}\n`);
          });

        // 发送响应给 SmsForwarder
        socket.write(response);
        console.log(`📤 发送响应: ${response}`);

        // 关闭连接
        socket.end();
      },

      open(socket) {
        console.log(`🔗 客户端已连接: ${socket.remoteAddress}`);
      },

      close(socket) {
        console.log(`🔌 客户端已断开: ${socket.remoteAddress}`);
      },

      error(socket, error) {
        console.error(`❌ Socket 错误: ${error}`);
      },
    },
  });

  console.log("╔════════════════════════════════════════════════╗");
  console.log("║    📡 SMS 同步服务器已启动 (跨平台版本)        ║");
  console.log("╚════════════════════════════════════════════════╝");
  console.log(`🌐 监听地址: 0.0.0.0:${port}`);
  console.log(`📍 本地访问: localhost:${port}`);
  console.log(`🔧 配置文件: config.toml`);
  console.log(`\n📋 当前配置:`);
  console.log(`   正则表达式: ${regex}`);
  console.log(`   剪贴板: ${enable_clipboard ? "✅ 启用" : "❌ 禁用"}`);
  console.log(`   通知: ${enable_notification ? "✅ 启用" : "❌ 禁用"}`);
  console.log(`   响应消息: ${response}`);
  console.log(`\n💡 提示: 请在 Android 手机上配置 SmsForwarder`);
  console.log(`   将短信转发到: <电脑IP>:${port}\n`);
  console.log("⏳ 等待接收短信验证码...\n");

  // 初始化系统托盘
  initSysTray(config);

  // 优雅退出处理
  process.on("SIGINT", () => {
    console.log("\n\n👋 正在关闭服务器...");
    state.serverRunning = false;
    server.stop();

    // 关闭托盘
    if (state.systray) {
      state.systray.kill();
    }

    console.log("✅ 服务器已关闭");
    process.exit(0);
  });
}

// 启动服务器
startServer().catch((err) => {
  console.error("❌ 启动服务器失败:", err);
  process.exit(1);
});
