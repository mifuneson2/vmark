/**
 * Tests for updateStore
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useUpdateStore } from "./updateStore";

describe("updateStore", () => {
  beforeEach(() => {
    useUpdateStore.getState().reset();
  });

  describe("setError and setStatus interaction", () => {
    it("setError sets both error message and status to error", () => {
      const { setError } = useUpdateStore.getState();

      setError("Something went wrong");

      const state = useUpdateStore.getState();
      expect(state.error).toBe("Something went wrong");
      expect(state.status).toBe("error");
    });

    it("setStatus(error) preserves existing error message", () => {
      const { setError, setStatus } = useUpdateStore.getState();

      setError("Original error");
      setStatus("error");

      const state = useUpdateStore.getState();
      expect(state.error).toBe("Original error");
      expect(state.status).toBe("error");
    });

    it("setStatus to non-error clears error message", () => {
      const { setError, setStatus } = useUpdateStore.getState();

      setError("Some error");
      setStatus("checking");

      const state = useUpdateStore.getState();
      expect(state.error).toBeNull();
      expect(state.status).toBe("checking");
    });

    it("setError(null) clears error but preserves status", () => {
      const { setStatus, setError } = useUpdateStore.getState();

      setStatus("downloading");
      setError(null);

      const state = useUpdateStore.getState();
      expect(state.error).toBeNull();
      expect(state.status).toBe("downloading");
    });

    it("typical check flow: checking clears previous error", () => {
      const { setError, setStatus } = useUpdateStore.getState();

      // Simulate previous failed check
      setError("Network error");
      expect(useUpdateStore.getState().status).toBe("error");

      // Start new check
      setStatus("checking");

      const state = useUpdateStore.getState();
      expect(state.error).toBeNull();
      expect(state.status).toBe("checking");
    });
  });

  describe("dismiss and clearDismissed", () => {
    it("dismiss sets dismissed to true", () => {
      const { dismiss } = useUpdateStore.getState();

      dismiss();

      expect(useUpdateStore.getState().dismissed).toBe(true);
    });

    it("clearDismissed resets dismissed to false", () => {
      const { dismiss, clearDismissed } = useUpdateStore.getState();

      dismiss();
      expect(useUpdateStore.getState().dismissed).toBe(true);

      clearDismissed();
      expect(useUpdateStore.getState().dismissed).toBe(false);
    });
  });

  describe("reset", () => {
    it("resets all state to initial values", () => {
      const { setError, setStatus, setUpdateInfo, dismiss, reset } = useUpdateStore.getState();

      setError("Error");
      setStatus("error");
      setUpdateInfo({ version: "1.0.0", notes: "", pubDate: "", currentVersion: "0.9.0" });
      dismiss();

      reset();

      const state = useUpdateStore.getState();
      expect(state.status).toBe("idle");
      expect(state.error).toBeNull();
      expect(state.updateInfo).toBeNull();
      expect(state.dismissed).toBe(false);
      expect(state.downloadProgress).toBeNull();
      expect(state.pendingUpdate).toBeNull();
    });
  });

  describe("setUpdateInfo", () => {
    it("sets update info", () => {
      const info = { version: "2.0.0", notes: "New features", pubDate: "2024-01-01", currentVersion: "1.0.0" };
      useUpdateStore.getState().setUpdateInfo(info);

      expect(useUpdateStore.getState().updateInfo).toEqual(info);
    });

    it("clears update info with null", () => {
      useUpdateStore.getState().setUpdateInfo({ version: "1.0.0", notes: "", pubDate: "", currentVersion: "0.9.0" });
      useUpdateStore.getState().setUpdateInfo(null);

      expect(useUpdateStore.getState().updateInfo).toBeNull();
    });
  });

  describe("setDownloadProgress", () => {
    it("sets download progress directly", () => {
      const progress = { downloaded: 500, total: 1000 };
      useUpdateStore.getState().setDownloadProgress(progress);

      expect(useUpdateStore.getState().downloadProgress).toEqual(progress);
    });

    it("sets download progress with null total", () => {
      const progress = { downloaded: 100, total: null };
      useUpdateStore.getState().setDownloadProgress(progress);

      expect(useUpdateStore.getState().downloadProgress).toEqual({ downloaded: 100, total: null });
    });

    it("clears download progress with null", () => {
      useUpdateStore.getState().setDownloadProgress({ downloaded: 500, total: 1000 });
      useUpdateStore.getState().setDownloadProgress(null);

      expect(useUpdateStore.getState().downloadProgress).toBeNull();
    });

    it("accepts function updater", () => {
      useUpdateStore.getState().setDownloadProgress({ downloaded: 100, total: 1000 });

      useUpdateStore.getState().setDownloadProgress((prev) => {
        if (!prev) return { downloaded: 0, total: 1000 };
        return { ...prev, downloaded: prev.downloaded + 200 };
      });

      expect(useUpdateStore.getState().downloadProgress).toEqual({ downloaded: 300, total: 1000 });
    });

    it("function updater receives null when no previous progress", () => {
      useUpdateStore.getState().setDownloadProgress((prev) => {
        expect(prev).toBeNull();
        return { downloaded: 0, total: 500 };
      });

      expect(useUpdateStore.getState().downloadProgress).toEqual({ downloaded: 0, total: 500 });
    });
  });

  describe("setPendingUpdate", () => {
    it("sets pending update", () => {
      const fakeUpdate = { version: "2.0.0" } as never;
      useUpdateStore.getState().setPendingUpdate(fakeUpdate);

      expect(useUpdateStore.getState().pendingUpdate).toBe(fakeUpdate);
    });

    it("clears pending update with null", () => {
      useUpdateStore.getState().setPendingUpdate({ version: "2.0.0" } as never);
      useUpdateStore.getState().setPendingUpdate(null);

      expect(useUpdateStore.getState().pendingUpdate).toBeNull();
    });
  });

  describe("setStatus transitions", () => {
    it("transitions through typical update flow", () => {
      const store = useUpdateStore.getState();

      store.setStatus("checking");
      expect(useUpdateStore.getState().status).toBe("checking");

      store.setStatus("available");
      expect(useUpdateStore.getState().status).toBe("available");

      store.setStatus("downloading");
      expect(useUpdateStore.getState().status).toBe("downloading");

      store.setStatus("ready");
      expect(useUpdateStore.getState().status).toBe("ready");
    });

    it("sets up-to-date status", () => {
      useUpdateStore.getState().setStatus("up-to-date");
      expect(useUpdateStore.getState().status).toBe("up-to-date");
    });
  });
});
