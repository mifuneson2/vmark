/**
 * Tests for type validation in document tool argument parsing.
 *
 * Covers: action arg, mode (OperationMode), matchPolicy (MatchPolicy),
 * scopeQuery, and anchor casts — ensuring invalid types are rejected
 * instead of silently passing through as unsafe `as Type` casts.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VMarkMcpServer } from '../../../src/server.js';
import { registerDocumentTool } from '../../../src/tools/document.js';
import { MockBridge } from '../../mocks/mockBridge.js';
import { McpTestClient } from '../../utils/McpTestClient.js';

describe('document tool argument validation', () => {
  let bridge: MockBridge;
  let server: VMarkMcpServer;
  let client: McpTestClient;

  beforeEach(() => {
    bridge = new MockBridge();
    server = new VMarkMcpServer({ bridge });
    registerDocumentTool(server);
    client = new McpTestClient(server);
  });

  // ============================================================
  // Issue 1: action argument validation
  // ============================================================

  describe('action argument', () => {
    it('should reject missing action', async () => {
      const result = await client.callTool('document', {});
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('action must be a non-empty string');
    });

    it('should reject action as a number', async () => {
      const result = await client.callTool('document', { action: 42 });
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('action must be a non-empty string');
    });

    it('should reject action as undefined', async () => {
      const result = await client.callTool('document', { action: undefined });
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('action must be a non-empty string');
    });

    it('should reject action as null', async () => {
      const result = await client.callTool('document', { action: null });
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('action must be a non-empty string');
    });

    it('should reject action as boolean', async () => {
      const result = await client.callTool('document', { action: true });
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('action must be a non-empty string');
    });

    it('should reject action as an object', async () => {
      const result = await client.callTool('document', { action: { type: 'get_content' } });
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('action must be a non-empty string');
    });

    it('should accept valid action string', async () => {
      bridge.setContent('hello');
      const result = await client.callTool('document', { action: 'get_content' });
      expect(result.success).toBe(true);
    });

    it('should reject unknown action string', async () => {
      const result = await client.callTool('document', { action: 'nonexistent_action' });
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('Unknown document action');
    });
  });

  // ============================================================
  // Issue 2: mode (OperationMode) validation
  // ============================================================

  describe('mode (OperationMode) validation', () => {
    it('should accept valid mode "apply"', async () => {
      bridge.setContent('hello');
      const result = await client.callTool('document', {
        action: 'batch_edit',
        baseRevision: 'rev1',
        mode: 'apply',
        operations: [{ type: 'delete', nodeId: 'n1' }],
      });
      // Even though mock may not handle the full batch_edit, it should not
      // fail due to mode validation
      expect(McpTestClient.getTextContent(result)).not.toContain('Invalid mode');
    });

    it('should accept valid mode "suggest"', async () => {
      bridge.setContent('hello');
      const result = await client.callTool('document', {
        action: 'batch_edit',
        baseRevision: 'rev1',
        mode: 'suggest',
        operations: [{ type: 'delete', nodeId: 'n1' }],
      });
      expect(McpTestClient.getTextContent(result)).not.toContain('Invalid mode');
    });

    it('should accept valid mode "dryRun"', async () => {
      bridge.setContent('hello');
      const result = await client.callTool('document', {
        action: 'batch_edit',
        baseRevision: 'rev1',
        mode: 'dryRun',
        operations: [{ type: 'delete', nodeId: 'n1' }],
      });
      expect(McpTestClient.getTextContent(result)).not.toContain('Invalid mode');
    });

    it('should default to "apply" when mode is omitted', async () => {
      bridge.setContent('hello');
      const result = await client.callTool('document', {
        action: 'batch_edit',
        baseRevision: 'rev1',
        operations: [{ type: 'delete', nodeId: 'n1' }],
      });
      // Should not fail due to mode validation
      expect(McpTestClient.getTextContent(result)).not.toContain('Invalid mode');
    });

    it('should reject invalid mode string', async () => {
      const result = await client.callTool('document', {
        action: 'batch_edit',
        baseRevision: 'rev1',
        mode: 'invalid_mode',
        operations: [{ type: 'delete', nodeId: 'n1' }],
      });
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('Invalid mode');
    });

    it('should reject mode as a number', async () => {
      const result = await client.callTool('document', {
        action: 'batch_edit',
        baseRevision: 'rev1',
        mode: 123,
        operations: [{ type: 'delete', nodeId: 'n1' }],
      });
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('Invalid mode');
    });

    it('should reject mode as a boolean', async () => {
      const result = await client.callTool('document', {
        action: 'batch_edit',
        baseRevision: 'rev1',
        mode: true,
        operations: [{ type: 'delete', nodeId: 'n1' }],
      });
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('Invalid mode');
    });

    it('should reject mode as an object', async () => {
      const result = await client.callTool('document', {
        action: 'batch_edit',
        baseRevision: 'rev1',
        mode: { type: 'apply' },
        operations: [{ type: 'delete', nodeId: 'n1' }],
      });
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('Invalid mode');
    });

    // Test mode validation across multiple actions that use it
    it('should validate mode in apply_diff', async () => {
      bridge.setContent('hello world');
      const result = await client.callTool('document', {
        action: 'apply_diff',
        baseRevision: 'rev1',
        original: 'hello',
        replacement: 'hi',
        mode: 'not_a_mode',
      });
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('Invalid mode');
    });

    it('should validate mode in replace_anchored', async () => {
      bridge.setContent('hello world');
      const result = await client.callTool('document', {
        action: 'replace_anchored',
        baseRevision: 'rev1',
        anchor: { text: 'hello', beforeContext: '', afterContext: ' world', maxDistance: 10 },
        replacement: 'hi',
        mode: 'bogus',
      });
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('Invalid mode');
    });

    it('should validate mode in write_paragraph', async () => {
      bridge.setContent('hello world');
      const result = await client.callTool('document', {
        action: 'write_paragraph',
        baseRevision: 'rev1',
        target: { index: 0 },
        operation: 'replace',
        content: 'new text',
        mode: 999,
      });
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('Invalid mode');
    });

    it('should validate mode in smart_insert', async () => {
      bridge.setContent('hello');
      const result = await client.callTool('document', {
        action: 'smart_insert',
        baseRevision: 'rev1',
        content: 'new content',
        destination: 'end_of_document',
        mode: 'fake',
      });
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('Invalid mode');
    });
  });

  // ============================================================
  // Issue 4: matchPolicy (MatchPolicy) validation
  // ============================================================

  describe('matchPolicy (MatchPolicy) validation', () => {
    it('should accept valid matchPolicy "first"', async () => {
      bridge.setContent('hello world');
      const result = await client.callTool('document', {
        action: 'apply_diff',
        baseRevision: 'rev1',
        original: 'hello',
        replacement: 'hi',
        matchPolicy: 'first',
      });
      expect(McpTestClient.getTextContent(result)).not.toContain('Invalid matchPolicy');
    });

    it('should accept valid matchPolicy "all"', async () => {
      bridge.setContent('hello world');
      const result = await client.callTool('document', {
        action: 'apply_diff',
        baseRevision: 'rev1',
        original: 'hello',
        replacement: 'hi',
        matchPolicy: 'all',
      });
      expect(McpTestClient.getTextContent(result)).not.toContain('Invalid matchPolicy');
    });

    it('should accept valid matchPolicy "error_if_multiple"', async () => {
      bridge.setContent('hello world');
      const result = await client.callTool('document', {
        action: 'apply_diff',
        baseRevision: 'rev1',
        original: 'hello',
        replacement: 'hi',
        matchPolicy: 'error_if_multiple',
      });
      expect(McpTestClient.getTextContent(result)).not.toContain('Invalid matchPolicy');
    });

    it('should accept valid matchPolicy "nth" with nth parameter', async () => {
      bridge.setContent('hello hello world');
      const result = await client.callTool('document', {
        action: 'apply_diff',
        baseRevision: 'rev1',
        original: 'hello',
        replacement: 'hi',
        matchPolicy: 'nth',
        nth: 1,
      });
      expect(McpTestClient.getTextContent(result)).not.toContain('Invalid matchPolicy');
    });

    it('should default to "first" when matchPolicy is omitted', async () => {
      bridge.setContent('hello world');
      const result = await client.callTool('document', {
        action: 'apply_diff',
        baseRevision: 'rev1',
        original: 'hello',
        replacement: 'hi',
      });
      expect(McpTestClient.getTextContent(result)).not.toContain('Invalid matchPolicy');
    });

    it('should reject invalid matchPolicy string', async () => {
      const result = await client.callTool('document', {
        action: 'apply_diff',
        baseRevision: 'rev1',
        original: 'hello',
        replacement: 'hi',
        matchPolicy: 'invalid_policy',
      });
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('Invalid matchPolicy');
    });

    it('should reject matchPolicy as a number', async () => {
      const result = await client.callTool('document', {
        action: 'apply_diff',
        baseRevision: 'rev1',
        original: 'hello',
        replacement: 'hi',
        matchPolicy: 42,
      });
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('Invalid matchPolicy');
    });

    it('should reject matchPolicy as a boolean', async () => {
      const result = await client.callTool('document', {
        action: 'apply_diff',
        baseRevision: 'rev1',
        original: 'hello',
        replacement: 'hi',
        matchPolicy: true,
      });
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('Invalid matchPolicy');
    });

    it('should reject matchPolicy as an object', async () => {
      const result = await client.callTool('document', {
        action: 'apply_diff',
        baseRevision: 'rev1',
        original: 'hello',
        replacement: 'hi',
        matchPolicy: { type: 'first' },
      });
      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('Invalid matchPolicy');
    });
  });

  // ============================================================
  // Issue 3: scopeQuery validation
  // ============================================================

  describe('scopeQuery validation', () => {
    it('should accept undefined scopeQuery (optional)', async () => {
      bridge.setContent('hello world');
      const result = await client.callTool('document', {
        action: 'apply_diff',
        baseRevision: 'rev1',
        original: 'hello',
        replacement: 'hi',
      });
      // No error from scopeQuery
      expect(McpTestClient.getTextContent(result)).not.toContain('scopeQuery');
    });

    it('should accept null scopeQuery as undefined', async () => {
      bridge.setContent('hello world');
      const result = await client.callTool('document', {
        action: 'apply_diff',
        baseRevision: 'rev1',
        original: 'hello',
        replacement: 'hi',
        scopeQuery: null,
      });
      // Should treat null as undefined (no scope filter)
      expect(McpTestClient.getTextContent(result)).not.toContain('scopeQuery');
    });
  });
});
