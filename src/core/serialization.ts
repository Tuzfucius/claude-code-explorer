import { create } from "xmlbuilder2";

import type { IndexMap, PhaseState, TaskPlan, WaveName } from "./types.js";
import { buildXml } from "./xml.js";

export function serializeIndexMap(indexMap: IndexMap): string {
  return buildXml("index_map", indexMap as unknown as Record<string, unknown>);
}

export function serializePhaseState(state: PhaseState): string {
  return buildXml("phase_state", state as unknown as Record<string, unknown>);
}

export function serializeWavePlans(wave: WaveName, tasks: TaskPlan[]): string {
  return buildXml("wave_plan", {
    wave,
    tasks,
  });
}

export function parsePhaseState(xmlContent: string): PhaseState {
  const parsed = create(xmlContent).end({ format: "object" }) as unknown as { phase_state: Record<string, unknown> };
  return normalizeArrayFields(parsed.phase_state, ["inputRefs", "outputRefs", "errors"]) as unknown as PhaseState;
}

export function parseIndexMap(xmlContent: string): IndexMap {
  const parsed = create(xmlContent).end({ format: "object" }) as unknown as {
    index_map: IndexMap & {
      entries?: { item?: unknown | unknown[] };
      manifests?: { item?: unknown | unknown[] };
    };
  };

  const raw = parsed.index_map;
  return {
    generatedAt: raw.generatedAt,
    rootPath: raw.rootPath,
    entries: normalizeArray(raw.entries),
    manifests: normalizeArray(raw.manifests),
  } as IndexMap;
}

export function parseWavePlan(xmlContent: string): { wave: WaveName; tasks: TaskPlan[] } {
  const parsed = create(xmlContent).end({ format: "object" }) as unknown as {
    wave_plan: {
      wave: WaveName;
      tasks?: { item?: unknown | unknown[] };
    };
  };

  return {
    wave: parsed.wave_plan.wave,
    tasks: normalizeArray(parsed.wave_plan.tasks).map((task) =>
      normalizeArrayFields(task as Record<string, unknown>, ["scope_files", "depends_on", "required_summaries", "acceptance_checks"]),
    ) as unknown as TaskPlan[],
  };
}

function normalizeArray(source: unknown): unknown[] {
  if (!source || typeof source !== "object") {
    return [];
  }

  const item = (source as { item?: unknown | unknown[] }).item;
  if (Array.isArray(item)) {
    return item;
  }

  if (item === undefined) {
    return [];
  }

  return [item];
}

function normalizeArrayFields(source: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = { ...source };
  for (const field of fields) {
    const value = source[field];
    if (Array.isArray(value)) {
      result[field] = value;
      continue;
    }

    if (value && typeof value === "object" && "item" in value) {
      result[field] = normalizeArray(value);
      continue;
    }

    if (value === undefined || value === null || value === "") {
      result[field] = [];
      continue;
    }

    result[field] = [value];
  }

  return result;
}
