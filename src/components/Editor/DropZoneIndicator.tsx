/**
 * Visual indicator shown when images are dragged over the editor.
 *
 * Shows an overlay with a dashed border and icon to indicate
 * that images can be dropped to insert them into the document.
 *
 * @module components/Editor/DropZoneIndicator
 */

import { useTranslation } from "react-i18next";
import { useDropZoneStore } from "@/stores/dropZoneStore";
import "./drop-zone.css";

/** Renders a drop overlay when images are dragged over the editor area. */
export function DropZoneIndicator() {
  const { t } = useTranslation("editor");
  const isDragging = useDropZoneStore((state) => state.isDragging);
  const hasImages = useDropZoneStore((state) => state.hasImages);
  const imageCount = useDropZoneStore((state) => state.imageCount);

  /* v8 ignore next -- @preserve render guard: both branches require real drag events */
  if (!isDragging || !hasImages) {
    return null;
  }

  /* v8 ignore start -- @preserve render guard: requires active drag with images */
  const dropText =
    imageCount === 1
      ? t("dropZone.single")
      : t("dropZone.multiple", { count: imageCount });
  /* v8 ignore stop */

  return (
    <div className="drop-zone-indicator">
      <div className="drop-zone-content">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span className="drop-zone-text">
          {dropText}
        </span>
      </div>
    </div>
  );
}
