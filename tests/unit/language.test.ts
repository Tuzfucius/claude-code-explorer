import { describe, expect, it } from "vitest";

import { detectLanguage, isAstCandidate, isManifestFile } from "../../src/core/language.js";

describe("language", () => {
  it("识别 manifest 文件", () => {
    expect(detectLanguage("package.json")).toBe("manifest");
    expect(isManifestFile("pyproject.toml")).toBe(true);
  });

  it("识别常见源码语言", () => {
    expect(detectLanguage("src/main.ts")).toBe("typescript");
    expect(detectLanguage("app/service.py")).toBe("python");
    expect(isAstCandidate("typescript")).toBe(true);
    expect(isAstCandidate("yaml")).toBe(false);
  });
});

