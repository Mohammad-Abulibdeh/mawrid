import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n/i18n';
import { StoreProvider } from './state/store';
// Fonts are bundled (not loaded from a CDN) so they keep working offline.
// Each file covers Arabic + Latin via unicode-range; browsers fetch only what a page uses.
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
import '@fontsource/baloo-bhaijaan-2/600.css';
import '@fontsource/baloo-bhaijaan-2/700.css';
import '@fontsource/baloo-bhaijaan-2/800.css';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </I18nProvider>
  </StrictMode>,
);

// Offline support: cache the app shell after the first visit (production only).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* offline support unavailable; app still works online */
    });
  });
}
