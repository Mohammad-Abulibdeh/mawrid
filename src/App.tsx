import { lazy, Suspense, useEffect, useState } from 'react';
import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ui';
import { useI18n } from './i18n/i18n';
import type { StringKey } from './i18n/strings';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import DataPage from './pages/DataPage';
import Deliveries from './pages/Deliveries';
import Planner from './pages/Planner';
import Points from './pages/Points';
import Quality from './pages/Quality';
import Sites from './pages/Sites';
import { useStore } from './state/store';

// Leaflet is the largest dependency; only load it when a map is shown.
const MapPage = lazy(() => import('./pages/MapPage'));

const NAV: { to: string; key: StringKey; icon: string }[] = [
  { to: '/', key: 'nav.dashboard', icon: '▦' },
  { to: '/map', key: 'nav.map', icon: '◎' },
  { to: '/planner', key: 'nav.planner', icon: '⇄' },
  { to: '/sites', key: 'nav.sites', icon: '⌂' },
  { to: '/points', key: 'nav.points', icon: '💧' },
  { to: '/deliveries', key: 'nav.deliveries', icon: '⛟' },
  { to: '/quality', key: 'nav.quality', icon: '⚗' },
  { to: '/data', key: 'nav.data', icon: '⚙' },
  { to: '/about', key: 'nav.about', icon: 'ℹ' },
];

function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

function Shell() {
  const { t, lang, setLang } = useI18n();
  const { ds, storageError, clearAll, refDate } = useStore();
  const online = useOnline();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <button className="menu-btn" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
          ☰
        </button>
        <div className="brand">
          <span className="logo" aria-hidden>
            💧
          </span>
          <span className="brand-name">{t('app.name')}</span>
          <span className="brand-tag">{t('app.tagline')}</span>
        </div>
        <div className="topbar-right">
          <span className="asof">
            {t('app.asOf')} {refDate}
          </span>
          <button className="btn btn-sm lang-btn" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} lang={lang === 'ar' ? 'en' : 'ar'}>
            {t('app.lang')}
          </button>
        </div>
      </header>
      <div className="body">
        <nav className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} onClick={() => setMenuOpen(false)}>
              <span className="nav-icon" aria-hidden>
                {n.icon}
              </span>
              {t(n.key)}
            </NavLink>
          ))}
        </nav>
        <main id="main">
          {ds.demo && (
            <div className="banner banner-demo" role="note">
              <span>⚠ {t('app.demoBanner')}</span>
              <button className="btn btn-sm" onClick={() => window.confirm(t('confirm.clear')) && clearAll()}>
                {t('app.demoBannerAction')}
              </button>
            </div>
          )}
          {!online && <div className="banner banner-offline">{t('app.offline')}</div>}
          {storageError && (
            <div className="banner banner-error" role="alert">
              {t('app.storageError')}
            </div>
          )}
          <ErrorBoundary resetKey={location.pathname}>
          <Suspense fallback={<div className="map-loading">{t('common.loading')}</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/sites" element={<Sites />} />
              <Route path="/points" element={<Points />} />
              <Route path="/deliveries" element={<Deliveries />} />
              <Route path="/quality" element={<Quality />} />
              <Route path="/data" element={<DataPage />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<p>{t('notFound')}</p>} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </HashRouter>
  );
}
