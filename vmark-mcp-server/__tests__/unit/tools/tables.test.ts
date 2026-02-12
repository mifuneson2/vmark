/**
 * Tests for table tools.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VMarkMcpServer } from '../../../src/server.js';
import { MockBridge } from '../../mocks/mockBridge.js';
import { registerTableTools } from '../../../src/tools/tables.js';

describe('Table Tools', () => {
  let bridge: MockBridge;
  let server: VMarkMcpServer;

  beforeEach(() => {
    bridge = new MockBridge();
    server = new VMarkMcpServer({ bridge });
    registerTableTools(server);
  });

  describe('table_insert', () => {
    it('should insert a table', async () => {
      const result = await server.callTool('table_insert', { rows: 3, cols: 4 });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Table inserted (3x4)');
    });

    it('should insert table with header row by default', async () => {
      await server.callTool('table_insert', { rows: 2, cols: 2 });

      const requests = bridge.getRequestsOfType('table.insert');
      expect(requests[0].request.withHeaderRow).toBe(true);
    });

    it('should allow disabling header row', async () => {
      await server.callTool('table_insert', {
        rows: 2,
        cols: 2,
        withHeaderRow: false,
      });

      const requests = bridge.getRequestsOfType('table.insert');
      expect(requests[0].request.withHeaderRow).toBe(false);
    });

    it('should validate rows is positive', async () => {
      const result = await server.callTool('table_insert', { rows: 0, cols: 2 });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('rows must be at least 1');
    });

    it('should validate cols is positive', async () => {
      const result = await server.callTool('table_insert', { rows: 2, cols: 0 });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('cols must be at least 1');
    });

    it('should validate rows is integer', async () => {
      const result = await server.callTool('table_insert', { rows: 2.5, cols: 2 });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('must be an integer');
    });

    it('should validate cols is integer', async () => {
      const result = await server.callTool('table_insert', { rows: 2, cols: 2.5 });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('must be an integer');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('table_insert', { rows: 3, cols: 4, withHeaderRow: true });

      const requests = bridge.getRequestsOfType('table.insert');
      expect(requests).toHaveLength(1);
      expect(requests[0].request).toMatchObject({
        type: 'table.insert',
        rows: 3,
        cols: 4,
        withHeaderRow: true,
        windowId: 'focused',
      });
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Cannot insert table here'));

      const result = await server.callTool('table_insert', { rows: 2, cols: 2 });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Cannot insert table here');
    });
  });

  describe('table_delete', () => {
    it('should delete table', async () => {
      const result = await server.callTool('table_delete', {});

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Table deleted');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('table_delete', {});

      const requests = bridge.getRequestsOfType('table.delete');
      expect(requests).toHaveLength(1);
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Not in a table'));

      const result = await server.callTool('table_delete', {});

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Not in a table');
    });
  });

});
