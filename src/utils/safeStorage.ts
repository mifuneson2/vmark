/**
 * Safe localStorage wrapper for Zustand persisted stores.
 *
 * Purpose: Catches QuotaExceededError on setItem so one store exhausting
 *   localStorage doesn't silently break all other persisted stores.
 *
 * @module utils/safeStorage
 */

import type { StateStorage } from "zustand/middleware";

let quotaWarned = false;

export function createSafeStorage(): StateStorage {
  return {
    getItem: (name: string) => localStorage.getItem(name),
    setItem: (name: string, value: string) => {
      try {
        localStorage.setItem(name, value);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "QuotaExceededError"
        ) {
          if (!quotaWarned) {
            quotaWarned = true;
            console.error(
              `[Storage] QuotaExceededError for key "${name}" — localStorage is full`
            );
          }
        } else {
          throw error;
        }
      }
    },
    removeItem: (name: string) => localStorage.removeItem(name),
  };
}
