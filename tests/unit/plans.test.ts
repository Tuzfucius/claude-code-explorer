import { describe, expect, it } from "vitest";

import { buildTaskPlans } from "../../src/core/plans.js";
import type { FileIndexEntry } from "../../src/core/types.js";

describe("plans", () => {
  it("任务输出路径跟随 outputDir", () => {
    const entry: FileIndexEntry = {
      path: "src/core/types.ts",
      language: "typescript",
      size: 100,
      imports: [],
      exports: [],
      symbols: [{ kind: "type", name: "Demo", confidence: "high", source: "ast" }],
      summary: "export type Demo = string;",
      source: "ast",
      confidence: "high",
    };

    const plans = buildTaskPlans([entry], 10, ".workspace-output");
    expect(plans.WAVE_1[0].output_path.startsWith(".workspace-output")).toBe(true);
  });
});

