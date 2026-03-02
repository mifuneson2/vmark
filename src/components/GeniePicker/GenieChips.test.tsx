/**
 * GenieChips — Tests
 *
 * Covers:
 * - Rendering chips for available quick actions (polish, condense, grammar, rephrase)
 * - Only showing chips for genies that exist in the genies list
 * - Click handler calls onSelect with the matched genie
 * - Returns null when no quick actions match
 * - Partial matches (some quick actions available, some not)
 * - Edge cases: empty genies, duplicate names, order preservation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GenieChips } from "./GenieChips";
import type { GenieDefinition } from "@/types/aiGenies";

// ============================================================================
// Helpers
// ============================================================================

function makeGenie(name: string, overrides: Partial<GenieDefinition["metadata"]> = {}): GenieDefinition {
  return {
    metadata: {
      name,
      description: `${name} description`,
      scope: "selection",
      category: "Writing",
      ...overrides,
    },
    template: `{{content}}`,
    filePath: `/genies/${name}.md`,
    source: "global",
  };
}

// The four quick actions expected by GenieChips
const ALL_QUICK_ACTION_GENIES: GenieDefinition[] = [
  makeGenie("polish"),
  makeGenie("condense"),
  makeGenie("fix-grammar"),
  makeGenie("rephrase"),
];

// ============================================================================
// Tests
// ============================================================================

describe("GenieChips", () => {
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Rendering
  // --------------------------------------------------------------------------

  describe("rendering", () => {
    it("renders all four chips when all quick action genies exist", () => {
      render(<GenieChips genies={ALL_QUICK_ACTION_GENIES} onSelect={onSelect} />);

      expect(screen.getByRole("button", { name: "Polish" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Condense" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Grammar" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Rephrase" })).toBeInTheDocument();
    });

    it("renders only chips for genies that exist", () => {
      const genies = [makeGenie("polish"), makeGenie("rephrase")];
      render(<GenieChips genies={genies} onSelect={onSelect} />);

      expect(screen.getByRole("button", { name: "Polish" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Rephrase" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Condense" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Grammar" })).toBeNull();
    });

    it("renders chips as buttons with type=button", () => {
      render(<GenieChips genies={ALL_QUICK_ACTION_GENIES} onSelect={onSelect} />);

      const buttons = screen.getAllByRole("button");
      for (const btn of buttons) {
        expect(btn.getAttribute("type")).toBe("button");
      }
    });

    it("chips have genie-chip class", () => {
      const { container } = render(
        <GenieChips genies={ALL_QUICK_ACTION_GENIES} onSelect={onSelect} />
      );

      const chips = container.querySelectorAll(".genie-chip");
      expect(chips).toHaveLength(4);
    });

    it("wraps chips in a genie-chips container", () => {
      const { container } = render(
        <GenieChips genies={ALL_QUICK_ACTION_GENIES} onSelect={onSelect} />
      );

      expect(container.querySelector(".genie-chips")).not.toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Empty / null return
  // --------------------------------------------------------------------------

  describe("empty state", () => {
    it("returns null when genies array is empty", () => {
      const { container } = render(<GenieChips genies={[]} onSelect={onSelect} />);

      expect(container.innerHTML).toBe("");
    });

    it("returns null when no genies match quick actions", () => {
      const genies = [makeGenie("translate"), makeGenie("summarize")];
      const { container } = render(<GenieChips genies={genies} onSelect={onSelect} />);

      expect(container.innerHTML).toBe("");
    });
  });

  // --------------------------------------------------------------------------
  // Click handling
  // --------------------------------------------------------------------------

  describe("click handling", () => {
    it("calls onSelect with the correct genie when Polish is clicked", async () => {
      const user = userEvent.setup();
      const polishGenie = makeGenie("polish");
      render(<GenieChips genies={[polishGenie]} onSelect={onSelect} />);

      await user.click(screen.getByRole("button", { name: "Polish" }));

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(polishGenie);
    });

    it("calls onSelect with the correct genie when Grammar is clicked", async () => {
      const user = userEvent.setup();
      const grammarGenie = makeGenie("fix-grammar");
      render(<GenieChips genies={[grammarGenie]} onSelect={onSelect} />);

      await user.click(screen.getByRole("button", { name: "Grammar" }));

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(grammarGenie);
    });

    it("calls onSelect with the specific genie from the list (not a different one)", async () => {
      const user = userEvent.setup();
      render(<GenieChips genies={ALL_QUICK_ACTION_GENIES} onSelect={onSelect} />);

      await user.click(screen.getByRole("button", { name: "Condense" }));

      const selectedGenie = onSelect.mock.calls[0][0] as GenieDefinition;
      expect(selectedGenie.metadata.name).toBe("condense");
    });
  });

  // --------------------------------------------------------------------------
  // Edge cases
  // --------------------------------------------------------------------------

  describe("edge cases", () => {
    it("handles genies list with extra non-matching genies", () => {
      const genies = [
        makeGenie("translate"),
        makeGenie("polish"),
        makeGenie("summarize"),
        makeGenie("condense"),
        makeGenie("expand"),
      ];
      render(<GenieChips genies={genies} onSelect={onSelect} />);

      expect(screen.getByRole("button", { name: "Polish" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Condense" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Translate" })).toBeNull();
    });

    it("preserves chip order regardless of genies list order", () => {
      // Genies in reverse order of quick actions
      const genies = [
        makeGenie("rephrase"),
        makeGenie("fix-grammar"),
        makeGenie("condense"),
        makeGenie("polish"),
      ];
      const { container } = render(<GenieChips genies={genies} onSelect={onSelect} />);

      const buttons = container.querySelectorAll(".genie-chip");
      expect(buttons[0]?.textContent).toBe("Polish");
      expect(buttons[1]?.textContent).toBe("Condense");
      expect(buttons[2]?.textContent).toBe("Grammar");
      expect(buttons[3]?.textContent).toBe("Rephrase");
    });

    it("handles single matching genie", () => {
      render(<GenieChips genies={[makeGenie("condense")]} onSelect={onSelect} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1);
      expect(buttons[0]?.textContent).toBe("Condense");
    });

    it("handles genies with similar but non-matching names", () => {
      const genies = [
        makeGenie("polish-text"),  // Not "polish"
        makeGenie("grammar-fix"),  // Not "fix-grammar"
      ];
      const { container } = render(<GenieChips genies={genies} onSelect={onSelect} />);

      expect(container.innerHTML).toBe("");
    });
  });
});
