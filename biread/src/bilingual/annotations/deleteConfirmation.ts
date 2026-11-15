import { getPref, setPref } from "../../utils/prefs";

export const skipDeleteConfirmationPref =
  "bilingual.annotation.skipDeleteConfirmation";

export function confirmAnnotationDeletion(local: boolean): boolean {
  if (getPref(skipDeleteConfirmationPref) === true) return true;
  const checkbox = { value: false };
  const confirmed = Services.prompt.confirmCheck(
    // Zotero's MainWindow type omits Gecko's window proxy interface.
    Zotero.getMainWindow() as unknown as mozIDOMWindowProxy,
    "删除标注",
    local
      ? "确定删除这条译文标注吗？"
      : "确定删除这条 Zotero 标注及其关联的双语高亮吗？",
    "以后删除标注不再询问",
    checkbox,
  );
  // Cancelling must never change the user's confirmation preference.
  if (confirmed && checkbox.value) setPref(skipDeleteConfirmationPref, true);
  return confirmed;
}
