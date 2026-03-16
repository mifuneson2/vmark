/**
 * Tracks whether we're inside a fenced code block.
 * Used by source-text rules to skip code regions.
 */
export class CodeBlockTracker {
  private inFence = false;
  private fenceChar = "";
  private fenceLen = 0;

  /** Call for each line. Returns true if this line is inside a code block. */
  processLine(line: string): boolean {
    const trimmed = line.replace(/^[ ]{0,3}/, "");
    const match = trimmed.match(/^(`{3,}|~{3,})/);

    if (this.inFence) {
      // Check for closing fence: same char, at least same length, rest of line whitespace only
      if (match && match[1][0] === this.fenceChar && match[1].length >= this.fenceLen) {
        const rest = trimmed.slice(match[1].length);
        if (rest.trim() === "") {
          this.inFence = false;
        }
      }
      return true; // This line is inside the fence
    }

    if (match) {
      this.inFence = true;
      this.fenceChar = match[1][0];
      this.fenceLen = match[1].length;
      return true; // The fence opening line itself
    }

    return false;
  }

  /** Returns true if we're still inside an unclosed fence at the end. */
  isUnclosed(): boolean {
    return this.inFence;
  }

  /** Reset state for reuse. */
  reset(): void {
    this.inFence = false;
    this.fenceChar = "";
    this.fenceLen = 0;
  }
}
