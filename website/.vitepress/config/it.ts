

export const it = {
  label: "Italiano",
  lang: "it",
  themeConfig: {
    nav: [
      { text: "Home", link: "/it/" },
      { text: "Scarica", link: "/it/download" },
      { text: "Guida", link: "/it/guide/" },
    ],

    sidebar: {
      "/it/guide/": [
        {
          text: "Guida",
          items: [
            { text: "Per iniziare", link: "/it/guide/" },
            { text: "Funzionalità", link: "/it/guide/features" },
            {
              text: "Esportazione e stampa",
              link: "/it/guide/export",
            },
            {
              text: "Scorciatoie da tastiera",
              link: "/it/guide/shortcuts",
            },
            {
              text: "Navigazione intelligente tra schede",
              link: "/it/guide/tab-navigation",
            },
            {
              text: "Modifica multicursore",
              link: "/it/guide/multi-cursor",
            },
            {
              text: "Popup in linea",
              link: "/it/guide/popups",
            },
            {
              text: "Diagrammi Mermaid",
              link: "/it/guide/mermaid",
            },
            {
              text: "Mappe mentali Markmap",
              link: "/it/guide/markmap",
            },
            { text: "Grafica SVG", link: "/it/guide/svg" },
            {
              text: "Media (video/audio)",
              link: "/it/guide/media-support",
            },
            {
              text: "Terminale integrato",
              link: "/it/guide/terminal",
            },
            {
              text: "Gestione workspace",
              link: "/it/guide/workspace-management",
            },
            {
              text: "Formattazione CJK",
              link: "/it/guide/cjk-formatting",
            },
            { text: "Impostazioni", link: "/it/guide/settings" },
            { text: "Privacy", link: "/it/guide/privacy" },
            { text: "Licenza", link: "/it/guide/license" },
          ],
        },
        {
          text: "Integrazione IA",
          items: [
            { text: "AI Genies", link: "/it/guide/ai-genies" },
            {
              text: "Provider di IA",
              link: "/it/guide/ai-providers",
            },
            {
              text: "Configurazione MCP",
              link: "/it/guide/mcp-setup",
            },
            {
              text: "Riferimento strumenti MCP",
              link: "/it/guide/mcp-tools",
            },
            {
              text: "Utenti come sviluppatori",
              link: "/it/guide/users-as-developers/",
              items: [
                {
                  text: "Perché ho creato VMark",
                  link: "/it/guide/users-as-developers/why-i-built-vmark",
                },
                {
                  text: "Cinque competenze che l'IA non può sostituire",
                  link: "/it/guide/users-as-developers/what-are-indispensable",
                },
                {
                  text: "Perché i modelli costosi sono più economici",
                  link: "/it/guide/users-as-developers/why-expensive-models-are-cheaper",
                },
                {
                  text: "Abbonamento vs prezzi API",
                  link: "/it/guide/users-as-developers/subscription-vs-api",
                },
                {
                  text: "I prompt in inglese funzionano meglio",
                  link: "/it/guide/users-as-developers/prompt-refinement",
                },
                {
                  text: "Verifica incrociata tra modelli",
                  link: "/it/guide/users-as-developers/cross-model-verification",
                },
                {
                  text: "Perché Issue e non PR",
                  link: "/it/guide/users-as-developers/why-issues-not-prs",
                },
              ],
            },
          ],
        },
      ],
    },

    footer: {
      copyright:
        'Copyright © 2026 VMark · <a href="/it/guide/license">Licenza ISC</a>',
    },

    lastUpdated: {
      text: "Aggiornato il",
      formatOptions: {
        dateStyle: "medium" as const,
        timeStyle: "short" as const,
      },
    },

    outline: {
      label: "In questa pagina",
    },

    docFooter: {
      prev: "Precedente",
      next: "Successivo",
    },

    sidebarMenuLabel: "Menu",
    returnToTopLabel: "Torna in cima",

    search: {
      provider: "local" as const,
      options: {
        locales: {
          it: {
            translations: {
              button: {
                buttonText: "Cerca",
                buttonAriaLabel: "Cerca nella documentazione",
              },
              modal: {
                noResultsText: "Nessun risultato trovato",
                resetButtonTitle: "Reimposta ricerca",
                displayDetails: "Mostra dettagli",
                footer: {
                  selectText: "Seleziona",
                  navigateText: "Naviga",
                  closeText: "Chiudi",
                },
              },
            },
          },
        },
      },
    },
  },
};
