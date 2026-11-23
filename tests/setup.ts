import '@testing-library/jest-dom/vitest';

// Newer Node versions define their own global `localStorage` (undefined unless started with
// --localstorage-file), which hides jsdom's. Provide a simple in-memory Storage so tests behave
// the same on every Node version.
function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}

let usable = false;
try {
  usable = typeof globalThis.localStorage?.setItem === 'function';
} catch {
  usable = false;
}
if (!usable) {
  const storage = memoryStorage();
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true });
  if (typeof window !== 'undefined') Object.defineProperty(window, 'localStorage', { value: storage, configurable: true, writable: true });
}

// jsdom does not implement scrolling.
if (typeof window !== 'undefined') window.scrollTo = () => {};
