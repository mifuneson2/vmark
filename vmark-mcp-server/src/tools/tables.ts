/**
 * Table tools - Manage table elements.
 */

import { VMarkMcpServer, resolveWindowId, validateNonNegativeInteger } from '../server.js';

/**
 * Register all table tools on the server.
 */
export function registerTableTools(server: VMarkMcpServer): void {
  // table_insert - Insert a new table
  server.registerTool(
    {
      name: 'table_insert',
      description:
        'Insert a new table at the current cursor position. ' +
        'Creates a table with the specified number of rows and columns.',
      inputSchema: {
        type: 'object',
        properties: {
          rows: {
            type: 'number',
            description: 'Number of rows (must be at least 1).',
          },
          cols: {
            type: 'number',
            description: 'Number of columns (must be at least 1).',
          },
          withHeaderRow: {
            type: 'boolean',
            description: 'Whether to include a header row. Defaults to true.',
          },
          windowId: {
            type: 'string',
            description: 'Optional window identifier. Defaults to focused window.',
          },
        },
        required: ['rows', 'cols'],
      },
    },
    async (args) => {
      const rows = args.rows as number;
      const cols = args.cols as number;
      const withHeaderRow = (args.withHeaderRow as boolean) ?? true;
      const windowId = resolveWindowId(args.windowId as string | undefined);

      const rowsError = validateNonNegativeInteger(rows, 'rows');
      if (rowsError) {
        return VMarkMcpServer.errorResult(rowsError);
      }
      if (rows < 1) {
        return VMarkMcpServer.errorResult('rows must be at least 1');
      }

      const colsError = validateNonNegativeInteger(cols, 'cols');
      if (colsError) {
        return VMarkMcpServer.errorResult(colsError);
      }
      if (cols < 1) {
        return VMarkMcpServer.errorResult('cols must be at least 1');
      }

      try {
        await server.sendBridgeRequest<null>({
          type: 'table.insert',
          rows,
          cols,
          withHeaderRow,
          windowId,
        });

        return VMarkMcpServer.successResult(`Table inserted (${rows}x${cols})`);
      } catch (error) {
        return VMarkMcpServer.errorResult(
          `Failed to insert table: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // table_delete - Delete the current table
  server.registerTool(
    {
      name: 'table_delete',
      description:
        'Delete the table containing the cursor. ' +
        'If the cursor is not inside a table, this has no effect.',
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
          type: 'table.delete',
          windowId,
        });

        return VMarkMcpServer.successResult('Table deleted');
      } catch (error) {
        return VMarkMcpServer.errorResult(
          `Failed to delete table: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

}
