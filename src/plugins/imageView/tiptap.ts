import Image from "@tiptap/extension-image";
import { ImageNodeView } from "./index";

export const imageViewExtension = Image.extend({
  addNodeView() {
    return ({ node, getPos, editor }) => {
      return new ImageNodeView(node, getPos, editor);
    };
  },
}).configure({ inline: true });
