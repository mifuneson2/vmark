/**
 * Editor
 *
 * Purpose: Top-level editor container that switches between WYSIWYG (TiptapEditor) and Source
 * (CodeMirror) editing modes.
 *
 * User interactions: Mode switching is driven by editorStore.sourceMode; the user toggles
 * via the status bar button or keyboard shortcut.
 *
 * Key decisions:
 *   - `keepAlive` setting keeps both editors mounted (hidden) to preserve undo history
 *     across mode switches — at the cost of double memory usage.
 *   - `editorKey` includes both tabId and documentId to force remount on tab switch AND
 *     content reload within the same tab.
 *
 * @coordinates-with SourceEditor.tsx, TiptapEditor.tsx — mounts one or both based on mode
 * @coordinates-with stores/editorStore.ts — reads sourceMode for mode switching
 * @module components/Editor/Editor
 */
import { useEditorStore } from "@/stores/editorStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useActiveTabId, useDocumentId } from "@/hooks/useDocumentState";
import { useUnifiedMenuCommands } from "@/hooks/useUnifiedMenuCommands";
import { SourceEditor } from "./SourceEditor";
import { TiptapEditorInner } from "./TiptapEditor";
import { HeadingPicker } from "./HeadingPicker";
import { DropZoneIndicator } from "./DropZoneIndicator";
import "./editor.css";
import "./heading-picker.css";
import "@/styles/popup-shared.css";
// Note: katex.min.css is imported in main.tsx for consistent dev/prod cascade order

export function Editor() {
  const sourceMode = useEditorStore((state) => state.sourceMode);
  const tabId = useActiveTabId();
  const documentId = useDocumentId();
  const mediaBorderStyle = useSettingsStore((s) => s.markdown.mediaBorderStyle);
  const mediaAlignment = useSettingsStore((s) => s.markdown.mediaAlignment);
  const headingAlignment = useSettingsStore((s) => s.markdown.headingAlignment);
  const htmlRenderingMode = useSettingsStore((s) => s.markdown.htmlRenderingMode);
  const tableFitToWidth = useSettingsStore((s) => s.markdown.tableFitToWidth);
  const keepAlive = useSettingsStore((s) => s.advanced.keepBothEditorsAlive);

  // Mount unified menu dispatcher (handles routing based on mode)
  useUnifiedMenuCommands();

  // Include tabId in key to ensure editor remounts when switching tabs
  // documentId handles content reloads within the same tab
  const editorKey = `${tabId}-doc-${documentId}`;
  /* v8 ignore next -- @preserve tableFitToWidth conditional class appended at runtime */
  const containerClass = `editor-container media-border-${mediaBorderStyle} media-align-${mediaAlignment} heading-align-${headingAlignment}${tableFitToWidth ? " table-fit-to-width" : ""}`;
  /* v8 ignore next -- @preserve sourceMode ternary branches require mode toggle */
  const activeEditor = sourceMode ? "source" : "wysiwyg";
  /* v8 ignore next 8 -- @preserve keepAlive and sourceMode ternary branches require advanced settings */
  const editorContent = keepAlive ? (
    <>
      <SourceEditor key={editorKey} hidden={!sourceMode} />
      <TiptapEditorInner key={editorKey} hidden={sourceMode} />
    </>
  ) : (
    sourceMode
      ? <SourceEditor key={editorKey} />
      : <TiptapEditorInner key={editorKey} />
  );

  return (
    <div
      className={containerClass}
      data-html-rendering-mode={htmlRenderingMode}
    >
      <div className="editor-content" data-active-editor={activeEditor}>
        {editorContent}
      </div>
      <HeadingPicker />
      <DropZoneIndicator />
    </div>
  );
}

export default Editor;
