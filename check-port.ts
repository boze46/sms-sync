/**
 * 端口开放检测工具
 * 检测本地端口是否开放，以及局域网内是否可访问
 */

import { execSync } from "child_process";
import os from "os";

interface Config {
  port: number;
  response: string;
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
 * 获取本机局域网 IP 地址
 */
function getLocalIP(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const nets = interfaces[name];
    if (!nets) continue;

    for (const net of nets) {
      // 跳过内部（127.0.0.1）和非 IPv4 地址
      if (net.family === "IPv4" && !net.internal) {
        ips.push(net.address);
      }
    }
  }

  return ips;
}

/**
 * 检测本地端口是否被监听
 */
async function checkLocalPort(port: number): Promise<boolean> {
  try {
    const platform = os.platform();

    if (platform === "linux") {
      // Linux: 使用 ss 或 netstat
      try {
        const result = execSync(`ss -tuln | grep :${port}`, {
          encoding: "utf-8",
        });
        return result.trim().length > 0;
      } catch {
        // ss 失败，尝试 netstat
        try {
          const result = execSync(`netstat -tuln | grep :${port}`, {
            encoding: "utf-8",
          });
          return result.trim().length > 0;
        } catch {
          return false;
        }
      }
    } else if (platform === "darwin") {
      // macOS: 使用 lsof
      try {
        const result = execSync(`lsof -i :${port}`, { encoding: "utf-8" });
        return result.trim().length > 0;
      } catch {
        return false;
      }
    } else if (platform === "win32") {
      // Windows: 使用 netstat
      try {
        const result = execSync(`netstat -an | findstr :${port}`, {
          encoding: "utf-8",
        });
        return result.includes("LISTENING");
      } catch {
        return false;
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * 检测防火墙规则（仅 Linux）
 */
async function checkFirewall(port: number): Promise<{
  hasUfw: boolean;
  ufwActive: boolean;
  portAllowed: boolean;
}> {
  const platform = os.platform();

  if (platform !== "linux") {
    return { hasUfw: false, ufwActive: false, portAllowed: true };
  }

  try {
    // 检查是否安装了 ufw
    try {
      execSync("which ufw", { encoding: "utf-8" });
    } catch {
      return { hasUfw: false, ufwActive: false, portAllowed: true };
    }

    // 检查 ufw 是否激活
    let ufwActive = false;
    try {
      const status = execSync("sudo ufw status", { encoding: "utf-8" });
      ufwActive = status.includes("Status: active");
    } catch {
      ufwActive = false;
    }

    // 检查端口是否开放
    let portAllowed = false;
    if (ufwActive) {
      try {
        const rules = execSync("sudo ufw status numbered", { encoding: "utf-8" });
        portAllowed = rules.includes(`${port}`) || rules.includes("ALLOW");
      } catch {
        portAllowed = false;
      }
    }

    return { hasUfw: true, ufwActive, portAllowed };
  } catch (error) {
    return { hasUfw: false, ufwActive: false, portAllowed: true };
  }
}

/**
 * 尝试连接到指定的 IP 和端口
 */
async function testConnection(
  host: string,
  port: number,
  timeout: number = 3000
): Promise<boolean> {
  try {
    const socket = await Promise.race([
      Bun.connect({
        hostname: host,
        port,
        socket: {
          data() {},
          open(socket) {
            socket.end();
          },
          close() {},
          error() {},
        },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeout)
      ),
    ]);

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 主检测函数
 */
async function checkPort() {
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║         🔍 端口开放检测工具                     ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  // 加载配置
  const config = await loadConfig();
  const { port } = config;

  console.log(`📋 配置信息:`);
  console.log(`   端口: ${port}\n`);

  // 1. 获取本机 IP
  const localIPs = getLocalIP();
  console.log(`🌐 本机局域网 IP 地址:`);
  if (localIPs.length === 0) {
    console.log(`   ⚠️  未检测到局域网 IP\n`);
  } else {
    localIPs.forEach((ip) => console.log(`   - ${ip}`));
    console.log();
  }

  // 2. 检测本地端口是否被监听
  console.log(`🔍 检测本地端口 ${port} 是否被监听...`);
  const isListening = await checkLocalPort(port);

  if (isListening) {
    console.log(`   ✅ 端口 ${port} 正在被监听\n`);
  } else {
    console.log(`   ❌ 端口 ${port} 未被监听`);
    console.log(`   💡 提示: 请先启动服务器 (bun index.ts)\n`);
    process.exit(1);
  }

  // 3. 检测防火墙（Linux）
  const platform = os.platform();
  if (platform === "linux") {
    console.log(`🛡️  检测防火墙状态 (UFW)...`);
    const firewall = await checkFirewall(port);

    if (firewall.hasUfw) {
      console.log(`   ✅ 检测到 UFW 防火墙`);

      if (firewall.ufwActive) {
        console.log(`   ⚠️  UFW 防火墙已激活`);

        if (!firewall.portAllowed) {
          console.log(`   ❌ 端口 ${port} 未在防火墙中开放`);
          console.log(`\n   🔧 解决方案:`);
          console.log(`      sudo ufw allow ${port}/tcp`);
          console.log(`      sudo ufw reload\n`);
        } else {
          console.log(`   ✅ 端口 ${port} 已在防火墙中开放\n`);
        }
      } else {
        console.log(`   ℹ️  UFW 防火墙未激活\n`);
      }
    } else {
      console.log(`   ℹ️  未检测到 UFW 防火墙\n`);
    }
  }

  // 4. 测试本地连接
  console.log(`🧪 测试本地连接 (localhost:${port})...`);
  const localhostOk = await testConnection("localhost", port);

  if (localhostOk) {
    console.log(`   ✅ 本地连接成功\n`);
  } else {
    console.log(`   ❌ 本地连接失败\n`);
  }

  // 5. 测试局域网连接
  if (localIPs.length > 0) {
    console.log(`🧪 测试局域网连接...`);
    for (const ip of localIPs) {
      const success = await testConnection(ip, port);
      if (success) {
        console.log(`   ✅ ${ip}:${port} - 可访问`);
      } else {
        console.log(`   ❌ ${ip}:${port} - 无法访问`);
      }
    }
    console.log();
  }

  // 6. 总结和建议
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║              📝 配置建议                        ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  if (localIPs.length > 0) {
    console.log(`📱 Android 端 SmsForwarder 配置:`);
    console.log(`   服务器地址: ${localIPs[0]}`);
    console.log(`   端口: ${port}\n`);
  }

  if (platform === "linux") {
    console.log(`🛡️  Linux 防火墙配置（如果端口无法访问）:`);
    console.log(`   sudo ufw allow ${port}/tcp`);
    console.log(`   sudo ufw reload\n`);
  } else if (platform === "win32") {
    console.log(`🛡️  Windows 防火墙配置（如果端口无法访问）:`);
    console.log(`   1. 打开 Windows Defender 防火墙`);
    console.log(`   2. 点击"高级设置" -> "入站规则" -> "新建规则"`);
    console.log(`   3. 选择"端口" -> 输入 ${port} -> 允许连接\n`);
  } else if (platform === "darwin") {
    console.log(`🛡️  macOS 防火墙配置（如果端口无法访问）:`);
    console.log(`   1. 系统偏好设置 -> 安全性与隐私 -> 防火墙`);
    console.log(`   2. 点击"防火墙选项" -> 添加应用程序\n`);
  }

  console.log("✅ 检测完成！");
}

// 运行检测
checkPort().catch((err) => {
  console.error("❌ 检测失败:", err);
  process.exit(1);
});
