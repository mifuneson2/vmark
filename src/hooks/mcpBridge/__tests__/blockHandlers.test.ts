/**
 * Tests for blockHandlers — list_blocks, resolve_targets, get_section.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock utils
const mockRespond = vi.fn();
const mockGetEditor = vi.fn();
vi.mock("../utils", () => ({
  respond: (response: unknown) => mockRespond(response),
  getEditor: () => mockGetEditor(),
}));

// Mock revision store
vi.mock("@/stores/revisionStore", () => ({
  useRevisionStore: {
    getState: () => ({
      getRevision: () => "rev-test",
    }),
  },
}));

// Mock AST handlers
const mockGenerateNodeId = vi.fn();
const mockResetNodeIdCounters = vi.fn();
const mockExtractText = vi.fn();
const mockToAstNode = vi.fn();
const mockMatchesQuery = vi.fn();
vi.mock("../astHandlers", () => ({
  generateNodeId: (...args: unknown[]) => mockGenerateNodeId(...args),
  resetNodeIdCounters: () => mockResetNodeIdCounters(),
  extractText: (...args: unknown[]) => mockExtractText(...args),
  toAstNode: (...args: unknown[]) => mockToAstNode(...args),
  matchesQuery: (...args: unknown[]) => mockMatchesQuery(...args),
}));

import {
  handleListBlocks,
  handleResolveTargets,
  handleGetSection,
} from "../blockHandlers";

describe("blockHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let nodeCounter = 0;
    mockGenerateNodeId.mockImplementation(
      (type: string) => `${type}-${nodeCounter++}`
    );
    mockExtractText.mockReturnValue("text");
    mockMatchesQuery.mockReturnValue(true);
  });

  describe("handleListBlocks", () => {
    it("lists blocks from document", async () => {
      const nodes = [
        {
          type: { name: "paragraph" },
          isBlock: true,
          isTextblock: true,
          nodeSize: 10,
        },
        {
          type: { name: "heading" },
          isBlock: true,
          isTextblock: true,
          nodeSize: 8,
        },
      ];
      const editor = {
        state: {
          doc: {
            descendants: (
              callback: (node: unknown, pos: number) => boolean | undefined
            ) => {
              let pos = 0;
              for (const node of nodes) {
                const result = callback(node, pos);
                if (result === false) break;
                pos += (node as { nodeSize: number }).nodeSize;
              }
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleListBlocks("req-1", {});

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.blocks).toHaveLength(2);
      expect(call.data.revision).toBe("rev-test");
    });

    it("respects limit parameter", async () => {
      const nodes = Array.from({ length: 5 }, () => ({
        type: { name: "paragraph" },
        isBlock: true,
        isTextblock: true,
        nodeSize: 10,
      }));
      const editor = {
        state: {
          doc: {
            descendants: (
              callback: (node: unknown, pos: number) => boolean | undefined
            ) => {
              let pos = 0;
              for (const node of nodes) {
                const result = callback(node, pos);
                if (result === false) break;
                pos += 10;
              }
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleListBlocks("req-2", { limit: 2 });

      const call = mockRespond.mock.calls[0][0];
      expect(call.data.blocks).toHaveLength(2);
      expect(call.data.hasMore).toBe(true);
      expect(call.data.nextCursor).toBeDefined();
    });

    it("returns error when no editor", async () => {
      mockGetEditor.mockReturnValue(null);

      await handleListBlocks("req-3", {});

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-3",
        success: false,
        error: "No active editor",
      });
    });
  });

  describe("handleResolveTargets", () => {
    it("resolves targets matching query", async () => {
      const nodes = [
        {
          type: { name: "paragraph" },
          isBlock: true,
          nodeSize: 10,
        },
      ];
      const editor = {
        state: {
          doc: {
            descendants: (
              callback: (node: unknown, pos: number) => boolean | undefined
            ) => {
              for (const node of nodes) {
                callback(node, 0);
              }
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleResolveTargets("req-4", {
        query: { type: "paragraph" },
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.candidates).toHaveLength(1);
    });

    it("returns error when query is missing", async () => {
      mockGetEditor.mockReturnValue({
        state: { doc: { descendants: vi.fn() } },
      });

      await handleResolveTargets("req-5", {});

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-5",
        success: false,
        error: "query is required",
      });
    });

    it("returns error when no editor", async () => {
      mockGetEditor.mockReturnValue(null);

      await handleResolveTargets("req-6", { query: { type: "heading" } });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-6",
        success: false,
        error: "No active editor",
      });
    });
  });

  describe("handleGetSection", () => {
    it("finds section by heading text", async () => {
      const heading = {
        type: { name: "heading" },
        attrs: { level: 2 },
        nodeSize: 10,
      };
      const paragraph = {
        type: { name: "paragraph" },
        isBlock: true,
        nodeSize: 10,
      };
      mockExtractText
        .mockReturnValueOnce("Target")
        .mockReturnValue("text");
      mockToAstNode.mockReturnValue({
        type: "paragraph",
        text: "text",
      });

      const editor = {
        state: {
          doc: {
            content: { size: 20 },
            descendants: (
              callback: (node: unknown, pos: number) => boolean | undefined
            ) => {
              callback(heading, 0);
              callback(paragraph, 10);
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleGetSection("req-7", { heading: "Target" });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.heading.text).toBe("Target");
      expect(call.data.heading.level).toBe(2);
    });

    it("returns error for missing heading", async () => {
      mockGetEditor.mockReturnValue({
        state: { doc: { descendants: vi.fn() } },
      });

      await handleGetSection("req-8", {});

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-8",
        success: false,
        error: "heading is required",
      });
    });

    it("returns error when section not found", async () => {
      const editor = {
        state: {
          doc: {
            content: { size: 0 },
            descendants: () => {
              // no headings found
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleGetSection("req-9", { heading: "Nonexistent" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-9",
        success: false,
        error: "Section not found",
      });
    });

    it("returns error when no editor", async () => {
      mockGetEditor.mockReturnValue(null);

      await handleGetSection("req-10", { heading: "Test" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-10",
        success: false,
        error: "No active editor",
      });
    });

    it("finds section by level and index", async () => {
      const headings = [
        {
          type: { name: "heading" },
          attrs: { level: 2 },
          nodeSize: 10,
          isBlock: true,
        },
        {
          type: { name: "paragraph" },
          attrs: {},
          nodeSize: 15,
          isBlock: true,
        },
        {
          type: { name: "heading" },
          attrs: { level: 2 },
          nodeSize: 10,
          isBlock: true,
        },
      ];

      let extractCallCount = 0;
      mockExtractText.mockImplementation(() => {
        extractCallCount++;
        return extractCallCount <= 1 ? "First H2" : "Second H2";
      });
      mockToAstNode.mockReturnValue({ type: "paragraph", text: "text" });

      const editor = {
        state: {
          doc: {
            content: { size: 35 },
            descendants: (
              callback: (node: unknown, pos: number) => boolean | undefined
            ) => {
              let pos = 0;
              for (const node of headings) {
                const result = callback(node, pos);
                if (result === false) break;
                pos += node.nodeSize;
              }
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleGetSection("req-11", {
        heading: { level: 2, index: 1 },
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.heading.level).toBe(2);
    });

    it("case-insensitive heading match", async () => {
      const heading = {
        type: { name: "heading" },
        attrs: { level: 1 },
        nodeSize: 10,
      };
      mockExtractText.mockReturnValue("My Section");

      const editor = {
        state: {
          doc: {
            content: { size: 10 },
            descendants: (
              callback: (node: unknown, pos: number) => boolean | undefined
            ) => {
              callback(heading, 0);
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleGetSection("req-12", { heading: "my section" });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.heading.text).toBe("My Section");
    });
  });

  describe("handleListBlocks — cursor pagination", () => {
    it("skips blocks until afterCursor is found", async () => {
      const nodes = [
        {
          type: { name: "paragraph" },
          isBlock: true,
          isTextblock: true,
          nodeSize: 10,
        },
        {
          type: { name: "paragraph" },
          isBlock: true,
          isTextblock: true,
          nodeSize: 10,
        },
        {
          type: { name: "paragraph" },
          isBlock: true,
          isTextblock: true,
          nodeSize: 10,
        },
      ];

      let nodeCounter = 0;
      mockGenerateNodeId.mockImplementation(
        (type: string) => `${type}-${nodeCounter++}`
      );

      const editor = {
        state: {
          doc: {
            descendants: (
              callback: (node: unknown, pos: number) => boolean | undefined
            ) => {
              let pos = 0;
              for (const node of nodes) {
                const result = callback(node, pos);
                if (result === false) break;
                pos += 10;
              }
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleListBlocks("req-20", {
        afterCursor: "paragraph-0",
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      // Should skip first block and return the remaining 2
      expect(call.data.blocks).toHaveLength(2);
    });
  });

  describe("handleListBlocks — query filtering", () => {
    it("filters blocks based on query", async () => {
      const nodes = [
        {
          type: { name: "heading" },
          isBlock: true,
          isTextblock: true,
          nodeSize: 10,
        },
        {
          type: { name: "paragraph" },
          isBlock: true,
          isTextblock: true,
          nodeSize: 10,
        },
      ];

      // Only match headings
      mockMatchesQuery.mockImplementation(
        (node: { type: { name: string } }) => node.type.name === "heading"
      );

      const editor = {
        state: {
          doc: {
            descendants: (
              callback: (node: unknown, pos: number) => boolean | undefined
            ) => {
              let pos = 0;
              for (const node of nodes) {
                const result = callback(node, pos);
                if (result === false) break;
                pos += 10;
              }
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleListBlocks("req-21", {
        query: { type: "heading" },
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.data.blocks).toHaveLength(1);
    });

    it("truncates long text in preview", async () => {
      const longText = "x".repeat(150);
      mockExtractText.mockReturnValue(longText);

      const nodes = [
        {
          type: { name: "paragraph" },
          isBlock: true,
          isTextblock: true,
          nodeSize: 200,
        },
      ];

      const editor = {
        state: {
          doc: {
            descendants: (
              callback: (node: unknown, pos: number) => boolean | undefined
            ) => {
              for (const node of nodes) {
                callback(node, 0);
              }
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleListBlocks("req-22", {});

      const call = mockRespond.mock.calls[0][0];
      const block = call.data.blocks[0];
      expect(block.preview.length).toBeLessThan(longText.length);
      expect(block.preview).toContain("...");
    });
  });

  describe("handleResolveTargets — scoring", () => {
    it("scores exact match higher than partial", async () => {
      const nodes = [
        {
          type: { name: "paragraph" },
          isBlock: true,
          nodeSize: 10,
        },
        {
          type: { name: "paragraph" },
          isBlock: true,
          nodeSize: 10,
        },
      ];

      let callCount = 0;
      mockExtractText.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? "hello world" : "hello";
      });

      const editor = {
        state: {
          doc: {
            descendants: (
              callback: (node: unknown, pos: number) => boolean | undefined
            ) => {
              let pos = 0;
              for (const node of nodes) {
                callback(node, pos);
                pos += 10;
              }
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleResolveTargets("req-30", {
        query: { type: "paragraph", contains: "hello" },
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.candidates).toHaveLength(2);
      // exact match should score higher
      expect(call.data.candidates[0].score).toBeGreaterThanOrEqual(
        call.data.candidates[1].score
      );
    });

    it("detects ambiguous results", async () => {
      const nodes = [
        {
          type: { name: "paragraph" },
          isBlock: true,
          nodeSize: 10,
        },
        {
          type: { name: "paragraph" },
          isBlock: true,
          nodeSize: 10,
        },
      ];

      // Both return same text — both will have same high score
      mockExtractText.mockReturnValue("hello");

      const editor = {
        state: {
          doc: {
            descendants: (
              callback: (node: unknown, pos: number) => boolean | undefined
            ) => {
              let pos = 0;
              for (const node of nodes) {
                callback(node, pos);
                pos += 10;
              }
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleResolveTargets("req-31", {
        query: { type: "paragraph", contains: "hello" },
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.data.isAmbiguous).toBe(true);
    });

    it("respects maxResults limit", async () => {
      const nodes = Array.from({ length: 20 }, () => ({
        type: { name: "paragraph" },
        isBlock: true,
        nodeSize: 10,
      }));

      const editor = {
        state: {
          doc: {
            descendants: (
              callback: (node: unknown, pos: number) => boolean | undefined
            ) => {
              let pos = 0;
              for (const node of nodes) {
                callback(node, pos);
                pos += 10;
              }
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleResolveTargets("req-32", {
        query: { type: "paragraph" },
        maxResults: 3,
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.data.candidates).toHaveLength(3);
    });

    it("includes level in reason when query has level", async () => {
      const node = {
        type: { name: "heading" },
        isBlock: true,
        nodeSize: 10,
        attrs: { level: 2 },
      };

      mockExtractText.mockReturnValue("Section");

      const editor = {
        state: {
          doc: {
            descendants: (
              callback: (node: unknown, pos: number) => boolean | undefined
            ) => {
              callback(node, 0);
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleResolveTargets("req-33", {
        query: { type: "heading", level: 2 },
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.data.candidates[0].reason).toContain("level=2");
    });
  });
});
