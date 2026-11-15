import type { Block } from "../types";

/** Text remains selectable; clicks on annotations and embedded controls are ignored. */
export function paragraphToggle(
  row: HTMLElement,
  source: HTMLElement,
  translation: HTMLElement,
  block: Block,
  translate: () => Promise<void>,
  failed: () => void,
) {
  let collapsed = false;
  let pending = false;
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let down: { x: number; y: number } | undefined;
  let revealed = false;
  const doc = row.ownerDocument;
  const refresh = () => {
    const hidden =
      collapsed || (!block.translation && !pending && !block.error);
    translation.classList.toggle("pr-translation-hidden", hidden);
    row.dataset.translationHidden = String(hidden);
    source.dataset.translationHidden = String(hidden);
    for (const cell of [source, translation]) {
      cell.setAttribute("aria-expanded", String(!hidden));
      cell.setAttribute("aria-busy", String(pending));
    }
  };
  const toggle = async () => {
    if (disposed || doc.getSelection()?.isCollapsed === false) return;
    const firstSourceClick =
      !revealed &&
      row.closest("[data-language]")?.getAttribute("data-language") ===
        "source";
    revealed = true;
    row.dataset.translationRevealed = "true";
    if (block.translation || pending) {
      collapsed = firstSourceClick ? false : !collapsed;
      refresh();
      return;
    }
    collapsed = false;
    pending = true;
    translation.textContent = "正在翻译本段…";
    refresh();
    try {
      await translate();
    } catch {
      failed();
    } finally {
      pending = false;
      if (!disposed) refresh();
    }
  };
  const interactive = (target: EventTarget | null) =>
    (target as Element | null)?.closest?.(
      "button,a,mark,input,select,textarea,summary,img,[contenteditable=true]",
    );
  const pointerdown = (event: PointerEvent) => {
    clearTimeout(timer);
    down = {
      x: event.clientX,
      y: event.clientY,
    };
  };
  const click = (event: MouseEvent) => {
    clearTimeout(timer);
    if (
      event.button !== 0 ||
      event.detail > 1 ||
      interactive(event.target) ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      doc.getSelection()?.isCollapsed === false ||
      (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5)
    )
      return;
    // Allow double/triple-click selection to finish before starting a request.
    timer = setTimeout(() => void toggle(), 300);
  };
  const cancelClick = () => clearTimeout(timer);
  const keydown = (event: KeyboardEvent) => {
    if (event.target !== event.currentTarget || event.key !== "Enter") return;
    event.preventDefault();
    clearTimeout(timer);
    void toggle();
  };
  for (const cell of [source, translation]) {
    cell.dataset.paragraphToggle = "true";
    cell.tabIndex = 0;
    cell.title = "点击翻译整段；再次点击隐藏或显示中文。选中文字可批注。";
    cell.addEventListener("pointerdown", pointerdown);
    cell.addEventListener("click", click);
    cell.addEventListener("dblclick", cancelClick);
    cell.addEventListener("keydown", keydown);
  }
  refresh();
  return {
    refresh,
    dispose() {
      disposed = true;
      clearTimeout(timer);
      for (const cell of [source, translation]) {
        cell.removeEventListener("pointerdown", pointerdown);
        cell.removeEventListener("click", click);
        cell.removeEventListener("dblclick", cancelClick);
        cell.removeEventListener("keydown", keydown);
      }
    },
  };
}
