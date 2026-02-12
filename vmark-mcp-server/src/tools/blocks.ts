/**
 * Block tools - Manage block-level elements.
 */

import { VMarkMcpServer, resolveWindowId, validateNonNegativeInteger } from '../server.js';

/**
 * Valid block types.
 */
const VALID_BLOCK_TYPES = [
  'paragraph',
  'heading',
  'codeBlock',
  'blockquote',
] as const;
type BlockType = (typeof VALID_BLOCK_TYPES)[number];

function isValidBlockType(type: string): type is BlockType {
  return VALID_BLOCK_TYPES.includes(type as BlockType);
}

/**
 * Register all block tools on the server.
 */
export function registerBlockTools(server: VMarkMcpServer): void {
  // block_set_type - Set block type at cursor
  server.registerTool(
    {
      name: 'block_set_type',
      description:
        'Set the block type at the current cursor position. ' +
        'Converts the current block to the specified type (paragraph, heading, codeBlock, blockquote).',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: [...VALID_BLOCK_TYPES],
            description: 'The block type to set.',
          },
          level: {
            type: 'number',
            description: 'Level for headings (1-6). Only used when type is "heading".',
          },
          language: {
            type: 'string',
            description: 'Language for code blocks. Only used when type is "codeBlock".',
          },
          windowId: {
            type: 'string',
            description: 'Optional window identifier. Defaults to focused window.',
          },
        },
        required: ['type'],
      },
    },
    async (args) => {
      const type = args.type as string;
      const level = args.level as number | undefined;
      const language = args.language as string | undefined;
      const windowId = resolveWindowId(args.windowId as string | undefined);

      if (!isValidBlockType(type)) {
        return VMarkMcpServer.errorResult(
          `Invalid block type: ${type}. Valid types: ${VALID_BLOCK_TYPES.join(', ')}`
        );
      }

      if (type === 'heading') {
        if (level === undefined) {
          return VMarkMcpServer.errorResult('level is required for heading type');
        }
        const levelError = validateNonNegativeInteger(level, 'level');
        if (levelError) {
          return VMarkMcpServer.errorResult(levelError);
        }
        if (level < 1 || level > 6) {
          return VMarkMcpServer.errorResult('level must be between 1 and 6');
        }
      }

      try {
        await server.sendBridgeRequest<null>({
          type: 'block.setType',
          blockType: type,
          level,
          language,
          windowId,
        });

        const description =
          type === 'heading'
            ? `heading level ${level}`
            : type === 'codeBlock' && language
              ? `code block (${language})`
              : type;

        return VMarkMcpServer.successResult(`Block type set to ${description}`);
      } catch (error) {
        return VMarkMcpServer.errorResult(
          `Failed to set block type: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // block_insert_horizontal_rule - Insert a horizontal rule
  server.registerTool(
    {
      name: 'block_insert_horizontal_rule',
      description:
        'Insert a horizontal rule (---) at the current cursor position. ' +
        'This creates a visual separator in the document.',
      inputSchema: {
        type: 'object',
        properties: {
          windowId: {
            type: 'string',
            description: 'Optional window identifier. Defaults to focused window.',
          },
        },
      },
    },
    async (args) => {
      const windowId = resolveWindowId(args.windowId as string | undefined);

      try {
        await server.sendBridgeRequest<null>({
          type: 'block.insertHorizontalRule',
          windowId,
        });

        return VMarkMcpServer.successResult('Horizontal rule inserted');
      } catch (error) {
        return VMarkMcpServer.errorResult(
          `Failed to insert horizontal rule: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}
