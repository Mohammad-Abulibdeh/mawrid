import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { todayIso } from '../../src/domain/dates';
import { buildDemoDataset, emptyDataset } from '../../src/domain/seed';
import type { Dataset } from '../../src/domain/types';
import { I18nProvider } from '../../src/i18n/i18n';
import { StoreProvider } from '../../src/state/store';

// Leaflet needs a real layout engine; the map is covered by manual/browser testing.
vi.mock('../../src/components/WaterMap', () => ({ default: () => <div data-testid="map" /> }));

function renderApp(path: string, dataset: Dataset, lang: 'en' | 'ar' = 'en') {
  window.location.hash = `#${path}`;
  return render(
    <I18nProvider lang={lang}>
      <StoreProvider initial={dataset}>
        <App />
      </StoreProvider>
    </I18nProvider>,
  );
}

beforeEach(() => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('dashboard', () => {
  it('shows KPIs, the demo-data warning and alerts for unsafe sources', () => {
    renderApp('/', buildDemoDataset(todayIso()));
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText(/synthetic demonstration data/)).toBeInTheDocument();
    expect(screen.getByText('People in sites')).toBeInTheDocument();
    expect(screen.getByText(/Demo Private Desal Unit 1: unsafe water — E. coli detected/)).toBeInTheDocument();
  });

  it('guides the user when there is no data', () => {
    renderApp('/', emptyDataset());
    expect(screen.getByText(/No sites yet/)).toBeInTheDocument();
  });
});

describe('site → point → delivery workflow', () => {
  it('validates input, then records a delivery that changes the site coverage', async () => {
    const user = userEvent.setup();
    renderApp('/sites', emptyDataset());

    // Add a site — first with invalid data to see validation.
    await user.click(screen.getByRole('button', { name: /Add site/ }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getAllByText('Required').length).toBeGreaterThan(0);

    await user.type(screen.getByLabelText('Name'), 'Test Site');
    await user.selectOptions(screen.getByLabelText('Governorate'), 'Deir al-Balah');
    await user.type(screen.getByLabelText('Latitude'), '48.85');
    await user.type(screen.getByLabelText('Longitude'), '2.35');
    await user.type(screen.getByLabelText('Population'), '1000');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Location must be inside the Gaza Strip')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Latitude'));
    await user.type(screen.getByLabelText('Latitude'), '31.42');
    await user.clear(screen.getByLabelText('Longitude'));
    await user.type(screen.getByLabelText('Longitude'), '34.36');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    const siteRow = screen.getByRole('row', { name: /Test Site/ });
    expect(within(siteRow).getByText(/Critical/)).toBeInTheDocument();

    // Add a water point.
    await user.click(screen.getByRole('link', { name: /Water points/ }));
    await user.click(screen.getByRole('button', { name: /Add water point/ }));
    await user.type(screen.getByLabelText('Name'), 'Test Plant');
    await user.selectOptions(screen.getByLabelText('Type'), 'desalination');
    await user.type(screen.getByLabelText('Latitude'), '31.43');
    await user.type(screen.getByLabelText('Longitude'), '34.36');
    await user.clear(screen.getByLabelText('Available output (litres/day)'));
    await user.type(screen.getByLabelText('Available output (litres/day)'), '500000');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('row', { name: /Test Plant/ })).toBeInTheDocument();

    // Record 7 days × 15,000 L → 15 L/person/day average over the 7-day window = meets target.
    await user.click(screen.getByRole('link', { name: /Deliveries/ }));
    await user.selectOptions(screen.getByLabelText('Water point'), 'Test Plant');
    await user.selectOptions(screen.getByLabelText('Site'), 'Test Site');
    await user.clear(screen.getByLabelText('Litres delivered'));
    await user.type(screen.getByLabelText('Litres delivered'), '105000');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByText('Delivery saved.')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Sites/ }));
    expect(within(screen.getByRole('row', { name: /Test Site/ })).getByText('Meets target')).toBeInTheDocument();
  });
});

describe('quality testing', () => {
  it('flags an unsafe result immediately', async () => {
    const user = userEvent.setup();
    renderApp('/quality', buildDemoDataset(todayIso()));
    await user.selectOptions(screen.getByLabelText('Water point'), 'Demo Municipal Well 2');
    await user.type(screen.getByLabelText('Free residual chlorine (mg/L)'), '0.3');
    await user.type(screen.getByLabelText('E. coli (CFU/100 mL)'), '4');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByText('Test saved: Unsafe.')).toBeInTheDocument();
  });
});

describe('dispatch planner', () => {
  it('produces a trip list and never routes from the unsafe demo source', async () => {
    const user = userEvent.setup();
    renderApp('/planner', buildDemoDataset(todayIso()));
    await user.click(screen.getByRole('button', { name: /Run plan/ }));
    expect(screen.getByRole('heading', { name: 'Trip list' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sources not used' })).toBeInTheDocument();
    const tripTable = screen.getByRole('heading', { name: 'Trip list' }).closest('section')!;
    expect(within(tripTable).queryByText('Demo Private Desal Unit 1')).not.toBeInTheDocument();
    expect(within(tripTable).getAllByText('Demo Desalination Plant A (south)').length).toBeGreaterThan(0);
  });

  it('runs immediately from a shared ?run=1 link', () => {
    renderApp('/planner?run=1', buildDemoDataset(todayIso()));
    expect(screen.getByRole('heading', { name: 'Trip list' })).toBeInTheDocument();
  });

  it('rejects non-numeric parameters', async () => {
    const user = userEvent.setup();
    renderApp('/planner', buildDemoDataset(todayIso()));
    const trucks = screen.getByLabelText('Trucks available');
    await user.clear(trucks);
    await user.type(trucks, 'abc');
    await user.click(screen.getByRole('button', { name: /Run plan/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('Must be a number');
  });
});

describe('Arabic interface', () => {
  it('renders right-to-left with Arabic labels', () => {
    renderApp('/', buildDemoDataset(todayIso()), 'ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByRole('heading', { name: 'لوحة المتابعة' })).toBeInTheDocument();
  });
});
