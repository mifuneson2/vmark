import { typeCheckWorkflow } from "../typeCheck";
import type { WorkflowGraph } from "../types";
import type { GenieMetadataV1 } from "@/types/aiGenies";

function makeGraph(steps: Array<{ id: string; uses: string; withInput?: string }>): WorkflowGraph {
  const graphSteps = steps.map((s) => ({
    id: s.id,
    uses: s.uses,
    type: s.uses.startsWith("genie/") ? "genie" as const : "action" as const,
    label: s.id,
    icon: "📂",
    with: s.withInput ? { input: s.withInput } : {},
    needs: [] as string[],
  }));
  return {
    name: "Test",
    triggers: [],
    env: {},
    defaults: {},
    steps: graphSteps,
    edges: [],
  };
}

function makeGenie(name: string, inputType: string, outputType: string): GenieMetadataV1 {
  return {
    version: "v1",
    name,
    description: "",
    scope: "selection",
    input: { type: inputType as GenieMetadataV1["input"]["type"] },
    output: { type: outputType as GenieMetadataV1["output"]["type"] },
  };
}

describe("typeCheckWorkflow", () => {
  it("returns valid for compatible text→text flow", () => {
    const graph = makeGraph([
      { id: "a", uses: "genie/summarize" },
      { id: "b", uses: "genie/translate", withInput: "a.output" },
    ]);
    const genies = new Map([
      ["summarize", makeGenie("Summarize", "text", "text")],
      ["translate", makeGenie("Translate", "text", "text")],
    ]);
    const result = typeCheckWorkflow(graph, genies);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns valid for text→pipe flow", () => {
    const graph = makeGraph([
      { id: "a", uses: "genie/summarize" },
      { id: "b", uses: "genie/process", withInput: "a.output" },
    ]);
    const genies = new Map([
      ["summarize", makeGenie("Summarize", "text", "text")],
      ["process", makeGenie("Process", "pipe", "text")],
    ]);
    const result = typeCheckWorkflow(graph, genies);
    expect(result.valid).toBe(true);
  });

  it("returns valid for files→files flow", () => {
    const graph = makeGraph([
      { id: "a", uses: "action/read-folder" },
      { id: "b", uses: "genie/summarize", withInput: "a.output" },
    ]);
    const genies = new Map([
      ["summarize", makeGenie("Summarize", "files", "text")],
    ]);
    const result = typeCheckWorkflow(graph, genies);
    expect(result.valid).toBe(true);
  });

  it("returns valid for any→none (input ignored)", () => {
    const graph = makeGraph([
      { id: "a", uses: "genie/summarize" },
      { id: "b", uses: "genie/generate", withInput: "a.output" },
    ]);
    const genies = new Map([
      ["summarize", makeGenie("Summarize", "text", "text")],
      ["generate", makeGenie("Generate", "none", "text")],
    ]);
    const result = typeCheckWorkflow(graph, genies);
    expect(result.valid).toBe(true);
  });

  it("returns error for file→text mismatch", () => {
    const graph = makeGraph([
      { id: "a", uses: "genie/writer" },
      { id: "b", uses: "genie/reader", withInput: "a.output" },
    ]);
    const genies = new Map([
      ["writer", makeGenie("Writer", "text", "file")],
      ["reader", makeGenie("Reader", "text", "text")],
    ]);
    const result = typeCheckWorkflow(graph, genies);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].stepId).toBe("b");
  });

  it("returns warning for missing Genie definitions", () => {
    const graph = makeGraph([
      { id: "a", uses: "genie/unknown" },
    ]);
    const genies = new Map<string, GenieMetadataV1>();
    const result = typeCheckWorkflow(graph, genies);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(1);
  });

  it("handles built-in action output types", () => {
    const graph = makeGraph([
      { id: "read", uses: "action/read-folder" },
      { id: "sum", uses: "genie/summarize", withInput: "read.output" },
    ]);
    const genies = new Map([
      ["summarize", makeGenie("Summarize", "files", "text")],
    ]);
    const result = typeCheckWorkflow(graph, genies);
    expect(result.valid).toBe(true);
  });

  it("validates json→text as compatible (auto-stringify)", () => {
    const graph = makeGraph([
      { id: "a", uses: "genie/extract" },
      { id: "b", uses: "genie/format", withInput: "a.output" },
    ]);
    const genies = new Map([
      ["extract", makeGenie("Extract", "text", "json")],
      ["format", makeGenie("Format", "text", "text")],
    ]);
    const result = typeCheckWorkflow(graph, genies);
    expect(result.valid).toBe(true);
  });
});
