/**
 * Table of Contents Generator for PDF Export
 *
 * Extracts headings from HTML and generates TOC markup.
 */

export interface TOCItem {
  level: number;
  text: string;
  id: string;
}

export interface TOCOptions {
  /** Title for the TOC section. Default: "Contents" */
  title?: string;
  /** Maximum heading depth to include (1-6). Default: 2 */
  maxDepth?: number;
  /** Minimum heading depth to include (1-6). Default: 1 */
  minDepth?: number;
  /** CSS class for the TOC container */
  className?: string;
}

const DEFAULT_OPTIONS: Required<TOCOptions> = {
  title: "Contents",
  maxDepth: 2,
  minDepth: 1,
  className: "pdf-toc",
};

/**
 * Generate a unique ID from heading text.
 */
function generateId(text: string, index: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .trim();

  return slug ? `heading-${slug}-${index}` : `heading-${index}`;
}

/**
 * Extract TOC items from a document.
 *
 * @param doc - The document to extract headings from
 * @param options - TOC generation options
 * @returns Array of TOC items
 */
export function extractTOC(
  doc: Document,
  options: TOCOptions = {}
): TOCItem[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const items: TOCItem[] = [];

  // Build selector for heading levels
  const levels = [];
  for (let i = opts.minDepth; i <= opts.maxDepth; i++) {
    levels.push(`h${i}`);
  }
  const selector = levels.join(", ");

  // Find all headings in document order
  const headings = doc.querySelectorAll(selector);

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName[1], 10);
    const text = heading.textContent?.trim() || "";

    if (!text) return;

    // Use existing ID or generate one
    let id = heading.id;
    if (!id) {
      id = generateId(text, index);
      heading.id = id;
    }

    items.push({ level, text, id });
  });

  return items;
}

/**
 * Render TOC items as HTML string.
 *
 * @param items - Array of TOC items
 * @param options - TOC generation options
 * @returns HTML string for the TOC
 */
export function renderTOC(
  items: TOCItem[],
  options: TOCOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (items.length === 0) {
    return "";
  }

  const listItems = items
    .map(
      (item) =>
        `<li class="toc-level-${item.level}"><a href="#${item.id}">${escapeHtml(item.text)}</a></li>`
    )
    .join("\n    ");

  return `<nav class="${opts.className}" role="doc-toc">
  <h2 class="toc-title">${escapeHtml(opts.title)}</h2>
  <ol class="toc-list">
    ${listItems}
  </ol>
</nav>`;
}

/**
 * Generate complete TOC HTML from a document.
 *
 * This is a convenience function that combines extraction and rendering.
 *
 * @param doc - The document to generate TOC from
 * @param options - TOC generation options
 * @returns HTML string for the TOC, or empty string if no headings found
 */
export function generateTOC(
  doc: Document,
  options: TOCOptions = {}
): string {
  const items = extractTOC(doc, options);
  return renderTOC(items, options);
}

/**
 * Insert TOC into a document at the beginning of the body.
 *
 * @param doc - The document to insert TOC into
 * @param options - TOC generation options
 * @returns The number of TOC items, or 0 if no headings found
 */
export function insertTOC(
  doc: Document,
  options: TOCOptions = {}
): number {
  const items = extractTOC(doc, options);

  if (items.length === 0) {
    return 0;
  }

  const tocHtml = renderTOC(items, options);
  const tocContainer = doc.createElement("div");
  tocContainer.innerHTML = tocHtml;

  // Find the first child of body that's not a script or style
  const body = doc.body;
  const firstContent = Array.from(body.children).find(
    (el) => !["SCRIPT", "STYLE"].includes(el.tagName)
  );

  if (firstContent) {
    body.insertBefore(tocContainer.firstElementChild!, firstContent);
  } else {
    body.insertBefore(tocContainer.firstElementChild!, body.firstChild);
  }

  return items.length;
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
