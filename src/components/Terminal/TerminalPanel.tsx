import { useRef, useEffect, useState, type RefObject } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useTerminal } from "./useTerminal";
import { useTerminalResize } from "./useTerminalResize";
import "./terminal-panel.css";

const NULL_REF: RefObject<HTMLDivElement | null> = { current: null };

export function TerminalPanel() {
  const visible = useUIStore((s) => s.terminalVisible);
  const height = useUIStore((s) => s.terminalHeight);
  const containerRef = useRef<HTMLDivElement>(null);

  // Defer xterm init until first show
  const [activated, setActivated] = useState(false);
  useEffect(() => {
    if (visible && !activated) setActivated(true);
  }, [visible, activated]);

  const { fit } = useTerminal(activated ? containerRef : NULL_REF);

  // Refit when shown or resized
  useEffect(() => {
    if (!visible) return;
    requestAnimationFrame(() => fit());
  }, [visible, height, fit]);

  const handleResize = useTerminalResize(() => {
    requestAnimationFrame(() => fit());
  });

  // Not yet activated — render nothing
  if (!activated) return null;

  // Once activated, always keep the DOM alive (display:none when hidden)
  // so xterm stays attached to its container element.
  return (
    <div
      className="terminal-panel"
      style={{ height, display: visible ? "flex" : "none" }}
    >
      <div className="terminal-resize-handle" onMouseDown={handleResize} />
      <div ref={containerRef} className="terminal-container" />
    </div>
  );
}
