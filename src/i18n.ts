/**
 * i18n initialization module.
 *
 * Purpose: Configures i18next with dynamic locale file loading via
 * import.meta.glob, namespace splitting (common/menu/statusbar/sidebar/settings/editor/ai/dialog),
 * and fallback chains for regional variants (zh-TW → zh-CN → en).
 *
 * Key decisions:
 *   - Uses i18next-resources-to-backend for lazy loading only the
 *     requested language+namespace combination.
 *   - load: "currentOnly" avoids loading both "zh" and "zh-CN" for
 *     regional codes — only the exact requested locale is fetched.
 *   - Language is seeded from settingsStore on startup; runtime changes
 *     are handled by calling i18n.changeLanguage() elsewhere.
 *   - Sets document.documentElement.lang on languageChanged event for
 *     correct assistive-technology announcements.
 *
 * @coordinates-with stores/settingsStore.ts — reads general.language at init
 * @module i18n
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { useSettingsStore } from "@/stores/settingsStore";

const localeModules = import.meta.glob("./locales/*/*.json");

i18n
  .use(initReactI18next)
  .use(
    resourcesToBackend((lng: string, ns: string) => {
      const key = `./locales/${lng}/${ns}.json`;
      const loader = localeModules[key];
      if (!loader) return Promise.reject(new Error(`Missing locale: ${key}`));
      return loader() as Promise<{ default: Record<string, string> }>;
    })
  )
  .init({
    lng: useSettingsStore.getState().general.language,
    fallbackLng: {
      "zh-TW": ["zh-CN", "en"],
      "pt-BR": ["en"],
      default: ["en"],
    },
    load: "currentOnly",
    ns: ["common", "menu", "statusbar", "sidebar", "settings", "ai", "editor", "dialog"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    // Make init synchronous so i18n.language is set before the first render.
    // Resources are still loaded lazily per namespace via the backend callback.
    initImmediate: false,
  });

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
