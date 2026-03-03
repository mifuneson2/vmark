import { describe, it, expect, beforeEach } from "vitest";
import {
  useTerminalSessionStore,
  resetTerminalSessionStore,
} from "./terminalSessionStore";

describe("terminalSessionStore", () => {
  beforeEach(() => {
    resetTerminalSessionStore();
  });

  it("starts with empty state", () => {
    const state = useTerminalSessionStore.getState();
    expect(state.sessions).toEqual([]);
    expect(state.activeSessionId).toBeNull();
  });

  it("creates a session and sets it active", () => {
    const session = useTerminalSessionStore.getState().createSession();
    expect(session).not.toBeNull();
    expect(session!.label).toBe("Terminal 1");
    expect(session!.isAlive).toBe(true);

    const state = useTerminalSessionStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.activeSessionId).toBe(session!.id);
  });

  it("limits sessions to 5", () => {
    const store = useTerminalSessionStore.getState();
    for (let i = 0; i < 5; i++) store.createSession();
    expect(useTerminalSessionStore.getState().sessions).toHaveLength(5);

    const sixth = useTerminalSessionStore.getState().createSession();
    expect(sixth).toBeNull();
    expect(useTerminalSessionStore.getState().sessions).toHaveLength(5);
  });

  it("removes a session and switches active", () => {
    const store = useTerminalSessionStore.getState();
    const s1 = store.createSession()!;
    const s2 = useTerminalSessionStore.getState().createSession()!;

    // Active is s2 (last created)
    expect(useTerminalSessionStore.getState().activeSessionId).toBe(s2.id);

    // Remove active session
    useTerminalSessionStore.getState().removeSession(s2.id);
    const state = useTerminalSessionStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.activeSessionId).toBe(s1.id);
  });

  it("sets active session", () => {
    const store = useTerminalSessionStore.getState();
    const s1 = store.createSession()!;
    useTerminalSessionStore.getState().createSession();

    useTerminalSessionStore.getState().setActiveSession(s1.id);
    expect(useTerminalSessionStore.getState().activeSessionId).toBe(s1.id);
  });

  it("marks session as dead", () => {
    const session = useTerminalSessionStore.getState().createSession()!;
    useTerminalSessionStore.getState().markSessionDead(session.id);

    const s = useTerminalSessionStore.getState().sessions[0];
    expect(s.isAlive).toBe(false);
  });

  it("renames a session", () => {
    const session = useTerminalSessionStore.getState().createSession()!;
    useTerminalSessionStore.getState().renameSession(session.id, "My Shell");

    const s = useTerminalSessionStore.getState().sessions[0];
    expect(s.label).toBe("My Shell");
  });

  it("marks session as alive (restores from dead)", () => {
    const session = useTerminalSessionStore.getState().createSession()!;
    useTerminalSessionStore.getState().markSessionDead(session.id);
    expect(useTerminalSessionStore.getState().sessions[0].isAlive).toBe(false);

    useTerminalSessionStore.getState().markSessionAlive(session.id);
    expect(useTerminalSessionStore.getState().sessions[0].isAlive).toBe(true);
  });

  it("generates non-conflicting labels", () => {
    const store = useTerminalSessionStore.getState();
    const s1 = store.createSession()!;
    useTerminalSessionStore.getState().createSession();

    // Remove Terminal 1
    useTerminalSessionStore.getState().removeSession(s1.id);

    // Next session should reuse "Terminal 1"
    const s3 = useTerminalSessionStore.getState().createSession()!;
    expect(s3.label).toBe("Terminal 1");
  });

  it("ignores custom labels when generating next label number", () => {
    // Create session and rename it to a custom (non-Terminal N) label
    const s1 = useTerminalSessionStore.getState().createSession()!;
    useTerminalSessionStore.getState().renameSession(s1.id, "My Shell");

    // Next session should get "Terminal 1" since "My Shell" doesn't occupy a number
    const s2 = useTerminalSessionStore.getState().createSession()!;
    expect(s2.label).toBe("Terminal 1");
  });

  it("does not switch active when removing non-active session", () => {
    const s1 = useTerminalSessionStore.getState().createSession()!;
    const s2 = useTerminalSessionStore.getState().createSession()!;

    // s2 is active; remove s1 (non-active)
    useTerminalSessionStore.getState().removeSession(s1.id);
    const state = useTerminalSessionStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.activeSessionId).toBe(s2.id);
  });

  it("sets activeSessionId to null when removing last session", () => {
    const s1 = useTerminalSessionStore.getState().createSession()!;
    useTerminalSessionStore.getState().removeSession(s1.id);
    expect(useTerminalSessionStore.getState().activeSessionId).toBeNull();
    expect(useTerminalSessionStore.getState().sessions).toHaveLength(0);
  });

  it("ignores setActiveSession with non-existent id", () => {
    const s1 = useTerminalSessionStore.getState().createSession()!;
    useTerminalSessionStore.getState().setActiveSession("non-existent-id");
    expect(useTerminalSessionStore.getState().activeSessionId).toBe(s1.id);
  });

  it("renameSession is a no-op for non-existent id", () => {
    useTerminalSessionStore.getState().createSession();
    const before = useTerminalSessionStore.getState().sessions.slice();
    useTerminalSessionStore.getState().renameSession("non-existent", "New Name");
    expect(useTerminalSessionStore.getState().sessions).toEqual(before);
  });

  it("markSessionDead/Alive is a no-op for non-existent id", () => {
    useTerminalSessionStore.getState().createSession();
    const before = useTerminalSessionStore.getState().sessions.slice();
    useTerminalSessionStore.getState().markSessionDead("non-existent");
    expect(useTerminalSessionStore.getState().sessions).toEqual(before);
    useTerminalSessionStore.getState().markSessionAlive("non-existent");
    expect(useTerminalSessionStore.getState().sessions).toEqual(before);
  });
});
