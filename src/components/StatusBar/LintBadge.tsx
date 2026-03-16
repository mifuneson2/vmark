/**
 * LintBadge
 *
 * Purpose: Status bar badge showing the markdown lint diagnostic count for
 * the active tab. Shows nothing when there are no issues. Clicking navigates
 * to the next diagnostic (wraps around).
 *
 * Key decisions:
 *   - Returns null when count is 0 to keep status bar uncluttered.
 *   - Shows red when any errors exist; amber when warnings only.
 *   - Reads activeTabId from useTabStore + windowLabel from context.
 *
 * @coordinates-with lintStore.ts — reads diagnostics, calls selectNext
 * @coordinates-with lint.css — badge styles
 * @module components/StatusBar/LintBadge
 */

import { useTranslation } from "react-i18next";
import { useWindowLabel } from "@/contexts/WindowContext";
import { useTabStore } from "@/stores/tabStore";
import { useLintStore } from "@/stores/lintStore";
import "../../plugins/lint/lint.css";

/** Status bar badge for lint diagnostics. Returns null when there are no issues. */
export function LintBadge() {
  const { t } = useTranslation("statusbar");
  const windowLabel = useWindowLabel();
  const activeTabId = useTabStore(
    (state) => state.activeTabId[windowLabel] ?? null
  );

  const diagnostics = useLintStore((state) =>
    activeTabId ? (state.diagnosticsByTab[activeTabId] ?? []) : []
  );

  const count = diagnostics.length;

  if (count === 0 || !activeTabId) {
    return null;
  }

  const hasErrors = diagnostics.some((d) => d.severity === "error");
  const badgeClass = hasErrors ? "lint-badge lint-badge--error" : "lint-badge lint-badge--warning";

  const handleClick = () => {
    useLintStore.getState().selectNext(activeTabId);
  };

  return (
    <button
      className={badgeClass}
      onClick={handleClick}
      title={t("lint.badge.tooltip", { count })}
      aria-label={t("lint.badge.tooltip", { count })}
    >
      {hasErrors ? "⊗" : "⚠"} {count}
    </button>
  );
}
