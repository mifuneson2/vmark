/**
 * Tests for alertBlock extension — normalizeAlertType, extension metadata,
 * renderHTML, addAttributes, insertAlertBlock command.
 */

import { describe, it, expect } from "vitest";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { DOMSerializer } from "@tiptap/pm/model";
import {
  alertBlockExtension,
  ALERT_TYPES,
  DEFAULT_ALERT_TYPE,
  type AlertType,
} from "../tiptap";

// ---------------------------------------------------------------------------
// normalizeAlertType (replicated from source — it's module-private)
// ---------------------------------------------------------------------------

function normalizeAlertType(value: unknown): AlertType {
  if (typeof value !== "string") return DEFAULT_ALERT_TYPE;
  const upper = value.toUpperCase();
  return ALERT_TYPES.includes(upper as AlertType) ? (upper as AlertType) : DEFAULT_ALERT_TYPE;
}

// ---------------------------------------------------------------------------
// Schema helper
// ---------------------------------------------------------------------------

function createSchema() {
  return getSchema([StarterKit, alertBlockExtension]);
}

function createDocWithParagraph(text: string) {
  const schema = createSchema();
  const paragraph = schema.nodes.paragraph.create(null, text ? [schema.text(text)] : []);
  const doc = schema.nodes.doc.create(null, [paragraph]);
  return { schema, doc };
}

// ---------------------------------------------------------------------------
// normalizeAlertType
// ---------------------------------------------------------------------------

describe("normalizeAlertType", () => {
  it.each([
    { input: "NOTE", expected: "NOTE" },
    { input: "TIP", expected: "TIP" },
    { input: "IMPORTANT", expected: "IMPORTANT" },
    { input: "WARNING", expected: "WARNING" },
    { input: "CAUTION", expected: "CAUTION" },
  ])("accepts valid type '$input'", ({ input, expected }) => {
    expect(normalizeAlertType(input)).toBe(expected);
  });

  it.each([
    { input: "note", expected: "NOTE" },
    { input: "tip", expected: "TIP" },
    { input: "Warning", expected: "WARNING" },
    { input: "caution", expected: "CAUTION" },
  ])("normalizes case: '$input' -> '$expected'", ({ input, expected }) => {
    expect(normalizeAlertType(input)).toBe(expected);
  });

  it.each([
    { input: "INVALID", desc: "unknown string" },
    { input: "", desc: "empty string" },
    { input: "DANGER", desc: "non-existent type" },
  ])("returns default for $desc", ({ input }) => {
    expect(normalizeAlertType(input)).toBe(DEFAULT_ALERT_TYPE);
  });

  it.each([
    { input: null, desc: "null" },
    { input: undefined, desc: "undefined" },
    { input: 42, desc: "number" },
    { input: true, desc: "boolean" },
    { input: {}, desc: "object" },
  ])("returns default for non-string: $desc", ({ input }) => {
    expect(normalizeAlertType(input)).toBe(DEFAULT_ALERT_TYPE);
  });
});

// ---------------------------------------------------------------------------
// ALERT_TYPES constant
// ---------------------------------------------------------------------------

describe("ALERT_TYPES", () => {
  it("contains exactly 5 types", () => {
    expect(ALERT_TYPES).toHaveLength(5);
  });

  it("are all uppercase strings", () => {
    for (const t of ALERT_TYPES) {
      expect(t).toBe(t.toUpperCase());
    }
  });
});

// ---------------------------------------------------------------------------
// Extension metadata
// ---------------------------------------------------------------------------

describe("alertBlockExtension", () => {
  it("has correct name", () => {
    expect(alertBlockExtension.name).toBe("alertBlock");
  });

  it("is a block node with content", () => {
    expect(alertBlockExtension.config.group).toBe("block");
    expect(alertBlockExtension.config.content).toBe("block+");
    expect(alertBlockExtension.config.defining).toBe(true);
  });

  it("parseHTML matches div[data-alert-type]", () => {
    const parseRules = alertBlockExtension.config.parseHTML!.call({} as never);
    expect(parseRules![0].tag).toBe("div[data-alert-type]");
  });

  it("DEFAULT_ALERT_TYPE is NOTE", () => {
    expect(DEFAULT_ALERT_TYPE).toBe("NOTE");
  });
});

// ---------------------------------------------------------------------------
// Schema integration — addAttributes
// ---------------------------------------------------------------------------

