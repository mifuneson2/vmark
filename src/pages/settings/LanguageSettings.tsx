/**
 * Language Settings Section
 *
 * UI language picker and CJK formatting configuration.
 */

import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { useSettingsStore, type QuoteStyle } from "@/stores/settingsStore";
import {
  useShortcutsStore,
  DEFAULT_SHORTCUTS,
  prosemirrorToTauri,
} from "@/stores/shortcutsStore";
import { SettingRow, Toggle, SettingsGroup, Select } from "./components";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "zh-CN", label: "简体中文" },
  { value: "zh-TW", label: "繁體中文" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
  { value: "pt-BR", label: "Português (Brasil)" },
] as const;

type LanguageValue = (typeof LANGUAGE_OPTIONS)[number]["value"];

export function LanguageSettings() {
  const { t } = useTranslation("settings");
  const language = useSettingsStore((s) => s.general.language) as LanguageValue;
  const updateGeneralSetting = useSettingsStore((s) => s.updateGeneralSetting);
  const cjkFormatting = useSettingsStore((state) => state.cjkFormatting);
  const updateCJKSetting = useSettingsStore((state) => state.updateCJKFormattingSetting);

  const handleLanguageChange = async (value: string) => {
    updateGeneralSetting("language", value);
    await i18n.changeLanguage(value);
    try {
      // Set the Rust-side locale so t!() returns translated strings
      await invoke("set_locale", { locale: value });
      // Rebuild the native menu with translated labels + current shortcut bindings
      const allShortcuts = useShortcutsStore.getState().getAllShortcuts();
      const menuShortcuts: Record<string, string> = {};
      for (const def of DEFAULT_SHORTCUTS) {
        if (def.menuId) {
          menuShortcuts[def.menuId] = prosemirrorToTauri(
            allShortcuts[def.id] ?? ""
          );
        }
      }
      await invoke("rebuild_menu", { shortcuts: menuShortcuts });
      // Rebuild resets the Genies submenu — re-populate it
      const geniesAccel = menuShortcuts["search-genies"]
        ? { "search-genies": menuShortcuts["search-genies"] }
        : null;
      await invoke("refresh_genies_menu", { shortcuts: geniesAccel });
    } catch (e) {
      console.warn("[i18n] Failed to set Rust locale:", e);
    }
  };

  const selectClass = `px-2 py-1 rounded border border-[var(--border-color)]
                       bg-[var(--bg-primary)] text-sm text-[var(--text-primary)]`;

  return (
    <div>
      {/* UI Language */}
      <SettingsGroup title={t("language.group.language")}>
        <SettingRow
          label={t("language.interfaceLanguage.label")}
          description={t("language.interfaceLanguage.description")}
        >
          <Select<LanguageValue>
            value={language}
            options={LANGUAGE_OPTIONS as unknown as { value: LanguageValue; label: string }[]}
            onChange={handleLanguageChange}
          />
        </SettingRow>
      </SettingsGroup>

      {/* CJK Formatting */}
      <SettingsGroup title={t("language.group.cjkFormatting")}>
        <p className="text-xs text-[var(--text-tertiary)] -mt-2 mb-3">
          {t("language.cjkFormatting.hint")}
        </p>
        {/* Fullwidth Normalization */}
        <SettingsGroup title={t("language.group.fullwidthNormalization")}>
          <SettingRow
            label={t("language.fullwidthAlphanumeric.label")}
            description={t("language.fullwidthAlphanumeric.description")}
          >
            <Toggle
              checked={cjkFormatting.fullwidthAlphanumeric}
              onChange={(v) => updateCJKSetting("fullwidthAlphanumeric", v)}
            />
          </SettingRow>
          <SettingRow
            label={t("language.fullwidthPunctuation.label")}
            description={t("language.fullwidthPunctuation.description")}
          >
            <Toggle
              checked={cjkFormatting.fullwidthPunctuation}
              onChange={(v) => updateCJKSetting("fullwidthPunctuation", v)}
            />
          </SettingRow>
          <SettingRow
            label={t("language.fullwidthParentheses.label")}
            description={t("language.fullwidthParentheses.description")}
          >
            <Toggle
              checked={cjkFormatting.fullwidthParentheses}
              onChange={(v) => updateCJKSetting("fullwidthParentheses", v)}
            />
          </SettingRow>
          <SettingRow
            label={t("language.fullwidthBrackets.label")}
            description={t("language.fullwidthBrackets.description")}
          >
            <Toggle
              checked={cjkFormatting.fullwidthBrackets}
              onChange={(v) => updateCJKSetting("fullwidthBrackets", v)}
            />
          </SettingRow>
        </SettingsGroup>

        {/* Spacing */}
        <SettingsGroup title={t("language.group.spacing")}>
          <SettingRow
            label={t("language.cjkEnglishSpacing.label")}
            description={t("language.cjkEnglishSpacing.description")}
          >
            <Toggle
              checked={cjkFormatting.cjkEnglishSpacing}
              onChange={(v) => updateCJKSetting("cjkEnglishSpacing", v)}
            />
          </SettingRow>
          <SettingRow
            label={t("language.cjkParenthesisSpacing.label")}
            description={t("language.cjkParenthesisSpacing.description")}
          >
            <Toggle
              checked={cjkFormatting.cjkParenthesisSpacing}
              onChange={(v) => updateCJKSetting("cjkParenthesisSpacing", v)}
            />
          </SettingRow>
          <SettingRow
            label={t("language.currencySpacing.label")}
            description={t("language.currencySpacing.description")}
          >
            <Toggle
              checked={cjkFormatting.currencySpacing}
              onChange={(v) => updateCJKSetting("currencySpacing", v)}
            />
          </SettingRow>
          <SettingRow
            label={t("language.slashSpacing.label")}
            description={t("language.slashSpacing.description")}
          >
            <Toggle
              checked={cjkFormatting.slashSpacing}
              onChange={(v) => updateCJKSetting("slashSpacing", v)}
            />
          </SettingRow>
          <SettingRow
            label={t("language.spaceCollapsing.label")}
            description={t("language.spaceCollapsing.description")}
          >
            <Toggle
              checked={cjkFormatting.spaceCollapsing}
              onChange={(v) => updateCJKSetting("spaceCollapsing", v)}
            />
          </SettingRow>
        </SettingsGroup>

        {/* Dash & Quotes */}
        <SettingsGroup title={t("language.group.dashQuotes")}>
          <SettingRow label={t("language.dashConversion.label")} description={t("language.dashConversion.description")}>
            <Toggle
              checked={cjkFormatting.dashConversion}
              onChange={(v) => updateCJKSetting("dashConversion", v)}
            />
          </SettingRow>
          <SettingRow
            label={t("language.emdashSpacing.label")}
            description={t("language.emdashSpacing.description")}
          >
            <Toggle
              checked={cjkFormatting.emdashSpacing}
              onChange={(v) => updateCJKSetting("emdashSpacing", v)}
            />
          </SettingRow>
          <SettingRow
            label={t("language.smartQuoteConversion.label")}
            description={t("language.smartQuoteConversion.description")}
          >
            <Toggle
              checked={cjkFormatting.smartQuoteConversion}
              onChange={(v) => updateCJKSetting("smartQuoteConversion", v)}
            />
          </SettingRow>
          <SettingRow
            label={t("language.quoteStyle.label")}
            description={t("language.quoteStyle.description")}
            disabled={!cjkFormatting.smartQuoteConversion}
          >
            <Select<QuoteStyle>
              value={cjkFormatting.quoteStyle}
              options={[
                { value: "curly", label: t("language.quoteStyle.curly") },
                { value: "corner", label: t("language.quoteStyle.corner") },
                { value: "guillemets", label: t("language.quoteStyle.guillemets") },
              ]}
              onChange={(v) => updateCJKSetting("quoteStyle", v)}
              disabled={!cjkFormatting.smartQuoteConversion}
            />
          </SettingRow>
          <SettingRow
            label={t("language.quoteSpacing.label")}
            description={t("language.quoteSpacing.description")}
          >
            <Toggle
              checked={cjkFormatting.quoteSpacing}
              onChange={(v) => updateCJKSetting("quoteSpacing", v)}
            />
          </SettingRow>
          <SettingRow
            label={t("language.singleQuoteSpacing.label")}
            description={t("language.singleQuoteSpacing.description")}
          >
            <Toggle
              checked={cjkFormatting.singleQuoteSpacing}
              onChange={(v) => updateCJKSetting("singleQuoteSpacing", v)}
            />
          </SettingRow>
          <SettingRow
            label={t("language.cjkCornerQuotes.label")}
            description={t("language.cjkCornerQuotes.description")}
            disabled={cjkFormatting.quoteStyle !== "curly"}
          >
            <Toggle
              checked={cjkFormatting.cjkCornerQuotes}
              onChange={(v) => updateCJKSetting("cjkCornerQuotes", v)}
              disabled={cjkFormatting.quoteStyle !== "curly"}
            />
          </SettingRow>
          <SettingRow
            label={t("language.cjkNestedQuotes.label")}
            description={t("language.cjkNestedQuotes.description")}
          >
            <Toggle
              checked={cjkFormatting.cjkNestedQuotes}
              onChange={(v) => updateCJKSetting("cjkNestedQuotes", v)}
            />
          </SettingRow>
        </SettingsGroup>

        {/* Cleanup */}
        <SettingsGroup title={t("language.group.cleanup")} className="">
          <SettingRow
            label={t("language.consecutivePunctuation.label")}
            description={t("language.consecutivePunctuation.description")}
          >
            <select
              value={cjkFormatting.consecutivePunctuationLimit}
              onChange={(e) =>
                updateCJKSetting(
                  "consecutivePunctuationLimit",
                  Number(e.target.value)
                )
              }
              className={selectClass}
            >
              <option value="0">{t("language.consecutivePunctuation.off")}</option>
              <option value="1">{t("language.consecutivePunctuation.single")}</option>
              <option value="2">{t("language.consecutivePunctuation.double")}</option>
            </select>
          </SettingRow>
          <SettingRow
            label={t("language.trailingSpaces.label")}
            description={t("language.trailingSpaces.description")}
          >
            <Toggle
              checked={cjkFormatting.trailingSpaceRemoval}
              onChange={(v) => updateCJKSetting("trailingSpaceRemoval", v)}
            />
          </SettingRow>
          <SettingRow label={t("language.ellipsisNormalization.label")} description={t("language.ellipsisNormalization.description")}>
            <Toggle
              checked={cjkFormatting.ellipsisNormalization}
              onChange={(v) => updateCJKSetting("ellipsisNormalization", v)}
            />
          </SettingRow>
          <SettingRow label={t("language.newlineCollapsing.label")} description={t("language.newlineCollapsing.description")}>
            <Toggle
              checked={cjkFormatting.newlineCollapsing}
              onChange={(v) => updateCJKSetting("newlineCollapsing", v)}
            />
          </SettingRow>
        </SettingsGroup>
      </SettingsGroup>
    </div>
  );
}
