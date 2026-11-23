/** Brand mark: a water drop with a wave, drawn in the app's ink-and-cream style. */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="3" y="5" width="40" height="40" rx="14" fill="#2a2420" />
      <rect x="1" y="2" width="40" height="40" rx="14" fill="#f2be4a" stroke="#2a2420" strokeWidth="2.5" />
      <path
        d="M21 8.5c4.8 6.2 9.5 11.8 9.5 17.3a9.5 9.5 0 0 1-19 0c0-5.5 4.7-11.1 9.5-17.3z"
        fill="#1f6b66"
        stroke="#2a2420"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M14.5 27c2.2 1.6 4.3 1.6 6.5 0s4.3-1.6 6.5 0" fill="none" stroke="#fffcf5" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** Small inline SVG glyphs for Leaflet map markers (Leaflet needs HTML strings, not React). */
export const MARKER_SVG = {
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"/></svg>',
  unsafe:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v9"/><path d="M12 19h.01"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
} as const;
