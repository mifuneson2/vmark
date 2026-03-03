/**
 * Tests for protocolHandlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleGetCapabilities, handleGetRevision } from "../protocolHandlers";

// Mock respond utility
const mockRespond = vi.fn();
vi.mock("../utils", () => ({
  respond: (response: unknown) => mockRespond(response),
}));

// Mock revision store with controllable getState
const mockRevisionGetState = vi.fn().mockReturnValue({
  currentRevision: "rev-test1234",
  lastUpdated: 1234567890,
});
vi.mock("@/stores/revisionStore", () => ({
  useRevisionStore: {
    getState: () => mockRevisionGetState(),
  },
}));

// Mock editor store with mutable state for testing both modes
const mockEditorGetState = vi.fn().mockReturnValue({ sourceMode: false });
vi.mock("@/stores/editorStore", () => ({
  useEditorStore: {
    getState: () => mockEditorGetState(),
  },
}));

describe("protocolHandlers", () => {
  beforeEach(() => {
    mockRespond.mockClear();
    mockEditorGetState.mockReturnValue({ sourceMode: false });
    mockRevisionGetState.mockReturnValue({
      currentRevision: "rev-test1234",
      lastUpdated: 1234567890,
    });
  });

  describe("handleGetCapabilities", () => {
    it("returns valid capabilities response", async () => {
      await handleGetCapabilities("test-id");

      expect(mockRespond).toHaveBeenCalledTimes(1);
      const call = mockRespond.mock.calls[0][0];

      expect(call.id).toBe("test-id");
      expect(call.success).toBe(true);
      expect(call.data).toBeDefined();

      const data = call.data;
      expect(data.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(data.supportedNodeTypes).toBeInstanceOf(Array);
      expect(data.supportedNodeTypes).toContain("paragraph");
      expect(data.supportedNodeTypes).toContain("heading");
      expect(data.supportedQueryOperators).toBeInstanceOf(Array);
      expect(data.supportedQueryOperators).toContain("type");
      expect(data.supportedQueryOperators).toContain("contains");
    });

    it("includes limits in response", async () => {
      await handleGetCapabilities("test-id");

      const data = mockRespond.mock.calls[0][0].data;
      expect(data.limits).toBeDefined();
      expect(data.limits.maxBatchSize).toBe(100);
      expect(data.limits.maxPayloadBytes).toBeGreaterThan(0);
    });

    it("reports editorMode as wysiwyg when not in source mode", async () => {
      await handleGetCapabilities("test-id");

      const data = mockRespond.mock.calls[0][0].data;
      expect(data.editorMode).toBe("wysiwyg");
    });

    it("reports editorMode as source when in source mode", async () => {
      mockEditorGetState.mockReturnValue({ sourceMode: true });

      await handleGetCapabilities("test-id");

      const data = mockRespond.mock.calls[0][0].data;
      expect(data.editorMode).toBe("source");
    });

    it("includes features in response", async () => {
      await handleGetCapabilities("test-id");

      const data = mockRespond.mock.calls[0][0].data;
      expect(data.features).toBeDefined();
      expect(data.features.suggestionModeSupported).toBe(true);
      expect(data.features.revisionTracking).toBe(true);
      expect(data.features.idempotency).toBe(true);
    });

    it("handles non-Error thrown value in catch", async () => {
      mockEditorGetState.mockImplementation(() => {
        throw "capabilities error";
      });

      await handleGetCapabilities("test-err-1");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "test-err-1",
        success: false,
        error: "capabilities error",
      });
    });

    it("handles Error thrown in catch", async () => {
      mockEditorGetState.mockImplementation(() => {
        throw new Error("store failure");
      });

      await handleGetCapabilities("test-err-2");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "test-err-2",
        success: false,
        error: "store failure",
      });
    });
  });

  describe("handleGetRevision", () => {
    it("returns current revision info", async () => {
      await handleGetRevision("test-id");

      expect(mockRespond).toHaveBeenCalledTimes(1);
      const call = mockRespond.mock.calls[0][0];

      expect(call.id).toBe("test-id");
      expect(call.success).toBe(true);
      expect(call.data.revision).toBe("rev-test1234");
      expect(call.data.lastUpdated).toBe(1234567890);
    });

    it("handles non-Error thrown value in catch", async () => {
      mockRevisionGetState.mockImplementation(() => {
        throw "revision error";
      });

      await handleGetRevision("test-err-3");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "test-err-3",
        success: false,
        error: "revision error",
      });
    });

    it("handles Error thrown in catch", async () => {
      mockRevisionGetState.mockImplementation(() => {
        throw new Error("revision store failure");
      });

      await handleGetRevision("test-err-4");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "test-err-4",
        success: false,
        error: "revision store failure",
      });
    });
  });
});
