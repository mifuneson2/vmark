/**
 * StatusBarCounts
 *
 * Purpose: Isolated component that subscribes to document content and computes
 * word/character counts, preventing the parent StatusBar from re-rendering
 * on every keystroke.
 *
 * Key decisions:
 *   - Owns the useDocumentContent() subscription so StatusBar doesn't re-render
 *   - Uses memo + useMemo pipeline: content → stripMarkdown → count
 *   - Renders two <span> elements inline within StatusBarRight
 *
 * @coordinates-with StatusBar.tsx — no longer subscribes to document content
 * @coordinates-with StatusBarRight.tsx — renders this component for counts
 * @module components/StatusBar/StatusBarCounts
 */

import { memo, useMemo } from "react";
import { useDocumentContent } from "@/hooks/useDocumentState";
import { countCharsFromPlain, countWordsFromPlain, stripMarkdown } from "./statusTextMetrics";

export const StatusBarCounts = memo(function StatusBarCounts() {
  const content = useDocumentContent();
  const strippedContent = useMemo(() => stripMarkdown(content), [content]);
  const wordCount = useMemo(() => countWordsFromPlain(strippedContent), [strippedContent]);
  const charCount = useMemo(() => countCharsFromPlain(strippedContent), [strippedContent]);

  return (
    <>
      <span className="status-item">{wordCount} words</span>
      <span className="status-item">{charCount} chars</span>
    </>
  );
});
