/**
 * IME-Safe Toast
 *
 * Purpose: Wraps sonner's toast API to defer notifications when the editor is
 * in an IME composition session. Without this, DOM insertion by sonner can
 * interrupt CJK input and cause the composition to commit prematurely.
 *
 * Key decisions:
 *   - Checks both WYSIWYG (Tiptap view.composing) and Source (CodeMirror
 *     view.composing) editors via activeEditorStore
 *   - When composing, queues the toast and flushes on the next
 *     `compositionend` event (event-driven, not fixed delay)
 *   - Falls through to immediate toast when no editor is composing
 *   - Only wraps info/success — error/warning are never deferred (urgent)
 *
 * @coordinates-with utils/imeGuard.ts — shares the composition detection approach
 * @coordinates-with stores/activeEditorStore.ts — reads active editor instances
 * @module utils/imeToast
 */

import { toast } from "sonner";
import { useActiveEditorStore } from "@/stores/activeEditorStore";

/** Small delay after compositionend before flushing (ms).
 * Matches IME_GRACE_PERIOD_MS — lets the browser finish processing. */
const POST_COMPOSITION_DELAY_MS = 60;

function isEditorComposing(): boolean {
  const { activeWysiwygEditor, activeSourceView } = useActiveEditorStore.getState();

  if (activeWysiwygEditor?.view?.composing) return true;
  if (activeSourceView?.composing) return true;

  return false;
}

type ToastArgs = Parameters<typeof toast.info>;

/** Pending toasts queued during composition */
const pendingToasts: Array<{ fn: (...args: ToastArgs) => void; args: ToastArgs }> = [];
let compositionEndListenerAttached = false;

function flushPendingToasts(): void {
  compositionEndListenerAttached = false;
  const toasts = pendingToasts.splice(0);
  for (const { fn, args } of toasts) {
    fn(...args);
  }
}

function onCompositionEnd(): void {
  document.removeEventListener("compositionend", onCompositionEnd);
  // Small delay to let the browser finish IME processing before inserting toast DOM
  setTimeout(flushPendingToasts, POST_COMPOSITION_DELAY_MS);
}

function deferIfComposing(fn: (...args: ToastArgs) => void, args: ToastArgs): void {
  if (!isEditorComposing()) {
    fn(...args);
    return;
  }

  pendingToasts.push({ fn, args });

  if (!compositionEndListenerAttached) {
    compositionEndListenerAttached = true;
    document.addEventListener("compositionend", onCompositionEnd, { once: true });
  }
}

/**
 * IME-safe toast — defers info/success when the editor is composing.
 * Error and warning are passed through immediately (urgent notifications).
 */
export const imeToast = {
  info: (...args: ToastArgs) => deferIfComposing(toast.info, args),
  success: (...args: ToastArgs) => deferIfComposing(toast.success, args),
  error: toast.error,
  warning: toast.warning,
};
