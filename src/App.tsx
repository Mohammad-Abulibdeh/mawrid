import {
  BookOpen,
  CalendarDays,
  Check,
  Droplets,
  FlaskConical,
  House,
  LayoutDashboard,
  Lock,
  Map as MapIcon,
  Menu,
  Settings,
  Tent,
  Truck,
  TriangleExclamationPoint,
  WifiOff,
  X,
  type LucideIcon,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { HashRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Logo } from './components/icons';
import { ToastProvider } from './components/ui';
import { useI18n } from './i18n/i18n';
import type { StringKey } from './i18n/strings';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import DataPage from './pages/DataPage';
import Deliveries from './pages/Deliveries';
import Home from './pages/Home';
import Planner from './pages/Planner';
import Points from './pages/Points';
import Quality from './pages/Quality';
import Sites from './pages/Sites';
import { journeySteps, usePlanMade, type StepId } from './state/journey';
import { useStore } from './state/store';

// Leaflet is the largest dependency; only load it when a map is shown.
const MapPage = lazy(() => import('./pages/MapPage'));

interface NavItem {
  to: string;
  key: StringKey;
  Icon: LucideIcon;
  step?: StepId;
}

const NAV: { group?: StringKey; items: NavItem[] }[] = [
  { items: [{ to: '/', key: 'nav.home', Icon: House }] },
  {
    group: 'nav.group.steps',
    items: [
      { to: '/sites', key: 'nav.sites', Icon: Tent, step: 'sites' },
      { to: '/points', key: 'nav.points', Icon: Droplets, step: 'points' },
      { to: '/deliveries', key: 'nav.deliveries', Icon: Truck, step: 'record' },
      { to: '/quality', key: 'nav.quality', Icon: FlaskConical, step: 'record' },
      { to: '/planner', key: 'nav.planner', Icon: CalendarDays, step: 'plan' },
    ],
  },
  {
    group: 'nav.group.picture',
    items: [
      { to: '/dashboard', key: 'nav.dashboard', Icon: LayoutDashboard },
      { to: '/map', key: 'nav.map', Icon: MapIcon },
    ],
  },
  {
    group: 'nav.group.more',
    items: [
      { to: '/data', key: 'nav.data', Icon: Settings },
      { to: '/about', key: 'nav.about', Icon: BookOpen },
    ],
  },
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
  const { t, lang, setLang, num } = useI18n();
  const { ds, storageError, clearAll, refDate } = useStore();
  const online = useOnline();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const steps = journeySteps(ds, usePlanMade());
  const stepOf = (id: StepId) => steps.find((s) => s.id === id)!;
  const isHome = location.pathname === '/';

  // New page: start at the top and close the mobile menu.
  useEffect(() => {
    window.scrollTo?.(0, 0);
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app">
      <a className="skip" href="#main">
        {t('app.skip')}
      </a>
      <header className="topbar">
        <button className="menu-btn" aria-label={t('app.menu')} aria-expanded={menuOpen} aria-controls="sidebar" onClick={() => setMenuOpen((o) => !o)}>
          {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
        <Link to="/" className="brand" aria-label={t('app.homeLink')}>
          <Logo />
          <span className="brand-text">
            <span className="brand-name">{t('app.name')}</span>
            <span className="brand-tag">{t('app.tagline')}</span>
          </span>
        </Link>
        <div className="topbar-right">
          <span className="asof">
            <CalendarDays size={15} aria-hidden="true" /> {t('app.asOf')} {refDate}
          </span>
          <div className="lang-switch" role="group" aria-label={t('app.langLabel')}>
            <button type="button" lang="ar" aria-pressed={lang === 'ar'} onClick={() => setLang('ar')}>
              العربية
            </button>
            <button type="button" lang="en" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
              English
            </button>
          </div>
        </div>
      </header>
      <div className="body">
        <button className={`scrim ${menuOpen ? 'open' : ''}`} aria-hidden="true" tabIndex={-1} onClick={() => setMenuOpen(false)} />
        <nav id="sidebar" className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label={t('nav.main')}>
          {NAV.map((g, gi) => (
            <div key={gi} role="presentation">
              {g.group && <div className="nav-group">{t(g.group)}</div>}
              {g.items.map(({ to, key, Icon, step }) => {
                const s = step && stepOf(step);
                return (
                  <NavLink key={to} to={to} end={to === '/'}>
                    <span className="nav-icon" aria-hidden="true">
                      <Icon size={17} />
                    </span>
                    {t(key)}
                    {s && (
                      <span
                        className={`nav-step ${s.done ? 'done' : ''}`}
                        role="img"
                        aria-label={s.done ? t('nav.stepDone', { n: num(s.n) }) : t('nav.stepTodo', { n: num(s.n) })}
                      >
                        {s.done ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : num(s.n)}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
          <p className="sidebar-foot">
            <Lock size={14} aria-hidden="true" style={{ marginTop: 3 }} />
            {t('app.private')}
          </p>
        </nav>
        <main id="main">
          {ds.demo && !isHome && (
            <div className="banner banner-demo" role="note">
              <span>
                <TriangleExclamationPoint size={18} aria-hidden="true" /> {t('app.demoBanner')}
              </span>
              <button className="btn btn-sm" onClick={() => window.confirm(t('confirm.clear')) && clearAll()}>
                {t('app.demoBannerAction')}
              </button>
            </div>
          )}
          {!online && (
            <div className="banner banner-offline" role="status">
              <span>
                <WifiOff size={18} aria-hidden="true" /> {t('app.offline')}
              </span>
            </div>
          )}
          {storageError && (
            <div className="banner banner-error" role="alert">
              {t('app.storageError')}
            </div>
          )}
          <ErrorBoundary resetKey={location.pathname}>
            <Suspense fallback={<div className="map-loading">{t('common.loading')}</div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
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
