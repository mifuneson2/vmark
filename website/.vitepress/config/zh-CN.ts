

export const zhCN = {
  label: "简体中文",
  lang: "zh-CN",
  themeConfig: {
    nav: [
      { text: "首页", link: "/zh-CN/" },
      { text: "下载", link: "/zh-CN/download" },
      { text: "指南", link: "/zh-CN/guide/" },
    ],

    sidebar: {
      "/zh-CN/guide/": [
        {
          text: "指南",
          items: [
            { text: "快速上手", link: "/zh-CN/guide/" },
            { text: "功能特性", link: "/zh-CN/guide/features" },
            { text: "导出与打印", link: "/zh-CN/guide/export" },
            { text: "键盘快捷键", link: "/zh-CN/guide/shortcuts" },
            {
              text: "智能标签页导航",
              link: "/zh-CN/guide/tab-navigation",
            },
            {
              text: "多光标编辑",
              link: "/zh-CN/guide/multi-cursor",
            },
            { text: "内联弹窗", link: "/zh-CN/guide/popups" },
            {
              text: "Mermaid 图表",
              link: "/zh-CN/guide/mermaid",
            },
            {
              text: "Markmap 思维导图",
              link: "/zh-CN/guide/markmap",
            },
            { text: "SVG 图形", link: "/zh-CN/guide/svg" },
            {
              text: "媒体（视频/音频）",
              link: "/zh-CN/guide/media-support",
            },
            {
              text: "集成终端",
              link: "/zh-CN/guide/terminal",
            },
            {
              text: "工作区管理",
              link: "/zh-CN/guide/workspace-management",
            },
            {
              text: "中日韩排版",
              link: "/zh-CN/guide/cjk-formatting",
            },
            { text: "设置", link: "/zh-CN/guide/settings" },
            { text: "隐私政策", link: "/zh-CN/guide/privacy" },
            { text: "许可证", link: "/zh-CN/guide/license" },
          ],
        },
        {
          text: "AI 集成",
          items: [
            { text: "AI 精灵", link: "/zh-CN/guide/ai-genies" },
            {
              text: "AI 服务商",
              link: "/zh-CN/guide/ai-providers",
            },
            { text: "MCP 设置", link: "/zh-CN/guide/mcp-setup" },
            {
              text: "MCP 工具参考",
              link: "/zh-CN/guide/mcp-tools",
            },
            {
              text: "用户即开发者",
              link: "/zh-CN/guide/users-as-developers/",
              items: [
                {
                  text: "我为什么开发 VMark",
                  link: "/zh-CN/guide/users-as-developers/why-i-built-vmark",
                },
                {
                  text: "AI 无法替代的五项技能",
                  link: "/zh-CN/guide/users-as-developers/what-are-indispensable",
                },
                {
                  text: "为什么贵的模型反而更便宜",
                  link: "/zh-CN/guide/users-as-developers/why-expensive-models-are-cheaper",
                },
                {
                  text: "订阅 vs API 定价",
                  link: "/zh-CN/guide/users-as-developers/subscription-vs-api",
                },
                {
                  text: "英文提示词效果更好",
                  link: "/zh-CN/guide/users-as-developers/prompt-refinement",
                },
                {
                  text: "跨模型验证",
                  link: "/zh-CN/guide/users-as-developers/cross-model-verification",
                },
                {
                  text: "为什么提 Issue 而非 PR",
                  link: "/zh-CN/guide/users-as-developers/why-issues-not-prs",
                },
              ],
            },
          ],
        },
      ],
    },

    footer: {
      copyright:
        'Copyright © 2026 VMark · <a href="/zh-CN/guide/license">ISC 许可证</a>',
    },

    lastUpdated: {
      text: "更新于",
      formatOptions: {
        dateStyle: "medium" as const,
        timeStyle: "short" as const,
      },
    },

    outline: {
      label: "本页目录",
    },

    docFooter: {
      prev: "上一页",
      next: "下一页",
    },

    sidebarMenuLabel: "菜单",
    returnToTopLabel: "返回顶部",

    search: {
      provider: "local" as const,
      options: {
        locales: {
          "zh-CN": {
            translations: {
              button: {
                buttonText: "搜索文档",
                buttonAriaLabel: "搜索文档",
              },
              modal: {
                noResultsText: "未找到相关结果",
                resetButtonTitle: "清除查询",
                displayDetails: "显示详情",
                footer: {
                  selectText: "选择",
                  navigateText: "导航",
                  closeText: "关闭",
                },
              },
            },
          },
        },
      },
    },
  },
};
