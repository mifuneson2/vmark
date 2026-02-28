import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  toastInfo: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    info: mocks.toastInfo,
    success: mocks.toastSuccess,
    error: mocks.toastError,
    warning: mocks.toastWarning,
  },
}));

vi.mock("@/stores/activeEditorStore", () => ({
  useActiveEditorStore: {
    getState: vi.fn(() => ({
      activeWysiwygEditor: null,
      activeSourceView: null,
    })),
  },
}));

import { imeToast } from "./imeToast";
import { useActiveEditorStore } from "@/stores/activeEditorStore";

function fireCompositionEnd() {
  document.dispatchEvent(new Event("compositionend"));
}

/** Set WYSIWYG editor composing state */
function setComposing(composing: boolean) {
  vi.mocked(useActiveEditorStore.getState).mockReturnValue({
    activeWysiwygEditor: composing ? { view: { composing: true } } : null,
    activeSourceView: null,
  } as never);
}

describe("imeToast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Default: not composing
    setComposing(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows info toast immediately when not composing", () => {
    imeToast.info("hello");
    expect(mocks.toastInfo).toHaveBeenCalledWith("hello");
  });

  it("shows success toast immediately when not composing", () => {
    imeToast.success("done");
    expect(mocks.toastSuccess).toHaveBeenCalledWith("done");
  });

  it("defers info toast until compositionend when WYSIWYG editor is composing", () => {
    setComposing(true);

    imeToast.info("deferred");
    expect(mocks.toastInfo).not.toHaveBeenCalled();

    // Composition ends — editor stops composing, compositionend fires
    setComposing(false);
    fireCompositionEnd();
    vi.advanceTimersByTime(60);
    expect(mocks.toastInfo).toHaveBeenCalledWith("deferred");
  });

  it("defers success toast until compositionend when Source editor is composing", () => {
    vi.mocked(useActiveEditorStore.getState).mockReturnValue({
      activeWysiwygEditor: null,
      activeSourceView: { composing: true },
    } as never);

    imeToast.success("deferred");
    expect(mocks.toastSuccess).not.toHaveBeenCalled();

    vi.mocked(useActiveEditorStore.getState).mockReturnValue({
      activeWysiwygEditor: null,
      activeSourceView: { composing: false },
    } as never);
    fireCompositionEnd();
    vi.advanceTimersByTime(60);
    expect(mocks.toastSuccess).toHaveBeenCalledWith("deferred");
  });

  it("flushes multiple queued toasts on compositionend", () => {
    setComposing(true);

    imeToast.info("first");
    imeToast.success("second");
    expect(mocks.toastInfo).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();

    setComposing(false);
    fireCompositionEnd();
    vi.advanceTimersByTime(60);
    expect(mocks.toastInfo).toHaveBeenCalledWith("first");
    expect(mocks.toastSuccess).toHaveBeenCalledWith("second");
  });

  it("does not flush before post-composition delay elapses", () => {
    setComposing(true);

    imeToast.info("deferred");
    setComposing(false);
    fireCompositionEnd();
    // Only 30ms — should not flush yet
    vi.advanceTimersByTime(30);
    expect(mocks.toastInfo).not.toHaveBeenCalled();

    // Remaining 30ms — now it should flush
    vi.advanceTimersByTime(30);
    expect(mocks.toastInfo).toHaveBeenCalledWith("deferred");
  });

  it("never defers error toast (urgent)", () => {
    setComposing(true);

    imeToast.error("fail");
    expect(mocks.toastError).toHaveBeenCalledWith("fail");
  });

  it("never defers warning toast (urgent)", () => {
    setComposing(true);

    imeToast.warning("warn");
    expect(mocks.toastWarning).toHaveBeenCalledWith("warn");
  });

  it("re-defers if composition restarts before flush", () => {
    setComposing(true);

    imeToast.info("deferred");
    expect(mocks.toastInfo).not.toHaveBeenCalled();

    // compositionend fires but editor immediately starts composing again
    fireCompositionEnd();
    // Still composing when flush runs after 60ms (re-check sees composing=true)
    vi.advanceTimersByTime(60);
    // Should NOT have flushed — still composing
    expect(mocks.toastInfo).not.toHaveBeenCalled();

    // Now composition truly ends
    setComposing(false);
    fireCompositionEnd();
    vi.advanceTimersByTime(60);
    expect(mocks.toastInfo).toHaveBeenCalledWith("deferred");
  });

  it("force-flushes after fallback timeout if compositionend never fires", () => {
    setComposing(true);

    imeToast.info("stuck");
    expect(mocks.toastInfo).not.toHaveBeenCalled();

    // Advance past fallback timeout (5000ms) — flushes regardless
    vi.advanceTimersByTime(5000);
    expect(mocks.toastInfo).toHaveBeenCalledWith("stuck");
  });
});
