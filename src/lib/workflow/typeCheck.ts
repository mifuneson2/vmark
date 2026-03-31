/**
 * Workflow Type Checker
 *
 * Purpose: Validates data flow between workflow steps by checking input/output
 * type compatibility. Uses Genie v1 metadata for typed steps and hardcoded
 * types for built-in actions.
 *
 * @coordinates-with types.ts — WorkflowGraph model
 * @coordinates-with aiGenies.ts — GenieMetadataV1 for typed I/O
 * @module lib/workflow/typeCheck
 */

import type { WorkflowGraph } from "./types";
import type { GenieMetadataV1, GenieOutputType, GenieInputType } from "@/types/aiGenies";

export interface TypeCheckResult {
  valid: boolean;
  errors: TypeCheckError[];
  warnings: TypeCheckWarning[];
}

export interface TypeCheckError {
  stepId: string;
  message: string;
  line?: number;
}

export interface TypeCheckWarning {
  stepId: string;
  message: string;
}

/** Built-in action output types. */
const ACTION_OUTPUT_TYPES: Record<string, GenieOutputType> = {
  "read-file": "text",
  "read-folder": "files",
  "save-file": "text",
  "save-files": "files",
  "copy": "text",
  "notify": "text",
  "prompt": "text",
};

/** Type compatibility matrix: [sourceOutput][targetInput] → compatible? */
function isCompatible(sourceOutput: GenieOutputType, targetInput: string): boolean {
  if (targetInput === "none") return true;
  if (targetInput === "pipe") return true;
  if (sourceOutput === "text" && targetInput === "text") return true;
  if (sourceOutput === "files" && targetInput === "files") return true;
  if (sourceOutput === "json" && targetInput === "text") return true;
  if (sourceOutput === "file" && targetInput === "files") return true;
  return false;
}

/**
 * Type-check a workflow's data flow.
 */
export function typeCheckWorkflow(
  graph: WorkflowGraph,
  genies: Map<string, GenieMetadataV1>,
): TypeCheckResult {
  const errors: TypeCheckError[] = [];
  const warnings: TypeCheckWarning[] = [];

  // Build a map of step ID → output type
  const stepOutputTypes = new Map<string, GenieOutputType>();

  for (const step of graph.steps) {
    if (step.type === "action") {
      const actionName = step.uses.replace("action/", "");
      const outputType = ACTION_OUTPUT_TYPES[actionName];
      if (outputType) {
        stepOutputTypes.set(step.id, outputType);
      } else {
        stepOutputTypes.set(step.id, "text"); // default
      }
    } else if (step.type === "genie") {
      const genieName = step.uses.replace("genie/", "");
      const genie = genies.get(genieName);
      if (genie) {
        stepOutputTypes.set(step.id, genie.output.type);
      } else {
        warnings.push({
          stepId: step.id,
          message: `Genie '${genieName}' not found — type checking skipped for this step`,
        });
        stepOutputTypes.set(step.id, "text"); // assume text
      }
    } else if (step.type === "webhook") {
      stepOutputTypes.set(step.id, "json"); // webhooks return JSON
    }
  }

  // Check input compatibility for steps that reference another step's output
  for (const step of graph.steps) {
    const inputRef = step.with.input;
    if (!inputRef || !inputRef.endsWith(".output")) continue;

    const sourceStepId = inputRef.replace(".output", "");
    const sourceOutputType = stepOutputTypes.get(sourceStepId);
    if (!sourceOutputType) continue;

    // Get the target step's expected input type
    let targetInputType: GenieInputType = "text"; // default

    if (step.type === "genie") {
      const genieName = step.uses.replace("genie/", "");
      const genie = genies.get(genieName);
      if (genie) {
        targetInputType = genie.input.type;
      }
    } else if (step.type === "action") {
      // Actions accept anything
      targetInputType = "pipe";
    }

    if (!isCompatible(sourceOutputType, targetInputType)) {
      errors.push({
        stepId: step.id,
        message: `Type mismatch: '${sourceStepId}' outputs '${sourceOutputType}' but '${step.id}' expects '${targetInputType}'`,
        line: step.sourceRange?.startLine,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
