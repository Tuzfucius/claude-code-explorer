import { describe, expect, it } from "vitest";

import { parsePhaseState, serializePhaseState, serializeWavePlans } from "../../src/core/serialization.js";

describe("serialization", () => {
  it("序列化并反序列化阶段状态", () => {
    const xml = serializePhaseState({
      phase: "phase_0_map",
      status: "completed",
      inputRefs: ["repo"],
      outputRefs: ["index.xml"],
      errors: [],
      runner: "none",
    });

    const parsed = parsePhaseState(xml);
    expect(parsed.phase).toBe("phase_0_map");
    expect(parsed.outputRefs).toEqual(["index.xml"]);
  });

  it("输出波次任务 XML", () => {
    const xml = serializeWavePlans("WAVE_1", [
      {
        task_id: "wave_1_01",
        wave: "WAVE_1",
        title: "task",
        goal: "goal",
        scope_files: ["a.ts"],
        depends_on: [],
        required_summaries: [],
        agent_role: "data-agent",
        output_path: ".code-explorer/planning/analysis/wave_1_01_SUMMARY.md",
        acceptance_checks: ["ok"],
      },
    ]);

    expect(xml).toContain("wave_1_01");
    expect(xml).toContain("analysis");
  });
});

