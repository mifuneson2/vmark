/**
 * SVG Transformer for PDF Export
 *
 * Transforms SVG elements for WeasyPrint compatibility.
 * Main task: Convert foreignObject elements to text elements.
 */

/**
 * Check if an SVG contains foreignObject elements.
 */
export function hasForeignObject(svg: SVGElement | string): boolean {
  if (typeof svg === "string") {
    return svg.includes("<foreignObject");
  }
  return svg.querySelector("foreignObject") !== null;
}

/**
 * Extract text content from a foreignObject element.
 */
function extractTextFromForeignObject(fo: Element): string[] {
  const lines: string[] = [];

  // Get all text-containing elements
  const textElements = fo.querySelectorAll(
    "p, div, span, li, h1, h2, h3, h4, h5, h6, td, th, label"
  );

  if (textElements.length > 0) {
    textElements.forEach((el) => {
      const text = el.textContent?.trim();
      if (text) {
        lines.push(text);
      }
    });
  } else {
    // Fallback: get all text content
    const text = fo.textContent?.trim();
    if (text) {
      lines.push(text);
    }
  }

  return lines;
}

/**
 * Calculate approximate text position from foreignObject attributes.
 */
function getTextPosition(fo: Element): { x: number; y: number } {
  const x = parseFloat(fo.getAttribute("x") || "0");
  const y = parseFloat(fo.getAttribute("y") || "0");
  const height = parseFloat(fo.getAttribute("height") || "20");

  // Offset y to center text vertically in the foreignObject area
  return { x, y: y + height / 2 };
}

/**
 * Get computed or inherited font styles from foreignObject.
 */
function getFontStyles(fo: Element): {
  fontSize: string;
  fontFamily: string;
  fill: string;
} {
  // Try to get styles from inner elements
  const styledEl = fo.querySelector("[style]") || fo;
  const style = styledEl.getAttribute("style") || "";

  // Extract font-size
  const fontSizeMatch = style.match(/font-size:\s*([^;]+)/);
  const fontSize = fontSizeMatch ? fontSizeMatch[1].trim() : "14px";

  // Extract font-family
  const fontFamilyMatch = style.match(/font-family:\s*([^;]+)/);
  const fontFamily = fontFamilyMatch
    ? fontFamilyMatch[1].trim()
    : "system-ui, sans-serif";

  // Extract color (for fill)
  const colorMatch = style.match(/color:\s*([^;]+)/);
  const fill = colorMatch ? colorMatch[1].trim() : "#333";

  return { fontSize, fontFamily, fill };
}

/**
 * Create SVG text element(s) from foreignObject content.
 */
function createTextElements(
  doc: Document,
  fo: Element,
  svgNs: string
): SVGTextElement[] {
  const lines = extractTextFromForeignObject(fo);
  const { x, y } = getTextPosition(fo);
  const { fontSize, fontFamily, fill } = getFontStyles(fo);
  const lineHeight = parseFloat(fontSize) * 1.4;

  return lines.map((line, index) => {
    const text = doc.createElementNS(svgNs, "text") as SVGTextElement;
    text.setAttribute("x", String(x));
    text.setAttribute("y", String(y + index * lineHeight));
    text.setAttribute("font-size", fontSize);
    text.setAttribute("font-family", fontFamily);
    text.setAttribute("fill", fill);
    text.setAttribute("dominant-baseline", "middle");
    text.textContent = line;
    return text;
  });
}

/**
 * Transform an SVG element for WeasyPrint compatibility.
 *
 * Converts foreignObject elements to text elements since
 * WeasyPrint doesn't support foreignObject.
 */
export function transformSvgForPdf(svg: SVGElement): SVGElement {
  const clone = svg.cloneNode(true) as SVGElement;
  const foreignObjects = clone.querySelectorAll("foreignObject");

  if (foreignObjects.length === 0) {
    return clone;
  }

  const doc = svg.ownerDocument;
  const svgNs = "http://www.w3.org/2000/svg";

  foreignObjects.forEach((fo) => {
    const textElements = createTextElements(doc, fo, svgNs);
    const parent = fo.parentNode;

    if (parent) {
      // Insert text elements before removing foreignObject
      textElements.forEach((text) => {
        parent.insertBefore(text, fo);
      });
      parent.removeChild(fo);
    }
  });

  return clone;
}

/**
 * Transform all SVGs in an HTML document for PDF export.
 *
 * Returns the count of transformed SVGs.
 */
export function transformAllSvgs(doc: Document): number {
  const svgs = doc.querySelectorAll("svg");
  let transformed = 0;

  svgs.forEach((svg) => {
    if (hasForeignObject(svg)) {
      const newSvg = transformSvgForPdf(svg);
      svg.parentNode?.replaceChild(newSvg, svg);
      transformed++;
    }
  });

  return transformed;
}

/**
 * Transform SVG string for PDF export.
 *
 * Use this for inline SVG data or when DOM is not available.
 */
export function transformSvgString(svgString: string): string {
  if (!svgString.includes("<foreignObject")) {
    return svgString;
  }

  // Create a temporary document to parse and transform
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");

  const svg = doc.documentElement as unknown as SVGElement;
  const transformed = transformSvgForPdf(svg);

  const serializer = new XMLSerializer();
  return serializer.serializeToString(transformed);
}
