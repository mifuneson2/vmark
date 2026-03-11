/**
 * Code Detection Utilities
 *
 * Re-exports from the codeDetection module for backward compatibility.
 * The implementation is now split into smaller files under ./codeDetection/
 */

/* v8 ignore start -- @preserve reason: barrel re-export file with no executable logic */
export {
  shouldPasteAsCodeBlock,
  calculateCodeScore,
  detectLanguage,
  LANGUAGE_PATTERNS,
  GENERIC_CODE_PATTERNS,
  NON_CODE_PATTERNS,
  type CodeDetectionResult,
} from "./codeDetection/index";
/* v8 ignore stop */
