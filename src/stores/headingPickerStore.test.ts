import { describe, it, expect, vi, beforeEach } from "vitest";
import { useHeadingPickerStore } from "./headingPickerStore";
import type { HeadingWithId } from "@/utils/headingSlug";

describe("headingPickerStore", () => {
  beforeEach(() => {
    useHeadingPickerStore.getState().closePicker();
  });

  const mockHeadings: HeadingWithId[] = [
    { level: 1, text: "Introduction", id: "introduction", pos: 0 },
    { level: 2, text: "Getting Started", id: "getting-started", pos: 50 },
    { level: 2, text: "Usage", id: "usage", pos: 100 },
  ];

  it("opens picker with headings and callback", () => {
    const callback = vi.fn();
    useHeadingPickerStore.getState().openPicker(mockHeadings, callback);

    const state = useHeadingPickerStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.headings).toEqual(mockHeadings);
    expect(state.onSelect).toBe(callback);
  });

  it("closes picker and resets state", () => {
    const callback = vi.fn();
    useHeadingPickerStore.getState().openPicker(mockHeadings, callback);
    useHeadingPickerStore.getState().closePicker();

    const state = useHeadingPickerStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.headings).toEqual([]);
    expect(state.onSelect).toBeNull();
  });

  it("selectHeading calls callback and closes", () => {
    const callback = vi.fn();
    useHeadingPickerStore.getState().openPicker(mockHeadings, callback);
    useHeadingPickerStore.getState().selectHeading(mockHeadings[1]);

    expect(callback).toHaveBeenCalledWith("getting-started", "Getting Started");
    expect(useHeadingPickerStore.getState().isOpen).toBe(false);
  });

  it("selectHeading resets state even when onSelect is null", () => {
    // Open picker, then manually clear onSelect to simulate edge case
    useHeadingPickerStore.setState({ isOpen: true, headings: mockHeadings, onSelect: null });
    useHeadingPickerStore.getState().selectHeading(mockHeadings[0]);

    const state = useHeadingPickerStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.headings).toEqual([]);
  });

  it("openPicker stores anchorRect and containerBounds from options", () => {
    const callback = vi.fn();
    const anchorRect = { x: 10, y: 20, width: 100, height: 30 };
    const containerBounds = { container: { x: 0, y: 0, width: 800, height: 600 }, viewport: { x: 0, y: 0, width: 1024, height: 768 } };
    useHeadingPickerStore.getState().openPicker(mockHeadings, callback, { anchorRect, containerBounds } as any);

    const state = useHeadingPickerStore.getState();
    expect(state.anchorRect).toEqual(anchorRect);
    expect(state.containerBounds).toEqual(containerBounds);
  });
});
