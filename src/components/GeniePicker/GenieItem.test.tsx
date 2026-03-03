/**
 * GenieItem — Tests
 *
 * Covers:
 * - Rendering genie name (formatted), description, scope
 * - Selected state styling
 * - Click handler calls onSelect with genie
 * - Mouse enter calls onHover with index
 * - formatName utility (hyphen-to-title-case)
 * - Edge cases: missing description, long names, special characters
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GenieItem, formatName } from "./GenieItem";
import type { GenieDefinition } from "@/types/aiGenies";

// ============================================================================
// Helpers
// ============================================================================

function makeGenie(overrides: Partial<GenieDefinition["metadata"]> = {}): GenieDefinition {
  return {
    metadata: {
      name: "fix-grammar",
      description: "Fix grammar and spelling",
      scope: "selection",
      category: "Writing",
      ...overrides,
    },
    template: "Fix the grammar: {{content}}",
    filePath: "/genies/fix-grammar.md",
    source: "global",
  };
}

// ============================================================================
// formatName unit tests
// ============================================================================

describe("formatName", () => {
  it("converts hyphenated name to title case", () => {
    expect(formatName("fix-grammar")).toBe("Fix Grammar");
  });

  it("handles single word", () => {
    expect(formatName("polish")).toBe("Polish");
  });

  it("handles multiple hyphens", () => {
    expect(formatName("fix-all-grammar-issues")).toBe("Fix All Grammar Issues");
  });

  it("handles empty string", () => {
    expect(formatName("")).toBe("");
  });

  it("handles already capitalized words", () => {
    expect(formatName("AI-assistant")).toBe("AI Assistant");
  });

  it("handles single character segments", () => {
    expect(formatName("a-b-c")).toBe("A B C");
  });
});

// ============================================================================
// GenieItem component tests
// ============================================================================

describe("GenieItem", () => {
  const onSelect = vi.fn();
  const onHover = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders formatted genie name", () => {
    const genie = makeGenie({ name: "fix-grammar" });
    render(
      <GenieItem genie={genie} index={0} selected={false} onSelect={onSelect} onHover={onHover} />
    );

    expect(screen.getByText("Fix Grammar")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    const genie = makeGenie({ description: "Fix grammar and spelling" });
    render(
      <GenieItem genie={genie} index={0} selected={false} onSelect={onSelect} onHover={onHover} />
    );

    expect(screen.getByText("Fix grammar and spelling")).toBeInTheDocument();
  });

  it("does not render description element when description is empty", () => {
    const genie = makeGenie({ description: "" });
    const { container } = render(
      <GenieItem genie={genie} index={0} selected={false} onSelect={onSelect} onHover={onHover} />
    );

    expect(container.querySelector(".genie-picker-item-desc")).toBeNull();
  });

  it("renders scope", () => {
    const genie = makeGenie({ scope: "document" });
    render(
      <GenieItem genie={genie} index={0} selected={false} onSelect={onSelect} onHover={onHover} />
    );

    expect(screen.getByText("document")).toBeInTheDocument();
  });

  it("applies selected class when selected is true", () => {
    const genie = makeGenie();
    const { container } = render(
      <GenieItem genie={genie} index={0} selected={true} onSelect={onSelect} onHover={onHover} />
    );

    const item = container.querySelector(".genie-picker-item");
    expect(item?.classList.contains("genie-picker-item--selected")).toBe(true);
  });

  it("does not apply selected class when selected is false", () => {
    const genie = makeGenie();
    const { container } = render(
      <GenieItem genie={genie} index={0} selected={false} onSelect={onSelect} onHover={onHover} />
    );

    const item = container.querySelector(".genie-picker-item");
    expect(item?.classList.contains("genie-picker-item--selected")).toBe(false);
  });

  it("sets data-index attribute", () => {
    const genie = makeGenie();
    const { container } = render(
      <GenieItem genie={genie} index={5} selected={false} onSelect={onSelect} onHover={onHover} />
    );

    const item = container.querySelector(".genie-picker-item");
    expect(item?.getAttribute("data-index")).toBe("5");
  });

  it("calls onSelect with genie on click", async () => {
    const user = userEvent.setup();
    const genie = makeGenie();
    const { container } = render(
      <GenieItem genie={genie} index={0} selected={false} onSelect={onSelect} onHover={onHover} />
    );

    const item = container.querySelector(".genie-picker-item") as HTMLElement;
    await user.click(item);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(genie);
  });

  it("calls onHover with index on mouse enter", () => {
    const genie = makeGenie();
    const { container } = render(
      <GenieItem genie={genie} index={3} selected={false} onSelect={onSelect} onHover={onHover} />
    );

    const item = container.querySelector(".genie-picker-item") as HTMLElement;
    fireEvent.mouseEnter(item);

    expect(onHover).toHaveBeenCalledTimes(1);
    expect(onHover).toHaveBeenCalledWith(3);
  });

  // --------------------------------------------------------------------------
  // Edge cases
  // --------------------------------------------------------------------------

  describe("edge cases", () => {
    it("handles genie with all scope types", () => {
      for (const scope of ["selection", "block", "document"] as const) {
        const genie = makeGenie({ scope });
        const { unmount } = render(
          <GenieItem genie={genie} index={0} selected={false} onSelect={onSelect} onHover={onHover} />
        );
        expect(screen.getByText(scope)).toBeInTheDocument();
        unmount();
      }
    });

    it("handles genie name with Unicode/CJK characters", () => {
      const genie = makeGenie({ name: "translate-to-chinese" });
      render(
        <GenieItem genie={genie} index={0} selected={false} onSelect={onSelect} onHover={onHover} />
      );

      expect(screen.getByText("Translate To Chinese")).toBeInTheDocument();
    });

    it("handles very long description", () => {
      const longDesc = "A".repeat(500);
      const genie = makeGenie({ description: longDesc });
      render(
        <GenieItem genie={genie} index={0} selected={false} onSelect={onSelect} onHover={onHover} />
      );

      expect(screen.getByText(longDesc)).toBeInTheDocument();
    });

    it("handles index 0 correctly", () => {
      const genie = makeGenie();
      const { container } = render(
        <GenieItem genie={genie} index={0} selected={false} onSelect={onSelect} onHover={onHover} />
      );

      const item = container.querySelector(".genie-picker-item");
      expect(item?.getAttribute("data-index")).toBe("0");

      fireEvent.mouseEnter(item!);
      expect(onHover).toHaveBeenCalledWith(0);
    });
  });
});