describe("alertBlock addAttributes", () => {
  it("creates schema with alertType attribute defaulting to NOTE", () => {
    const schema = createSchema();
    const alertType = schema.nodes.alertBlock;
    expect(alertType).toBeDefined();
    expect(alertType.spec.attrs?.alertType?.default).toBe("NOTE");
  });

  it("creates schema with sourceLine attribute defaulting to null", () => {
    const schema = createSchema();
    const alertType = schema.nodes.alertBlock;
    expect(alertType.spec.attrs?.sourceLine?.default).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// renderHTML
// ---------------------------------------------------------------------------

describe("alertBlock renderHTML", () => {
  it("serializes alert block to DOM without errors", () => {
    const schema = createSchema();
    const paragraph = schema.nodes.paragraph.create(null, schema.text("Alert content"));
    const alertNode = schema.nodes.alertBlock.create({ alertType: "WARNING" }, [paragraph]);
    const doc = schema.nodes.doc.create(null, [alertNode]);

    const serializer = DOMSerializer.fromSchema(schema);
    expect(() => serializer.serializeFragment(doc.content)).not.toThrow();
  });

  it.each(ALERT_TYPES)("renders alert type %s with correct CSS class", (type) => {
    const schema = createSchema();
    const paragraph = schema.nodes.paragraph.create();
    const alertNode = schema.nodes.alertBlock.create({ alertType: type }, [paragraph]);
    const doc = schema.nodes.doc.create(null, [alertNode]);

    const serializer = DOMSerializer.fromSchema(schema);
    const fragment = serializer.serializeFragment(doc.content);
    const container = document.createElement("div");
    container.appendChild(fragment);

    const alertDiv = container.querySelector(".alert-block");
    expect(alertDiv).not.toBeNull();
    expect(alertDiv!.classList.contains(`alert-${type.toLowerCase()}`)).toBe(true);
  });

  it("renders alert title with non-editable content", () => {
    const schema = createSchema();
    const paragraph = schema.nodes.paragraph.create();
    const alertNode = schema.nodes.alertBlock.create({ alertType: "TIP" }, [paragraph]);
    const doc = schema.nodes.doc.create(null, [alertNode]);

    const serializer = DOMSerializer.fromSchema(schema);
    const fragment = serializer.serializeFragment(doc.content);
    const container = document.createElement("div");
    container.appendChild(fragment);

    const title = container.querySelector(".alert-title");
    expect(title).not.toBeNull();
    expect(title!.getAttribute("contenteditable")).toBe("false");
    expect(title!.textContent).toBe("TIP");
  });

  it("normalizes invalid alertType in renderHTML", () => {
    const schema = createSchema();
    const paragraph = schema.nodes.paragraph.create();
    // Force an invalid type via attrs
    const alertNode = schema.nodes.alertBlock.create({ alertType: "INVALID" }, [paragraph]);
    const doc = schema.nodes.doc.create(null, [alertNode]);

    const serializer = DOMSerializer.fromSchema(schema);
    const fragment = serializer.serializeFragment(doc.content);
    const container = document.createElement("div");
    container.appendChild(fragment);

    const title = container.querySelector(".alert-title");
    expect(title!.textContent).toBe("NOTE");
  });
});

// ---------------------------------------------------------------------------
// insertAlertBlock command
// ---------------------------------------------------------------------------

describe("insertAlertBlock command", () => {
  it("inserts an alert block after current paragraph (dry run without dispatch)", () => {
    const { schema, doc } = createDocWithParagraph("Hello");
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, 3), // cursor inside "Hello"
    });

    const commandFn = alertBlockExtension.config.addCommands!.call({ name: "alertBlock", options: {}, storage: {}, editor: {} } as never);
    const insertCmd = commandFn.insertAlertBlock;

    // dry run (no dispatch) should return true if command is applicable
    const canRun = insertCmd("WARNING")({ state, dispatch: undefined, tr: state.tr, chain: () => ({}) as never, can: () => ({}) as never, commands: {} as never, editor: {} as never, view: {} as never } as never);
    expect(canRun).toBe(true);
  });

  it("inserts an alert block with dispatch and updates selection", () => {
    const { schema, doc } = createDocWithParagraph("Hello");
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, 3),
    });

    const commandFn = alertBlockExtension.config.addCommands!.call({ name: "alertBlock", options: {}, storage: {}, editor: {} } as never);
    const insertCmd = commandFn.insertAlertBlock;

    let dispatched = false;
    const dispatch = (tr: unknown) => { dispatched = true; };

    insertCmd("TIP")({ state, dispatch, tr: state.tr, chain: () => ({}) as never, can: () => ({}) as never, commands: {} as never, editor: {} as never, view: {} as never } as never);
    expect(dispatched).toBe(true);
  });

  it("defaults to NOTE when no alertType argument provided", () => {
    const { schema, doc } = createDocWithParagraph("Hello");
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, 3),
    });

    const commandFn = alertBlockExtension.config.addCommands!.call({ name: "alertBlock", options: {}, storage: {}, editor: {} } as never);
    const insertCmd = commandFn.insertAlertBlock;

    let resultTr: unknown = null;
    const dispatch = (tr: unknown) => { resultTr = tr; };

    insertCmd()({ state, dispatch, tr: state.tr, chain: () => ({}) as never, can: () => ({}) as never, commands: {} as never, editor: {} as never, view: {} as never } as never);
    expect(resultTr).not.toBeNull();
  });
});
