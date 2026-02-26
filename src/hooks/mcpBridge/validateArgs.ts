/**
 * MCP Bridge Argument Validation
 *
 * Purpose: Runtime validation helpers for MCP bridge handler arguments.
 *   Provides clear error messages at the boundary instead of opaque
 *   TypeErrors deep in business logic.
 *
 * @module hooks/mcpBridge/validateArgs
 */

/**
 * Require a string argument. Throws with a clear message if missing or wrong type.
 */
export function requireString(args: Record<string, unknown>, key: string): string {
  const val = args[key];
  if (typeof val !== "string") {
    throw new Error(`Missing or invalid '${key}' (expected string, got ${typeof val})`);
  }
  return val;
}

/**
 * Get an optional string argument. Returns undefined if not present.
 * Throws if present but wrong type.
 */
export function optionalString(args: Record<string, unknown>, key: string): string | undefined {
  const val = args[key];
  if (val === undefined || val === null) return undefined;
  if (typeof val !== "string") {
    throw new Error(`Invalid '${key}' (expected string, got ${typeof val})`);
  }
  return val;
}

/**
 * Get an optional number argument. Returns undefined if not present.
 * Throws if present but wrong type.
 */
export function optionalNumber(args: Record<string, unknown>, key: string): number | undefined {
  const val = args[key];
  if (val === undefined || val === null) return undefined;
  if (typeof val !== "number") {
    throw new Error(`Invalid '${key}' (expected number, got ${typeof val})`);
  }
  return val;
}

/**
 * Require a string argument with a default fallback.
 */
export function stringWithDefault(args: Record<string, unknown>, key: string, defaultVal: string): string {
  const val = args[key];
  if (val === undefined || val === null) return defaultVal;
  if (typeof val !== "string") {
    throw new Error(`Invalid '${key}' (expected string, got ${typeof val})`);
  }
  return val;
}
