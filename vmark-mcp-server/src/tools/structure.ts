/**
 * Structure composite tool — AST access, document structure queries, and section operations.
 *
 * Merges former structure.ts + sections.ts.
 */

import {
  VMarkMcpServer,
  getWindowIdArg,
  getNumberArg,
  getStringArg,
  requireStringArg,
  requireStringArgAllowEmpty,
  validateByIndex,
  validateNonNegativeInteger,
} from '../server.js';
import type {
  AstResponse,
  DocumentDigest,
  BlockInfo,
  TargetResolution,
  SectionInfo,
  AstProjection,
  BlockQuery,
  BatchEditResult,
  OperationMode,
  SectionTarget,
  NewHeading,
  BridgeRequest,
} from '../bridge/types.js';

export function registerStructureTool(server: VMarkMcpServer): void {
  server.registerTool(
    {
      name: 'structure',
      description:
        'Document structure queries and section operations.\n\n' +
        'Actions:\n' +
        '- get_ast: Get document AST with optional projections and filters\n' +
        '- get_digest: Quick document overview (title, word count, outline, block counts)\n' +
        '- list_blocks: Query blocks with filters\n' +
        '- resolve_targets: Pre-flight check for mutations (find nodes by query)\n' +
        '- get_section: Get section by heading (text or level+index)\n' +
        '- update_section: Replace section content\n' +
        '- insert_section: Add new section after existing one\n' +
        '- move_section: Reorder sections',
      inputSchema: {
        type: 'object',
        required: ['action'],
        properties: {
          action: {
            type: 'string',
            enum: [
              'get_ast', 'get_digest', 'list_blocks', 'resolve_targets',
              'get_section', 'update_section', 'insert_section', 'move_section',
            ],
          },
          projection: {
            type: 'array',
            items: { type: 'string', enum: ['id', 'type', 'text', 'attrs', 'marks', 'children'] },
            description: 'Fields to include (for get_ast, list_blocks).',
          },
          filter: {
            type: 'object',
            description: 'Filter criteria: type, level, contains, hasMarks (for get_ast).',
          },
          query: {
            type: 'object',
            description: 'Query criteria: type, level, contains, hasMarks (for list_blocks, resolve_targets).',
          },
          limit: { type: 'number', description: 'Max results (for get_ast, list_blocks).' },
          offset: { type: 'number', description: 'Skip count (for get_ast).' },
          afterCursor: { type: 'string', description: 'Node ID for cursor pagination.' },
          maxResults: { type: 'number', description: 'Max candidates (for resolve_targets).' },
          heading: {
            description: 'Heading text (string) or {level, index} (for get_section).',
          },
          includeNested: { type: 'boolean', description: 'Include subsections (for get_section).' },
          baseRevision: { type: 'string', description: 'Document revision (for update/insert/move_section).' },
          target: {
            type: 'object',
            description: 'Section target: heading, byIndex, or sectionId (for update_section).',
          },
          newContent: { type: 'string', description: 'New section body (for update_section).' },
          after: {
            type: 'object',
            description: 'Insert/move after this section target (for insert/move_section).',
          },
          sectionHeading: {
            type: 'object',
            properties: {
              level: { type: 'number', description: 'Heading level (1-6)' },
              text: { type: 'string', description: 'Heading text' },
            },
            description: 'New section heading (for insert_section).',
          },
          content: { type: 'string', description: 'Section body content (for insert_section).' },
          section: {
            type: 'object',
            description: 'Section to move (for move_section).',
          },
          mode: {
            type: 'string',
            enum: ['apply', 'suggest', 'dryRun'],
            description: 'Only "dryRun" has effect (preview without applying). "apply"/"suggest" accepted but ignored — controlled by user setting.',
          },
          windowId: { type: 'string', description: 'Optional window identifier.' },
        },
      },
    },
    async (args) => {
      const action = args.action as string;
      const windowId = getWindowIdArg(args);

      switch (action) {
        case 'get_ast':
          return handleGetAst(server, windowId, args);
        case 'get_digest':
          return handleGetDigest(server, windowId);
        case 'list_blocks':
          return handleListBlocks(server, windowId, args);
        case 'resolve_targets':
          return handleResolveTargets(server, windowId, args);
        case 'get_section':
          return handleGetSection(server, windowId, args);
        case 'update_section':
          return handleUpdateSection(server, windowId, args);
        case 'insert_section':
          return handleInsertSection(server, windowId, args);
        case 'move_section':
          return handleMoveSection(server, windowId, args);
        default:
          return VMarkMcpServer.errorResult(`Unknown structure action: ${action}`);
      }
    }
  );
}

// --- AST & Query ---

