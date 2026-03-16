import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import { shared } from "./shared";
import { en } from "./en";
import { zhCN } from "./zh-CN";
import { zhTW } from "./zh-TW";
import { ja } from "./ja";
import { ko } from "./ko";
import { es } from "./es";
import { fr } from "./fr";
import { de } from "./de";
import { it } from "./it";
import { ptBR } from "./pt-BR";

export default withMermaid(
  defineConfig({
    ...shared,
    locales: {
      root: en,
      "zh-CN": zhCN,
      "zh-TW": zhTW,
      ja: ja,
      ko: ko,
      es: es,
      fr: fr,
      de: de,
      it: it,
      "pt-BR": ptBR,
    },
  })
);
