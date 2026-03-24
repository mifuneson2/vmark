const SEARCH_COUNT_DEBOUNCE_MS = 300;

type CountCallback = (
  content: string,
  query: string,
  caseSensitive: boolean,
  wholeWord: boolean,
  useRegex: boolean
) => void;

export function createDebouncedSearchCounter(callback: CountCallback) {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: Parameters<CountCallback> | null = null;

  return {
    schedule(...args: Parameters<CountCallback>) {
      latestArgs = args;
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        if (latestArgs) callback(...latestArgs);
        timerId = null;
      }, SEARCH_COUNT_DEBOUNCE_MS);
    },
    cancel() {
      if (timerId) clearTimeout(timerId);
      timerId = null;
      latestArgs = null;
    },
  };
}
