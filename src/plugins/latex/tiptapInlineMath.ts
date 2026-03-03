import { Node } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { MathInlineNodeView } from "./MathInlineNodeView";
import "./latex.css";

/**
 * Inline math extension for Tiptap.
 *
 * Uses an atom approach: math content is stored as an attribute,
 * and the node displays rendered KaTeX output.
 * Supports inline editing with floating preview.
 */
export const mathInlineExtension = Node.create({
  name: "math_inline",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      content: {
        default: "",
        parseHTML: (element) => element.textContent || "",
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="math_inline"]' }];
  },

  renderHTML({ node }) {
    return ["span", { "data-type": "math_inline", class: "math-inline" }, node.attrs.content];
  },

  addNodeView() {
    /* v8 ignore start -- @preserve reason: addNodeView factory callback only runs in live Tiptap editor; not exercised in unit tests */
    return ({ node, view, getPos }) => new MathInlineNodeView(node as PMNode, view, getPos);
    /* v8 ignore stop */
  },
});
