/**
 * Prompt History Dropdown
 *
 * Searchable popup that appears above the freeform textarea (Ctrl+R).
 * Shows filtered history entries for quick selection.
 */

import { useEffect, useRef } from "react";

interface PromptHistoryDropdownProps {
  entries: string[];
  selectedIndex: number;
  onSelect(index: number): void;
  onClose(): void;
}

export function PromptHistoryDropdown({
  entries,
  selectedIndex,
  onSelect,
  onClose,
}: PromptHistoryDropdownProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.querySelector(
      `[data-dropdown-index="${selectedIndex}"]`
    );
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Close on outside clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  if (entries.length === 0) {
    return (
      <div className="prompt-history-dropdown">
        <div className="prompt-history-dropdown-empty">No history</div>
      </div>
    );
  }

  return (
    <div className="prompt-history-dropdown" ref={listRef}>
      <div className="prompt-history-dropdown-header">
        Prompt History
        <span className="prompt-history-dropdown-hint">
          <kbd className="genie-picker-kbd">Ctrl+R</kbd>
        </span>
      </div>
      <div className="prompt-history-dropdown-list">
        {entries.map((entry, index) => {
          const firstLine = entry.split("\n")[0];
          return (
            <div
              key={index}
              data-dropdown-index={index}
              className={`prompt-history-dropdown-item${
                index === selectedIndex
                  ? " prompt-history-dropdown-item--selected"
                  : ""
              }`}
              onClick={() => onSelect(index)}
            >
              <span className="prompt-history-dropdown-text">{firstLine}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
