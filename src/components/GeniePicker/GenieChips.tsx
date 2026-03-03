/**
 * Quick Action Chips
 *
 * Pre-built action buttons shown when picker is opened with filterScope: "selection".
 */

import type { GenieDefinition } from "@/types/aiGenies";

const QUICK_ACTIONS = [
  { label: "Polish", genieName: "polish" },
  { label: "Condense", genieName: "condense" },
  { label: "Grammar", genieName: "fix-grammar" },
  { label: "Rephrase", genieName: "rephrase" },
];

interface GenieChipsProps {
  genies: GenieDefinition[];
  onSelect: (genie: GenieDefinition) => void;
}

export function GenieChips({ genies, onSelect }: GenieChipsProps) {
  const available = QUICK_ACTIONS.filter((action) =>
    genies.some((g) => g.metadata.name === action.genieName)
  );

  if (available.length === 0) return null;

  return (
    <div className="genie-chips">
      {available.map((action) => {
        const genie = genies.find(
          (g) => g.metadata.name === action.genieName
        );
        /* v8 ignore next -- @preserve defensive guard: available was pre-filtered so genie always exists */
        if (!genie) return null;
        return (
          <button
            key={action.genieName}
            className="genie-chip"
            onClick={() => onSelect(genie)}
            type="button"
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
