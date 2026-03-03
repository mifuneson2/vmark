import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock useDocumentContent hook
let mockContent = "";
vi.mock("@/hooks/useDocumentState", () => ({
  useDocumentContent: () => mockContent,
}));

// Mock alfaaz to avoid native module issues in test
vi.mock("alfaaz", () => ({
  countWords: (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  },
}));

import { StatusBarCounts } from "./StatusBarCounts";

beforeEach(() => {
  mockContent = "";
});

describe("StatusBarCounts", () => {
  it("renders 0 words and 0 chars for empty content", () => {
    mockContent = "";
    render(<StatusBarCounts />);
    expect(screen.getByText("0 words")).toBeInTheDocument();
    expect(screen.getByText("0 chars")).toBeInTheDocument();
  });

  it("renders word and char counts for plain text", () => {
    mockContent = "hello world";
    render(<StatusBarCounts />);
    expect(screen.getByText("2 words")).toBeInTheDocument();
    expect(screen.getByText("10 chars")).toBeInTheDocument();
  });

  it("strips markdown before counting", () => {
    mockContent = "# Heading\n\n**bold text**";
    render(<StatusBarCounts />);
    // "Heading" + "bold text" = 3 words
    expect(screen.getByText("3 words")).toBeInTheDocument();
  });

  it("renders correct char count excluding whitespace", () => {
    mockContent = "a b c";
    render(<StatusBarCounts />);
    // 3 non-whitespace chars
    expect(screen.getByText("3 chars")).toBeInTheDocument();
  });

  it("renders spans with status-item class", () => {
    mockContent = "test";
    render(<StatusBarCounts />);
    const wordSpan = screen.getByText(/words/);
    const charSpan = screen.getByText(/chars/);
    expect(wordSpan.className).toBe("status-item");
    expect(charSpan.className).toBe("status-item");
  });

  it("handles whitespace-only content", () => {
    mockContent = "   \n\n   ";
    render(<StatusBarCounts />);
    expect(screen.getByText("0 words")).toBeInTheDocument();
    expect(screen.getByText("0 chars")).toBeInTheDocument();
  });

  it("handles single word content", () => {
    mockContent = "hello";
    render(<StatusBarCounts />);
    expect(screen.getByText("1 words")).toBeInTheDocument();
    expect(screen.getByText("5 chars")).toBeInTheDocument();
  });

  it("strips code blocks before counting", () => {
    mockContent = "before\n```js\nconst x = 1;\n```\nafter";
    render(<StatusBarCounts />);
    // Only "before" and "after" remain
    expect(screen.getByText("2 words")).toBeInTheDocument();
  });

  it("handles markdown links", () => {
    mockContent = "[click here](https://example.com)";
    render(<StatusBarCounts />);
    // "click here" = 2 words
    expect(screen.getByText("2 words")).toBeInTheDocument();
    // "clickhere" = 9 chars
    expect(screen.getByText("9 chars")).toBeInTheDocument();
  });
});