async function handleGetAst(
  server: VMarkMcpServer, windowId: string, args: Record<string, unknown>
) {
  const projection = args.projection as AstProjection[] | undefined;
  const filter = args.filter as BlockQuery | undefined;
  const limit = getNumberArg(args, 'limit');
  const offset = getNumberArg(args, 'offset');
  const afterCursor = getStringArg(args, 'afterCursor');

  try {
    const result = await server.sendBridgeRequest<AstResponse>({
      type: 'structure.getAst',
      projection,
      filter,
      limit,
      offset,
      afterCursor,
      windowId,
    });
    return VMarkMcpServer.successResult(JSON.stringify(result, null, 2));
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to get AST: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleGetDigest(server: VMarkMcpServer, windowId: string) {
  try {
    const result = await server.sendBridgeRequest<DocumentDigest>({
      type: 'structure.getDigest',
      windowId,
    });
    return VMarkMcpServer.successResult(JSON.stringify(result, null, 2));
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to get digest: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleListBlocks(
  server: VMarkMcpServer, windowId: string, args: Record<string, unknown>
) {
  const query = args.query as BlockQuery | undefined;
  const limit = getNumberArg(args, 'limit');
  const afterCursor = getStringArg(args, 'afterCursor');
  const projection = args.projection as string[] | undefined;

  try {
    const result = await server.sendBridgeRequest<{
      revision: string;
      blocks: BlockInfo[];
      hasMore: boolean;
      nextCursor?: string;
    }>({
      type: 'structure.listBlocks',
      query,
      limit,
      afterCursor,
      projection,
      windowId,
    });
    return VMarkMcpServer.successResult(JSON.stringify(result, null, 2));
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to list blocks: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleResolveTargets(
  server: VMarkMcpServer, windowId: string, args: Record<string, unknown>
) {
  const query = args.query as BlockQuery;
  const maxResults = getNumberArg(args, 'maxResults');

  if (!query) {
    return VMarkMcpServer.errorResult('query is required for resolve_targets');
  }

  try {
    const result = await server.sendBridgeRequest<TargetResolution>({
      type: 'structure.resolveTargets',
      query,
      maxResults,
      windowId,
    });
    return VMarkMcpServer.successResult(JSON.stringify(result, null, 2));
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to resolve targets: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleGetSection(
  server: VMarkMcpServer, windowId: string, args: Record<string, unknown>
) {
  const heading = args.heading as string | { level: number; index: number };
  const includeNested = args.includeNested as boolean | undefined;

  if (!heading) {
    return VMarkMcpServer.errorResult('heading is required for get_section');
  }
  if (typeof heading === 'object') {
    if (typeof heading.level !== 'number' || typeof heading.index !== 'number') {
      return VMarkMcpServer.errorResult('heading object must have numeric level and index');
    }
    if (heading.level < 1 || heading.level > 6) {
      return VMarkMcpServer.errorResult('heading.level must be between 1 and 6');
    }
    const indexErr = validateNonNegativeInteger(heading.index, 'heading.index');
    if (indexErr) return VMarkMcpServer.errorResult(indexErr);
  } else if (typeof heading !== 'string') {
    return VMarkMcpServer.errorResult('heading must be a string or { level, index } object');
  }

  try {
    const result = await server.sendBridgeRequest<SectionInfo>({
      type: 'structure.getSection',
      heading,
      includeNested,
      windowId,
    });
    return VMarkMcpServer.successResult(JSON.stringify(result, null, 2));
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to get section: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// --- Section Operations ---

async function handleUpdateSection(
  server: VMarkMcpServer, windowId: string, args: Record<string, unknown>
) {
  const baseRevision = requireStringArg(args, 'baseRevision');
  const target = args.target as SectionTarget;
  const newContent = requireStringArgAllowEmpty(args, 'newContent');
  const mode = (args.mode as OperationMode) ?? 'apply';

  if (!target || (!target.heading && !target.byIndex && !target.sectionId)) {
    return VMarkMcpServer.errorResult('target must specify heading, byIndex, or sectionId');
  }
  if (target.byIndex) {
    const err = validateByIndex(target.byIndex, 'byIndex');
    if (err) return VMarkMcpServer.errorResult(err);
  }

  try {
    const request: BridgeRequest = {
      type: 'section.update',
      baseRevision,
      target,
      newContent,
      mode,
      windowId,
    };
    const result = await server.sendBridgeRequest<BatchEditResult>(request);
    return VMarkMcpServer.successResult(JSON.stringify(result, null, 2));
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to update section: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleInsertSection(
  server: VMarkMcpServer, windowId: string, args: Record<string, unknown>
) {
  const baseRevision = requireStringArg(args, 'baseRevision');
  const after = args.after as SectionTarget | undefined;
  const heading = args.sectionHeading as NewHeading;
  const content = getStringArg(args, 'content') ?? '';
  const mode = (args.mode as OperationMode) ?? 'apply';

  if (!heading || !heading.level || !heading.text) {
    return VMarkMcpServer.errorResult('sectionHeading must include level and text');
  }
  if (heading.level < 1 || heading.level > 6) {
    return VMarkMcpServer.errorResult('sectionHeading.level must be between 1 and 6');
  }
  if (after?.byIndex) {
    const err = validateByIndex(after.byIndex, 'after.byIndex');
    if (err) return VMarkMcpServer.errorResult(err);
  }

  try {
    const request: BridgeRequest = {
      type: 'section.insert',
      baseRevision,
      after,
      heading,
      content,
      mode,
      windowId,
    };
    const result = await server.sendBridgeRequest<BatchEditResult>(request);
    return VMarkMcpServer.successResult(JSON.stringify(result, null, 2));
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to insert section: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleMoveSection(
  server: VMarkMcpServer, windowId: string, args: Record<string, unknown>
) {
  const baseRevision = requireStringArg(args, 'baseRevision');
  const section = args.section as SectionTarget;
  const after = args.after as SectionTarget | undefined;
  const mode = (args.mode as OperationMode) ?? 'apply';

  if (!section || (!section.heading && !section.byIndex && !section.sectionId)) {
    return VMarkMcpServer.errorResult('section must specify heading, byIndex, or sectionId');
  }
  if (section.byIndex) {
    const err = validateByIndex(section.byIndex, 'section.byIndex');
    if (err) return VMarkMcpServer.errorResult(err);
  }
  if (after?.byIndex) {
    const err = validateByIndex(after.byIndex, 'after.byIndex');
    if (err) return VMarkMcpServer.errorResult(err);
  }

  try {
    const request: BridgeRequest = {
      type: 'section.move',
      baseRevision,
      section,
      after,
      mode,
      windowId,
    };
    const result = await server.sendBridgeRequest<BatchEditResult>(request);
    return VMarkMcpServer.successResult(JSON.stringify(result, null, 2));
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to move section: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
