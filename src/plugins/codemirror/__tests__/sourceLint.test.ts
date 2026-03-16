/**
 * Tests for sourceLint.ts — CodeMirror lint extension helpers.
 */

import { describe, it, expect, vi } from "vitest";

// Mock lintStore before import
vi.mock("@/stores/lintStore", () => ({
  useLintStore: {
    getState: vi.fn(() => ({
      diagnosticsByTab: {},
      clearDiagnostics: vi.fn(),
    })),
    subscribe: vi.fn(() => () => {}),
  },
}));

import { diagnosticToCM } from "../sourceLint";
import type { LintDiagnostic } from "@/lib/lintEngine/types";

function makeDiag(overrides: Partial<LintDiagnostic> = {}): LintDiagnostic {
  return {
    id: "E01-1-1",
    ruleId: "E01",
    severity: "error",
    messageKey: "lint.E01",
    messageParams: {},
    line: 1,
    column: 1,
    offset: 0,
    uiHint: "exact",
    ...overrides,
  };
}

describe("diagnosticToCM", () => {
  it("maps offset 0 with no endOffset to from=0, to=0", () => {
    const d = makeDiag({ offset: 0 });
    const result = diagnosticToCM(100, d);
    expect(result.from).toBe(0);
    expect(result.to).toBe(0);
  });

  it("maps offset and endOffset correctly", () => {
    const d = makeDiag({ offset: 5, endOffset: 10 });
    const result = diagnosticToCM(100, d);
    expect(result.from).toBe(5);
    expect(result.to).toBe(10);
  });

  it("clamps offset to docLength", () => {
    const d = makeDiag({ offset: 200, endOffset: 210 });
    const result = diagnosticToCM(100, d);
    expect(result.from).toBe(100);
    expect(result.to).toBe(100);
  });

  it("ensures to >= from when endOffset < offset", () => {
    const d = makeDiag({ offset: 10, endOffset: 5 });
    const result = diagnosticToCM(100, d);
    // to should be max(5, 10) = 10
    expect(result.to).toBeGreaterThanOrEqual(result.from);
  });

  it("maps severity error correctly", () => {
    const d = makeDiag({ severity: "error" });
    const result = diagnosticToCM(100, d);
    expect(result.severity).toBe("error");
  });

  it("maps severity warning correctly", () => {
    const d = makeDiag({ severity: "warning" });
    const result = diagnosticToCM(100, d);
    expect(result.severity).toBe("warning");
  });

  it("sets message to messageKey", () => {
    const d = makeDiag({ messageKey: "lint.W03" });
    const result = diagnosticToCM(100, d);
    expect(result.message).toBe("lint.W03");
  });

  it("handles docLength = 0 gracefully", () => {
    const d = makeDiag({ offset: 0 });
    const result = diagnosticToCM(0, d);
    expect(result.from).toBe(0);
    expect(result.to).toBe(0);
  });

  it("handles point diagnostic (no endOffset)", () => {
    const d = makeDiag({ offset: 42, endOffset: undefined });
    const result = diagnosticToCM(100, d);
    expect(result.from).toBe(42);
    expect(result.to).toBe(42);
  });
});
