import type { DocumentLanguage } from "./types.js";

export function resolveDocumentLanguage(
  language: DocumentLanguage,
  locale = Intl.DateTimeFormat().resolvedOptions().locale,
): "zh-CN" | "en-US" {
  if (!language || language === "auto") {
    return normalizeLocale(locale);
  }

  return normalizeLocale(language);
}

export function isChineseDocument(language: DocumentLanguage): boolean {
  return resolveDocumentLanguage(language) === "zh-CN";
}

function normalizeLocale(locale: string): "zh-CN" | "en-US" {
  return locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
}
