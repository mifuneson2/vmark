/**
 * StatusBarRight tests
 *
 * Tests the formatClientName, formatMcpTooltip pure functions
 * and the StatusBarRight component rendering with various prop combinations.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// --- Mocks ---

const mockHideToast = vi.fn();
const mockFlush = vi.fn();
const mockRequestToggle = vi.fn();

vi.mock("@/stores/imagePasteToastStore", () => ({
  useImagePasteToastStore: {
    getState: () => ({
      isOpen: false,
      hideToast: mockHideToast,
    }),
  },
}));

vi.mock("@/utils/wysiwygFlush", () => ({
  flushActiveWysiwygNow: () => mockFlush(),
}));

vi.mock("@/components/Terminal/terminalGate", () => ({
  requestToggleTerminal: () => mockRequestToggle(),
}));

vi.mock("@/utils/dateUtils", () => ({
  formatExactTime: (ts: number) => `time:${ts}`,
}));

vi.mock("@/stores/shortcutsStore", () => ({
  formatKeyForDisplay: (s: string) => s.toUpperCase(),
}));

vi.mock("./UpdateIndicator", () => ({
  UpdateIndicator: () => <span data-testid="update-indicator" />,
}));

vi.mock("./StatusBarCounts", () => ({
  StatusBarCounts: () => <span data-testid="status-counts" />,
}));

import { formatClientName, formatMcpTooltip, StatusBarRight } from "./StatusBarRight";

// --- Pure function tests ---

describe("formatClientName", () => {
  it("capitalizes regular words", () => {
    expect(formatClientName("claude-code")).toBe("Claude Code");
  });

  it("uppercases known acronyms", () => {
    expect(formatClientName("codex-cli")).toBe("Codex CLI");
    expect(formatClientName("my-ai-tool")).toBe("My AI Tool");
    expect(formatClientName("mcp-api")).toBe("MCP API");
    expect(formatClientName("ide")).toBe("IDE");
  });

  it("handles single word", () => {
    expect(formatClientName("claude")).toBe("Claude");
  });

  it("handles empty string", () => {
    expect(formatClientName("")).toBe("");
  });

  it("handles all-acronym name", () => {
    expect(formatClientName("cli-api-mcp")).toBe("CLI API MCP");
  });
});

describe("formatMcpTooltip", () => {
  it("shows error message when error exists", () => {
    expect(formatMcpTooltip(true, false, "Connection refused", [])).toBe(
      "MCP error: Connection refused"
    );
  });

  it("shows loading message when loading", () => {
    expect(formatMcpTooltip(false, true, null, [])).toBe("MCP starting...");
  });

  it("shows stopped message when not running", () => {
    expect(formatMcpTooltip(false, false, null, [])).toBe(
      "MCP stopped \u00B7 Click to start"
    );
  });

  it("shows no connected when running but no clients", () => {
    expect(formatMcpTooltip(true, false, null, [])).toBe(
      "MCP ready \u00B7 No AI connected"
    );
  });

  it("shows connected clients", () => {
    const clients = [
      { name: "claude-code", version: "1.2.0" },
      { name: "codex-cli", version: null },
    ];
    expect(formatMcpTooltip(true, false, null, clients as any)).toBe(
      "Connected: Claude Code v1.2.0, Codex CLI"
    );
  });

  it("error takes priority over loading", () => {
    expect(formatMcpTooltip(true, true, "fail", [])).toBe("MCP error: fail");
  });

  it("loading takes priority over stopped", () => {
    expect(formatMcpTooltip(false, true, null, [])).toBe("MCP starting...");
  });
});

// --- Component tests ---

const baseProps = {
  aiRunning: false,
  mcpRunning: false,
  mcpLoading: false,
  mcpError: null,
  mcpClients: [],
  openMcpSettings: vi.fn(),
  showAutoSavePaused: false,
  isDivergent: false,
  showAutoSave: false,
  lastAutoSave: null,
  autoSaveTime: "",
  terminalVisible: false,
  terminalShortcut: "Mod-`",
  saveShortcut: "Mod-s",
  sourceMode: false,
  sourceModeShortcut: "Mod-/",
  onToggleSourceMode: vi.fn(),
};

describe("StatusBarRight", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders StatusBarCounts and UpdateIndicator", () => {
    render(<StatusBarRight {...baseProps} />);
    expect(screen.getByTestId("status-counts")).toBeInTheDocument();
    expect(screen.getByTestId("update-indicator")).toBeInTheDocument();
  });

  it("shows auto-save paused warning when showAutoSavePaused is true", () => {
    render(<StatusBarRight {...baseProps} showAutoSavePaused={true} />);
    expect(screen.getByText("Auto-save paused")).toBeInTheDocument();
  });

  it("shows divergent warning when isDivergent and not paused", () => {
    render(<StatusBarRight {...baseProps} isDivergent={true} />);
    expect(screen.getByText("Divergent")).toBeInTheDocument();
  });

  it("hides divergent warning when autoSavePaused takes priority", () => {
    render(
      <StatusBarRight {...baseProps} isDivergent={true} showAutoSavePaused={true} />
    );
    expect(screen.queryByText("Divergent")).not.toBeInTheDocument();
    expect(screen.getByText("Auto-save paused")).toBeInTheDocument();
  });

  it("shows auto-save time when conditions met", () => {
    render(
      <StatusBarRight
        {...baseProps}
        showAutoSave={true}
        lastAutoSave={1234567890}
        autoSaveTime="2s ago"
      />
    );
    expect(screen.getByText("2s ago")).toBeInTheDocument();
  });

  it("hides auto-save when paused", () => {
    render(
      <StatusBarRight
        {...baseProps}
        showAutoSave={true}
        lastAutoSave={123}
        autoSaveTime="1s ago"
        showAutoSavePaused={true}
      />
    );
    expect(screen.queryByText("1s ago")).not.toBeInTheDocument();
  });

  it("shows AI running spinner", () => {
    const { container } = render(<StatusBarRight {...baseProps} aiRunning={true} />);
    expect(container.querySelector(".status-ai-running")).toBeInTheDocument();
  });

  it("hides AI spinner when not running", () => {
    const { container } = render(<StatusBarRight {...baseProps} aiRunning={false} />);
    expect(container.querySelector(".status-ai-running")).not.toBeInTheDocument();
  });

  it("applies connected class when MCP is running", () => {
    const { container } = render(<StatusBarRight {...baseProps} mcpRunning={true} />);
    const btn = container.querySelector(".status-mcp");
    expect(btn?.className).toContain("connected");
  });

  it("applies loading class when MCP is loading", () => {
    const { container } = render(<StatusBarRight {...baseProps} mcpLoading={true} />);
    const btn = container.querySelector(".status-mcp");
    expect(btn?.className).toContain("loading");
  });

  it("applies error class when MCP has error", () => {
    const { container } = render(
      <StatusBarRight {...baseProps} mcpError="fail" />
    );
    const btn = container.querySelector(".status-mcp");
    expect(btn?.className).toContain("error");
  });

  it("calls openMcpSettings when MCP button clicked", () => {
    const openMcpSettings = vi.fn();
    const { container } = render(
      <StatusBarRight {...baseProps} openMcpSettings={openMcpSettings} />
    );
    fireEvent.click(container.querySelector(".status-mcp")!);
    expect(openMcpSettings).toHaveBeenCalled();
  });

  it("calls requestToggleTerminal when terminal button clicked", () => {
    const { container } = render(<StatusBarRight {...baseProps} />);
    fireEvent.click(container.querySelector(".status-terminal")!);
    expect(mockRequestToggle).toHaveBeenCalled();
  });

  it("applies active class to terminal button when visible", () => {
    const { container } = render(
      <StatusBarRight {...baseProps} terminalVisible={true} />
    );
    const btn = container.querySelector(".status-terminal");
    expect(btn?.className).toContain("active");
  });

  it("calls flush and onToggleSourceMode when mode button clicked", () => {
    const onToggle = vi.fn();
    const { container } = render(
      <StatusBarRight {...baseProps} onToggleSourceMode={onToggle} />
    );
    fireEvent.click(container.querySelector(".status-mode")!);
    expect(mockFlush).toHaveBeenCalled();
    expect(onToggle).toHaveBeenCalled();
  });

  it("shows Source Mode title when in source mode", () => {
    const { container } = render(
      <StatusBarRight {...baseProps} sourceMode={true} />
    );
    const btn = container.querySelector(".status-mode");
    expect(btn?.getAttribute("title")).toContain("Source Mode");
  });

  it("shows Rich Text Mode title when not in source mode", () => {
    const { container } = render(
      <StatusBarRight {...baseProps} sourceMode={false} />
    );
    const btn = container.querySelector(".status-mode");
    expect(btn?.getAttribute("title")).toContain("Rich Text Mode");
  });
});
