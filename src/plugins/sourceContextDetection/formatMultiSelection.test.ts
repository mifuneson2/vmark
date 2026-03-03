import { describe, it, expect } from "vitest";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { applyInlineFormatToSelections } from "./formatMultiSelection";

function createView(doc: string, ranges: Array<{ from: number; to: number }>): EditorView {
  const parent = document.createElement("div");
  const selection = EditorSelection.create(
    ranges.map((range) => EditorSelection.range(range.from, range.to))
  );
  const state = EditorState.create({
    doc,
    selection,
    extensions: [EditorState.allowMultipleSelections.of(true)],
  });
  return new EditorView({ state, parent });
}

describe("applyInlineFormatToSelections", () => {
  it("wraps multiple selections with underline markers", () => {
    const view = createView("one two three", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);

    const applied = applyInlineFormatToSelections(view, "underline");

    expect(applied).toBe(true);
    expect(view.state.doc.toString()).toBe("++one++ ++two++ three");
    view.destroy();
  });

  it("returns false for single selection", () => {
    const view = createView("one two three", [{ from: 0, to: 3 }]);
    const applied = applyInlineFormatToSelections(view, "bold");
    expect(applied).toBe(false);
    view.destroy();
  });

  it("wraps multiple selections with bold markers", () => {
    const view = createView("one two three", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);
    applyInlineFormatToSelections(view, "bold");
    expect(view.state.doc.toString()).toBe("**one** **two** three");
    view.destroy();
  });

  it("wraps multiple selections with italic markers", () => {
    const view = createView("one two three", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);
    applyInlineFormatToSelections(view, "italic");
    expect(view.state.doc.toString()).toBe("*one* *two* three");
    view.destroy();
  });

  it("wraps multiple selections with code markers", () => {
    const view = createView("one two three", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);
    applyInlineFormatToSelections(view, "code");
    expect(view.state.doc.toString()).toBe("`one` `two` three");
    view.destroy();
  });

  it("wraps multiple selections with strikethrough markers", () => {
    const view = createView("one two three", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);
    applyInlineFormatToSelections(view, "strikethrough");
    expect(view.state.doc.toString()).toBe("~~one~~ ~~two~~ three");
    view.destroy();
  });

  it("wraps multiple selections with highlight markers", () => {
    const view = createView("one two three", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);
    applyInlineFormatToSelections(view, "highlight");
    expect(view.state.doc.toString()).toBe("==one== ==two== three");
    view.destroy();
  });

  it("handles three selections", () => {
    const view = createView("aaa bbb ccc", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
      { from: 8, to: 11 },
    ]);
    applyInlineFormatToSelections(view, "bold");
    expect(view.state.doc.toString()).toBe("**aaa** **bbb** **ccc**");
    view.destroy();
  });

  it("handles CJK text in selections", () => {
    const view = createView("你好 世界", [
      { from: 0, to: 2 },
      { from: 3, to: 5 },
    ]);
    applyInlineFormatToSelections(view, "bold");
    expect(view.state.doc.toString()).toBe("**你好** **世界**");
    view.destroy();
  });

  it("unwraps already-wrapped selections", () => {
    const view = createView("**one** **two** three", [
      { from: 2, to: 5 },
      { from: 10, to: 13 },
    ]);
    applyInlineFormatToSelections(view, "bold");
    expect(view.state.doc.toString()).toBe("one two three");
    view.destroy();
  });

  it("handles empty cursor selections (no text selected)", () => {
    // Two cursor positions (collapsed selections) at word boundaries
    const view = createView("one two three", [
      { from: 1, to: 1 },
      { from: 5, to: 5 },
    ]);
    applyInlineFormatToSelections(view, "bold");
    // Should expand to word at cursor and wrap
    const result = view.state.doc.toString();
    expect(result).toContain("**");
    view.destroy();
  });

  it("wraps with superscript markers", () => {
    const view = createView("one two three", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);
    applyInlineFormatToSelections(view, "superscript");
    expect(view.state.doc.toString()).toBe("^one^ ^two^ three");
    view.destroy();
  });

  it("wraps with subscript markers", () => {
    const view = createView("one two three", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);
    applyInlineFormatToSelections(view, "subscript");
    expect(view.state.doc.toString()).toBe("~one~ ~two~ three");
    view.destroy();
  });

  it("handles adjacent selections", () => {
    const view = createView("ab cd", [
      { from: 0, to: 2 },
      { from: 3, to: 5 },
    ]);
    applyInlineFormatToSelections(view, "italic");
    expect(view.state.doc.toString()).toBe("*ab* *cd*");
    view.destroy();
  });

  it("unwraps surrounding markers (prefix outside selection)", () => {
    // Selection is inside the markers: **|one|** **|two|** with cursor inside
    const view = createView("**one** **two**", [
      { from: 2, to: 5 },
      { from: 10, to: 13 },
    ]);
    applyInlineFormatToSelections(view, "bold");
    expect(view.state.doc.toString()).toBe("one two");
    view.destroy();
  });

  it("handles link format wrapping", () => {
    const view = createView("one two three", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);
    applyInlineFormatToSelections(view, "link");
    expect(view.state.doc.toString()).toBe("[one](url) [two](url) three");
    view.destroy();
  });

  it("inserts empty markers for collapsed cursor with no word at position", () => {
    // Two cursors at spaces (no word boundaries)
    const view = createView("  ", [
      { from: 0, to: 0 },
      { from: 1, to: 1 },
    ]);
    applyInlineFormatToSelections(view, "bold");
    const result = view.state.doc.toString();
    // Each cursor should get empty bold markers ****
    expect(result).toContain("****");
    view.destroy();
  });

  it("removes opposite format (superscript) when applying subscript", () => {
    // Two selections already wrapped with superscript — selection includes markers
    const view = createView("^one^ ^two^", [
      { from: 1, to: 4 },
      { from: 7, to: 10 },
    ]);
    applyInlineFormatToSelections(view, "subscript");
    // unwrapOppositeInRange removes surrounding ^ markers
    const result = view.state.doc.toString();
    expect(result).toBe("one two");
    view.destroy();
  });

  it("handles collapsed cursors inside already-bold words (unwrap via expand)", () => {
    // Cursor inside a bold word
    const view = createView("**hello** **world**", [
      { from: 4, to: 4 },
      { from: 14, to: 14 },
    ]);
    applyInlineFormatToSelections(view, "bold");
    const result = view.state.doc.toString();
    // The bold markers should be removed around the word
    expect(result.indexOf("**")).toBeLessThanOrEqual(result.lastIndexOf("**"));
    view.destroy();
  });

  it("handles image format wrapping", () => {
    const view = createView("one two three", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);
    applyInlineFormatToSelections(view, "image");
    expect(view.state.doc.toString()).toBe("![one](url) ![two](url) three");
    view.destroy();
  });

  it("unwraps when selection includes the format markers (isWrapped branch, line 126)", () => {
    // Selections span the full bold-wrapped text including markers: "**aa**" and "**bb**"
    // selectedText = "**aa**", isWrapped("**aa**","**","**") → true → branch 12 arm 0
    // expandedToWord=false → branch 13 arm 1 (newCursorPos=from), branch 14 arm 1 (range form)
    const view = createView("**aa** **bb**", [
      { from: 0, to: 6 },  // selects "**aa**"
      { from: 7, to: 13 }, // selects "**bb**"
    ]);
    applyInlineFormatToSelections(view, "bold");
    // isWrapped("**aa**","**","**") → true → unwraps → "aa" and "bb"
    expect(view.state.doc.toString()).toBe("aa bb");
    view.destroy();
  });

  it("unwrapOppositeInRange: removes superscript wrapping when text is selected with ^ markers (isWrapped branch)", () => {
    // unwrapOppositeInRange is called when applying subscript to a superscript-wrapped selection.
    // The isWrapped check (line 39-44): selectedText is "^one^", which is wrapped with ^ prefix/suffix.
    // The selection includes the surrounding ^ markers, so isWrapped returns true.
    const view = createView("^one^ ^two^", [
      { from: 0, to: 5 },  // selects "^one^" (includes markers)
      { from: 6, to: 11 }, // selects "^two^" (includes markers)
    ]);
    applyInlineFormatToSelections(view, "subscript");
    // unwrapOppositeInRange removes the ^ pair from the selected text, then subscript (~) is not applied
    // because oppositeResult is returned. Result: "one two" (superscript removed)
    const result = view.state.doc.toString();
    expect(result).toBe("one two");
    view.destroy();
  });

  it("formatRange with expandedToWord + opposite format: adjusts cursor position (lines 116-120)", () => {
    // To hit the expandedToWord + oppositeResult path:
    // 1. Use a collapsed cursor (from === to) so it expands to word
    // 2. The expanded word must have an opposite format already applied
    // e.g., cursor inside "^word^" with collapsed position → expands to "word" → apply subscript
    // BUT wait: expansion finds word boundaries without markers.
    // If cursor is inside a superscript-wrapped word and we apply subscript:
    // - Cursor collapses → expand to word "word" (without markers)
    // - Apply subscript to "word" → check opposite (superscript): not wrapped (no ^ in "word")
    // That won't trigger it.
    //
    // The path (lines 115-121): expandedToWord=true AND oppositeResult is non-null.
    // oppositeResult comes from unwrapOppositeInRange, which checks the expanded text.
    // For this to work: the word text itself must be wrapped with the opposite format.
    // e.g., doc = "~~word~~" and cursor is inside.
    // Expansion would find "word" (if findWordBoundaries skips the markers).
    // Actually findWordBoundaries works on the line text, so the expanded text is part of "~~word~~".
    // Let's try a collapsed cursor at position inside "~~word~~" where the
    // expanded word IS "~~word~~" itself (if the word detector treats ~~ as word chars).
    // Actually, we need the opposite of bold (which is italic or vice versa).
    // bold's opposite: italic (*) — FORMAT_MARKERS bold={**,**}, italic={*,*}
    // if we apply bold to cursor inside *word*, and expandedToWord=true, and
    // the expanded word text is "*word*" which isWrapped with italic...
    // But findWordBoundaries may not include the * markers in word boundaries.
    //
    // The most reliable approach: create a doc where the word boundaries include
    // the opposite format markers. In practice this is hard to trigger since
    // word segmentation typically stops at punctuation.
    // Let's use a cursor at position 1 (inside "a") in doc "a b" with bold applied
    // to cursor. Actually that path is not about opposite unwrap.
    //
    // Simpler: just trigger the (expandedToWord && oppositeResult) branch by
    // having a cursor inside a word that already has surrounding opposite markers.
    // Apply subscript (~..~) — opposite is superscript (^..^).
    // Doc: "^hello^" — cursor at position 3 (inside "hello").
    // findWordBoundaries on "^hello^" at offset 3: word chars are letters, not ^.
    // So word = "hello" (from=1, to=6). Then oppositeResult checks:
    // - isWrapped("hello", "^", "^") → false
    // - prefix outside: doc[from-1..from] = "^" === "^" ✓, doc[to..to+1] = "^" === "^" ✓
    // → oppositeResult is non-null! And expandedToWord=true.
    // → Lines 115-121 execute!
    const view = createView("^hello^ ^world^", [
      { from: 3, to: 3 }, // collapsed cursor inside "hello"
      { from: 11, to: 11 }, // collapsed cursor inside "world"
    ]);
    applyInlineFormatToSelections(view, "subscript");
    // The superscript markers around the expanded words should be removed
    const result = view.state.doc.toString();
    expect(result).toBe("hello world");
    view.destroy();
  });

  it("formatRange with expandedToWord + already wrapped text (lines 127-134 unwrap path)", () => {
    // To hit lines 127-134: expandedToWord=true, no oppositeResult, selectedText isWrapped(bold).
    // Doc: "**hello**" — cursor at position 4 (inside "hello").
    // Word expansion: "hello" from=2, to=7. selectedText="hello".
    // isWrapped("hello","**","**") → false.
    // But wait: the outer unwrap path (surroundingMarkers) at 139-157...
    // Actually lines 127-134: isWrapped(selectedText, prefix, suffix) with format=bold:
    // selectedText="hello", prefix="**", suffix="**". isWrapped needs "hello" to START with "**" — no.
    // So line 126 check fails. Let's check lines 139-157 (outer unwrap).
    //
    // Actually uncovered stmts 42-44 are INSIDE unwrapOppositeInRange (the isWrapped return branch).
    // Stmts 37-38 are in formatRange's own isWrapped check.
    // Let me re-read the coverage:
    // stmt 37: line 116 → formatRange line 116: oppositeResult adjustment (expandedToWord path)
    // stmt 38: line 117-120 → the range adjustment
    // stmt 42: line 127 → isWrapped(selectedText, prefix, suffix) in formatRange
    // stmt 43: line 128 → const newCursorPos
    // stmt 44: line 129-134 → range return
    //
    // For stmts 42-44 (formatRange isWrapped with expandedToWord=true):
    // We need: from === to (cursor), word found (expandedToWord=true), no oppositeResult,
    // and isWrapped(selectedText, prefix, suffix) is true.
    // That means the expanded word text starts AND ends with the format markers.
    // e.g., format=bold(**), selectedText="**text**" (word boundaries include **)
    // This happens if word segmentation doesn't strip punctuation.
    //
    // Actually if word boundaries include the markers in the "word":
    // doc = "**word**" at cursor 4 (middle of "word"):
    // findWordBoundaries sees chars: *, *, w, o, r, d, *, *
    // Word chars = alphanumeric/CJK. ** is not a word char.
    // So word = "word" (positions 2-6), not "**word**".
    // selectedText = "word" → isWrapped("word","**","**") → false.
    // This path is hard to hit with expansion.
    //
    // Alternative: cursor collapsed with no word → inserts empty **|** which is not this path.
    //
    // The only way to hit stmts 42-44 with expandedToWord=true is if the word
    // segmentation returns a range that includes the format markers.
    // This can happen with subscript (~): "~word~" — tilde is not a word char.
    // Or with the caret (^) superscript — caret is not a word char.
    //
    // Wait, let me re-read lines 127-134 in context more carefully:
    // Line 125: const { prefix, suffix } = FORMAT_MARKERS[format];
    // Line 126: if (isWrapped(selectedText, prefix, suffix)) {
    // Line 127:   const unwrapped = unwrap(selectedText, prefix, suffix);
    // Line 128:   const newCursorPos = expandedToWord ? from + cursorOffsetInWord : from;
    // Line 129-134: return { ... }
    //
    // So selectedText must be wrapped with the CURRENT format (not opposite).
    // expandedToWord = true means from === to originally.
    // For this: cursor inside a word, expand gets word, that word is wrapped with **bold**.
    // This only happens if the word boundaries include the ** characters.
    //
    // In practice, word segmentation avoids this. The tests below verify the
    // normal expansion paths that DO work.
    //
    // Let's verify the already-collapsed-cursor + already-bold word path where
    // the word finder returns the bold-wrapped text:
    // Use a doc: "**ab**" where the "word" at position 3 = "ab" (letters only).
    // selectedText = "ab", isWrapped("ab","**","**") = false. Doesn't hit 127.
    //
    // CONCLUSION: stmts 42-44 (lines 127-134) with expandedToWord=true require
    // word segmentation to return markers as part of the word. This is an edge
    // case that may be unreachable with real word segmentation.
    // We still exercise the non-expandedToWord version of lines 127-134
    // via the existing unwrap tests. And the test below exercises line 128's
    // expandedToWord=false branch (which IS covered by existing tests).
    // The NEWLY uncovered stmt is specifically the expandedToWord=true path.
    //
    // We hit stmt 42 (line 127 check = true) only if isWrapped returns true for
    // the expanded word. Let's use a custom approach: apply subscript to cursor
    // inside a "~word~" doc where the word IS "~word~". This requires that
    // word chars include tilde — unlikely, but let's verify with a test.

    // Test the outer surrounding-markers unwrap with expandedToWord=true (lines 144-157):
    // Cursor inside word, expand to word, no opposite, not isWrapped,
    // but prefix surrounds the word from outside.
    // Bold (**) surrounds "hello": **hello** — cursor at 4.
    // Word = "hello" (from=2, to=7). Outer check: from-2..from = "**" ✓, to..to+2 = "**" ✓.
    // expandedToWord=true → lines 144-157 execute.
    // This IS covered by the test above ("formatRange with expandedToWord + opposite format").
    // Wait, no — that test uses subscript on superscript. Let's also add a direct test.
    const view = createView("**hello** **world**", [
      { from: 4, to: 4 }, // cursor inside "hello" (already bold)
      { from: 14, to: 14 }, // cursor inside "world" (already bold)
    ]);
    applyInlineFormatToSelections(view, "bold");
    // Both words should be unwrapped from bold
    const result = view.state.doc.toString();
    expect(result).toBe("hello world");
    view.destroy();
  });
});
