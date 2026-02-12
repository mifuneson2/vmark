/**
 * Tests for block tools.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VMarkMcpServer } from '../../../src/server.js';
import { MockBridge } from '../../mocks/mockBridge.js';
import { registerBlockTools } from '../../../src/tools/blocks.js';

describe('Block Tools', () => {
  let bridge: MockBridge;
  let server: VMarkMcpServer;

  beforeEach(() => {
    bridge = new MockBridge();
    server = new VMarkMcpServer({ bridge });
    registerBlockTools(server);
  });

  describe('block_set_type', () => {
    it('should set block type to paragraph', async () => {
      const result = await server.callTool('block_set_type', { type: 'paragraph' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Block type set to paragraph');
    });

    it('should set block type to blockquote', async () => {
      const result = await server.callTool('block_set_type', { type: 'blockquote' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Block type set to blockquote');
    });

    it('should set heading with level', async () => {
      const result = await server.callTool('block_set_type', {
        type: 'heading',
        level: 2,
      });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('heading level 2');
    });

    it('should set code block with language', async () => {
      const result = await server.callTool('block_set_type', {
        type: 'codeBlock',
        language: 'typescript',
      });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('code block (typescript)');
    });

    it('should set code block without language', async () => {
      const result = await server.callTool('block_set_type', { type: 'codeBlock' });

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Block type set to codeBlock');
    });

    it('should reject invalid block type', async () => {
      const result = await server.callTool('block_set_type', { type: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Invalid block type');
    });

    it('should require level for heading', async () => {
      const result = await server.callTool('block_set_type', { type: 'heading' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('level is required');
    });

    it('should validate heading level is positive', async () => {
      const result = await server.callTool('block_set_type', {
        type: 'heading',
        level: 0,
      });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('level must be between 1 and 6');
    });

    it('should validate heading level max is 6', async () => {
      const result = await server.callTool('block_set_type', {
        type: 'heading',
        level: 7,
      });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('level must be between 1 and 6');
    });

    it('should validate level is integer', async () => {
      const result = await server.callTool('block_set_type', {
        type: 'heading',
        level: 2.5,
      });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('must be an integer');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('block_set_type', {
        type: 'heading',
        level: 3,
      });

      const requests = bridge.getRequestsOfType('block.setType');
      expect(requests).toHaveLength(1);
      expect(requests[0].request).toMatchObject({
        type: 'block.setType',
        blockType: 'heading',
        level: 3,
        windowId: 'focused',
      });
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Cannot change block type'));

      const result = await server.callTool('block_set_type', { type: 'paragraph' });

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Cannot change block type');
    });

    it('should use specified windowId', async () => {
      await server.callTool('block_set_type', {
        type: 'paragraph',
        windowId: 'editor',
      });

      const requests = bridge.getRequestsOfType('block.setType');
      expect(requests[0].request.windowId).toBe('editor');
    });
  });

  describe('block_insert_horizontal_rule', () => {
    it('should insert horizontal rule', async () => {
      const result = await server.callTool('block_insert_horizontal_rule', {});

      expect(result.success).toBe(true);
      expect(result.content[0].text).toContain('Horizontal rule inserted');
    });

    it('should send correct bridge request', async () => {
      await server.callTool('block_insert_horizontal_rule', {});

      const requests = bridge.getRequestsOfType('block.insertHorizontalRule');
      expect(requests).toHaveLength(1);
      expect(requests[0].request).toMatchObject({
        type: 'block.insertHorizontalRule',
        windowId: 'focused',
      });
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Invalid position'));

      const result = await server.callTool('block_insert_horizontal_rule', {});

      expect(result.success).toBe(false);
      expect(result.content[0].text).toContain('Invalid position');
    });

    it('should use specified windowId', async () => {
      await server.callTool('block_insert_horizontal_rule', { windowId: 'main' });

      const requests = bridge.getRequestsOfType('block.insertHorizontalRule');
      expect(requests[0].request.windowId).toBe('main');
    });
  });
});
