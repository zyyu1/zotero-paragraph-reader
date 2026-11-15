import { getPref, setPref } from "../../utils/prefs";
import { getServiceSecret, setServiceSecret } from "../../utils/secret";
import { testCustomApi, validateCustomApi } from "../translation/customApi";
import type { BilingualView } from "./bilingualView";

export function showApiSettings(
  ui: BilingualView,
  canSave: () => boolean,
  onSaved: () => void,
) {
  ui.controls.querySelector(".pr-api-settings")?.remove();
  const doc = ui.doc;
  const panel = doc.createElement("form");
  panel.className = "pr-api-settings";
  panel.setAttribute("aria-label", "自定义翻译 API");
  panel.style.cssText =
    "display:flex;flex-wrap:wrap;gap:10px;padding:12px;border:1px solid #ddd;border-radius:8px;max-height:40vh;overflow:auto";
  const field = (label: string, value: string, type = "text") => {
    const wrap = doc.createElement("label");
    wrap.style.cssText =
      "display:flex;flex-direction:column;gap:4px;flex:1;min-width:180px";
    wrap.textContent = label;
    const input = doc.createElement("input");
    input.type = type;
    input.value = value;
    input.autocomplete = "off";
    input.setAttribute("aria-label", label);
    input.style.cssText =
      "width:100%;padding:8px;border:1px solid #aaa;border-radius:5px;background:transparent;color:inherit";
    wrap.append(input);
    panel.append(wrap);
    return input;
  };
  const endpoint = field(
    "API 地址",
    String(getPref("customGPT1.endPoint") || ""),
  );
  endpoint.placeholder = "https://your-provider.example/v1";
  const key = field("API 密钥", getServiceSecret("customgpt1"), "password");
  key.placeholder = "本地免密服务可留空";
  const model = field("模型名称", String(getPref("customGPT1.model") || ""));
  model.placeholder = "服务商提供的模型 ID";
  const help = doc.createElement("p");
  help.textContent =
    "支持 Chat Completions 兼容接口。测试仅发送 Hello，不发送论文；保存后可翻译单段或全文。密钥保存在此插件的本机 Zotero 设置中。";
  help.style.cssText = "flex-basis:100%;margin:0";
  const status = doc.createElement("span");
  status.setAttribute("role", "status");
  const draft = () => ({
    endpoint: endpoint.value,
    key: key.value,
    model: model.value,
  });
  const save = doc.createElement("button");
  save.type = "submit";
  save.textContent = "保存并使用";
  const test = doc.createElement("button");
  test.type = "button";
  test.textContent = "测试连接";
  const close = doc.createElement("button");
  close.type = "button";
  close.textContent = "关闭";
  close.onclick = () => {
    key.value = "";
    panel.remove();
  };
  let testing = false;
  test.onclick = async () => {
    if (testing) return;
    testing = true;
    test.disabled = save.disabled = true;
    status.textContent = "正在测试（最长 20 秒）…";
    try {
      await testCustomApi(draft());
      status.textContent = "连接成功，模型返回了文本。点击保存后生效。";
    } catch (error) {
      status.textContent =
        error instanceof Error ? error.message : "测试失败。";
    } finally {
      testing = false;
      test.disabled = save.disabled = false;
    }
  };
  panel.onsubmit = (event) => {
    event.preventDefault();
    if (testing) return;
    if (!canSave()) {
      status.textContent = "请先暂停翻译，等待当前请求结束后再保存。";
      return;
    }
    try {
      const config = validateCustomApi(draft());
      setPref("customGPT1.endPoint", config.endpoint);
      setPref("customGPT1.model", config.model);
      setPref("customGPT1.apiFormat", "openai");
      setPref("customGPT1.stream", false);
      setPref("customGPT1.temperature", "1.0");
      setServiceSecret("customgpt1", config.key);
      setPref("translateSource", "customgpt1");
      onSaved();
      status.textContent =
        "已保存。直接点击段落翻译，或选择“翻译全文 / 继续”。";
    } catch (error) {
      status.textContent =
        error instanceof Error ? error.message : "保存失败。";
    }
  };
  panel.append(help, save, test, close, status);
  ui.controls.append(panel);
  endpoint.focus();
}
