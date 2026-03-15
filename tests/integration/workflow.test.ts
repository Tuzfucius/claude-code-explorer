import { cp, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { runPhase0 } from "../../src/stages/phase0-map.js";
import { runPhase1 } from "../../src/stages/phase1-plan.js";
import { runPhase2 } from "../../src/stages/phase2-execute.js";
import { runPhase3 } from "../../src/stages/phase3-synthesis.js";
import { runPhase4 } from "../../src/stages/phase4-publish.js";

const fixtureNames = ["ts-service", "python-package", "mixed-monorepo"] as const;

describe("workflow integration", () => {
  const tempDirs: string[] = [];

  beforeAll(() => {
    process.env.CODE_EXPLORER_DISABLE_EXTERNAL_RUNNERS = "1";
  });

  afterAll(async () => {
    await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
    delete process.env.CODE_EXPLORER_DISABLE_EXTERNAL_RUNNERS;
  });

  for (const fixtureName of fixtureNames) {
    it(`跑通 ${fixtureName}`, async () => {
      const sourceDir = path.join(process.cwd(), "tests", "fixtures", fixtureName);
      const tempDir = await mkdtemp(path.join(os.tmpdir(), `code-explorer-${fixtureName}-`));
      tempDirs.push(tempDir);
      await cp(sourceDir, tempDir, { recursive: true });

      const indexMap = await runPhase0(tempDir);
      const wavePlans = await runPhase1(tempDir, indexMap);
      const results = await runPhase2(tempDir, wavePlans);
      await runPhase3(tempDir, indexMap, wavePlans, results);
      const verifyResult = await runPhase4(tempDir, indexMap, wavePlans);

      expect(indexMap.entries.length + indexMap.manifests.length).toBeGreaterThan(0);
      expect(results.length).toBeGreaterThan(0);
      expect(verifyResult.valid).toBe(true);
    });
  }
});
