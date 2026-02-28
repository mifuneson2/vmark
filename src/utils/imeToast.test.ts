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

describe("imeToast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
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
    vi.mocked(useActiveEditorStore.getState).mockReturnValue({
      activeWysiwygEditor: { view: { composing: true } },
      activeSourceView: null,
    } as never);

    imeToast.info("deferred");
    expect(mocks.toastInfo).not.toHaveBeenCalled();

    // Fire compositionend then advance past the post-composition delay
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

    fireCompositionEnd();
    vi.advanceTimersByTime(60);
    expect(mocks.toastSuccess).toHaveBeenCalledWith("deferred");
  });

  it("flushes multiple queued toasts on compositionend", () => {
    vi.mocked(useActiveEditorStore.getState).mockReturnValue({
      activeWysiwygEditor: { view: { composing: true } },
      activeSourceView: null,
    } as never);

    imeToast.info("first");
    imeToast.success("second");
    expect(mocks.toastInfo).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();

    fireCompositionEnd();
    vi.advanceTimersByTime(60);
    expect(mocks.toastInfo).toHaveBeenCalledWith("first");
    expect(mocks.toastSuccess).toHaveBeenCalledWith("second");
  });

  it("does not flush before post-composition delay elapses", () => {
    vi.mocked(useActiveEditorStore.getState).mockReturnValue({
      activeWysiwygEditor: { view: { composing: true } },
      activeSourceView: null,
    } as never);

    imeToast.info("deferred");
    fireCompositionEnd();
    // Only 30ms — should not flush yet
    vi.advanceTimersByTime(30);
    expect(mocks.toastInfo).not.toHaveBeenCalled();

    // Remaining 30ms — now it should flush
    vi.advanceTimersByTime(30);
    expect(mocks.toastInfo).toHaveBeenCalledWith("deferred");
  });

  it("never defers error toast (urgent)", () => {
    vi.mocked(useActiveEditorStore.getState).mockReturnValue({
      activeWysiwygEditor: { view: { composing: true } },
      activeSourceView: null,
    } as never);

    imeToast.error("fail");
    expect(mocks.toastError).toHaveBeenCalledWith("fail");
  });

  it("never defers warning toast (urgent)", () => {
    vi.mocked(useActiveEditorStore.getState).mockReturnValue({
      activeWysiwygEditor: { view: { composing: true } },
      activeSourceView: null,
    } as never);

    imeToast.warning("warn");
    expect(mocks.toastWarning).toHaveBeenCalledWith("warn");
  });
});
