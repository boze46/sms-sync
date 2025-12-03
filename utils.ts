import clipboardy from "clipboardy";
import notifier from "node-notifier";

/**
 * 提取文本中第一个长度 >= 4 的数字串
 * @param text 原始文本
 * @returns 提取的数字串，未找到则返回 null
 */
export function extractFirstLongNumber(text: string): string | null {
  // 匹配长度大于等于 4 的数字字符串
  const pattern = /\d{4,}/;
  const match = text.match(pattern);
  return match ? match[0] : null;
}

/**
 * 显示系统通知（跨平台）
 * @param title 通知标题
 * @param message 通知内容
 * @param duration 持续时间（秒），默认 3 秒
 */
export function showNotification(
  title: string,
  message: string,
  duration: number = 3
): void {
  notifier.notify({
    title,
    message,
    sound: true,
    wait: false,
    timeout: duration,
  });
}

/**
 * 复制验证码到剪贴板并显示通知
 * @param text 接收到的短信文本（格式：{短信内容}）
 * @returns 提取的验证码，未找到则返回 null
 */
export async function copyVerificationCode(text: string): Promise<string | null> {
  const number = extractFirstLongNumber(text);

  if (number) {
    // 复制到剪贴板
    await clipboardy.write(number);
    console.log(`✅ 已复制到剪贴板: ${number}`);

    // 显示通知，去除左右的 {}
    const cleanText = text.startsWith("{") && text.endsWith("}")
      ? text.slice(1, -1)
      : text;
    showNotification("✅ 复制成功", cleanText);

    return number;
  } else {
    console.log("⚠️  未找到符合条件的数字字符串");
    showNotification("❌ 复制失败", "请检查短信验证码");
    return null;
  }
}
