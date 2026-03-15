import { describe, expect, it } from "vitest";

import { resolveDocumentLanguage } from "../../src/core/document-language.js";

describe("document-language", () => {
  it("auto 模式根据本地 locale 决定文档语言", () => {
    expect(resolveDocumentLanguage("auto", "zh-HK")).toBe("zh-CN");
    expect(resolveDocumentLanguage("auto", "en-US")).toBe("en-US");
  });

  it("显式语言覆盖 locale", () => {
    expect(resolveDocumentLanguage("zh-CN", "en-US")).toBe("zh-CN");
    expect(resolveDocumentLanguage("en-US", "zh-CN")).toBe("en-US");
  });
});
