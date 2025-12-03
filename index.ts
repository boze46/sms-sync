import { copyVerificationCode } from "./utils";

/**
 * SMS 同步服务器配置
 */
interface Config {
  port: number;
}

/**
 * 加载配置文件
 */
async function loadConfig(): Promise<Config> {
  const configPath = new URL("./config.json", import.meta.url);
  const configFile = Bun.file(configPath);
  const config = await configFile.json();
  return config as Config;
}

/**
 * 启动 SMS 接收服务器
 */
async function startServer() {
  const config = await loadConfig();
  const { port } = config;

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
        copyVerificationCode(text)
          .then((code) => {
            if (code) {
              console.log(`🎯 验证码: ${code}\n`);
            }
          })
          .catch((err) => {
            console.error(`❌ 处理验证码失败: ${err}`);
          });

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
  console.log(`🔧 配置文件: config.json`);
  console.log(`\n💡 提示: 请在 Android 手机上配置 SmsForwarder`);
  console.log(`   将短信转发到: <电脑IP>:${port}\n`);
  console.log("⏳ 等待接收短信验证码...\n");

  // 优雅退出处理
  process.on("SIGINT", () => {
    console.log("\n\n👋 正在关闭服务器...");
    server.stop();
    console.log("✅ 服务器已关闭");
    process.exit(0);
  });
}

// 启动服务器
startServer().catch((err) => {
  console.error("❌ 启动服务器失败:", err);
  process.exit(1);
});
