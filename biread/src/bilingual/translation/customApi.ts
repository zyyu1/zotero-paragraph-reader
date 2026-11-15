import { normalizeLLMEndpoint } from "../../utils/llmEndpoint";

export interface CustomApiConfig {
  endpoint: string;
  key: string;
  model: string;
}

/** Accept base URLs or complete Chat Completions endpoints. */
export function validateCustomApi(input: CustomApiConfig): CustomApiConfig {
  let url: URL;
  try {
    url = new URL(input.endpoint.trim());
  } catch {
    throw new Error("请输入完整的 API 地址（含 http:// 或 https://）。");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.hash
  )
    throw new Error("API 地址必须为 HTTP(S)，不能包含用户名、密码或片段。");
  if (/\/(responses|messages)\/?$/.test(url.pathname))
    throw new Error(
      "此设置使用 Chat Completions 格式，请填写对应的兼容接口地址。",
    );
  if (!input.model.trim()) throw new Error("请填写模型名称。");
  // Normalize the pathname independently so base URLs with query parameters work.
  const query = url.search;
  url.search = "";
  const endpoint = new URL(normalizeLLMEndpoint(url.href));
  endpoint.search = query;
  return {
    endpoint: endpoint.href,
    model: input.model.trim(),
    key: input.key.trim(),
  };
}

export function apiErrorMessage(error: unknown): string {
  // Never surface request objects, response bodies, URLs or credentials.
  const status =
    (error as { status?: number; xmlhttp?: { status?: number } })?.status ||
    (error as { xmlhttp?: { status?: number } })?.xmlhttp?.status;
  if (status === 401 || status === 403)
    return "认证失败，请检查密钥和模型权限。";
  if (status === 404) return "接口或模型不存在，请检查地址和模型名称。";
  if (status === 429) return "服务限流或额度不足，请稍后重试。";
  return "连接失败或响应格式不兼容，请检查网络、地址及服务状态。";
}

export async function testCustomApi(input: CustomApiConfig): Promise<void> {
  const config = validateCustomApi(input);
  try {
    const response = await Zotero.HTTP.request("POST", config.endpoint, {
      headers: {
        "Content-Type": "application/json",
        ...(config.key ? { Authorization: `Bearer ${config.key}` } : {}),
      },
      body: JSON.stringify({
        model: config.model,
        stream: false,
        messages: [
          {
            role: "user",
            content:
              'Translate "Hello" into Simplified Chinese. Return only the translation.',
          },
        ],
      }),
      responseType: "json",
      timeout: 20000,
    });
    const content = response.response?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim())
      throw new Error("Invalid response");
  } catch (error) {
    throw new Error(apiErrorMessage(error));
  }
}
