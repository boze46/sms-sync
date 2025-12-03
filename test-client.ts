/**
 * 测试客户端 - 模拟 SmsForwarder 发送验证码
 */

const PORT = 65432;
const HOST = "localhost";

async function sendTestMessage(message: string) {
  try {
    console.log(`📤 发送测试消息: ${message}`);

    const socket = await Bun.connect({
      hostname: HOST,
      port: PORT,
      socket: {
        data(socket, data) {
          console.log("✅ 服务器响应:", Buffer.from(data).toString());
        },
        open(socket) {
          console.log("🔗 已连接到服务器");
          // 发送消息
          socket.write(message);
        },
        close() {
          console.log("🔌 连接已关闭\n");
        },
        error(socket, error) {
          console.error("❌ 错误:", error);
        },
      },
    });
  } catch (error) {
    console.error("❌ 连接失败:", error);
  }
}

// 测试用例
const testMessages = [
  "{【测试】您的验证码是 123456，请在5分钟内完成验证}",
  "{【银行】您的动态密码为 8888，有效期3分钟}",
  "{验证码：9527，用于登录操作}",
];

// 依次发送测试消息
async function runTests() {
  console.log("🧪 开始测试 SMS 同步功能\n");
  console.log("⚠️  请确保服务器已启动: bun index.ts\n");

  for (const message of testMessages) {
    await sendTestMessage(message);
    // 等待 1 秒再发送下一条
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("✅ 测试完成！");
  process.exit(0);
}

runTests();
