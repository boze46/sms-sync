import clipboardy from "clipboardy";
import notifier from "node-notifier";

/**
 * 验证码处理配置选项
 */
export interface CodeProcessOptions {
  regex: string; // 正则表达式字符串
  enableNotification: boolean; // 是否显示通知
  enableClipboard: boolean; // 是否复制到剪贴板
}

/**
 * 使用自定义正则表达式提取验证码
 * @param text 原始文本
 * @param regexPattern 正则表达式字符串（如 "\\d{4,}"）
 * @returns 提取的验证码，未找到则返回 null
 */
export function extractCode(text: string, regexPattern: string): string | null {
  try {
    const pattern = new RegExp(regexPattern);
    const match = text.match(pattern);
    return match ? match[0] : null;
  } catch (error) {
    console.error(`❌ 正则表达式错误: ${error}`);
    return null;
  }
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
 * 复制文本到剪贴板
 * @param text 要复制的文本
 */
export async function copyToClipboard(text: string): Promise<void> {
  await clipboardy.write(text);
}

/**
 * 清理短信文本（去除前后的 {}）
 * @param text 原始文本
 * @returns 清理后的文本
 */
export function cleanSmsText(text: string): string {
  return text.startsWith("{") && text.endsWith("}")
    ? text.slice(1, -1)
    : text;
}

/**
 * 处理验证码：提取、复制、通知
 * @param text 接收到的短信文本
 * @param options 处理选项
 * @returns 提取的验证码，未找到则返回 null
 */
export async function processVerificationCode(
  text: string,
  options: CodeProcessOptions
): Promise<string | null> {
  const { regex, enableNotification, enableClipboard } = options;

  // 1. 提取验证码
  const code = extractCode(text, regex);

  if (code) {
    console.log(`🎯 提取到验证码: ${code}`);

    // 2. 复制到剪贴板（如果启用）
    if (enableClipboard) {
      await copyToClipboard(code);
      console.log(`✅ 已复制到剪贴板: ${code}`);
    } else {
      console.log(`ℹ️  剪贴板功能已禁用`);
    }

    // 3. 显示通知（如果启用）
    if (enableNotification) {
      const cleanText = cleanSmsText(text);
      showNotification("✅ 验证码已提取", cleanText);
      console.log(`🔔 已发送通知`);
    } else {
      console.log(`ℹ️  通知功能已禁用`);
    }

    return code;
  } else {
    console.log(`⚠️  未找到符合正则 "${regex}" 的验证码`);

    // 如果启用通知，显示失败通知
    if (enableNotification) {
      showNotification("❌ 未找到验证码", `正则表达式: ${regex}`);
    }

    return null;
  }
}

// ========== 向后兼容的函数（已弃用） ==========

/**
 * @deprecated 使用 extractCode(text, regex) 替代
 * 提取文本中第一个长度 >= 4 的数字串
 */
export function extractFirstLongNumber(text: string): string | null {
  return extractCode(text, "\\d{4,}");
}

/**
 * @deprecated 使用 processVerificationCode(text, options) 替代
 * 复制验证码到剪贴板并显示通知
 */
export async function copyVerificationCode(text: string): Promise<string | null> {
  return processVerificationCode(text, {
    regex: "\\d{4,}",
    enableNotification: true,
    enableClipboard: true,
  });
}
