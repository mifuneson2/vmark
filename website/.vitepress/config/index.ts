import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import { shared } from "./shared";
import { en } from "./en";

export default withMermaid(
  defineConfig({
    ...shared,
    locales: {
      root: en,
    },
  })
);
