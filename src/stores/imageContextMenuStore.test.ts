import { describe, it, expect, beforeEach } from "vitest";
import { useImageContextMenuStore } from "./imageContextMenuStore";

describe("imageContextMenuStore", () => {
  beforeEach(() => {
    useImageContextMenuStore.setState({
      isOpen: false,
      position: null,
      imageSrc: "",
      imageNodePos: -1,
    });
  });

  // ── Default state ──────────────────────────────────────────────────

  it("initializes with default state", () => {
    const state = useImageContextMenuStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.position).toBeNull();
    expect(state.imageSrc).toBe("");
    expect(state.imageNodePos).toBe(-1);
  });

  // ── openMenu ──────────────────────────────────────────────────────

  describe("openMenu", () => {
    it("opens menu with position and image data", () => {
      useImageContextMenuStore.getState().openMenu({
        position: { x: 150, y: 300 },
        imageSrc: "https://example.com/photo.jpg",
        imageNodePos: 42,
      });

      const state = useImageContextMenuStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.position).toEqual({ x: 150, y: 300 });
      expect(state.imageSrc).toBe("https://example.com/photo.jpg");
      expect(state.imageNodePos).toBe(42);
    });

    it("handles position at origin (0, 0)", () => {
      useImageContextMenuStore.getState().openMenu({
        position: { x: 0, y: 0 },
        imageSrc: "img.png",
        imageNodePos: 0,
      });

      const state = useImageContextMenuStore.getState();
      expect(state.position).toEqual({ x: 0, y: 0 });
      expect(state.imageNodePos).toBe(0);
    });

    it("handles local file path as imageSrc", () => {
      useImageContextMenuStore.getState().openMenu({
        position: { x: 10, y: 20 },
        imageSrc: "/Users/test/Documents/image.png",
        imageNodePos: 5,
      });

      expect(useImageContextMenuStore.getState().imageSrc).toBe(
        "/Users/test/Documents/image.png"
      );
    });

    it("handles empty imageSrc", () => {
      useImageContextMenuStore.getState().openMenu({
        position: { x: 10, y: 20 },
        imageSrc: "",
        imageNodePos: 1,
      });

      expect(useImageContextMenuStore.getState().imageSrc).toBe("");
    });

    it("overwrites previous menu state", () => {
      useImageContextMenuStore.getState().openMenu({
        position: { x: 10, y: 20 },
        imageSrc: "first.png",
        imageNodePos: 1,
      });

      useImageContextMenuStore.getState().openMenu({
        position: { x: 500, y: 600 },
        imageSrc: "second.png",
        imageNodePos: 99,
      });

      const state = useImageContextMenuStore.getState();
      expect(state.position).toEqual({ x: 500, y: 600 });
      expect(state.imageSrc).toBe("second.png");
      expect(state.imageNodePos).toBe(99);
    });

    it("handles large nodePos values", () => {
      useImageContextMenuStore.getState().openMenu({
        position: { x: 10, y: 20 },
        imageSrc: "img.png",
        imageNodePos: 999999,
      });

      expect(useImageContextMenuStore.getState().imageNodePos).toBe(999999);
    });
  });

  // ── closeMenu ─────────────────────────────────────────────────────

  describe("closeMenu", () => {
    it("resets all state to initial values", () => {
      useImageContextMenuStore.getState().openMenu({
        position: { x: 100, y: 200 },
        imageSrc: "test.png",
        imageNodePos: 10,
      });

      useImageContextMenuStore.getState().closeMenu();

      const state = useImageContextMenuStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.position).toBeNull();
      expect(state.imageSrc).toBe("");
      expect(state.imageNodePos).toBe(-1);
    });

    it("is idempotent when already closed", () => {
      useImageContextMenuStore.getState().closeMenu();
      const state = useImageContextMenuStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.position).toBeNull();
    });
  });
});
