/**
 * Diagram Cleanup Registry
 *
 * Tracks destroy callbacks for diagram containers (panzoom, export buttons,
 * live D3 instances). When ProseMirror removes a widget, the DOM node is
 * detached but document-level listeners from panzoom and export survive.
 *
 * Usage:
 *   registerCleanup(wrapper, panzoomInstance.destroy);
 *   registerCleanup(wrapper, exportInstance.destroy);
 *
 * Then periodically (e.g. in the decoration rebuild):
 *   sweepDetachedContainers();
 */

const registry = new Map<Element, Array<() => void>>();

/** Register a cleanup callback for a container element. */
export function registerCleanup(container: Element, cleanup: () => void): void {
  const arr = registry.get(container);
  if (arr) {
    arr.push(cleanup);
  } else {
    registry.set(container, [cleanup]);
  }
}

/** Run all cleanup callbacks for a specific container and remove it from the registry. */
export function cleanupContainer(container: Element): void {
  const arr = registry.get(container);
  if (!arr) return;
  for (const fn of arr) {
    try { fn(); } catch { /* already destroyed or DOM detached — safe to ignore */ }
  }
  registry.delete(container);
}

/** Dispose all containers whose DOM element has been detached. */
export function sweepDetachedContainers(): void {
  for (const [el, arr] of registry) {
    if (!el.isConnected) {
      for (const fn of arr) {
        try { fn(); } catch { /* safe to ignore */ }
      }
      registry.delete(el);
    }
  }
}
