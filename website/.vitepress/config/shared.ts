import footnote from "markdown-it-footnote";
import type { UserConfig } from "vitepress";

export const shared: UserConfig = {
  title: "VMark",
  description: "AI friendly markdown editor",
  lastUpdated: true,
  appearance: false, // We use our own theme switcher

  markdown: {
    config: (md: any) => {
      md.use(footnote);
    },
  },

  head: [
    [
      "link",
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
    ["meta", { name: "theme-color", content: "#4a6fa5" }],
    ["meta", { name: "mobile-web-app-capable", content: "yes" }],
    [
      "meta",
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
    ],
  ],

  mermaid: {
    htmlLabels: false,
    flowchart: { htmlLabels: false },
  },
};
