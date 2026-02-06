/**
 * Prompt Item
 *
 * A single prompt entry in the PromptPicker list.
 */

import type { PromptDefinition } from "@/types/aiPrompts";

interface PromptItemProps {
  prompt: PromptDefinition;
  index: number;
  selected: boolean;
  onSelect: (prompt: PromptDefinition) => void;
  onHover: (index: number) => void;
}

export function PromptItem({
  prompt,
  index,
  selected,
  onSelect,
  onHover,
}: PromptItemProps) {
  return (
    <div
      className={`prompt-picker-item ${selected ? "prompt-picker-item--selected" : ""}`}
      data-index={index}
      onClick={() => onSelect(prompt)}
      onMouseEnter={() => onHover(index)}
    >
      <div className="prompt-picker-item-name">
        {formatName(prompt.metadata.name)}
      </div>
      <div className="prompt-picker-item-meta">
        {prompt.metadata.description && (
          <span className="prompt-picker-item-desc">
            {prompt.metadata.description}
          </span>
        )}
        <span className="prompt-picker-item-scope">
          {prompt.metadata.scope}
        </span>
      </div>
    </div>
  );
}

export function formatName(name: string): string {
  return name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
