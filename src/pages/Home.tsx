import {
  ArrowDown,
  ArrowRight,
  Check,
  Droplets,
  FlaskConical,
  FolderOpen,
  Languages,
  LayoutDashboard,
  Lock,
  Map as MapIcon,
  Sparkles,
  Tent,
  Truck,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui';
import { useI18n } from '../i18n/i18n';
import { journeySteps, nextStep, usePlanMade, type StepId } from '../state/journey';
import { useStore } from '../state/store';

const STEP_ICON: Record<StepId, LucideIcon> = { sites: Tent, points: Droplets, record: FlaskConical, plan: Truck };

/** Hand-drawn style illustration: a water truck on its way to a row of shelters. */
function HeroArt({ label }: { label: string }) {
  const ink = '#2a2420';
  return (
    <svg viewBox="0 0 520 420" role="img" aria-label={label} className="flip-rtl">
      <path
        d="M78 92C142 26 262 18 356 44c92 26 150 96 140 182-10 88-84 156-186 170-104 14-214-18-262-94C0 238 14 158 78 92z"
        fill="#dcedf2"
        stroke={ink}
        strokeWidth="3"
      />
      <circle cx="404" cy="96" r="38" fill="#f2be4a" stroke={ink} strokeWidth="3" />
      <path d="M404 40v-14M454 66l10-10M462 112h14M354 66l-10-10" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      {/* sparkles */}
      <path d="M118 120l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" fill="#fffcf5" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M300 70l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#c3b1e1" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
      {/* ground */}
      <path d="M20 318c60-14 120 10 180-2s110-22 170-8 90 14 130 6" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      {/* tents */}
      <path d="M322 304l40-72 40 72z" fill="#f9ddd2" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M362 232v72M350 304l12-26 12 26" fill="none" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M396 306l34-60 34 60z" fill="#ece4f6" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M430 246v60" stroke={ink} strokeWidth="3" />
      <path d="M440 310l26-46 26 46z" fill="#e2eddb" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      {/* water trail */}
      <path d="M232 238c30-40 70-52 108-40" fill="none" stroke="#1f6b66" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
      <path d="M262 176c7 9 13 16 13 24a13 13 0 0 1-26 0c0-8 6-15 13-24z" fill="#9ccbda" stroke={ink} strokeWidth="2.5" />
      <path d="M318 150c5 7 10 12 10 18a10 10 0 0 1-20 0c0-6 5-11 10-18z" fill="#9ccbda" stroke={ink} strokeWidth="2.5" />
      {/* truck */}
      <g transform="translate(40 214)">
        <rect x="6" y="10" width="148" height="70" rx="34" fill="#1f6b66" stroke={ink} strokeWidth="3" />
        <path d="M30 34c14 8 28 8 42 0s28-8 42 0" fill="none" stroke="#fffcf5" strokeWidth="3" strokeLinecap="round" />
        <path d="M154 30h34c10 0 16 6 20 14l12 22v24h-66z" fill="#f2be4a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
        <path d="M166 40h20l10 18h-30z" fill="#fffcf5" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="0" y="78" width="224" height="16" rx="8" fill="#fffcf5" stroke={ink} strokeWidth="3" />
        <circle cx="48" cy="98" r="16" fill="#5a4f46" stroke={ink} strokeWidth="3" />
        <circle cx="48" cy="98" r="5" fill="#fffcf5" />
        <circle cx="180" cy="98" r="16" fill="#5a4f46" stroke={ink} strokeWidth="3" />
        <circle cx="180" cy="98" r="5" fill="#fffcf5" />
      </g>
      <path d="M22 262h22M12 280h26" stroke={ink} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const { t, num } = useI18n();
  const { ds, resetDemo, clearAll } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const steps = journeySteps(ds, usePlanMade());
  const next = nextStep(steps);
  const done = steps.filter((s) => s.done).length;
  const hasData = ds.sites.length + ds.points.length + ds.deliveries.length + ds.tests.length > 0;

  const loadDemo = () => {
    if (hasData && !window.confirm(t('confirm.reset'))) return;
    resetDemo();
    toast(t('home.loaded'));
  };
  const startEmpty = () => {
    if (hasData && !window.confirm(t('confirm.clear'))) return;
    clearAll();
    toast(t('home.cleared'));
    navigate('/sites');
  };

  return (
    <div className="home">
      {/* 1. Welcome: what this is, and where to start */}
      <section className="hero" aria-labelledby="home-title">
        <div className="hero-text">
          <span className="hello">
            <Sparkles size={16} aria-hidden="true" /> {t('home.hello')}
          </span>
          <h1 id="home-title">
            {t('home.titleA')} <span className="squiggle">{t('home.titleB')}</span>
          </h1>
          <p className="lead">{t('home.lead')}</p>
          <div className="hero-actions">
            <Link className="btn btn-cta" to={next ? next.to : '/dashboard'}>
              {t('home.start')} <ArrowRight className="icon flip-rtl" aria-hidden="true" />
            </Link>
            <a className="btn btn-ghost" href="#how" onClick={(e) => {
              e.preventDefault();
              document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              {t('home.how')} <ArrowDown className="icon" aria-hidden="true" />
            </a>
          </div>
          <p className="next-note">
            {next ? (
              <>
                <span className="step-dot" aria-hidden="true">
                  {num(next.n)}
                </span>
                <span>
                  {t('home.nextNote', { step: '' })}
                  <strong>{t(next.title)}</strong>
                </span>
              </>
            ) : (
              t('home.allDoneNote')
            )}
          </p>
        </div>
        <div className="hero-art">
          <HeroArt label={t('home.art')} />
        </div>
      </section>

      {/* 2. The problem, in plain words */}
      <section aria-labelledby="problem-title">
        <div className="section-head">
          <span className="kicker">{t('home.problem.kicker')}</span>
          <h2 id="problem-title">{t('home.problem.title')}</h2>
          <p>{t('home.problem.text')}</p>
        </div>
        <div className="facts">
          {(['fact1', 'fact2', 'fact3'] as const).map((f) => (
            <div className="fact" key={f}>
              <span className="fact-num">{t(`home.${f}.num`)}</span>
              <p>{t(`home.${f}.text`)}</p>
            </div>
          ))}
        </div>
        <p className="facts-foot">
          <strong>{t('home.solution')}</strong>
          <Link className="small" to="/about">
            {t('home.sources')}
          </Link>
        </p>
      </section>

      {/* 3. The four steps, with live progress */}
      <section id="how" aria-labelledby="steps-title">
        <div className="section-head">
          <span className="kicker">{t('home.steps.kicker')}</span>
          <h2 id="steps-title">{t('home.steps.title')}</h2>
          <p>{t('home.steps.text')}</p>
        </div>
        <div className="steps-progress">
          <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done} aria-label={t('journey.label')}>
            <span style={{ width: `${(100 * done) / steps.length}%` }} />
          </div>
          <strong>{t('journey.count', { a: num(done), b: num(steps.length) })}</strong>
        </div>
        <ol className="step-list">
          {steps.map((s) => {
            const Icon = STEP_ICON[s.id];
            const isNext = next?.id === s.id;
            return (
              <li key={s.id} className={`step-card ${isNext ? 'is-next' : ''} ${s.done ? 'is-done' : ''}`}>
                <div className="step-top">
                  <span className="step-num" aria-hidden="true">
                    {num(s.n)}
                  </span>
                  <span className={`step-state ${s.done ? 'done' : isNext ? 'next' : ''}`}>
                    {s.done && <Check size={13} strokeWidth={3} aria-hidden="true" />}
                    {s.done ? t('step.done') : isNext ? t('step.next') : t('step.todo')}
                  </span>
                </div>
                <h3>
                  <Icon className="icon" size={20} aria-hidden="true" />
                  <span>
                    <span className="sr-only">{t('journey.stepOf', { n: num(s.n), b: num(steps.length) })}: </span>
                    {t(s.title)}
                  </span>
                </h3>
                <p>{t(s.desc)}</p>
                <Link className={`btn btn-sm ${isNext ? 'btn-primary' : ''}`} to={s.to}>
                  {isNext ? t('step.start') : t('step.open')} <ArrowRight className="icon flip-rtl" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ol>
        <div className="after-steps">
          <span>{t('home.after')}</span>
          <Link className="btn btn-sm" to="/dashboard">
            <LayoutDashboard className="icon" aria-hidden="true" /> {t('nav.dashboard')}
          </Link>
          <Link className="btn btn-sm" to="/map">
            <MapIcon className="icon" aria-hidden="true" /> {t('nav.map')}
          </Link>
        </div>
      </section>

      {/* 4. Sample data or own data */}
      <section aria-labelledby="data-title">
        <div className="section-head">
          <span className="kicker">{t('home.data.kicker')}</span>
          <h2 id="data-title">{t('home.data.title')}</h2>
        </div>
        <div className="choice-grid">
          <div className="choice">
            <h3>
              <span className="choice-icon" aria-hidden="true">
                <Sparkles size={22} />
              </span>
              {t('home.demo.title')}
              {ds.demo && <span className="current-chip">{t('home.demo.active')}</span>}
            </h3>
            <p>{t('home.demo.text')}</p>
            <div className="choice-actions">
              {ds.demo ? (
                <Link className="btn" to="/dashboard">
                  {t('home.demo.tour')} <ArrowRight className="icon flip-rtl" aria-hidden="true" />
                </Link>
              ) : (
                <button className="btn" onClick={loadDemo}>
                  {t('home.demo.load')}
                </button>
              )}
            </div>
          </div>
          <div className="choice">
            <h3>
              <span className="choice-icon" aria-hidden="true">
                <FolderOpen size={22} />
              </span>
              {t('home.own.title')}
              {!ds.demo && hasData && <span className="current-chip">{t('home.demo.active')}</span>}
            </h3>
            <p>{t('home.own.text')}</p>
            <div className="choice-actions">
              <button className="btn" onClick={startEmpty}>
                {t('home.own.empty')}
              </button>
              <Link className="btn btn-ghost" to="/data">
                {t('home.own.import')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Reassurance */}
      <section className="trust" aria-label={t('app.private')}>
        <div>
          <Lock className="icon" size={22} aria-hidden="true" />
          <p style={{ margin: 0 }}>
            <strong>{t('home.trust.device')}</strong>
            <span>{t('home.trust.deviceText')}</span>
          </p>
        </div>
        <div>
          <WifiOff className="icon" size={22} aria-hidden="true" />
          <p style={{ margin: 0 }}>
            <strong>{t('home.trust.offline')}</strong>
            <span>{t('home.trust.offlineText')}</span>
          </p>
        </div>
        <div>
          <Languages className="icon" size={22} aria-hidden="true" />
          <p style={{ margin: 0 }}>
            <strong>{t('home.trust.lang')}</strong>
            <span>{t('home.trust.langText')}</span>
          </p>
        </div>
      </section>
    </div>
  );
}
